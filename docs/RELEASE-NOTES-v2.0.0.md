# ChiroClickEHR v2.0.0 Release Notes

## Overview

ChiroClickEHR v2.0.0 is the first desktop release of the complete Electronic Health Record system for chiropractic clinics. It runs as a portable Windows application with an embedded PGlite database -- no server setup required.

## Features

### Electronic Health Record (EHR)

- SOAP notes with structured templates, red flag tracking, and ICD-10/ICPC-2 coding
- Clinical encounter workflow: subjective, objective, assessment, plan
- Easy Assessment mode with body chart, spine diagram, and macro matrix
- Anatomical body chart and regional examination panels
- Note quality scoring and compliance scanning
- Treatment plans with progress tracking and outcome measurement

### Patient Management

- Patient registration, search, and detailed chart view
- Patient portal with self-service intake and consent forms
- Kiosk mode for in-clinic check-in (identity verify, contact update)
- VCF export for GDPR-compliant data portability
- CSV and vCard import wizards

### CRM & Communications

- Campaign manager (newsletter, reactivation, birthday, follow-up)
- Referral program with leaderboard and reward tracking
- Workflow builder for automated patient communications
- Communication history and message approval dashboard
- Patient lifecycle tracking

### AI Integration

- Multi-model Ollama routing (SFT+DPO v6 production model at 96% eval accuracy)
- SOAP autocomplete, red flag detection, diagnosis coding suggestions
- AI feedback collection and data curation pipeline for model improvement
- Claude API fallback with budget tracking (daily/monthly caps)
- RAG with pgvector + HNSW index

### Scheduling & Billing

- Appointment scheduler with decision support
- Today's messages and patient flow board
- Financial module with invoicing
- Exercise prescription library with offline sync

### Compliance & Security

- GDPR compliance: erasure, access, portability, consent audit trail (55 tests)
- Full audit logging for all patient data access and mutations
- Role-based access control with organization-level isolation
- Norwegian healthcare regulation compliance

### Internationalization (i18n)

- 18 translation namespaces covering ~70 components
- Norwegian Bokmal (nb-NO) primary language
- Bilingual support for clinical terminology

## Test Coverage

- Backend: 2,059 tests (87 suites)
- Frontend: 974 tests (45 suites)
- E2E: 88 tests (11 Playwright specs)
- CI: 5/5 pipelines green

## Known Limitations

- **Single-user desktop mode**: PGlite embedded database supports one concurrent user. For multi-user deployment, use PostgreSQL with Docker.
- **Unsigned executable**: Windows SmartScreen may warn on first launch. Click "More info" then "Run anyway".
- **Ollama optional**: AI features require Ollama running locally (port 11434). The app works without it but AI suggestions will be unavailable.
- **PGlite WASM**: May crash under heavy parallel operations -- this is a known upstream limitation.

## System Requirements

- Windows 10 or later (64-bit)
- 4 GB RAM minimum (8 GB recommended)
- 500 MB disk space (plus Ollama models if using AI features)
- Screen resolution: 1280x720 minimum

## Installation

1. Download the portable `.exe` from the release
2. Run the executable -- no installation needed
3. On first launch, the setup wizard will guide you through initial configuration
4. (Optional) Install Ollama and pull `chiro-no-sft-dpo-v6` for AI features

## Upgrade from v1.0.0

v2.0.0 includes all v1.x features plus i18n, GDPR compliance improvements, assessment modularity refactor, and AI model upgrades. The database schema is forward-compatible -- existing data will be migrated automatically on first launch.
