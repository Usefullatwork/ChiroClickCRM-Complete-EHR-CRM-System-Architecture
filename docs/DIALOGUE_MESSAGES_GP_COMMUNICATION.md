# Dialogue Messages - GP & Specialist Communication

**ChiroClickCRM Automated Healthcare Communication System**
**Created:** 2025-11-22
**Standard:** Norwegian Helsevesen Dialogmelding v1.1

---

## Table of Contents

1. [Overview](#overview)
2. [When to Send Dialogue Messages](#when-to-send-dialogue-messages)
3. [Message Structure](#message-structure)
4. [Template Library](#template-library)
5. [Clinical Scenarios](#clinical-scenarios)
6. [Auto-Generation Workflow](#auto-generation-workflow)
7. [Examples by Category](#examples-by-category)
8. [Clinical Phrases Dictionary](#clinical-phrases-dictionary)
9. [Best Practices](#best-practices)

---

## Overview

Dialogue messages (dialogmeldinger) are structured communications between chiropractors and general practitioners/specialists in the Norwegian healthcare system. This system automates the generation of professional, standardized messages based on clinical findings.

### Key Principles

**Dialogmeldinger bør primært brukes der budskapet:**
- Åpenbart eller mulig vil påvirke mottakeren
- Påvirkning vil skje i relativ nær fremtid
- Gjelder undersøkelser utenfor kiropraktorens kompetanse (blodprøver, billeddiagnostikk, etc.)
- Informasjon er nødvendig med henblikk på forsvarlig helsehjelp

### System Features

✅ **12 Pre-Built Templates** - Common clinical scenarios covered
✅ **Auto-Variable Replacement** - Patient data automatically inserted
✅ **Clinical Phrases Library** - Reusable standardized medical terminology
✅ **Draft-Send Workflow** - Review before sending
✅ **Response Tracking** - Track GP acknowledgments and responses
✅ **Norsk Helsenett Integration** - Ready for electronic transmission

---

## When to Send Dialogue Messages

### DO Send When:

1. **Referrals for Investigation**
   - Requesting blood work (inflammatory markers, infection parameters)
   - Ordering imaging beyond your scope (MRI, CT)
   - Skin lesions requiring dermatological assessment

2. **Referrals for Treatment**
   - Pain medication beyond your prescribing rights
   - Psychological support (anxiety, depression counseling)
   - Specialist consultation (neurology, rheumatology, orthopedics)

3. **Informing About Sick Leave**
   - You have issued sick leave certificate
   - Clarifying who will follow up (you vs. GP)
   - Providing clinical justification for sick leave

4. **Safety Concerns**
   - Suspected fracture (Ottawa rules positive)
   - Vascular claudication (positive Lewis test)
   - Neurological red flags (cauda equina symptoms, progressive weakness)
   - Suspected serious pathology (malignancy, infection)

5. **Patient Anxiety/Concerns**
   - Benign clinical findings but significant patient worry
   - Request for reassurance from GP
   - Health anxiety requiring psychological support

### DO NOT Send When:

- Routine treatment updates for uncomplicated cases
- Information that does not affect GP's management
- Administrative matters (appointment scheduling, billing)

---

## Message Structure

### Standard Format

```
SUBJECT: [Brief description of purpose]

GREETING:
Hei Dr. [GP Name] / Hei,

OPENING:
[Brief context - who is the patient, why are they seeing you]

ANAMNESE:
[Summary of relevant history]

UNDERSØKELSE/FUNN:
[Objective findings, special tests, red flag screening]

BEHANDLING:
[What treatment has been provided]

PROGNOSE:
[Expected outcome]

VURDERING/ANBEFALING:
[Your clinical reasoning and what you're requesting]

OPPFØLGING:
[Who will follow up, when, and what to monitor]

AVSLUTNING:
Med vennlig hilsen,
[Your name]
[Your title]
[Clinic name]
[Contact information if urgent]
```

---

## Template Library

### Available Templates

| Template Code | Name | Scenario | Urgency |
|---------------|------|----------|---------|
| `REFERRAL_PAIN_MEDICATION` | Henvisning for Smertestillende | Referral | Routine |
| `INFO_TREATMENT_UPDATE` | Informasjon om Behandlingsforløp | Information | Routine |
| `REFERRAL_ANXIETY_REASSURANCE` | Henvisning for Beroligende Samtale | Referral | Routine |
| `INFO_CAUDA_EQUINA_EDUCATION` | Informasjon om Cauda Equina Opplæring | Information | Routine |
| `REFERRAL_SUSPECTED_FRACTURE` | Henvisning ved Mistanke om Fraktur | Referral | Urgent |
| `REFERRAL_DISC_RADICULOPATHY` | Henvisning Skiveprolaps med Nerverotaffeksjon | Referral | Urgent |
| `REFERRAL_VASCULAR_CLAUDICATION` | Henvisning Vaskulær Claudicatio | Referral | Urgent |
| `INFO_SICK_LEAVE_NOTIFICATION` | Informasjon om Sykmelding | Information | Routine |
| `REFERRAL_BLOOD_WORK` | Henvisning for Blodprøver | Referral | Routine |
| `REFERRAL_SKIN_LESION` | Henvisning for Hudforandring | Referral | Urgent |

---

## Clinical Scenarios

### Scenario 1: Referral for Pain Medication

**Clinical Context:**
- Patient with mechanical low back pain
- Improving with conservative care but still has pain
- Requests pain medication
- Chiropractor wants GP to assess medication needs

**Generated Message:**

```
SUBJECT: Pasient - henvisning vedrørende smertestillende

Hei Dr. Andersen,

Jeg har for tiden en 45 år gammel pasient med det jeg vurderer som
relativt nyoppståtte korsryggsplager uten røde flagg, utstråling eller
kompliserende faktorer.

Pasienten har hatt symptomene i 3 uker og rapporterer konstant dype
korsryggsmerter som forverres ved sitting og forbedres med bevegelse.

Ved undersøkelse finner jeg bilateral ømhet over L4-L5 facettledd,
begrenset fleksjon og ekstensjon. Ingen nevrologiske utfall. SLR negativ bilateralt.

Han har vært til behandling her to ganger med fokus på manuell ledd- og
bløtvevsbehandling, samt råd, veiledning og passende øvelser. Pasienten
har blitt noe bedre, men har fortsatt smerter som hemmer han i hverdagen.

Pasienten har spurt meg om smertestillende, men jeg ønsker at han skal
snakke med deg om dette. Jeg har derfor anbefalt pasienten å kontakte
deg for vurdering av medikamentell smertebehandling.

Ved spørsmål, ta gjerne kontakt med meg. På forhånd, tusen takk for
hjelpen og samarbeidet!

Med vennlig hilsen,
Kiropraktor Hansen
Autorisert kiropraktor
Oslo Kiropraktorklinikk
```

---

### Scenario 2: Simple Lumbago with Patient Anxiety

**Clinical Context:**
- Patient with simple mechanical low back pain
- Responding well to treatment
- Extremely worried about cancer
- No clinical red flags but patient needs reassurance

**Generated Message:**

```
SUBJECT: Din pasient - henvisning for beroligende samtale

Hei,

Pasienten har gått til behandling hos undertegnede for korsryggsmerter
som han har hatt gjennom cirka tre uker.

På bakgrunn av klinikk, anamnese og objektive undersøkelser har jeg
vurdert smertene som muskulært betinget og således simpel lumbago. Han
har foreløpig mottatt tre behandlinger og opplever bedring av dette.
Planen er å avslutte behandlingen om kort tid.

Ved undersøkelse finner jeg lokal ømhet og muskelspenninger i
korsryggen. Ingen nevrologiske utfall. Funn tilsier benign mekanisk
ryggsmerte.

Bakgrunnen for denne meldingen er at pasienten opplyser at han er
sliten og trøtt og videre at han er engstelig for at dette kan være
kreft. Det fremkommer i anamnesen ingen holdepunkter for at dette skal
være en malign lidelse og det er heller ingen arvelighet. Jeg har
likevel oppfordret han til å oppsøke deg for eventuelt ytterligere
undersøkelser/beroligende samtale på bakgrunn av hans engstelse.

Med vennlig hilsen,
Kiropraktor Olsen
Autorisert kiropraktor
Bergen Kiropraktorsenter
```

---

### Scenario 3: Cauda Equina Education Documentation

**Clinical Context:**
- Patient with low back pain
- Receiving conservative treatment
- Important to document that patient was educated about red flags

**Generated Message:**

```
SUBJECT: Informasjon - behandling og cauda equina opplæring

Hei,

Din pasient John Doe er under behandling hos undertegnede for lumbal
facettsyndrom.

Ved undersøkelse finner jeg ømhet over L4-L5 facettledd bilateralt,
begrenset ekstensjon. Ingen nevrologiske utfall. Ingen saddle anesthesi
eller blære-/tarmkontrollproblemer.

Det er igangsatt konservativ behandling. Pasienten er vist øvelser for
mobilitet og avspenning og oppfordret til å holde seg i aktivitet.
Symptomene vurderes fortløpende.

Pasienten er informert om symptomer på cauda equina syndrom og ved
forverring oppfordres pasienten til å ta kontakt med fastlege eventuelt
legevakt.

Med vennlig hilsen,
Kiropraktor Larsen
Autorisert kiropraktor
Trondheim Ryggsenter
```

---

### Scenario 4: Suspected Fracture (URGENT)

**Clinical Context:**
- Trauma history
- Ottawa ankle/knee rules positive
- Possible fracture requiring imaging

**Generated Message:**

```
SUBJECT: HASTER - Mistanke om fraktur

Hei,

Pasienten hadde konsultasjon 22.11.2025 for smerter i høyre ankel etter
fotballskade tidligere i dag.

Grunnet betydelig hevelse, ømhet over laterale malleolus, og
belastningssmerte under konsultasjonen har undertegnede valgt å
rekvirere Rtg for mulig fraktur.

Pasienten er informert om at mistanke om fraktur foreligger og anbefalt
å oppsøke deg/legevakt for videre håndtering.

Ottawa-regler: Positiv - ømhet over laterale malleolus og
belastningssmerte (kan ikke gå 4 steg)

Med vennlig hilsen,
Kiropraktor Johansen
Autorisert kiropraktor
Stavanger Idrettsklinikk

Tlf: 51 23 45 67
```

---

### Scenario 5: Disc Herniation with Radiculopathy (URGENT)

**Clinical Context:**
- Leg pain greater than back pain
- Positive neurological findings
- Dermatomal distribution
- Needs specialist assessment

**Generated Message:**

```
SUBJECT: Henvisning - skiveprolaps med affeksjon av nerverot

Hei,

Din pasient Maria Hansen (42 år) har oppsøkt meg med venstresidige
bensmerter ned til foten av 2 ukers varighet.

ANAMNESE:
Akutt debut etter tunge løft. Smerter i venstre ben >> ryggsmerter.
Prikking i stortå. Forverres ved hosting, sitting. Marginalt bedret
med hvile.

RØDE FLAGG: Progressiv nummenhet i fot siste 3 dager.

UNDERSØKELSE:
Dermatom: L5 - nummenhet i dorsalfleksjon fot og stortå
Myotom: L5 - redusert kraft (4/5) i tåhev og fotens dorsalfleksjon
Reflekser: Patella normal bilateralt, achilles normal bilateralt

Positiv SLR venstre ved 40 grader (provoserer bensmerter)
Positiv Crossed SLR høyre (provoserer venstre bensmerter)

Vurdering: Kliniske funn forenlig med skiveprolaps L4-L5 med
affeksjon av L5 nerverot venstre

Jeg anbefaler henvisning til nevrokirurg/ortoped for vurdering av
MR lumbalt.

OBS: Progressiv motorisk svakhet - vurder hastegrad.

Ved spørsmål, ring meg gjerne.

Med vennlig hilsen,
Kiropraktor Eriksen
Autorisert kiropraktor
Drammen Ryggklinikk
Tlf: 32 12 34 56
```

---

### Scenario 6: Vascular Claudication (URGENT)

**Clinical Context:**
- Leg pain with exercise
- Positive Lewis test
- Suspicion of peripheral arterial disease

**Generated Message:**

```
SUBJECT: Henvisning - mistanke om vaskulær insuffisiens

Hei,

Din pasient Knut Olsen har oppsøkt meg med venstresidige
vadebeinsmerter ved gange.

UNDERSØKELSE:
Lewis arbeidsprøve venstre side: Positiv
(Rytmisk vipping av den hevede fot gir smerter i benet i løpet av
1 minutt)

Perifere pulser:
- A. dorsalis pedis: Svakt palpabel venstre, normal høyre
- A. tibialis posterior: Ikke palpabel venstre, normal høyre

Vurdering: Mistanke om iskemi i venstre underekstremitet

Jeg anbefaler henvisning til karkirurg for videre utredning av
perifer arteriell sykdom.

Pasienten er informert om mistanken og rådet til å oppsøke deg snarest.

Med vennlig hilsen,
Kiropraktor Berg
Autorisert kiropraktor
Kristiansand Helsesenter
Tlf: 38 23 45 67
```

---

### Scenario 7: Sick Leave Notification

**Clinical Context:**
- Chiropractor has issued sick leave (max 8 weeks)
- Informing GP for coordination
- Clarifying follow-up responsibility

**Generated Message:**

```
SUBJECT: Informasjon - sykmelding av din pasient

Hei,

Jeg har i dag sykmeldt din pasient Per Andersen for akutt lumbago.

BAKGRUNN:
Pasienten jobber som lagerarbeider med daglig tung løft og
repetitive bøyebelastninger. Akutt debut for 3 dager siden ved løft
av tung pakke. Betydelig funksjonsnedsettelse.

FUNN:
Markert ømhet og muskelspenninger lumbal paravertebralt bilateralt
Positiv Kemp's test begge sider
Begrenset fleksjon (fingre til knær)
Normale nevrologiske funn

BEHANDLING:
Manuell behandling av ledd og muskulatur
Øvelser for mobilisering og stabilisering
Gradering av aktivitet og ergonomisk veiledning

Sykmeldingsperiode: 2 uker
Grad: 100%

OPPFØLGING:
Jeg vil følge opp pasienten videre med behandling og gradert
aktivitet. Re-vurdering om 1 uke for vurdering av arbeidskapasitet
og eventuell gradering av sykmelding.

Hvis pasienten fortsatt har behov for sykmelding etter 8 uker total,
ber jeg om at du overtar videre oppfølging.

Ved spørsmål, ta gjerne kontakt.

Med vennlig hilsen,
Kiropraktor Nilsen
Autorisert kiropraktor
Tønsberg Kiropraktorsenter
```

---

### Scenario 8: Requesting Blood Work

**Clinical Context:**
- Multiple joint pain
- Morning stiffness
- Suspicion of inflammatory arthropathy

**Generated Message:**

```
SUBJECT: Henvisning - ønske om blodprøver

Hei,

Din pasient Lisa Johansen (38 år) har oppsøkt meg med smerter i
nakke, skuldre, hender og knær.

ANAMNESE:
Gradvis økende symptomer siste 6 måneder
Morgenstivhet >1 time
Symmetriske leddplager
Tretthet og generell uvelhetsfølelse
Mors har revmatoid artritt

UNDERSØKELSE:
Hevelse og ømhet over PIP- og MCP-ledd bilateral
Redusert bevegelighet i cervikale og lumbale columna
Symmetrisk palpatorisk ømhet

VURDERING:
Kombinasjonen av symmetriske leddplager, langvarig morgenstivhet,
familiær belastning og systemiske symptomer gir mistanke om
inflammatorisk leddsykdom.

Jeg ønsker derfor at du vurderer følgende blodprøver:
- SR (senkning)
- CRP
- RF (revmatoid faktor)
- Anti-CCP
- ANA
- Hb, Trombocytter, Leukocytter

Lave inflammatoriske markører ville roe meg, men forhøyede verdier
tilsier henvisning til revmatolog for videre utredning.

Jeg vil følge opp pasienten videre etter at prøvesvar foreligger.

Med vennlig hilsen,
Kiropraktor Svendsen
Autorisert kiropraktor
Fredrikstad Helseklinikk
```

---

### Scenario 9: Skin Lesion Referral

**Clinical Context:**
- Suspicious mole discovered during treatment
- ABCDE criteria concerning

**Generated Message:**

```
SUBJECT: Henvisning - mistenkelig hudforandring

Hei,

Ved behandling av din pasient Ola Nordmann har jeg observert en
hudforandring som bør vurderes nærmere.

FUNN:
Lokalisasjon: Øvre thorakal rygg, ca. 5 cm lateral for columna T4 nivå

Beskrivelse:
- Asymmetrisk lesjon
- Ujevne kanter
- Varierende farge (brun, svart, rødlig)
- Diameter ca. 8 mm
- Pasienten usikker på om den har vokst, "tror den har blitt større"

ABCDE vurdering: Minst 3 kriterier oppfylt (A, B, C)

Jeg anbefaler at pasienten får vurdert denne hudforandringen av
deg/hudlege.

Pasienten er informert om funnet og rådet til å kontakte deg.

Med vennlig hilsen,
Kiropraktor Pettersen
Autorisert kiropraktor
Bodø Kiropraktorklinikk
```

---

### Scenario 10: Standard Treatment Information

**Clinical Context:**
- Informing GP about treatment being provided
- Reply to referral from GP
- Standard update

**Generated Message:**

```
SUBJECT: Informasjon - behandling av din pasient Kari Larsen

Takk for henvisningen.

Hei,

Din pasient Kari Larsen har oppsøkt meg for nakkesmerter med
hodepine.

ANAMNESE:
Gradvis økende nakkesmerter siste 3 måneder. Occipital hodepine 3-4
ganger per uke. Jobber som kontorist med mye PC-arbeid. Forverres
ved langvarig sitting. Ingen nevrologiske symptomer.

UNDERSØKELSE/FUNN:
Redusert bevegelighet cervikal columna, spesielt rotasjon venstre
Palpatorisk ømhet C2-C4 facettledd bilateral
Økt tonus i m. trapezius og suboccipitale muskulatur
Negative nevrologiske funn
Negativ vertebral artery test

BEHANDLING:
Behandlingen vil bestå av funksjonsnormaliserende behandling av ledd
og muskulatur i nakke og øvre thorax. Dypstabiliserende øvelser for
cervical columna. Ergonomisk veiledning for arbeidsplass.

PROGNOSE:
Jeg anser prognosen som god.

Skulle behandlingsforløpet avvike fra forventet, vil du bli holdt
orientert.

Med vennlig hilsen,
Kiropraktor Hansen
Autorisert kiropraktor
Oslo Kiropraktorklinikk
```

---

## Clinical Phrases Dictionary

### Red Flag Negative Phrases

| Code | Norwegian Text | When to Use |
|------|----------------|-------------|
| `NO_RED_FLAGS` | "uten røde flagg, utstråling eller kompliserende faktorer" | Benign mechanical pain |
| `NO_RADICULOPATHY` | "Ingen radikulære funn" | Normal neuro exam |
| `NO_CAUDA_EQUINA` | "Ingen symptomer forenlig med cauda equina syndrom" | Low back pain screening |
| `NO_VASCULAR_SIGNS` | "Normale perifere pulser og sirkulasjon" | Leg pain assessment |

### Clinical Assessments

| Code | Norwegian Text | When to Use |
|------|----------------|-------------|
| `MECHANICAL_PAIN` | "vurdert smertene som muskulært betinget og således simpel lumbago" | Simple LBP |
| `FACET_SYNDROME` | "lumbal facettsyndrom" | Facet-mediated pain |
| `CERVICOGENIC_HEADACHE` | "cervikogen hodepine" | Neck-related headache |
| `MYOFASCIAL_PAIN` | "myofascialt smertesyndrom" | Muscle trigger points |

### Treatment Responses

| Code | Norwegian Text | When to Use |
|------|----------------|-------------|
| `IMPROVING_SLOWLY` | "blitt noe bedre, men har fortsatt smerter" | Partial response |
| `GOOD_RESPONSE` | "god behandlingsrespons med betydelig bedring" | Excellent response |
| `NO_RESPONSE` | "ingen/minimal bedring til tross for adekvat behandling" | Treatment failure |
| `WORSENING` | "progredierende forverring" | Getting worse |

### Treatment Modalities

| Code | Norwegian Text | When to Use |
|------|----------------|-------------|
| `MANUAL_THERAPY` | "manuell ledd- og bløtvevsbehandling, samt råd, veiledning og passende øvelser" | Standard conservative care |
| `SPINAL_MANIPULATION` | "spinal manipulasjonsbehandling (HVLA)" | Specific adjustment |
| `SOFT_TISSUE` | "bløtvevsteknikker og myofascial release" | Muscle work |
| `EXERCISE_PRESCRIPTION` | "terapeutiske øvelser for styrke, mobilitet og stabilitet" | Active rehab |

### Prognosis

| Code | Norwegian Text | When to Use |
|------|----------------|-------------|
| `GOOD_PROGNOSIS` | "god" | Expected full recovery |
| `FAIR_PROGNOSIS` | "forsiktig god" | Guarded but positive |
| `POOR_PROGNOSIS` | "usikker/reservert" | Uncertain outcome |
| `CHRONIC_COURSE` | "langvarig forløp må påregnes" | Chronic condition |

### Neurological Findings

| Code | Norwegian Text | When to Use |
|------|----------------|-------------|
| `NERVE_ROOT_L5` | "Affeksjon av L5 nerverot med redusert kraft i fotens dorsalfleksjon og nummenhet i L5 dermatom" | L5 radiculopathy |
| `NERVE_ROOT_S1` | "Affeksjon av S1 nerverot med redusert/fraværende achillesrefleks og nummenhet i S1 dermatom" | S1 radiculopathy |
| `NERVE_ROOT_C6` | "Affeksjon av C6 nerverot med redusert bicepsrefleks og nummenhet i tommel og pekefinger" | C6 radiculopathy |

### Special Tests

| Code | Norwegian Text | When to Use |
|------|----------------|-------------|
| `POS_SLR` | "Positiv Straight Leg Raise test ved X grader" | Nerve tension |
| `POS_KEMP` | "Positiv Kemp's test X side" | Facet loading |
| `POS_SPURLING` | "Positiv Spurling's test X side" | Cervical radiculopathy |
| `POS_LEWIS` | "Positiv Lewis arbeidsprøve" | Vascular claudication |

---

## Auto-Generation Workflow

### Step 1: Clinical Assessment Complete

After completing patient examination and tests:

```javascript
// Frontend - Clinical assessment summary page
{
  diagnosis: "Lumbal facettsyndrom",
  redFlags: false,
  neurologicalFindings: "Normale",
  treatmentPlan: "Manual therapy + exercises",
  prognosis: "God"
}
```

### Step 2: System Suggests Appropriate Template

```javascript
// Auto-suggestion engine
if (needsMedication && outsideChiroScope) {
  suggestTemplate('REFERRAL_PAIN_MEDICATION');
}

if (positiveRedFlags && neurologicalDeficit) {
  suggestTemplate('REFERRAL_DISC_RADICULOPATHY');
  urgency = 'URGENT';
}

if (sickleaveCertificateIssued) {
  suggestTemplate('INFO_SICK_LEAVE_NOTIFICATION');
}
```

### Step 3: Clinician Selects Template

```sql
SELECT * FROM dialogue_message_templates
WHERE template_code = 'REFERRAL_PAIN_MEDICATION';
```

### Step 4: System Pre-Fills Variables

From anamnesis, examination, and encounter data:

```json
{
  "patient_name": "Auto-filled from patient record",
  "patient_age": "Auto-calculated from DOB",
  "gp_name": "Retrieved from patient's GP registration",
  "condition_description": "From diagnosis field",
  "symptom_duration": "From anamnesis onset date",
  "examination_findings": "From SOAP objective section",
  "treatment_modalities": "From treatment plan",
  "sender_name": "Current logged-in clinician",
  "clinic_name": "From clinic settings"
}
```

### Step 5: Clinician Reviews and Edits

```
Generated draft appears in editor:
- All variables highlighted for easy identification
- Missing required variables flagged in red
- Clinician can edit any part of text
- Save as draft or send immediately
```

### Step 6: Send via Norsk Helsenett

```sql
UPDATE patient_dialogue_messages
SET
  status = 'sent',
  sent_via = 'norsk_helsenett',
  sent_at = CURRENT_TIMESTAMP,
  sent_by = 'clinician-uuid'
WHERE id = 'message-uuid';
```

---

## Best Practices

### Language and Tone

**DO:**
- Use professional but warm tone
- Address GP by name when known ("Hei Dr. Andersen")
- Thank for collaboration ("tusen takk for samarbeidet")
- Be concise but complete
- Use standardized medical terminology

**DON'T:**
- Use overly casual language
- Include unnecessary details
- Make demands ("you must...")
- Use ambiguous terms ("quite bad", "somewhat better")

### Clinical Reasoning

**DO:**
- State your clinical assessment clearly
- Explain WHY you're referring (not just what)
- Include relevant positive AND negative findings
- Quantify findings when possible ("40 degrees SLR", "4/5 strength")

**DON'T:**
- Diagnose outside your scope
- Use diagnostic labels for uncertain conditions
- Omit red flag screening results

### Urgency Indicators

**URGENT/HASTER:**
- Suspected fracture
- Cauda equina symptoms
- Progressive neurological deficit
- Vascular insufficiency
- Suspected infection/malignancy

**ROUTINE:**
- Pain medication request
- Blood work for chronic symptoms
- General treatment updates
- Sick leave notifications

### Follow-up Clarity

**Always specify:**
- Who will follow up (you, GP, or shared)
- When follow-up will occur
- What triggers need for escalation
- How to contact you if questions

**Example:**
```
"Jeg vil følge opp pasienten med behandling 2x per uke de neste 2 ukene.
Ved manglende bedring eller forverring, vil pasienten bli henvist til
deg for videre vurdering.

Skulle du ønske å diskutere pasienten, ring meg gjerne på 12 34 56 78."
```

---

## Integration with ChiroClickCRM

### Automatic Variable Population

```javascript
// System automatically populates from:
const messageVariables = {
  // From patient record
  patient_name: patient.firstName + ' ' + patient.lastName,
  patient_age: calculateAge(patient.dateOfBirth),
  gp_name: patient.generalPractitioner.name,

  // From current encounter
  chief_complaint: encounter.anamnesis.chiefComplaint,
  symptom_duration: calculateDuration(encounter.anamnesis.onsetDate),

  // From examination
  examination_findings: encounter.soap.objective,
  special_test_results: formatSpecialTests(encounter.testResults),

  // From diagnosis
  diagnosis: encounter.diagnosis.primary,
  clinical_assessment: encounter.assessment,

  // From treatment plan
  treatment_modalities: encounter.treatmentPlan.modalities.join(', '),
  prognosis_assessment: encounter.prognosis,

  // From clinician
  sender_name: currentUser.fullName,
  sender_title: currentUser.credentials,
  clinic_name: currentUser.clinic.name,
  clinic_phone: currentUser.clinic.phone
};
```

### Dashboard Integration

**Pending Messages View:**
```
┌──────────────────────────────────────────────────────────┐
│ DIALOGMELDINGER - UTKAST                                 │
├──────────────────────────────────────────────────────────┤
│ □ Kari Hansen - Henvisning smertestillende (2 timer)    │
│ □ Per Olsen - Info om sykmelding (1 dag)                │
│ ✓ Lisa Berg - Mistanke fraktur (SENDT - 22.11.2025)     │
└──────────────────────────────────────────────────────────┘
```

### Response Tracking

```sql
-- When GP responds
UPDATE patient_dialogue_messages
SET
  response_received = true,
  response_date = CURRENT_TIMESTAMP,
  response_summary = 'Takk for info. Har kalt inn pasient for konsultasjon.'
WHERE id = 'message-uuid';

-- Alert clinician
INSERT INTO notifications (user_id, type, message)
VALUES (
  'clinician-uuid',
  'dialogue_response',
  'Dr. Andersen har svart på din melding om Kari Hansen'
);
```

---

## Summary

The dialogue message system provides:

✅ **12 ready-to-use templates** for common clinical scenarios
✅ **Automatic variable population** from patient/encounter data
✅ **Clinical phrases library** with 50+ standardized terms
✅ **Draft-review-send workflow** preventing errors
✅ **Response tracking** for closed-loop communication
✅ **Urgency tagging** for prioritization

This ensures professional, consistent, and complete communication with GPs and specialists while saving clinician time and improving patient safety.

---

**End of Dialogue Messages Documentation**

*For questions: support@theBackROM.com*
*Standard: Norwegian Helsevesen Dialogmelding v1.1*
