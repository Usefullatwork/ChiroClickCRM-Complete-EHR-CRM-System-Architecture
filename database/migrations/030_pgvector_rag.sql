-- Migration: 030_pgvector_rag.sql
-- Description: Add pgvector extension and clinical chunks table for RAG
-- Created: 2026-01-29

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- Clinical Chunks Table for RAG
-- =============================================================================

CREATE TABLE IF NOT EXISTS clinical_chunks (
    -- Primary key
    chunk_id BIGSERIAL PRIMARY KEY,

    -- Foreign keys
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Chunk metadata
    visit_date DATE NOT NULL,
    note_type VARCHAR(100) NOT NULL DEFAULT 'clinical_encounter',
    soap_section VARCHAR(50) NOT NULL,
    chunk_index INT NOT NULL DEFAULT 0,

    -- Content
    chunk_text TEXT NOT NULL,
    tokens INT NOT NULL DEFAULT 0,

    -- Position in original document
    start_char INT,
    end_char INT,

    -- Vector embedding (1024 dimensions for e5-multilingual-large)
    embedding vector(1024),

    -- Full-text search (Norwegian)
    tsvector_column tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('norwegian', COALESCE(soap_section, '')), 'A') ||
        setweight(to_tsvector('norwegian', COALESCE(chunk_text, '')), 'B')
    ) STORED,

    -- Metadata JSON
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_soap_section CHECK (
        soap_section IN ('Subjective', 'Objective', 'Assessment', 'Plan', 'Unlabeled')
    ),
    CONSTRAINT valid_note_type CHECK (
        note_type IN ('clinical_encounter', 'discharge_summary', 'progress_note',
                      'referral_letter', 'consultation', 'report')
    )
);

-- =============================================================================
-- Indexes for Fast Retrieval
-- =============================================================================

-- Vector index using HNSW (Hierarchical Navigable Small World)
-- m=16, ef_construction=64 are optimal for ~1M vectors
CREATE INDEX IF NOT EXISTS idx_clinical_chunks_embedding
ON clinical_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Full-text search index for BM25 hybrid search
CREATE INDEX IF NOT EXISTS idx_clinical_chunks_tsvector
ON clinical_chunks
USING GIN (tsvector_column);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_clinical_chunks_patient_date
ON clinical_chunks (patient_id, visit_date DESC);

CREATE INDEX IF NOT EXISTS idx_clinical_chunks_org_date
ON clinical_chunks (organization_id, visit_date DESC);

CREATE INDEX IF NOT EXISTS idx_clinical_chunks_encounter
ON clinical_chunks (encounter_id)
WHERE encounter_id IS NOT NULL;

-- Partial index for recent chunks (faster queries on latest data)
CREATE INDEX IF NOT EXISTS idx_clinical_chunks_recent
ON clinical_chunks (organization_id, visit_date DESC)
WHERE visit_date >= CURRENT_DATE - INTERVAL '90 days';

-- Index on SOAP section for filtering
CREATE INDEX IF NOT EXISTS idx_clinical_chunks_section
ON clinical_chunks (soap_section);

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE clinical_chunks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access chunks from their organization
CREATE POLICY clinical_chunks_org_policy ON clinical_chunks
    FOR ALL
    USING (organization_id = current_tenant_id());

-- =============================================================================
-- Hybrid Search Function
-- =============================================================================

CREATE OR REPLACE FUNCTION hybrid_search_chunks(
    query_embedding vector(1024),
    query_text TEXT,
    p_organization_id UUID,
    p_patient_id UUID DEFAULT NULL,
    p_visit_date_start DATE DEFAULT NULL,
    p_visit_date_end DATE DEFAULT NULL,
    p_soap_sections TEXT[] DEFAULT NULL,
    alpha FLOAT DEFAULT 0.7,  -- 0.7 = 70% vector, 30% keyword
    limit_count INT DEFAULT 5
)
RETURNS TABLE (
    chunk_id BIGINT,
    patient_id UUID,
    visit_date DATE,
    soap_section VARCHAR,
    chunk_text TEXT,
    vector_score FLOAT,
    keyword_score FLOAT,
    hybrid_score FLOAT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH vector_search AS (
        -- Vector similarity search
        SELECT
            c.chunk_id,
            c.patient_id,
            c.visit_date,
            c.soap_section,
            c.chunk_text,
            1 - (c.embedding <-> query_embedding)::FLOAT as v_score,
            NULL::FLOAT as k_score,
            c.metadata
        FROM clinical_chunks c
        WHERE c.organization_id = p_organization_id
            AND (p_patient_id IS NULL OR c.patient_id = p_patient_id)
            AND (p_visit_date_start IS NULL OR c.visit_date >= p_visit_date_start)
            AND (p_visit_date_end IS NULL OR c.visit_date <= p_visit_date_end)
            AND (p_soap_sections IS NULL OR c.soap_section = ANY(p_soap_sections))
            AND c.embedding IS NOT NULL
        ORDER BY c.embedding <-> query_embedding
        LIMIT limit_count * 2
    ),
    keyword_search AS (
        -- BM25 keyword search
        SELECT
            c.chunk_id,
            c.patient_id,
            c.visit_date,
            c.soap_section,
            c.chunk_text,
            NULL::FLOAT as v_score,
            ts_rank(c.tsvector_column, plainto_tsquery('norwegian', query_text))::FLOAT as k_score,
            c.metadata
        FROM clinical_chunks c
        WHERE c.organization_id = p_organization_id
            AND c.tsvector_column @@ plainto_tsquery('norwegian', query_text)
            AND (p_patient_id IS NULL OR c.patient_id = p_patient_id)
            AND (p_visit_date_start IS NULL OR c.visit_date >= p_visit_date_start)
            AND (p_visit_date_end IS NULL OR c.visit_date <= p_visit_date_end)
            AND (p_soap_sections IS NULL OR c.soap_section = ANY(p_soap_sections))
        ORDER BY k_score DESC
        LIMIT limit_count * 2
    ),
    combined AS (
        -- Combine and score
        SELECT DISTINCT ON (COALESCE(v.chunk_id, k.chunk_id))
            COALESCE(v.chunk_id, k.chunk_id) as chunk_id,
            COALESCE(v.patient_id, k.patient_id) as patient_id,
            COALESCE(v.visit_date, k.visit_date) as visit_date,
            COALESCE(v.soap_section, k.soap_section) as soap_section,
            COALESCE(v.chunk_text, k.chunk_text) as chunk_text,
            COALESCE(v.v_score, 0)::FLOAT as vector_score,
            COALESCE(k.k_score, 0)::FLOAT as keyword_score,
            (alpha * COALESCE(v.v_score, 0) + (1 - alpha) * COALESCE(k.k_score, 0))::FLOAT as hybrid_score,
            COALESCE(v.metadata, k.metadata) as metadata
        FROM vector_search v
        FULL OUTER JOIN keyword_search k ON v.chunk_id = k.chunk_id
    )
    SELECT
        combined.chunk_id,
        combined.patient_id,
        combined.visit_date,
        combined.soap_section,
        combined.chunk_text,
        combined.vector_score,
        combined.keyword_score,
        combined.hybrid_score,
        combined.metadata
    FROM combined
    ORDER BY combined.hybrid_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Function to upsert a chunk with embedding
CREATE OR REPLACE FUNCTION upsert_clinical_chunk(
    p_patient_id UUID,
    p_organization_id UUID,
    p_encounter_id UUID,
    p_visit_date DATE,
    p_note_type VARCHAR,
    p_soap_section VARCHAR,
    p_chunk_index INT,
    p_chunk_text TEXT,
    p_tokens INT,
    p_embedding vector(1024),
    p_metadata JSONB DEFAULT '{}'
)
RETURNS BIGINT AS $$
DECLARE
    v_chunk_id BIGINT;
BEGIN
    INSERT INTO clinical_chunks (
        patient_id, organization_id, encounter_id, visit_date,
        note_type, soap_section, chunk_index, chunk_text,
        tokens, embedding, metadata
    ) VALUES (
        p_patient_id, p_organization_id, p_encounter_id, p_visit_date,
        p_note_type, p_soap_section, p_chunk_index, p_chunk_text,
        p_tokens, p_embedding, p_metadata
    )
    ON CONFLICT (chunk_id) DO UPDATE SET
        chunk_text = EXCLUDED.chunk_text,
        tokens = EXCLUDED.tokens,
        embedding = EXCLUDED.embedding,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    RETURNING chunk_id INTO v_chunk_id;

    RETURN v_chunk_id;
END;
$$ LANGUAGE plpgsql;

-- Function to delete all chunks for an encounter
CREATE OR REPLACE FUNCTION delete_encounter_chunks(p_encounter_id UUID)
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM clinical_chunks
    WHERE encounter_id = p_encounter_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Triggers
-- =============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_clinical_chunks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clinical_chunks_updated_at
    BEFORE UPDATE ON clinical_chunks
    FOR EACH ROW
    EXECUTE FUNCTION update_clinical_chunks_timestamp();

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE clinical_chunks IS 'Chunked clinical notes for RAG retrieval with vector embeddings';
COMMENT ON COLUMN clinical_chunks.embedding IS 'Vector embedding from e5-multilingual-large (1024 dimensions)';
COMMENT ON COLUMN clinical_chunks.tsvector_column IS 'Full-text search vector for BM25 hybrid search';
COMMENT ON FUNCTION hybrid_search_chunks IS 'Hybrid search combining vector similarity and BM25 keyword matching';

-- =============================================================================
-- Grants
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON clinical_chunks TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE clinical_chunks_chunk_id_seq TO authenticated;
