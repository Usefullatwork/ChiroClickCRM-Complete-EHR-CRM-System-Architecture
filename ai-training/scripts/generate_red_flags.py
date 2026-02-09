#!/usr/bin/env python3
"""
Generate synthetic red flag detection training data for chiro-medical model.

Creates realistic clinical scenarios with and without red flags for:
- Cauda equina syndrome
- Cancer/malignancy
- Fracture
- Infection
- Vascular emergencies
- Progressive neurological deficit
- Inflammatory arthritis (red flags for AS etc.)

Output: ChatML format compatible with train_unsloth.py
"""

import json
import random
import sys
from pathlib import Path

SYSTEM_PROMPT_NO = (
    'Du er en medisinsk sikkerhetsrådgiver for kiropraktikk. '
    'Identifiser røde flagg, gi differensialdiagnostikk og klinisk resonnering. '
    'Prioriter alltid pasientsikkerhet.'
)

SYSTEM_PROMPT_EN = (
    'You are a medical safety advisor for chiropractic. '
    'Identify red flags, provide differential diagnosis and clinical reasoning. '
    'Always prioritize patient safety.'
)

# ============================================================
# Norwegian Red Flag Scenarios
# ============================================================

CAUDA_EQUINA_POSITIVE = [
    {
        'scenario': '48 år mann med akutt korsryggsmerte etter tung løfting. Nummenhet i perineum, urinretensjon, bilateral beinsvakhet.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mulig cauda equina syndrom.\n\nFunn:\n- Sadelanestesi (nummenhet i perineum)\n- Urinretensjon\n- Bilateral beinsvakhet\n\nAlle tre klassiske tegn på cauda equina syndrom er til stede. Dette er en akutt nevrokirurgisk nødsituasjon.\n\nHANDLING: Umiddelbar henvisning til akuttmottak/nevrokirurg. Ring 113. Ikke utfør manuell behandling. Dekompresjon bør skje innen 48 timer for best prognose.'
    },
    {
        'scenario': '55 år kvinne, kjent skiveprolaps L4-L5. Siste 2 dager: økende problemer med å kontrollere vannlating, nedsatt følelse rundt endetarmen, svakhet i begge bena.',
        'response': 'RØDE FLAGG IDENTIFISERT: Progressivt cauda equina syndrom.\n\nFunn:\n- Blæredysfunksjon (inkontinens/retensjon)\n- Perianal hypoestesi\n- Bilateral underekstremitetssvakhet\n- Kjent diskusprolaps (mulig forverring)\n\nProgressiv nevrologisk forverring med blære-/tarmdysfunksjon ved kjent prolaps krever akutt MR og nevrokirurgisk vurdering.\n\nHANDLING: Akutt henvisning. Ring 113. Pasienten skal IKKE manipuleres.'
    },
    {
        'scenario': '35 år mann med langvarig ryggsmerte. Nå akutt forverring med nummenhet i skrittet, klarer ikke å tisse, nedsatt analsfinktertonus.',
        'response': 'RØDE FLAGG IDENTIFISERT: Cauda equina syndrom - akutt presentasjon.\n\nFunn:\n- Sadelanestesi\n- Urinretensjon\n- Nedsatt analsfinktertonus\n\nKomplett cauda equina syndrom med urinretensjon har dårligere prognose enn inkomplett. Tidlig intervensjon er avgjørende.\n\nHANDLING: Ring 113 umiddelbart. Akutt MR og nevrokirurgisk tilsyn. Ingen manuell behandling.'
    },
    {
        'scenario': '62 år kvinne med gradvis økende rygg- og beinsmerter over 3 uker. Nå: bilateral isjiassmerte, nummenhet i innsiden av begge lår, manglende evne til å stoppe vannstrøm.',
        'response': 'RØDE FLAGG IDENTIFISERT: Sannsynlig cauda equina syndrom.\n\nFunn:\n- Bilateral radikulopati\n- Sadelparestesi (nummenhet mediale lår)\n- Blæredysfunksjon\n\nBilateral presentasjon med sadelanestesi og sfinkteraffeksjon er sterkt suspekt for cauda equina kompresjon.\n\nHANDLING: Akutt MR lumbalcolumna. Nevrokirurgisk tilsyn. Ikke utsett - ring 113.'
    },
]

CANCER_POSITIVE = [
    {
        'scenario': '65 år mann, eks-røyker. Korsryggsmerte de siste 3 månedene som forverres om natten. Uforklarlig vekttap på 8 kg. Tidligere kreftbehandling for prostatakreft.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om malign prosess/metastaser.\n\nFunn:\n- Alder >50 med ny ryggsmerte\n- Nattlig smerte (uavhengig av stilling)\n- Uforklarlig vekttap >5 kg\n- Tidligere malignitet (prostatakreft - vanlig skjelettmetastasekilde)\n\nProstatacancer er en av de vanligste kildene til skjelettmetastaser. Ryggsmerte som forverres om natten uten mekanisk komponent er suspekt.\n\nHANDLING: Akutt blodprøver (SR, CRP, ALP, PSA), MR columna, henvisning onkolog. Ikke manuell behandling før avklaring.'
    },
    {
        'scenario': '58 år kvinne med brystryggsmerte i 6 uker. Smerten er konstant, verst om natten, responderer ikke på stillingsendring. Uforklarlig tretthet, nedsatt appetitt.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om malignitet i torakalcolumna.\n\nFunn:\n- Alder >50 med ny torakalsmerter\n- Konstant smerte, verre om natten\n- Ingen mekanisk komponent\n- Konstitusjonelle symptomer (fatigue, anoreksi)\n\nTorakalcolumna er et vanlig sted for metastaser. Konstant, ikke-mekanisk smerte med systemiske symptomer krever utredning.\n\nHANDLING: Blodprøver (SR, CRP, hematologi), MR torakalcolumna, rtg thorax. Henvisning for videre utredning.'
    },
    {
        'scenario': '72 år mann, nattsvette siste måneden, smerter mellom skulderbladene som ikke bedres av behandling, vekttap, utmattelse.',
        'response': 'RØDE FLAGG IDENTIFISERT: Malignitetsmistanke.\n\nFunn:\n- Alder >50\n- Nattsvette (B-symptom)\n- Uforklarlig vekttap\n- Terapiresistente smerter\n- Utmattelse\n\nB-symptomer (nattsvette, vekttap, feber) kombinert med behandlingsresistente smerter krever rask utredning for hematologisk eller solid malignitet.\n\nHANDLING: Hastehenvisning fastlege/pakkeforløp kreft. Blodprøver, bildediagnostikk.'
    },
]

FRACTURE_POSITIVE = [
    {
        'scenario': '75 år kvinne med osteoporose. Akutt torakalsmerter etter å ha hostet kraftig. Sterkt perkusjonsøm over Th8. Forverring ved fleksjon.',
        'response': 'RØDE FLAGG IDENTIFISERT: Sannsynlig osteoporotisk kompresjonsfraktur.\n\nFunn:\n- Alder >70 med kjent osteoporose\n- Lavenergitraume (hoste)\n- Akutt debut\n- Perkusjonsømhet lokalisert til Th8\n\nOsteoporotiske kompresjonsbrudd kan oppstå ved minimal belastning. Hoste er tilstrekkelig mekanisme hos pasienter med kjent osteoporose.\n\nHANDLING: Røntgen torakalcolumna (ev. MR hvis negativ og sterk klinisk mistanke). Ingen manipulasjon av affisert segment. Smertelindring, ev. korsett.'
    },
    {
        'scenario': '45 år mann etter motorsykkelulykke for 2 dager siden. Nakkesmerter, redusert rotasjon. Ikke røntgen. Perkusjonsøm C2.',
        'response': "RØDE FLAGG IDENTIFISERT: Mulig cervikal fraktur etter høyenergitraume.\n\nFunn:\n- Høyenergitraume (MC-ulykke)\n- Nakkesmerter med bevegelsesrestriksjon\n- Fokal perkusjonsømhet C2\n- Ingen bildediagnostikk utført\n\nC2-frakturer (inkl. dens-fraktur, hangman's fraktur) er vanlige etter høyenergitraumer og kan være ustabile.\n\nHANDLING: INGEN manipulasjon. Akutt CT cervicalcolumna. Halsimmobilisering til fraktur er utelukket. Henvisning akuttmottak."
    },
    {
        'scenario': '80 år kvinne falt hjemme. Ryggsmerte siden fallet, forverring ved belastning. Langvarig kortisonbruk for revmatoid artritt. Øm ved perkusjon L1.',
        'response': 'RØDE FLAGG IDENTIFISERT: Sannsynlig fraktur.\n\nFunn:\n- Alder >65 med fall\n- Langvarig kortikosteroidbruk (sekundær osteoporose)\n- Mekanisk årsak (fall)\n- Fokal perkusjonsømhet L1\n\nKortikosteroidindusert osteoporose gir betydelig økt frakturrisiko. Torakolumbal overgang (Th12-L2) er mest utsatt.\n\nHANDLING: Røntgen lumbalcolumna. Smertelindring. Ingen manipulasjon. Vurder DEXA-scan hvis ikke utført.'
    },
]

INFECTION_POSITIVE = [
    {
        'scenario': '38 år mann, IV stoffbruker. Økende ryggsmerte siste 2 uker, feber 38.5°C, nattsvette. Sterkt palpasjonsøm L3-L4.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om spinal infeksjon (spondylodiskitt).\n\nFunn:\n- IV stoffbruk (risikofaktor for hematogen spredning)\n- Feber\n- Nattsvette\n- Progressivt forløp\n- Fokal ømhet L3-L4\n\nSpondylodiskitt/epiduralabscess krever rask diagnose for å unngå nevrologisk kompromittering.\n\nHANDLING: Akutte blodprøver (CRP, SR, leukocytter, blodkultur). MR lumbalcolumna med kontrast. Akutt henvisning. INGEN manuell behandling.'
    },
    {
        'scenario': '52 år kvinne, diabetes type 2. Gradvis økende nakkesmerter og stivhet siste 3 uker. Feber 38°C, forhøyet CRP 85. Smertene lindres ikke av hvile.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om cervikal infeksjon.\n\nFunn:\n- Immunsuppressiv tilstand (diabetes)\n- Feber\n- Forhøyet CRP (85 mg/L)\n- Progressiv forverring\n- Ingen mekanisk lindring\n\nDiabetespasienter har økt risiko for spinal infeksjon. Kombinasjonen av feber + forhøyet CRP + progressiv smerte er alarmerende.\n\nHANDLING: MR cervicalcolumna med kontrast, blodkulturer. Akutt henvisning infeksjonsmedisiner. Ingen manipulasjon.'
    },
]

VASCULAR_POSITIVE = [
    {
        'scenario': '42 år kvinne med akutt nakkesmerte og hodepine etter kiropraktorbehandling for 2 timer siden. Nå: ptose, miose, diplopi, ustø gange.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om vertebralarteriedisseksjon.\n\nFunn:\n- Akutt nakkesmerte etter manuell behandling\n- Horners syndrom (ptose, miose)\n- Diplopi\n- Ataksi\n\nKlassiske tegn på vertebrobasilær insuffisiens/disseksjon. Potensielt livstruende.\n\nHANDLING: Ring 113 umiddelbart. CT-angiografi/MR-angiografi. Pasienten skal IKKE bevege nakken. Legg pasienten ned, hold immobil.'
    },
    {
        'scenario': '55 år mann med plutselig intens hodepine ved nakkemanipolasjon. \"Verste hodepine i mitt liv.\" Kvalme, nakkestivhet.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om subaraknoidalblødning/vaskulær hendelse.\n\nFunn:\n- Thunderclap-hodepine (\"verste hodepine\")\n- Akutt debut ved manuell intervensjon\n- Kvalme\n- Nakkestivhet (meningisme)\n\nThunderclap-hodepine krever umiddelbar utelukkelse av subaraknoidalblødning.\n\nHANDLING: Ring 113. CT caput akutt. Ikke beveg pasienten. Avslutt all behandling umiddelbart.'
    },
]

PROGRESSIVE_NEURO_POSITIVE = [
    {
        'scenario': '50 år mann med gradvis økende svakhet i høyre fot siste 2 uker. Drop-foot utviklet. Nedsatt senerefleks i høyre ankel. Korsryggsmerte.',
        'response': 'RØDE FLAGG IDENTIFISERT: Progressivt nevrologisk utfall.\n\nFunn:\n- Progressiv motorisk svakhet (droppfot)\n- Utvikling over 2 uker\n- Nedsatt ankelrefleks\n- Trolig L5 radikulopati med progressjon\n\nProgressivt motorisk utfall krever akutt utredning for å unngå permanent nevrologisk skade.\n\nHANDLING: Akutt MR lumbalcolumna. Nevrokirurgisk vurdering. Behandling avhenger av årsak men bør ikke forsinkes.'
    },
    {
        'scenario': '44 år kvinne med gradvis klossete hender siste 3 måneder. Problemer med å kneppe knapper. Også ustø gange. MR nakke ikke tatt.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om cervikal myelopati.\n\nFunn:\n- Progressiv finmotorikk-svikt (knappetest)\n- Gangataksi\n- Gradvis forløp\n\nKombinasjon av øvre og nedre motornevronutfall (håndfunksjon + gange) er klassisk for cervikal myelopati. Kan skyldes cervikal stenose eller diskusherniering med medullakompresjon.\n\nHANDLING: Akutt MR cervicalcolumna. Henvisning nevrokirurg. INGEN cervikal manipulasjon. Forsiktig håndtering.'
    },
]

INFLAMMATORY_POSITIVE = [
    {
        'scenario': '22 år mann med gradvis økende korsryggsmerter siste 2 år. Verst om morgenen med >1 time morgenstivhet. Bedres med aktivitet. Nattlige smerter. Positiv HLA-B27.',
        'response': 'Klinisk bilde forenlig med aksial spondyloartritt (mulig Bekhterevs sykdom).\n\nFunn:\n- Ung mann <40 år\n- Insidiøs debut >3 måneder\n- Morgenstivhet >30 minutter\n- Bedring med aktivitet, forverring i hvile\n- Nattlige smerter\n- HLA-B27 positiv\n\nOppfyller ASAS-kriterier for inflammatorisk ryggsmerte. Bør utredes for aksial spondyloartritt.\n\nHANDLING: Henvisning revmatolog. MR sacroiliacaledd. Blodprøver (CRP, SR). Kiropraktisk behandling kan fortsette som supplement, men diagnose og eventuell medikamentell behandling bør initieres av revmatolog.'
    },
]

# ============================================================
# Negative Scenarios (No Red Flags)
# ============================================================

NEGATIVE_SCENARIOS = [
    {
        'scenario': '35 år kvinne med mekanisk korsryggsmerte etter hagearbeid. Smertene er lokalisert til nedre rygg, verst ved fleksjon. Ingen utstråling. Normal nevrologisk undersøkelse.',
        'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Akutt mekanisk korsryggsmerte (lumbago).\n\nFunn:\n- Ung pasient uten risikofaktorer\n- Klar mekanisk utløsende årsak\n- Lokaliserte smerter uten utstråling\n- Normal nevrologi\n\nTrygt å behandle med manuell terapi. Anbefal aktivitet etter toleranse, unngå langvarig sengeleie. Forventet bedring innen 2-6 uker.'
    },
    {
        'scenario': '28 år mann med nakkestivhet og hodepine etter lang arbeidsdag foran PC. Ingen traume. Full bevegelsesutslag med noe smerter. Normal kraft og sensibilitet i armer.',
        'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Spenningshodepine med myofascielle nakkesmerter.\n\nFunn:\n- Ung pasient\n- Klar ergonomisk utløsende årsak\n- Full ROM (med smerte)\n- Normal nevrologi\n\nTrygt å behandle med manuell terapi, triggerpunktbehandling, og ergonomisk rådgivning. Vurder øvelser for nakke/skulder.'
    },
    {
        'scenario': '42 år kvinne med kronisk skuldersmerte, verre ved overhead-aktiviteter. Positiv Hawkins test, Neer test. Full kraft. Ingen nattlige smerter.',
        'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Subacromial impingement syndrom.\n\nFunn:\n- Mekanisk smerte ved spesifikke bevegelser\n- Positive provokasjonstester for impingement\n- Normal kraft (ingen rotator cuff-ruptur mistanke)\n- Ingen nattlige/systemiske symptomer\n\nTrygt å behandle konservativt med øvelser, manuell terapi og aktivitetsmodifisering.'
    },
    {
        'scenario': '55 år mann med kne-smerter medialt, gradvis debut over 6 måneder. Verst ved trapper og ved oppstart etter hvile. Krepitasjon palperes. BMI 28.',
        'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Medial gonartrose (kneartrose).\n\nFunn:\n- Gradvis debut\n- Mekanisk smertemønster (oppstartssmerte, trapper)\n- Krepitasjon\n- Aldersgruppe og BMI forenlig med degenerativ lidelse\n\nTrygt å behandle konservativt. Anbefal vektreduksjon, quadriceps-styrke, og aktivitetstilpasning.'
    },
    {
        'scenario': '30 år mann med akutt torticollis etter å ha sovet i uvanlig stilling. Redusert rotasjon til venstre, ellers uaffisert. Ingen traume.',
        'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Akutt torticollis (stiv nakke/\"vonde nakke\").\n\nFunn:\n- Klar utløsende årsak (søvnstilling)\n- Ensidig bevegelsesrestriksjon\n- Ingen nevrologi\n- Ingen traume\n\nTrygt å behandle med forsiktig mobilisering, varme, og aktive bevegelsesøvelser. Bedring forventes innen dager.'
    },
    {
        'scenario': '38 år kvinne med unilateral isjiassmerte ned til legg etter løfting. Positiv Lasègue 45°. Nedsatt akillesrefleks høyre. Stabil. NRS 6/10.',
        'response': 'Ingen røde flagg identifisert. OBS: Monitorér for progresjon.\n\nKlinisk bilde: Lumbal radikulopati, sannsynlig L5-S1.\n\nFunn:\n- Klar mekanisk årsak\n- Unilateral utstråling\n- Positiv SLR (Lasègue)\n- Isolert refleksendring (ikke progressiv)\n- NRS 6/10 (moderat-sterk smerte)\n\nKonservativ behandling er førstevalg. Overvåk for: bilateralisering, blære-/tarmsymptomer, progressiv svakhet. Revurder etter 4-6 uker.'
    },
    {
        'scenario': '60 år kvinne med thorakalsmerter relatert til costovertebralleddet Th5-6 venstre side. Smerte ved dyp inspirasjon og rotasjon. Ingen kardiale symptomer.',
        'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Costovertebral leddysfunksjon Th5-6.\n\nFunn:\n- Mekanisk smertemønster\n- Reproduserbar ved palpasjon/bevegelse\n- Ingen kardiale symptomer\n- Inspirasjonssmerter forenlig med costovertebral dysfunksjon\n\nTrygt å behandle med torakal manipulasjon/mobilisering. Ved kvinner >50 med venstresidige thorakalsmerter, vurder alltid kardial årsak, men mekanisk reproduserbarhet gjør dette mindre sannsynlig.'
    },
    {
        'scenario': '25 år mann, skiløper. Knesmerter lateralt etter langtur. Øm over tractus iliotibialis distalt. Positiv Ober test. Normal leddbåndsstabilitet.',
        'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Iliotibial band-syndrom (ITBS/løperkne).\n\nFunn:\n- Overbelastningsrelatert\n- Typisk lokalisasjon\n- Positiv spesifikk test\n- Normal stabilitet\n\nTrygt å behandle konservativt. Anbefal relativ hvile, tøyning ITB/gluteus medius-styrke, gradvis retur til aktivitet.'
    },
    {
        'scenario': '48 år mann med tennisalbue. Smerte laterale epikondyl 3 måneder. Positiv Cozen test. Full ROM albue. Grip-styrke nedsatt vs. frisk side.',
        'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Lateral epikondylalgi (tennisalbue).\n\nFunn:\n- Gradvis debut, overbelastningsrelatert\n- Positiv provokasjonstest\n- Full ROM\n- Isolert gripesvekkelse (ikke nevrologisk)\n\nTrygt å behandle konservativt. Eksentriske øvelser, ergonomisk tilpasning, ev. støtbånd. Langsom bedring (3-12 mnd).'
    },
    {
        'scenario': '33 år kvinne, kontorarbeid. Bilateral skulder- og nakkesmerte. Triggerpunkter i trapezius bilateralt. Stressrelatert. Normal nevrologi. Sovner dårlig.',
        'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Myofascielt smertesyndrom, stressrelatert.\n\nFunn:\n- Bilateral, symmetrisk presentasjon\n- Triggerpunkter i typisk lokalisasjon\n- Klar psykososial komponent (stress, søvn)\n- Normal nevrologi\n\nTrygt å behandle med triggerpunktbehandling, ergonomisk rådgivning, stressmestring. Adresser søvnhygiene.'
    },
]

# ============================================================
# English Scenarios
# ============================================================

EN_POSITIVE = [
    {
        'scenario': 'Assess red flags: 60-year-old male, new onset low back pain, history of prostate cancer, unintentional weight loss 6 kg in 2 months, night pain.',
        'response': 'RED FLAGS IDENTIFIED: Suspected spinal metastasis.\n\nFindings:\n- Age >50 with new back pain\n- History of malignancy (prostate cancer - common source of bone metastases)\n- Unintentional weight loss\n- Night pain (non-mechanical)\n\nACTION: Urgent blood work (ESR, CRP, ALP, PSA), MRI spine, oncology referral. No manual treatment until cleared.'
    },
    {
        'scenario': 'Assess red flags: 40-year-old female, bilateral leg weakness developing over 1 week, difficulty urinating, numbness in perineal area.',
        'response': 'RED FLAGS IDENTIFIED: Cauda equina syndrome.\n\nFindings:\n- Bilateral lower extremity weakness (progressive)\n- Urinary dysfunction\n- Saddle anesthesia\n\nACTION: Call emergency services immediately. Urgent MRI lumbar spine. Neurosurgical consultation. Do NOT perform any manual treatment.'
    },
    {
        'scenario': 'Assess red flags: 30-year-old male, acute neck pain after gym. Reduced ROM right rotation. No trauma. Normal neuro exam. No headache.',
        'response': 'No red flags identified.\n\nClinical picture: Acute mechanical neck pain, likely facet or muscular strain.\n\nFindings:\n- Young patient\n- Clear mechanical trigger\n- Unilateral restriction\n- Normal neurology\n- No concerning features\n\nSafe to treat conservatively with manual therapy, gentle mobilization, and progressive exercises.'
    },
    {
        'scenario': 'Assess red flags: 68-year-old female on long-term corticosteroids, acute thoracic pain after bending forward, point tenderness T12, no neurological deficit.',
        'response': 'RED FLAGS IDENTIFIED: Likely osteoporotic compression fracture.\n\nFindings:\n- Age >65\n- Long-term corticosteroid use (secondary osteoporosis)\n- Low-energy mechanism\n- Focal point tenderness\n\nACTION: X-ray thoracolumbar spine. No manipulation of affected segment. Pain management. Consider DEXA scan. Referral for osteoporosis management.'
    },
]

# ============================================================
# Differential Diagnosis Scenarios
# ============================================================

DIFFERENTIAL_SCENARIOS_NO = [
    {
        'scenario': 'Differensialdiagnostikk: 45 år mann med akutt nakkesmerte og høyre arm utstråling til C6 dermatom. Positiv Spurling test høyre. Nedsatt bicepsrefleks.',
        'response': 'Differensialdiagnoser (rangert etter sannsynlighet):\n\n1. Cervikal radikulopati C5-C6 (mest sannsynlig)\n   - Positiv Spurling, dermatomal utstråling, refleksendring\n   - Sannsynlig cervikal diskusherniering\n\n2. Cervikal spondylotisk radikulopati\n   - Degenerativ foraminal stenose\n   - Mer gradvis debut typisk\n\n3. Perifer nerveentrapment (sjeldnere)\n   - Supraskapulær nerve eller andre perifere kompresjon\n\nRøde flagg-screening: Ingen røde flagg identifisert.\n\nAnbefaling: Konservativ behandling i 6-8 uker. MR cervikal ved manglende bedring eller progresjon. Monitorér kraft C6 myotom (biceps, håndleddsekstensjon).'
    },
    {
        'scenario': 'Differensialdiagnostikk: 50 år kvinne med bilateral knesmerter, morgenstivhet >30 min, hevelse begge knær, tretthet.',
        'response': 'Differensialdiagnoser (rangert etter sannsynlighet):\n\n1. Revmatoid artritt (RA)\n   - Bilateral, symmetrisk leddaffeksjon\n   - Morgenstivhet >30 min (inflammatorisk mønster)\n   - Systemiske symptomer (fatigue)\n\n2. Psoriasisartritt\n   - Kan gi lignende bilde\n   - Se etter hudfunn\n\n3. Bilateral gonartrose\n   - Sjeldnere med uttalt morgenstivhet >30 min og hevelse\n\nRøde flagg-screening: Ingen akutte røde flagg, men inflammatorisk artritt krever tidlig diagnostikk.\n\nAnbefaling: Blodprøver (anti-CCP, RF, CRP, SR). Henvisning revmatolog. Kiropraktisk behandling kan fortsette som supplement.'
    },
]


def generate_all_examples():
    """Generate all training examples."""
    examples = []

    def add(scenario_list, lang='no'):
        for item in scenario_list:
            sys_prompt = SYSTEM_PROMPT_NO if lang == 'no' else SYSTEM_PROMPT_EN
            prefix = 'Vurder røde flagg: ' if lang == 'no' else 'Assess red flags: '

            # If scenario doesn't start with the prefix, add it
            scen = item['scenario']
            if not scen.startswith(prefix) and not scen.startswith('Differensial'):
                scen = prefix + scen

            examples.append({
                "messages": [
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": scen},
                    {"role": "assistant", "content": item['response']}
                ]
            })

    # Positive red flag scenarios (Norwegian)
    add(CAUDA_EQUINA_POSITIVE, 'no')
    add(CANCER_POSITIVE, 'no')
    add(FRACTURE_POSITIVE, 'no')
    add(INFECTION_POSITIVE, 'no')
    add(VASCULAR_POSITIVE, 'no')
    add(PROGRESSIVE_NEURO_POSITIVE, 'no')
    add(INFLAMMATORY_POSITIVE, 'no')

    # Negative scenarios (Norwegian)
    add(NEGATIVE_SCENARIOS, 'no')

    # English scenarios
    add(EN_POSITIVE, 'en')

    # Differential diagnosis
    add(DIFFERENTIAL_SCENARIOS_NO, 'no')

    return examples


def main():
    examples = generate_all_examples()

    # Output directory
    script_dir = Path(__file__).parent.parent
    output_dir = script_dir / 'data' / 'mined'
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / 'red-flags-synthetic.jsonl'
    with open(output_file, 'w', encoding='utf-8') as f:
        for ex in examples:
            f.write(json.dumps(ex, ensure_ascii=False) + '\n')

    # Count positive vs negative
    positive = sum(1 for ex in examples
                   if 'RØDE FLAGG' in ex['messages'][-1]['content']
                   or 'RED FLAGS' in ex['messages'][-1]['content']
                   or 'Differensial' in ex['messages'][1]['content'])
    negative = len(examples) - positive

    print(f"Generated {len(examples)} red flag training examples")
    print(f"  Positive (red flags present): {positive}")
    print(f"  Negative (no red flags): {negative}")
    print(f"  Output: {output_file}")

    # Print sample
    print(f"\n--- Sample positive example ---")
    print(json.dumps(examples[0], ensure_ascii=False, indent=2)[:400])
    print(f"\n--- Sample negative example ---")
    for ex in examples:
        if 'Ingen røde flagg' in ex['messages'][-1]['content']:
            print(json.dumps(ex, ensure_ascii=False, indent=2)[:400])
            break


if __name__ == '__main__':
    main()
