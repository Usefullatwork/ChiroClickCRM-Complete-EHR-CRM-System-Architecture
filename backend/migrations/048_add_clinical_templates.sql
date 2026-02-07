-- Clinical Templates System for Orthopedic SOAP Documentation
-- Created: 2025-11-19
-- Purpose: Comprehensive click-to-text template system for chiropractors

-- ============================================================================
-- CLINICAL TEMPLATES STRUCTURE
-- ============================================================================

-- 1. Template Categories (Modules)
CREATE TABLE template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Category identification
  code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'cervical_spine', 'shoulder', 'neuro_cranial'
  name_en VARCHAR(255) NOT NULL,
  name_no VARCHAR(255) NOT NULL,

  -- Category organization
  parent_category_id UUID REFERENCES template_categories(id),
  sort_order INTEGER DEFAULT 0,
  icon VARCHAR(50), -- Icon name for UI
  color VARCHAR(20), -- Color code for UI

  -- Category type
  soap_section VARCHAR(20) CHECK (soap_section IN ('SUBJECTIVE', 'OBJECTIVE', 'ASSESSMENT', 'PLAN', 'ALL')),
  body_region VARCHAR(50), -- 'cervical', 'thoracic', 'lumbar', 'shoulder', 'elbow', 'wrist', 'hip', 'knee', 'ankle'

  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Clinical Templates (Individual template items)
CREATE TABLE clinical_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES template_categories(id) ON DELETE CASCADE,

  -- Template identification
  code VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'cervical_spurling_test'
  name_en VARCHAR(255) NOT NULL,
  name_no VARCHAR(255) NOT NULL,

  -- Template content
  template_type VARCHAR(30) CHECK (template_type IN (
    'TEXT_SNIPPET',      -- Simple text insertion
    'CHECKBOX_LIST',     -- Multiple selection with checkboxes
    'DROPDOWN_SINGLE',   -- Single selection dropdown
    'SCALE_VAS',         -- Visual Analog Scale (0-10)
    'SCALE_CUSTOM',      -- Custom scale
    'STRUCTURED_FORM',   -- Complex structured data entry
    'SPECIAL_TEST',      -- Orthopedic/neurological test
    'PHRASE_BUILDER'     -- Dynamic phrase construction
  )) NOT NULL,

  -- Bilingual content
  content_en TEXT NOT NULL, -- English template text with {{variables}}
  content_no TEXT NOT NULL, -- Norwegian template text with {{variables}}

  -- Additional data for complex templates
  template_data JSONB DEFAULT '{}', -- {options: [], variables: [], scoring: {}, findings: []}

  -- Clinical context
  soap_section VARCHAR(20) CHECK (soap_section IN ('SUBJECTIVE', 'OBJECTIVE', 'ASSESSMENT', 'PLAN')),
  body_region VARCHAR(50),

  -- Template metadata
  keywords TEXT[], -- Search keywords
  related_icpc_codes TEXT[], -- Related diagnosis codes
  related_icd10_codes TEXT[],

  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,

  -- Ordering and display
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Template Phrases (Reusable phrases and terminology)
CREATE TABLE template_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Phrase identification
  code VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50), -- 'observation', 'palpation', 'treatment', 'advice'

  -- Bilingual phrases
  phrase_en TEXT NOT NULL,
  phrase_no TEXT NOT NULL,

  -- Context
  context_tags TEXT[], -- ['pain', 'acute', 'chronic', 'improvement']
  body_region VARCHAR(50),

  -- Variables and placeholders
  variables JSONB DEFAULT '[]', -- [{name: 'side', type: 'select', options: ['left', 'right', 'bilateral']}]

  -- Usage
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Orthopedic & Neurological Tests Library
CREATE TABLE clinical_tests_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Test identification
  code VARCHAR(100) UNIQUE NOT NULL, -- 'spurling_test', 'slr_test'
  test_name_en VARCHAR(255) NOT NULL,
  test_name_no VARCHAR(255) NOT NULL,

  -- Test classification
  test_category VARCHAR(50) CHECK (test_category IN (
    'ORTHOPEDIC',
    'NEUROLOGICAL',
    'VASCULAR',
    'FUNCTIONAL',
    'SPECIAL'
  )),

  -- Clinical context
  body_region VARCHAR(50), -- 'cervical', 'lumbar', 'shoulder', etc.
  system VARCHAR(50), -- 'musculoskeletal', 'nervous', 'vascular'

  -- Test details (bilingual)
  description_en TEXT,
  description_no TEXT,
  procedure_en TEXT, -- How to perform the test
  procedure_no TEXT,

  -- Interpretation
  positive_finding_en TEXT,
  positive_finding_no TEXT,
  negative_finding_en TEXT,
  negative_finding_no TEXT,

  -- Clinical significance
  indicates_conditions TEXT[], -- ['cervical radiculopathy', 'nerve root compression']
  sensitivity DECIMAL(5,2), -- 0.00 to 1.00
  specificity DECIMAL(5,2),

  -- Test result structure
  result_type VARCHAR(30) CHECK (result_type IN ('BINARY', 'GRADED', 'MEASURED', 'DESCRIPTIVE')),
  result_options JSONB DEFAULT '{}', -- {positive: 'Positive', negative: 'Negative', grades: ['1+', '2+', '3+']}

  -- Associated measurements
  measurement_unit VARCHAR(20), -- 'degrees', 'cm', 'seconds'
  normal_range JSONB, -- {min: 0, max: 90, unit: 'degrees'}

  -- References
  reference_citations TEXT[],
  video_url TEXT,
  image_url TEXT,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. User Template Preferences & Customization
CREATE TABLE user_template_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Favorite templates
  favorite_template_ids UUID[], -- Array of template IDs

  -- Frequently used templates (auto-tracked)
  frequently_used JSONB DEFAULT '[]', -- [{template_id: '', usage_count: 0, last_used: ''}]

  -- Custom templates created by user
  custom_templates JSONB DEFAULT '[]',

  -- Preferred language
  preferred_language VARCHAR(5) DEFAULT 'NO', -- 'NO' or 'EN'

  -- UI preferences
  ui_preferences JSONB DEFAULT '{}', -- {show_icons: true, compact_view: false, auto_expand: true}

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, organization_id)
);

-- 6. Template Usage Analytics
CREATE TABLE template_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  template_id UUID REFERENCES clinical_templates(id) ON DELETE CASCADE,

  -- Usage context
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,

  -- Usage details
  used_at TIMESTAMP DEFAULT NOW(),
  soap_section VARCHAR(20),
  template_content_used TEXT,

  -- Modifications made to template
  was_modified BOOLEAN DEFAULT false,
  modified_content TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Template Categories
CREATE INDEX idx_template_categories_org ON template_categories(organization_id);
CREATE INDEX idx_template_categories_parent ON template_categories(parent_category_id);
CREATE INDEX idx_template_categories_soap ON template_categories(soap_section);
CREATE INDEX idx_template_categories_region ON template_categories(body_region);

-- Clinical Templates
CREATE INDEX idx_clinical_templates_org ON clinical_templates(organization_id);
CREATE INDEX idx_clinical_templates_category ON clinical_templates(category_id);
CREATE INDEX idx_clinical_templates_soap ON clinical_templates(soap_section);
CREATE INDEX idx_clinical_templates_region ON clinical_templates(body_region);
CREATE INDEX idx_clinical_templates_type ON clinical_templates(template_type);
CREATE INDEX idx_clinical_templates_keywords ON clinical_templates USING GIN(keywords);
CREATE INDEX idx_clinical_templates_favorite ON clinical_templates(is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_clinical_templates_usage ON clinical_templates(usage_count DESC);

-- Template Phrases
CREATE INDEX idx_template_phrases_org ON template_phrases(organization_id);
CREATE INDEX idx_template_phrases_category ON template_phrases(category);
CREATE INDEX idx_template_phrases_tags ON template_phrases USING GIN(context_tags);
CREATE INDEX idx_template_phrases_region ON template_phrases(body_region);

-- Clinical Tests Library
CREATE INDEX idx_clinical_tests_category ON clinical_tests_library(test_category);
CREATE INDEX idx_clinical_tests_region ON clinical_tests_library(body_region);
CREATE INDEX idx_clinical_tests_system ON clinical_tests_library(system);
CREATE INDEX idx_clinical_tests_conditions ON clinical_tests_library USING GIN(indicates_conditions);

-- User Template Preferences
CREATE INDEX idx_user_template_prefs_user ON user_template_preferences(user_id);
CREATE INDEX idx_user_template_prefs_org ON user_template_preferences(organization_id);

-- Template Usage Analytics
CREATE INDEX idx_template_usage_org ON template_usage_analytics(organization_id);
CREATE INDEX idx_template_usage_user ON template_usage_analytics(user_id);
CREATE INDEX idx_template_usage_template ON template_usage_analytics(template_id);
CREATE INDEX idx_template_usage_date ON template_usage_analytics(used_at);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE template_categories IS 'Hierarchical categorization of clinical templates by body region, exam type, and SOAP section';
COMMENT ON TABLE clinical_templates IS 'Individual clinical documentation templates with bilingual support and various input types';
COMMENT ON TABLE template_phrases IS 'Reusable clinical phrases and terminology with variable substitution';
COMMENT ON TABLE clinical_tests_library IS 'Comprehensive library of orthopedic and neurological tests with standardized documentation';
COMMENT ON TABLE user_template_preferences IS 'User-specific template favorites, frequently used items, and UI preferences';
COMMENT ON TABLE template_usage_analytics IS 'Analytics tracking for template usage patterns and optimization';
