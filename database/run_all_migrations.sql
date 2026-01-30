-- ============================================================================
-- ChiroClickCRM Master Migration Runner
-- Run all migrations in order
-- ============================================================================
-- Usage: psql -U postgres -d chiroclickcrm -f database/run_all_migrations.sql
-- ============================================================================

\echo '============================================================'
\echo 'ChiroClickCRM Database Migration Runner'
\echo '============================================================'

-- Set error handling
\set ON_ERROR_STOP on

-- Backend migrations (in numerical order)
\echo ''
\echo '[1/5] Running backend migrations...'

\ir ../backend/migrations/008_clinical_templates.sql
\echo '  - 008_clinical_templates.sql'

\ir ../backend/migrations/009_ai_feedback_system.sql
\echo '  - 009_ai_feedback_system.sql'

\ir ../backend/migrations/010_template_marketplace.sql
\echo '  - 010_template_marketplace.sql'

\ir ../backend/migrations/011_audit_logging.sql
\echo '  - 011_audit_logging.sql'

\ir ../backend/migrations/012_encryption_keys.sql
\echo '  - 012_encryption_keys.sql'

\ir ../backend/migrations/013_clinical_notes_versioning.sql
\echo '  - 013_clinical_notes_versioning.sql'

\ir ../backend/migrations/014_clinical_tests_library.sql
\echo '  - 014_clinical_tests_library.sql'

\ir ../backend/migrations/015_performance_indexes.sql
\echo '  - 015_performance_indexes.sql'

\ir ../backend/migrations/016_jsonb_indexes.sql
\echo '  - 016_jsonb_indexes.sql'

\ir ../backend/migrations/017_template_enhancement.sql
\echo '  - 017_template_enhancement.sql'

\ir ../backend/migrations/018_examination_clusters.sql
\echo '  - 018_examination_clusters.sql'

\ir ../backend/migrations/019_vng_vestibular_module.sql
\echo '  - 019_vng_vestibular_module.sql'

\ir ../backend/migrations/020_clinical_note_versioning.sql
\echo '  - 020_clinical_note_versioning.sql'

\ir ../backend/migrations/021_audit_logging_enhancement.sql
\echo '  - 021_audit_logging_enhancement.sql'

\ir ../backend/migrations/022_performance_indexes.sql
\echo '  - 022_performance_indexes.sql'

\echo ''
\echo '[2/5] Running seed files...'

\ir seeds/01_icpc2_codes.sql
\echo '  - 01_icpc2_codes.sql'

\ir seeds/02_takster_codes.sql
\echo '  - 02_takster_codes.sql'

\ir seeds/03_orthopedic_templates.sql
\echo '  - 03_orthopedic_templates.sql'

\ir seeds/04_clinical_phrases.sql
\echo '  - 04_clinical_phrases.sql'

\ir seeds/05_evidence_based_enhancements.sql
\echo '  - 05_evidence_based_enhancements.sql'

\ir seeds/06_vestibular_neuro_tests.sql
\echo '  - 06_vestibular_neuro_tests.sql'

\echo ''
\echo '============================================================'
\echo 'Migration complete!'
\echo '============================================================'
\echo ''
\echo 'To import patient data, run:'
\echo '  psql -U postgres -d chiroclickcrm -f "path/to/import_patients.sql"'
\echo ''
