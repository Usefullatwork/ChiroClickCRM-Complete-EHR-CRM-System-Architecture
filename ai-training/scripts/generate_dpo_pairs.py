#!/usr/bin/env python3
"""
Generate DPO (Direct Preference Optimization) training pairs.

Creates preference pairs where:
- 'chosen' = the correct/desired behavior
- 'rejected' = the kind of mistake the model currently makes

Categories:
1. Red flag SAFE pairs (chosen=TRYGT, rejected=false alarm) — 150 pairs
2. Red flag DANGER pairs (chosen=correct alarm, rejected=missed danger) — 100 pairs
3. ICPC-2 pairs (chosen=correct ICPC-2, rejected=ICD-10 or wrong code) — 100 pairs
4. Communication pairs (chosen=concise professional, rejected=verbose) — 100 pairs
5. Norwegian pairs (chosen=formal medical, rejected=colloquial/English) — 100 pairs
6. Quick field pairs (chosen=within length, rejected=too long) — 50 pairs

Output: data/dpo/train.jsonl (540 pairs) + data/dpo/validation.jsonl (60 pairs)
Format per line: {"prompt": "...", "chosen": "...", "rejected": "..."}
"""

import json
import random
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
AI_TRAINING_DIR = SCRIPT_DIR.parent
OUTPUT_DIR = AI_TRAINING_DIR / "data" / "dpo"

random.seed(42)

# ============================================================
# System prompts
# ============================================================

SYSTEM_RED_FLAG = (
    'Du er en medisinsk sikkerhetsrådgiver for kiropraktikk. '
    'Identifiser røde flagg, gi differensialdiagnostikk og klinisk resonnering. '
    'Prioriter alltid pasientsikkerhet. '
    'Klassifiser hastegrad: AKUTT (ring 113), HENVIS SAMME DAG, '
    'HENVIS RUTINE, MONITORÉR, eller TRYGT.'
)

SYSTEM_ICPC = (
    'Du er en diagnosekode-spesialist for kiropraktikk i Norge. '
    'Bruk ICPC-2 kodeverk (IKKE ICD-10). '
    'Gi kode og kort norsk beskrivelse.'
)

SYSTEM_COMMS = (
    'Du er en kommunikasjonsspesialist for kiropraktorklinikker i Norge. '
    'Generer profesjonelle, konsise meldinger.'
)

SYSTEM_NORWEGIAN = (
    'Du er en klinisk dokumentasjonsspesialist for kiropraktikk i Norge. '
    'Bruk korrekt norsk medisinsk terminologi.'
)

SYSTEM_QUICK = (
    'Du er en klinisk feltgenerator. Generer korte, presise kliniske feltverdier.'
)


def make_pair(system: str, user: str, chosen: str, rejected: str) -> dict:
    """Create a DPO preference pair with ChatML-style prompt."""
    prompt = f"<|im_start|>system\n{system}<|im_end|>\n<|im_start|>user\n{user}<|im_end|>\n<|im_start|>assistant\n"
    return {
        "prompt": prompt,
        "chosen": chosen,
        "rejected": rejected,
    }


# ============================================================
# CATEGORY 1: RED FLAG SAFE PAIRS (150)
# chosen = correctly identifies as TRYGT
# rejected = false alarm (over-refers benign condition)
# ============================================================

def generate_red_flag_safe_pairs():
    pairs = []

    safe_scenarios = [
        {
            "user": "Vurder røde flagg: 38 år mann, kontorarbeider. Korsryggsmerte etter lang bilkjøring. Smerten er verst ved foroverfleksjon, bedre i hvile. Ingen utstråling, normal nevrologi.",
            "chosen": "TRYGT: Mekanisk korsryggsmerte. Fleksjonsprovosert smerte etter langvarig sitting er typisk for discogen irritasjon uten nerveaffeksjon. Normal nevrologisk undersøkelse utelukker radikulopati. Egnet for kiropraktisk behandling.",
            "rejected": "HENVIS SAMME DAG: Pasienten kan ha lumbal skiveprolaps med begynnende nerverotaffeksjon. Foroverfleksjonsprovokasjon er et alarmsignal. Anbefaler MR og nevrokirurgisk vurdering. Unngå manipulasjon inntil bildediagnostikk foreligger.",
        },
        {
            "user": "Vurder røde flagg: 29 år kvinne. Akutt korsryggsmerte etter markløft. Paravertebral muskelspasme, redusert ROM, intakt sensibilitet og kraft.",
            "chosen": "TRYGT: Akutt mekanisk ryggsmerte med muskelspasme etter belastning. Intakt nevrologi utelukker radikulopati. Behandle med mobilisering og progressiv belastning.",
            "rejected": "HENVIS RUTINE: Akutt debut etter tung belastning kan indikere fraktur eller diskruptur. Anbefaler bildediagnostikk for å utelukke kompresjonsfraktur. Pasienten bør unngå belastning.",
        },
        {
            "user": "Vurder røde flagg: 52 år mann. Residiverende korsryggsmerte over flere år. Morgenstivhet 15-20 min som løsner ved bevegelse. Ingen nattsmerte, ingen vekttap.",
            "chosen": "TRYGT: Kronisk mekanisk korsryggsmerte med kort morgenstivhet under 30 minutter. Kort stivhet som løsner ved bevegelse er mekanisk, ikke inflammatorisk. Ingen alarmsymptomer. Egnet for kiropraktisk behandling.",
            "rejected": "MONITORÉR: Morgenstivhet hos mann over 50 år bør utredes for ankyloserende spondylitt eller inflammatorisk ryggsykdom. Anbefaler blodprøver (HLA-B27, CRP, SR) og henvisning revmatolog.",
        },
        {
            "user": "Vurder røde flagg: 45 år kvinne. Korsryggsmerte med utstråling til venstre sete og baksiden av låret til kneet. SLR positiv 50 grader. Kraft og sensibilitet intakt.",
            "chosen": "TRYGT: Mekanisk korsryggsmerte med referert smerte. Smertemønsteret stopper over kneet med intakt nevrologi, forenlig med somatisk referert smerte fremfor ekte radikulopati. Manuell behandling og McKenzie-øvelser indisert.",
            "rejected": "HENVIS RUTINE: Positiv SLR test indikerer nerverotaffeksjon. Med utstråling til underekstremiteten bør pasienten henvises for MR lumbalcolumna for å utelukke prolaps. Forsiktig med manipulasjon.",
        },
        {
            "user": "Vurder røde flagg: 33 år mann, flyttet tungt. Akutt låsning i korsryggen. Ingen utstråling under kneet, ingen blæreproblemer, normal perineal sensibilitet.",
            "chosen": "TRYGT: Akutt mekanisk korsrygglåsning etter tungt løft. Selv ved uttalt smerte er dette godartet når blærefunksjon og perineal sensibilitet er normal. God prognose med tidlig mobilisering.",
            "rejected": "HENVIS SAMME DAG: Akutt låsning kan indikere diskprolaps med risiko for cauda equina-utvikling. Pasienten bør observeres nøye og henvises til akuttmottak for nevrologisk vurdering.",
        },
        {
            "user": "Vurder røde flagg: 61 år kvinne. Gradvis økende korsryggsmerte 3 måneder. Verre etter hagearbeid, bedre med hvile. Stabil vekt, ingen feber, ingen nattsmerter.",
            "chosen": "TRYGT: Mekanisk korsryggsmerte relatert til belastning. Smerte som er aktivitetsrelatert og hvileresponsiv, uten systemiske symptomer, er forenlig med degenerativ mekanisk årsak. Monitorér ved manglende bedring.",
            "rejected": "HENVIS RUTINE: Kvinne over 60 med økende ryggsmerter over 3 måneder bør utredes for malignitet eller osteoporotisk fraktur. Anbefaler røntgen, DEXA-scan og blodprøver inkludert PSA-ekvivalent.",
        },
        {
            "user": "Vurder røde flagg: 27 år mann, student. Korsryggsmerte 2 uker etter snowboarding. Lokalisert smerte, ingen radikulære tegn, sover godt om natten.",
            "chosen": "TRYGT: Posttraumatisk mekanisk korsryggsmerte. Lokalisert smerte uten nevrologiske funn og uten nattsmerter er forenlig med bløtdelsskade. Aktiv rehabilitering anbefales.",
            "rejected": "MONITORÉR: Traumemekanisme ved snowboarding kan gi okkulte frakturer som ikke synes på røntgen. Anbefaler MR ved manglende bedring etter 1 uke. Begrenset belastning.",
        },
        {
            "user": "Vurder røde flagg: 40 år mann. Intermitterende nakkesmerte over 3 måneder. Forverres ved PC-arbeid, bedres med bevegelse. Full ROM, ingen nevrologiske utfall.",
            "chosen": "TRYGT: Kronisk mekanisk nakkesmerte relatert til statisk belastning. Full ROM og fravær av nevrologiske funn er forenlig med myofascielle/artikulære årsaker. Ergonomisk rådgivning og manuell behandling.",
            "rejected": "HENVIS RUTINE: Kronisk nakkesmerte over 3 måneder bør utredes med MR cervikalcolumna for å utelukke diskpatologi eller spinal stenose. Nevrologisk vurdering anbefales.",
        },
        {
            "user": "Vurder røde flagg: 50 år kvinne. Bilateral skuldersmerte og stivhet siste 4 uker. Gradvis debut, redusert ROM alle retninger. Ingen traume, ingen systemiske symptomer.",
            "chosen": "TRYGT: Bilateral skuldersmerte med global ROM-nedsettelse uten systemiske symptomer. Forenlig med bilateral adhesiv kapsulitt (frozen shoulder) eller myofasciell dysfunksjon. Manuell behandling og øvelser.",
            "rejected": "HENVIS SAMME DAG: Bilateral skuldersmerte med stivhet hos 50-åring kan indikere polymyalgia rheumatica. Akutte blodprøver (SR, CRP) er nødvendig for å utelukke systemisk inflammasjon.",
        },
        {
            "user": "Vurder røde flagg: 35 år mann, trener mye. Brystsmerter mellom skulderbladene etter styrketrening. Smerten er skarp ved dyp innpust, bedre i nøytral stilling. Normalt EKG.",
            "chosen": "TRYGT: Muskuloskeletale brystsmerter etter belastning. Smerte ved dyp innpust som er posisjonssensitiv med normalt EKG er forenlig med costovertebral eller interkostal dysfunksjon. Manuell behandling indisert.",
            "rejected": "HENVIS SAMME DAG: Brystsmerter som forverres ved innpust kan indikere pneumothorax eller lungeemboli. Selv med normalt EKG bør pasienten henvises til akuttmottak for CT thorax og D-dimer.",
        },
        {
            "user": "Vurder røde flagg: 22 år kvinne. Hodepine bak i hodet, forverres ved nakkebevegelser. Siste 5 dager. Ingen kvalme, ingen synsforstyrrelser, ingen feber.",
            "chosen": "TRYGT: Cervikogen hodepine. Hodepine provosert av nakkebevegelser, lokalisert occipitalt, uten nevrologiske ledsagesymptomer, er typisk cervikogent. Behandle med mobilisering av øvre cervikalcolumna.",
            "rejected": "HENVIS RUTINE: Ny hodepine bør alltid utredes med bildediagnostikk for å utelukke intrakraniell patologi. Anbefaler MR caput og henvisning nevrolog for grundig utredning.",
        },
        {
            "user": "Vurder røde flagg: 55 år mann, yrkesbilsjåfør. Korsryggsmerte med stivhet etter lange kjøreturer. Bilateral setehenvisning. Normal gang, ingen sphincterforstyrrelser.",
            "chosen": "TRYGT: Mekanisk korsryggsmerte med bilateral setehenvisning hos langvarig sittende yrke. Bilateral referert smerte uten nevrologiske utfall er vanlig facettledd- eller SI-referanse. Ingen sphincteraffeksjon utelukker cauda equina.",
            "rejected": "MONITORÉR: Bilateral smerteutstråling til begge seter kan indikere sentral spinal stenose. Anbefaler MR for å kartlegge spinalkanaldiameter og eventuell kompresjon.",
        },
        {
            "user": "Vurder røde flagg: 42 år kvinne. Kjeveleddsmerter ved tygging og gaping. Klikkelyd venstre kjeveledd. Ingen hodepine, ingen nervøse symptomer.",
            "chosen": "TRYGT: Temporomandibulær dysfunksjon (TMD). Smerter ved funksjon med klikkelyd er typisk for diskdysfunksjon i kjeveleddet. Ingen alarmsymptomer. Behandle med manuell terapi og kjevøvelser.",
            "rejected": "HENVIS RUTINE: Kjeveleddsklikk med smerter bør utredes med MR kjeveledd for å vurdere diskposisjon og eventuell artrosegrad. Anbefaler tannlege/bittspesialist-vurdering.",
        },
        {
            "user": "Vurder røde flagg: 30 år mann, håndballspiller. Skuldersmerter ved kast. Smerte frontalt i skulder, positiv apprehension test. Normal styrke.",
            "chosen": "TRYGT: Anterior skulderinstabilitet/labrumpatologi hos ung idrettsutøver. Positiv apprehension med normal styrke og kastsmerter er forenlig med labrumirritasjon. Rehabilitering med stabiliseringsøvelser.",
            "rejected": "HENVIS SAMME DAG: Positiv apprehension test indikerer risiko for skulderluksasjon. Pasienten bør umiddelbart slutte med idrett og henvises for MR artrografi for å vurdere labrum og kapsel.",
        },
        {
            "user": "Vurder røde flagg: 48 år kvinne. Smerter i hælen, verst de første stegene om morgenen. Gradvis debut over 6 uker. Ingen hevelse, ingen traume.",
            "chosen": "TRYGT: Plantar fascitt. Klassisk presentasjon med startsmerter (verst om morgenen) og gradvis debut uten traume. Behandle med tøyning, riktig fottøy og eventuelt innleggssåler.",
            "rejected": "MONITORÉR: Hælsmerter over 6 uker bør utredes med røntgen for å utelukke stressfraktur i calcaneus. Vurder ultralyd for å kartlegge fascietykkelse.",
        },
    ]

    # Generate 150 pairs by using the 15 base + variations
    for i, scenario in enumerate(safe_scenarios):
        pairs.append(make_pair(SYSTEM_RED_FLAG, scenario["user"], scenario["chosen"], scenario["rejected"]))

    # Expand with age/gender/location variations
    body_parts = [
        ("korsrygg", "korsryggsmerte", "lumbal"),
        ("nakke", "nakkesmerte", "cervikal"),
        ("skulder", "skuldersmerte", "skulder"),
        ("hofte", "hoftesmerte", "hofte"),
        ("kne", "knesmerte", "kne"),
    ]
    activities = [
        "kontorarbeid", "hagearbeid", "trening", "løfting", "sitting", "gange",
        "husarbeid", "idrett", "svømming", "sykling", "bilkjøring", "yoga",
    ]
    ages_safe = [(25, "mann"), (32, "kvinne"), (41, "mann"), (47, "kvinne"), (55, "mann"),
                 (28, "kvinne"), (36, "mann"), (50, "kvinne"), (44, "mann"), (39, "kvinne"),
                 (23, "mann"), (58, "kvinne"), (34, "mann"), (46, "kvinne"), (53, "mann")]

    for idx in range(135):
        age, gender = ages_safe[idx % len(ages_safe)]
        part, pain, region = body_parts[idx % len(body_parts)]
        activity = activities[idx % len(activities)]

        user = (
            f"Vurder røde flagg: {age} år {gender}. "
            f"{pain.capitalize()} etter {activity}. "
            f"Gradvis debut, ingen nevrologiske utfall, ingen systemiske symptomer. "
            f"Normal bevegelse i {region}columna."
        )
        chosen = (
            f"TRYGT: Mekanisk {pain} relatert til {activity}. "
            f"Gradvis debut uten nevrologiske funn eller systemiske alarmsymptomer er forenlig med "
            f"godartet muskuloskeletalt problem. Egnet for kiropraktisk behandling."
        )
        rejected_options = [
            f"HENVIS RUTINE: {pain.capitalize()} bør utredes med bildediagnostikk for å utelukke alvorlig underliggende patologi. Anbefaler MR og spesialistvurdering.",
            f"MONITORÉR: Selv uten nevrologiske utfall kan det foreligge begynnende degenerativ prosess. Anbefaler røntgen og blodprøver for å utelukke inflammatorisk årsak.",
            f"HENVIS SAMME DAG: {pain.capitalize()} kan maskere alvorligere tilstander. Sikre med akutt bildediagnostikk før behandlingsstart.",
        ]
        rejected = rejected_options[idx % 3]
        pairs.append(make_pair(SYSTEM_RED_FLAG, user, chosen, rejected))

    return pairs[:150]


# ============================================================
# CATEGORY 2: RED FLAG DANGER PAIRS (100)
# chosen = correctly identifies danger and recommends action
# rejected = misses the danger / normalizes serious symptoms
# ============================================================

def generate_red_flag_danger_pairs():
    pairs = []

    danger_scenarios = [
        {
            "user": "Vurder røde flagg: 50 år, akutte korsryggsmerter, nummenhet i perineum, urinretensjon, bilateral beinsvakhet.",
            "chosen": "AKUTT (ring 113): Cauda equina-syndrom. Sadel-anestesi, urinretensjon og bilateral motorisk svikt er klassisk triade. Øyeblikkelig nevrokirurgisk dekompresjon nødvendig innen 24-48 timer for å bevare funksjon.",
            "rejected": "MONITORÉR: Akutte korsryggsmerter med perineal nummenhet kan ses ved sentral diskherniering. Anbefaler MR og oppfølging neste uke.",
        },
        {
            "user": "Vurder røde flagg: Nakkesmerter, svimmelhet, diplopi, dysartri og svelgevansker etter nakkemanipulasjon.",
            "chosen": "AKUTT (ring 113): Vertebrobasilær insuffisiens / mulig vertebral arterie-disseksjon. Diplopi, dysartri og svelgevansker er hjernestammesymptomer. Ring 113 umiddelbart. Ikke manipuler videre.",
            "rejected": "TRYGT: Mild svimmelhet etter nakkemanipulasjon er vanlig og forbigående. Diplopi kan skyldes vestibulær irritasjon. Observere og revurdere om 30 minutter.",
        },
        {
            "user": "Vurder røde flagg: 70 år kvinne, ny ryggsmerte, vekttap 8 kg siste 3 måneder, kjent brystkreft for 5 år siden, nattesmerter.",
            "chosen": "HENVIS SAMME DAG: Høy mistanke om skjelettmetastaser. Kombinasjonen av kjent kreftsykdom, uforklart vekttap, ny ryggsmerte og nattsmerter er alarmerende. Akutt bildediagnostikk og onkologisk vurdering.",
            "rejected": "MONITORÉR: Nakkesmerter med nattsmerter kan skyldes degenerative forandringer. Vekttapet kan ha andre årsaker. Prøv manuell behandling i 2-4 uker og evaluer.",
        },
        {
            "user": "Vurder røde flagg: Økende ryggsmerter, feber 39.2°C, nattesvette, nylig urinveisinfeksjon, immunsupprimert.",
            "chosen": "HENVIS SAMME DAG: Mistenkt spinal infeksjon (spondylodiskitt). Feber, nattesvette, immunsuppresjon og nylig infeksjon gir høy risiko. Blodkulturer, CRP/SR og MR columna akutt.",
            "rejected": "TRYGT: Ryggsmerter med lett feber kan skyldes enkel muskelinflammasjon. Immunsupprimerte pasienter har ofte muskelsmerter. Behandle symptomatisk og kontroller om 1 uke.",
        },
        {
            "user": "Vurder røde flagg: 65 år, klossete hender, gangvansker, hyperrefleksi, positiv Hoffman og Babinski bilateralt.",
            "chosen": "HENVIS SAMME DAG: Cervikal myelopati. Øvre motornevron-tegn (hyperrefleksi, Hoffman, Babinski) med finmotorisk svikt og gangforstyrrelse indikerer ryggmargsaffeksjon. MR cervikalcolumna akutt. Ikke manipuler cervikalt.",
            "rejected": "MONITORÉR: Gangvansker og klossete hender hos 65-åring kan skyldes normal aldring og degenerativ artrose. Hyperrefleksi kan være normalvariant. Rehabilitering med balanse- og styrkeøvelser.",
        },
        {
            "user": "Vurder røde flagg: 25 år mann. Thunderclap-hodepine, verste hodepine noensinne, akutt debut under trening, nakkestivhet.",
            "chosen": "AKUTT (ring 113): Mistenkt subaraknoidalblødning (SAH). Thunderclap-hodepine med akutt debut og nakkestivhet er SAH inntil motsatt bevist. Ring 113 umiddelbart. CT caput og lumbalpunksjon.",
            "rejected": "TRYGT: Akutt hodepine under trening er vanlig og skyldes ofte anstrengelseshodepine. Nakkestivhet kan skyldes muskelspasme. Råd hvile og paracetamol.",
        },
        {
            "user": "Vurder røde flagg: 58 år kvinne. Ensidig temporal hodepine, tyggesmerter, synsforstyrrelser, palpasjonsøm temporalarterien, SR 85.",
            "chosen": "AKUTT (ring 113): Mistenkt temporalisarteritt (kjempecellearteritt). Ensidig temporal hodepine med tyggesmerter, synsforstyrrelser og forhøyet SR er klassisk. Akutt prednisolon for å forhindre permanent synstap. Temporal biopsi.",
            "rejected": "HENVIS RUTINE: Temporal hodepine med tyggesmerter kan skyldes TMD eller spenningshodepine. SR kan være lett forhøyet ved ulike tilstander. Prøv manuell behandling i noen uker.",
        },
        {
            "user": "Vurder røde flagg: 20 år mann. Korsryggsmerter >3 mnd, morgenstivhet >45 min, bedres med bevegelse, forverres med hvile. Familiær opphopning.",
            "chosen": "HENVIS RUTINE: Mistenkt aksial spondyloartritt / ankyloserende spondylitt. Inflammatoriske kjennetegn: ung mann, lang morgenstivhet (>45 min), bedring med aktivitet, familieanamnese. HLA-B27, MR sacroiliacaledd.",
            "rejected": "TRYGT: Korsryggsmerter hos ung mann er vanligvis mekaniske. Morgenstivhet som bedres med bevegelse er normalt. Behandle med mobilisering og styrketrening for core-muskulatur.",
        },
        {
            "user": "Vurder røde flagg: 60 år mann. Gradvis progredierende bilateral beinsvakhet, gangvansker, urininkontinens, redusert sensibilitet begge bein.",
            "chosen": "HENVIS SAMME DAG: Mistenkt lumbal spinal stenose med cauda equina-affeksjon. Bilateral progredierende svakhet med blæredysfunksjon krever akutt MR og nevrokirurgisk vurdering.",
            "rejected": "MONITORÉR: Bilateral beinsvakhet og gangvansker hos eldre kan skyldes perifer nevropati eller dekondisjonering. Anbefaler blodprøver (B12, HbA1c) og fysioterapivurdering.",
        },
        {
            "user": "Vurder røde flagg: 45 år kvinne. Plutselig ensidig synstap, hodepine, kjeveleddssmerter ved tygging, allmennsymptomer.",
            "chosen": "AKUTT (ring 113): Mistenkt temporalisarteritt med akutt synstap. Synstap ved kjempecelle-arteritt er en medisinsk nødsituasjon. Akutt høydose prednisolon for å redde synet på det andre øyet.",
            "rejected": "HENVIS RUTINE: Ensidig synstap med hodepine bør utredes av øyelege. Kjeveleddssmerter kan behandles med manuell terapi parallelt med øyelege-henvisning.",
        },
    ]

    for scenario in danger_scenarios:
        pairs.append(make_pair(SYSTEM_RED_FLAG, scenario["user"], scenario["chosen"], scenario["rejected"]))

    # Expand with more danger pattern variations
    danger_patterns = [
        ("Progressiv bilateral beinsvakhet over 2 uker, blæredysfunksjon", "HENVIS SAMME DAG: Cauda equina. Progredierende motorisk svikt med blæredysfunksjon krever akutt MR.", "MONITORÉR: Beinsvakhet kan skyldes dekondisjonering. Anbefaler styrketrening."),
        ("Korsryggsmerte, feber, intravenøs rusbruk, nylige kirurgiske inngrep", "HENVIS SAMME DAG: Mistenkt epidural abscess. IV-rusbruk, feber og ryggsmerte er klassisk triade. Akutt MR og blodkulturer.", "TRYGT: Ryggsmerter med lett feber hos aktiv person. Paracetamol og oppfølging."),
        ("Ny hodepine hos pasient med kjent malignitet, forverres ved hosting", "HENVIS SAMME DAG: Mistenkt hjernemetastaser. Ny hodepine forverret ved Valsalva hos kreftpasient krever akutt CT/MR caput.", "MONITORÉR: Hodepine ved hosting kan skyldes spenningshodepine. Prøv avspenningsteknikker."),
        ("Barn 12 år, nakkesmerter etter fall fra trampoline, nakken holdes stivt", "HENVIS SAMME DAG: Mistenkt cervikalfraktur/ligamentskade hos barn. Traumemekanisme + nakkestivhet krever bildediagnostikk. Immobiliser.", "TRYGT: Nakkesmerter etter trampolining er vanlig hos barn. Muskelstrekk som går over i løpet av noen dager."),
        ("55 år, brystsmerter med utstråling til venstre arm, tungpust, svette", "AKUTT (ring 113): Mistenkt akutt koronarsyndrom. Brystsmerter med armstråling, dyspné og svette er hjerteinfarkt inntil motsatt bevist.", "MONITORÉR: Brystsmerter med armutstråling kan skyldes thorakal radikulopati. Prøv mobilisering av brystvirvelsøylen."),
        ("Akutt nakkesmerte etter traume, nedsatt kraft i alle 4 ekstremiteter", "AKUTT (ring 113): Mistenkt cervikal ryggmargsskade. Tetraparese etter nakketraume er medisinsk nødsituasjon. Immobiliser og ring 113.", "HENVIS RUTINE: Svakhet i armer og bein etter nakkestrekk kan skyldes transient nerve-irritasjon. Observer og følg opp neste dag."),
        ("40 år, ensidige hodepine, ptose, miose, pulserende nakkesmerte", "HENVIS SAMME DAG: Mistenkt karotisdisseksjon (Horner syndrom). Ptose, miose og ipsilateral nakkesmerte/hodepine krever akutt CT-angiografi.", "TRYGT: Ensidig hodepine med lett ptose kan skyldes cluster-hodepine eller migrene. Behandle symptomatisk."),
        ("Nyoppstått bilateral håndsvekkelse, smerter i begge skuldre, hyperrefleksi", "HENVIS SAMME DAG: Mistenkt cervikal myelopati. Bilateral finmotorisk svikt med øvre motornevron-tegn krever akutt MR cervikalcolumna.", "MONITORÉR: Svakhet i hendene med skuldersmerter er vanlig ved repetitivt arbeid. Ergonomisk tilpasning."),
        ("18 år, akutt ryggsmerte etter vridning, kan ikke strekke seg opp, muskelspasme bilateralt", "HENVIS RUTINE: Mulig avulsjonsfraktur eller spondylolyse hos ung med akutt ryggsmerte etter vridningstraume. Røntgen/CT anbefales.", "TRYGT: Akutt muskelspasme etter vridning er vanlig og godartet. Behandle med mobilisering og varme."),
        ("70 år, kronisk ryggsmerte som plutselig forverres, kyfosering, høydetap 3 cm", "HENVIS RUTINE: Mistenkt osteoporotisk kompresjonsfraktur. Akutt forverring med kyfose og høydetap er alarmsymptomer hos eldre kvinne. Røntgen columna.", "TRYGT: Gradvis kyfosering er normal aldersforandring. Ryggsmerter behandles med styrketrening og holdningsøvelser."),
    ]

    for i in range(90):
        pattern_idx = i % len(danger_patterns)
        user_text, chosen_text, rejected_text = danger_patterns[pattern_idx]

        # Add slight variation
        age = random.randint(20, 75)
        gender = random.choice(["mann", "kvinne"])
        user = f"Vurder røde flagg: {age} år {gender}. {user_text}"

        pairs.append(make_pair(SYSTEM_RED_FLAG, user, chosen_text, rejected_text))

    return pairs[:100]


# ============================================================
# CATEGORY 3: ICPC-2 PAIRS (100)
# chosen = correct ICPC-2 code
# rejected = ICD-10 code or wrong ICPC-2 code
# ============================================================

def generate_icpc2_pairs():
    pairs = []

    icpc2_scenarios = [
        {
            "user": "Foreslå diagnosekode for akutte korsryggsmerter med isjias.",
            "chosen": "ICPC-2: L86 (Lumbal skivesyndrom/isjias) som hoveddiagnose. Supplert med L03 (Korsryggsymptomer/-plager) for smertekomponenten.",
            "rejected": "ICD-10: M54.4 (Lumbago med isjias). M51.1 (Lumbal intervertebral disc disorder with radiculopathy).",
        },
        {
            "user": "Foreslå diagnosekode for nakkesmerter med hodepine.",
            "chosen": "ICPC-2: L83 (Nakkesyndrom) som hoveddiagnose. Legg til N02 (Spenningshodepine) hvis hodepinen er sekundær til nakkeproblem.",
            "rejected": "ICD-10: M54.2 (Cervicalgia). G44.2 (Tension-type headache). R51 (Headache).",
        },
        {
            "user": "Foreslå diagnosekode for skulder impingement med rotator cuff tendinopati.",
            "chosen": "ICPC-2: L92 (Skulder-syndrom) dekker impingement og rotator cuff-patologi i primærhelsetjenesten.",
            "rejected": "ICD-10: M75.1 (Rotator cuff syndrome). M75.4 (Impingement syndrome of shoulder).",
        },
        {
            "user": "Foreslå diagnosekode for mistenkt medial meniskskade i kneet.",
            "chosen": "ICPC-2: L96 (Akutt intern kneforstyrrelse) for akutt meniskpatologi.",
            "rejected": "ICD-10: S83.2 (Meniscus tear, current). M23.3 (Other meniscus derangements).",
        },
        {
            "user": "Foreslå diagnosekode for BPPV (benign paroksysmal posisjonsvertigo).",
            "chosen": "ICPC-2: N17 (Vertigo/svimmelhet) som primærkode. H82 (Vertigo-syndrom ved øresykdom) som spesifikk kode for perifert vestibulær årsak.",
            "rejected": "ICD-10: H81.1 (Benign paroxysmal positional vertigo). R42 (Dizziness and giddiness).",
        },
        {
            "user": "Foreslå diagnosekode for hofteartrose.",
            "chosen": "ICPC-2: L89 (Hofteartrose) — spesifikk kode for degenerativ hoftelidelse.",
            "rejected": "ICD-10: M16.1 (Primary coxarthrosis, bilateral). M16.9 (Coxarthrosis, unspecified).",
        },
        {
            "user": "Foreslå diagnosekode for smerter i brystrygg med costovertebral dysfunksjon.",
            "chosen": "ICPC-2: L04 (Brystsymptomer/-plager fra bevegelsesapparatet) for thorakale smerter.",
            "rejected": "ICD-10: M54.6 (Pain in thoracic spine). M99.1 (Subluxation complex, thoracic region).",
        },
        {
            "user": "Foreslå diagnosekode for spenningshodepine.",
            "chosen": "ICPC-2: N02 (Spenningshodepine) — spesifikk kode for episodisk og kronisk spenningshodepine.",
            "rejected": "ICD-10: G44.2 (Tension-type headache). G44.20 (Episodic tension-type headache).",
        },
        {
            "user": "Foreslå diagnosekode for plantar fascitt.",
            "chosen": "ICPC-2: L98 (Ervervede deformiteter i fot/tå) eller L17 (Fotsymptomer/-plager) — ICPC-2 har ingen spesifikk plantar fascitt-kode.",
            "rejected": "ICD-10: M72.2 (Plantar fascial fibromatosis). This is not ICPC-2.",
        },
        {
            "user": "Foreslå diagnosekode for tennisalbue (lateral epikondylitt).",
            "chosen": "ICPC-2: L93 (Tennisalbue) — spesifikk kode for lateral epikondylalgi i primærhelsetjenesten.",
            "rejected": "ICD-10: M77.1 (Lateral epicondylitis). Use the correct ICPC-2 coding system.",
        },
    ]

    for scenario in icpc2_scenarios:
        pairs.append(make_pair(SYSTEM_ICPC, scenario["user"], scenario["chosen"], scenario["rejected"]))

    # More ICPC-2 vs ICD-10 confusion pairs
    more_codes = [
        ("Foreslå kode for Whiplash/nakkesleng.", "ICPC-2: L83 (Nakkesyndrom) for whiplash-assosierte plager. L80 (Skade bevegelsesapparat) hvis akutt traume.", "ICD-10: S13.4 (Sprain and strain of cervical spine). WAD grad I-IV klassifisering."),
        ("Foreslå kode for lumbalt skiveprolaps.", "ICPC-2: L86 (Lumbal skivesyndrom) — dekker prolaps med nevrologiske symptomer.", "ICD-10: M51.1 (Lumbar disc disorder with radiculopathy). M51.2 (Other specified disc degeneration)."),
        ("Foreslå kode for adhesiv kapsulitt i skulder (frozen shoulder).", "ICPC-2: L92 (Skulder-syndrom) — samlepost for skulderpatologi i primærhelsetjenesten.", "ICD-10: M75.0 (Adhesive capsulitis of shoulder). Specific frozen shoulder code."),
        ("Foreslå kode for patellofemoral smertesyndrom.", "ICPC-2: L15 (Kneplager/symptomer) for patellofemorale smerter.", "ICD-10: M22.2 (Patellofemoral disorders). M22.4 (Chondromalacia patellae)."),
        ("Foreslå kode for temporomandibulær dysfunksjon (TMD).", "ICPC-2: L07 (Kjeve symptom/plage) for TMD-relaterte plager.", "ICD-10: K07.6 (Temporomandibular joint disorders). M26.6 (TMJ disorders)."),
        ("Foreslå kode for karpaltunnelsyndrom.", "ICPC-2: N93 (Karpaltunnelsyndrom) — har egen spesifikk kode.", "ICD-10: G56.0 (Carpal tunnel syndrome). Use ICPC-2 in Norwegian primary care."),
        ("Foreslå kode for fibromyalgi.", "ICPC-2: L18 (Muskelsmerter) er nærmeste kode. Eventuelt A04 (Tretthet/slapphet) som tilleggskode.", "ICD-10: M79.7 (Fibromyalgia). R52.2 (Other chronic pain)."),
        ("Foreslå kode for cervikogen hodepine.", "ICPC-2: L83 (Nakkesyndrom) som hoveddiagnose, N02 (Spenningshodepine) kan brukes som tillegg.", "ICD-10: G44.86 (Cervicogenic headache). M54.2 (Cervicalgia)."),
        ("Foreslå kode for SI-ledd dysfunksjon.", "ICPC-2: L03 (Korsryggsymptomer/-plager) — ICPC-2 har ingen spesifikk SI-kode, bruk korsrygg som nærmeste.", "ICD-10: M53.3 (Sacrococcygeal disorders). M46.1 (Sacroiliitis)."),
        ("Foreslå kode for akillestendinopati.", "ICPC-2: L87 (Bursitt/tendinitt/synovitt NIA) for tendinopati i akillessenen.", "ICD-10: M76.6 (Achilles tendinitis). S86.0 (Achilles tendon injury)."),
    ]

    for code_info in more_codes:
        user, chosen, rejected = code_info
        pairs.append(make_pair(SYSTEM_ICPC, user, chosen, rejected))

    # Generate more from templates
    conditions = [
        ("akutt nakkesmerte etter traume", "L83", "Nakkesyndrom", "S13.4", "Cervical sprain"),
        ("kroniske korsryggsmerter", "L03", "Korsryggsymptomer", "M54.5", "Low back pain"),
        ("skulderartrose", "L91", "Artrose annen lokalisasjon", "M19.0", "Primary OA"),
        ("ankeldistorsjon", "L77", "Forstuvning/forstrekning ankel", "S93.4", "Ankle sprain"),
        ("torticollis", "L83", "Nakkesyndrom", "M43.6", "Torticollis"),
        ("ischias uten ryggsmerter", "L86", "Lumbal skivesyndrom", "M54.3", "Sciatica"),
        ("migrene", "N89", "Migrene", "G43.9", "Migraine unspecified"),
        ("Dupuytrens kontraktur", "L87", "Bursitt/tendinitt NIA", "M72.0", "Dupuytren"),
        ("hallux valgus", "L98", "Ervervede deformiteter fot", "M20.1", "Hallux valgus"),
        ("spinal stenose", "L86", "Lumbal skivesyndrom", "M48.0", "Spinal stenosis"),
    ]

    for idx in range(80):
        cond = conditions[idx % len(conditions)]
        condition_name, icpc_code, icpc_name, icd_code, icd_name = cond
        age = random.randint(25, 70)
        gender = random.choice(["mann", "kvinne"])

        user = f"Foreslå diagnosekode for {condition_name} hos {age} år {gender}."
        chosen = f"ICPC-2: {icpc_code} ({icpc_name}). Dette er korrekt kode i primærhelsetjenestens kodeverk for denne tilstanden."
        rejected = f"ICD-10: {icd_code} ({icd_name}). Norsk primærhelsetjeneste bruker ICPC-2, ikke ICD-10."

        pairs.append(make_pair(SYSTEM_ICPC, user, chosen, rejected))

    return pairs[:100]


# ============================================================
# CATEGORY 4: COMMUNICATION PAIRS (100)
# chosen = concise, professional
# rejected = verbose, informal
# ============================================================

def generate_comms_pairs():
    pairs = []

    comms_scenarios = [
        {
            "user": "Generer SMS-påminnelse for time hos kiropraktor i morgen kl 14:00.",
            "chosen": "Påminnelse: Du har time hos kiropraktor i morgen kl. 14:00. Ved avbestilling, ring 22 XX XX XX innen kl. 12:00 i dag. Mvh Klinikken",
            "rejected": "Hei! 😊 Vi vil bare gi deg en vennlig påminnelse om at du har en avtale hos oss i morgen klokken 14:00. Vi gleder oss til å se deg! Hvis du av en eller annen grunn ikke kan komme, vennligst gi oss beskjed så snart som mulig slik at vi kan gi tiden til noen andre som trenger den. Du kan ringe oss på telefon 22 XX XX XX. Ha en fin dag videre! Med vennlig hilsen hele teamet ved Klinikken 🏥",
        },
        {
            "user": "Generer SMS for avbestilt time.",
            "chosen": "Din time [dato] kl. [tid] er avbestilt. For ny time, ring 22 XX XX XX eller book online. Mvh Klinikken",
            "rejected": "Hei der! Vi bekrefter herved at din planlagte konsultasjon hos oss den [dato] klokken [tid] nå er kansellert i henhold til ditt ønske. Vi forstår at livet kan komme i veien og at planer endres. Ikke nøl med å kontakte oss når du er klar til å booke en ny tid. Vi er her for deg! Ring oss gjerne på 22 XX XX XX eller besøk vår nettsidee for å finne en tid som passer for deg. Husk at regelmessig kiropraktisk behandling er viktig for din helse! Vi håper å se deg snart igjen. Vennlig hilsen alle oss ved Klinikken",
        },
        {
            "user": "Generer venteliste-SMS: Ledig time blitt tilgjengelig.",
            "chosen": "Ledig time: Vi har fått en avbestilling [dato] kl. [tid]. Ønsker du denne tiden? Svar JA innen 2 timer. Mvh Klinikken",
            "rejected": "Hei! Gode nyheter! 🎉 Vi har nettopp fått en avbestilling og det har dukket opp en ledig time den [dato] klokken [tid]. Siden du står på ventelisten vår, tenkte vi at dette kanskje kunne passe for deg? Vi vet hvor vanskelig det kan være å vente på en time, så vi ville gi deg denne muligheten først! Hvis du er interessert, vennligst gi oss beskjed så snart som mulig, helst innen de neste par timene, slik at vi kan sikre denne tiden for deg. Ellers vil vi tilby den til neste person på listen. Ha en fantastisk dag! 😊 Mvh Klinikken",
        },
        {
            "user": "Generer recall-SMS: Pasient har ikke vært til behandling på 3 måneder.",
            "chosen": "Hei [Navn]. Det er 3 måneder siden siste konsultasjon. Vi anbefaler oppfølgingstime for vedlikehold. Book på [link] eller ring 22 XX XX XX. Mvh Klinikken",
            "rejected": "Kjære [Navn]! Vi har savnet deg her på klinikken! 😢 Det har nå gått hele 3 måneder siden vi sist hadde gleden av å behandle deg, og vi er litt bekymret for hvordan det går med deg. Som du sikkert vet, er regelmessig vedlikeholdsbehandling svært viktig for å opprettholde de gode resultatene vi oppnådde sammen under behandlingsperioden din. Forskning viser at pasienter som kommer til jevnlige oppfølgingstimer har betydelig bedre langtidsresultater! Vi vil gjerne invitere deg tilbake for en oppfølgingssjekk. Du kan enkelt booke en time ved å besøke vår hjemmeside eller ved å ringe oss. Vi gleder oss til å høre fra deg! Varmeste hilsener fra hele teamet ved Klinikken ❤️",
        },
        {
            "user": "Generer behandlingssammendrag-SMS etter konsultasjon.",
            "chosen": "Oppsummering [dato]: Behandlet nakke C2-C5, mobilisering og tøyning. Øvelser: Chin tuck 3x10, nakkestrekk 2x30s. Neste time: [dato]. Mvh Klinikken",
            "rejected": "Hei [Navn]! Tusen takk for at du kom til oss i dag for din kiropraktiske konsultasjon! Vi håper du hadde en god opplevelse. Her er en detaljert oppsummering av alt vi gjorde under dagens behandling:\n\nVi startet med å undersøke nakkevirvlene dine fra C2 til og med C5, der vi fant en del stivhet og redusert bevegelighet. Vi gjennomførte deretter forsiktig mobilisering av disse segmentene for å forbedre bevegeligheten, etterfulgt av målrettet tøyning av de stramme musklene i området.\n\nFor å sikre best mulig resultat mellom behandlingene, anbefaler vi at du gjør følgende øvelser hjemme:\n1. Chin tuck (hakeinntrekk) - 3 sett med 10 repetisjoner\n2. Nakkestrekk (forsiktig tøyning til sidene) - 2 sett à 30 sekunder på hver side\n\nDin neste time er planlagt til [dato]. Mvh Klinikken",
        },
    ]

    for scenario in comms_scenarios:
        pairs.append(make_pair(SYSTEM_COMMS, scenario["user"], scenario["chosen"], scenario["rejected"]))

    # Generate more concise vs verbose pairs
    msg_types = [
        ("ny pasient velkomst-SMS", "Velkommen til Klinikken! Din første time er [dato] kl. [tid]. Ta med legitimasjon og eventuell dokumentasjon. Mvh Klinikken", "Hei og hjertelig velkommen som ny pasient hos oss! Vi er så glade for at du har valgt å komme til vår klinikk for din behandling. Din aller første konsultasjon hos oss er booket til [dato] klokken [tid]. For at vi skal kunne gi deg best mulig behandling fra start, ber vi deg vennligst om å ta med gyldig legitimasjon samt eventuelle røntgenbilder, MR-rapporter eller annen medisinsk dokumentasjon som kan være relevant."),
        ("ferie-stengt melding", "Klinikken er stengt [dato]-[dato] grunnet ferie. Ved akutt behov, kontakt legevakt 116117. Mvh Klinikken", "Hei alle sammen! Vi vil informere dere om at hele klinikken vår vil holde feriestengt i perioden fra [dato] til og med [dato]. Vi beklager eventuelle ulemper dette måtte medføre. Dersom du skulle ha behov for akutt medisinsk hjelp i denne perioden, anbefaler vi at du kontakter legevakten."),
        ("betalingspåminnelse", "Ubetalt faktura [nr] kr [beløp], forfalt [dato]. Betal innen [dato] for å unngå purregebyr. Spørsmål? Ring 22 XX XX XX.", "Vi ser at vi har en ubetalt faktura registrert på deg, og vi ønsker å minne deg vennlig om dette. Fakturanummer [nr] på kr [beløp] hadde forfallsdato [dato] og er dessverre ennå ikke registrert betalt hos oss. Vi forstår at ting kan glippe, og vil gjerne gi deg muligheten til å ordne dette."),
        ("oppfølging etter førstegangsbesøk", "Hei [Navn]. Hvordan går det etter behandlingen? Ved spørsmål, ring 22 XX XX XX. Neste time: [dato]. Mvh Klinikken", "Kjære [Navn]! Vi håper du har det bra etter ditt første besøk hos oss i går! Det er helt normalt å oppleve litt ømhet i det behandlede området de første dagene etter behandling. Dette er et tegn på at kroppen din responderer på behandlingen. Husk å drikke mye vann!"),
        ("sesongbasert recall", "Hei [Navn]. Høstsesongen gir ofte nakke- og ryggplager. Tid for en sjekk? Book på [link]. Mvh Klinikken", "Hei [Navn]! Nå som høsten er her med kaldere og mørkere dager, ser vi erfaringsmessig en økning i nakke- og ryggplager hos våre pasienter. Det kan skyldes endringer i aktivitetsnivå, mer stillesittende livsstil innendørs, og den generelle effekten av sesongskiftet på kroppen."),
    ]

    for i in range(95):
        msg_type, concise, verbose = msg_types[i % len(msg_types)]
        user = f"Generer {msg_type}."
        pairs.append(make_pair(SYSTEM_COMMS, user, concise, verbose))

    return pairs[:100]


# ============================================================
# CATEGORY 5: NORWEGIAN LANGUAGE PAIRS (100)
# chosen = formal medical Norwegian
# rejected = colloquial/English-mixed Norwegian
# ============================================================

def generate_norwegian_pairs():
    pairs = []

    norwegian_scenarios = [
        {
            "user": "Skriv kort subjektiv for akutt korsryggsmerte.",
            "chosen": "Subjektiv: Pasienten presenterer med akutt innsettende korsryggsmerter etter løfting. Smertene er lokalisert lumbalt med referanse til venstre glutealregion. VAS 7/10. Forverres ved fleksjon, bedres i sideleie. Ingen radikulære symptomer. Ingen blære- eller tarmforstyrrelser.",
            "rejected": "Subjective: Pasienten har vondt i korsryggen etter at han løftet noe tungt. Det gjør mest vondt i ryggen og litt i rumpa på venstre side. Han sier det er ganske vondt, kanskje 7 av 10. Det er verst når han bøyer seg fremover men bedre når han ligger på siden. Han har ikke noe nummenhet eller prikking i bena og kan tisse normalt.",
        },
        {
            "user": "Skriv objektiv for skulderundersøkelse.",
            "chosen": "Objektiv: Inspeksjon: Ingen synlig atrofi. Aktiv ROM: Fleksjon 160°, abduksjon 140° (smertefull bue 60-120°), utadrotasjon 35°, innadrotasjon T12. Spesialtester: Hawkins positiv, Neer positiv, Empty can positiv, Speed negativ. Kraft: Abduksjon 4/5, utadrotasjon 5/5. Palpasjonsømhet supraspinatussenen og subdeltoid bursa.",
            "rejected": "Objektiv: Skulderen ser ok ut, ingen tydelig muskelsvinn. Pasienten kan løfte armen til ca 160 grader fremover og ut til 140 grader til siden, men det gjør vondt mellom 60 og 120 grader (painful arc). Utover-rotasjonen er litt stiv, bare 35 grader. Noen av testene var positive (Hawkins og Neer og Empty can), men Speed test var negativ. Styrken er litt nedsatt når han løfter armen ut. Det er ømt å trykke på supraspinatus-senen.",
        },
        {
            "user": "Skriv vurdering for cervikogen hodepine.",
            "chosen": "Vurdering: Cervikogen hodepine sekundært til segmentær dysfunksjon C1-C3. Positiv fleksjonsrotasjonstest og reproduksjon av hodepine ved provokasjon av øvre cervikalsegmenter bekrefter cervikal opprinnelse. Differensialdiagnostisk er migrene og spenningshodepine mindre sannsynlig grunnet unilateral presentasjon og nakkeprovokasjonen. Prognose: God med manuell behandling.",
            "rejected": "Vurdering: Pasienten har hodepine som kommer fra nakken (cervicogenic headache). Når vi tester nakken, spesielt øverst, kan vi fremprovosere hodepinen, og flexion rotation testen er positiv. Det betyr at hodepinen sannsynligvis skyldes problemer i øvre del av nakken. Det er nok ikke migrene eller tensjonshodepine fordi den bare er på en side og utløses av nakkebevegelse.",
        },
        {
            "user": "Skriv henvisning til ortoped for rotator cuff-ruptur.",
            "chosen": "Til: Ortopedisk avdeling\nFra: [Kiropraktor], [Klinikk]\nHenvisning: [Pasientnavn], f. [dato]\n\nProblemstilling: Mistenkt full-tykkelse rotator cuff-ruptur, venstre skulder.\n\nAnamnese: 58 år mann med 4 måneders progredierende skuldersmerte og svakhet. Gradvis debut uten kjent traume. Signifikant funksjonsnedsettelse i daglige aktiviteter.\n\nKliniske funn: Positiv drop arm-test, kraftsvikt abduksjon 3/5, lag sign positiv. Aktiv abduksjon 90° med kompensatorisk skulderheving. MR rekvirert.\n\nRekvirert undersøkelse: Vurdering av operasjonsindikasjon.\n\nMed vennlig hilsen",
            "rejected": "Hei,\n\nJeg sender over en pasient som har veldig vondt i skulderen sin. Han er 58 år og har hatt smerter i ca 4 måneder nå. Det blir bare verre og verre. Jeg tror han har en rotator cuff tear fordi han ikke klarer å holde armen oppe (positive drop arm) og er ganske svak. Kan dere ta en kikk på han og se om han trenger operasjon?\n\nTakk på forhånd!",
        },
        {
            "user": "Skriv plan for behandling av lumbal spinal stenose.",
            "chosen": "Plan:\n1. Behandling: Manuell fleksjonsmobilisering (Williams-øvelser prinsipp), traksjonsbehandling, bløtdelsteknikker paravertebral muskulatur. Frekvens: 2x/uke initialt, gradvis nedtrapping.\n2. Egenøvelser: Fleksjonsorientert program — posterior pelvic tilt, kne-til-bryst, sittende lumbalfleksjon. Gange etter toleranse (syklisk intervalltrening).\n3. Ergonomisk veiledning: Unngå prolongert ekstensjon, tilrettelegging for fleksjonsvennlige stillinger.\n4. Prognose: Moderat — symptomatisk lindring forventes, men strukturelle forandringer er irreversible. Henvisning ortoped/nevrokirurg ved progredierende nevrologiske utfall.",
            "rejected": "Plan:\n1. Vi skal prøve å behandle ryggen med mobilisering og tøyning for å gjøre litt mer plass i spinalkanalen. Han bør komme 2 ganger i uken til å begynne med.\n2. Hjemmeøvelser: Han bør gjøre øvelser som bøyer ryggen fremover, for eksempel ligge på ryggen og dra knærne mot brystet. Gå turer så mye han klarer.\n3. Han bør prøve å unngå å bøye seg bakover for mye.\n4. Hvis det ikke blir bedre, må vi nok sende han til en spesialist for en vurdering av om han trenger operasjon.",
        },
    ]

    for scenario in norwegian_scenarios:
        pairs.append(make_pair(SYSTEM_NORWEGIAN, scenario["user"], scenario["chosen"], scenario["rejected"]))

    # Generate more formal vs colloquial pairs
    clinical_tasks = [
        ("Skriv kort SOAP-notat for cervikal radikulopati.", "formal", "colloquial"),
        ("Dokumenter funn fra hofte-undersøkelse.", "formal", "colloquial"),
        ("Skriv sykemelding-begrunnelse for kroniske nakkesmerter.", "formal", "colloquial"),
        ("Beskriv behandlingsrespons etter 4 konsultasjoner.", "formal", "colloquial"),
        ("Skriv epikrise etter avsluttet behandlingsforløp.", "formal", "colloquial"),
    ]

    formal_templates = [
        "Pasienten presenterer med {condition}. Klinisk undersøkelse avdekker {findings}. Differensialdiagnostisk vurderes {ddx}. Behandlingsplan: {plan}.",
        "Ved undersøkelse {date} fremkommer {findings}. Funksjonelt viser pasienten {functional}. Vurdering: {assessment}.",
        "Klinisk status: {findings}. Bevegelsesutslag: {rom}. Spesialtester: {tests}. Palpasjon: {palpation}.",
    ]

    colloquial_templates = [
        "Pasienten har {condition}. Når vi undersøkte fant vi {findings}. Det kan være {ddx}. Vi planlegger {plan}.",
        "Da pasienten kom {date} fant vi {findings}. Han/hun fungerer {functional}. Vi tror det er {assessment}.",
        "Undersøkelsen viste {findings}. Bevegeligheten er {rom}. Testene ga {tests}. Det var ømt {palpation}.",
    ]

    conditions_data = [
        {
            "condition_formal": "progredierende cervikobrakialgi med radikulære symptomer i C6-dermatomet",
            "condition_colloquial": "smerter fra nakken ned i armen som følger C6-nerven",
            "findings_formal": "nedsatt kraft dorsalfleksjon håndledd 4/5, hypoestesi laterale underarm, hyporefleksi bicepsrefleks",
            "findings_colloquial": "litt svak håndledd, nummenhet på utsiden av underarmen, bicepsrefleksen er litt svak",
            "ddx_formal": "cervikal diskherniering C5-C6, cervikal foraminal stenose, thoracic outlet syndrome",
            "ddx_colloquial": "prolaps i nakken, trang nervekanal, eller noe med ribbene/musklene som klemmer",
        },
        {
            "condition_formal": "intermitterende lumbalgi med pseudoradikulær smertereferanse til glutealregionen bilateralt",
            "condition_colloquial": "ryggsmerter som stråler til begge sidene av rumpa av og til",
            "findings_formal": "segmentær hypomobilitet L4-L5, paravertebral myalgi, negativ SLR bilateralt, intakt nevrologisk status",
            "findings_colloquial": "stivhet i nedre del av ryggen, ømme muskler langs ryggsøylen, SLR-testen var negativ, nervene ser ok ut",
            "ddx_formal": "facettleddsdysfunksjon, discogen smerte, sacroiliitt",
            "ddx_colloquial": "stivt ledd i ryggen, irritert disc, eller problemer med SI-leddet",
        },
        {
            "condition_formal": "posttraumatisk cervikalsyndrom (WAD grad II) etter kollisjon",
            "condition_colloquial": "nakkesleng etter bilulykke, litt stivhet og smerter",
            "findings_formal": "global nedsatt cervikalt bevegelsesutslag, palpatorisk hypertonus trapezius bilateral, positiv kraniocervikal fleksjonstest",
            "findings_colloquial": "stiv i hele nakken, stramme muskler i skulder/nakke-området, svak i de dype nakkemusklene",
            "ddx_formal": "whiplash-assosiert lidelse, cervikal instabilitet, posttraumatisk myofascielt smertesyndrom",
            "ddx_colloquial": "whiplash, eventuelt ustabil nakke, eller muskelknuter",
        },
    ]

    for idx in range(95):
        cond_data = conditions_data[idx % len(conditions_data)]
        task = clinical_tasks[idx % len(clinical_tasks)]

        formal_t = formal_templates[idx % len(formal_templates)]
        colloquial_t = colloquial_templates[idx % len(colloquial_templates)]

        chosen = formal_t.format(
            condition=cond_data["condition_formal"],
            findings=cond_data["findings_formal"],
            ddx=cond_data["ddx_formal"],
            plan="Manuell segmentær mobilisering, bløtdelsteknikker og stabiliserende øvelser",
            date="den aktuelle konsultasjonen",
            functional="nedsatt funksjon i daglige aktiviteter",
            assessment="mekanisk årsak med god prognose",
            rom="nedsatt i alle plan",
            tests="se over",
            palpation="paravertebral myalgi og segmentær dysfunksjon",
        )
        rejected = colloquial_t.format(
            condition=cond_data["condition_colloquial"],
            findings=cond_data["findings_colloquial"],
            ddx=cond_data["ddx_colloquial"],
            plan="mobilisering, massasje og noen øvelser",
            date="i dag",
            functional="dårligere enn normalt",
            assessment="noe mekanisk som burde bli bra",
            rom="begrenset",
            tests="varierende resultater",
            palpation="litt her og der",
        )

        pairs.append(make_pair(SYSTEM_NORWEGIAN, task[0], chosen, rejected))

    return pairs[:100]


# ============================================================
# CATEGORY 6: QUICK FIELD PAIRS (50)
# chosen = within length limit, precise
# rejected = too long, rambling
# ============================================================

def generate_quick_field_pairs():
    pairs = []

    field_scenarios = [
        {
            "user": "Generer hovedklage for pasient med akutt nakkesmerte. Maks 50 tegn.",
            "chosen": "Akutt nakkesmerte etter belastning",
            "rejected": "Pasienten presenterer med akutt innsettende nakkesmerter som oppstod plutselig etter at han løftet en tung eske i går kveld, med forverring ved rotasjon og sidefleksjon av cervikalcolumna",
        },
        {
            "user": "Generer hovedklage for pasient med kronisk korsryggsmerte. Maks 50 tegn.",
            "chosen": "Kronisk korsryggsmerte, 3 mnd varighet",
            "rejected": "Pasienten har hatt vedvarende korsryggsmerter i omtrent tre måneder nå, som gradvis har blitt verre og som påvirker både arbeid og daglige aktiviteter i stor grad",
        },
        {
            "user": "Generer hovedklage for hodepine. Maks 50 tegn.",
            "chosen": "Residiverende hodepine occipitalt",
            "rejected": "Pasienten klager over tilbakevendende hodepine som hovedsakelig er lokalisert i bakhodet og nakkeregionen, med episoder som varer flere timer av gangen",
        },
        {
            "user": "Generer kort behandlingsnotat. Maks 100 tegn.",
            "chosen": "Mobilisering C2-C5, tøyning trapezius bilateral, øvelsesinstruksjon chin tuck.",
            "rejected": "I dag gjennomførte vi en grundig behandling som inkluderte forsiktig mobilisering av cervikalsegmentene fra C2 og ned til C5, etterfulgt av bilateral tøyning av trapezius-muskelen med hold i 30 sekunder ganger tre repetisjoner. Vi instruerte også pasienten i chin tuck-øvelsen som hun skal gjøre tre ganger daglig med ti repetisjoner hver gang, og vi gjennomgikk korrekt teknikk for å sikre at hun utfører øvelsen riktig hjemme.",
        },
        {
            "user": "Generer ICPC-2 kodefelt. Maks 30 tegn.",
            "chosen": "L83 Nakkesyndrom",
            "rejected": "L83 — dette er koden for nakkesyndrom i ICPC-2 klassifikasjonen som brukes i norsk primærhelsetjeneste for pasienter med nakkerelaterte plager",
        },
    ]

    for scenario in field_scenarios:
        pairs.append(make_pair(SYSTEM_QUICK, scenario["user"], scenario["chosen"], scenario["rejected"]))

    # Generate more quick field pairs
    quick_fields = [
        ("Generer kort funksjonsbeskrivelse. Maks 60 tegn.", "Nedsatt cervikalt ROM, særlig rotasjon V.", "Pasienten viser nedsatt bevegelighet i nakken, spesielt ved rotasjon mot venstre side, samt noe begrenset lateralfleksjon og fleksjon med muskulær endefølelse"),
        ("Generer arbeidsuførhet-felt. Maks 40 tegn.", "50% sykemeldt, kontorarbeid tilpasset", "Pasienten er for tiden 50 prosent sykemeldt fra sin stilling som kontorarbeider, med tilpasning av arbeidsoppgaver og ergonomisk tilrettelegging"),
        ("Generer prognose-felt. Maks 40 tegn.", "God prognose, forventet bedring 4-6 uker", "Prognosen for denne pasienten vurderes som god med forventet gradvis bedring i løpet av de neste fire til seks ukene forutsatt at pasienten følger opp med egenøvelser"),
        ("Generer behandlingsmål. Maks 50 tegn.", "Smertefri ROM, full arbeidsdeltakelse", "Målsetningen med behandlingen er å oppnå smertefri bevegelighet i alle plan samt at pasienten skal kunne delta fullt ut i arbeidslivet uten begrensninger"),
        ("Generer kort objektiv. Maks 80 tegn.", "ROM cervikal: Rotasjon 60/80°, fleksjon 40°. Palp.øm C2-C3 paravert.", "Ved undersøkelse av cervikalcolumna finner vi at rotasjonen er redusert til 60 grader mot venstre sammenlignet med 80 grader mot høyre. Fleksjon er begrenset til 40 grader. Det er tydelig palpatorisk ømhet paravertebralt ved C2 og C3 nivå."),
    ]

    for i in range(45):
        qf = quick_fields[i % len(quick_fields)]
        user, chosen, rejected = qf
        pairs.append(make_pair(SYSTEM_QUICK, user, chosen, rejected))

    return pairs[:50]


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 60)
    print("DPO Preference Pair Generator")
    print("=" * 60)

    all_pairs = []

    # Generate each category
    safe_pairs = generate_red_flag_safe_pairs()
    print(f"  Red flag SAFE pairs:       {len(safe_pairs)}")
    all_pairs.extend(safe_pairs)

    danger_pairs = generate_red_flag_danger_pairs()
    print(f"  Red flag DANGER pairs:     {len(danger_pairs)}")
    all_pairs.extend(danger_pairs)

    icpc2_pairs = generate_icpc2_pairs()
    print(f"  ICPC-2 pairs:              {len(icpc2_pairs)}")
    all_pairs.extend(icpc2_pairs)

    comms_pairs = generate_comms_pairs()
    print(f"  Communication pairs:       {len(comms_pairs)}")
    all_pairs.extend(comms_pairs)

    norwegian_pairs = generate_norwegian_pairs()
    print(f"  Norwegian language pairs:  {len(norwegian_pairs)}")
    all_pairs.extend(norwegian_pairs)

    quick_pairs = generate_quick_field_pairs()
    print(f"  Quick field pairs:         {len(quick_pairs)}")
    all_pairs.extend(quick_pairs)

    total = len(all_pairs)
    print(f"\n  Total pairs:               {total}")

    # Shuffle
    random.shuffle(all_pairs)

    # Split 90/10
    split_idx = int(total * 0.9)
    train = all_pairs[:split_idx]
    val = all_pairs[split_idx:]

    print(f"\n  Train split:               {len(train)}")
    print(f"  Validation split:          {len(val)}")

    # Write output
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    train_path = OUTPUT_DIR / "train.jsonl"
    val_path = OUTPUT_DIR / "validation.jsonl"

    with open(train_path, "w", encoding="utf-8") as f:
        for pair in train:
            f.write(json.dumps(pair, ensure_ascii=False) + "\n")

    with open(val_path, "w", encoding="utf-8") as f:
        for pair in val:
            f.write(json.dumps(pair, ensure_ascii=False) + "\n")

    print(f"\n  Output: {train_path}")
    print(f"          {val_path}")
    print(f"\n  Train file size: {train_path.stat().st_size / 1024:.1f} KB")
    print(f"  Val file size:   {val_path.stat().st_size / 1024:.1f} KB")

    # Validate
    errors = 0
    for pair in all_pairs:
        if not pair.get("prompt") or not pair.get("chosen") or not pair.get("rejected"):
            errors += 1
        if pair.get("chosen") == pair.get("rejected"):
            errors += 1

    print(f"\n  Validation errors: {errors}")
    print("=" * 60)

    return 0 if errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
