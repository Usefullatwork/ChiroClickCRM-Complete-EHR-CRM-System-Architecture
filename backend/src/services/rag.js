/**
 * Clinical RAG (Retrieval Augmented Generation) Service
 *
 * Provides semantic search over clinical notes using:
 * - pgvector for vector similarity search
 * - PostgreSQL full-text search for BM25
 * - Hybrid search combining both approaches
 *
 * Based on CLI-RAG framework for medical documentation.
 */

const { pool } = require('../db');
const { embeddingsService, toPgVector } = require('./embeddings');
const logger = require('../utils/logger');

// SOAP section patterns for parsing
const SOAP_PATTERNS = {
  Subjective: /(?:^|\n)\s*(Subjektiv|Subjective|S:|Anamnese|Sykehistorie|HPI|Hovedklage)/i,
  Objective: /(?:^|\n)\s*(Objektiv|Objective|O:|Undersøkelse|Funn|Exam|VNG)/i,
  Assessment: /(?:^|\n)\s*(Vurdering|Assessment|A:|Diagnose|Impression)/i,
  Plan: /(?:^|\n)\s*(Plan|P:|Behandling|Treatment|Oppfølging)/i,
};

// Chunk configuration per section
const CHUNK_CONFIG = {
  Subjective: { targetTokens: 500, overlapTokens: 50 },
  Objective: { targetTokens: 600, overlapTokens: 75 },
  Assessment: { targetTokens: 400, overlapTokens: 50 },
  Plan: { targetTokens: 300, overlapTokens: 25 },
  Unlabeled: { targetTokens: 500, overlapTokens: 50 },
};

class RAGService {
  constructor() {
    this.avgCharsPerToken = 4; // Approximation for Norwegian text
  }

  /**
   * Parse clinical note into SOAP sections
   */
  parseSOAPStructure(note) {
    const sections = {
      Subjective: [],
      Objective: [],
      Assessment: [],
      Plan: [],
      Unlabeled: [],
    };

    // Find all section headers
    const headerPositions = [];
    for (const [sectionName, pattern] of Object.entries(SOAP_PATTERNS)) {
      const matches = note.matchAll(new RegExp(pattern.source, 'gi'));
      for (const match of matches) {
        headerPositions.push({
          section: sectionName,
          start: match.index,
          headerEnd: match.index + match[0].length,
        });
      }
    }

    // Sort by position
    headerPositions.sort((a, b) => a.start - b.start);

    // Extract text between headers
    for (let i = 0; i < headerPositions.length; i++) {
      const header = headerPositions[i];
      const start = header.headerEnd;
      const end = headerPositions[i + 1]?.start || note.length;
      const text = note.slice(start, end).trim();

      if (text) {
        sections[header.section].push({
          text,
          start,
          end,
          tokens: Math.ceil(text.length / this.avgCharsPerToken),
        });
      }
    }

    // Handle text before first header
    if (headerPositions.length > 0 && headerPositions[0].start > 0) {
      const preamble = note.slice(0, headerPositions[0].start).trim();
      if (preamble) {
        sections.Unlabeled.push({
          text: preamble,
          start: 0,
          end: headerPositions[0].start,
          tokens: Math.ceil(preamble.length / this.avgCharsPerToken),
        });
      }
    }

    // Handle note with no headers
    if (headerPositions.length === 0) {
      sections.Unlabeled.push({
        text: note.trim(),
        start: 0,
        end: note.length,
        tokens: Math.ceil(note.length / this.avgCharsPerToken),
      });
    }

    return sections;
  }

  /**
   * Chunk a section into smaller pieces
   */
  chunkSection(text, targetTokens, overlapTokens) {
    const targetChars = targetTokens * this.avgCharsPerToken;
    const overlapChars = overlapTokens * this.avgCharsPerToken;

    // Split by sentences
    const sentences = text.split(/(?<=[.!?:;\n])\s+/);
    const chunks = [];
    let currentChunk = [];
    let currentLength = 0;

    for (const sentence of sentences) {
      const sentenceLength = sentence.length;

      if (currentLength + sentenceLength > targetChars && currentChunk.length > 0) {
        // Save current chunk
        chunks.push(currentChunk.join(' '));

        // Create overlap from end
        const overlapSentences = [];
        let overlapLength = 0;
        for (let i = currentChunk.length - 1; i >= 0; i--) {
          if (overlapLength + currentChunk[i].length <= overlapChars) {
            overlapSentences.unshift(currentChunk[i]);
            overlapLength += currentChunk[i].length;
          } else {
            break;
          }
        }

        currentChunk = overlapSentences;
        currentLength = overlapLength;
      }

      currentChunk.push(sentence);
      currentLength += sentenceLength;
    }

    // Add final chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks;
  }

  /**
   * Index a clinical encounter for RAG retrieval
   */
  async indexEncounter(encounterId, noteText, patientId, organizationId, visitDate, noteType = 'clinical_encounter') {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Delete existing chunks for this encounter
      await client.query(
        'DELETE FROM clinical_chunks WHERE encounter_id = $1',
        [encounterId]
      );

      // Parse SOAP structure
      const sections = this.parseSOAPStructure(noteText);

      // Process each section
      let chunkIndex = 0;
      const chunks = [];

      for (const [sectionName, sectionItems] of Object.entries(sections)) {
        const config = CHUNK_CONFIG[sectionName];

        for (const item of sectionItems) {
          const textChunks = this.chunkSection(
            item.text,
            config.targetTokens,
            config.overlapTokens
          );

          for (const chunkText of textChunks) {
            // Generate embedding
            const embedding = await embeddingsService.embed(chunkText, 'document');

            // Insert chunk
            const result = await client.query(
              `INSERT INTO clinical_chunks (
                patient_id, organization_id, encounter_id, visit_date,
                note_type, soap_section, chunk_index, chunk_text,
                tokens, embedding, metadata
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              RETURNING chunk_id`,
              [
                patientId,
                organizationId,
                encounterId,
                visitDate,
                noteType,
                sectionName,
                chunkIndex,
                chunkText,
                Math.ceil(chunkText.length / this.avgCharsPerToken),
                toPgVector(embedding),
                JSON.stringify({ sectionIndex: sectionItems.indexOf(item) }),
              ]
            );

            chunks.push({
              chunkId: result.rows[0].chunk_id,
              section: sectionName,
              index: chunkIndex,
            });

            chunkIndex++;
          }
        }
      }

      await client.query('COMMIT');

      logger.info(`Indexed ${chunks.length} chunks for encounter ${encounterId}`);

      return {
        success: true,
        encounterId,
        chunksCreated: chunks.length,
        chunks,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Failed to index encounter: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Search for relevant clinical chunks
   */
  async search(query, options = {}) {
    const {
      organizationId,
      patientId = null,
      visitDateStart = null,
      visitDateEnd = null,
      soapSections = null,
      alpha = 0.7, // 70% vector, 30% keyword
      limit = 5,
    } = options;

    if (!organizationId) {
      throw new Error('organizationId is required');
    }

    // Generate query embedding
    const queryEmbedding = await embeddingsService.embed(query, 'query');

    // Execute hybrid search
    const result = await pool.query(
      `SELECT * FROM hybrid_search_chunks($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        toPgVector(queryEmbedding),
        query,
        organizationId,
        patientId,
        visitDateStart,
        visitDateEnd,
        soapSections,
        alpha,
        limit,
      ]
    );

    return result.rows.map(row => ({
      chunkId: row.chunk_id,
      patientId: row.patient_id,
      visitDate: row.visit_date,
      soapSection: row.soap_section,
      text: row.chunk_text,
      vectorScore: row.vector_score,
      keywordScore: row.keyword_score,
      hybridScore: row.hybrid_score,
      metadata: row.metadata,
    }));
  }

  /**
   * Get similar past cases for a patient
   */
  async getSimilarCases(patientId, currentNote, organizationId, limit = 3) {
    // Parse and embed the current note's assessment section
    const sections = this.parseSOAPStructure(currentNote);
    const assessmentText = sections.Assessment.map(s => s.text).join(' ') ||
      sections.Unlabeled.map(s => s.text).join(' ');

    if (!assessmentText) {
      return [];
    }

    // Search for similar assessments
    const results = await this.search(assessmentText, {
      organizationId,
      patientId,
      soapSections: ['Assessment', 'Objective'],
      alpha: 0.8, // Prioritize semantic similarity
      limit,
    });

    return results;
  }

  /**
   * Augment a prompt with relevant context
   */
  async augmentPrompt(query, context, options = {}) {
    const {
      organizationId,
      patientId = null,
      maxChunks = 3,
      maxContextLength = 2000,
    } = options;

    // Search for relevant chunks
    const chunks = await this.search(query, {
      organizationId,
      patientId,
      limit: maxChunks,
    });

    if (chunks.length === 0) {
      return { prompt: query, context: null, chunks: [] };
    }

    // Build context from chunks
    let contextText = '';
    const usedChunks = [];

    for (const chunk of chunks) {
      const chunkWithHeader = `[${chunk.soapSection}] ${chunk.text}\n\n`;

      if (contextText.length + chunkWithHeader.length <= maxContextLength) {
        contextText += chunkWithHeader;
        usedChunks.push(chunk);
      }
    }

    // Augmented prompt with context
    const augmentedPrompt = `Relevant pasienthistorikk:
---
${contextText}
---

Basert på denne informasjonen, vennligst svar på følgende:
${query}`;

    return {
      prompt: augmentedPrompt,
      context: contextText,
      chunks: usedChunks,
    };
  }

  /**
   * Delete all chunks for an encounter
   */
  async deleteEncounterChunks(encounterId) {
    const result = await pool.query(
      'DELETE FROM clinical_chunks WHERE encounter_id = $1 RETURNING chunk_id',
      [encounterId]
    );

    return {
      deleted: result.rowCount,
      chunkIds: result.rows.map(r => r.chunk_id),
    };
  }

  /**
   * Get indexing statistics
   */
  async getStats(organizationId) {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_chunks,
        COUNT(DISTINCT patient_id) as patients_indexed,
        COUNT(DISTINCT encounter_id) as encounters_indexed,
        SUM(tokens) as total_tokens,
        MIN(created_at) as oldest_chunk,
        MAX(created_at) as newest_chunk,
        soap_section,
        COUNT(*) as section_count
      FROM clinical_chunks
      WHERE organization_id = $1
      GROUP BY soap_section
      ORDER BY section_count DESC`,
      [organizationId]
    );

    const totalChunks = result.rows.reduce((sum, r) => sum + parseInt(r.section_count), 0);
    const sectionBreakdown = result.rows.reduce((acc, r) => {
      acc[r.soap_section] = parseInt(r.section_count);
      return acc;
    }, {});

    return {
      totalChunks,
      patientsIndexed: result.rows[0]?.patients_indexed || 0,
      encountersIndexed: result.rows[0]?.encounters_indexed || 0,
      totalTokens: result.rows[0]?.total_tokens || 0,
      oldestChunk: result.rows[0]?.oldest_chunk,
      newestChunk: result.rows[0]?.newest_chunk,
      sectionBreakdown,
    };
  }

  /**
   * Health check for RAG system
   */
  async healthCheck() {
    try {
      // Check pgvector extension
      const pgvectorCheck = await pool.query(
        "SELECT extname FROM pg_extension WHERE extname = 'vector'"
      );

      // Check embedding service
      const embeddingCheck = await embeddingsService.healthCheck();

      // Check table exists
      const tableCheck = await pool.query(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinical_chunks')"
      );

      return {
        available: pgvectorCheck.rows.length > 0 &&
                   embeddingCheck.available &&
                   tableCheck.rows[0].exists,
        pgvector: pgvectorCheck.rows.length > 0,
        embeddings: embeddingCheck,
        table: tableCheck.rows[0].exists,
      };
    } catch (error) {
      return {
        available: false,
        error: error.message,
      };
    }
  }
}

// Singleton instance
const ragService = new RAGService();

module.exports = {
  RAGService,
  ragService,

  // Convenience exports
  indexEncounter: (...args) => ragService.indexEncounter(...args),
  search: (...args) => ragService.search(...args),
  augmentPrompt: (...args) => ragService.augmentPrompt(...args),
};
