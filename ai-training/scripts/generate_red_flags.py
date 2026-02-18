#!/usr/bin/env python3
"""
Generate synthetic red flag detection training data for chiro-medical model.

Creates realistic clinical scenarios with and without red flags for:
- Cauda equina syndrome
- Cancer/malignancy
- Fracture
- Infection (spinal, epidural abscess)
- Vascular emergencies (dissection, SAH, DVT)
- Progressive neurological deficit
- Inflammatory arthritis (AS, RA, PMR, reactive)
- Pediatric red flags
- Cardiac mimickers
- Abdominal/visceral referred pain
- Medication/anticoagulant risks
- Temporal arteritis / GCA
- Acute spinal cord compression
- Subtle/borderline presentations

Output: ChatML format compatible with train_unsloth.py

Target: 200+ examples (balanced positive/negative, NO+EN)
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
# NORWEGIAN RED FLAG SCENARIOS — POSITIVE
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
    {
        'scenario': '40 år mann med kjent stor sentral prolaps L3-L4. Våknet i natt med svakhet i begge ben og vanskeligheter med å starte vannlating. Nummenhet rundt anus.',
        'response': 'RØDE FLAGG IDENTIFISERT: Akutt cauda equina syndrom - inkomplett.\n\nFunn:\n- Kjent sentral prolaps (risikofaktor)\n- Akutt bilateral motorisk affeksjon\n- Urinretensjon (hesitasjon)\n- Perianal parestesier\n\nInkomplett CES (med noe sfinkterrestfunksjon) har bedre prognose ved rask intervensjon enn komplett CES.\n\nHANDLING: Akutt MR lumbalcolumna. Nevrokirurgisk vurdering for dekompresjon innen 24 timer. Ring 113. Ingen manuell behandling.'
    },
    {
        'scenario': '58 år kvinne med gradvis forverring av isjiassmerte bilateralt over 1 uke. Merker at hun ikke kjenner toalettpapir ved tørking. Frekvens på vannlating endret.',
        'response': 'RØDE FLAGG IDENTIFISERT: Tidlige tegn på cauda equina syndrom.\n\nFunn:\n- Bilateral isjiassmerte (progressiv)\n- Nedsatt perianal sensibilitet\n- Endret blærefunksjon\n\nSubtile tidlige tegn som endret toalettfølelse og blærefrekvens kan være tidlige CES-manifestasjoner. Tidlig diagnostikk er kritisk.\n\nHANDLING: Akutt MR lumbalcolumna. Ikke vent på full blæreretensjon. Nevrokirurgisk tilsyn samme dag.'
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
    {
        'scenario': '68 år mann med økende korsryggsmerte over 2 måneder. Konstant smerte, også om natten. Nylig funnet anemi ved rutinemåling. SR 95.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om myelomatose eller metastase.\n\nFunn:\n- Alder >50 med progressiv smerte\n- Nattlig/konstant smerte\n- Anemi av ukjent årsak\n- Markant forhøyet SR (95 mm/t)\n\nAnemi + forhøyet SR + ryggsmerte hos eldre er klassisk for myelomatose (beinmargskreft). Også metastaser fra lunge, bryst, nyre må vurderes.\n\nHANDLING: Blodprøver (totalprotein, elektroforese, fritt lett-kjeder, kalsium, kreatinin). MR columna. Hastehenvisning hematolog.'
    },
    {
        'scenario': '55 år kvinne, røyker 20 år. Ny skuldersmerte og torakalsmerter etter 4 uker kiropraktisk behandling uten bedring. Hoste, tungpustenhet.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om lungekreft med thorax-affeksjon.\n\nFunn:\n- Langvarig røykehistorie\n- Behandlingsresistente skulder-/torakalsmerter\n- Respiratoriske symptomer (hoste, dyspné)\n- Ingen bedring etter 4 uker konservativ behandling\n\nPancoast-tumor (lungetoppkreft) kan presentere som skulder-/armsmerte. Vedvarende hoste + skuldersmerte hos røyker er alarmsignal.\n\nHANDLING: Rtg thorax, CT thorax, henvisning lungelege. Stopp manuell behandling til avklart.'
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
    {
        'scenario': '19 år gutt, cricket-spiller. Gradvis økende korsryggsmerte siste 6 måneder, verst ved ekstensjon og rotasjon. Perkusjonsøm over L5. Smerter ved ett-bens hyperekstensjon.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om stressfraktur/spondylolyse.\n\nFunn:\n- Ung utøver med repetitiv hyperekstensjon\n- Progressiv smerte over måneder\n- Verst ved ekstensjon og rotasjon\n- Fokal perkusjonsømhet L5\n- Positiv ett-bens hyperekstensjonstest\n\nSpondylolyse (stressfraktur i pars interarticularis) er vanlig hos unge med repetitiv ekstensjon (cricket, gymnastikk, tennis).\n\nHANDLING: Rtg lumbal med skråprojeksjoner, ev. CT/MR for occult fraktur. Aktivitetsrestriksjon. Ingen manipulasjon av affisert segment.'
    },
    {
        'scenario': '70 år mann med akutt innsettende kraftige ryggsmerter etter å ha løftet koffert. Tidligere ukjent osteoporose. Uttalt perkusjonsømhet Th12. Kan ikke sitte oppreist.',
        'response': 'RØDE FLAGG IDENTIFISERT: Sannsynlig akutt kompresjonsfraktur.\n\nFunn:\n- Alder >65\n- Akutt debut ved moderat belastning\n- Sterk fokal perkusjonsømhet\n- Funksjonelt begrenset\n\nMenn >65 har også risiko for osteoporotiske frakturer. Løfting kan utløse fraktur ved ukjent osteoporose.\n\nHANDLING: Rtg torakolumbal. Smertelindring. Ingen manipulasjon. Vurder DEXA-scan, kalsium/D-vitamin.'
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
    {
        'scenario': '60 år mann, 3 uker etter ryggoperasjon. Økende smerter i operasjonsområdet, feber, rødhet og varme lokalt. CRP stigende.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om postoperativ spinal infeksjon.\n\nFunn:\n- Nylig spinalkirurgi (risikofaktor)\n- Febril\n- Lokale infeksjonstegn (rubor, calor)\n- Stigende inflammasjonsmarkører\n\nPostoperativ spondylodiskitt eller sårinfeksjon krever rask diagnostikk og behandling.\n\nHANDLING: Kontakt opererende avdeling umiddelbart. Blodkulturer, MR med kontrast. INGEN manuell behandling i operasjonsområdet.'
    },
    {
        'scenario': '45 år mann, immunsupprimert (organtransplantert). 6 uker med gradvis forverring av torakalsmerter, nattlige smerter, mild feber. Forhøyet CRP 45, SR 60.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om opportunistisk spinal infeksjon.\n\nFunn:\n- Immunsuppresjon (transplantasjon)\n- Langvarig progressivt forløp\n- Nattlige smerter\n- Lavgradig feber\n- Forhøyede inflammasjonsmarkører\n\nImmunsupprimerte pasienter er utsatt for atypiske infeksjoner (TB, soppspondylitt). Symptomene kan være subtile.\n\nHANDLING: MR torakalcolumna med kontrast. Bred infeksjonsutredning (TB-prøver, soppantigen). Henvisning infeksjonsmedisiner.'
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
    {
        'scenario': '38 år mann med ensidig nakkesmerte og hodepine etter treningsøkt. Nå: sløret syn, nedsatt pulserende smerte bak høyre øye, Horners syndrom høyre.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om cervikal arteria carotis interna-disseksjon.\n\nFunn:\n- Unilateral nakkesmerte med ipsilateral hodepine\n- Horners syndrom (sympatisk nerveaffeksjon)\n- Visuell forstyrrelse\n- Fysisk aktivitet som utløsende faktor\n\nCarotisdisseksjon kan gi slag. Horners syndrom + ipsilateral hodepine er klassisk presentasjon.\n\nHANDLING: Ring 113. CT-angiografi eller MR-angiografi av halskar. Antikoagulasjonsbehandling vurderes akutt.'
    },
    {
        'scenario': '50 år kvinne med plutselig kraftig hodepine, synsforstyrrelser, forvirring og hemiplegi venstre side under behandling.',
        'response': 'RØDE FLAGG IDENTIFISERT: Akutt cerebrovaskulær hendelse (slag).\n\nFunn:\n- Akutt debut av nevrologiske utfall\n- Hemiplegi (ensidig lammelse)\n- Synsforstyrrelser\n- Forvirring\n- Hodepine\n\nAkutt slag krever umiddelbar behandling. Trombolyse har tidsbegrensning (4.5 timer).\n\nHANDLING: Ring 113 UMIDDELBART. FAST-test (Fjes, Arm, Språk, Tid). Legg pasienten ned med hevet hode. Avslutt all behandling.'
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
    {
        'scenario': '32 år kvinne med tilbakevendende nummenhet og prikking i forskjellige ekstremiteter over 6 måneder. Nå: synstap på venstre øye 3 dager, tretthet, ustø gange.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om multippel sklerose (MS).\n\nFunn:\n- Tilbakevendende, fluktuerende nevrologiske symptomer\n- Multifokale utfall (sensorisk, visuelt, motorisk)\n- Optisk nevritt (akutt synstap)\n- Ung kvinne (demografisk risiko)\n- Ataksi\n\nKombinasjon av utfall spredt i tid og sted er klassisk for MS.\n\nHANDLING: Akutt MR cerebrum + cervikalcolumna med kontrast. Henvisning nevrolog. Behandling av eventuell akutt episode med høydose steroider.'
    },
    {
        'scenario': '60 år mann med gradvis økende svakhet i begge hender, muskelatrofi i thenar, fascikulasjoner i armer. Hyperrefleksi i bena. Normal sensibilitet.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om motonevronsykdom (ALS).\n\nFunn:\n- Progressiv motorisk svakhet (øvre ekstremiteter)\n- Muskelatrofi (nedre motornevron)\n- Fascikulasjoner\n- Hyperrefleksi (øvre motornevron)\n- Intakt sensibilitet\n\nKombinasjon av øvre og nedre motornevrontegn uten sensorisk affeksjon er klassisk for ALS.\n\nHANDLING: Akutt henvisning nevrolog. EMG/nevrografi. Stoppall cervikal manipulasjon (kan forverre eventuelle kompresjonsfunn).'
    },
]

INFLAMMATORY_POSITIVE = [
    {
        'scenario': '22 år mann med gradvis økende korsryggsmerter siste 2 år. Verst om morgenen med >1 time morgenstivhet. Bedres med aktivitet. Nattlige smerter. Positiv HLA-B27.',
        'response': 'Klinisk bilde forenlig med aksial spondyloartritt (mulig Bekhterevs sykdom).\n\nFunn:\n- Ung mann <40 år\n- Insidiøs debut >3 måneder\n- Morgenstivhet >30 minutter\n- Bedring med aktivitet, forverring i hvile\n- Nattlige smerter\n- HLA-B27 positiv\n\nOppfyller ASAS-kriterier for inflammatorisk ryggsmerte. Bør utredes for aksial spondyloartritt.\n\nHANDLING: Henvisning revmatolog. MR sacroiliacaledd. Blodprøver (CRP, SR). Kiropraktisk behandling kan fortsette som supplement, men diagnose og eventuell medikamentell behandling bør initieres av revmatolog.'
    },
    {
        'scenario': '70 år kvinne med akutt bilateral skulder- og hoftestivhet. Morgenstivhet >1 time. Uttalt tretthet. SR 85, CRP 50. Ingen muskelsvakhet.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om polymyalgia rheumatica (PMR).\n\nFunn:\n- Alder >65\n- Bilateral proksimal stivhet (skuldre + hofter)\n- Uttalt morgenstivhet\n- Kraftig forhøyede inflammasjonsmarkører\n- Systemisk sykdomsfølelse\n\nPMR krever rask diagnostikk. OBS: 15-20% av PMR-pasienter utvikler kjempecellearteritt (GCA).\n\nHANDLING: Hastehenvisning revmatolog/fastlege. Blodprøver bekrefter diagnosen. Behandling med prednisolon gir ofte dramatisk bedring innen 24-48 timer.'
    },
    {
        'scenario': '28 år mann med akutt kneleddhevelse, urethritt og konjunktivitt 3 uker etter gastroenteritt. Også sakroiliitt-smerter.',
        'response': 'Klinisk bilde forenlig med reaktiv artritt (Reiters syndrom).\n\nFunn:\n- Klassisk triade: artritt, urethritt, konjunktivitt\n- Foregående infeksjon (gastroenteritt)\n- Ung mann\n- Sakroiliakaledsmerter (aksial affeksjon)\n\nReaktiv artritt er en seronegativ spondyloartropati utløst av urogenital eller gastrointestinal infeksjon.\n\nHANDLING: Blodprøver (CRP, SR, HLA-B27), leddpunksjon for utelukkelse av septisk artritt. Henvisning revmatolog.'
    },
    {
        'scenario': '45 år mann med hudplakk i albueregionen, asymmetrisk finger- og tåleddhevelse, sausagefingers (daktylitt), negledystrofi.',
        'response': 'Klinisk bilde forenlig med psoriasisartritt.\n\nFunn:\n- Psoriasiplakk (hud)\n- Asymmetrisk oligoartritt\n- Daktylitt (pølsefingre)\n- Negleforandringer (dystrofi)\n\nPsoriasisartritt kan affisere perifere ledd, aksiale ledd og enthesier. Daktylitt er nesten patognomonisk.\n\nHANDLING: Henvisning revmatolog. Rtg hender/føtter. Blodprøver (CRP, RF negativ typisk). Kiropraktisk behandling kan fortsette for aksiale plager.'
    },
]

# ============================================================
# NEW CATEGORIES — NORWEGIAN POSITIVE
# ============================================================

PEDIATRIC_RED_FLAGS = [
    {
        'scenario': '14 år jente med konstant torakalsmerter i 3 måneder. Smertene er verre om natten. Nedsatt appetitt, uforklarlig tretthet. Skoliose som har forverret seg raskt.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om malignitet hos barn (Ewings sarkom, osteosarkom).\n\nFunn:\n- Barn med konstant, nattlig smerte\n- Konstitusjonelle symptomer (anoreksi, fatigue)\n- Raskt progredierende skoliose (kan indikere intramedullær patologi)\n\nKonstant nattlig ryggsmerte hos barn/ungdom er rødt flagg. Osteoid osteom og Ewings sarkom er viktige differensialdiagnoser.\n\nHANDLING: Akutt blodprøver, MR torakalcolumna. Hastehenvisning barnelege/barneortoped. INGEN manipulasjon.'
    },
    {
        'scenario': '8 år gutt med korsryggsmerte i 2 uker. Nekter å leke, halter. Feber 37.8°C. Foreldrene merker at han er mer sliten enn vanlig.',
        'response': 'RØDE FLAGG IDENTIFISERT: Ryggsmerte hos barn <10 år er alltid rødt flagg.\n\nFunn:\n- Barn under 10 år med vedvarende ryggsmerte\n- Lavgradig feber\n- Funksjonsbegrensning (nekter å leke, halting)\n- Systemiske symptomer (fatigue)\n\nRyggsmerte hos barn <10 år er uvanlig og krever alltid utredning. Differensialdiagnoser: infeksjon (diskitt, osteomyelitt), tumor, leukemi.\n\nHANDLING: Akutt blodprøver (CRP, SR, hematologi). MR columna. Henvisning barnelege. INGEN manuell behandling.'
    },
    {
        'scenario': '16 år gutt, fotballspiller. Gradvis økende korsryggsmerte 4 måneder. Smerter ved ekstensjonsbelastning. Fokal perkusjonsømhet L5. Stiv hamstrings bilateralt.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om spondylolyse/spondylolisthese.\n\nFunn:\n- Ung utøver med aktivitetsrelatert ryggsmerte\n- Verst ved ekstensjon\n- Fokal ømhet L5 (vanligste nivå)\n- Stramme hamstrings (kompensatorisk)\n\nSpondylolyse er stressfraktur i pars interarticularis. Vanlig hos unge utøvere med repetitiv ekstensjon (fotball, turn, svømming).\n\nHANDLING: Rtg lumbal med skråprojeksjoner. CT eller MR ved negativ rtg. Aktivitetsmoderasjon. Ikke manipuler L5-segmentet. Henvisning idrettsmedisiner.'
    },
    {
        'scenario': '12 år jente med akutt torticollis i 5 dager, responderer ikke på behandling. Feber 38.2°C. Svelgvansker. Hevelse i nakken lateralt.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om retrofaryngeal abscess eller cervikal infeksjon.\n\nFunn:\n- Barn med vedvarende torticollis (>3 dager)\n- Behandlingsresistent\n- Feber\n- Svelgvansker (dysfagi)\n- Lateral hevelse i nakken\n\nRetrofaryngeal abscess kan gi torticollis med dysfagi hos barn. Potensielt livstruende ved luftveiskompresjon.\n\nHANDLING: Akutt CT nakke med kontrast. Blodprøver. Akutt ØNH-vurdering. INGEN manipulasjon. Ring 113 ved respirasjonsvansker.'
    },
    {
        'scenario': '6 år gutt med nakkesmerter etter trampoline-hopp. Normal kraft i armer. Foreldrene rapporterer kortvarig nummenhet i armene som gikk over. Nek perkusjonsøm C4.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om cervikal skade hos barn.\n\nFunn:\n- Traume-mekanisme (trampoline = aksial belastning)\n- Transient nevrologisk utfall (forbigående nummenhet i armer)\n- Fokal perkusjonsømhet C4\n- Barns cervicalcolumna er anatomisk mer sårbar (ligamentær laxitet, stort hode)\n\nTransient nevrologisk utfall etter traume kan indikere ustabil skade eller forbigående medullakompresjon (SCIWORA).\n\nHANDLING: Immobiliser cervicalcolumna. Akutt CT og MR. INGEN manipulasjon. Barnelege/barneortoped. Ring 113.'
    },
]

CARDIAC_MIMICKERS = [
    {
        'scenario': '55 år mann med venstresidige thorakalsmerter som stråler til venstre arm og kjeve. Ble svett og uvel under behandling. Blodtrykk 90/60.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om akutt koronarsyndrom (hjerteinfarkt).\n\nFunn:\n- Venstresidige brystsmerter med utstråling til arm og kjeve\n- Autonome symptomer (svetting, malaise)\n- Hypotensjon (BT 90/60)\n\nKlassisk presentasjon av akutt myokardinfarkt. Thorakalsmerter med autonome symptomer er alltid hjerteinfarkt til det motsatte er bevist.\n\nHANDLING: Ring 113 UMIDDELBART. Gi 300 mg aspirin om tilgjengelig. Legg pasienten ned med hevet hode. Overvåk pust og bevissthet. AVSLUTT all behandling.'
    },
    {
        'scenario': '48 år kvinne med plutselig kraftig brystsmerte og ryggsmerte mellom skulderbladene. \"Rivende\" smerte. BT-forskjell mellom armene (150/90 vs 120/70).',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om aortadisseksjon.\n\nFunn:\n- Akutt, rivende bryst-/ryggsmerte\n- BT-asymmetri mellom armer (>20 mmHg systolisk)\n- Plutselig debut\n\nAortadisseksjon er akutt livstruende. \"Rivende\" smerte mellom skulderbladene er klassisk. BT-forskjell bekrefter mistanke.\n\nHANDLING: Ring 113 UMIDDELBART. CT-angiografi aorta. Pasienten skal holdes i ro. Blodtrykkskontroll kritisk.'
    },
    {
        'scenario': '62 år mann med dyspné, takykardi, ensidig leggsmerte etter lang flyreise. Thorakalsmerter ved dyp inspirasjon. Hoste.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om lungeemboli (LE).\n\nFunn:\n- Risikofaktorer (lang flyreise = immobilisering)\n- Dyspné og takykardi\n- Pleuritiske brystsmerter\n- Ensidig leggsmerte (mulig DVT)\n\nLungeemboli kan presentere som thorakalsmerter og forveksles med muskuloskeletale plager.\n\nHANDLING: Ring 113. CT-angiografi pulmonar. D-dimer. Pasienten skal ikke belastes. INGEN manuell behandling av thorax.'
    },
    {
        'scenario': '45 år kvinne med intermitterende brystsmerter siste 2 uker. Forverres ved anstrengelse, bedres i hvile. Lettere dyspné ved trapper. Familieanamnese: far døde av hjerteinfarkt 52 år.',
        'response': 'RØDE FLAGG IDENTIFISERT: Angina pectoris - stabil, men krever kardiologisk utredning.\n\nFunn:\n- Anstrengelsesrelaterte brystsmerter\n- Lindres av hvile (typisk for angina)\n- Dyspné ved belastning\n- Sterk familieanamnese for prematur kardiovaskulær sykdom\n\nSelv om stabil angina ikke er akutt, krever det kardiologisk utredning. Kiropraktoren bør ikke anta muskuloskeletalt opphav.\n\nHANDLING: Hastehenvisning fastlege for kardiologisk utredning (EKG, arbeids-EKG, troponin). Ikke behandle brystsmerter manuelt før avklart.'
    },
]

ABDOMINAL_VISCERAL = [
    {
        'scenario': '40 år kvinne med høyresidige flankesmerter og korsryggsmerte. Kvalme. Hematuri. Kolikksmerter. Smerter ved perkusjon over nyrelosjens høyre side.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om nyrestein/urinveispatologi.\n\nFunn:\n- Kolikksmerter (bølgende intensitet)\n- Flankesmerte med utstråling til korsrygg\n- Hematuri (blod i urin)\n- Kvalme\n- Positiv costovertebralt bankeømhet\n\nNyrestein kan presentere som korsryggsmerte og forveksles med muskuloskeletal patologi.\n\nHANDLING: Urinstix, blodprøver (kreatinin). CT abdomen. Henvisning urolog/legevakt. Smertelindring.'
    },
    {
        'scenario': '60 år mann med korsryggsmerte som pulserer. Kjent aterosklerose. Palperer pulserende masse i abdomen. Blodtrykk 100/65.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om abdominalt aortaaneurysme (AAA) - mulig rupturerende.\n\nFunn:\n- Pulserende korsryggsmerte\n- Palpabel pulserende masse i abdomen\n- Kjent aterosklerose (risikofaktor)\n- Lavt blodtrykk (mulig hemodynamisk ustabilitet)\n\nRupturerende AAA er akutt livstruende med mortalitet >80% uten kirurgi.\n\nHANDLING: Ring 113 UMIDDELBART. Legg pasienten ned. Ingen abdominal palpasjon. Ingen manuell behandling. Akutt CT-angiografi og karkirurgisk tilsyn.'
    },
    {
        'scenario': '35 år kvinne med venstresidige flankesmerter og korsryggsmerte. Feber 38.5°C. Smerter ved vannlating (dysuri). Uttalte smerter ved bankeprøve venstre nyrelosje.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om pyelonefritt (nyrebekkenbetennelse).\n\nFunn:\n- Feber\n- Flankesmerte med bankeømhet over nyrelosje\n- Dysuri (urinveissymptomer)\n- Utstråling til korsrygg\n\nPyelonefritt kan etterligne mekanisk korsryggsmerte men krever antibiotisk behandling.\n\nHANDLING: Urinstix, urinprøve for dyrkning. Blodprøver (CRP, leukocytter, kreatinin). Henvisning fastlege/legevakt for antibiotikabehandling.'
    },
]

TEMPORAL_ARTERITIS_GCA = [
    {
        'scenario': '72 år kvinne med ny type hodepine siste 2 uker, ømhet over tinningene. Tyggeclaudicatio (smerte ved tygging). Synsforstyrrelser. SR 95.',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om kjempecellearteritt (GCA/temporalisarteritt).\n\nFunn:\n- Ny hodepine hos pasient >50 år\n- Temporal ømhet\n- Tyggeclaudicatio (patognomonisk)\n- Synsforstyrrelser (risiko for permanent synstap)\n- Kraftig forhøyet SR\n\nGCA er en medisinsk akutt-tilstand pga. risiko for irreversibel blindhet.\n\nHANDLING: Akutt henvisning - oppstart høydose prednisolon SAMME DAG (bør ikke vente på biopsi). Temporal arteriebiopsi innen 2 uker. Øyelegevurdering.'
    },
    {
        'scenario': '68 år mann med ensidig hodepine, hoven og øm temporal arterie, uforklarlig vekttap. Diplopi siste 3 dager. PMR-symptomer (skulder/hoftestivhet).',
        'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om kjempecellearteritt med okulær affeksjon.\n\nFunn:\n- Ensidig hodepine med fokal temporal ømhet\n- Palpabel, hoven temporal arterie\n- Diplopi (CN-affeksjon)\n- Assosierte PMR-symptomer\n- Vekttap\n\nDiplopi indikerer kranial nerveiskemi. Høy risiko for permanent synstap uten behandling.\n\nHANDLING: AKUTT: Oppstart prednisolon 60-80 mg UMIDDELBART. Henvisning revmatolog og øyelege. SR, CRP. Temporal arteriebiopsi.'
    },
]

MEDICATION_RISKS = [
    {
        'scenario': '75 år mann på Marevan (warfarin) pga. atrieflimmer. Korsryggsmerte etter lett fall. Perkusjonsøm L2-L3. INR ukjent. Økende smerte.',
        'response': 'RØDE FLAGG IDENTIFISERT: Risiko for epiduralt hematom hos antikoagulert pasient.\n\nFunn:\n- Antikoagulasjonsbehandling (warfarin)\n- Traumemekanisme (fall)\n- Fokal perkusjonsømhet\n- Progressiv smerte\n\nAntikoagulerte pasienter har økt risiko for spinalt/epiduralt hematom ved minimalt traume. Kan gi akutt nevrologisk kompresjon.\n\nHANDLING: Sjekk INR akutt. MR lumbalcolumna ved nevrologiske utfall. INGEN spinal manipulasjon hos antikoagulerte uten avklaring. Overvåk nevrologi.'
    },
    {
        'scenario': '65 år kvinne på DOAK (Eliquis) og prednisolon. Torakalsmerter etter kraftig hoste. Perkusjonsøm Th10. Tar bisphosphonat for osteoporose.',
        'response': 'RØDE FLAGG IDENTIFISERT: Sammensatt fraktur- og blødningsrisiko.\n\nFunn:\n- Dobbel blødningsrisiko (DOAK + kortikosteroider)\n- Osteoporose (selv med behandling)\n- Lavenergitraume (hoste)\n- Fokal perkusjonsømhet\n\nKortikosteroid + alder + antikoagulasjon gir trippel risiko for komplikasjoner.\n\nHANDLING: Rtg torakalcolumna for fraktur. Blodstatus inkl. koagulasjon. INGEN torakal manipulasjon. Skånsom behandling kun perifert. Kontakt fastlege.'
    },
    {
        'scenario': '55 år mann på immunsuppressiv behandling (metotreksat, infliximab) for Crohns sykdom. Gradvis økende nakkesmerter, nedsatt ROM. Feber 37.5°C siste uke.',
        'response': 'RØDE FLAGG IDENTIFISERT: Infeksjonsrisiko hos immunsupprimert pasient.\n\nFunn:\n- Dobbel immunsuppresjon (metotreksat + biologisk)\n- Lavgradig feber\n- Progressive smerter\n- Nedsatt ROM\n\nImmunsupprimerte pasienter kan ha atypiske infeksjonspresentasjoner med mildere symptomer. Lavgradig feber er allerede alarmerende.\n\nHANDLING: Blodprøver (CRP, SR, leukocytter med diff). MR ved mistanke om spinal infeksjon. Kontakt behandlende lege. Forsiktighet med manipulasjon.'
    },
]

# ============================================================
# NORWEGIAN NEGATIVE SCENARIOS (No Red Flags)
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
    {
        'scenario': '52 år mann med mekanisk nakkesmerte og stivhet etter malearbeid. Smerte ved ekstensjon og rotasjon. Noe krepitasjon. Normal nevrologi. Ingen hodepine.',
        'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Cervikal fasettleddsirritasjon.\n\nFunn:\n- Klar mekanisk utløsende årsak (overheadarbeid)\n- Smerter ved ekstensjon/rotasjon (typisk fasettmønster)\n- Krepitasjon (aldersrelatert degenerasjon)\n- Normal nevrologi\n\nTrygt å behandle med cervikal mobilisering/manipulasjon, myofascielle teknikker og øvelser.'
    },
    {
        'scenario': '45 år kvinne med kronisk korsryggsmerte i 3 år, verst etter lang sitting. Bedres med bevegelse. Noe morgenstivhet <15 min. Normal kraft bilateralt. Rtg viser mild degenerasjon L4-L5.',
        'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Kronisk mekanisk korsryggsmerte med mild degenerative forandringer.\n\nFunn:\n- Langvarig mekanisk mønster\n- Bedres med aktivitet (mekanisk, ikke inflammatorisk)\n- Kort morgenstivhet (<30 min)\n- Normal nevrologi\n- Radiologiske funn korrelerer med alder\n\nTrygt å behandle konservativt. Fokus på stabiliserende øvelser, ergonomi, og aktivitetsmodifisering.'
    },
    {
        'scenario': '22 år kvinne, løper. Anteriore knesmerter bilateralt, verst ved trapper ned og langvarig sitting. Positiv patellar glidningstest. Normal ROM.',
        'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Patellofemoral smertesyndrom (runners knee).\n\nFunn:\n- Bilateral, symmetrisk\n- Typisk belastningsmønster\n- Ung, aktiv pasient\n- Positiv spesifikk test\n\nTrygt å behandle konservativt. Styrketrening (vastus medialis, hofteabduktorer), gradvis belastningsøkning.'
    },
    {
        'scenario': '40 år mann, håndverker. Skuldersmerte lateralt, verst ved abduksjon 60-120°. Positiv painful arc. Empty can test svakt positiv. Full passiv ROM.',
        'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Rotatorcuff-tendinopati (supraspinatus).\n\nFunn:\n- Painful arc (60-120° = subacromial)\n- Svakt positiv Empty can (supraspinatus)\n- Full passiv ROM (ikke frozen shoulder)\n- Arbeidsrelatert overbelastning\n\nTrygt å behandle med progressiv eksentrisk trening, manuell terapi, ergonomisk rådgivning.'
    },
    {
        'scenario': '65 år mann med SI-leddsmerte høyre side etter lang bilkjøring. Positiv FABER test høyre. Normal nevrologi. Ingen morgenstivhet. Ingen systemiske symptomer.',
        'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Mekanisk SI-leddsdysfunksjon.\n\nFunn:\n- Klar mekanisk utløsende årsak (langvarig sitting)\n- Positiv provokasjonstest for SI-ledd\n- Ingen inflammatoriske tegn\n- Normal nevrologi\n- Ingen systemiske symptomer\n\nTrygt å behandle med SI-leddsmobilisering, bekkenstabiliserende øvelser, ergonomisk rådgivning.'
    },
    {
        'scenario': '50 år kvinne med hofte- og lyskesmerte, gradvis debut. Smerte ved innoverrotasjon og fleksjon. Krepitasjon. Normal gangmønster.',
        'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Hofteartrose (coxarthrose).\n\nFunn:\n- Gradvis debut\n- Smerte ved innoverrotasjon (tidlig artrosetegn)\n- Krepitasjon\n- Alder og lokalisasjon forenlig med degenerativ lidelse\n\nTrygt å behandle konservativt. Trening (styrke, fleksibilitet), aktivitetstilpasning, vektkontroll.'
    },
    {
        'scenario': '27 år mann med akillessmerter bilateralt etter økt løpeintensitet. Morgenstive akillser. Øm ved palpasjon midtporsjon. Positiv Thompson test (normal).',
        'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Bilateral akilles-tendinopati (midporsjon).\n\nFunn:\n- Klar overbelastningsårsak\n- Typisk lokalisasjon (midporsjon)\n- Normal Thompson test (ikke ruptur)\n- Morgenstivhet typisk for tendinopati\n\nTrygt å behandle konservativt. Tung, langsom eksentrisk trening (Alfredson-protokoll), gradvis belastningsøkning.'
    },
    {
        'scenario': '58 år mann med intermitterende vertigo ved stillingsskifter i 2 uker. Positiv Dix-Hallpike test til høyre. Nystagmus varer <1 min. Normal nevrologi ellers.',
        'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Benign paroksysmal posisjonsvertigo (BPPV) - høyre bakre kanal.\n\nFunn:\n- Posisjonsutløst vertigo\n- Positiv Dix-Hallpike (diagnostisk)\n- Kort varighet nystagmus (<1 min, typisk perifer)\n- Normal nevrologi\n\nTrygt å behandle med Epley-manøver (canalith repositioning). Forventet bedring etter 1-3 behandlinger.'
    },
]

# ============================================================
# ENGLISH SCENARIOS — POSITIVE
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
        'scenario': 'Assess red flags: 68-year-old female on long-term corticosteroids, acute thoracic pain after bending forward, point tenderness T12, no neurological deficit.',
        'response': 'RED FLAGS IDENTIFIED: Likely osteoporotic compression fracture.\n\nFindings:\n- Age >65\n- Long-term corticosteroid use (secondary osteoporosis)\n- Low-energy mechanism\n- Focal point tenderness\n\nACTION: X-ray thoracolumbar spine. No manipulation of affected segment. Pain management. Consider DEXA scan. Referral for osteoporosis management.'
    },
    {
        'scenario': 'Assess red flags: 45-year-old male, IV drug user, 3 weeks of progressive back pain, fever 38.5C, night sweats, focal tenderness L3-L4.',
        'response': 'RED FLAGS IDENTIFIED: Suspected spinal infection (spondylodiscitis).\n\nFindings:\n- IV drug use (risk factor for hematogenous spread)\n- Fever\n- Night sweats\n- Progressive course\n- Focal tenderness\n\nACTION: Urgent blood work (CRP, ESR, WBC, blood cultures). MRI lumbar spine with contrast. Urgent referral. No manual treatment.'
    },
    {
        'scenario': 'Assess red flags: 38-year-old female, acute neck pain and headache after cervical manipulation 1 hour ago, now ptosis, miosis, diplopia, ataxia.',
        'response': 'RED FLAGS IDENTIFIED: Suspected vertebral artery dissection.\n\nFindings:\n- Acute neck pain post-manipulation\n- Horner syndrome (ptosis, miosis)\n- Diplopia\n- Ataxia\n\nClassic signs of vertebrobasilar insufficiency/dissection. Potentially life-threatening.\n\nACTION: Call emergency services immediately. CT angiography/MR angiography. Do NOT move the patient\'s neck. Keep patient supine.'
    },
    {
        'scenario': 'Assess red flags: 55-year-old male, sudden severe headache during neck treatment, worst headache of his life, nausea, neck stiffness.',
        'response': 'RED FLAGS IDENTIFIED: Suspected subarachnoid hemorrhage.\n\nFindings:\n- Thunderclap headache\n- Onset during manual intervention\n- Nausea\n- Neck stiffness (meningism)\n\nACTION: Call emergency services. Urgent CT head. Do not move patient. Stop all treatment immediately.'
    },
    {
        'scenario': 'Assess red flags: 7-year-old boy with 2 weeks of low back pain, refusing to play, limping, low-grade fever 37.8C.',
        'response': 'RED FLAGS IDENTIFIED: Back pain in child under 10 is always a red flag.\n\nFindings:\n- Age <10 with persistent back pain\n- Low-grade fever\n- Functional limitation (refusing play, limping)\n\nBack pain in children <10 is unusual and always warrants investigation. Differential: infection (discitis, osteomyelitis), tumor, leukemia.\n\nACTION: Urgent blood work (CRP, ESR, CBC). MRI spine. Pediatric referral. No manual treatment.'
    },
    {
        'scenario': 'Assess red flags: 50-year-old male, progressive bilateral hand weakness and wasting over 6 months, fasciculations, hyperreflexia in legs, intact sensation.',
        'response': 'RED FLAGS IDENTIFIED: Suspected motor neuron disease (ALS).\n\nFindings:\n- Progressive motor weakness (upper extremities)\n- Muscle wasting (lower motor neuron)\n- Fasciculations\n- Hyperreflexia (upper motor neuron)\n- Intact sensation\n\nCombination of upper and lower motor neuron signs without sensory involvement is classic for ALS.\n\nACTION: Urgent neurology referral. EMG/NCS. Stop cervical manipulation.'
    },
    {
        'scenario': 'Assess red flags: 72-year-old female, new headache for 2 weeks, temporal tenderness, jaw claudication, visual disturbances, ESR 95.',
        'response': 'RED FLAGS IDENTIFIED: Suspected giant cell arteritis (GCA/temporal arteritis).\n\nFindings:\n- New headache in patient >50\n- Temporal tenderness\n- Jaw claudication (pathognomonic)\n- Visual disturbances (risk of permanent vision loss)\n- Markedly elevated ESR\n\nGCA is a medical emergency due to risk of irreversible blindness.\n\nACTION: Start high-dose prednisolone SAME DAY. Temporal artery biopsy within 2 weeks. Ophthalmology review.'
    },
    {
        'scenario': 'Assess red flags: 55-year-old male, left-sided chest pain radiating to left arm and jaw, diaphoresis, BP 90/60, onset during treatment.',
        'response': 'RED FLAGS IDENTIFIED: Suspected acute myocardial infarction.\n\nFindings:\n- Left chest pain with arm/jaw radiation\n- Autonomic symptoms (diaphoresis)\n- Hypotension\n\nACTION: Call emergency services IMMEDIATELY. Give 300mg aspirin if available. Position patient semi-reclined. Monitor breathing and consciousness. STOP all treatment.'
    },
    {
        'scenario': 'Assess red flags: 48-year-old female, sudden tearing chest and back pain between shoulder blades, BP difference between arms (150/90 vs 120/70).',
        'response': 'RED FLAGS IDENTIFIED: Suspected aortic dissection.\n\nFindings:\n- Acute tearing chest/back pain\n- BP asymmetry between arms (>20 mmHg systolic)\n- Sudden onset\n\nACTION: Call emergency services IMMEDIATELY. CT angiography aorta. Keep patient still. Blood pressure control critical.'
    },
    {
        'scenario': 'Assess red flags: 75-year-old male on warfarin, low back pain after minor fall, point tenderness L2-L3, INR unknown, increasing pain.',
        'response': 'RED FLAGS IDENTIFIED: Risk of epidural hematoma in anticoagulated patient.\n\nFindings:\n- Anticoagulation therapy (warfarin)\n- Trauma mechanism (fall)\n- Focal point tenderness\n- Progressive pain\n\nACTION: Check INR urgently. MRI lumbar spine if neurological signs develop. NO spinal manipulation in anticoagulated patients without clearance. Monitor neurology closely.'
    },
    {
        'scenario': 'Assess red flags: 32-year-old female, recurring numbness and tingling in different extremities over 6 months, now acute vision loss left eye, fatigue, ataxia.',
        'response': 'RED FLAGS IDENTIFIED: Suspected multiple sclerosis.\n\nFindings:\n- Recurring, fluctuating neurological symptoms\n- Multifocal deficits (sensory, visual, motor)\n- Optic neuritis (acute vision loss)\n- Young female (demographic risk)\n- Ataxia\n\nCombination of deficits disseminated in time and space is classic for MS.\n\nACTION: Urgent MRI brain + cervical spine with contrast. Neurology referral. Possible high-dose steroid treatment for acute episode.'
    },
]

# ============================================================
# ENGLISH NEGATIVE SCENARIOS
# ============================================================

EN_NEGATIVE = [
    {
        'scenario': 'Assess red flags: 30-year-old male, acute neck pain after gym. Reduced ROM right rotation. No trauma. Normal neuro exam. No headache.',
        'response': 'No red flags identified.\n\nClinical picture: Acute mechanical neck pain, likely facet or muscular strain.\n\nFindings:\n- Young patient\n- Clear mechanical trigger\n- Unilateral restriction\n- Normal neurology\n- No concerning features\n\nSafe to treat conservatively with manual therapy, gentle mobilization, and progressive exercises.'
    },
    {
        'scenario': 'Assess red flags: 35-year-old female, mechanical low back pain after gardening, localized to lower back, worse with flexion, no radiation, normal neuro.',
        'response': 'No red flags identified.\n\nClinical picture: Acute mechanical low back pain (lumbago).\n\nFindings:\n- Young patient without risk factors\n- Clear mechanical trigger\n- Localized pain without radiation\n- Normal neurology\n\nSafe to treat with manual therapy. Recommend activity as tolerated, avoid prolonged bed rest. Expected improvement within 2-6 weeks.'
    },
    {
        'scenario': 'Assess red flags: 45-year-old male, chronic shoulder pain, worse with overhead activities, positive Hawkins and Neer tests, full strength, no night pain.',
        'response': 'No red flags identified.\n\nClinical picture: Subacromial impingement syndrome.\n\nFindings:\n- Mechanical pain with specific movements\n- Positive impingement provocation tests\n- Full strength (no rotator cuff tear suspected)\n- No night/systemic symptoms\n\nSafe to treat conservatively with exercises, manual therapy, and activity modification.'
    },
    {
        'scenario': 'Assess red flags: 28-year-old female runner, bilateral anterior knee pain, worse going downstairs and prolonged sitting, positive patellar glide test.',
        'response': 'No red flags identified.\n\nClinical picture: Patellofemoral pain syndrome.\n\nFindings:\n- Bilateral, symmetric\n- Typical loading pattern\n- Young, active patient\n- Positive specific test\n\nSafe to treat conservatively. Focus on strengthening (vastus medialis, hip abductors), gradual load progression.'
    },
    {
        'scenario': 'Assess red flags: 55-year-old male, intermittent positional vertigo for 2 weeks, positive Dix-Hallpike right, nystagmus <1 minute, normal neuro otherwise.',
        'response': 'No red flags identified.\n\nClinical picture: Benign paroxysmal positional vertigo (BPPV) - right posterior canal.\n\nFindings:\n- Position-triggered vertigo\n- Positive Dix-Hallpike (diagnostic)\n- Brief nystagmus (<1 min, typical peripheral)\n- Normal neurology\n\nSafe to treat with Epley maneuver (canalith repositioning). Expected improvement after 1-3 treatments.'
    },
    {
        'scenario': 'Assess red flags: 42-year-old male, lateral elbow pain for 3 months, positive Cozen test, full ROM, reduced grip strength vs. unaffected side.',
        'response': 'No red flags identified.\n\nClinical picture: Lateral epicondylalgia (tennis elbow).\n\nFindings:\n- Gradual onset, overuse-related\n- Positive provocation test\n- Full ROM\n- Isolated grip weakness (not neurological)\n\nSafe to treat conservatively. Eccentric exercises, ergonomic adaptation, counterforce brace. Slow recovery expected (3-12 months).'
    },
    {
        'scenario': 'Assess red flags: 50-year-old female, hip and groin pain, gradual onset, pain on internal rotation and flexion, crepitus, normal gait.',
        'response': 'No red flags identified.\n\nClinical picture: Hip osteoarthritis (coxarthrosis).\n\nFindings:\n- Gradual onset\n- Pain on internal rotation (early OA sign)\n- Crepitus\n- Age and location consistent with degenerative condition\n\nSafe to treat conservatively. Exercise (strength, flexibility), activity adaptation, weight management.'
    },
    {
        'scenario': 'Assess red flags: 38-year-old male, unilateral sciatica to calf after lifting, positive SLR 45 degrees, diminished ankle reflex, stable, pain 6/10.',
        'response': 'No red flags identified. NOTE: Monitor for progression.\n\nClinical picture: Lumbar radiculopathy, likely L5-S1.\n\nFindings:\n- Clear mechanical cause\n- Unilateral radiation\n- Positive SLR\n- Isolated reflex change (not progressive)\n\nConservative treatment is first-line. Monitor for: bilateralization, bladder/bowel symptoms, progressive weakness. Reassess after 4-6 weeks.'
    },
    {
        'scenario': 'Assess red flags: 60-year-old male, right SI joint pain after long car drive, positive FABER test right, normal neuro, no morning stiffness, no systemic symptoms.',
        'response': 'No red flags identified.\n\nClinical picture: Mechanical SI joint dysfunction.\n\nFindings:\n- Clear mechanical trigger (prolonged sitting)\n- Positive SI joint provocation test\n- No inflammatory signs\n- Normal neurology\n- No systemic symptoms\n\nSafe to treat with SI joint mobilization, pelvic stabilization exercises, ergonomic advice.'
    },
]

# ============================================================
# DIFFERENTIAL DIAGNOSIS SCENARIOS
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
    {
        'scenario': 'Differensialdiagnostikk: 35 år mann med akutt høyresidig flankesmerte, korsryggsmerte, kvalme. Kolikk-karakter. Hematuri.',
        'response': 'Differensialdiagnoser (rangert etter sannsynlighet):\n\n1. Nyrestein (ureterkolikk) - mest sannsynlig\n   - Klassisk triade: flankesmerte, kolikk, hematuri\n   - Akutt debut\n\n2. Pyelonefritt\n   - Flankesmerte men vanligvis med feber\n   - Sjekk for dysuri\n\n3. Mekanisk korsryggsmerte (utelukkes)\n   - Kolikk og hematuri passer ikke\n\nRøde flagg-screening: Visceral patologi identifisert.\n\nAnbefaling: Urinstix, blodprøver. CT uten kontrast. Legevakt/urolog. Ikke relevant for manuell behandling.'
    },
    {
        'scenario': 'Differensialdiagnostikk: 25 år kvinne med thorakal ryggsmerte, verst ved inspirasjon. Nylig øvre luftveisinfeksjon. Auskultasjon: normal bilateralt.',
        'response': 'Differensialdiagnoser (rangert etter sannsynlighet):\n\n1. Costovertebral dysfunksjon (mest sannsynlig)\n   - Smerter ved inspirasjon med mekanisk mønster\n   - Ofte etter hoste/øvre luftveisinfeksjon\n\n2. Pleuritt\n   - Viral pleuritt etter luftveisinfeksjon\n   - Normal auskultasjon utelukker ikke\n\n3. Costokondritt\n   - Ømhet over costokondrale overganger\n\nRøde flagg-screening: Ingen røde flagg. OBS: ved feber, dyspné eller hemoptysis, vurder pneumoni/LE.\n\nAnbefaling: Trygt å behandle med torakal mobilisering. Revurder hvis symptomene ikke bedres innen 1-2 uker.'
    },
    {
        'scenario': 'Differensialdiagnostikk: 55 år mann med diffuse smerter i skuldre, korsrygg, hofter og knær. Søvnproblemer. Fatigue. 18/18 tenderpoints positive. Normal blodprøver.',
        'response': 'Differensialdiagnoser:\n\n1. Fibromyalgi (mest sannsynlig)\n   - Widespread pain (WPI)\n   - Søvnforstyrrelser og fatigue\n   - Multiple tenderpoints\n   - Normale blodprøver\n\n2. Hypofyreose\n   - Kan gi myalgier, fatigue, søvnproblemer\n   - Sjekk TSH\n\n3. Vitamin D-mangel\n   - Diffuse smerter, fatigue\n   - Sjekk 25-OH vitamin D\n\nRøde flagg-screening: Ingen røde flagg identifisert.\n\nAnbefaling: Gradert treningsprogram, søvnhygiene, kognitiv terapi. Utelukk hypofyreose og vitamin D-mangel. Kiropraktisk behandling som del av multimodal tilnærming.'
    },
    {
        'scenario': 'Differensialdiagnostikk: 40 år kvinne med nedre abdominal-/korsryggsmerte. Smerter relatert til menstruasjonssyklus. Dysmenore. Dyspareuni.',
        'response': 'Differensialdiagnoser:\n\n1. Endometriose (mest sannsynlig)\n   - Syklisk smerte\n   - Dysmenore og dyspareuni\n   - Korsryggsmerte som del av bildet\n\n2. Mekanisk korsryggsmerte (ikke-relatert)\n   - Må differensieres fra syklisk mønster\n\n3. Uterine fibromer\n   - Kan gi nedre rygg-/abdominalsmerte\n   - Spesielt ved store myomer\n\nRøde flagg-screening: Visceral årsak sannsynlig.\n\nAnbefaling: Henvisning gynekolog for ultralyd bekken, ev. laparoskopi. Kiropraktisk behandling kan adressere muskuloskeletal komponent, men den gynekologiske årsaken må utredes.'
    },
]

DIFFERENTIAL_SCENARIOS_EN = [
    {
        'scenario': 'Differential diagnosis: 55-year-old male with diffuse shoulder, low back, hip, and knee pain. Sleep problems, fatigue, 18/18 tender points positive, normal blood work.',
        'response': 'Differential diagnoses:\n\n1. Fibromyalgia (most likely)\n   - Widespread pain\n   - Sleep disturbance and fatigue\n   - Multiple tender points\n   - Normal blood work\n\n2. Hypothyroidism\n   - Can cause myalgias, fatigue, sleep problems\n   - Check TSH\n\n3. Vitamin D deficiency\n   - Diffuse pain, fatigue\n   - Check 25-OH vitamin D\n\nRed flag screening: No red flags identified.\n\nRecommendation: Graded exercise program, sleep hygiene, cognitive behavioral therapy. Rule out hypothyroidism and vitamin D deficiency. Chiropractic as part of multimodal approach.'
    },
    {
        'scenario': 'Differential diagnosis: 25-year-old male with low back pain for 18 months, worse in morning, morning stiffness >45 minutes, improves with exercise.',
        'response': 'Differential diagnoses:\n\n1. Axial spondyloarthritis (most likely)\n   - Young male <40\n   - Insidious onset >3 months\n   - Morning stiffness >30 min\n   - Improvement with activity\n\n2. Non-specific mechanical low back pain\n   - Less likely given inflammatory pattern\n\n3. Disc pathology\n   - Usually worse with activity, not improved\n\nRed flag screening: Inflammatory pattern identified.\n\nRecommendation: Blood work (HLA-B27, CRP, ESR). MRI sacroiliac joints. Rheumatology referral. Chiropractic can continue as supplement.'
    },
]

# ============================================================
# BORDERLINE / SUBTLE SCENARIOS
# ============================================================

BORDERLINE_SCENARIOS_NO = [
    {
        'scenario': '48 år mann med korsryggsmerte etter løfting for 1 uke siden. Unilateral isjiassmerte til fot. Lett nedsatt kraft i stortå dorsalfleksjon (4/5). Stabil over 1 uke.',
        'response': 'Ingen akutte røde flagg, men OBS progressjon.\n\nKlinisk bilde: Lumbal radikulopati L5 med lett motorisk affeksjon.\n\nFunn:\n- Unilateral utstråling (ikke bilateral)\n- Lett motorisk utfall (4/5, men stabil)\n- Ingen blære-/tarmaffeksjon\n- Ingen sadelanestesi\n\nMotorisk utfall 4/5 som er stabilt er ikke nødvendigvis akutt-indikasjon, men krever tett oppfølging.\n\nANBEFALING: Konservativ behandling er aktuelt. Revurder kraft etter 1-2 uker. Ved ENHVER forverring (svakere tå, bilateral symptomer, blæreproblemer) → akutt MR. Dokumentér kraft ved hver konsultasjon.'
    },
    {
        'scenario': '65 år mann med ny ryggsmerte siste 6 uker. Noe nattsmerter men sovner godt etter stillingsendring. Ingen vekttap. Normal appetitt. Lett stiv om morgenen <15 min.',
        'response': 'Ingen akutte røde flagg identifisert, men vurdér videre utredning.\n\nKlinisk bilde: Ny ryggsmerte hos eldre - krever grundig screening.\n\nVurdering av røde flagg:\n- Alder >50 med ny smerte ✓ (risikofaktor)\n- Nattsmerter → bedres med stillingsendring (mekanisk, ikke suspekt)\n- Ingen vekttap ✓\n- Normal appetitt ✓\n- Kort morgenstivhet (ikke inflammatorisk)\n\nANBEFALING: Trygt å starte konservativ behandling. Bestill screening-blodprøver (SR, CRP, ALP, hematologi) for å utelukke underliggende patologi. Revurder ved manglende bedring etter 4-6 uker.'
    },
    {
        'scenario': '40 år kvinne med nakkesmerte etter whiplash for 3 uker siden. Hodepine, konsentrasjonsvansker, svimmelhet. Normale reflekser og kraft. MR nakke normal.',
        'response': 'Ingen akutte røde flagg identifisert.\n\nKlinisk bilde: Whiplash-assosiert lidelse (WAD) grad II.\n\nFunn:\n- Nakkesmerter med redusert ROM (WAD II)\n- Hodepine, svimmelhet, kognitive symptomer (vanlig etter whiplash)\n- Normal nevrologi og MR (utelukker strukturell skade)\n\nOBS: Ved følgende nye symptomer, revurder:\n- Progressiv svakhet i armer\n- Synsforstyrrelser\n- Balanseproblemer (cervikal myelopati)\n\nANBEFALING: Aktiv rehabilitering, gradvis belastning. Unngå krage. Manuell terapi av cervikale segmenter forsiktig de første ukene. Reassurering om god prognose.'
    },
    {
        'scenario': '72 år kvinne med korsryggsmerte som stråler ned i begge bena ved gange. Bedres ved hvile og fleksjon. Kan gå 200m. Normal nevrologi i hvile.',
        'response': 'Ingen akutte røde flagg identifisert.\n\nKlinisk bilde: Lumbal spinal stenose (nevrogen claudicatio).\n\nFunn:\n- Bilateral beinsmerte ved gange (claudicatio)\n- Bedres ved fleksjon/hvile\n- Normal nevrologi i hvile\n- Typisk alder og presentasjon\n\nOBS: Differensier fra vaskulær claudicatio (sjekk perifere pulser).\n\nANBEFALING: Konservativ behandling med fleksjonspreferanse-øvelser, mobilisering, sykling. Henvisning for MR ved forverring eller progressiv gangdistanse-reduksjon. Monitorér for CES-tegn.'
    },
]

BORDERLINE_SCENARIOS_EN = [
    {
        'scenario': 'Assess red flags: 48-year-old male, low back pain after lifting 1 week ago, unilateral sciatica to foot, slightly reduced great toe dorsiflexion (4/5), stable over 1 week.',
        'response': 'No acute red flags, but MONITOR for progression.\n\nClinical picture: L5 lumbar radiculopathy with mild motor deficit.\n\nFindings:\n- Unilateral radiation (not bilateral)\n- Mild motor deficit (4/5, but stable)\n- No bladder/bowel dysfunction\n- No saddle anesthesia\n\nStable motor deficit of 4/5 is not necessarily an acute surgical indication but requires close follow-up.\n\nRECOMMENDATION: Conservative treatment appropriate. Reassess strength at 1-2 weeks. If ANY deterioration (weaker toe, bilateral symptoms, bladder issues) → urgent MRI. Document strength at each visit.'
    },
    {
        'scenario': 'Assess red flags: 65-year-old male, new back pain for 6 weeks, some night pain but settles with position change, no weight loss, normal appetite.',
        'response': 'No acute red flags identified, but consider further investigation.\n\nRed flag assessment:\n- Age >50 with new pain ✓ (risk factor)\n- Night pain → resolves with position change (mechanical, not concerning)\n- No weight loss ✓\n- Normal appetite ✓\n\nRECOMMENDATION: Safe to start conservative treatment. Order screening blood work (ESR, CRP, ALP, CBC) to rule out underlying pathology. Reassess if no improvement after 4-6 weeks.'
    },
]


# ============================================================
# ADDITIONAL VARIANTS — Augmented scenarios for more diversity
# ============================================================

ADDITIONAL_POSITIVE_NO = [
    # More CES variants
    {'scenario': '70 år mann med lumbal stenose. Akutt forverring: bilateral svakhet, urininkontinens, nummenhet perinealt.', 'response': 'RØDE FLAGG IDENTIFISERT: Cauda equina syndrom ved lumbal stenose.\n\nFunn:\n- Kjent lumbal stenose med akutt forverring\n- Bilateral motorisk svakhet\n- Urininkontinens\n- Sadelanestesi\n\nAkutt kompresjon av cauda equina ved stenose krever umiddelbar kirurgisk dekompresjon.\n\nHANDLING: Ring 113. Akutt MR lumbalcolumna. Nevrokirurgisk tilsyn. INGEN manipulasjon.'},
    # More cancer variants
    {'scenario': '60 år kvinne, tidligere brystkreft for 5 år siden. Ny torakalsmerte Th6 med perkusjonsømhet. Konstant smerte. CRP 12, ALP forhøyet.', 'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om skjelettmetastase fra brystkreft.\n\nFunn:\n- Tidligere malignitet (brystkreft - vanlig kilde til skjelettmetastaser)\n- Ny fokal smerte i torakalcolumna\n- Forhøyet ALP (osteoblastisk aktivitet)\n- Konstant smertemønster\n\nBrystkreft kan gi metastaser mange år etter primærbehandling.\n\nHANDLING: MR torakalcolumna. Onkologisk vurdering. Blodprøver inkl. tumormarkører. Ingen manipulasjon av Th6.'},
    {'scenario': '78 år mann med kronisk ryggsmerte som ikke bedres. Vekttap 5 kg siste 2 måneder. Trøtt. Lavt hemoglobin. Forhøyet kreatinin.', 'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om myelomatose.\n\nFunn:\n- Eldre med behandlingsresistent ryggsmerte\n- Vekttap\n- Anemi (lavt Hb)\n- Nyrepåvirkning (forhøyet kreatinin)\n\nAnemi + nyresvikt + ryggsmerte hos eldre = myelom til det motsatte er bevist.\n\nHANDLING: Blodprøver (elektroforese, fritt lett-kjeder, kalsium). Urin-elektroforese. MR columna. Hastehenvisning hematolog.'},
    # More infection variants
    {'scenario': '30 år kvinne, nylig ryggoperasjon (diskektomi) for 4 uker siden. Økende smerter siste uke etter initial bedring. Temperatur 38.2°C. CRP 65.', 'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om postoperativ diskitt/spondylodiskitt.\n\nFunn:\n- Nylig spinalkirurgi\n- Forverring etter initial bedring (klassisk for postoperativ infeksjon)\n- Feber\n- Forhøyet CRP\n\nPostoperativ diskitt presenterer typisk 2-6 uker etter inngrepet med forverring.\n\nHANDLING: Kontakt opererende sykehus. MR lumbal med kontrast. Blodkulturer. INGEN manuell behandling.'},
    # More vascular
    {'scenario': '35 år mann med akutt nakkesmerte etter styrketrening. Hodepine bak høyre øre. Pulserende. 2 timer senere: sløret tale og svakhet i venstre arm.', 'response': 'RØDE FLAGG IDENTIFISERT: Vertebral- eller carotisdisseksjon med iskemisk hendelse.\n\nFunn:\n- Akutt nakkesmerte etter fysisk anstrengelse\n- Retroaurikulær hodepine (typisk for disseksjon)\n- Fokalnevrologiske utfall (dysfasi, hemiparese)\n- Ung pasient med traume-mekanisme\n\nNevrologiske utfall indikerer cerebral iskemi fra disseksjon.\n\nHANDLING: Ring 113 UMIDDELBART. CT-angiografi halskar. Akutt slagbehandling. Pasienten skal IKKE bevege nakken.'},
    # More progressive neuro
    {'scenario': '55 år mann med gradvis endring i gangmønster siste 6 måneder. Spastisk gange. Hyperrefleksi i bena. Positiv Babinski bilateralt. Urgeinkontinens.', 'response': 'RØDE FLAGG IDENTIFISERT: Øvre motornevronpatologi - mistanke om cervikal myelopati eller intrakraniell prosess.\n\nFunn:\n- Spastisk gange (øvre motornevron)\n- Hyperrefleksi\n- Bilateral Babinski (pyramidale tegn)\n- Sfinkteraffeksjon\n\nBilaterale øvre motornevrontegn med sfinkterforstyrrelse = medullapatologi til det motsatte er bevist.\n\nHANDLING: Akutt MR cervikalcolumna og cerebrum. Nevrolog-tilsyn. INGEN cervikal manipulasjon.'},
    # More pediatric
    {'scenario': '10 år jente med gradvis progressiv skoliose over 3 måneder. Nattlige ryggsmerter. Ingen traume. Høyre fots svakhet ved ganganalyse.', 'response': 'RØDE FLAGG IDENTIFISERT: Raskt progredierende skoliose med nevrologisk utfall hos barn.\n\nFunn:\n- Raskt progredierende skoliose (ikke typisk idiopatisk)\n- Nattlige smerter\n- Nevrologisk utfall (fotsvakhet)\n\nHurtig forverring av skoliose med smerter og nevrologi hos barn er suspekt for intramedullær tumor eller syrinx.\n\nHANDLING: MR total columna. Barneortoped/barnenevrokirurg. INGEN manipulasjon.'},
    # More inflammatory
    {'scenario': '35 år mann med akutt monoartritt i stortåens grunnledd. Sterkt rødt, hovnet, ekstremt smertefullt. Feber 38°C. Urat 550.', 'response': 'RØDE FLAGG IDENTIFISERT: Akutt urinsyregikt - men utelukk septisk artritt.\n\nFunn:\n- Akutt monoartritt (klassisk lokalisasjon for gikt: MTP1)\n- Inflammasjonstegn (rubor, tumor)\n- Feber (også ved gikt, men OBS septisk artritt)\n- Forhøyet urat\n\nOBS: Akutt monoartritt med feber = septisk artritt til det motsatte er bevist. Leddpunksjon er gullstandard.\n\nHANDLING: Leddpunksjon for krystaller og dyrkning. Blodprøver. Henvisning legevakt/revmatolog. Behandle infeksjon først hvis påvist.'},
    # More cardiac/thoracic
    {'scenario': '50 år kvinne med akutt interkostal smerte venstre side etter kiropraktisk behandling. Dyspné. SpO2 94%. Takykardi 110/min.', 'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om pneumothorax.\n\nFunn:\n- Akutt interkostal smerte etter thorakal behandling\n- Dyspné\n- Nedsatt SpO2 (94%)\n- Takykardi\n\nPneumothorax kan oppstå etter torakal manipulasjon, spesielt hos pasienter med underliggende lungesykdom.\n\nHANDLING: Ring 113 ved alvorlig dyspné. Auskultasjon (nedsatt lydfenomen?). Rtg thorax akutt. Legg pasienten ned med hoveddel elevat.'},
    # Abdominal
    {'scenario': '55 år mann med akutt venstresidige magesmerter, utstrålende til rygg. Kvalme, oppkast. Ømhet epigastriet. Amylase ukjent. Alkoholforbruk.', 'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om akutt pankreatitt.\n\nFunn:\n- Akutte epigastriske smerter med utstråling til rygg (klassisk)\n- Kvalme og oppkast\n- Alkoholforbruk (risikofaktor)\n\nPankreatitt kan presentere som ryggsmerte og forveksles med muskuloskeletal patologi.\n\nHANDLING: Blodprøver (amylase/lipase). Akuttmottak. INGEN manuell behandling av abdomen/torakolumbal.'},
]

ADDITIONAL_POSITIVE_EN = [
    {'scenario': 'Assess red flags: 70-year-old male with lumbar stenosis, acute worsening: bilateral weakness, urinary incontinence, perineal numbness.', 'response': 'RED FLAGS IDENTIFIED: Cauda equina syndrome complicating lumbar stenosis.\n\nFindings:\n- Known lumbar stenosis with acute deterioration\n- Bilateral motor weakness\n- Urinary incontinence\n- Saddle anesthesia\n\nACTION: Call emergency services. Urgent MRI lumbar spine. Neurosurgical consultation. No manipulation.'},
    {'scenario': 'Assess red flags: 60-year-old female, history of breast cancer 5 years ago, new thoracic pain T6, constant, elevated ALP.', 'response': 'RED FLAGS IDENTIFIED: Suspected bone metastasis from breast cancer.\n\nFindings:\n- Previous malignancy (breast cancer - common source of skeletal metastases)\n- New focal thoracic pain\n- Elevated ALP (osteoblastic activity)\n- Constant pain pattern\n\nACTION: MRI thoracic spine. Oncology consultation. Blood work including tumor markers. No manipulation at T6.'},
    {'scenario': 'Assess red flags: 78-year-old male with chronic back pain not improving, weight loss 5 kg in 2 months, fatigue, low hemoglobin, elevated creatinine.', 'response': 'RED FLAGS IDENTIFIED: Suspected myeloma.\n\nFindings:\n- Elderly with treatment-resistant back pain\n- Weight loss\n- Anemia\n- Renal impairment\n\nAnemia + renal failure + back pain in elderly = myeloma until proven otherwise.\n\nACTION: Blood work (serum electrophoresis, free light chains, calcium). Urine electrophoresis. MRI spine. Urgent hematology referral.'},
    {'scenario': 'Assess red flags: 35-year-old male, acute neck pain after weight training, headache behind right ear, 2 hours later: slurred speech and left arm weakness.', 'response': 'RED FLAGS IDENTIFIED: Vertebral or carotid dissection with ischemic event.\n\nFindings:\n- Acute neck pain after physical exertion\n- Retroauricular headache (typical for dissection)\n- Focal neurological deficits (dysphasia, hemiparesis)\n- Young patient with trauma mechanism\n\nACTION: Call emergency services IMMEDIATELY. CT angiography of neck vessels. Acute stroke treatment. Do NOT move the neck.'},
    {'scenario': 'Assess red flags: 55-year-old male, gradual change in gait over 6 months, spastic walking, hyperreflexia in legs, bilateral Babinski, urge incontinence.', 'response': 'RED FLAGS IDENTIFIED: Upper motor neuron pathology - suspected cervical myelopathy or intracranial process.\n\nFindings:\n- Spastic gait (upper motor neuron)\n- Hyperreflexia\n- Bilateral Babinski (pyramidal signs)\n- Sphincter dysfunction\n\nACTION: Urgent MRI cervical spine and brain. Neurology consultation. No cervical manipulation.'},
    {'scenario': 'Assess red flags: 10-year-old girl with rapidly progressive scoliosis over 3 months, night back pain, no trauma, right foot weakness on gait analysis.', 'response': 'RED FLAGS IDENTIFIED: Rapidly progressive scoliosis with neurological deficit in child.\n\nFindings:\n- Rapid scoliosis progression (not typical idiopathic)\n- Night pain\n- Neurological deficit (foot weakness)\n\nRapid scoliosis with pain and neurology in children suggests intramedullary tumor or syrinx.\n\nACTION: MRI total spine. Pediatric orthopedics/neurosurgery. No manipulation.'},
    {'scenario': 'Assess red flags: 50-year-old female, acute intercostal pain after chiropractic thoracic treatment, dyspnea, SpO2 94%, tachycardia 110/min.', 'response': 'RED FLAGS IDENTIFIED: Suspected pneumothorax.\n\nFindings:\n- Acute intercostal pain after thoracic manipulation\n- Dyspnea\n- Decreased SpO2 (94%)\n- Tachycardia\n\nACTION: Call emergency services if severe dyspnea. Auscultation (decreased breath sounds?). Urgent chest X-ray. Position patient semi-upright.'},
]

ADDITIONAL_NEGATIVE_NO = [
    {'scenario': '36 år mann med ryggsmerte etter volleyball. Mekanisk mønster. Lett nedsatt fleksjon. Normal nevrologi. Ingen nattlige smerter. Ingen vekttap.', 'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Akutt mekanisk korsryggsmerte etter sport.\n\nFunn:\n- Ung pasient\n- Klar mekanisk årsak\n- Normal nevrologi\n- Ingen systemiske symptomer\n\nTrygt å behandle med manuell terapi, aktive øvelser, gradvis retur til sport.'},
    {'scenario': '44 år kvinne med cervikal smerte og stivhet, verre om morgenen (<10 min stivhet). Krepitasjon ved rotasjon. Normal kraft og sensibilitet. Ingen hodepine.', 'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Cervikal spondylose med mekanisk smerte.\n\nFunn:\n- Kort morgenstivhet (<30 min, mekanisk)\n- Krepitasjon (aldersrelatert)\n- Normal nevrologi\n- Ingen hodepine\n\nTrygt å behandle med mobilisering, øvelser for nakken, ergonomisk rådgivning.'},
    {'scenario': '70 år kvinne med bilateral kneartrose, stivhet <15 min om morgenen, krepitasjon bilateralt. Normal blodprøver. Gradvis forverring over 3 år.', 'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Bilateral gonartrose.\n\nFunn:\n- Gradvis debut over år\n- Kort morgenstivhet (mekanisk)\n- Krepitasjon bilateralt\n- Normale inflammasjonsmarkører\n\nTrygt å behandle konservativt med styrketrening, aktivitetstilpasning, vektkontroll.'},
    {'scenario': '20 år mann med plantarfascitt. Smerte under hælen, verst første skritt om morgenen. Øm ved palpasjon av medialt tuberculum calcaneus.', 'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Plantar fasciopati.\n\nFunn:\n- Typisk morgenstartsmerte\n- Fokal ømhet plantart medialt\n- Ung, aktiv pasient\n\nTrygt å behandle konservativt. Tøyning, styrke, innlegg, gradvis belastning.'},
    {'scenario': '55 år mann med diffus skuldersmerte etter maling i 2 dager. Smerte ved abduksjon og fleksjon. Full passiv ROM. Ingen traume. Normal kraft.', 'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Overbelastningsrelatert rotatorcuff-tendinopati.\n\nFunn:\n- Klar overbelastningsårsak\n- Full passiv ROM (ikke kapsel)\n- Normal kraft\n- Ingen traume\n\nTrygt å behandle med progressive øvelser, manuell terapi, aktivitetsmodifisering.'},
]

ADDITIONAL_NEGATIVE_EN = [
    {'scenario': 'Assess red flags: 36-year-old male, back pain after volleyball, mechanical pattern, slightly reduced flexion, normal neuro, no night pain, no weight loss.', 'response': 'No red flags identified.\n\nClinical picture: Acute mechanical low back pain after sport.\n\nFindings:\n- Young patient\n- Clear mechanical cause\n- Normal neurology\n- No systemic symptoms\n\nSafe to treat with manual therapy, active exercises, gradual return to sport.'},
    {'scenario': 'Assess red flags: 44-year-old female, cervical pain and stiffness, worse in morning (<10 min stiffness), crepitus on rotation, normal strength and sensation.', 'response': 'No red flags identified.\n\nClinical picture: Cervical spondylosis with mechanical pain.\n\nFindings:\n- Short morning stiffness (<30 min, mechanical)\n- Crepitus (age-related)\n- Normal neurology\n- No headache\n\nSafe to treat with mobilization, neck exercises, ergonomic advice.'},
    {'scenario': 'Assess red flags: 20-year-old male with plantar fasciitis, heel pain worst with first steps in morning, tender medial calcaneal tubercle.', 'response': 'No red flags identified.\n\nClinical picture: Plantar fasciopathy.\n\nFindings:\n- Typical morning start-up pain\n- Focal tenderness plantar medially\n- Young, active patient\n\nSafe to treat conservatively. Stretching, strengthening, orthotics, gradual loading.'},
    {'scenario': 'Assess red flags: 70-year-old female with bilateral knee OA, stiffness <15 min in morning, bilateral crepitus, normal blood work, gradual worsening over 3 years.', 'response': 'No red flags identified.\n\nClinical picture: Bilateral knee osteoarthritis.\n\nFindings:\n- Gradual onset over years\n- Short morning stiffness (mechanical)\n- Bilateral crepitus\n- Normal inflammatory markers\n\nSafe to treat conservatively with strengthening, activity adaptation, weight management.'},
]

# ============================================================
# BULK VARIANTS — Diverse clinical presentations
# ============================================================

BULK_POSITIVE_NO = [
    # Cauda equina — atypical presentations
    {'scenario': '45 år kvinne med kjent stor prolaps L4-L5. 3 dager med bilateral beintyngde. Nå endret vannlatingsmønster - må presse mer enn vanlig. Nedsatt følelse innside lår.',
     'response': 'RØDE FLAGG IDENTIFISERT: Tidlig/inkomplett cauda equina syndrom.\n\nFunn:\n- Kjent stor prolaps\n- Bilateral symptomer\n- Endret blærefunksjon (hesitasjon)\n- Sensorisk forandring medialt lår (sadelanestesi-utvikling)\n\nSubtile tidlige CES-tegn. Ikke vent på full blæreretensjon.\n\nHANDLING: Akutt MR lumbalcolumna. Nevrokirurgisk tilsyn. Ring 113.'},
    # Cancer — lung
    {'scenario': '62 år mann, storrøyker. Ny skuldersmerte venstre 2 måneder, utstråling til ulnarsiden av arm. Hoste. 4 kg vekttap. Rtg skulder normal.',
     'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om Pancoast-tumor (apikal lungekreft).\n\nFunn:\n- Storrøyker\n- Skulder-/armsmerte med ulnar distribusjon (plexus brachialis nedre trunkus)\n- Hoste\n- Vekttap\n- Normal skulder-rtg (tyder på ekstraartikulær årsak)\n\nHANDLING: CT thorax. Henvisning lungelege. STOPP skulderbehandling til avklart.'},
    # Cancer — kidney
    {'scenario': '57 år mann med ny korsryggsmerte 3 måneder. Hematuri funnet tilfeldig. Vekttap. Konstant flankesmerte høyre.',
     'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om nyrecellekarsinom.\n\nFunn:\n- Hematuri (blod i urin)\n- Flankesmerte\n- Vekttap\n- Konstant smertemønster\n\nKlassisk triade for nyrecellekarsinom: hematuri + flankesmerte + palpabel tumor.\n\nHANDLING: CT abdomen med kontrast. Urinstix. Henvisning urolog. Ingen manuell behandling til avklart.'},
    # Fracture — rib
    {'scenario': '55 år kvinne med pleuritisk smerte høyre side etter kraftig hoste i 2 uker (bronkitt). Fokal ømhet over ribbe 7 høyre. Smerte ved hoste og dyp inspirasjon.',
     'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om ribbefraktur etter hosteanfall.\n\nFunn:\n- Langvarig hosting (tilstrekkelig mekanisme)\n- Fokal ømhet over enkelt ribbe\n- Pleuritisk smerte\n- Smerte ved kompresjon\n\nRibbefrakturer ved hosting er vanlig, spesielt hos kvinner med mulig osteopeni.\n\nHANDLING: Rtg costa (ev. CT om klinisk mistanke ved negativ rtg). Smertelindring. Ingen manipulasjon av affisert område. Utelukk pneumothorax.'},
    # Infection — TB
    {'scenario': '35 år mann fra endemisk land, gradvis forverring av torakalsmerter over 3 måneder. Nattsvette, mild hoste, vekttap. CRP moderat forhøyet.',
     'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om spinal tuberkulose (Potts sykdom).\n\nFunn:\n- Fra TB-endemisk land (risikofaktor)\n- Langsomt progredierande forløp (typisk for TB)\n- Konstitusjonelle symptomer (nattsvette, hoste, vekttap)\n- Torakalaffeksjon (vanligste lokalisasjon for spinal TB)\n\nHANDLING: Rtg thorax, MR torakalcolumna. Quantiferon-test/Mantoux. Sputumprøver. Henvisning infeksjonsmedisin. INGEN manipulasjon.'},
    # Vascular — DVT
    {'scenario': '45 år kvinne med ensidig legghevelse, rødme og varme etter 12 timers flyreise. P-piller. Smerte i leggen ved dorsalfleksjon av fot (Homans). Korsryggsmerte.',
     'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om dyp venetrombose (DVT) med sekundær ryggsmerte.\n\nFunn:\n- Unilateral legghevelse med rubor og calor\n- Risikofaktorer (langvarig immobilisering + p-piller)\n- Positiv Homans test\n- Korsryggsmerte kan være sekundær til DVT/bekkenvenetrombose\n\nDVT kan gi korsryggsmerte via iliofemoralt nivå. Risiko for lungeemboli.\n\nHANDLING: D-dimer, doppler-ultralyd bein. Legevakt. INGEN manuell behandling av bein.'},
    # Progressive neuro — syringomyelia
    {'scenario': '30 år mann med gradvis tap av smerte- og temperatursans i begge hender (kappe-distribusjon). Normal berøring. Svakhet i hender. MR ikke tatt.',
     'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om syringomyeli.\n\nFunn:\n- Dissosiert sensorisk tap (smerte/temp tapt, berøring bevart)\n- Kappe-distribusjon (sentral medullalesjon)\n- Bilateral håndsvakhet\n\nDissosiert sensibilitetstap med kappe-distribusjon er patognomonisk for syringomyeli (sentral kavitet i ryggmargen).\n\nHANDLING: MR cervikalcolumna og total columna. Nevrolog. INGEN cervikal manipulasjon.'},
    # Medication — bisphosphonate
    {'scenario': '68 år kvinne på bisphosphonater i 8 år. Akutt lårsmerte uten traume. Prodromal smerte i laterale lår siste måneden. Perkusjonsøm midtre femur.',
     'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om atypisk femurfraktur (bisfosfonate-relatert).\n\nFunn:\n- Langvarig bisfosfonate-bruk (>5 år = risikofaktor)\n- Prodromal laterale lårsmerte (typisk)\n- Fokal ømhet midtre femur\n- Akutt forverring\n\nAtypiske femurfrakturer er en kjent bivirkning av langvarig bisfosfonate-behandling.\n\nHANDLING: Rtg femur (se etter lateral kortikal fortykning). INGEN belastning ved mistanke. Ortopedisk vurdering.'},
    # GCA variant
    {'scenario': '75 år mann med ny hodepine temporalt, skalpømhet (vondt å gre håret), tyggesmerter. Synstap høyre øye for 6 timer siden. SR 110.',
     'response': 'RØDE FLAGG IDENTIFISERT: Kjempecellearteritt (GCA) med okulær iskemi - AKUTT.\n\nFunn:\n- Temporal hodepine + skalpømhet\n- Tyggeclaudicatio\n- Akutt synstap (anterior iskemisk optikusnevropati)\n- Massivt forhøyet SR\n\nSynstap ved GCA er IRREVERSIBELT uten akutt behandling. Risiko for tap av syn i det andre øyet.\n\nHANDLING: AKUTT: IV metylprednisolon. Øyelegevurdering SAMME DAG. Temporal arteriebiopsi. Ring 113 ved akutt synstap.'},
    # Abdominal — ectopic
    {'scenario': '28 år kvinne med akutt ensidig nedre abdominalsmerte og korsryggsmerte. Lett vaginal blødning. Positiv graviditetstest. Ømhet nedre abdomen venstre.',
     'response': 'RØDE FLAGG IDENTIFISERT: Mistanke om ektopisk (ekstrauterin) graviditet.\n\nFunn:\n- Gravid (positiv test)\n- Akutt ensidig abdominalsmerte\n- Vaginalblødning\n- Korsryggsmerte\n\nEktopisk graviditet er potensielt livstruende ved ruptur (indre blødning).\n\nHANDLING: Ring 113 ved tegn til sjokk. Akutt ultralyd og blodprøver (hCG). Gynekologisk akuttvurdering. INGEN manuell behandling.'},
]

BULK_POSITIVE_EN = [
    {'scenario': 'Assess red flags: 45-year-old female with known large L4-L5 disc prolapse, 3 days of bilateral leg heaviness, now changed urination pattern, decreased inner thigh sensation.',
     'response': 'RED FLAGS IDENTIFIED: Early/incomplete cauda equina syndrome.\n\nFindings:\n- Known large disc prolapse\n- Bilateral symptoms\n- Altered bladder function\n- Developing saddle area sensory change\n\nACTION: Urgent MRI lumbar spine. Neurosurgical consultation. Call emergency services.'},
    {'scenario': 'Assess red flags: 62-year-old male, heavy smoker, new left shoulder pain 2 months, radiation to ulnar side of arm, cough, 4 kg weight loss, normal shoulder X-ray.',
     'response': 'RED FLAGS IDENTIFIED: Suspected Pancoast tumor (apical lung cancer).\n\nFindings:\n- Heavy smoker\n- Shoulder/arm pain with ulnar distribution (lower brachial plexus)\n- Cough\n- Weight loss\n- Normal shoulder X-ray (suggests extra-articular cause)\n\nACTION: CT thorax. Pulmonology referral. Stop shoulder treatment until cleared.'},
    {'scenario': 'Assess red flags: 57-year-old male with new low back pain 3 months, incidental hematuria, weight loss, constant right flank pain.',
     'response': 'RED FLAGS IDENTIFIED: Suspected renal cell carcinoma.\n\nFindings:\n- Hematuria\n- Flank pain\n- Weight loss\n- Constant pain pattern\n\nACTION: CT abdomen with contrast. Urinalysis. Urology referral. No manual treatment until cleared.'},
    {'scenario': 'Assess red flags: 45-year-old female, unilateral calf swelling, redness and warmth after 12-hour flight, on oral contraceptives, positive Homans sign.',
     'response': 'RED FLAGS IDENTIFIED: Suspected deep vein thrombosis (DVT).\n\nFindings:\n- Unilateral leg swelling with redness and warmth\n- Risk factors (prolonged immobilization + OCP)\n- Positive Homans sign\n\nDVT carries risk of pulmonary embolism.\n\nACTION: D-dimer, duplex ultrasound leg. Emergency department. No manual treatment of leg.'},
    {'scenario': 'Assess red flags: 30-year-old male, gradual loss of pain and temperature sensation in both hands (cape distribution), normal touch, hand weakness.',
     'response': 'RED FLAGS IDENTIFIED: Suspected syringomyelia.\n\nFindings:\n- Dissociated sensory loss (pain/temperature lost, touch preserved)\n- Cape distribution (central cord lesion)\n- Bilateral hand weakness\n\nACTION: MRI cervical and full spine. Neurology referral. No cervical manipulation.'},
    {'scenario': 'Assess red flags: 28-year-old female with acute unilateral lower abdominal pain and low back pain, light vaginal bleeding, positive pregnancy test.',
     'response': 'RED FLAGS IDENTIFIED: Suspected ectopic pregnancy.\n\nFindings:\n- Pregnant (positive test)\n- Acute unilateral abdominal pain\n- Vaginal bleeding\n- Low back pain\n\nEctopic pregnancy is potentially life-threatening if ruptured.\n\nACTION: Call emergency services if signs of shock. Urgent ultrasound and blood work (hCG). Gynecological emergency assessment. No manual treatment.'},
    {'scenario': 'Assess red flags: 35-year-old male from TB-endemic country, gradual worsening thoracic pain over 3 months, night sweats, mild cough, weight loss.',
     'response': 'RED FLAGS IDENTIFIED: Suspected spinal tuberculosis (Pott disease).\n\nFindings:\n- From TB-endemic country (risk factor)\n- Slowly progressive course (typical for TB)\n- Constitutional symptoms (night sweats, cough, weight loss)\n\nACTION: Chest X-ray, MRI thoracic spine. QuantiFERON/Mantoux test. Sputum samples. Infectious disease referral. No manipulation.'},
    {'scenario': 'Assess red flags: 75-year-old male, new temporal headache, scalp tenderness, jaw pain when eating, vision loss right eye 6 hours ago, ESR 110.',
     'response': 'RED FLAGS IDENTIFIED: Giant cell arteritis (GCA) with ocular ischemia - ACUTE.\n\nFindings:\n- Temporal headache + scalp tenderness\n- Jaw claudication\n- Acute vision loss (anterior ischemic optic neuropathy)\n- Markedly elevated ESR\n\nVision loss in GCA is IRREVERSIBLE without acute treatment.\n\nACTION: ACUTE: IV methylprednisolone. Ophthalmology same day. Temporal artery biopsy. Call emergency services for acute vision loss.'},
]

BULK_NEGATIVE_NO = [
    {'scenario': '32 år mann med akutt korsryggsmerte etter snømåking. Lokaliserte smerter. Normal SLR bilateralt. Full kraft. Ingen utstråling.',
     'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Akutt mekanisk korsryggsmerte.\n\nFunn:\n- Ung pasient med klar mekanisk årsak\n- Lokalisert smerte uten nevrologisk affeksjon\n- Negative provokasjonstester\n\nTrygt å behandle. Rask mobilisering, aktive øvelser, forventet bedring 2-6 uker.'},
    {'scenario': '50 år kvinne med frozen shoulder venstre. Gradvis tilstivning over 4 måneder. Nedsatt utoverrotasjon og abduksjon. Ingen traume. Normal rtg skulder.',
     'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Adhesiv kapsulitt (frozen shoulder) fase 2 (frozen).\n\nFunn:\n- Typisk restriksjonsmønster (kapsulært)\n- Gradvis forløp\n- Normal rtg\n\nTrygt å behandle med mobilisering innenfor smertetoleranse, hjemmeøvelser, pendulumøvelser.'},
    {'scenario': '18 år jente med torakal ryggsmerte relatert til dårlig holdning og skolesekk. Smerte mellom skulderbladene. Normal nevrologi. Ingen systemiske symptomer.',
     'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Holdningsrelatert torakal myalgi.\n\nFunn:\n- Ung pasient med klar ergonomisk årsak\n- Normal nevrologi\n- Ingen systemiske symptomer\n\nTrygt å behandle med ergonomisk rådgivning, holdningsøvelser, myofascielle teknikker.'},
    {'scenario': '40 år mann med plantarfascitt og hælsmerte i 3 måneder. Verst første skritt om morgenen. Øm medialt ved calcaneus. Ingen systemiske symptomer.',
     'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Plantarfasciopati.\n\nFunn:\n- Klassisk morgenstartsmerte\n- Typisk lokalisasjon\n- Ingen systemiske funn\n\nTrygt å behandle konservativt. Heavy slow resistance-trening, tøyning, ev. ortopediske innlegg.'},
    {'scenario': '35 år kvinne med bilateral TMJ-smerte og krepitasjon. Smerter ved tygging. Begrenset gapeevne. Kjevestramhet. Bruksisme om natten.',
     'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Temporomandibulær dysfunksjon (TMD).\n\nFunn:\n- Bilateral mekanisk kjevesmerte\n- Krepitasjon (degenerativ/mekanisk)\n- Bruksisme som utløsende/vedlikeholdende faktor\n\nTrygt å behandle med kjeveøvelser, myofasciell behandling av masticatorisk muskulatur, stressreduksjon. Vurder bittskinne.'},
    {'scenario': '28 år mann med akutt lumbal fasettlåsning. Antalgisk holdning. Smerter ved ekstensjon. Kan ikke rette seg opp. Normal nevrologi.',
     'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Akutt lumbal fasettlåsning.\n\nFunn:\n- Typisk akutt mekanisk presentasjon\n- Antalgisk lean (vanlig ved fasettpatologi)\n- Normal nevrologi\n\nTrygt å behandle med forsiktig mobilisering/manipulasjon, varme, aktive bevegelsesøvelser. Rask bedring forventet.'},
    {'scenario': '62 år mann med cervikal radikulopati C7 høyre. Utstråling til 3. finger. Nedsatt tricepsrefleks. Kraft 4+/5 triceps. Stabil i 2 uker.',
     'response': 'Ingen røde flagg identifisert. OBS: Monitorér for progresjon.\n\nKlinisk bilde: Cervikal radikulopati C6-C7.\n\nFunn:\n- Unilateral dermatomal smerte\n- Isolert refleksendring\n- Lett nedsatt kraft (4+/5, stabil)\n\nStabilt motorisk utfall 4+/5 er ikke akutt-indikasjon. Konservativ behandling aktuelt med tett oppfølging av kraft.'},
]

BULK_NEGATIVE_EN = [
    {'scenario': 'Assess red flags: 32-year-old male, acute low back pain after shoveling snow, localized, normal SLR bilaterally, full strength, no radiation.',
     'response': 'No red flags identified.\n\nClinical picture: Acute mechanical low back pain.\n\nFindings:\n- Young patient with clear mechanical cause\n- Localized pain without neurological involvement\n- Negative provocation tests\n\nSafe to treat. Early mobilization, active exercises, expected improvement 2-6 weeks.'},
    {'scenario': 'Assess red flags: 50-year-old female, frozen shoulder left, gradual stiffening over 4 months, reduced external rotation and abduction, no trauma.',
     'response': 'No red flags identified.\n\nClinical picture: Adhesive capsulitis (frozen shoulder) phase 2.\n\nFindings:\n- Typical capsular restriction pattern\n- Gradual course\n- Normal X-ray\n\nSafe to treat with mobilization within pain tolerance, home exercises, pendulum exercises.'},
    {'scenario': 'Assess red flags: 18-year-old girl, thoracic back pain related to posture and school bag, pain between shoulder blades, normal neuro, no systemic symptoms.',
     'response': 'No red flags identified.\n\nClinical picture: Posture-related thoracic myalgia.\n\nFindings:\n- Young patient with clear ergonomic cause\n- Normal neurology\n- No systemic symptoms\n\nSafe to treat with ergonomic advice, posture exercises, myofascial techniques.'},
    {'scenario': 'Assess red flags: 35-year-old female, bilateral TMJ pain and crepitus, pain when chewing, limited mouth opening, nighttime bruxism.',
     'response': 'No red flags identified.\n\nClinical picture: Temporomandibular dysfunction (TMD).\n\nFindings:\n- Bilateral mechanical jaw pain\n- Crepitus (mechanical)\n- Bruxism as contributing factor\n\nSafe to treat with jaw exercises, myofascial treatment of masticatory muscles, stress reduction. Consider occlusal splint.'},
    {'scenario': 'Assess red flags: 62-year-old male, C7 radiculopathy right, radiation to 3rd finger, reduced triceps reflex, strength 4+/5 triceps, stable for 2 weeks.',
     'response': 'No red flags identified. NOTE: Monitor for progression.\n\nClinical picture: C6-C7 cervical radiculopathy.\n\nFindings:\n- Unilateral dermatomal pain\n- Isolated reflex change\n- Mildly reduced strength (4+/5, stable)\n\nStable motor deficit of 4+/5 is not an acute surgical indication. Conservative treatment appropriate with close monitoring of strength.'},
]

# ============================================================
# FINAL BATCH — English parity + additional safe/positive
# ============================================================

FINAL_EN_POSITIVE = [
    {'scenario': 'Assess red flags: 55-year-old male, sudden severe headache "worst of my life", onset during exercise, neck stiffness, photophobia.',
     'response': 'RED FLAGS IDENTIFIED: Possible subarachnoid hemorrhage (SAH).\n\nFindings:\n- Thunderclap headache (sudden onset, worst ever)\n- Onset during exertion\n- Neck stiffness (meningism)\n- Photophobia\n\nACTION: Immediate referral to emergency department. Call emergency services. Do NOT perform cervical manipulation. CT head + lumbar puncture if CT negative.'},
    {'scenario': 'Assess red flags: 42-year-old female, progressive bilateral hand weakness over 6 weeks, difficulty with buttons, urinary urgency, unsteady gait, Lhermitte sign positive.',
     'response': 'RED FLAGS IDENTIFIED: Possible cervical myelopathy.\n\nFindings:\n- Progressive bilateral upper limb weakness\n- Fine motor dysfunction (buttons)\n- Bladder dysfunction (urgency)\n- Gait disturbance\n- Positive Lhermitte sign\n\nACTION: Urgent MRI cervical spine. Refer to neurosurgeon within 24-48 hours. Do NOT perform cervical manipulation. Progressive myelopathy may require surgical decompression.'},
    {'scenario': 'Assess red flags: 68-year-old male, new onset left-sided temporal headache, jaw claudication, scalp tenderness, ESR 85 mm/h, visual blurring episodes.',
     'response': 'RED FLAGS IDENTIFIED: Probable giant cell arteritis (GCA) / temporal arteritis.\n\nFindings:\n- Age >50 with new headache pattern\n- Jaw claudication (highly specific for GCA)\n- Scalp tenderness\n- Markedly elevated ESR (85)\n- Visual symptoms (risk of permanent blindness)\n\nACTION: Emergency referral. Start high-dose corticosteroids immediately (do not wait for biopsy). Temporal artery biopsy within 2 weeks. Visual symptoms = ophthalmic emergency.'},
    {'scenario': 'Assess red flags: 28-year-old male, 3 months of inflammatory low back pain, morning stiffness >60 minutes improving with activity, family history of ankylosing spondylitis, HLA-B27 positive.',
     'response': 'RED FLAGS IDENTIFIED: Probable ankylosing spondylitis.\n\nFindings:\n- Young male with inflammatory back pain pattern\n- Morning stiffness >60 min improving with movement\n- Family history of AS\n- HLA-B27 positive\n\nACTION: Refer to rheumatologist for DMARD therapy. MRI SI joints for early detection. Manual therapy may complement but should not replace medical management. Early treatment prevents structural progression.'},
    {'scenario': 'Assess red flags: 45-year-old female, acute chest pain radiating to left arm, diaphoresis, nausea, history of hypertension and diabetes.',
     'response': 'RED FLAGS IDENTIFIED: Possible acute coronary syndrome (ACS).\n\nFindings:\n- Chest pain radiating to left arm (classic cardiac pattern)\n- Diaphoresis + nausea (autonomic symptoms)\n- Multiple cardiovascular risk factors (HTN, diabetes)\n\nACTION: Call 911/112 immediately. Do NOT treat musculoskeletally. Have patient sit or lie down, aspirin if available and not contraindicated. This is a medical emergency — every minute counts.'},
    {'scenario': 'Assess red flags: 72-year-old female, new hip pain, no trauma, history of breast cancer 5 years ago, unintentional 8kg weight loss over 3 months, ESR elevated.',
     'response': 'RED FLAGS IDENTIFIED: Possible bone metastasis.\n\nFindings:\n- Previous malignancy (breast cancer — common bone metastasis source)\n- Significant unexplained weight loss (8kg/3mo)\n- New non-traumatic bone pain\n- Elevated inflammatory markers\n\nACTION: Urgent referral to oncologist. Order bone scan or PET-CT. Do NOT perform vigorous manual therapy on the affected area — risk of pathological fracture. Pain management while awaiting investigation.'},
    {'scenario': 'Assess red flags: 38-year-old female, sudden severe low back pain, bilateral leg numbness, unable to void since morning, perineal numbness.',
     'response': 'RED FLAGS IDENTIFIED: Probable cauda equina syndrome.\n\nFindings:\n- Bilateral leg numbness (bilateral involvement)\n- Urinary retention (unable to void)\n- Saddle anaesthesia (perineal numbness)\n\nACTION: Immediate emergency referral. Call emergency services. This is a surgical emergency — decompression within 48 hours significantly improves outcomes. MRI lumbar spine urgently. Do NOT attempt manual therapy.'},
    {'scenario': 'Assess red flags: 19-year-old male, progressive thoracolumbar kyphosis, pain worse at night, unexplained fatigue, low-grade fever for 2 weeks, recent immigration from TB-endemic country.',
     'response': 'RED FLAGS IDENTIFIED: Possible spinal tuberculosis (Pott disease).\n\nFindings:\n- Progressive kyphosis in young adult\n- Night pain\n- Constitutional symptoms (fatigue, low-grade fever)\n- Epidemiological risk factor (TB-endemic origin)\n\nACTION: Urgent referral for imaging (MRI spine + chest X-ray) and infectious disease consultation. Order TB testing (QuantiFERON/PPD). Do NOT manipulate. Spinal TB requires prolonged anti-tuberculous therapy.'},
    {'scenario': 'Assess red flags: 50-year-old female presenting with left calf pain and swelling after 12-hour flight, positive Homan sign, warmth and redness of calf.',
     'response': 'RED FLAGS IDENTIFIED: Probable deep vein thrombosis (DVT).\n\nFindings:\n- Unilateral calf pain with swelling\n- Recent prolonged immobility (12-hour flight)\n- Positive Homan sign\n- Local warmth and erythema\n\nACTION: Urgent referral for Doppler ultrasound of lower extremity. Do NOT massage or manipulate the affected leg. Risk of pulmonary embolism if clot dislodges. Anticoagulation therapy needed.'},
    {'scenario': 'Assess red flags: 6-year-old boy, limping for 3 weeks, hip pain, refuses to bear weight, low-grade fever, elevated CRP.',
     'response': 'RED FLAGS IDENTIFIED: Possible septic arthritis or Legg-Calvé-Perthes disease.\n\nFindings:\n- Child with persistent limp (>2 weeks)\n- Weight-bearing refusal\n- Low-grade fever with elevated CRP\n- Insidious onset\n\nACTION: Urgent pediatric referral. Hip X-ray and MRI. Blood cultures if septic arthritis suspected. Septic arthritis is a surgical emergency requiring joint washout. Do NOT delay for conservative trial. Legg-Calvé-Perthes also requires orthopedic management.'},
]

FINAL_EN_NEGATIVE = [
    {'scenario': 'Assess red flags: 30-year-old office worker, neck pain and headache for 2 weeks, pain in suboccipital region, tender upper trapezius bilaterally, full ROM with end-range stiffness.',
     'response': 'No red flags identified.\n\nClinical picture: Cervicogenic headache with myofascial tension.\n\nFindings:\n- Clear occupational ergonomic trigger\n- Suboccipital tension pattern\n- No neurological symptoms\n- Full ROM maintained\n\nSafe to treat with cervical mobilization, suboccipital release, ergonomic advice, and postural exercises.'},
    {'scenario': 'Assess red flags: 45-year-old male, acute low back pain after gardening yesterday, antalgic lean, positive SLR at 50 degrees right, normal reflexes and strength.',
     'response': 'No red flags identified.\n\nClinical picture: Acute lumbar disc irritation with radicular component.\n\nFindings:\n- Clear mechanical trigger (gardening)\n- Unilateral radicular signs\n- No motor deficit or bladder/bowel changes\n- Normal reflexes preserved\n\nSafe to treat conservatively. Reassure patient — most disc episodes resolve within 6-12 weeks. Active management preferred over bed rest.'},
    {'scenario': 'Assess red flags: 52-year-old female, bilateral knee pain worse with stairs, morning stiffness <30 minutes, crepitus on flexion, BMI 32.',
     'response': 'No red flags identified.\n\nClinical picture: Bilateral knee osteoarthritis.\n\nFindings:\n- Mechanical pain pattern (stairs, weight-bearing)\n- Brief morning stiffness (<30 min = mechanical, not inflammatory)\n- Crepitus (degenerative)\n- Obesity as contributing factor\n\nSafe to treat with weight management advice, quadriceps strengthening, activity modification. Consider referral for weight management program.'},
    {'scenario': 'Assess red flags: 25-year-old runner, gradual onset lateral knee pain during long runs, pain at 2km mark, tender over IT band, positive Ober test.',
     'response': 'No red flags identified.\n\nClinical picture: Iliotibial band syndrome.\n\nFindings:\n- Classic overuse pattern in runner\n- Predictable onset distance\n- Specific anatomical tenderness\n- Positive provocative test\n\nSafe to treat with foam rolling, hip abductor strengthening, running load modification, gait analysis. Gradual return to full distance over 4-6 weeks.'},
    {'scenario': 'Assess red flags: 60-year-old male, right shoulder pain for 3 months, unable to sleep on right side, painful arc 60-120 degrees, positive Neer and Hawkins tests, good strength.',
     'response': 'No red flags identified.\n\nClinical picture: Subacromial impingement / rotator cuff tendinopathy.\n\nFindings:\n- Classic painful arc pattern\n- Positive impingement tests\n- Preserved strength (no complete tear signs)\n- No night sweats, weight loss, or systemic features\n\nSafe to treat with rotator cuff strengthening, scapular stabilization, activity modification. If no improvement in 6-8 weeks, consider imaging.'},
    {'scenario': 'Assess red flags: 35-year-old female, intermittent tingling in both hands at night, worse in first 3 fingers, shaking hands relieves symptoms, positive Phalen test.',
     'response': 'No red flags identified.\n\nClinical picture: Bilateral carpal tunnel syndrome.\n\nFindings:\n- Classic nocturnal paraesthesia pattern\n- Median nerve distribution (thumb, index, middle)\n- Shaking relief (Flick sign)\n- Positive provocative test\n\nSafe to treat with wrist splinting (especially at night), nerve gliding exercises, ergonomic modification. Refer for NCS/EMG if conservative management fails after 6 weeks.'},
    {'scenario': 'Assess red flags: 14-year-old soccer player, anterior knee pain, tender tibial tuberosity, swelling over tibial tuberosity, pain with running and kneeling.',
     'response': 'No red flags identified.\n\nClinical picture: Osgood-Schlatter disease.\n\nFindings:\n- Adolescent with open growth plates\n- Classic tibial tuberosity tenderness\n- Activity-related pain pattern\n- No systemic symptoms, no night pain\n\nSafe to manage with activity modification (relative rest from aggravating sports), quadriceps stretching, ice after activity. Self-limiting condition that resolves with skeletal maturity.'},
    {'scenario': 'Assess red flags: 40-year-old male, right elbow pain, tender over lateral epicondyle, pain with gripping and wrist extension, gradual onset, works as carpenter.',
     'response': 'No red flags identified.\n\nClinical picture: Lateral epicondylalgia (tennis elbow).\n\nFindings:\n- Clear occupational overuse mechanism\n- Specific anatomical tenderness\n- Mechanical provocation pattern\n- No neurological symptoms\n\nSafe to treat with eccentric wrist extensor exercises, counterforce bracing, load management. Consider workplace ergonomic assessment.'},
    {'scenario': 'Assess red flags: 55-year-old female, diffuse muscle pain and fatigue for over a year, 14/18 tender points, sleep disturbance, no inflammatory markers elevated.',
     'response': 'No red flags identified.\n\nClinical picture: Fibromyalgia.\n\nFindings:\n- Widespread pain >3 months\n- Multiple tender points\n- Sleep dysfunction\n- Normal inflammatory markers (rules out inflammatory/autoimmune)\n\nSafe to manage with graded exercise therapy, sleep hygiene, stress management. May benefit from multidisciplinary approach. Manual therapy for symptom relief but not curative.'},
]

FINAL_NO_POSITIVE = [
    {'scenario': '35 år mann, akutt brystsmerter med utstråling til venstre arm, kaldsvett, kvalm, kjent hypertensjon.',
     'response': 'RØDE FLAGG IDENTIFISERT: Mulig akutt koronarsyndrom.\n\nFunn:\n- Brystsmerter med utstråling til venstre arm (klassisk kardial presentasjon)\n- Autonome symptomer (kaldsvett, kvalme)\n- Kjent kardiovaskulær risikofaktor (hypertensjon)\n\nHANDLING: Ring 113 umiddelbart. IKKE behandle muskuloskeletalt. La pasient sitte/ligge. Gi aspirin om tilgjengelig og ikke kontraindisert. Medisinsk nødsituasjon.'},
    {'scenario': '6 år gutt, halting i 3 uker, hoftesmerte, nekter å belaste, lavgradig feber, forhøyet CRP.',
     'response': 'RØDE FLAGG IDENTIFISERT: Mulig septisk artritt eller Legg-Calvé-Perthes sykdom.\n\nFunn:\n- Barn med vedvarende halting (>2 uker)\n- Nekter vektbelastning\n- Feber med forhøyet CRP\n\nHANDLING: Akutt henvisning til barnelege/ortoped. Røntgen og MR av hofte. Blodkulturer ved mistanke om septisk artritt. Septisk artritt er en kirurgisk nødsituasjon. IKKE forsink med konservativ prøvebehandling.'},
    {'scenario': '78 år kvinne, akutt ryggsmerte etter hosting, kjent osteoporose, uttalt kyfose, punktømhet Th12.',
     'response': 'RØDE FLAGG IDENTIFISERT: Sannsynlig osteoporotisk kompresjonsbrudd.\n\nFunn:\n- Kjent osteoporose (høy risiko)\n- Minimal traumemekanisme (hoste)\n- Akutt lokalisert smerte\n- Punktømhet over spesifikt segment\n\nHANDLING: Røntgen thorakolumbal columna. IKKE manipuler. Smertelindring, ortose ved behov. Henvisning for bentetthetsmåling og osteoporosebehandling om ikke allerede igangsatt.'},
    {'scenario': '22 år kvinne, akutt magesmerter høyre nedre kvadrant, positiv graviditetstest, vaginal blødning, svimmelhet.',
     'response': 'RØDE FLAGG IDENTIFISERT: Mulig ektopisk (ekstrauterin) graviditet.\n\nFunn:\n- Positiv graviditetstest\n- Akutte abdominalsmerter\n- Vaginal blødning\n- Svimmelhet (mulig hemodynamisk ustabilitet)\n\nHANDLING: Ring 113 umiddelbart. Mulig livstruende tilstand ved ruptur. IKKE utfør manuell behandling av lumbalcolumna/bekken. Krever akutt gynekologisk vurdering og ultralyd.'},
    {'scenario': '65 år mann, gradvis økende gangvansker over 3 måneder, nummenhet i begge hender, vannlatingshastverk, hyperrefleksi i underekstremiteter.',
     'response': 'RØDE FLAGG IDENTIFISERT: Mulig cervikal myelopati.\n\nFunn:\n- Progressiv gangforstyrrelse\n- Bilateral overekstremitets-nummenhet\n- Blæredysfunksjon (hastverk)\n- Hyperrefleksi (øvre motornevron-tegn)\n\nHANDLING: Akutt MR cervikalcolumna. Henvisning til nevrokirurg innen 24-48 timer. IKKE utfør cervikal manipulasjon. Progressiv myelopati kan kreve kirurgisk dekompresjon.'},
]

FINAL_NO_NEGATIVE = [
    {'scenario': '28 år mann, akutt nakkesmerte etter å ha sovet skjevt, torticollis mot høyre, smerte ved bevegelse, ingen utstråling.',
     'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Akutt torticollis / wry neck.\n\nFunn:\n- Klar mekanisk årsak (sovstilling)\n- Ensidig muskelspasme\n- Ingen nevrologiske symptomer\n- Ingen traumehistorie\n\nTrygt å behandle med forsiktig mobilisering, varme, muskelavspenning. Selvbegrensende tilstand som typisk bedres innen 3-7 dager.'},
    {'scenario': '50 år kvinne, smerter mellom skulderbladene, forverres ved kontorarbeid, bedre med bevegelse, spent øvre trapezius, full bevegelighet.',
     'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Postural thorakal myalgi.\n\nFunn:\n- Klar ergonomisk trigger\n- Smertemønster bedres med bevegelse (mekanisk)\n- Myofasciale funn\n- Full bevegelighet\n\nTrygt å behandle med thorakal mobilisering, myofascial behandling, ergonomisk veiledning og holdningsøvelser.'},
    {'scenario': '70 år mann, bilateral knesmerter, verre i trapper, morgenstivhet <20 minutter, krepitasjon ved fleksjon, BMI 30.',
     'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Bilateral kneartrose.\n\nFunn:\n- Mekanisk smertemønster (trapper, belastning)\n- Kort morgenstivhet (<30 min = mekanisk, ikke inflammatorisk)\n- Krepitasjon (degenerativ)\n- Overvekt som medvirkende faktor\n\nTrygt å behandle med quadricepsstyrking, vektreduksjonsveiledning, aktivitetstilpasning.'},
    {'scenario': '22 år kvinne, kronisk hodepine frontalt, 3-4 ganger/uke, stramhetskarakter, stress på jobb, ingen kvalme/aura/synsforstyrrelser.',
     'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Kronisk tensjonshodepine.\n\nFunn:\n- Typisk spenningshodepine-mønster (frontal, bilateral, stramhet)\n- Klar psykososial trigger (jobbstress)\n- Ingen migrene-karakteristika\n- Ingen nevrologiske ledsagersymptomer\n\nTrygt å behandle med nakke-/kjevebehandling, stresshåndtering, ergonomisk veiledning. Vurder dagbok for å identifisere triggere.'},
    {'scenario': '38 år mann, intermitterende korsryggsmerte i 5 år, mekanisk mønster, bedre med gange, forverres ved langvarig sitting, ingen utstråling.',
     'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Kronisk mekanisk korsryggsmerte.\n\nFunn:\n- Langvarig mekanisk mønster\n- Bedres med aktivitet (god prognostisk faktor)\n- Forverres med statisk belastning\n- Ingen nevrologiske symptomer\n\nTrygt å behandle med aktiv rehabilitering, kjernemuskulatur-styrking, ergonomisk veiledning. Fokus på egenmestring og gradert aktivitetsøkning.'},
]

# ============================================================
# EXTRA — push past 200 threshold
# ============================================================

EXTRA_NO_POSITIVE = [
    {'scenario': '55 år mann, ryggsmerter i 2 måneder, tidligere prostatakreft, nattsmerter som vekker ham, utilsiktet vekttap 6kg.',
     'response': 'RØDE FLAGG IDENTIFISERT: Mulig spinale metastaser.\n\nFunn:\n- Tidligere malignitet (prostatakreft — vanlig kilde til benmetastaser)\n- Nattsmerter som forstyrrer søvn\n- Uforklart vekttap\n\nHANDLING: Akutt henvisning til onkolog. MR hele columna. IKKE utfør kraftig manuell behandling — risiko for patologisk fraktur.'},
    {'scenario': '40 år kvinne, akutt rygg- og flankesmerter, feber 39.2°C, dysuri, bank-ømhet over nyrelosje.',
     'response': 'RØDE FLAGG IDENTIFISERT: Mulig pyelonefritt (nyreinfeksjon).\n\nFunn:\n- Feber med flankesmerter\n- Dysuri (urinveissymptomer)\n- Bankømhet over nyrelosje\n\nHANDLING: Akutt legehenvisning for urinprøve, blodprøver og antibiotika. Ikke manuell behandling av rygg — dette er en medisinsk tilstand, ikke muskuloskeletalt.'},
    {'scenario': '30 år mann, akutt sterke brystsmerter, verst mellom skulderbladene, rask puls, blekhet, kjent Marfan syndrom.',
     'response': 'RØDE FLAGG IDENTIFISERT: Mulig aortadisseksjon.\n\nFunn:\n- Akutte intense interskapulære smerter (klassisk for aortadisseksjon)\n- Hemodynamisk ustabilitet (rask puls, blekhet)\n- Kjent Marfan syndrom (sterk risikofaktor)\n\nHANDLING: Ring 113 umiddelbart. Livstruende nødsituasjon. IKKE behandle. Aortadisseksjon krever akutt CT-angiografi og potensielt kirurgi.'},
]

EXTRA_EN_POSITIVE = [
    {'scenario': 'Assess red flags: 55-year-old male, back pain for 2 months, history of prostate cancer, night pain waking him, unintentional 6kg weight loss.',
     'response': 'RED FLAGS IDENTIFIED: Possible spinal metastases.\n\nFindings:\n- History of malignancy (prostate cancer — common source of bone metastases)\n- Night pain disturbing sleep\n- Unexplained weight loss\n\nACTION: Urgent oncology referral. MRI whole spine. Do NOT perform vigorous manual therapy — risk of pathological fracture.'},
    {'scenario': 'Assess red flags: 40-year-old female, acute back and flank pain, fever 39.2C, dysuria, costovertebral angle tenderness.',
     'response': 'RED FLAGS IDENTIFIED: Possible pyelonephritis (kidney infection).\n\nFindings:\n- Fever with flank pain\n- Dysuria (urinary symptoms)\n- CVA tenderness\n\nACTION: Urgent medical referral for urinalysis, blood work and antibiotics. Do NOT treat back manually — this is a medical condition, not musculoskeletal.'},
    {'scenario': 'Assess red flags: 30-year-old male, acute severe chest pain worst between shoulder blades, rapid pulse, pallor, known Marfan syndrome.',
     'response': 'RED FLAGS IDENTIFIED: Possible aortic dissection.\n\nFindings:\n- Acute intense interscapular pain (classic for aortic dissection)\n- Hemodynamic instability (tachycardia, pallor)\n- Known Marfan syndrome (strong risk factor)\n\nACTION: Call 911 immediately. Life-threatening emergency. Do NOT treat. Aortic dissection requires urgent CT angiography and potentially surgery.'},
]

EXTRA_NO_NEGATIVE = [
    {'scenario': '45 år kvinne, gradvis innsettende skuldersmerter høyre, kan ikke ligge på høyre side, smertefull bue 60-120 grader, god styrke.',
     'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Subakromial impingement / rotator cuff tendinopati.\n\nFunn:\n- Klassisk smertefull bue-mønster\n- Ingen nattesvette, vekttap eller systemiske symptomer\n- Bevart styrke\n\nTrygt å behandle med rotator cuff-styrking, skapulastabilisering, aktivitetstilpasning.'},
    {'scenario': '32 år mann, smerter lateralt i kne ved løping, typisk ved 3 km, øm over IT-båndet, positiv Ober test.',
     'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Iliotibial bånd-syndrom.\n\nFunn:\n- Klassisk overbelastningsmønster hos løper\n- Forutsigbar smertedebut ved bestemt distanse\n- Spesifikk anatomisk ømhet\n\nTrygt å behandle med foam rolling, hofteabduktor-styrking, løpsmengde-tilpasning.'},
    {'scenario': '18 år jente, diffuse korsryggsmerter etter styrketrening, bilateral muskelstramhet, full ROM, ingen utstråling, bedre med hvile.',
     'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Treningsrelatert muskulær korsryggsmerte.\n\nFunn:\n- Klar mekanisk trigger (styrketrening)\n- Bilateral muskulært mønster\n- Ung pasient uten risikofaktorer\n- Full bevegelighet, ingen nevrologiske funn\n\nTrygt å behandle med myofascial behandling, treningsveiledning og gradert tilbakegang til aktivitet.'},
    {'scenario': '65 år mann, stivhet og smerte i begge skuldre om morgenen, varer ca 15 minutter, artrose-forandringer på røntgen, god styrke.',
     'response': 'Ingen røde flagg identifisert.\n\nKlinisk bilde: Bilateral skulderartrose.\n\nFunn:\n- Kort morgenstivhet (<30 min = mekanisk)\n- Røntgenbekreftet artrose\n- God styrke bevart\n- Ingen inflammatoriske markører eller systemiske symptomer\n\nTrygt å behandle med bevegelsesøvelser, styrketrening, smertelindring. NB: Morgenstivhet >45 min ville krevd utredning for inflammatorisk tilstand (PMR/RA).'},
]

EXTRA_EN_NEGATIVE = [
    {'scenario': 'Assess red flags: 18-year-old female, diffuse low back pain after weight training, bilateral muscle tightness, full ROM, no radiation, improves with rest.',
     'response': 'No red flags identified.\n\nClinical picture: Exercise-related muscular low back pain.\n\nFindings:\n- Clear mechanical trigger (weight training)\n- Bilateral muscular pattern\n- Young patient without risk factors\n- Full ROM, no neurological findings\n\nSafe to treat with myofascial therapy, exercise guidance, and graded return to activity.'},
    {'scenario': 'Assess red flags: 65-year-old male, stiffness and pain in both shoulders in morning, lasting about 15 minutes, osteoarthritis on X-ray, good strength.',
     'response': 'No red flags identified.\n\nClinical picture: Bilateral shoulder osteoarthritis.\n\nFindings:\n- Brief morning stiffness (<30 min = mechanical)\n- X-ray confirmed OA\n- Good strength preserved\n- No inflammatory markers or systemic symptoms\n\nSafe to treat with ROM exercises, strengthening, pain management. NOTE: Morning stiffness >45 min would require investigation for inflammatory condition (PMR/RA).'},
]

# ============================================================
# Generation Functions
# ============================================================

def generate_all_examples():
    """Generate all training examples."""
    examples = []

    def add(scenario_list, lang='no'):
        for item in scenario_list:
            sys_prompt = SYSTEM_PROMPT_NO if lang == 'no' else SYSTEM_PROMPT_EN
            prefix = 'Vurder røde flagg: ' if lang == 'no' else 'Assess red flags: '

            scen = item['scenario']
            if not scen.startswith(prefix) and not scen.startswith('Differensial') and not scen.startswith('Differential'):
                scen = prefix + scen

            examples.append({
                "messages": [
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": scen},
                    {"role": "assistant", "content": item['response']}
                ]
            })

    # === Norwegian Positive (existing + expanded) ===
    add(CAUDA_EQUINA_POSITIVE, 'no')
    add(CANCER_POSITIVE, 'no')
    add(FRACTURE_POSITIVE, 'no')
    add(INFECTION_POSITIVE, 'no')
    add(VASCULAR_POSITIVE, 'no')
    add(PROGRESSIVE_NEURO_POSITIVE, 'no')
    add(INFLAMMATORY_POSITIVE, 'no')

    # === New Norwegian categories ===
    add(PEDIATRIC_RED_FLAGS, 'no')
    add(CARDIAC_MIMICKERS, 'no')
    add(ABDOMINAL_VISCERAL, 'no')
    add(TEMPORAL_ARTERITIS_GCA, 'no')
    add(MEDICATION_RISKS, 'no')

    # === Norwegian Negative (expanded) ===
    add(NEGATIVE_SCENARIOS, 'no')

    # === Norwegian Borderline ===
    add(BORDERLINE_SCENARIOS_NO, 'no')

    # === Norwegian Differential Diagnosis ===
    add(DIFFERENTIAL_SCENARIOS_NO, 'no')

    # === English Positive ===
    add(EN_POSITIVE, 'en')

    # === English Negative ===
    add(EN_NEGATIVE, 'en')

    # === English Borderline ===
    add(BORDERLINE_SCENARIOS_EN, 'en')

    # === English Differential Diagnosis ===
    add(DIFFERENTIAL_SCENARIOS_EN, 'en')

    # === Additional augmented variants ===
    add(ADDITIONAL_POSITIVE_NO, 'no')
    add(ADDITIONAL_POSITIVE_EN, 'en')
    add(ADDITIONAL_NEGATIVE_NO, 'no')
    add(ADDITIONAL_NEGATIVE_EN, 'en')

    # === Bulk additional variants ===
    add(BULK_POSITIVE_NO, 'no')
    add(BULK_POSITIVE_EN, 'en')
    add(BULK_NEGATIVE_NO, 'no')
    add(BULK_NEGATIVE_EN, 'en')

    # === Final batch — English parity + more safe/positive ===
    add(FINAL_EN_POSITIVE, 'en')
    add(FINAL_EN_NEGATIVE, 'en')
    add(FINAL_NO_POSITIVE, 'no')
    add(FINAL_NO_NEGATIVE, 'no')

    # === Extra — push past 200 ===
    add(EXTRA_NO_POSITIVE, 'no')
    add(EXTRA_EN_POSITIVE, 'en')
    add(EXTRA_NO_NEGATIVE, 'no')
    add(EXTRA_EN_NEGATIVE, 'en')

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

    # Count categories
    positive_no = sum(1 for ex in examples
                      if ('RØDE FLAGG' in ex['messages'][-1]['content']
                          or 'Klinisk bilde forenlig' in ex['messages'][-1]['content'])
                      and ex['messages'][0]['content'] == SYSTEM_PROMPT_NO)
    positive_en = sum(1 for ex in examples
                      if 'RED FLAGS' in ex['messages'][-1]['content']
                      and ex['messages'][0]['content'] == SYSTEM_PROMPT_EN)
    negative_no = sum(1 for ex in examples
                      if 'Ingen røde flagg' in ex['messages'][-1]['content']
                      or 'Ingen akutte røde flagg' in ex['messages'][-1]['content'])
    negative_en = sum(1 for ex in examples
                      if ('No red flags' in ex['messages'][-1]['content']
                          or 'No acute red flags' in ex['messages'][-1]['content']))
    diff_no = sum(1 for ex in examples
                  if 'Differensialdiagnoser' in ex['messages'][-1]['content']
                  and ex['messages'][0]['content'] == SYSTEM_PROMPT_NO)
    diff_en = sum(1 for ex in examples
                  if 'Differential diagnos' in ex['messages'][-1]['content']
                  and ex['messages'][0]['content'] == SYSTEM_PROMPT_EN)

    print(f"Generated {len(examples)} red flag training examples")
    print(f"  Norwegian positive (red flags): {positive_no}")
    print(f"  Norwegian negative (safe): {negative_no}")
    print(f"  Norwegian differential: {diff_no}")
    print(f"  English positive (red flags): {positive_en}")
    print(f"  English negative (safe): {negative_en}")
    print(f"  English differential: {diff_en}")
    print(f"  Output: {output_file}")


if __name__ == '__main__':
    main()
