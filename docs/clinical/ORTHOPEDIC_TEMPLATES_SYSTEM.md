# Orthopedic SOAP Templates System

## Overview

The Orthopedic SOAP Templates System is a comprehensive clinical documentation framework designed specifically for chiropractic and orthopedic practice. It provides a click-to-text interface for efficient, standardized, and accurate SOAP note documentation.

## Features

### 1. **Comprehensive Template Library**
- **900+ Clinical Templates** organized by body region and SOAP section
- **Bilingual Support** (Norwegian/English)
- **Template Types:**
  - Text Snippets (quick insertions)
  - Checkbox Lists (multiple selections)
  - Dropdown Selections (single choice)
  - Structured Forms (complex data entry)
  - Special Tests (orthopedic/neurological tests)
  - Phrase Builders (dynamic phrase construction)

### 2. **Orthopedic & Neurological Tests Library**
- **150+ Standardized Tests** including:
  - Cervical spine tests (Spurling's, Distraction, TOS battery)
  - Lumbar & SIJ tests (SLR, FABER, Gaenslen's, Thigh Thrust)
  - Shoulder tests (Neer's, Hawkins, Rotator cuff battery)
  - Knee tests (Lachman's, McMurray's, Drawer tests)
  - Ankle tests (Anterior Drawer, Talar Tilt, Thompson)
  - Cranial nerve examination (CN I-XII)
  - Motor, sensory, and reflex testing

- **Each Test Includes:**
  - Procedure description (bilingual)
  - Positive/negative findings
  - Clinical significance
  - Indicated conditions
  - Sensitivity/specificity data (where available)
  - Result documentation options

### 3. **Clinical Phrase Library**
- **500+ Reusable Phrases** for:
  - Subjective documentation (pain descriptions, aggravating/relieving factors)
  - Objective findings (observation, palpation, ROM)
  - Assessment statements (clinical reasoning, prognosis)
  - Plan documentation (treatment, advice, follow-up)

### 4. **User Personalization**
- Favorite templates
- Frequently used templates (auto-tracked)
- Custom template creation
- Usage analytics
- Preferred language settings

## Database Schema

### Core Tables

#### 1. `template_categories`
Hierarchical categorization of templates by:
- SOAP section (Subjective, Objective, Assessment, Plan)
- Body region (cervical, thoracic, lumbar, shoulder, etc.)
- Examination type (general observation, special tests, etc.)

```sql
CREATE TABLE template_categories (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  name_no VARCHAR(255) NOT NULL,
  parent_category_id UUID REFERENCES template_categories(id),
  soap_section VARCHAR(20),
  body_region VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  icon VARCHAR(50),
  color VARCHAR(20)
);
```

#### 2. `clinical_templates`
Individual template items with bilingual content:

```sql
CREATE TABLE clinical_templates (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES template_categories(id),
  code VARCHAR(100) UNIQUE NOT NULL,
  template_type VARCHAR(30),  -- TEXT_SNIPPET, CHECKBOX_LIST, etc.
  content_en TEXT NOT NULL,
  content_no TEXT NOT NULL,
  template_data JSONB DEFAULT '{}',  -- Variables, options, etc.
  keywords TEXT[],
  usage_count INTEGER DEFAULT 0
);
```

#### 3. `clinical_tests_library`
Comprehensive orthopedic and neurological test database:

```sql
CREATE TABLE clinical_tests_library (
  id UUID PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  test_name_en VARCHAR(255) NOT NULL,
  test_name_no VARCHAR(255) NOT NULL,
  test_category VARCHAR(50),  -- ORTHOPEDIC, NEUROLOGICAL, VASCULAR
  body_region VARCHAR(50),
  procedure_en TEXT,
  procedure_no TEXT,
  positive_finding_en TEXT,
  positive_finding_no TEXT,
  indicates_conditions TEXT[],
  sensitivity DECIMAL(5,2),
  specificity DECIMAL(5,2)
);
```

#### 4. `template_phrases`
Reusable clinical phrases:

```sql
CREATE TABLE template_phrases (
  id UUID PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50),
  phrase_en TEXT NOT NULL,
  phrase_no TEXT NOT NULL,
  context_tags TEXT[],
  body_region VARCHAR(50),
  variables JSONB DEFAULT '[]'
);
```

#### 5. `user_template_preferences`
User-specific preferences and customization:

```sql
CREATE TABLE user_template_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  favorite_template_ids UUID[],
  frequently_used JSONB DEFAULT '[]',
  preferred_language VARCHAR(5) DEFAULT 'NO',
  ui_preferences JSONB DEFAULT '{}'
);
```

#### 6. `template_usage_analytics`
Usage tracking and analytics:

```sql
CREATE TABLE template_usage_analytics (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES clinical_templates(id),
  user_id UUID,
  encounter_id UUID,
  used_at TIMESTAMP DEFAULT NOW(),
  was_modified BOOLEAN DEFAULT false
);
```

## API Endpoints

### Templates

```javascript
// Get all templates with filtering
GET /api/v1/templates
  ?category_id=uuid
  &soap_section=OBJECTIVE
  &body_region=cervical
  &template_type=SPECIAL_TEST
  &search=spurling
  &favorites_only=true

// Get template categories
GET /api/v1/templates/categories
  ?soap_section=OBJECTIVE
  &body_region=lumbar

// Get single template
GET /api/v1/templates/:id

// Create template
POST /api/v1/templates

// Track template usage
POST /api/v1/templates/:id/use
```

### Orthopedic Tests

```javascript
// Get tests library
GET /api/v1/templates/tests/library
  ?testCategory=ORTHOPEDIC
  &bodyRegion=cervical
  &search=spurling

// Get specific test
GET /api/v1/templates/tests/:code
```

### User Preferences

```javascript
// Get user preferences
GET /api/v1/templates/preferences/user

// Add to favorites
POST /api/v1/templates/preferences/favorites/:templateId

// Remove from favorites
DELETE /api/v1/templates/preferences/favorites/:templateId
```

### Clinical Phrases

```javascript
// Get phrases
GET /api/v1/templates/phrases
  ?category=pain_description
  &search=aggravating

// Get phrases by body region
GET /api/v1/templates/phrases/byregion/:region
```

## Frontend Components

### OrthopedicTemplatePicker Component

The main template picker interface provides:

**Features:**
- Tabbed interface (Templates, Tests, Phrases, Favorites)
- Search and filtering
- Body region selection
- Category tree navigation
- Click-to-insert functionality
- Real-time usage tracking

**Usage:**

```jsx
import OrthopedicTemplatePicker from '../components/OrthopedicTemplatePicker';

function ClinicalEncounter() {
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const handleTemplateSelect = (content, template) => {
    // Insert content into active field
    setEncounterData(prev => ({
      ...prev,
      objective: {
        ...prev.objective,
        rom: content
      }
    }));
  };

  return (
    <>
      <textarea onClick={() => setShowTemplatePicker(true)} />

      {showTemplatePicker && (
        <OrthopedicTemplatePicker
          soapSection="OBJECTIVE"
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}
    </>
  );
}
```

## Template Organization

### Modules by Body Region

#### Module 1: General Observation & Vitals
- General appearance (nutritional state, color)
- Face examination (anemia, cyanosis, Horner's syndrome)
- Hands examination (clubbing, palmar erythema, cyanosis)
- Vital signs (BP, HR, RR, Temperature)
- Lymph nodes
- Thyroid examination

#### Module 2: Respiratory System
- Inspection, palpation, percussion, auscultation
- Tactile fremitus
- Breath sounds

#### Module 3: Cardiovascular System
- Pulse examination (all major pulses)
- Heart auscultation (4 valves)
- Vascular checks (bruits, AAA, capillary refill)
- Peripheral edema

#### Module 4: Abdominal/GI Exam
- Inspection, palpation (9 quadrants)
- Special tests (Murphy's, shifting dullness, rebound)
- Bowel sounds
- Hernia check

#### Module 5: Neurological - Cranial Nerves
- CN II-XII examination
- Visual fields, pupillary reflexes
- Eye movements (H-pattern, saccades)
- Facial sensation and motor
- Hearing tests (Weber, Rinne)
- Gag reflex, tongue examination

#### Module 6: Neurological - Motor, Sensory, Reflexes
- Muscle tone, power, coordination
- Deep tendon reflexes (upper & lower limbs)
- Pathological reflexes (Babinski, Hoffman's, clonus)
- Sensory modalities (pain, touch, vibration, proprioception)
- Gait examination

#### Module 7: MSK - Cervical & Thoracic Spine
- Active/passive ROM
- Special tests (Spurling's, distraction, Lhermitte's)
- TOS tests (Roos, Adson's, hyperabduction)
- Thoracic tests (Adam's, slump, Beevor's)

#### Module 8: MSK - Lumbar Spine & Pelvis
- Active ROM, neurodynamics
- SLR, slump test, bowstring
- SIJ tests (Gaenslen's, FABER, thigh thrust, distraction)
- Kemp's, Waddell's signs

#### Module 9: MSK - Shoulder
- ROM, impingement tests
- Rotator cuff tests
- Instability & labrum tests
- Special tests (Neer's, Hawkins, O'Brien's, Speed's)

#### Module 10: MSK - Elbow, Wrist & Hand
- Ligament stress tests
- Epicondylitis tests
- Carpal tunnel tests (Phalen's, Tinel's)
- Neurovascular tests

#### Module 11: MSK - Hip
- Gait, leg length measurement
- Muscle tests (Trendelenburg, Thomas, Ober's, Ely's)
- Impingement tests (FABER, FADIR, scour)

#### Module 12: MSK - Knee
- Ligament tests (Lachman's, drawer, valgus/varus stress)
- Meniscus tests (McMurray's, Thessaly, Apley's)
- Patella tests (apprehension, grind)
- Effusion tests

#### Module 13: MSK - Ankle & Foot
- Ligament tests (anterior drawer, talar tilt)
- Tendon tests (Thompson, windlass)
- Nerve tests (Morton's neuroma, tarsal tunnel)

## Template Data Structure

### Example: Cervical AROM Template

```json
{
  "code": "obj_cervical_arom",
  "name_en": "Cervical Active ROM",
  "name_no": "Cervical Aktiv Bevegelsesutslag",
  "template_type": "STRUCTURED_FORM",
  "soap_section": "OBJECTIVE",
  "body_region": "cervical",
  "content_no": "Cervical AROM: Fleksjon {{flexion}}°, Ekstensjon {{extension}}°, Høyre rotasjon {{rrot}}°, Venstre rotasjon {{lrot}}°",
  "template_data": {
    "fields": [
      {"name": "flexion", "type": "number", "unit": "degrees", "normal": "50-60"},
      {"name": "extension", "type": "number", "unit": "degrees", "normal": "60-70"},
      {"name": "rrot", "type": "number", "unit": "degrees", "normal": "70-90"},
      {"name": "lrot", "type": "number", "unit": "degrees", "normal": "70-90"}
    ]
  },
  "keywords": ["cervical", "ROM", "range of motion", "neck"]
}
```

### Example: Spurling's Test

```json
{
  "code": "spurling_test",
  "test_name_no": "Spurlings Test",
  "test_category": "ORTHOPEDIC",
  "body_region": "cervical",
  "system": "musculoskeletal",
  "description_no": "Cervical kompresjon med sidebøy og rotasjon",
  "procedure_no": "Pasient sittende, utfør cervical ekstensjon, ipsilateral sidebøy, og rotasjon. Appliser aksial kompresjon",
  "positive_finding_no": "Radikulær smerte i ipsilateral overekstremitet",
  "indicates_conditions": ["cervical radiculopathy", "nerve root compression", "foraminal stenosis"],
  "result_type": "BINARY",
  "result_options": {
    "positive": "Positiv",
    "negative": "Negativ"
  }
}
```

## Usage Examples

### Example 1: Documenting Cervical Examination

**Scenario:** Practitioner examining patient with neck pain

**Workflow:**
1. Click on Objective section > Cervical template field
2. Template picker opens filtered to "Objective - Cervical"
3. Select "Cervical AROM" template
4. Fill in ROM values (dynamically or via form)
5. Select "Spurling's Test" from tests tab
6. Template automatically inserts formatted text

**Result:**
```
OBJECTIVE:
Cervical AROM: Fleksjon 45°, Ekstensjon 55°, Høyre rotasjon 75°, Venstre rotasjon 80°, Høyre lateralfleksjon 35°, Venstre lateralfleksjon 40°

Spurlings Test: Positiv høyre side med radikulær smerte ned i høyre arm

Palpasjon: Økt tonus i øvre trapezius bilateralt. Triggerpunkter funnet i levator scapulae høyre side.
```

### Example 2: Lower Back Pain Documentation

**Workflow:**
1. Select "Lumbar AROM" template
2. Add "SLR Test" from orthopedic tests
3. Add "FABER Test" for SIJ
4. Insert aggravating factors from phrase library

**Result:**
```
OBJECTIVE:
Lumbar AROM: Fleksjon 50° (fingertips til gulv: 15 cm), Ekstensjon 20°

Straight Leg Raise (SLR): Positiv venstre side ved 40° med radikulær smerte under kne

FABER Test: SI-smerte venstre side

Palpasjon: Ømhet over L4-L5 segment. Økt tonus i erector spinae bilateralt.
```

## Implementation Checklist

- [x] Database schema migration (003_add_clinical_templates.sql)
- [x] Seed data for orthopedic tests (03_orthopedic_templates.sql)
- [x] Seed data for clinical phrases (04_clinical_phrases.sql)
- [x] Backend API routes (/routes/templates.js)
- [x] Backend controllers (/controllers/templates.js)
- [x] Frontend API client updates (api.js)
- [x] Frontend template picker component (OrthopedicTemplatePicker.jsx)
- [ ] Integration with ClinicalEncounter.jsx
- [ ] Variable input modal component
- [ ] Template preview functionality
- [ ] Template export/import
- [ ] Analytics dashboard for template usage

## Future Enhancements

1. **AI-Assisted Documentation**
   - Auto-suggest templates based on chief complaint
   - Smart field completion using patient history
   - Natural language to SOAP conversion

2. **Custom Template Builder**
   - Visual template editor
   - Drag-and-drop interface
   - Template sharing across organization

3. **Advanced Analytics**
   - Most used templates by diagnosis
   - Documentation efficiency metrics
   - Template effectiveness scoring

4. **Multi-Language Expansion**
   - Swedish, Danish, Finnish support
   - English (US/UK) medical terminology
   - Automatic translation suggestions

5. **Integration Features**
   - Voice-to-text dictation
   - Mobile app support
   - Tablet-optimized interface
   - Offline mode with sync

## Best Practices

### For Practitioners

1. **Use Favorites:** Mark frequently used templates as favorites for quick access
2. **Customize:** Create custom templates for your specific documentation style
3. **Be Consistent:** Use standardized templates for better data quality
4. **Review & Edit:** Always review auto-inserted text before finalizing
5. **Track Outcomes:** Use structured templates to enable outcome tracking

### For Administrators

1. **Regular Updates:** Keep template library updated with latest evidence
2. **Monitor Usage:** Review analytics to optimize template library
3. **Train Staff:** Provide training on effective template usage
4. **Quality Control:** Regularly review documentation quality
5. **Feedback Loop:** Collect practitioner feedback for improvements

## Support

For questions or issues:
- Check this documentation
- Contact development team
- Submit feature requests via GitHub issues

---

**Version:** 1.0
**Last Updated:** 2025-11-19
**Maintained by:** ChiroClick Development Team
