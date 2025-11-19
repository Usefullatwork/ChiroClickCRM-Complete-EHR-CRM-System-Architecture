# Vestibulær Modul - Komplett Dokumentasjon

## Oversikt

Denne modulen legger til omfattende vestibulær/nevrologisk vurdering til ChiroClickCRM. Modulen dekker:

- **BPPV Testing** (Benign Paroksysmal Posisjonssvimmelhet)
- **VNG** (Videonystagmografi)
- **Balanse & Cerebellare Tester**
- **Oculomotoriske Tester**
- **Diagnoser & Behandling**
- **Vestibulær Rehabilitering (VRT)**
- **Outcome Measures** (DHI - Dizziness Handicap Inventory)

---

## Database Schema

### Ny Tabell: `vestibular_assessments`

Lokasjon: `/backend/migrations/009_vestibular_neurology.sql`

**Hovedseksjoner:**

1. **Anamnese** - Sykehistorie og symptomer
2. **Undersøkelse** - Kliniske funn (ortopediske, nevrologiske, cerebellare)
3. **BPPV Testing** - Dix-Hallpike, Supine Roll, Deep Head Hang
4. **VNG** - Videonystagmografi resultater
5. **Diagnoser** - Primærdiagnose og detaljer
6. **Behandling** - Manøvrer, VRT, hjemmeøvelser
7. **Outcome** - DHI score, oppfølging, henvisning

---

## Backend API

### Service: `vestibular.js`

Lokasjon: `/backend/src/services/vestibular.js`

**Funksjoner:**
- `createAssessment(data)` - Opprett ny vurdering
- `getAssessmentById(id, orgId)` - Hent vurdering
- `getAssessmentsByPatient(patientId, orgId)` - Hent alle vurderinger for pasient
- `getAssessmentByEncounter(encounterId, orgId)` - Hent vurdering for konsultasjon
- `updateAssessment(id, orgId, updates)` - Oppdater vurdering
- `deleteAssessment(id, orgId)` - Slett vurdering
- `getBPPVTrends(patientId, orgId)` - BPPV trendanalyse
- `getCommonDiagnoses(orgId)` - Diagnosestatistikk
- `getTreatmentEfficacy(orgId)` - Behandlingseffekt

### API Endepunkter

Lokasjon: `/backend/src/routes/vestibular.js`

```
POST   /api/v1/vestibular                          - Opprett vurdering
GET    /api/v1/vestibular/:id                      - Hent vurdering
GET    /api/v1/vestibular/patient/:patientId       - Hent pasientens vurderinger
GET    /api/v1/vestibular/encounter/:encounterId   - Hent vurdering for encounter
PATCH  /api/v1/vestibular/:id                      - Oppdater vurdering
DELETE /api/v1/vestibular/:id                      - Slett vurdering
GET    /api/v1/vestibular/patient/:patientId/bppv-trends  - BPPV trends
GET    /api/v1/vestibular/stats/diagnoses          - Diagnosestatistikk
GET    /api/v1/vestibular/stats/efficacy           - Behandlingseffekt
```

---

## Frontend Komponent

### VestibularAssessment.jsx

Lokasjon: `/frontend/src/components/VestibularAssessment.jsx`

**Hovedfunksjoner:**

1. **Tab-basert UI:**
   - Anamnese
   - Testing
   - Diagnose
   - Behandling

2. **BPPV Testing Interface:**
   - Dix-Hallpike (høyre/venstre)
   - Supine Roll Test (horisontal buegang)
   - Deep Head Hang (fremre buegang)
   - Detaljert nystagmus-registrering (type, intensitet, karakter)

3. **Balanse Testing:**
   - Fukuda's Test
   - Rhomberg's Test
   - Koordinasjonstester

4. **Oculomotoriske Tester:**
   - Sakkader
   - Smooth Pursuits
   - Halmagyi (HIT)

5. **Diagnose & Behandling:**
   - BPPV detaljer (kanal, type, side)
   - DHI score
   - Reposisjonsmanøvrer
   - VRT øvelser
   - Oppfølgingsplan

**Bruk:**

```jsx
import VestibularAssessment from '../components/VestibularAssessment';

<VestibularAssessment
  data={vestibularData}
  onChange={(updated) => setVestibularData(updated)}
  readOnly={false}
/>
```

---

## Kliniske Maler

### Norske Vestibulære Maler

Lokasjon: `/backend/seeds/vestibular_templates.sql`

**80+ Maler fordelt på:**

### 1. Anamnese (Subjective)
- Karusellsvimmelhet
- Nautisk svimmelhet
- BPPV debut (traume/virus)
- Tilleggsplager (komplett)

### 2. Undersøkelse (Objective)
- Cerebellare tester normale/avvikende
- Fukuda positiv/negativ
- Rhomberg ustabil
- Oculomotoriske tester normale/avvikende
- Pursuits saccadic
- HIT positiv

### 3. BPPV Testing (Objective)
- Alle BPPV tester negative
- BPPV bakre buegang høyre/venstre
- BPPV horisontal geotrop høyre/venstre
- BPPV horisontal apogeotrop
- BPPV fremre buegang
- BPPV bilateral/multikanal

### 4. VNG (Objective)
- VNG normal
- VNG kalorisk svakhet
- VNG pursuits saccadic

### 5. Behandling (Plan)
- Epleys manøver høyre/venstre
- BBQ Roll høyre/venstre
- Deep Head Hang (fremre buegang)
- Semont manøver
- Gufoni (cupololithiasis)
- VRT - Vestibulær Rehabilitering
- Manuell behandling + Vestibulær

### 6. Outcome & Oppfølging
- DHI - Dizziness Handicap Inventory
- BPPV oppfølgingsplan
- Differensialdiagnoser svimmelhet

---

## Diagnosekoder

### Nye ICD-10 Koder:

**BPPV:**
- `H81.1` - BPPV (generell)
- `H81.10` - BPPV bakre buegang
- `H81.11` - BPPV horisontal buegang
- `H81.12` - BPPV fremre buegang
- `H81.13` - BPPV bilateral/multikanal

**Andre Vestibulære:**
- `H81.2` - Vestibularis nevritt
- `H81.0` - Ménières sykdom
- `H81.3` - Andre perifervestibulære svimmelheter
- `H81.9` - Svimmelhet uspesifisert
- `R42` - Svimmelhet og ørhet
- `G43.1` - Vestibulær migrene
- `H83.2` - Labyrintitt
- `M53.0` - Cervikogen svimmelhet

### ICPC-2 Koder:
- `H82` - Svimmelhet/vertigo
- `N17` - Svimmelhet/ørhet

---

## Behandlingskoder (Takster)

**Nye Koder:**
- `VEST01` - Vestibulær undersøkelse med VNG (1200 kr, 45 min)
- `VEST02` - BPPV reposisjonsmanøver (750 kr, 30 min)
- `VEST03` - Vestibulær rehabilitering VRT (850 kr, 40 min)
- `VEST04` - Kompleks vestibulær behandling (1100 kr, 60 min)

---

## Integrasjon med SOAP-noter

Vestibulær vurdering integreres med eksisterende SOAP-system:

1. **Subjective** - Anamnese fra vestibular_assessments
2. **Objective** - Testing og funn
3. **Assessment** - Diagnose og vurdering
4. **Plan** - Behandling og oppfølging

Data lagres både i `clinical_encounters` (SOAP-format) og `vestibular_assessments` (detaljert strukturert data).

---

## Outcome Measures

### DHI (Dizziness Handicap Inventory)

**Skala:** 0-100 poeng

**Tolkning:**
- 0-30: Mild funksjonsnedsettelse
- 31-60: Moderat funksjonsnedsettelse
- 61-100: Alvorlig funksjonsnedsettelse

**Subscore:**
- Fysisk: /28 poeng
- Emosjonell: /36 poeng
- Funksjonell: /36 poeng

---

## Klinisk Arbeidsflyt

### Typisk BPPV Konsultasjon:

1. **Anamnese** (5-10 min)
   - Type svimmelhet
   - Debut og varighet
   - Triggere
   - Tilleggsplager

2. **Testing** (15-20 min)
   - Dix-Hallpike begge sider
   - Supine Roll Test
   - Deep Head Hang (ved behov)
   - Oculomotoriske tester
   - Balansetester

3. **Diagnose** (2-5 min)
   - Bestem kanal, side, type
   - DHI score
   - Differensialdiagnoser

4. **Behandling** (10-15 min)
   - Reposisjonsmanøver
   - Hjemmeøvelser
   - VRT-plan

5. **Oppfølging**
   - Kontroll om 2-7 dager
   - Reevaluering ved manglende bedring
   - Henvisning ved behov

---

## Statistikk & Rapporter

### Tilgjengelig Analytikk:

1. **BPPV Trends**
   - Pasientspesifikk forløp
   - DHI score over tid
   - Behandlingsrespons

2. **Diagnosestatistikk**
   - Vanligste diagnoser
   - Gjennomsnittlig DHI per diagnose
   - Tidsperiode-filtrering

3. **Behandlingseffekt**
   - Gjennomsnittlig bedring (DHI)
   - Suksessrate per manøver
   - Antall behandlinger til bedring

---

## Installasjon

### 1. Database Migration

```bash
cd backend
psql -U postgres -d chiro_db -f migrations/009_vestibular_neurology.sql
```

### 2. Seed Clinical Templates

```bash
psql -U postgres -d chiro_db -f seeds/vestibular_templates.sql
```

### 3. Backend Routes

Legg til i `backend/src/server.js`:

```javascript
import vestibularRoutes from './routes/vestibular.js';

app.use('/api/v1/vestibular', vestibularRoutes);
```

### 4. Frontend Integration

Importer komponenten i ClinicalEncounter eller dedikert VestibularPage:

```javascript
import VestibularAssessment from '../components/VestibularAssessment';
```

---

## Testing

### Manual Testing Checklist:

- [ ] Opprett ny vestibulær vurdering
- [ ] Test alle BPPV-tester (Dix-Hallpike, Supine Roll, Deep Head Hang)
- [ ] Registrer nystagmus med alle detaljer
- [ ] Sett diagnose (BPPV bakre hø)
- [ ] Registrer behandling (Epleys høyre)
- [ ] Lagre og hent vurdering
- [ ] Se pasientens vestibulære historikk
- [ ] Generer BPPV trends
- [ ] Eksporter til SOAP-note
- [ ] Test DHI scoring

---

## Fremtidige Utvidelser

### Planlagte Features:

1. **Video Recording Integration**
   - Lagre VNG-videoer
   - Nystagmus dokumentasjon

2. **AI-Assistert Diagnose**
   - Automatisk tolkning av nystagmus-mønstre
   - Foreslå behandling basert på funn

3. **Patient Portal**
   - Hjemmeøvelser med video
   - DHI self-assessment
   - Symptom tracking

4. **Advanced Analytics**
   - Machine learning for prognoseprediktering
   - Behandlingsoptimering
   - Komorbiditet-analyse

5. **Multi-language Support**
   - Engelsk oversettelse av maler
   - Andre skandinaviske språk

---

## Support & Kontakt

For spørsmål om vestibulær-modulen:

- **Dokumentasjon:** `/docs/VESTIBULAR_MODULE.md`
- **Kliniske Maler:** `/backend/seeds/vestibular_templates.sql`
- **Database Schema:** `/backend/migrations/009_vestibular_neurology.sql`
- **API Referanse:** Se backend routes og service-filer

---

**Versjon:** 1.0
**Sist oppdatert:** 2025-11-19
**Forfatter:** ChiroClickCRM Development Team
