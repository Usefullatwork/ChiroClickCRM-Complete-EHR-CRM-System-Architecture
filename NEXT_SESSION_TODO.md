# Next Session TODO - CRM Implementation

## Completed (2026-01-21)

### Multi-Model AI System Implemented

**IMPORTANT: USB Drive must be NTFS or exFAT (not FAT32) for AI models >4GB**

#### AI Models Created
| Model | Base | Size | Purpose | File |
|-------|------|------|---------|------|
| `chiro-no` | Mistral 7B | ~4GB | Default/balanced | `ai-training/Modelfile` |
| `chiro-fast` | Llama 3.2 3B | ~2GB | Quick autocomplete | `ai-training/Modelfile-fast` |
| `chiro-norwegian` | Viking 7B | ~4GB | Norwegian language | `ai-training/Modelfile-norwegian` |
| `chiro-medical` | MedGemma 4B | ~3GB | Clinical reasoning | `ai-training/Modelfile-medical` |

#### Task Routing (backend/src/services/ai.js)
```javascript
const TASK_MODEL_MAP = {
  // Norwegian → chiro-norwegian (Viking 7B)
  spell_check: 'norwegian',
  soap_norwegian: 'norwegian',
  sms_generation: 'norwegian',

  // Medical → chiro-medical (MedGemma 4B)
  diagnosis: 'medical',
  red_flags: 'medical',
  clinical_reasoning: 'medical',

  // Fast → chiro-fast (Llama 3.2 3B)
  quick_suggestion: 'fast',
  autocomplete: 'fast',

  // Default → chiro-no (Mistral 7B)
  general: 'default',
  clinical_summary: 'default'
};
```

#### Files Created/Modified
| File | Action | Description |
|------|--------|-------------|
| `ai-training/Modelfile` | Modified | FROM mistral:7b (was llama3.2) |
| `ai-training/Modelfile-fast` | Created | Llama 3.2 3B base |
| `ai-training/Modelfile-norwegian` | Created | Viking 7B base |
| `ai-training/Modelfile-medical` | Created | MedGemma 4B base |
| `ai-training/build-model.bat` | Modified | Builds all 4 models |
| `backend/src/services/ai.js` | Modified | Multi-model routing |
| `backend/.env.example` | Modified | Multi-model config |
| `START-CHIROCLICK.bat` | Modified | Multi-model detection |

#### Documentation Updated
- `README.md` - AI Multi-Model System section
- `PORTABLE_SETUP.md` - Multi-model setup guide
- `TRAINING_GUIDE.md` - Multi-model training instructions
- `ehr-templates/AI-TRAINING-RECOMMENDATIONS.md` - Architecture section
- `training_data/README.md` - Multi-model usage

#### Environment Variables (.env)
```env
AI_PROVIDER=ollama
AI_MODEL=chiro-no                    # Default model
AI_MODEL_FAST=chiro-fast             # Quick tasks
AI_MODEL_NORWEGIAN=chiro-norwegian   # Norwegian language
AI_MODEL_MEDICAL=chiro-medical       # Clinical reasoning
OLLAMA_BASE_URL=http://localhost:11434
```

#### Build All Models
```batch
cd ai-training
build-model.bat
```

#### Test Models
```batch
ollama run chiro-norwegian "Skriv subjektiv for nakkesmerter"
ollama run chiro-medical "Vurder røde flagg: korsryggsmerter med vekttap"
ollama run chiro-fast "Forslag til behandling"
ollama run chiro-no "Generer SOAP-notat"
```

#### Verify Models
```batch
ollama list | findstr chiro
```

#### Total Disk Space Required
- Base models: ~13GB
- Custom models: ~0.5GB (configs only, share base weights)
- **Total: ~14GB**

---

## Completed (2026-01-16)

### Training Data Sources Found:
1. **MIMIC-IV Dataset** - 2M+ clinical notes from ICU patients (PhysioNet)
2. **Norwegian ICPC-2** - 6390 diagnosis codes with Norwegian synonyms (ehelse.no)
3. **SNOMED CT Norway** - 450,000+ medical concepts in Norwegian
4. **FinnKode** - Download all Norwegian health codes to Excel
5. **Chiropractic SOAP Templates** - NYCC, TextExpander, ChiroTouch guides
6. **Orthopedic Tests Flashcards** - Quizlet OSCE clinical tests

## Completed (2026-01-05)

### Full CRM Suite Created:
1. **Database Migration** - `database/migrations/010_crm_full_features.sql`
2. **CRM Hub Page** - `frontend/src/pages/CRM.jsx`
3. **Lead Management** - Kanban pipeline with scoring
4. **Patient Lifecycle** - Segmentation system
5. **Referral Program** - Track & reward referrals
6. **Survey Manager** - NPS surveys
7. **Communication History** - All patient comms logged
8. **Campaign Manager** - Email/SMS analytics
9. **Workflow Builder** - Automated workflows
10. **Retention Dashboard** - Cohort & churn analysis
11. **CRM Settings** - Check-in frequency (30 days), scheduled dates
12. **Exercise Templates** - Premade emails with PDF attachments

### Backend API Routes:
13. **CRM Controller** - `backend/src/controllers/crm.js`
14. **CRM Routes** - `backend/src/routes/crm.js`
15. **CRM Service** - `backend/src/services/crm.js`
16. **Frontend API** - `frontend/src/services/api.js` (crmAPI added)

### Frontend Integration:
17. **App.jsx** - CRM route added (`/crm`)
18. **DashboardLayout.jsx** - CRM in sidebar navigation
19. **CRM.jsx** - Connected to backend API with fallback mock data

---

## TODO Next Session

### 1. Run Database Migration
```bash
cd backend
npm run migrate
```

### 2. Start Backend Server
```bash
cd backend
npm run dev
```

### 3. Test API Endpoints
- Test with Postman or curl
- Verify auth middleware works

### 4. Connect Remaining Components
| Component | API Method | Status |
|-----------|------------|--------|
| LeadManagement.jsx | crmAPI.getLeads() | Pending |
| PatientLifecycle.jsx | crmAPI.getPatientsByLifecycle() | Pending |
| ReferralProgram.jsx | crmAPI.getReferrals() | Pending |
| SurveyManager.jsx | crmAPI.getSurveys() | Pending |
| CampaignManager.jsx | crmAPI.getCampaigns() | Pending |
| WorkflowBuilder.jsx | crmAPI.getWorkflows() | Pending |
| RetentionDashboard.jsx | crmAPI.getRetentionDashboard() | Pending |
| WaitlistManager.jsx | crmAPI.getWaitlist() | Pending |
| CRMSettings.jsx | crmAPI.getSettings() | Pending |

### 5. Integration Points
- Link patient profiles to CRM lifecycle
- Connect appointments to workflow triggers
- Sync exercise templates with treatment notes

---

## Training Data Sources

### Medical Clinical Notes Datasets
| Source | Description | URL |
|--------|-------------|-----|
| MIMIC-IV | 2M+ de-identified clinical notes (2008-2019) | https://physionet.org/content/?topic=clinical+notes |
| MIMIC Code Repo | Community tools for processing clinical notes | https://github.com/MIT-LCP/mimic-code |
| Clinical Data Sources | Curated list of open healthcare datasets | https://github.com/EpistasisLab/ClinicalDataSources |

### Norwegian Healthcare Terminology
| Source | Description | URL |
|--------|-------------|-----|
| ICPC-2 (Norwegian) | 6390 primary care diagnosis codes | https://www.ehelse.no/kodeverk-og-terminologi/ICPC-2 |
| FinnKode | Search & download Norwegian health codes | https://finnkode.helsedirektoratet.no |
| SNOMED CT Norway | 450,000+ medical concepts | https://www.ehelse.no/kodeverk-og-terminologi/SNOMED-CT |
| Norwegian NER Dataset | Medical entity recognition research | https://ar5iv.labs.arxiv.org/html/2004.02509 |
| ICPC-2 Kodekort PDF | Quick reference card | https://www.optikerne.no/wp-content/uploads/2023/08/ICPC-2-kodekort-2004.pdf |

### Chiropractic SOAP Templates & Phrases
| Source | Description | URL |
|--------|-------------|-----|
| NYCC SOAP Guide | Official SOAP documentation guide | https://chiro.org/LINKS/SOAP_Notes.shtml |
| SOAP Note AI | Chiropractic SOAP examples | https://www.soapnoteai.com/soap-note-guides-and-example/chiropractor/ |
| TextExpander | 2025 chiropractic SOAP templates | https://textexpander.com/templates/chiropractic-soap-notes |
| ChiroTouch Checklist | PART documentation method | https://www.chirotouch.com/article/chiropractic-soap-notes-checklist |
| Terminology PDF | Chiropractic terms reference | http://www.lakesidechiro.com.au/assets/users/chiro/253/uploads/docs/2015/12/Chiropractic%20Terminology%20List.pdf |
| Orthopedic Tests | OSCE clinical tests flashcards | https://quizlet.com/531818390/osce-orthopedic-clinical-tests-chiropractic-flash-cards/ |

### Key ICPC-2 Codes for Chiropractic (Chapter L)
```
L01 - Nakke symptomer/plager
L02 - Rygg symptomer/plager
L03 - Korsrygg symptomer/plager
L83 - Nakkesyndrom
L84 - Ryggsyndrom uten utstråling
L86 - Ryggsyndrom med utstråling (radikulopati)
L87 - Bursitt/tendinitt/synovitt
L92 - Skulder syndrom
L99 - Muskel-skjelett sykdom IKA
```

---

## API Endpoints Available

### Leads
- `GET /api/v1/crm/leads` - List leads with filters
- `GET /api/v1/crm/leads/:id` - Get lead details
- `POST /api/v1/crm/leads` - Create lead
- `PUT /api/v1/crm/leads/:id` - Update lead
- `POST /api/v1/crm/leads/:id/convert` - Convert to patient
- `GET /api/v1/crm/leads/pipeline` - Pipeline stats

### Patient Lifecycle
- `GET /api/v1/crm/lifecycle` - Patients by lifecycle stage
- `GET /api/v1/crm/lifecycle/stats` - Lifecycle statistics
- `PUT /api/v1/crm/lifecycle/:patientId` - Update lifecycle

### Referrals
- `GET /api/v1/crm/referrals` - List referrals
- `POST /api/v1/crm/referrals` - Create referral
- `PUT /api/v1/crm/referrals/:id` - Update referral
- `GET /api/v1/crm/referrals/stats` - Referral stats

### Surveys & NPS
- `GET /api/v1/crm/surveys` - List surveys
- `POST /api/v1/crm/surveys` - Create survey
- `GET /api/v1/crm/surveys/:id/responses` - Survey responses
- `GET /api/v1/crm/surveys/nps/stats` - NPS statistics

### Communications
- `GET /api/v1/crm/communications` - Communication history
- `POST /api/v1/crm/communications` - Log communication

### Campaigns
- `GET /api/v1/crm/campaigns` - List campaigns
- `GET /api/v1/crm/campaigns/:id` - Campaign details
- `POST /api/v1/crm/campaigns` - Create campaign
- `PUT /api/v1/crm/campaigns/:id` - Update campaign
- `POST /api/v1/crm/campaigns/:id/launch` - Launch campaign
- `GET /api/v1/crm/campaigns/:id/stats` - Campaign stats

### Workflows
- `GET /api/v1/crm/workflows` - List workflows
- `GET /api/v1/crm/workflows/:id` - Workflow details
- `POST /api/v1/crm/workflows` - Create workflow
- `PUT /api/v1/crm/workflows/:id` - Update workflow
- `POST /api/v1/crm/workflows/:id/toggle` - Toggle active

### Retention
- `GET /api/v1/crm/retention` - Retention dashboard
- `GET /api/v1/crm/retention/churn` - Churn analysis
- `GET /api/v1/crm/retention/cohorts` - Cohort retention

### Waitlist
- `GET /api/v1/crm/waitlist` - Get waitlist
- `POST /api/v1/crm/waitlist` - Add to waitlist
- `PUT /api/v1/crm/waitlist/:id` - Update entry
- `POST /api/v1/crm/waitlist/notify` - Notify patients

### Settings & Overview
- `GET /api/v1/crm/overview` - Dashboard overview
- `GET /api/v1/crm/settings` - CRM settings
- `PUT /api/v1/crm/settings` - Update settings

---

## Quick Start Commands

```bash
# Frontend
cd D:\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\frontend
npm run dev

# Backend (in separate terminal)
cd D:\ChiroClickCRM-Complete-EHR-CRM-System-Architecture\backend
npm run dev

# Open CRM
start http://localhost:5173/crm
```

---

## Files Created/Modified

### New Files (2026-01-05):
- backend/src/controllers/crm.js
- backend/src/routes/crm.js
- backend/src/services/crm.js

### Modified Files (2026-01-05):
- backend/src/server.js (added CRM routes)
- frontend/src/App.jsx (added CRM route)
- frontend/src/components/layouts/DashboardLayout.jsx (added CRM nav)
- frontend/src/services/api.js (added crmAPI)
- frontend/src/pages/CRM.jsx (connected to API)
