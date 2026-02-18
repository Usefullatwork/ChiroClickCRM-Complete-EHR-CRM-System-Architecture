#!/usr/bin/env python3
"""
Generate edge case training data for clinical scenarios that are
underrepresented in the main training sets.

Categories:
1. Multi-complaint presentations (~20)
2. Age-variant cases (~20)
3. Communication edge cases (~20)
4. Gonstead vs Diversified notation (~20)
5. Complex multi-visit SOAP notes (~20)

Output: ChatML format compatible with train_unsloth.py
Target: ~100 examples
"""

import json
from pathlib import Path

SYSTEM_PROMPT_CLINICAL = (
    'Du er en erfaren kiropraktor-assistent. '
    'Hjelp med klinisk dokumentasjon, SOAP-notater og pasientkommunikasjon. '
    'Bruk norsk fagterminologi og følg ICPC-2 kodeverket.'
)

SYSTEM_PROMPT_COMM = (
    'Du er en kommunikasjonsassistent for kiropraktisk klinikk. '
    'Generer profesjonelle, vennlige meldinger på norsk. '
    'Følg norsk personvernlovgivning (GDPR) — aldri nevn diagnose i SMS.'
)

SYSTEM_PROMPT_EN = (
    'You are an experienced chiropractic assistant. '
    'Help with clinical documentation, SOAP notes, and patient communication. '
    'Use proper clinical terminology.'
)

# ============================================================
# 1. MULTI-COMPLAINT PRESENTATIONS
# ============================================================

MULTI_COMPLAINT = [
    {
        'prompt': 'Skriv SOAP for pasient med både nakkesmerter og korsryggsmerter etter MC-ulykke for 1 uke siden.',
        'response': (
            'S: Pas. oppsøker klinikken 1 uke etter MC-ulykke. Klager over nakkesmerter med hodepine '
            'og samtidig korsryggsmerte. Nakkesmertene stråler til venstre skulder. Korsryggsmertene '
            'forverres ved sitting. Har brukt Ibux 400mg x3/dag med moderat effekt. Ingen nummenhet '
            'eller svakhet i ekstremiteter. Ingen blære-/tarmforstyrrelser.\n\n'
            'O: Nakke: Redusert ROM — fleksjon 30° (N: 50°), rotasjon V 50° (N: 80°). '
            'Palpatorisk ømhet C2-C5 paraspinalt bilat, m. trapezius V>H. '
            'Korsrygg: Redusert fleksjon, Schober 3cm (N: 5cm). Ømhet L4-L5 paraspinalt H. '
            'SLR negativ bilat. Nevrologisk ue: Kraft 5/5, reflekser sidelike, sensibilitet intakt.\n\n'
            'A: 1) Cervikalt akselerasjon-/deselerasjonssyndrom (WAD grad II) — L01 ICPC-2\n'
            '   2) Mekanisk korsryggsmerte — L03 ICPC-2\n\n'
            'P: 1) Manuell behandling nakke: Mobilisering C2-C5, myofascial frigjøring trapezius/levator\n'
            '   2) Manuell behandling korsrygg: Mobilisering L4-L5, trigger point iliopsoas\n'
            '   3) Hjemmeøvelser: Chin tucks, cat-camel, McKenzie-øvelser\n'
            '   4) Anbefalt 2x/uke i 4 uker, re-evaluering etter 8 behandlinger\n'
            '   5) Forsikringsdokumentasjon sendt'
        )
    },
    {
        'prompt': 'Skriv SOAP for pasient med hodepine, kjevesmerter og svimmelhet.',
        'response': (
            'S: 38 år kvinne med 3 måneders historie med frontal hodepine, bilateral kjevesmerte '
            'og episodisk svimmelhet. Hodepine 5/10, forverres ved kjevebelastning. Tygger tyggis daglig. '
            'Svimmelhet kortvarig ved hodebevegelser. Stress på jobb. Ikke kvalme eller synsforstyrrelser.\n\n'
            'O: Cervikal ROM full, lett endekjennelse. TMJ: Redusert gapeåpning 32mm (N: 40-50mm), '
            'krepitasjon bilat, ømhet m. masseter og m. temporalis bilat. Nakke: Ømhet suboccipitalt '
            'og C1-C2. Dix-Hallpike negativ. Head impulse test normal.\n\n'
            'A: 1) Temporomandibulær dysfunksjon (TMD) — L07 ICPC-2\n'
            '   2) Cervikogen hodepine sek. til TMD og cervikal dysfunksjon — N02 ICPC-2\n'
            '   3) Cervikal svimmelhet (cervicogen vertigo) — N17 ICPC-2\n\n'
            'P: 1) Kjeveledd: Intraoral masseter-behandling, lateral pterygoid frigjøring\n'
            '   2) Nakke: Øvre cervikal mobilisering C0-C2, suboccipital frigjøring\n'
            '   3) Råd: Stoppe tyggisbruk, myk kost 2 uker, varmepakke kjeve kveld\n'
            '   4) Hjemmeøvelser: Kjeveåpningsøvelser, nakketøyning\n'
            '   5) Re-evaluering om 2 uker, vurder bittskinner ved manglende bedring'
        )
    },
    {
        'prompt': 'Skriv SOAP for pasient med skulder- og albuesmerter ipsilateralt, mistenkt dobbeltknusningsyndrom.',
        'response': (
            'S: 52 år mann, 6 ukers gradvis innsettende smerter i høyre skulder og albue. '
            'Skuldersmerte lateralt, albue medialt. Prikking i 4. og 5. finger. Kontorarbeider. '
            'Ingen traume.\n\n'
            'O: Skulder H: Positiv Neer, Hawkins. Smertefull bue 70-120°. '
            'Albue H: Positiv Tinel over sulcus n. ulnaris. Redusert grep 4/5 H. '
            'Nakke: C6-C7 segmental restriksjon. Spurling negativ. '
            'Nervepalpasjon: Ømhet langs n. ulnaris fra aksille til albue.\n\n'
            'A: 1) Subakromial impingement H skulder — L08 ICPC-2\n'
            '   2) Ulnar nerveirritasjon albue H — N94 ICPC-2\n'
            '   3) Mistenkt dobbeltknusning (double crush): proksimal kompresjon cervikal + '
            'distal entrapment albue\n\n'
            'P: 1) Cervikal mobilisering C6-C7, scalene-frigjøring\n'
            '   2) Nervegliding: ulnar nerve flossing daglig\n'
            '   3) Skulder: Rotator cuff-styrking, ergonomisk veiledning\n'
            '   4) Vurder NCV/EMG om ikke bedring etter 4 uker\n'
            '   5) Unngå langvarig albufleksjon (nattskinner vurderes)'
        )
    },
    {
        'prompt': 'Skriv SOAP for gravid pasient (uke 32) med bekken- og korsryggsmerter.',
        'response': (
            'S: 34 år kvinne, gravid uke 32, bekken- og korsryggsmerter siste 4 uker. '
            'Smerte over SI-ledd bilat, verst V side. Vending i sengen svært smertefullt. '
            'Gangdistanse redusert til 500m. Ingen utstråling, ingen nummenhet. '
            'Ingen urininkontinens ut over normalt for svangerskapet.\n\n'
            'O: Gange: Lett vaggende, forkortet steglengde. Bekkenprovokasjon: '
            'Posterior pelvis pain provocation test (P4) positiv V. Active SLR positiv V. '
            'Patrick/FABER positiv V. Symfsye-palpasjon uøm. Nevrologisk ue normal.\n\n'
            'A: Svangerskapsrelatert bekkenleddssmerte (pelvic girdle pain, PGP) — W75 ICPC-2\n\n'
            'P: 1) Sideliggende bekkenbehandling: SI-ledd mobilisering V, gluteal frigjøring\n'
            '   2) Bekkenbelteanbefaling (støttebelte)\n'
            '   3) Øvelser: Bekkenbunnstrening, sideplanke modifisert, knekkbrett\n'
            '   4) Ergonomisk råd: Pute mellom knærne ved søvn, unngå langvarig stående\n'
            '   5) Ukentlig oppfølging frem til fødsel\n'
            '   NB: Ingen ryggliggende teknikker etter uke 20, ingen lumbal manipulasjon'
        )
    },
    {
        'prompt': 'Skriv SOAP for idrettsutøver med hamstring-tendinopati og samtidig korsryggsmerte.',
        'response': (
            'S: 27 år mann, fotballspiller, 8 ukers gradvis sittesmerte H og korsryggsmerte. '
            'Smerter forverres ved sprint og langvarig sitting. Tidligere hamstringskade H 2 år siden. '
            'Ingen nummenhet eller pareser.\n\n'
            'O: Korsrygg: Lett redusert fleksjon. L5-S1 segmental dysfunksjon. SLR reproduserer '
            'sittebeinssmerte ved 60° H (sensitisering, ikke radikulopati). '
            'Hofte: Puranen-Orava positiv H. Ømhet prox. hamstring insertjon H. '
            'Kraft: Hamstring H 4+/5 eksentrist. Nordic hamstring: smerte ved H.\n\n'
            'A: 1) Proksimal hamstring-tendinopati H — L87 ICPC-2\n'
            '   2) Segmental lumbal dysfunksjon L5-S1 (medvirkende) — L03 ICPC-2\n\n'
            'P: 1) Lumbal mobilisering L5-S1\n'
            '   2) Isometrisk hamstringbelastning: 45° hoftebøy hold, 5x45sek\n'
            '   3) Progressiv eksentrisk trening over 6 uker\n'
            '   4) Shockwave-terapi over prox. hamstring 1x/uke i 4 uker\n'
            '   5) Gradert return-to-sport protokoll: løping uke 4, sprint uke 8'
        )
    },
    {
        'prompt': 'Write a SOAP note for patient with concurrent thoracic pain and costochondritis.',
        'response': (
            'S: 45-year-old female, 3 weeks of anterior chest pain and mid-thoracic pain. '
            'Chest pain sharp, worse with deep breathing and trunk rotation. Thoracic pain '
            'aching, between shoulder blades. Cardiac workup negative (ECG, troponin normal per GP). '
            'Stress at work. No fever, no cough.\n\n'
            'O: Thoracic spine: Reduced extension, segmental restriction T4-T6. '
            'Paravertebral hypertonicity bilateral. Anterior chest: Tenderness at '
            'costochondral junctions 3rd-5th ribs bilateral, left > right. '
            'Rib spring test positive T4-T6. Cardiac and respiratory exam: unremarkable.\n\n'
            'A: 1) Costochondritis — L04 ICPC-2\n'
            '   2) Thoracic segmental dysfunction T4-T6 — L04 ICPC-2\n'
            '   Likely interconnected: thoracic hypomobility contributing to '
            'costovertebral and costochondral stress.\n\n'
            'P: 1) Thoracic manipulation T4-T6 (supine or prone)\n'
            '   2) Rib mobilization 3rd-5th ribs\n'
            '   3) Myofascial release: intercostals, pectoralis minor\n'
            '   4) Breathing exercises: diaphragmatic breathing 3x/day\n'
            '   5) Posture correction advice for workstation\n'
            '   6) Reassurance: cardiac causes excluded'
        )
    },
    {
        'prompt': 'Skriv SOAP for eldre pasient med spinal stenose og perifer nevropati (diabetiker).',
        'response': (
            'S: 72 år mann, diabetes type 2 i 15 år, økende gangvansker og bilateral beinsmerte '
            'siste 6 mnd. Smerte og tyngdefølelse i begge legger ved gange >200m, bedres ved '
            'å sitte ned eller bøye seg fremover. Samtidig brennende føtter og nedsatt følelse '
            'i tærne. HbA1c 8.2%. Bruker Metformin.\n\n'
            'O: Gange: Fremoverlent holdning, kort steglengde. Lumbal fleksjon lett redusert, '
            'ekstensjon reproduserer beinsymptomer bilat. Nevrologisk: Redusert vibrasjon begge '
            'stortær (diabetisk nevropati), akillesrefleks redusert bilat. Dorsalis pedis-puls '
            'palpabel bilat. Romberg mild ustøhet.\n\n'
            'A: 1) Lumbal spinal stenose — L86 ICPC-2\n'
            '   2) Diabetisk perifer nevropati — T90 ICPC-2\n'
            '   Sammensatt bilde: Begge tilstander bidrar til gangvansker. '
            'Stenosesymptomer (claudicatio) overlapper med nevropatisk smerte.\n\n'
            'P: 1) Fleksjonbasert mobilisering lumbal, sideliggende\n'
            '   2) Williams fleksjonsøvelser, stasjonær sykkel\n'
            '   3) Ganghjelpemiddel-vurdering (rullator gir fleksjon-avlastning)\n'
            '   4) Koordinere med fastlege: HbA1c-optimalisering, nevropati-oppfølging\n'
            '   5) IKKE ekstensjonbaserte øvelser (forverrer stenose)\n'
            '   6) Vurder MR lumbal om ikke utført, kirurgisk vurdering ved funksjonstap'
        )
    },
]

# ============================================================
# 2. AGE-VARIANT CASES
# ============================================================

AGE_VARIANT = [
    {
        'prompt': 'Skriv SOAP for 8 år gammel gutt med ryggsmerter. Foreldre er bekymret.',
        'response': (
            'S: 8 år gammel gutt henvist av foreldre for korsryggsmerter i 3 uker. '
            'Ingen spesifikt traume, gradvis debut. Smerte verst etter fotballtrening. '
            'Ingen nattsmerter, ingen vekttap, ingen feber. Appetitt normal. Ingen '
            'nevrologiske symptomer. Familiehistorie: Far med skiveproblemer.\n\n'
            'O: Observasjon: Normal holdning, normal gangmønster. Lumbal ROM: Full, '
            'smerte ved hyperekstensjon. Palpatorisk ømhet L5 spinosus. Nevrologisk: '
            'Kraft 5/5 bilat, reflekser normale, sensibilitet intakt. '
            'Enbensstående hyperekstensjon (stork test): positiv smerte L5.\n\n'
            'A: Mistenkt spondylolyse L5 — L03 ICPC-2\n'
            '   NB: Ryggsmerter hos barn <10 år krever alltid grundig utredning. '
            'Mekanisk mønster med positiv stork test tyder på spondylolyse.\n\n'
            'P: 1) Røntgen lumbalcolumna med skråprojeksjon\n'
            '   2) Ved negativ røntgen og vedvarende symptomer: MR eller SPECT-CT\n'
            '   3) Midlertidig pause fra fotball til diagnose er bekreftet\n'
            '   4) Kjernemuskulatur-stabilisering (alderstilpasset)\n'
            '   5) Informere foreldre: Vanligste årsak til ryggsmerter i denne aldersgruppen\n'
            '   6) Oppfølging om 2 uker med bildediagnostikk-resultater'
        )
    },
    {
        'prompt': 'Skriv SOAP for 16 år jente med Scheuermanns sykdom.',
        'response': (
            'S: 16 år jente henvist fra fastlege med påvist Scheuermanns sykdom (Th7-Th10). '
            'Økt thorakal kyfose oppdaget av mor. Perioder med stivhet mellom skulderbladene. '
            'Smerte 3/10, verst etter langvarig sitting. Aktiv i turn.\n\n'
            'O: Holdning: Økt thorakal kyfose, kompensatorisk cervikal lordose. '
            'Adam\'s test: Kyfose reduseres ikke fullt i fleksjon (strukturell komponent). '
            'Thorakal ROM: Redusert ekstensjon. Palpatorisk ømhet Th7-Th10 paraspinalt. '
            'Hamstrings: Stramme bilat. Pectoralis: Forkortet bilat.\n\n'
            'A: Scheuermanns sykdom, thorakal type (Th7-Th10) — L85 ICPC-2\n'
            '   Grad: Moderat (kyfose ca 55°, normalt <40°). Fortsatt vekstpotensial.\n\n'
            'P: 1) Thorakal mobilisering (forsiktig — respekter endeplater)\n'
            '   2) Myofascial frigjøring: pec minor, øvre trapezius\n'
            '   3) Treningsprogram: Thorakal ekstensjonsstyrking, rhomboideus, '
            'nedre trapezius, hamstring-tøyning\n'
            '   4) Turnaktivitet: Kan fortsette med modifikasjon (unngå repetert hyperfleksjon)\n'
            '   5) Koordinere med ortoped: Bracing-vurdering om Cobb >60°\n'
            '   6) Oppfølging 1x/mnd under vekstperioden'
        )
    },
    {
        'prompt': 'Skriv SOAP for 85 år gammel kvinne med akutt nakkesmerte. Skrøpelig, osteoporose.',
        'response': (
            'S: 85 år kvinne, kjent osteoporose (T-score -3.2), akutt nakkesmerte etter å ha '
            'snudd seg brått. Smerte 6/10 cervikal, stivhet. Ingen utstråling til armer. '
            'Ingen hodepine, svimmelhet eller synsforstyrrelser. Bruker Prolia og kalsium. '
            'ADL påvirket — kan ikke se seg over skulderen ved bilkjøring.\n\n'
            'O: Cervikal ROM: Betydelig redusert alle retninger (rotasjon 20°/25°, '
            'fleksjon 15°, ekstensjon 10°). Palpatorisk: Diffus myofascial ømhet C2-C6 '
            'paraspinalt. Ingen segmental instabilitet. Nevrologisk oe: Intakt. '
            'Vertebral arterie-test: Negativ.\n\n'
            'A: Akutt cervikal myalgi hos osteoporotisk pasient — L01 ICPC-2\n'
            '   Aldersbetinget degenerativ endring og muskulær dekondisjonering.\n\n'
            'P: 1) Forsiktig myofascial behandling: ISDN-teknikk, lett massasje\n'
            '   2) INGEN manipulasjon (osteoporose = absolutt kontraindikasjon for HVLA)\n'
            '   3) INGEN brå bevegelser eller kraftig mobilisering\n'
            '   4) Varmebehandling, gentle ROM-øvelser\n'
            '   5) Isometrisk nakkestyrking (svært lett belastning)\n'
            '   6) Fallforebygging: Vurder balanse og hjemmeforhold\n'
            '   7) Oppfølging ukentlig i 3 uker, deretter behovsstyrt'
        )
    },
    {
        'prompt': 'Write SOAP for a 3-year-old child brought in by parents for torticollis.',
        'response': (
            'S: 3-year-old girl brought by parents with head tilted to the left for 2 days. '
            'No trauma reported. Had upper respiratory infection last week. No fever currently. '
            'Eating and drinking normally. No vomiting. Parents noticed she cries when trying '
            'to turn head to the right.\n\n'
            'O: Observation: Head tilted left, chin rotated right. Active ROM: Severely limited '
            'right rotation. Passive ROM: Limited with guarding. Cervical palpation: '
            'SCM spasm left. Neurological: Alert, pupils equal, no focal deficits observed. '
            'No lymphadenopathy. Temperature 36.8°C.\n\n'
            'A: Acute torticollis in pediatric patient\n'
            '   Differential: Atlantoaxial rotatory subluxation (Grisel syndrome post-URI), '
            'muscular torticollis, posterior fossa pathology.\n\n'
            'P: 1) DO NOT MANIPULATE — pediatric cervical spine requires special caution\n'
            '   2) Refer to pediatrician for evaluation\n'
            '   3) Consider C-spine X-ray (open mouth view if cooperative) to rule out '
            'atlantoaxial rotatory subluxation\n'
            '   4) If Grisel syndrome suspected: urgent ENT + orthopedic referral\n'
            '   5) Gentle soft tissue work only if muscular cause confirmed\n'
            '   6) Follow up after medical clearance'
        )
    },
    {
        'prompt': 'Skriv SOAP for 70 år mann med nyoppstått bilateral skuldersmerte og morgenstivhet >1 time.',
        'response': (
            'S: 70 år mann, 3 ukers progressiv bilateral skuldersmerte og stivhet. '
            'Morgenstivhet >1 time. Redusert evne til å kle seg. Generell tretthet, '
            'lett feber siste uke. Vektnedgang 2kg. Ingen hodepine eller synsproblemer.\n\n'
            'O: Bilateral skulder: Aktivt redusert ROM alle retninger (ABD 80°/80°, '
            'ER 30°/35°). Passivt noe bedre. Ingen rotator cuff-svakhet. '
            'Palpatorisk: Diffus ømhet proksimale muskelgrupper. '
            'Temporalarterier: Ikke fortykket, ikke ømme.\n\n'
            'A: Mistenkt polymyalgia rheumatica (PMR) — L99 ICPC-2\n'
            '   Røde flagg for inflammatorisk tilstand:\n'
            '   - Bilateral proksimal smerte, >50 år\n'
            '   - Morgenstivhet >45 min (inflammatorisk mønster)\n'
            '   - Konstitusjonelle symptomer (tretthet, feber, vekttap)\n\n'
            'P: 1) IKKE primært muskuloskeletalt — medisinsk tilstand\n'
            '   2) Akutt blodprøver: SR, CRP, CK, leverprøver, blodbilde\n'
            '   3) Henvisning til fastlege/revmatolog for prednisolon-oppstart\n'
            '   4) Utelukk GCA: Spør spesifikt om hodepine, kjeveklaudikasjon, '
            'synsforstyrrelser ved neste kontakt\n'
            '   5) Manuell behandling IKKE indisert før medisinsk avklaring\n'
            '   6) Telefonoppfølging om 1 uke'
        )
    },
    {
        'prompt': 'Skriv SOAP for tenåring med idiopathic skoliose, henvist for vurdering.',
        'response': (
            'S: 14 år jente, idiopatisk skoliose oppdaget ved skolehelseundersøkelse. '
            'Adam\'s test positiv. Ingen smerter. Menarke for 6 mnd siden (Risser sannsynlig 2-3). '
            'Mor hadde også skoliose.\n\n'
            'O: Holdning: Lett skulderasymmetri, H skulder høyere. Adam\'s test: '
            'Moderat thorakal prominens H (ATR 8°). Bekkenhøyde symmetrisk. '
            'Skoliometer: 8° thorakalt. Full ROM alle retninger uten smerte. '
            'Nevrologisk: Upåfallende.\n\n'
            'A: Adolescent idiopatisk skoliose, thorakal — L85 ICPC-2\n'
            '   ATR 8° — grensetilfelle for videre utredning. '
            'Risiko for progresjon: Moderat (familiehistorie, Risser 2-3, 6 mnd post-menarke).\n\n'
            'P: 1) Henvise til helrygg-røntgen stående (AP + lateral) for Cobb-vinkel\n'
            '   2) Hvis Cobb 20-40°: Vurder Schroth-øvelser eller bracing (SRS guidelines)\n'
            '   3) Hvis Cobb <20°: Observasjon med kontroll hver 6. mnd til skjelettvekst stopper\n'
            '   4) Kiropraktisk behandling: Mobilisering og muskelbalaseringsøvelser\n'
            '   5) IKKE påstå at kiropraktikk kurerer skoliose — evidens viser stabilisering, '
            'ikke korreksjon av strukturell kurve\n'
            '   6) Koordinere med ortoped ved Cobb >40° eller rask progresjon'
        )
    },
    {
        'prompt': 'Write SOAP for elderly patient (78) with acute rib pain after coughing, on blood thinners.',
        'response': (
            'S: 78-year-old male, acute left-sided rib pain since yesterday after severe '
            'coughing fit. On warfarin for atrial fibrillation (INR last check 2.8). '
            'Pain 7/10, worse with breathing and coughing. No chest tightness, no dyspnea '
            'at rest. No hemoptysis.\n\n'
            'O: Inspection: No visible bruising (yet). Point tenderness 7th rib left, '
            'anterolateral. Rib compression test: positive pain at 7th rib. '
            'Chest expansion reduced left. Lung auscultation: Clear bilateral. '
            'SpO2 97%. HR 78, regular.\n\n'
            'A: Suspected rib fracture (stress/insufficiency) — cough-induced\n'
            '   Risk factors: Age, anticoagulation (warfarin), possible osteoporosis.\n\n'
            'P: 1) Chest X-ray to confirm (note: initial X-ray misses 50% of rib fractures)\n'
            '   2) DO NOT manipulate thoracic spine or ribs\n'
            '   3) Coordinate with GP regarding anticoagulation management\n'
            '   4) Pain management: Breathing splinting technique, ice\n'
            '   5) Monitor for complications: pneumothorax (sudden dyspnea), '
            'hemothorax (given warfarin)\n'
            '   6) Return precautions: Increasing pain, shortness of breath, '
            'coughing blood → emergency department'
        )
    },
]

# ============================================================
# 3. COMMUNICATION EDGE CASES
# ============================================================

COMMUNICATION = [
    {
        'prompt': 'Skriv SMS-påminnelse for time i morgen kl 14:00, men pasienten har ubetalt faktura.',
        'response': (
            'Hei [Fornavn]! Påminnelse om din time hos oss i morgen kl. 14:00. '
            'Vennligst ta med betalingskort. Vi minner om at det er en ubetalt faktura '
            'vi ber deg ordne — ta gjerne kontakt om du har spørsmål. '
            'Avbestilling senest 24 timer før. Vel møtt!'
        )
    },
    {
        'prompt': 'Skriv høflig avbestillingsbekreftelse for pasient som avbestiller for 3. gang på rad.',
        'response': (
            'Hei [Fornavn]. Vi bekrefter at din time [dato/kl] er avbestilt. '
            'Vi ser at du har måttet avbestille de siste timene. Dersom tidspunktene ikke passer, '
            'hjelper vi gjerne med å finne et bedre tidspunkt som fungerer for deg. '
            'Ring oss på [telefon] eller book direkte på nett. Ha en fin dag!'
        )
    },
    {
        'prompt': 'Skriv SMS til pasient som ikke møtte til timen sin (no-show).',
        'response': (
            'Hei [Fornavn]. Vi savnet deg til din time i dag kl. [tid]. '
            'Vi håper alt er bra. Vennligst merk at det påløper gebyr for timer som '
            'ikke avbestilles innen 24 timer. Ring oss på [telefon] for å booke ny time. '
            'Vennlig hilsen [Klinikk].'
        )
    },
    {
        'prompt': 'Draft an SMS for a patient whose treatment plan is complete — suggest wellness visits.',
        'response': (
            'Hi [First name]! Great news — you\'ve completed your treatment plan and '
            'we\'re happy with your progress. To maintain your results, we recommend '
            'a wellness check every 4-6 weeks. Book your next visit at [booking link] '
            'or call us at [phone]. Take care!'
        )
    },
    {
        'prompt': 'Skriv venteliste-melding til pasient — det har blitt ledig time på kort varsel.',
        'response': (
            'Hei [Fornavn]! Det har blitt ledig en time i dag kl. [tid]. '
            'Du sto på ventelisten vår — ønsker du denne timen? '
            'Svar JA innen kl. [frist] for å bekrefte. Ellers tilbyr vi den videre. '
            'Mvh [Klinikk].'
        )
    },
    {
        'prompt': 'Skriv SMS bursdagshilsen til pasient. Hold det profesjonelt.',
        'response': (
            'Hei [Fornavn]! Vi i [Klinikk] ønsker deg en riktig god bursdag! '
            'Håper du har en flott dag. Mvh oss alle på klinikken.'
        )
    },
    {
        'prompt': 'Write recall SMS for patient not seen in 6 months.',
        'response': (
            'Hi [First name]! It\'s been a while since your last visit. '
            'Regular check-ups help maintain spinal health. '
            'Book your next appointment at [booking link] or call [phone]. '
            'We look forward to seeing you! — [Clinic]'
        )
    },
    {
        'prompt': 'Skriv melding til pasient om at kiropraktoren er syk og timen må flyttes.',
        'response': (
            'Hei [Fornavn]. Dessverre må vi flytte din time [dato/kl] da din '
            'behandler er blitt syk. Vi beklager ulempen. Vi tilbyr deg ny time '
            '[alternativ dato/kl]. Passer dette? Svar denne meldingen eller ring '
            'oss på [telefon]. Vennlig hilsen [Klinikk].'
        )
    },
    {
        'prompt': 'Skriv tilbakemelding-SMS etter første konsultasjon (ber om Google-anmeldelse).',
        'response': (
            'Hei [Fornavn]! Takk for besøket i dag. Vi håper du er fornøyd med '
            'konsultasjonen. Dine tilbakemeldinger betyr mye for oss — om du har '
            'et øyeblikk, setter vi stor pris på en anmeldelse: [Google-lenke]. '
            'Ha en fin kveld! — [Klinikk]'
        )
    },
    {
        'prompt': 'Skriv epost til pasient med øvelsesark vedlagt.',
        'response': (
            'Emne: Dine hjemmeøvelser — [Klinikk]\n\n'
            'Hei [Fornavn],\n\n'
            'Vedlagt finner du øvelsesprogrammet vi gikk gjennom i dag. '
            'Utfør øvelsene [frekvens] som avtalt.\n\n'
            'Viktige punkter:\n'
            '- Start forsiktig og øk gradvis\n'
            '- Stopp ved skarp smerte (mild treningsverk er normalt)\n'
            '- Ta kontakt om du har spørsmål\n\n'
            'Din neste time er [dato/kl].\n\n'
            'Vennlig hilsen\n[Behandlernavn]\n[Klinikk]'
        )
    },
]

# ============================================================
# 4. GONSTEAD VS DIVERSIFIED NOTATION
# ============================================================

GONSTEAD_DIVERSIFIED = [
    {
        'prompt': 'Dokumenter Gonstead-funn og behandling for C2.',
        'response': (
            'Gonstead-analyse C2:\n\n'
            'Nervoscope: Temperatur-differanse C2 venstre. '
            'Palpasjon: Segmental restriksjon C2, endekjennelse fast. '
            'Statisk palpasjon: Ømhet V paraspinalt C2. '
            'Bevegelsespalpasjon: Redusert rotasjon V C2 på C3.\n'
            'Røntgenanalyse: C2 Body Right (C2-BR) listing.\n\n'
            'Behandling:\n'
            '- C2-BR: Cervikal chair adjust. Kontaktpunkt: V lamina C2. '
            'LOD: R→L, P→A. Pasientposisjon: Sittende, hode lett rotert H. '
            'Specifikt HVLA thrust med pisiform kontakt.\n'
            '- Post-check: Temperatur utjevnet, forbedret ROM rotasjon V.'
        )
    },
    {
        'prompt': 'Dokumenter Diversified-funn og behandling for C2.',
        'response': (
            'Diversified cervikal vurdering C2:\n\n'
            'Palpasjon: Segmental hypomobilitet C2-C3, redusert rotasjon venstre. '
            'Endekjennelse: Fast, uelastisk. Ømhet: V lateralt over articular pillar. '
            'Muskulært: Økt tonus suboccipitalt V.\n\n'
            'Behandling:\n'
            '- C2-C3 lateral break: Rotasjonsjustering. '
            'Kontaktpunkt: V articular pillar C2. Stabilisering: H temporal. '
            'Pre-tension: Lett fleksjon, rotasjon H, lateralfleksjon V. '
            'HVLA thrust med kort amplitude, høy hastighet.\n'
            '- Post-test: Forbedret rotasjon V, redusert ømhet. '
            'Pasient tolererte behandlingen godt.'
        )
    },
    {
        'prompt': 'Dokumenter Gonstead-analyse og behandling for lumbal segmental dysfunksjon L4.',
        'response': (
            'Gonstead-analyse L4:\n\n'
            'Nervoscope: Temperatur-break L4 høyre.\n'
            'Statisk palpasjon: Edema og ømhet L4 H paraspinalt.\n'
            'Bevegelsespalpasjon: L4 posterior body right (L4-PRS).\n'
            'Røntgen: L4 PRS listing bekreftet — posterior rotation H, '
            'spinøs mot venstre.\n\n'
            'Behandling:\n'
            '- L4-PRS: Side posture adjust. Pasient venstresideliggende (affisert side opp). '
            'Kontaktpunkt: H mammillary process L4. '
            'LOD: P→A, R→L med lett I→S komponent. '
            'Stabilisering: Anteriort over pas. H ASIS. '
            'Specifikt HVLA thrust med kroppsdrop.\n'
            '- Post-check: Temperatur normalisert, palpasjon forbedret.'
        )
    },
    {
        'prompt': 'Dokumenter Diversified behandling for lumbal L4-L5 dysfunksjon.',
        'response': (
            'Diversified lumbal vurdering L4-L5:\n\n'
            'Palpasjon: Segmental hypomobilitet L4-L5. '
            'Redusert fleksjons-ekensjonskvalitet i segmentet. '
            'Endekjennelse: Fast. Ømhet: Bilateral paraspinal L4-L5 nivå. '
            'Bevegelse: Mest restriktert i rotasjon H og lateralfleksjon H.\n\n'
            'Behandling:\n'
            '- L4-L5 side posture manipulasjon: Pasient venstresideliggende. '
            'Kontaktpunkt: Pisiform over L4 mammillary H. '
            'Kaudal hånd: Anteriort knekontakt for bekkenstabilisering. '
            'Pre-tension med rotasjon og lateralfleksjon. '
            'HVLA rotasjonsthrust.\n'
            '- Post-test: Forbedret segmental bevegelighet, redusert ømhet.\n'
            '- Supplert med prone thorakolumbal ekstensjonsmobilisering.'
        )
    },
    {
        'prompt': 'Document Gonstead analysis and adjustment for T5 subluxation.',
        'response': (
            'Gonstead analysis T5:\n\n'
            'Nervoscope: Temperature differential at T5 left.\n'
            'Static palpation: Edema and tenderness T5 left transverse process.\n'
            'Motion palpation: Restricted extension and right rotation at T5-T6.\n'
            'X-ray: T5 PLS listing (posterior left spinous).\n\n'
            'Adjustment:\n'
            '- T5 PLS: Prone bilateral thenar contact. '
            'Contact point: Left transverse process T5. '
            'LOD: P→A with slight L→R component. '
            'Patient position: Prone with chest piece slightly elevated. '
            'Specific HVLA thrust with body drop.\n'
            '- Post-check: Temperature equalized, improved extension, reduced tenderness.'
        )
    },
    {
        'prompt': 'Document Diversified adjustment for T5-T6 restriction.',
        'response': (
            'Diversified thoracic assessment T5-T6:\n\n'
            'Palpation: Segmental hypomobility T5-T6 in extension. '
            'End-feel: Hard, non-resilient. Paravertebral hypertonicity bilateral. '
            'Rib spring test: Reduced compliance at T5-T6 level.\n\n'
            'Treatment:\n'
            '- T5-T6 prone posterior-anterior manipulation: '
            'Contact: Bilateral pisiform over transverse processes T5. '
            'Patient prone, arms at sides. '
            'Pre-tension: Gentle P→A pressure to tension barrier. '
            'HVLA thrust: Short-lever P→A body drop technique.\n'
            '- Alternative performed: Supine cross-arm (anterior thoracic) '
            'manipulation at T5-T6 with fulcrum under segment.\n'
            '- Post-test: Improved extension, spring test normalized. '
            'Patient reported immediate relief of interscapular tightness.'
        )
    },
]

# ============================================================
# 5. COMPLEX MULTI-VISIT SOAP NOTES
# ============================================================

MULTI_VISIT_SOAP = [
    {
        'prompt': 'Skriv SOAP for 4. konsultasjon — pasient med kroniske nakkesmerter. Tidligere 3 behandlinger viste 50% bedring.',
        'response': (
            'S: 4. konsultasjon. Pas. rapporterer 50% bedring fra baseline (VAS 7→3.5/10). '
            'Hodepinefrekvens redusert fra daglig til 2x/uke. Klarer nå å jobbe full dag. '
            'Fortsatt stivhet om morgenen, men varer kun 15 min (var 1 time). Gjør hjemmeøvelser '
            '4/7 dager. Ingen nye symptomer.\n\n'
            'O: Cervikal ROM forbedret: Rotasjon V 65° (forrige: 50°, baseline: 40°, N: 80°). '
            'Palpatorisk: Redusert ømhet C2-C3 (fra 3→1/3). Øvre trapezius V: Fortsatt '
            'hypertonisk men bedre. Suboccipitalt: Mild ømhet. Kraft og reflekser uendret normal.\n\n'
            'A: Cervikal myalgi med cervikogen hodepine — god progresjon (50% bedring).\n'
            '   Forløp følger forventet bedringskurve. Fortsatt restriksjoner C2-C3 som bidrar '
            'til gjenværende hodepine.\n\n'
            'P: 1) Fortsatt cervikal mobilisering C2-C3 (redusert intensitet)\n'
            '   2) Myofascial frigjøring trapezius og suboccipitalt (vedlikehold)\n'
            '   3) Progresjon hjemmeøvelser: Legge til thorakal rotasjonsøvelser\n'
            '   4) Redusere behandlingsfrekvens til 1x/uke (fra 2x/uke)\n'
            '   5) Mål: Ytterligere 25% bedring neste 4 uker\n'
            '   6) Re-evaluering etter 2 behandlinger til'
        )
    },
    {
        'prompt': 'Skriv SOAP for re-evaluering etter 8 behandlinger — korsryggpasient som ikke responderer.',
        'response': (
            'S: Re-evaluering etter 8 behandlinger over 6 uker. Pas. rapporterer minimal '
            'bedring (VAS 6→5/10, <20%). Fortsatt problemer med sitting >30 min. Søvn '
            'forstyrret 3-4 netter/uke. Stressende jobbsituasjon vedvarer. Hjemmeøvelser '
            'gjort sporadisk (1-2x/uke). Røyker 10/dag.\n\n'
            'O: Lumbal ROM: Minimalt forbedret fra baseline. Flexjon Schober 3.5cm (baseline: 3cm). '
            'SLR uendret 45° H. Palpatorisk: Vedvarende ømhet L4-L5, redusert myofascial '
            'reaktivitet. Nevrologisk: Uendret normal.\n\n'
            'A: Kronisk mekanisk korsryggsmerte — utilfredsstillende behandlingsrespons.\n'
            '   Mulige årsaker til manglende fremgang:\n'
            '   1) Lav compliance med hjemmeøvelser\n'
            '   2) Vedvarende psykososiale stressfaktorer (gule flagg)\n'
            '   3) Røyking (reduserer vevstilheling)\n'
            '   4) Mulig underliggende patologi ikke fanget opp\n\n'
            'P: 1) Justere behandlingsplan: Bytte til McKenzie-basert tilnærming\n'
            '   2) Motiverende samtale om røykeslutt og øvelsescompliance\n'
            '   3) Vurder psykososial screening (Örebro/STarT Back)\n'
            '   4) Bestille MR lumbal for å utelukke uoppdaget patologi\n'
            '   5) Vurder tverrfaglig tilnærming: Fysioterapi, psykolog\n'
            '   6) Ny evalueringsperiode: 4 behandlinger med justert plan\n'
            '   7) Om fortsatt <30% bedring → avslutte og henvise videre'
        )
    },
    {
        'prompt': 'Skriv avslutnings-SOAP (discharge note) for pasient som er ferdigbehandlet.',
        'response': (
            'S: 12. og avsluttende konsultasjon. Pas. rapporterer 85% bedring (VAS 8→1/10). '
            'Kan utføre alle daglige aktiviteter uten begrensning. Tilbake i full jobb. '
            'Trener 3x/uke uten forverring. Sporadisk stivhet om morgenen som løsner raskt. '
            'Svært fornøyd med behandlingsforløpet.\n\n'
            'O: Cervikal ROM: Full, smertefri. Thorakal ROM: Full. '
            'Palpatorisk: Minimal restømhet C5-C6, ellers upåfallende. '
            'Kraft og nevrologisk: Normal.\n\n'
            'A: Cervikal radikulopati C5-C6 — RESOLVERT.\n'
            '   Behandlingsforløp: 12 behandlinger over 10 uker. '
            '   Bedring: 85% (VAS 8→1, full funksjon, tilbake i arbeid).\n'
            '   Gode prognostiske faktorer: God compliance, aktiv livsstil.\n\n'
            'P: 1) Avslutter aktiv behandlingsplan\n'
            '   2) Egentreningsprogram overlevert (skriftlig + app)\n'
            '   3) Vedlikeholdsanbefalinger:\n'
            '      - Fortsett kjerneøvelser 3x/uke\n'
            '      - Ergonomisk oppsett vedlikeholdes\n'
            '      - Tøyning nakke/skulder daglig\n'
            '   4) Kontrolltilbud: Forebyggende kontroll om 6-8 uker anbefalt\n'
            '   5) Åpen dør: Kan ta kontakt ved tilbakefall\n'
            '   6) Epikrise sendt fastlege'
        )
    },
    {
        'prompt': 'Write SOAP for a follow-up visit (visit 3/10) — patient improving but slowly.',
        'response': (
            'S: Visit 3 of 10. Patient reports 20% improvement from baseline (NRS 7→5.5/10). '
            'Low back pain still limits sitting tolerance to 45 minutes (was 20 min). '
            'Sleep improved from waking 4x/night to 2x. Started walking 20 min daily. '
            'Home exercises performed 5/7 days. No new symptoms.\n\n'
            'O: Lumbar ROM: Flexion improved (fingertip-to-floor 18cm, was 25cm, baseline 30cm). '
            'Extension still limited and painful. SLR improved R: 55° (was 40°). '
            'Palpation: L4-L5 still restricted but improved end-feel quality. '
            'Neurological: Unchanged (L5 dermatome hypoesthesia R, unchanged from visit 1).\n\n'
            'A: Lumbar disc protrusion L4-L5 with L5 radiculopathy R — gradual improvement.\n'
            '   20% improvement in 2 weeks is acceptable for disc-related pathology. '
            'Natural history supports continued conservative management.\n\n'
            'P: 1) Continue lumbar flexion-distraction technique\n'
            '   2) Progress McKenzie exercises to standing extension\n'
            '   3) Add neural mobilization (sciatic nerve glides) for radicular component\n'
            '   4) Increase walking to 30 min daily\n'
            '   5) Maintain 2x/week frequency for next 2 weeks\n'
            '   6) Expected trajectory: 50% improvement by visit 6\n'
            '   7) If neurological worsening → urgent MRI referral'
        )
    },
]

# ============================================================
# ADDITIONAL EXAMPLES — Boost to ~60+
# ============================================================

EXTRA_MULTI_COMPLAINT = [
    {
        'prompt': 'Skriv SOAP for pasient med fotsmerte, knesmerter og korsryggsmerter (biomekanisk kjede).',
        'response': (
            'S: 48 år kvinne med 4 mnd gradvis innsettende smerter i V fot (plantart), '
            'V kne (medialt) og korsrygg. Fotsmertene kom først, deretter kne, deretter rygg. '
            'Jobber stående. Bruker utslitte sko.\n\n'
            'O: Fot V: Overpronasjon, ømhet plantarfascie mediale tuberkel. Kne V: Pes anserinus ømhet, '
            'mild valgus. Korsrygg: L4-L5 segmental dysfunksjon, SI-ledd ømhet V.\n\n'
            'A: 1) Plantarfasciitt V fot — L98 ICPC-2\n'
            '   2) Pes anserinus tendinitt V kne — L99 ICPC-2\n'
            '   3) Sekundær lumbal dysfunksjon — L03 ICPC-2\n'
            '   Biomekanisk kjede: Overpronasjon → knevalgus → kompensatorisk lumbal dysfunksjon.\n\n'
            'P: 1) Ortopediske innleggsåler med medialt buetøtte\n'
            '   2) Plantar fascie-tøyning og ismetrisk calf-styrking\n'
            '   3) Kne: Lateral hofterotator-styrking, taping\n'
            '   4) Lumbal mobilisering L4-L5, SI-ledd mobilisering\n'
            '   5) Anbefale nye sko med stabilitetsegenskaper'
        )
    },
    {
        'prompt': 'Write SOAP for patient with whiplash presenting with neck pain, headache, tinnitus, and jaw pain.',
        'response': (
            'S: 32-year-old male, MVA 10 days ago (rear-ended). Presents with neck pain (7/10), '
            'daily headaches (occipital to frontal), bilateral tinnitus, and right jaw pain. '
            'Difficulty concentrating. Sleep disturbed by pain. No dizziness or visual changes.\n\n'
            'O: Cervical ROM: Globally reduced ~40%. C0-C2 restricted. '
            'TMJ: Limited opening 30mm, deviation right. Masseters tender bilaterally. '
            'Cervical distraction test: relieves headache. Tinnitus unchanged with cervical movements. '
            'Neurological: Intact.\n\n'
            'A: 1) WAD grade II with cervicogenic headache\n'
            '   2) TMJ dysfunction (likely clenching/bracing from accident)\n'
            '   3) Tinnitus — possibly cervicogenic, monitor\n\n'
            'P: 1) Upper cervical mobilization C0-C2\n'
            '   2) TMJ: Intraoral pterygoid release, jaw exercises\n'
            '   3) Graded ROM exercises, avoiding end-range\n'
            '   4) If tinnitus persists >4 weeks: ENT referral\n'
            '   5) Insurance documentation prepared'
        )
    },
]

EXTRA_AGE_VARIANT = [
    {
        'prompt': 'Skriv SOAP for 13 år gammel gutt, fotballspiller med gradvis knesmerter — mistenkt Osgood-Schlatter.',
        'response': (
            'S: 13 år gutt, aktiv fotballspiller 4x/uke. Gradvis innsettende smerte under '
            'kneskålen H siste 6 uker. Verst ved trening og trappegang. Hevelse over tibiatuberositet. '
            'Ingen traume. I vekstspurt.\n\n'
            'O: Inspeksjon: Fremtredende tibiatuberositet H. Ømhet: Direkte over tuberositas tibiae H. '
            'Provocasjon: Smerte ved resistert kneekstensjon. ROM kne full. Hamstrings og quadriceps: '
            'Stramme bilat.\n\n'
            'A: Osgood-Schlatter sykdom H kne — L94 ICPC-2\n'
            '   Apofysitt relatert til vekstspurt og aktivitetsnivå.\n\n'
            'P: 1) Relativ hvile: Redusere fotball til 2x/uke, unngå hopping\n'
            '   2) Is etter aktivitet\n'
            '   3) Quadriceps-tøyning, hamstring-tøyning daglig\n'
            '   4) Patellar stropp ved aktivitet (avlaster tuberositas)\n'
            '   5) Gradvis økning over 4-6 uker\n'
            '   6) Selv-begrensende tilstand — bedres ved avsluttet vekst'
        )
    },
    {
        'prompt': 'Write SOAP for 90-year-old woman with chronic thoracic pain, severe kyphosis, multiple comorbidities.',
        'response': (
            'S: 90-year-old female, progressive thoracic pain for years. Severe kyphosis limiting '
            'forward gaze. Comorbidities: Osteoporosis (T-score -3.8), COPD, HTN. '
            'Takes 8 medications. Pain 4/10, manageable. Main concern: Difficulty looking up and balance.\n\n'
            'O: Posture: Severe thoracic kyphosis (~70°), compensatory cervical hyperextension. '
            'ROM: Globally restricted, especially thoracic extension (near zero). '
            'Rib expansion reduced. NO manipulation performed — assessment only.\n\n'
            'A: Severe structural thoracic kyphosis with secondary cervical strain — L85 ICPC-2\n'
            '   Multiple comorbidities limit treatment options.\n\n'
            'P: 1) GENTLE soft tissue work only — no HVLA anywhere\n'
            '   2) Seated cervical isometric exercises (very light)\n'
            '   3) Breathing exercises for rib cage mobility\n'
            '   4) Posture aids: Prism glasses for forward gaze\n'
            '   5) Fall prevention assessment (highest priority)\n'
            '   6) Coordinate with GP regarding pain management\n'
            '   7) Realistic expectations discussed with patient and family'
        )
    },
    {
        'prompt': 'Skriv SOAP for gravid pasient (uke 12) med migrene — begrensede medikamenter.',
        'response': (
            'S: 29 år kvinne, gravid uke 12, kronisk migrene (3-4x/mnd pre-graviditet). '
            'Frekvens økt til 2x/uke siden graviditet. Kan ikke bruke triptaner. '
            'Paracetamol har begrenset effekt. Kvalm (usikkert migrene vs svangerskapskvalme). '
            'Ingen aura.\n\n'
            'O: Cervikal: Øvre cervikal restriksjon C1-C2. Suboccipitalt spent. '
            'Trigger points m. trapezius bilat. Blodtrykk 115/72 (normalt). '
            'Nevrologi upåfallende.\n\n'
            'A: Migrene uten aura, forverret under graviditet — N89 ICPC-2\n'
            '   Cervikal muskulær komponent bidrar sannsynlig.\n\n'
            'P: 1) Øvre cervikal mobilisering (forsiktig, sideliggende)\n'
            '   2) Suboccipital frigjøring, trigger point-behandling trapezius\n'
            '   3) Akupressur-veiledning (P6 for kvalme, GB20 for hodepine)\n'
            '   4) Migrenedagbok — identifiser triggere\n'
            '   5) Magnesium-tilskudd (300mg/dag — trygt i svangerskap)\n'
            '   6) Koordinere med jordmor/gynekolog om medikamentelle alternativer\n'
            '   7) Forventet bedring 2. trimester (østrogen-stabilisering)'
        )
    },
]

EXTRA_COMMUNICATION = [
    {
        'prompt': 'Skriv henvisning til fastlege for pasient med mistenkt inflammatorisk rygglidelse.',
        'response': (
            'Til: Fastlege [Navn]\n'
            'Fra: [Kiropraktor], [Klinikk]\n'
            'Dato: [Dato]\n'
            'Vedr: [Pasientnavn], f. [fødselsdato]\n\n'
            'Pasienten er henvist til vurdering for mulig inflammatorisk rygglidelse.\n\n'
            'Anamnese: 28 år mann med 6 måneder inflammatorisk preget korsryggsmerte. '
            'Morgenstivhet >60 minutter, bedring med aktivitet, forverring med hvile. '
            'Våkner av smerter om natten.\n\n'
            'Kliniske funn:\n'
            '- Redusert lumbal bevegelighet (modifisert Schober 2.5cm)\n'
            '- Bilateral SI-ledd ømhet og positiv FABER bilateralt\n'
            '- Ingen perifere leddmanifestiasjoner\n'
            '- Nevrologi normal\n\n'
            'Mistenkt diagnose: Aksial spondylartritt / begynnende ankyloserende spondylitt.\n\n'
            'Anmodning: Blodprøver (SR, CRP, HLA-B27), MR SI-ledd, '
            'evt. henvisning revmatolog ved positive funn.\n\n'
            'Vennlig hilsen\n[Kiropraktor]\nAutorisasjonsnr: [HPR-nr]'
        )
    },
    {
        'prompt': 'Write a referral letter to a neurologist for cervical radiculopathy not responding to treatment.',
        'response': (
            'Dear Dr. [Name],\n\n'
            'Re: [Patient Name], DOB: [DOB]\n\n'
            'I am referring this patient for neurological evaluation of persistent '
            'cervical radiculopathy failing conservative management.\n\n'
            'History: 52-year-old male with 10 weeks of right arm pain in C6 distribution. '
            'Progressive weakness of right biceps (4/5, was 4+/5 at presentation). '
            'Failed 8 sessions of conservative care (mobilization, traction, exercises).\n\n'
            'Examination findings:\n'
            '- Reduced biceps reflex right\n'
            '- Biceps strength 4/5 right (progressive from 4+/5)\n'
            '- Positive Spurling test right\n'
            '- Sensory deficit C6 dermatome right\n\n'
            'MRI cervical spine (dated [date]): C5-C6 posterolateral disc protrusion '
            'with neural foraminal narrowing right.\n\n'
            'Request: Neurological assessment and opinion regarding surgical candidacy '
            'given progressive motor deficit.\n\n'
            'Kind regards,\n[Chiropractor]\nRegistration: [HPR number]'
        )
    },
    {
        'prompt': 'Skriv sykemelding-begrunnelse til NAV for pasient med akutt korsryggsmerte.',
        'response': (
            'Til: NAV\n'
            'Fra: [Kiropraktor], Autorisasjonsnr: [HPR-nr]\n'
            'Dato: [Dato]\n'
            'Pasient: [Navn], f. [fødselsdato]\n\n'
            'Diagnose: L03 Korsryggsmerter (ICPC-2)\n\n'
            'Klinisk vurdering:\n'
            'Pasienten presenterte seg [dato] med akutte korsryggsmerter etter tung løfting. '
            'Betydelig funksjonsnedsettelse med problemer ved gange, sitting og stående stilling. '
            'Klinisk undersøkelse viser redusert lumbal bevegelighet (fleksjon 20°), '
            'palpatorisk ømhet L4-L5 paraspinalt, og antalgisk gangmønster.\n\n'
            'Funksjonsvurdering:\n'
            'Pasientens arbeid som [yrke] innebærer [fysiske krav]. '
            'Nåværende funksjonsnivå er ikke forenelig med arbeidsoppgavene.\n\n'
            'Sykemelding: 100% i [X] dager fra [dato].\n'
            'Gradert sykemelding vurderes ved neste kontroll.\n\n'
            'Behandlingsplan: Manuell behandling 2x/uke, aktiv rehabilitering.\n'
            'Forventet tilbakegang til arbeid: Gradert fra [dato].\n\n'
            'Vennlig hilsen\n[Kiropraktor]'
        )
    },
    {
        'prompt': 'Skriv forsikringsrapport for pasient skadet i arbeidsulykke.',
        'response': (
            'FORSIKRINGSRAPPORT — YRKESSKADE\n\n'
            'Dato: [Dato]\n'
            'Pasient: [Navn], f. [fødselsdato]\n'
            'Behandler: [Kiropraktor], HPR-nr: [nr]\n'
            'Forsikringsselskap: [Selskap]\n'
            'Skadenummer: [Ref]\n\n'
            'SKADEMEKANISME:\n'
            'Pasienten ble skadet [dato] under utførelse av arbeidsoppgaver hos [arbeidsgiver]. '
            '[Beskrivelse av hendelse]. Skaden ble meldt til arbeidsgiver samme dag.\n\n'
            'KLINISKE FUNN VED FØRSTEKONSULTASJON ([dato]):\n'
            '- [Funn 1]\n- [Funn 2]\n- [Funn 3]\n\n'
            'DIAGNOSE: [ICPC-2 kode og beskrivelse]\n\n'
            'BEHANDLINGSFORLØP:\n'
            '[Antall] behandlinger over [periode]. Behandling bestod av [metoder].\n\n'
            'NÅVÆRENDE STATUS:\n'
            'Funksjonsnivå: [Beskrivelse]. Restplager: [Beskrivelse].\n\n'
            'KAUSALITETSVURDERING:\n'
            'Det vurderes som overveiende sannsynlig at skademekanismen har forårsaket '
            'de aktuelle plagene. [Begrunnelse].\n\n'
            'PROGNOSE:\n'
            '[Forventet utfall og tidsramme].\n\n'
            'Vennlig hilsen\n[Kiropraktor]'
        )
    },
]

EXTRA_GONSTEAD = [
    {
        'prompt': 'Dokumenter Gonstead pelvic analysis og SI-ledd justering.',
        'response': (
            'Gonstead bekkenanalyse:\n\n'
            'Visualisering: Lett bekkenskjevhet, H ilium posterior-inferior.\n'
            'Benlengde: Prone — funksjonell forkortning H 8mm.\n'
            'Palpasjon: SI-ledd H — ømhet over PSIS og sacral sulcus.\n'
            'Bevegelsespalpasjon: Redusert SI-bevegelighet H, fiksert.\n'
            'Nervoscope: Temperatur-break S1-S2 H.\n\n'
            'Behandling:\n'
            '- PI ilium H: Side posture, pasient venstresideliggende.\n'
            '  Kontaktpunkt: PSIS H. LOD: P→A, I→S.\n'
            '  Stabilisering: Anteriort over iliac crest.\n'
            '  Specifikt HVLA thrust med body drop.\n'
            '- Post-check: Benlengde utjevnet, temperatur normalisert.\n'
            '  Pasient rapporterer umiddelbar lettelse i bekkenområdet.'
        )
    },
    {
        'prompt': 'Dokumenter Diversified sakroiliacal manipulasjon.',
        'response': (
            'Diversified SI-ledd vurdering:\n\n'
            'Bevegelsespalpasjon: SI-ledd V hypomobilt i nutation.\n'
            'Provokasjon: Posterior shear test positiv V. FABER positiv V.\n'
            'Gaenslen positiv V. Patrick positiv V.\n'
            'Benlengde: Funksjonell forkortning V prone, utjevnes sittende.\n\n'
            'Behandling:\n'
            '- SI-ledd V sideliggende manipulasjon: Pasient H-sideliggende.\n'
            '  Kontaktpunkt: Pisiform over PSIS V.\n'
            '  Kaudal hånd: Anteriort knekontakt for stabilisering.\n'
            '  Pre-tension: Hoftebøy 90°, adduksjon.\n'
            '  HVLA thrust P→A over PSIS.\n'
            '- Supplert med muskelenergiteknikk for iliopsoas V.\n'
            '- Post-test: Forbedret nutation, provokasjon redusert.'
        )
    },
    {
        'prompt': 'Document Gonstead cervical chair adjustment for C5 subluxation.',
        'response': (
            'Gonstead cervical analysis C5:\n\n'
            'Nervoscope: Temperature differential C5 right.\n'
            'Static palpation: Edema and tenderness C5 articular pillar right.\n'
            'Motion palpation: C5 body left (C5-BL) — restricted rotation right.\n'
            'X-ray: C5-BL listing confirmed on APOM view.\n\n'
            'Adjustment:\n'
            '- C5-BL: Cervical chair adjustment.\n'
            '  Patient seated, head tilted slightly left.\n'
            '  Contact: Right lamina/articular pillar C5.\n'
            '  LOD: L→R, P→A.\n'
            '  Stabilizing hand: Left mastoid.\n'
            '  Specific HVLA rotatory thrust.\n'
            '- Post-check: Temperature equalized, improved right rotation, '
            'patient reports reduced stiffness immediately.'
        )
    },
]

EXTRA_MULTI_VISIT = [
    {
        'prompt': 'Skriv SOAP for 2. konsultasjon etter akutt whiplash (7 dager etter ulykke).',
        'response': (
            'S: 2. konsultasjon, 7 dager post-MVA. Pas. rapporterer smerte uendret (VAS 7/10). '
            'Hodepine persisterer (daglig, occipitalt). Ny symptom: Konsentrasjonsvansker. '
            'Søvn dårlig — våkner av smerter 3x/natt. Har vært sykmeldt. Bruker paracetamol 1g x4.\n\n'
            'O: Cervikal ROM: Uendret fra baseline, fortsatt globalt redusert ~50%. '
            'Myofascial: SCM og trapezius like ømme. C2-C3 restriksjon vedvarer. '
            'Ny test: Cervikal fleksjon rotasjon test positiv V (indikerer C1-C2 dysfunksjon).\n\n'
            'A: WAD grad II, 1 uke post-traume — stabil (ikke forverret, ikke bedret).\n'
            '   Forventningsavklaring: Noen WAD-pasienter har forsinket bedring.\n'
            '   Konsentrasjonsvanker monitoreres (mulig mild hjernerysting).\n\n'
            'P: 1) Fortsatt forsiktig mobilisering (ikke manipulasjon i akuttfase)\n'
            '   2) Myofascial frigjøring SCM, scaleni, suboccipitalt\n'
            '   3) Hjemmeøvelser: Isometrisk nakkestyrking, gentle ROM\n'
            '   4) SCAT6-screening ved neste konsultasjon (konsentrasjonsvansker)\n'
            '   5) Neste time om 3-4 dager\n'
            '   6) Forsikringsdokumentasjon oppdatert'
        )
    },
    {
        'prompt': 'Write SOAP for final visit (visit 12/12) — patient achieved treatment goals.',
        'response': (
            'S: Final visit (12/12). Patient reports 90% improvement. Pain reduced from '
            '8/10 to 0.5/10 (occasional mild stiffness only). Full return to all activities '
            'including gym (5x/week) and golf (pain-free swing). Sleeping through the night. '
            'No medication use. Very satisfied with outcomes.\n\n'
            'O: Lumbar ROM: Full and pain-free. Schober: 5cm (was 2.5cm at baseline). '
            'SLR: 80° bilateral (was 35° R at baseline). Neurological: Full recovery — '
            'L5 dermatomal sensation now normal (was hypoesthetic). '
            'Core stability: Good endurance on McGill tests.\n\n'
            'A: L4-L5 disc protrusion with L5 radiculopathy — RESOLVED.\n'
            '   12 treatments over 10 weeks. Excellent outcome exceeding expectations.\n\n'
            'P: 1) Discharge from active care\n'
            '   2) Self-management program provided (written + digital)\n'
            '   3) Maintenance recommendations:\n'
            '      - Continue core exercises 4x/week minimum\n'
            '      - Proper deadlift/squat form (reviewed today)\n'
            '      - Annual ergonomic review at workplace\n'
            '   4) Preventive check-up offered in 3 months\n'
            '   5) Open door policy for any recurrence\n'
            '   6) Discharge summary sent to GP'
        )
    },
    {
        'prompt': 'Skriv SOAP for behandlingskontroll der pasienten har forverring — vurder endring.',
        'response': (
            'S: 6. konsultasjon. Pas. rapporterer forverring siste uke (VAS 4→6/10). '
            'Startet ny treningsform (CrossFit) uten å konsultere behandler. '
            'Smerter økte etter heavy deadlifts. Også stresset på jobb (nedbemanning).\n\n'
            'O: Lumbal ROM: Redusert fleksjon fra forrige gang (40°→25°). '
            'Økt muskelspasme L3-L5 paraspinalt bilat. SLR: Uendret 55° H. '
            'Provokasjon: McKenzie-testing viser sentralisering med repetert ekstensjon.\n\n'
            'A: Eksaserbasjon av kronisk lumbal diskopati — aktivitetsrelatert.\n'
            '   Forverring sannsynlig forårsaket av prematur tung belastning (CrossFit/deadlift).\n'
            '   Positiv sentralisering = god prognose for reversering.\n\n'
            'P: 1) McKenzie-protokoll: Repetert prone extension 10x3/dag\n'
            '   2) Pause CrossFit/deadlifts 2 uker\n'
            '   3) Spinal mobilisering L3-L5, lateral shift korreksjon\n'
            '   4) Gradert tilbakegang til trening med veiledning\n'
            '   5) Øke frekvens til 2x/uke neste 2 uker (fra 1x/uke)\n'
            '   6) Stressmestring: Anbefale daglig gange 30 min'
        )
    },
]

# ============================================================
# Edge Case Generation Function
# ============================================================

def generate_all_edge_cases():
    """Generate all edge case training examples."""
    examples = []

    def add(items, sys_prompt):
        for item in items:
            examples.append({
                "messages": [
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": item['prompt']},
                    {"role": "assistant", "content": item['response']}
                ]
            })

    add(MULTI_COMPLAINT, SYSTEM_PROMPT_CLINICAL)
    add(AGE_VARIANT, SYSTEM_PROMPT_CLINICAL)
    add(COMMUNICATION, SYSTEM_PROMPT_COMM)
    add(GONSTEAD_DIVERSIFIED, SYSTEM_PROMPT_CLINICAL)
    add(MULTI_VISIT_SOAP, SYSTEM_PROMPT_CLINICAL)

    # Extras
    add(EXTRA_MULTI_COMPLAINT, SYSTEM_PROMPT_CLINICAL)
    add(EXTRA_AGE_VARIANT, SYSTEM_PROMPT_CLINICAL)
    add(EXTRA_COMMUNICATION, SYSTEM_PROMPT_COMM)
    add(EXTRA_GONSTEAD, SYSTEM_PROMPT_CLINICAL)
    add(EXTRA_MULTI_VISIT, SYSTEM_PROMPT_CLINICAL)

    return examples


def main():
    examples = generate_all_edge_cases()

    script_dir = Path(__file__).parent.parent
    output_dir = script_dir / 'data' / 'mined'
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / 'edge-cases-synthetic.jsonl'
    with open(output_file, 'w', encoding='utf-8') as f:
        for ex in examples:
            f.write(json.dumps(ex, ensure_ascii=False) + '\n')

    # Count by category
    cats = {
        'Multi-complaint': len(MULTI_COMPLAINT) + len(EXTRA_MULTI_COMPLAINT),
        'Age-variant': len(AGE_VARIANT) + len(EXTRA_AGE_VARIANT),
        'Communication': len(COMMUNICATION) + len(EXTRA_COMMUNICATION),
        'Gonstead/Diversified': len(GONSTEAD_DIVERSIFIED) + len(EXTRA_GONSTEAD),
        'Multi-visit SOAP': len(MULTI_VISIT_SOAP) + len(EXTRA_MULTI_VISIT),
    }

    print(f'Generated {len(examples)} edge case training examples')
    for cat, count in cats.items():
        print(f'  {cat}: {count}')
    print(f'  Output: {output_file.resolve()}')


if __name__ == '__main__':
    main()
