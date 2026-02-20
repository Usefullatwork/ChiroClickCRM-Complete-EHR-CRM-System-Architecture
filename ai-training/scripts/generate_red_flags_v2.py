#!/usr/bin/env python3
"""
Generate v2 synthetic red flag training data targeting model weaknesses.

Focus areas:
1. SAFE scenarios with distractors (reduce false positives)
2. DANGEROUS scenarios with required Norwegian keywords
3. EDGE CASES with subtle clinical distinctions

Output: ChatML JSONL format for train_unsloth.py
Target: ~300 examples (100 per category), ALL Norwegian
"""

import json
import random
import sys
import argparse
from pathlib import Path

SYSTEM_PROMPT = (
    'Du er en medisinsk sikkerhetsrådgiver for kiropraktikk. '
    'Identifiser røde flagg, gi differensialdiagnostikk og klinisk resonnering. '
    'Prioriter alltid pasientsikkerhet. '
    'Klassifiser hastegrad: AKUTT (ring 113), HENVIS SAMME DAG, '
    'HENVIS RUTINE, MONITORÉR, eller TRYGT.'
)


def make_example(scenario: str, response: str) -> dict:
    return {
        'messages': [
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': f'Vurder røde flagg: {scenario}'},
            {'role': 'assistant', 'content': response},
        ]
    }


# ============================================================
# CATEGORY 1: SAFE SCENARIOS WITH DISTRACTORS (100 examples)
# ============================================================

SAFE_MECHANICAL_LBP = [
    make_example(
        '38 år mann, kontorarbeider. Korsryggsmerte etter lang bilkjøring i helgen. Smerten er verst ved foroverfleksjon, bedre i hvile. Ingen utstråling, normal nevrologisk status.',
        'TRYGT: Mekanisk korsryggsmerte. Fleksjonsprovosert smerte etter langvarig sitting er typisk for discogen irritasjon uten nerveaffeksjon. Normal nevrologisk undersøkelse utelukker radikulopati. Anbefal aktivitet, ergonomisk rådgivning og manuell behandling.'
    ),
    make_example(
        '29 år kvinne, treningsaktiv. Akutt korsryggsmerte etter markløft. Paravertebral muskelspasme, redusert ROM, men intakt sensibilitet og kraft i underekstremiteter.',
        'TRYGT: Akutt mekanisk ryggsmerte med muskelspasme etter belastning. Mekanismen (markløft) og presentasjonen (lokal spasme, intakt nevrologi) er forenlig med muskulær/ligamentær skade. Ingen tegn til alvorlig patologi. Behandle med mobilisering og progressiv belastning.'
    ),
    make_example(
        '52 år mann, snekker. Residiverende korsryggsmerte over flere år. Stivhet om morgenen som løsner etter 15-20 minutter bevegelse. Ingen nattsmerte, ingen vekttap.',
        'TRYGT: Kronisk mekanisk korsryggsmerte med morgenstivhet under 30 minutter. Kort morgenstivhet som løsner ved bevegelse er mekanisk, ikke inflammatorisk (der stivhet typisk varer >45 min). Ingen alarmsymptomer. Egnet for kiropraktisk behandling og egentrening.'
    ),
    make_example(
        '45 år kvinne, lærer. Korsryggsmerte med utstråling til venstre sete og baksiden av låret til kneet. SLR positiv 50 grader. Kraft og sensibilitet intakt. Reflekser symmetriske.',
        'TRYGT: Mekanisk korsryggsmerte med referert smerte til underekstremitet. Smertemønsteret stopper over kneet med intakt nevrologi, noe som taler for somatisk referert smerte fremfor ekte radikulopati. Manuell behandling og McKenzie-øvelser er indisert.'
    ),
    make_example(
        '33 år mann, flyttet tungt i helgen. Akutt låsning i korsryggen, kan knapt reise seg opp. Ingen utstråling under kneet, ingen blæreproblemer, normal perineal sensibilitet.',
        'TRYGT: Akutt mekanisk korsrygglåsning etter tungt løft. Selv ved uttalt smerte og funksjonsnedsettelse er dette en godartet tilstand når blærefunksjon og perineal sensibilitet er normal. Prognosen er god med tidlig mobilisering.'
    ),
    make_example(
        '61 år kvinne, pensjonist. Gradvis økende korsryggsmerte siste 3 måneder. Verre etter hagearbeid, bedre med hvile. Stabil vekt, ingen feber, ingen nattsmerter som vekker.',
        'TRYGT: Mekanisk korsryggsmerte relatert til belastning. Selv om alder >50 krever oppmerksomhet, er smerte som er aktivitetsrelatert og hvileresponsiv, uten systemiske symptomer, forenlig med degenerativ mekanisk årsak. Monitorér ved manglende bedring.'
    ),
    make_example(
        '27 år mann, student. Korsryggsmerte som har vart i 2 uker etter snowboarding. Smerten er lokalisert, ingen radikulære tegn. Han sover godt om natten.',
        'TRYGT: Posttraumatisk mekanisk korsryggsmerte hos ung mann. Lokalisert smerte uten nevrologiske funn og uten nattsmerter 2 uker etter traume er forenlig med bløtdelsskade. Ingen indikasjon for bildediagnostikk. Aktiv rehabilitering.'
    ),
    make_example(
        '42 år kvinne, kontorarbeider. Intermitterende korsryggsmerte over 6 måneder. Forverres ved langvarig sitting, bedres med gange. BMI 28. Ingen nevrologiske symptomer.',
        'TRYGT: Kronisk intermitterende mekanisk korsryggsmerte. Sitteprovosert smerte som bedres ved aktivitet er klassisk dekondisjoneringsproblem. Vektrådgivning, ergonomisk tilpasning og styrketrening for core-muskulatur anbefales.'
    ),
    make_example(
        '55 år mann, yrkesbilsjåfør. Korsryggsmerte med stivhet, spesielt etter lange kjøreturer. Smerten refererer til begge seter. Normal gangfunksjon, ingen sphincterforstyrrelser.',
        'TRYGT: Mekanisk korsryggsmerte med bilateral setehenvisning hos langvarig sittende yrke. Bilateral referert smerte til seter uten nevrologiske utfall er vanlig facettledd- eller SI-referanse. Viktig: ingen sphincteraffeksjon utelukker cauda equina.'
    ),
    make_example(
        '36 år kvinne, 8 måneder postpartum. Korsryggsmerte og bekkensmerte som begynte under svangerskapet. Positive provokasjonstester for SI-ledd. Normal nevrologisk undersøkelse.',
        'TRYGT: Postpartum mekanisk korsrygg- og bekkensmerte. Hormonelle forandringer (relaxin) og biomekanisk belastning gir SI-leddsdysfunksjon som er svært vanlig perinatalt. Stabiliseringsøvelser og bekkenbelteråd er førstelinjebehandling.'
    ),
]

SAFE_TENSION_HEADACHE = [
    make_example(
        '34 år kvinne, stresset jobbsituasjon. Bilateral hodepine som et stramt bånd rundt hodet. Ingen kvalme, ingen lysfølsomhet, ingen synsforstyrrelser. Varighet 4-6 timer.',
        'TRYGT: Spenningshodepine. Bilateral, trykkende karakter uten ledsagende nevrologiske symptomer er klassisk presentasjon. Fravær av kvalme, foto-/fonofobi og aura skiller dette fra migrene. Stresshåndtering og ergonomisk vurdering anbefales.'
    ),
    make_example(
        '28 år mann, IT-utvikler. Hodepine daglig siste 2 uker, verst på ettermiddagen. Bilateral oksipital og temporal smerte. Palpasjonsøm suboksipitalt. Ingen synsforstyrrelser.',
        'TRYGT: Spenningshodepine cervikogen komponent. Daglig hodepine forverret mot slutten av arbeidsdagen med suboksipital ømhet tyder på cervikogen bidrag fra langvarig skjermarbeid. Nakkebehandling og skjermpauser anbefales.'
    ),
    make_example(
        '41 år kvinne, tobarnsmor. Episodisk hodepine 2-3 ganger per uke over flere måneder. Mild bilateral smerte, presser/strammer. Reagerer på paracetamol. Normalt blodtrykk.',
        'TRYGT: Episodisk spenningshodepine. Mild til moderat, bilateral, trykkende smerte som responderer på enkel analgetikk er typisk. Frekvensen (2-3/uke) nærmer seg kronisk grense; viktig å forebygge medikamentoverforbrukshodepine.'
    ),
    make_example(
        '50 år mann, selvstendig næringsdrivende. Hodepine som «hjelm» over hodet, har hatt det i mange år. Stressbetinget. Ingen morgenhodepine, ingen oppkast, ingen fokalnevrologiske tegn.',
        'TRYGT: Kronisk spenningshodepine. Langvarig, stabil presentasjon uten progresjon eller nevrologiske tegn er trygg. Fravær av morgenhodepine gjør intrakraniell trykkstigning lite sannsynlig. Vurder stresshåndtering og fysioterapi.'
    ),
    make_example(
        '23 år kvinne, student i eksamensperioden. Frontal og temporal hodepine bilateralt. Smerten er konstant men mild. Sovnet dårlig siste uken. Ingen nakkestivhet, ingen feber.',
        'TRYGT: Spenningshodepine relatert til søvnmangel og eksamenstress. Bilateral, mild, konstant smerte uten meningismustegn er trygt. Søvnhygiene og stresshåndtering vil sannsynlig løse problemet.'
    ),
    make_example(
        '47 år mann. Bilateral hodepine som stråler ned i nakken. Palpasjonsøm trapezius og levator scapulae bilateralt. Full nakke-ROM med endrange-smerte. Nevrologisk ua.',
        'TRYGT: Spenningshodepine med cervikal komponent. Myofasciale triggerpunkter i trapezius og levator gir typisk referert hodepine. Normal nevrologisk status og full ROM bekrefter muskulær årsak. Manuell behandling av triggerpunkter indisert.'
    ),
    make_example(
        '31 år kvinne, kontorarbeider. Hodepine som begynner i nakken og stråler opp over bakhodet til pannen. Alltid på høyre side av nakken, men hodepinen er bilateral. Ingen aura.',
        'MONITORÉR: Cervikogen hodepine med spenningshodepinekarakter. Unilateral nakkesmerte med bilateral hodepine kan ha cervikal opprinnelse. Prøvebehandling med cervikale teknikker i 4-6 uker. Henvis til nevrolog ved manglende respons.'
    ),
    make_example(
        '56 år mann. Hodepine 3 ganger i uken, alltid bilateral, trykkende. Har brukt Paracet daglig i 2 måneder. Smerten er verre om morgenen nå.',
        'MONITORÉR: Sannsynlig medikamentoverforbrukshodepine (MOH). Daglig paracetamolbruk >15 dager/mnd kan gi MOH. Morgenforverring er typisk. Gradvis nedtrapping av analgetikk nødvendig. Henvis fastlege for nedtrappingsplan dersom pasienten ikke klarer det selv.'
    ),
    make_example(
        '39 år kvinne. Bilateral pressende hodepine som varer hele dagen. Også smerter i kjeve og tinning bilateralt. Krepitasjon i TMJ. Ingen synsforstyrrelser.',
        'TRYGT: Spenningshodepine med TMJ-dysfunksjon. Kjeveleddsdysfunksjon med krepitasjon gir referert smerte til tinning som overlapper med spenningshodepine. Kombinasjonsbehandling av kjeve og cervikalcolumna anbefales.'
    ),
    make_example(
        '44 år mann, nylig begynt med briller. Frontal bilateral hodepine som er verst etter lesing og skjermarbeid. Ingen morgensymptomer, ingen kvalme.',
        'TRYGT: Spenningshodepine, mulig visuelt betinget. Ny korreksjon eller suboptimal korreksjon kan gi akkommodativ hodepine som overlapper med spenningstype. Kontroll hos optiker anbefales i tillegg til ergonomisk tilpasning.'
    ),
]

SAFE_SHOULDER_TENDINOPATHY = [
    make_example(
        '48 år mann, maler. Gradvis økende høyre skuldersmerter siste 6 uker. Smertefull bue 60-120 grader abduksjon. Normal kraft, ingen nummenhet. Nevrovaskulært intakt.',
        'TRYGT: Supraspinatus tendinopati/impingement. Gradvis debut hos yrkesaktiv med repetitiv overhead-aktivitet og smertefull bue er klassisk. Normal kraft og nevrovaskulær status. Rehabilitering med progressiv belastning og ergonomisk tilpasning.'
    ),
    make_example(
        '55 år kvinne. Skuldersmerter i 3 måneder, verst om natten når hun ligger på den siden. Smerte ved armelevering over hodet. Neer og Hawkins positive. Normal nevrologisk.',
        'TRYGT: Rotator cuff tendinopati med nattsmerter. Nattlig skuldersmerte som forverres ved liggende posisjon er vanlig ved tendinopati grunnet kompresjon i subacromial rom. Positive impingement-tester bekrefter diagnosen. Ikke behov for akutt utredning.'
    ),
    make_example(
        '42 år mann, crossfit. Venstre skuldersmerter etter gradvis belastningsøkning. Smerte ved innadrotasjon og overhead press. Ingen instabilitetsfølelse, ingen locking.',
        'TRYGT: Belastningsrelatert skulder tendinopati. Gradvis debut relatert til treningsbelastning uten instabilitet eller mekaniske symptomer er godartet. Treningsjustering med gradvis tilbakegang til full belastning anbefales.'
    ),
    make_example(
        '60 år kvinne, strikker mye. Høyre skuldersmerter med stivhet. Passiv utadrotasjon og abduksjon redusert. Ingen trauma. Smerten er konstant men håndterbar.',
        'MONITORÉR: Begynnende adhesiv kapsulitt (frozen shoulder). Gradvis restriksjon i passiv ROM uten traume hos kvinne 50-60 år er klassisk. Tilstanden er selvbegrensende (12-24 mnd) men aktiv mobilisering kan forkorte forløpet.'
    ),
    make_example(
        '35 år mann, håndballspiller. Smerter dypt i venstre skulder ved kastbevegelse. Positiv Speeds test og OBrien test. Full passiv ROM.',
        'TRYGT: Biceps tendinopati eller SLAP-lesjon. Kastidrettsspesifikk presentasjon med positiv Speeds og OBrien taler for labrumaffeksjon. Full passiv ROM utelukker kapsulitt. Prøvebehandling 6-8 uker; ved manglende bedring vurder MR-artrografi.'
    ),
    make_example(
        '51 år kvinne. Bilateral skuldersmerter siste 2 måneder, verst om morgenen. Stivheten varer ca 20 minutter. Ingen feber, ingen vekttap. SR og CRP ikke tatt.',
        'MONITORÉR: Bilateral skulder tendinopati. Selv om bilateral presentasjon hos kvinne >50 kan minne om polymyalgia rheumatica, er morgenstivhet <30 min og fravær av systemiske symptomer reassurerende. Ta SR/CRP for å utelukke PMR. Behandle som mekanisk inntil blodprøver foreligger.'
    ),
    make_example(
        '44 år mann, IT-konsulent. Høyre skulder smerte som stråler ned til albuen. Forverres ved musebruk. Positiv Neer, negativ Spurling. Full cervical ROM.',
        'TRYGT: Skulder tendinopati med referert smerte til overarm. Negativ Spurling og full cervikal ROM utelukker cervikalt opphav. Skuldersmerte refererer ofte til deltoidinsersjonen. Ergonomisk tilpasning av arbeidsstasjon og rotator cuff-rehabilitering.'
    ),
    make_example(
        '58 år mann. Gradvis økende venstre skuldersmerter over 4 måneder. Noe nattsmerter. Klarer ikke å ta ned kopp fra øverste hylle. Ingen vekttap, ingen hoste, ikke-røyker.',
        'TRYGT: Kronisk rotator cuff tendinopati med funksjonsnedsettelse. Gradvis progresjon av mekaniske symptomer uten systemiske alarmsignaler hos ikke-røyker. Ultralyd kan avklare om det foreligger ruptur. Start rehabilitering parallelt med eventuell bildediagnostikk.'
    ),
    make_example(
        '38 år kvinne, svømmer. Bilateral skuldersmerte som er verst etter trening. Positiv Empty can test bilateralt. Normal sensibilitet og kraft ellers.',
        'TRYGT: Bilateral supraspinatus tendinopati (svømmerskulder). Overheadidrett med bilateral belastning gir typisk bilateral tendinopati. Treningsmodifikasjon med fokus på scapulær stabilitet og gradert tilbakegang til full belastning.'
    ),
    make_example(
        '63 år mann. Plutselig intens høyre skuldersmerte for 3 dager siden uten traume. Nå bedring. Rødme og varme over skulderen. Ingen feber.',
        'MONITORÉR: Sannsynlig kalsifiserende tendinitt (akutt fase). Plutselig intens smerte med lokal inflammasjon uten traume er typisk for kalsiumkrystallutfelling. Fravær av feber gjør septisk artritt mindre sannsynlig. Kontroller temperatur; henvis ved feber.'
    ),
]

SAFE_BPPV = [
    make_example(
        '52 år kvinne. Korte anfall av intenst svimmelhet ved å legge seg ned eller snu seg i sengen. Varer under 1 minutt. Ingen hørselstap, ingen hodepine.',
        'TRYGT: Benign paroksysmal posisjonsvertigo (BPPV). Korte (<60 sek) posisjonsutløste svimmelhetsanfall uten hørselstap eller nevrologiske symptomer er klassisk BPPV. Dix-Hallpike test og Epley-manøver er indisert. Ingen bildediagnostikk nødvendig.'
    ),
    make_example(
        '45 år mann. Svimmelhet som utløses av hodebevegelser, spesielt når han ser opp. Varer 20-30 sekunder. Kvalme men ingen oppkast. Normal gange mellom anfallene.',
        'TRYGT: BPPV posterior kanal. Posisjonsavhengig kortvarig svimmelhet med normal interiktal funksjon. Oppover-blikk provoserer bakre kanal. Test med Dix-Hallpike; behandle med reposisjonsmanøver.'
    ),
    make_example(
        '67 år kvinne. Svimmelhet ved å reise seg fra liggende. Varer ca 15 sekunder. Har hatt lignende episoder tidligere som gikk over av seg selv. Normalt blodtrykk.',
        'TRYGT: Residiverende BPPV. Kort posisjonsutløst svimmelhet med selvbegrensende forløp og normal hemodynamikk. BPPV residiverer hos ca 50% innen 5 år. Egenøvelser (Brandt-Daroff) kan forebygge. Normalt BT utelukker ortostatisk hypotensjon.'
    ),
    make_example(
        '39 år mann. Svimmelhet startet etter en forkjølelse for en uke siden. Posisjonsutløst, varer under ett minutt. Ingen dobbelsyn, ingen tale- eller svelgevansker.',
        'TRYGT: Post-viral BPPV. Viral øvre luftveisinfeksjon kan utløse BPPV gjennom labyrintitt. Kort varighet og fravær av hjernestammesymptomer (diplopi, dysartri, dysfagi) bekrefter perifer årsak. Reposisjonsmanøver indisert.'
    ),
    make_example(
        '58 år kvinne. Har hatt 3 episoder med kortvarig svimmelhet siste uken, alltid når hun snur seg i sengen til høyre. Rotatorisk nystagmus på Dix-Hallpike høyre.',
        'TRYGT: BPPV høyre bakre kanal, bekreftet med positiv Dix-Hallpike. Geotrop rotatorisk nystagmus med latens og utmattbarhet er diagnostisk for BPPV. Behandle med modifisert Epley-manøver for høyre side.'
    ),
    make_example(
        '71 år mann. Svimmelhet ved posisjonsendring. Varigheten er kort. Også litt ustødig på beina generelt. Ingen hodepine, ingen synsforstyrrelser, ingen armsvakhet.',
        'MONITORÉR: Sannsynlig BPPV, men generell ustøhet hos eldre krever bredere vurdering. Test Dix-Hallpike for BPPV. Vurder også ortostatisk BT, medikamentgjennomgang og balansetrening. Fravær av nevrologiske tegn er beroligende.'
    ),
    make_example(
        '34 år kvinne, gravid uke 28. Svimmelhet ved å legge seg flatt og snu seg. Kort varighet. Ingen synsforstyrrelser, ingen hodepine, normalt BT.',
        'TRYGT: BPPV i svangerskapet. Hormonelle forandringer og endret kalsiummetabolisme øker risiko for BPPV i graviditeten. Normal BT utelukker preeklampsi. Reposisjonsmanøver trygt å utføre i sidelengs modifisert posisjon.'
    ),
    make_example(
        '48 år mann. Plutselig svimmelhet for 2 dager siden som nå er posisjonsavhengig. Initialt var det voldsom svimmelhet med oppkast i flere timer. Nå kun kort svimmelhet ved hodebevegelser.',
        'TRYGT: Resolving vestibulær nevritt med residual BPPV. Akutt fase med langvarig svimmelhet etterfulgt av posisjonsavhengig kort svimmelhet er typisk progresjon. Sannsynlig otolitt-debris fra nevritten. Reposisjonsmanøver og vestibulær rehabilitering.'
    ),
    make_example(
        '62 år kvinne. Svimmelhet som kommer og går, alltid kortvarig og relatert til hodestilling. Mener det startet etter tannlegebesøk der hun lå med hodet bakover lenge.',
        'TRYGT: BPPV utløst av langvarig hodeposisjon (tannlegestol). Kjent utløsende årsak. Kort, posisjonsrelatert svimmelhet uten andre symptomer er klassisk BPPV. Svært god prognose med reposisjonsmanøver.'
    ),
    make_example(
        '43 år mann. Svimmelhet ved å legge seg ned på venstre side. Varer 10-15 sekunder, deretter går det over. Opplever det hver kveld. Ingen andre symptomer.',
        'TRYGT: BPPV venstre bakre kanal. Reproduserbar, kortvarig, posisjonsutløst svimmelhet uten ledsagende symptomer. Ensidig provokasjon hjelper lateralisere. Dix-Hallpike venstre og behandle med Epley for venstre side.'
    ),
]

SAFE_TORTICOLLIS = [
    make_example(
        '24 år mann, student. Våknet med stiv nakke, kan ikke rotere til venstre. Ingen traume, ingen utstråling, ingen hodepine. Smerte lokalisert til venstre SCM og trapezius.',
        'TRYGT: Akutt torticollis. Typisk presentasjon hos ung voksen med plutselig innsettende nakkestivhet uten traume. Muskelspasme i SCM/trapezius med bevegelsesrestriksjon er godartet og selvbegrensende. Varme, forsiktig mobilisering og NSAID.'
    ),
    make_example(
        '19 år kvinne. Våknet med nakken låst i rotasjon mot høyre. Sovnet i en rar stilling i sofaen. Ingen nummenhet, ingen svakhet i armene, ingen hodepine.',
        'TRYGT: Akutt torticollis etter uheldig sovestilling. Svært vanlig hos unge. Mekanisk årsak identifisert, ingen nevrologiske tegn. God prognose, vanligvis resolusjon innen 3-7 dager med forsiktig bevegelse og varmebehandling.'
    ),
    make_example(
        '31 år mann, kontorarbeider. Stiv nakke i 2 dager etter å ha sittet med hodet vendt til siden på et langt videomøte. Skarp smerte ved rotasjon. Ingen armsmerte.',
        'TRYGT: Akutt torticollis, posisjonelt betinget. Langvarig ensidig nakkeposisjon kan utløse facettleddsdysfunksjon med sekundær muskelspasme. Ingen radikulære tegn. Manuell behandling med forsiktig mobilisering og myofascielle teknikker.'
    ),
    make_example(
        '22 år kvinne. Akutt nakkesmerte etter å ha blitt utsatt for kald trekk. Hodet holdes lett flektert til venstre. Ømhet paravertebralt C2-C5. Nevrologisk ua.',
        'TRYGT: Akutt torticollis. Kuldeeksponering kan trigge muskelspasme og facettirritasjon. Normal nevrologisk undersøkelse. Varme, mobilisering og eventuelt NSAID. Forventet bedring innen 5-7 dager.'
    ),
    make_example(
        '26 år mann. Våknet med stiv nakke etter intens styrketrening dagen før. Lateralfleksjon begrenset bilateralt, verst til høyre. Ingen radikulære tegn, ingen hodepine.',
        'TRYGT: Akutt muskulær nakkesmerte etter overbelastning. Posttrening muskelstivhet med bilateral restriksjon uten nevrologiske tegn. Distinkt fra meningitt (som gir nakkestivhet + feber + hodepine). DOMS-lignende presentasjon. Aktiv hvile og progressiv mobilisering.'
    ),
    make_example(
        '35 år kvinne, barnehageansatt. Brå nakkesmerte da hun løftet et barn. Nå smertefull rotasjon til høyre. Armkraft normal, ingen parestesier.',
        'TRYGT: Akutt nakkefacettlåsning ved brå bevegelse. Mekanisk årsak med lokalisert smerte og bevegelsesrestriksjon uten nevrologisk affeksjon. Manuell behandling med mobilisering/manipulasjon etter grundig undersøkelse. God prognose.'
    ),
    make_example(
        '20 år mann. Våknet med torticollis for tredje gang dette året. Alltid etter perioder med mye gaming. Ingen andre symptomer.',
        'TRYGT: Residiverende akutt torticollis relatert til vedvarende uhensiktsmessig nakkeposisjon. Gjentatte episoder hos ung person uten nevrologiske tegn er godartet men krever forebyggende tiltak: ergonomisk gaming-oppsett, nakkeøvelser og regelmessige pauser.'
    ),
    make_example(
        '28 år kvinne. Akutt nakkesmerte og stivhet etter yoga (broposisjon). Smertefull ekstensjon og rotasjon. Ingen svimmelhet, ingen diplopi, ingen drop attacks.',
        'TRYGT: Akutt nakkesmerte etter ekstrem ekstensjon. Fravær av vertebrobasilære symptomer (svimmelhet, diplopi, drop attacks) utelukker vaskulær komplikasjon. Mekanisk overbelastning av posteriore strukturer. Unngå full ekstensjon midlertidig.'
    ),
    make_example(
        '33 år mann. Stiv nakke siste 3 dager, gradvis bedring. Bruker varme og Ibux. Rotasjon 50% til venstre. Ingen andre klager.',
        'TRYGT: Subakutt torticollis i bedringsfase. Gradvis bedring over 3 dager bekrefter godartet mekanisk årsak. Fortsett med varme og NSAID, legg til forsiktige tøyninger. Full restitusjon forventes innen 1-2 uker.'
    ),
    make_example(
        '17 år jente. Våknet med stiv nakke. Moren er bekymret. Ingen feber, ingen hodepine, ingen utslett, har ikke vært syk. Smerte ved bevegelse men ingen nevrologiske utfall.',
        'TRYGT: Akutt torticollis hos ungdom. Viktig å utelukke meningitt (feber, hodepine, nakkestivhet, utslett), men dette er ikke til stede her. Isolert mekanisk nakkestivhet uten systemiske tegn er godartet. Berolige foreldre, varme og forsiktig bevegelse.'
    ),
]

SAFE_COSTOCHONDRITIS = [
    make_example(
        '32 år mann, stresset. Skarp brystsmerte venstre side som forverres ved dyp innpust og palpasjon over costochondrale overganger. Normal EKG forrige uke. Ingen dyspné.',
        'TRYGT: Costochondritt. Palpasjonsreprodusertbar brystsmerte over costochondrale overganger med nylig normalt EKG er diagnostisk. Muskuloskeletalt brystveggssyndrom. Ikke behov for ytterligere kardial utredning. NSAID og beroligelse.'
    ),
    make_example(
        '27 år kvinne, treningsaktiv. Smerter i venstre brystregion etter intens benkepress. Reproduserbar ved palpasjon over 3.-4. ribbe. Ingen utstråling til arm eller kjeve.',
        'TRYGT: Posttraumatisk costochondritt etter styrketrening. Klar mekanisk utløsende årsak med palpasjonsreprodusertbar smerte. Fravær av utstråling til arm/kjeve gjør kardial årsak usannsynlig hos ung kvinne. Treningsmodifikasjon og NSAID.'
    ),
    make_example(
        '45 år mann. Brystveggsmerte høyre side, forverres ved hosting og dype innpust. Palpasjonsøm costochondralt. Ingen feber, ingen hoste utover vanlig forkjølelse.',
        'TRYGT: Costochondritt, sannsynlig sekundært til hoste. Repetitiv hosting belaster costochondrale ledd. Høyresidige brystsmerter er lavrisiko for kardial årsak. Behandle forkjølelsen og gi NSAID for brystveggsmertene.'
    ),
    make_example(
        '38 år kvinne. Stikkende smerter fremre brystvegg bilateralt over flere costochondrale overganger. Hevelse palpabel over 2. og 3. ribbe høyre. Ingen systemiske symptomer.',
        'TRYGT: Tietzes syndrom (costochondritt med hevelse). Palpabel hevelse over costochondrale overganger uten systemiske symptomer er patognomonisk for Tietzes syndrom. Godartet tilstand som behandles med NSAID og tålmodighet.'
    ),
    make_example(
        '29 år mann. Brystsmerte som begynte for 5 dager siden. Bekymret for hjertet. Smerten er skarp, lokalisert, forverres ved trykk og vridning av overkroppen. Ingen svette, ingen dyspné.',
        'TRYGT: Costochondritt. Muskuloskeletale kjennetegn (bevegelsesavhengig, palpasjonsreprodusertbar) uten kardiale alarmsymptomer (dyspné, kaldsvette, anstrengelsesutløst). Viktig å berolige pasienten og adressere helseangst.'
    ),
    make_example(
        '52 år kvinne. Brystveggssmerter venstre side, intermitterende over 3 måneder. Palpasjonsøm. Normalt EKG, normal troponin, ingen risikofaktorer for hjertesykdom.',
        'TRYGT: Kronisk costochondritt med negativ kardial utredning. Vedvarende brystveggsmerte over 3 måneder med dokumentert normal kardial status. Langvarig costochondritt er vanlig og godartet. Manuell behandling av thorax og ribbeledd kan hjelpe.'
    ),
    make_example(
        '35 år mann. Skarp venstre brystsmerte som stråler til ryggen. Forverres ved vridning. Palpasjonsøm costovertebral overgang Th4-Th6. Ingen hjertebanken.',
        'TRYGT: Costovertebral leddsmerte med referert smerte. Bakre ribbeleddsdysfunksjon kan referere fremover og gi brystsmerte. Palpasjonsreprodusertbar costovertebral ømhet bekrefter diagnosen. Mobilisering av thoracalcolumna og ribbeledd.'
    ),
    make_example(
        '41 år kvinne. Intermitterende skarp brystsmerte bilateralt. Har fibromyalgi. Uttalt palpasjonsømhet over flere costochondrale punkter. Stabil over 6 måneder.',
        'TRYGT: Costochondritt sekundært til fibromyalgi. Generalisert smertesensitisering ved fibromyalgi gir økt palpasjonsømhet inkludert costochondralt. Stabil over 6 måneder uten progresjon. Multimodal smertebehandling.'
    ),
    make_example(
        '25 år mann. Akutt skarp brystsmerte under fotballkamp (hodestøt mot brystet). Palpasjonsøm over sternum. Ingen dyspné, normal respirasjon, ingen krepitasjon.',
        'TRYGT: Traumatisk costochondritt/sternalkontusjon. Direkte traume med lokal palpasjonsømhet uten krepitasjon eller respirasjonspåvirkning. Fravær av krepitasjon gjør fraktur mindre sannsynlig. Islegging, NSAID, monitorér.'
    ),
    make_example(
        '48 år kvinne. Brystsmerte som har vekket henne om natten. Oppdager at den forverres når hun presser på brystbenet. Ligger ofte på magen. Ingen kaldsvette, ingen armsmerte.',
        'TRYGT: Nattlig costochondritt, sannsynlig forverret av mageliggerstilling. Nattlige brystsmerter kan bekymre, men palpasjonsreprodusertbarhet og forverring ved bestemt liggestilling bekrefter muskuloskelealt opphav. Sideligger-anbefaling og pute under brystet.'
    ),
]

SAFE_DOMS = [
    make_example(
        '25 år mann. Uttalt muskelømhet i korsrygg og lår 2 dager etter markløft for første gang. Smerte ved bevegelse, ingen smerte i hvile. Ingen nevrologiske symptomer.',
        'TRYGT: Forsinket muskelømhet (DOMS) etter uvant belastning. Typisk debut 24-48 timer etter aktivitet, verst ved konsentrisk bevegelse. Fravær av hvilesmerter og nevrologiske tegn bekrefter muskulær årsak. Lett aktivitet, hydrering, tålmodighet.'
    ),
    make_example(
        '30 år kvinne. Intens muskelstivhet i hele ryggen etter crossfit-konkurranse. Smertene er symmetriske og bevegelsesavhengige. Urin normal farge. Ingen feber.',
        'TRYGT: DOMS etter intens treningsbelastning. Symmetrisk, bevegelsesavhengig muskelsmerte etter kjent belastning er DOMS. Normal urinfarge gjør rhabdomyolyse lite sannsynlig. Ved mørk urin: akutt blodprøver (CK, myoglobin).'
    ),
    make_example(
        '22 år mann, fotballspiller. Generell muskelømhet etter sesongstart med mye sprint og retningsendringer. Verst i hamstrings og legger. Ingen hevelse, ingen blåmerker.',
        'TRYGT: Treningsrelatert DOMS i underekstremiteter. Sesongstart med uvante belastninger gir typisk DOMS. Fravær av hevelse og ekkymoser gjør muskelruptur lite sannsynlig. Gradvis belastningsøkning og restitusjon.'
    ),
    make_example(
        '35 år kvinne. Vondt i nakke, skuldre og øvre rygg etter første padel-kamp. Stivhet verst 2 dager etter. Kan bevege hodet men det er ubehagelig.',
        'TRYGT: DOMS i cervikal og thorakal muskulatur etter uvant racketsport. Typisk tidsmønster (peak dag 2) og distribusjon (nakke, skuldre, øvre rygg). Full ROM bevart, noe som skiller det fra akutt torticollis eller facettlåsning.'
    ),
    make_example(
        '40 år mann. Generell muskelstivhet etter å ha hjulpet en venn med flytting hele helgen. Ryggen, skuldrene og armene er støle. Ingen spesifikk skarp smerte.',
        'TRYGT: Generalisert DOMS etter uvant fysisk aktivitet. Diffus muskelstivhet uten fokal skarp smerte er klassisk DOMS. Fravær av fokale funn gjør spesifikk skade lite sannsynlig. Lett aktivitet og gradvis opptrapping.'
    ),
    make_example(
        '28 år kvinne. Uttalt ømhet i setemuskler og korsrygg dagen etter lang fjelltursesong-start. Smerter ved sitting og trappegang. Ingen utstråling.',
        'TRYGT: DOMS i gluteal og lumbal muskulatur etter lang fjelltur. Mekanisk forklarlig belastning med typisk tidsmønster. Smerte ved sitting og trappegang reflekterer gluteal involvering. Ingen radikulære tegn. Egenmestring med aktiv restitusjon.'
    ),
    make_example(
        '19 år mann, nybegynner styrketrening. Kan nesten ikke strekke armene etter første treningsøkt med bicepscurl og pulldowns. Ømhet men ingen hevelse eller misfarging.',
        'TRYGT: DOMS i biceps og latissimus etter uvant styrketrening. Klassisk presentasjon hos nybegynnere med eksentrisk overbelastning. Fravær av hevelse og misfarging taler mot muskelruptur. Forklare normalitet og gradvis progresjon.'
    ),
    make_example(
        '45 år mann, begynt å jogge. Ømhet i legger og quadriceps etter 5 km løp på asfalt. Bilateral, symmetrisk. Ingen hevelse i ankler, ingen hvilemerter.',
        'TRYGT: DOMS i underekstremiteter etter uvant løpebelastning. Bilateral symmetrisk presentasjon uten hevelse eller hvilesmerter er typisk DOMS. Asfaltunderlag gir mer eksentrisk belastning. Gradvis økning av distanse og mykere underlag.'
    ),
    make_example(
        '33 år kvinne. Uttalt abdominal ømhet 2 dager etter intens core-trening. Vondt å hoste og le. Ingen kvalme, ingen oppkast, ingen feber, normal avføring.',
        'TRYGT: DOMS i abdominalmuskulatur. Smerte ved hosting og latter skyldes muskelkontraksjon, ikke peritoneal irritasjon. Fravær av GI-symptomer og feber gjør abdominal patologi lite sannsynlig. Tydelig sammenheng med treningsbelastning.'
    ),
    make_example(
        '50 år mann. Generell stivhet og muskelømhet 3 dager etter å ha malt hele huset (vegg og tak). Nakke, skuldre, rygg og armer. Bedre med varme dusj.',
        'TRYGT: Forsinket muskelømhet etter langvarig uvant overhead-arbeid. Distribusjon matcher belastningstypen. Respons på varme er typisk for muskulær ømhet. Bedring forventes innen 5-7 dager med aktiv restitusjon.'
    ),
]

SAFE_SI_JOINT = [
    make_example(
        '32 år kvinne, 6 måneder gravid. Smerter over venstre SI-ledd og seteregion. Positive provokasjonstester (FABER, Gaenslen). Ingen nevrologiske symptomer.',
        'TRYGT: Svangerskapsrelatert SI-leddsdysfunksjon. Relaxin-mediært ligamentær laksitet og endret biomekanikk gir typisk SI-smerte i graviditet. Positive provokasjonstester bekrefter diagnosen. Bekkenbelterådgivning, stabiliseringsøvelser og sidelengs liggestilling.'
    ),
    make_example(
        '45 år mann, løper. Unilateral smerte over høyre SI-ledd som forverres ved løping og trappegange. FABER positiv høyre. Normal nevrologisk undersøkelse.',
        'TRYGT: Mekanisk SI-leddsdysfunksjon hos løper. Repetitiv ensidig belastning ved løping kan irritere SI-leddet. Positiv FABER med intakt nevrologi bekrefter mekanisk SI-affeksjon. Manuell behandling, gluteal styrke og ganganalyse.'
    ),
    make_example(
        '28 år kvinne, 3 måneder postpartum. Bilateral bekkensmerte og følelse av instabilitet. Positive kompresjon- og distraksonstester. Vanskelig å gå langt.',
        'TRYGT: Postpartum bekkeninstabilitet. Bilateral SI-smerte med instabilitetsfølelse etter fødsel er svært vanlig. Ligamentær laksitet normaliseres vanligvis innen 6-12 måneder. Bekkenbeltebruk, transversus abdominis-aktivering og gradvis belastningsøkning.'
    ),
    make_example(
        '55 år mann. Ensidig seteregionssmerte som stråler til baksiden av låret til kneet. Positiv sacral thrust. Negativ SLR. Ingen nummenhet.',
        'TRYGT: SI-leddsdysfunksjon med referert smerte. SI-leddet kan referere smerte til sete, lyske og lår ned til kneet. Positiv sacral thrust med negativ SLR differensierer fra lumbal radikulopati. Manuell SI-behandling indisert.'
    ),
    make_example(
        '38 år kvinne, kontorarbeider. Intermitterende venstre bekkensmerte siste 2 måneder. Verst ved langvarig sitting på hard stol. Positiv Gaenslen venstre.',
        'TRYGT: Mekanisk SI-leddsdysfunksjon relatert til sittende stilling. Langvarig sitting med asymmetrisk belastning kan irritere SI-leddet. Ergonomisk tilpasning, sittepute, og manuell behandling anbefales.'
    ),
    make_example(
        '42 år mann, håndverker. Smerter bak i bekkenet etter langvarig stående arbeid. Forverres ved vektoverføring til høyre ben. Kompressjonstest positiv.',
        'TRYGT: Mekanisk SI-leddsdysfunksjon ved langvarig stående arbeid. Asymmetrisk belastning gir ensidig SI-irritasjon. Positiv kompresjonstest bekrefter SI-opphav. Ergonomisk veiledning, skiftet arbeidsstilling og stabiliseringsøvelser.'
    ),
    make_example(
        '35 år kvinne. Smerter over SI-leddet som stråler til lysken. Kjent hypermobilitet. Ingen inflammatoriske tegn, ingen morgenstivhet >30 min.',
        'TRYGT: SI-leddsdysfunksjon ved generell hypermobilitet. Hypermobile pasienter er spesielt utsatt for SI-leddsproblemer grunnet ligamentær laksitet. Fravær av inflammatoriske tegn utelukker spondyloartritt. Stabiliseringstrening er hjørnestein.'
    ),
    make_example(
        '60 år mann. Bilateral bekkensmerte, verst ved oppstart etter sitting. Stivhet 10 minutter om morgenen. Moderat artrose i hofter bilateralt på tidligere røntgen.',
        'TRYGT: Mekanisk SI-leddsdysfunksjon hos eldre med kjent hofteartrose. Kort morgenstivhet (<30 min) og oppstartsmerte er mekaniske kjennetegn. Degenerative SI-forandringer er vanlig med alder. Mobilisering og aktivitetsråd.'
    ),
    make_example(
        '29 år kvinne, rytter. Smerter i bekken og korsrygg etter lang ridetur. Verst ved av- og påstigning av hesten. Positive SI-provokasjonstester. Ingen ryggstivhet.',
        'TRYGT: Mekanisk SI-leddsdysfunksjon relatert til rideaktivitet. Repetitiv bekkenbevegelse og setebelastning ved ridning kan irritere SI-leddene. Fravær av ryggstivhet gjør inflammatorisk årsak lite sannsynlig. Setemuskelstyrke og bekkenstabilitet.'
    ),
    make_example(
        '47 år mann. Smerter venstre seteregion etter å ha snublet og falt på sete. Ømhet over venstre SI-ledd. Ingen smerte ved aksial kompresjon av ryggen. Nevrologisk intakt.',
        'TRYGT: Traumatisk SI-leddsdysfunksjon etter fall. Direkte traume mot bekken med lokalisert SI-ømhet. Fravær av aksial smerte gjør fraktur lite sannsynlig. Nevrologisk intakt status er reassurerende. Manuell behandling etter akutt fase.'
    ),
]

SAFE_TENNIS_ELBOW = [
    make_example(
        '42 år mann, snekker. Gradvis økende smerter lateralt i høyre albue over 6 uker. Smerte ved grep og løfting. Positiv Cozen test. Ingen nummenhet i fingrene.',
        'TRYGT: Lateral epikondylitt (tennisalbue). Gradvis debut hos yrkesaktiv med repetitiv grepsbelastning. Positiv Cozen med fravær av nevrologiske symptomer bekrefter tendinopati. Ergonomisk tilpasning, eksentrisk trening og manuell behandling.'
    ),
    make_example(
        '35 år kvinne, nylig begynt med tennis. Smerter på utsiden av venstre albue etter slag. Palpasjonsøm laterale epikondyl. Normal albue-ROM. Ingen cervikal smerte.',
        'TRYGT: Aktivitetsrelatert lateral epikondylitt. Klassisk etiologi med ny racketsport. Lokal ømhet over laterale epikondyl med normal ROM og fravær av cervikal komponent. Teknikkvurdering, progressiv belastning og håndleddsstrekkøvelser.'
    ),
    make_example(
        '50 år kvinne, kontorarbeider. Smerter i høyre albue og underarm etter intens musebruk. Smerte ved å gripe kaffekoppen. Ingen parestesier i ulnar- eller mediannerveforsynt område.',
        'TRYGT: Lateral epikondylitt relatert til ergonomisk belastning. Repetitiv håndleddekstensjon ved musebruk gir typisk seneirritasjon. Fravær av nervesymptomer utelukker kubitaltunnelsyndrom og pronator-syndrom. Ergonomisk mus og gradert rehabilitering.'
    ),
    make_example(
        '38 år mann, maler. Smerter i begge albuer lateralt etter stor malerjobb. Bilateral Cozen positiv. Ingen hovne ledd, ingen morgenstivhet.',
        'TRYGT: Bilateral lateral epikondylitt ved overbelastning. Yrkesmessig bilateral belastning gir bilateral tendinopati. Fravær av leddhevelse og morgenstivhet gjør inflammatorisk årsak (som RA) lite sannsynlig. Arbeidsmodifikasjon og bilateral rehabilitering.'
    ),
    make_example(
        '55 år mann, golfspiller. Smerter medialt i venstre albue. Smerte ved fleksjon av håndledd mot motstand. Positiv golfers elbow-test. Ingen cubital tunnel-tegn.',
        'TRYGT: Medial epikondylitt (golferalbue). Spesifikk idrettsrelatert overbelastning med positiv provokasjonstest. Fravær av cubitaltunnelsymptomer. Teknikkvurdering av golfsving, eksentrisk styrketrening og gradvis tilbakegang til sport.'
    ),
    make_example(
        '44 år kvinne, baker. Kronisk albuesmerter lateralt siste 4 måneder, tross hvile. Noe redusert grepsstyrke. Ingen cervikal problematikk.',
        'MONITORÉR: Kronisk lateral epikondylitt med grepsstyrketap. Vedvarende symptomer >3 mnd tross hvile kan indikere tendinose (degenerativ) fremfor tendinitt (inflammatorisk). Vurder ultralyd for senetykkelse. Eksentrisk belastningstrening er evidensbasert behandling.'
    ),
    make_example(
        '48 år mann. Lateral albuesmerter som stråler ned til håndleddet. Ingen cervikal smerte, negativt Spurling, full nakke-ROM.',
        'TRYGT: Lateral epikondylitt med distal referanse. Smerter fra laterale epikondyl kan stråle langs underarmens ekstensorer. Negativ Spurling og full cervikal ROM utelukker cervikalt opphav (C5-C6 radikulopati kan mime albuesmerter).'
    ),
    make_example(
        '31 år kvinne, klatrer. Smerter lateralt i begge albuer etter intensiv klatreperiode. Palpasjonsøm. Grepsstyrke intakt. Ingen leddhevelse.',
        'TRYGT: Bilateral lateral epikondylitt relatert til klatring. Repetitiv grepsbelastning ved klatring er kjent risikofaktor. Intakt grepsstyrke og fravær av leddhevelse er reassurerende. Gradert tilbakegang med fokus på antagonisttrening.'
    ),
    make_example(
        '57 år mann. Albuesmerter høyre som har vart over et halvt år. Responderer delvis på øvelser. Ingen nattesmerter, ingen vekttap, ingen andre leddplager.',
        'TRYGT: Kronisk lateral tendinopati. Langvarig men stabil presentasjon uten systemiske symptomer. Delvis respons på øvelser tyder på riktig diagnose. Vurder sjokkbølgebehandling eller PRP som tilleggsbehandling ved utilstrekkelig respons.'
    ),
    make_example(
        '40 år mann, gitarist. Smerter i venstre albue og underarm ved langvarige øvelser. Palpasjonsøm laterale epikondyl og ekstensormuskulatur. Intakt fingerfleksjon.',
        'TRYGT: Overbelastningsrelatert lateral epikondylitt hos musiker. Langvarig fingerekstensjon og grepsbevegelser ved gitarspill belaster laterale epikondyl. Øvelsesjustering, underarmstøyninger og gradvis opptreningsprogram.'
    ),
]

SAFE_FACET_JOINT = [
    make_example(
        '40 år mann. Akutt nakkesmerte etter å ha snudd hodet raskt. Smerte lokalisert paravertebralt C4-C5 unilateralt. Ekstensjon og ipsilateral rotasjon provoserer. Ingen armsmerte.',
        'TRYGT: Akutt cervikalt facettleddssyndrom. Mekanisk provokasjon med ekstensjon og rotasjon mot affisert side er klassisk facettledds-presentasjon. Fravær av radikulære tegn. Manuell behandling med mobilisering og isometri.'
    ),
    make_example(
        '55 år kvinne. Korsryggsmerte som er verst om morgenen og ved bakoverlenig. Smerten refererer til sete og baklår. Ingen smerte under kneet. Alle nevrologiske tester negative.',
        'TRYGT: Lumbal facettleddssyndrom. Ekstensjonssmerte med referanse til sete og proksimale lår er typisk facettmønster. Smertestopp over kneet skiller fra radikulopati. Manuell behandling av facettledd med mobilisering/manipulasjon og fleksjonsøvelser.'
    ),
    make_example(
        '48 år mann. Akutt korsryggsmerte som låste seg da han bøyde seg frem og vred seg. Uttalt antalgisk holdning. Smerte ved alle bevegelser. Ingen utstråling, ingen blæresymptomer.',
        'TRYGT: Akutt lumbal facettleddslåsning. Kombinert fleksjon og rotasjon er typisk mekanisme for facettlåsning. Selv med uttalt smerte og antalgisk holdning er prognosen god når blærefunksjon er intakt. Forsiktig mobilisering og smertestillende.'
    ),
    make_example(
        '62 år kvinne. Kronisk nakkesmerte med intermitterende forverringer. Nåværende episode med smerte høyre paravertebralt C5-C6. Ekstensjon og høyre rotasjon provoserer. Ingen svimmelhet.',
        'TRYGT: Kronisk cervikal facettleddsdysfunksjon med akutt forverring. Intermitterende episoder er typisk for degenerative facettledd. Fravær av svimmelhet og vertebrobasilære symptomer gjør behandling trygt. Manuell terapi og holdningskorreksjon.'
    ),
    make_example(
        '35 år mann, håndballkeeper. Akutt thorakal smerte etter kamp. Smerte paravertebralt Th7-Th8. Rotasjon provoserer. Ingen brystsmerte anteriort, ingen dyspné.',
        'TRYGT: Thorakal facettleddsirrritasjon etter idrett. Rotasjonstraumer ved sport kan irritere thorakale facettledd. Fravær av anteriore brystsmerter og dyspné utelukker kardiopulmonal årsak. Thorakal mobilisering og idrettsspesifikk rehabilitering.'
    ),
    make_example(
        '50 år mann. Korsryggsmerte som er verre etter langvarig stående arbeid. Ekstensjon og lateralfleksjon provoserer. Bedre ved å sitte lent fremover. Ingen beinsmerte.',
        'TRYGT: Mekanisk lumbal facettleddssyndrom. Ekstensjonsforverring med fleksjonsavlastning er klassisk facettmønster. Langvarig stående arbeid belaster posteriore strukturer. Manuell behandling, fleksjonsøvelser og ergonomisk råd om å variere stilling.'
    ),
    make_example(
        '44 år kvinne. Akutt nakkesmerte som stråler opp mot bakhodet etter bilulykke for 2 dager siden. Redusert ROM men ingen nevrologiske utfall. Negativ Spurling.',
        'MONITORÉR: Posttraumatisk cervikal facettleddsirrritasjon (whiplash grad II). Nakkesmerte med redusert ROM men intakt nevrologi etter bilulykke. Negativ Spurling utelukker akutt radikulopati. Følg WAD-retningslinjer med tidlig mobilisering og monitorering i 6-8 uker.'
    ),
    make_example(
        '58 år mann. Intermitterende korsryggsmerte som har vart i flere år. Røntgen viser moderat facettatrose L4-L5 og L5-S1. Smertene er stabile, ingen forverring.',
        'TRYGT: Kjent degenerativ facettleddsartrose med stabile symptomer. Røntgenologiske forandringer korrelerer med symptomene. Stabil over tid uten progresjon er reassurerende. Vedlikeholdsbehandling med mobilisering, styrketrening og aktivitetsråd.'
    ),
    make_example(
        '38 år kvinne. Smerte midt i thorakalcolumna som er verst ved dyp innpust og rotasjon. Palpasjonsøm costovertebral ledd Th5-Th7. Ingen brystsmerte.',
        'TRYGT: Costovertebral leddsdysfunksjon. Smerte ved respirasjon og rotasjon med palpasjonsømhet over costovertebralledd er typisk. Fravær av anterior brystsmerte utelukker pleuritt og kardial årsak. Thorakal mobilisering og ribbeleddsbehandling.'
    ),
    make_example(
        '70 år mann. Korsryggsmerte og stivhet, verst om morgenen. Bedre etter 15 minutters bevegelse. Kjent spinalkanalstenose men ingen claudicatio-symptomer nå.',
        'TRYGT: Degenerativ facettleddssmerte med kjent stenose uten aktive symptomer. Kort morgenstivhet (<30 min) er mekanisk. Fravær av nevrogen claudicatio (beinsmerte ved gange som avtar i sittende) betyr at stenosen ikke er symptomatisk nå. Fortsett aktiv tilnærming.'
    ),
]


def get_safe_examples():
    """Return all Category 1 SAFE examples."""
    return (
        SAFE_MECHANICAL_LBP
        + SAFE_TENSION_HEADACHE
        + SAFE_SHOULDER_TENDINOPATHY
        + SAFE_BPPV
        + SAFE_TORTICOLLIS
        + SAFE_COSTOCHONDRITIS
        + SAFE_DOMS
        + SAFE_SI_JOINT
        + SAFE_TENNIS_ELBOW
        + SAFE_FACET_JOINT
    )


# ============================================================
# CATEGORY 2: DANGEROUS SCENARIOS WITH REQUIRED KEYWORDS (100)
# ============================================================

DANGEROUS_CAUDA_EQUINA = [
    make_example(
        '43 år mann med akutt korsryggsmerte og bilateral beinsvakhet. Klarer ikke å tisse siden i går. Nummenhet i perinealregionen.',
        'AKUTT: Cauda equina syndrom. Urinretensjon, sadelanestesi og bilateral motorisk affeksjon utgjør den klassiske triaden. Akutt nevrokirurgisk henvisning nødvendig. Ring 113 umiddelbart. Dekompresjon innen 48 timer for å bevare funksjon.'
    ),
    make_example(
        '55 år kvinne med kjent stor L4-L5 prolaps. Nye symptomer: kan ikke holde på avføring, nummenhet mellom bena, økende svakhet begge ben.',
        'AKUTT: Cauda equina syndrom ved kjent diskusprolaps. Fekal inkontinens med sadelanestesi og bilateral svakhet. Akutt forverring av kjent prolaps krever umiddelbar MR. Ring 113. Akutt henvisning nevrokirurgi.'
    ),
    make_example(
        '38 år mann. Plutselig korsryggsmerte med utstråling til begge ben. Siste 12 timer: kan ikke kjenne når han tørker seg etter toalettbesøk. Blæren føles full men klarer ikke å late vannet.',
        'AKUTT: Cauda equina syndrom — inkomplett, progredierende. Tap av perianal sensibilitet og urinretensjon med bilateral radikulopati. Tidlige tegn kan utvikle seg raskt til komplett syndrom. Ring 113. Akutt MR og nevrokirurgisk henvisning innen timer.'
    ),
    make_example(
        '67 år kvinne med spinalkanalstenose. Over 3 dager: gradvis økende bilateral beinsvakhet, nå tiltakende problemer med blærekontroll. Nummen i seteregionen.',
        'AKUTT: Cauda equina syndrom sekundært til spinalkanalstenose. Progressiv bilateral motorisk forverring med sfinkteraffeksjon. Selv ved langsom debut er cauda equina akutt. Ring 113. Akutt MR columna, nevrokirurgisk henvisning for dekompresjon.'
    ),
    make_example(
        '29 år mann, vektløfter. Akutt korsryggsmerte under markløft. Nå: bilateral isjiassmerte, kan ikke stå på tærne. Føler seg «nummen» rundt anus. Ikke tisset på 8 timer.',
        'AKUTT: Cauda equina syndrom etter akutt diskusprolaps. Stor sentral prolaps ved tung belastning. Bilateral motorisk utfall (plantarfleksjon), sadelanestesi og urinretensjon. Ring 113 umiddelbart. Akutt MR og nevrokirurgisk henvisning. Tidskritisk.'
    ),
    make_example(
        '50 år kvinne. Langsom forverring av rygg- og beinsmerter over 2 uker. Nå: inkontinens for urin, manglende følelse ved defekasjon, nedsatt kraft for dorsalfleksjon begge føtter.',
        'AKUTT: Komplett cauda equina syndrom. Dobbeltinkontinens (urin + avføring) med bilateral motorisk deficit representerer sent stadium. Prognosen er dårligere ved komplett syndrom. Ring 113. Akutt MR og hastehenvisning nevrokirurgi for dekompresjon.'
    ),
    make_example(
        '34 år mann med residiverende korsryggsmerte. Ny episode med bilateral beinsmerte. Oppdager nummenhet i indre lår bilateralt. Startproblemer ved vannlating siste 2 dager.',
        'AKUTT: Tidlig cauda equina syndrom — inkomplett. Bilateral medial lårparestesi (sadelanestesi-distribusjon) med blærehesitasjon. Inkomplett CES har bedre prognose ved rask intervensjon. Ring 113. Akutt MR og nevrokirurgisk henvisning innen 24 timer.'
    ),
    make_example(
        '72 år mann med degenerativ rygg. Ny bilateral beinsvakhet over noen dager. Kona oppdaget at han er inkontinent for urin om natten. Nedsatt sensibilitet perinealt.',
        'AKUTT: Cauda equina syndrom hos eldre med degenerativ rygg. Nattlig inkontinens som nytt symptom sammen med bilateral svakhet og sadelanestesi. Alder endrer ikke hastegrad. Ring 113. Akutt MR og nevrokirurgisk henvisning uansett alder.'
    ),
    make_example(
        '41 år kvinne, kjent diskushernie L5-S1. Akutt forverring med nummenhet i begge føtter, smerter i begge ben og plutselig urininkontinens under hosting.',
        'AKUTT: Cauda equina syndrom — akutt på kronisk. Stressinkontinens kan være tidlig sfinkteraffeksjon. Kombinert med bilateral parestesi og smerte ved kjent hernie. Ring 113 umiddelbart. Akutt MR for å vurdere prolapsstørrelse og behov for dekompresjon.'
    ),
    make_example(
        '60 år mann. Operert for prolaps L3-L4 for 3 uker siden. Nå nye symptomer: bilateral beinsvakhet, nummenhet i skrittet, urinretensjon.',
        'AKUTT: Postoperativt cauda equina syndrom — mulig re-prolaps eller epiduralt hematom. Nye cauda equina-symptomer etter ryggkirurgi krever umiddelbar akutt MR. Ring 113. Akutt nevrokirurgisk henvisning for re-operasjon.'
    ),
    make_example(
        '46 år kvinne med langvarig ryggsmerte. Akutt forverring med bilateral smerte i bena, nummenhet i seteregionen, og vannlating som «bare renner». Nedsatt analsfinktertonus.',
        'AKUTT: Cauda equina syndrom med overløpsinkontinens. Overløpsinkontinens (blæren tømmes ukontrollert) og nedsatt analsfinktertonus er alvorlige tegn. Ring 113. Akutt MR og nevrokirurgisk vurdering innen timer. Kontraindisert med manuell behandling.'
    ),
    make_example(
        '52 år mann, kjent spondylolistese L4-L5. Ny bilateral beinsmerte med parestesier i begge føtter. Økende problemer med å kontrollere urin. Nummenhet i perineum.',
        'AKUTT: Cauda equina syndrom ved kjent spondylolistese. Glidning kan komprimere cauda equina. Bilateral nevrologisk affeksjon med sfinkterproblemer og sadelanestesi. Ring 113. Akutt MR og akutt henvisning nevrokirurgi for stabilisering og dekompresjon.'
    ),
    make_example(
        '36 år kvinne. Våknet med intens korsryggsmerte og svakhet i høyre bein. I løpet av dagen utviklet hun nummenhet i venstre bein også, og har problemer med blæretømming.',
        'AKUTT: Progredierende cauda equina syndrom. Unilateral start som utvikler seg til bilateral med blæreaffeksjon viser pågående kompresjon. Tidskritisk forverring. Ring 113 umiddelbart. Akutt MR og nevrokirurgisk henvisning. Tidsvinduet innsnevres.'
    ),
    make_example(
        '58 år mann med metastatisk prostatakreft. Ny korsryggsmerte med bilateral beinsvakhet og blæreproblemer. Nummenhet i perineum.',
        'AKUTT: Cauda equina syndrom sekundært til malign kompresjon (metastaser). Prostatakreft er vanligste kilde til spinale metastaser. Ring 113 umiddelbart. Akutt MR hele columna, nevrokirurgisk og onkologisk henvisning. Deksametason iv kan startes akutt.'
    ),
    make_example(
        '44 år mann med akutt korsryggsmerte. Bilateral L5-radikulopati med droppfot bilateralt. Perianal nummenhet men blærefunksjon foreløpig intakt.',
        'AKUTT: Cauda equina syndrom — inkomplett (blærefunksjon intakt). Bilateral droppfot med sadelanestesi, selv med intakt blære, kvalifiserer som CES. Inkomplett CES har bedre prognose med rask dekompresjon. Ring 113. Akutt MR og nevrokirurgisk henvisning.'
    ),
    make_example(
        '70 år kvinne med lumbal spinalkanalstenose. Progressiv bilateral beinsvakhet og gangvansker siste uke. Nå: inkontinens for urin startet i dag. Nummen i sete.',
        'AKUTT: Cauda equina syndrom ved progredierende stenose. Ny inkontinens hos pasient med kjent stenose og progressiv svakhet er akutt. Ring 113. Akutt MR og nevrokirurgisk henvisning for dekompresjon. Behandle som tidskritisk uansett debut-hastighet.'
    ),
    make_example(
        '32 år kvinne, tidlig postpartum. Epidural analgesi under fødsel. Nå 2 dager postpartum med vedvarende bilateral beinsvakhet, nummenhet i perineum, og blæreretensjon.',
        'AKUTT: Mulig cauda equina syndrom — epiduralt hematom postpartum. Vedvarende nevrologisk utfall etter epidural anestesi kan skyldes epiduralt hematom. Ring 113. Akutt MR og nevrokirurgisk vurdering. Differensier fra epidural-relatert forbigående blokade.'
    ),
    make_example(
        '48 år mann. Kjent stor sentral diskusprolaps på MR. Nye symptomer: seksuell dysfunksjon, nedsatt følelse i perineum, bilateral beinsvakhet tilkommet siste 2 dager.',
        'AKUTT: Cauda equina syndrom med seksuell dysfunksjon. Seksuell dysfunksjon (S2-S4 affeksjon) kombinert med sadelanestesi og bilateral motorisk utfall ved kjent stor prolaps. Ring 113. Akutt nevrokirurgisk henvisning for dekompresjon.'
    ),
    make_example(
        '63 år kvinne med spinalkanalstenose. Hoftebelter smerte bilateralt, nå også nummenhet mellom bena. Blærekapasitet økt (merker ikke at blæren er full). Nedsatt sfinktertonus.',
        'AKUTT: Cauda equina syndrom ved stenose — subakutt debut. Økt blærekapasitet (hypaton blære) med sadelanestesi og nedsatt sfinktertonus. Ring 113. Akutt MR og nevrokirurgisk henvisning. Selv ved langsom utvikling er tilstanden akutt.'
    ),
    make_example(
        '39 år mann. Akutt korsryggsmerte med bilateral isjiassmerte etter hopp. Kan ikke kontrollere avføring. Nummenhet i sete og perineum. Bilateral ankeldorsalfleksjon svak.',
        'AKUTT: Cauda equina syndrom etter traumatisk diskusprolaps. Fekal inkontinens med bilateral motorisk og sensorisk utfall etter traume. Ring 113 umiddelbart. Akutt MR og nevrokirurgisk henvisning. Komplett motorisk cauda equina-bilde.'
    ),
]

DANGEROUS_CANCER = [
    make_example(
        '68 år mann, tidligere lungekreft. Ny korsryggsmerte siste 6 uker som ikke responderer på behandling. Nattesmerter som vekker ham. Vekttap 5 kg siste 2 måneder.',
        'AKUTT: Mistanke om spinal metastase fra kjent malignitet. Lungekreft er hyppig kilde til skjelettmetastaser. Nattesmerter, vekttap og manglende behandlingsrespons er alarmsignaler. Hastehenvisning for bildediagnostikk (MR hele columna). Blodprøver: SR, CRP, ALP, LD.'
    ),
    make_example(
        '72 år kvinne. Thorakal ryggsmerte med båndsmertekarakter rundt brystkassen. Økende over 3 måneder. Uforklarlig utmattelse og vekttap. Tidligere brystkreftbehandling.',
        'AKUTT: Mistanke om spinal metastase fra brystkreft. Thorakal smerte med båndsmertekarakter (radikulær) hos tidligere brystkreftpasient med vekttap. Hastehenvisning for bildediagnostikk (MR thorakal/lumbal columna). Blodprøver inkludert tumormarkører.'
    ),
    make_example(
        '65 år mann. Korsryggsmerte som gradvis forverres over 4 måneder, uavhengig av aktivitet og stilling. Hviler ikke natten. Forhøyet PSA ved siste kontroll.',
        'AKUTT: Mistanke om prostatakreft med mulig skjelettmetastase. Progressiv stillingsavhengig smerte med forhøyet PSA og nattesmerter. Hastehenvisning urolog og bildediagnostikk (rtg/MR columna, skjelettscintigrafi). Blodprøver: PSA, ALP, kalsium.'
    ),
    make_example(
        '58 år kvinne. Progredierende thorakal smerte med nattesmerter. Oppdaget palpabel kul i brystet for 2 uker siden. Også smerter mellom skulderbladene.',
        'AKUTT: Mistanke om brystkreft med mulig spinal metastase. Ny brystkul med progredierende ryggsmerter og nattesmerter er alarmbilde. Hastehenvisning brystdiagnostisk senter og bildediagnostikk for columna (MR). Malignitet skal utelukkes før manuell behandling.'
    ),
    make_example(
        '75 år mann. Vedvarende thorakolumbal smerte siste 2 måneder. Anemi ved blodprøver hos fastlege. Forhøyet SR på 85. Uttalt fatigue.',
        'HENVIS SAMME DAG: Mistanke om myelomatose. Ryggsmerte hos eldre med anemi og kraftig forhøyet SR (>50) er klassisk presentasjon for multippelt myelom. Hastehenvisning for bildediagnostikk (rtg/MR) og blodprøver (serum-elektroforese, urin Bence-Jones, kalsium).'
    ),
    make_example(
        '60 år mann, storrøyker. Ny nakkesmerte med utstråling til skulder. Palpabel supraklavikulær lymfeknute. Vekttap og hoste siste 3 måneder.',
        'AKUTT: Mistanke om malignitet — mulig lungekreft med cervikale metastaser. Supraklavikulær lymfadenopati hos røyker med vekttap og hoste er alvorlig alarmsignal. Hastehenvisning for CT thorax og bildediagnostikk nakke. Kontakt fastlege/pakkeforløp i dag.'
    ),
    make_example(
        '55 år kvinne. Nyoppstått korsryggsmerte uten mekanisk årsak. Spiser lite, har gått ned 7 kg over 3 måneder. Nattesvette. Tidligere koloncancer for 5 år siden.',
        'AKUTT: Mistanke om metastase eller residiv av malignitet. Uforklarlig vekttap, nattesvette og nye ryggsmerter hos tidligere kreftpasient. Hastehenvisning for bildediagnostikk (MR columna, CT abdomen). Blodprøver: CEA, lever, nyrefunksjon. Pakkeforløp vurderes.'
    ),
    make_example(
        '70 år mann. Multifokale ryggsmerter (thorakalt og lumbalt) som gradvis forverres. Spontan kompresjonsbrudd Th12 på røntgen. Ingen kjent osteoporose.',
        'HENVIS SAMME DAG: Mistanke om patologisk fraktur grunnet malignitet. Spontant kompresjonsfraktur uten kjent osteoporose hos eldre mann krever utredning for metastaser. Bildediagnostikk: MR hele columna. Blodprøver: SR, CRP, ALP, Ca, elektroforese.'
    ),
    make_example(
        '62 år kvinne. Vedvarende nakkesmerte med armparestesier bilateralt. MR viser destruktiv lesjon i C5-corpuset. Ingen kjent kreftsykdom.',
        'AKUTT: Vertebral destruksjon suspekt for malignitet eller metastase. Destruktiv vertebral lesjon på MR med nevrologisk affeksjon. Akutt henvisning onkolog og nevrokirurg. Hastehenvisning for staging (CT thorax/abdomen/bekken). Bildediagnostikk bekrefter allerede funn.'
    ),
    make_example(
        '48 år mann. Progredierende korsryggsmerte som ikke responderer på 6 uker behandling. Nattesmerter vedvarende. Ingen vekttap men nyoppdaget forhøyet kalsium og ALP.',
        'HENVIS SAMME DAG: Mistanke om malignitet med skjelettaffeksjon. Forhøyet kalsium (hyperkalcemi) og ALP med behandlingsresistent ryggsmerter og nattesmerter. Bildediagnostikk: MR columna og skjelettscintigrafi. Hastehenvisning for utredning av malignitet.'
    ),
    make_example(
        '78 år kvinne. Uttalt thorakal kyfose med økende smerte. Flere kompresjonsfrakturer på røntgen. Vekttap 6 kg. Nattesvette. SR 65.',
        'HENVIS SAMME DAG: Mistanke om malignitet — multiple kompresjonsfrakturer med systemiske symptomer. Flere frakturer med vekttap, nattesvette og forhøyet SR hos eldre. Bildediagnostikk: MR thorakolumbal columna. Blodprøver: elektroforese for myelom, tumormarkører.'
    ),
    make_example(
        '56 år mann. Progredierende bilateral beinsmerte og gangvansker over 8 uker. MR viser intraspinal tumor i conus medullaris.',
        'AKUTT: Intraspinal tumor med nevrologisk affeksjon. Tumor i conus medullaris med progressiv bilateral symptomatikk. Akutt nevrokirurgisk henvisning. MR-funnet krever hastehenvisning for kirurgisk vurdering. Steroider (deksametason) kan startes for å redusere ødem.'
    ),
    make_example(
        '64 år kvinne. Sterke hofte-/bekkensmerter siste måned. Ikke vektbærende stilling forverrer. Tidligere nyrecellekreft for 7 år siden. Forhøyet LD i blodprøver.',
        'AKUTT: Mistanke om metastase til bekken/hofte fra nyrecellekreft. Sent residiv av nyrecellekarsinom med skjelettmetastaser er vanlig. Forhøyet LD er suspekt. Hastehenvisning for bildediagnostikk (MR bekken, CT staging). Kontakt onkolog for vurdering.'
    ),
    make_example(
        '71 år mann. Gradvis tilkommet svakhet i begge ben over 2 måneder med ryggsmerter. Vekttap, fatigue. Røntgen thorax viser ukjent lungelesjon.',
        'AKUTT: Mistanke om malign medullakompresjon fra lungetumor. Progressiv bilateral beinsvakhet med vekttap og lungelesjon. Akutt MR hele columna for å vurdere metastaser. Hastehenvisning onkologi. Ring 113 ved rask nevrologisk forverring.'
    ),
    make_example(
        '52 år mann. Progredierende smerte i sacralregionen, verst om natten. Ikke-mekanisk smerte. Tidligere melanom fjernet for 3 år siden. Vekttap.',
        'AKUTT: Mistanke om malign metastase til sacrum fra malignt melanom. Melanom er kjent for sene skjelettmetastaser. Nattesmerter, ikke-mekanisk smerte og vekttap. Hastehenvisning for bildediagnostikk (MR bekken/sacrum). Kontakt onkolog for staging.'
    ),
]

DANGEROUS_INFECTION = [
    make_example(
        '52 år mann, diabetes type 2. Intens korsryggsmerte siste 5 dager med feber 38.5°C. Smerte konstant, uavhengig av stilling. Forhøyet CRP 120.',
        'AKUTT: Mistanke om spinal infeksjon (spondylodiscitt). Feber med forhøyet CRP og konstant ryggsmerter hos immunsupprimert (diabetes). Akutt blodprøver (CRP, SR, hvite, blodkultur) og hastehenvisning for bildediagnostikk (MR columna). Iv antibiotika etter blodkultur.'
    ),
    make_example(
        '45 år kvinne, iv rusmisbruk. Akutt nakkesmerte med feber 39°C. Uttalt nakkestivhet, kan ikke flektere nakken. Forhøyet hvite blodceller.',
        'AKUTT: Mistanke om epidural abscess cervikalt. Iv rusmisbruk er sterk risikofaktor for hematogen spinal infeksjon. Feber med fokal nakkesmerte og stivhet. Ring 113. Akutt MR cervikalcolumna og blodprøver (CRP, blodkultur). Iv antibiotika umiddelbart.'
    ),
    make_example(
        '68 år mann, 2 uker etter ryggkirurgi. Tilbakevendt smerte i operasjonsområdet med feber 38.3°C. Rødme og varme lokalt. Sårsekresjon.',
        'AKUTT: Postoperativ spinal infeksjon. Feber, lokal inflammasjon og sårsekresjon etter ryggkirurgi er sterkt suspekt. Hastehenvisning tilbake til kirurg. Blodprøver (CRP, SR, hvite, blodkultur) og MR med kontrast for å vurdere dybde av infeksjon.'
    ),
    make_example(
        '37 år mann. Gradvis økende korsryggsmerte over 3 uker med nattesvette og feber. Nylig reise til Sørøst-Asia. CRP 90, SR 55.',
        'HENVIS SAMME DAG: Mistanke om spinal infeksjon, mulig tuberkuløs spondylitt (Pott sykdom). Reise til endemisk område med feber, nattesvette og inflammasjonsmarkører. Blodprøver inkludert TB-test (IGRA/Quantiferon). Bildediagnostikk: MR columna. Infeksjonsmedisinsk henvisning.'
    ),
    make_example(
        '55 år kvinne, immunsupprimert (MTX for RA). Akutt thorakal smerte med feber 38.8°C. Palpasjonsøm over thorakalcolumna. Redusert allmenntilstand.',
        'AKUTT: Mistanke om spinal infeksjon hos immunsupprimert pasient. Immunsuppresjon med MTX øker risiko for opportunistisk infeksjon. Feber med fokal ryggsmerte. Akutt blodprøver (CRP, blodkultur, hvite) og bildediagnostikk (MR thorakalcolumna). Seponér MTX midlertidig.'
    ),
    make_example(
        '60 år mann med nylig urinveisinfeksjon. Nå korsryggsmerte med feber 38.5°C. Smerten er konstant og uavhengig av stilling. CRP stigende.',
        'AKUTT: Mistanke om hematogen spondylodiscitt etter urosepsis. Urinveisinfeksjon er vanligste kilde til hematogen spinal infeksjon. Feber med fokal ryggsmerte og økende CRP. Akutt blodprøver (blodkultur, urinkultur) og MR columna. Hastehenvisning infeksjon.'
    ),
    make_example(
        '42 år mann med diabetes. Progredierende nakkesmerte med bilateral armsvakhet og feber. MR viser epidural abscess C5-C7 med medullakompresjon.',
        'AKUTT: Cervikal epidural abscess med myelopati. Livstruende tilstand med medullakompresjon. Ring 113. Akutt nevrokirurgisk henvisning for dekompresjon og drenasje. Iv antibiotika umiddelbart etter blodkultur. Bildiagnostikk allerede bekreftet. Tidskritisk.'
    ),
    make_example(
        '73 år kvinne. Korsryggsmerte siste 4 uker med intermitterende feber. Blodprøver viser CRP 70, SR 45, mild anemi. Ingen vekttap.',
        'HENVIS SAMME DAG: Mistanke om indolent spinal infeksjon. Langvarig ryggsmerte med intermitterende feber og forhøyede inflammasjonsmarkører. Blodprøver: blodkultur x3, hvite, differensialtelling. Bildediagnostikk: MR lumbalcolumna med kontrast for å vurdere discitt/osteomyelitt.'
    ),
    make_example(
        '50 år mann, alkoholiker. Thorakal ryggsmerte med feber 39.2°C. Frysninger. Ømhet ved perkusjon over Th8-Th10. Begynner å få svakhet i bena.',
        'AKUTT: Mistanke om thorakal epidural abscess med begynnende medullakompresjon. Alkoholisme er risikofaktor for infeksjon. Feber, frysninger og fokal ømhet med nevrologisk forverring. Ring 113. Akutt MR thorakal columna og blodprøver. Iv antibiotika umiddelbart.'
    ),
    make_example(
        '35 år kvinne. Akutt lumbal smerte med feber etter tannbehandling for 10 dager siden. CRP 150. Uttalt ømhet L3-L4-segmentet.',
        'AKUTT: Mistanke om hematogen spondylodiscitt etter tannprosedyre. Dental bakteriemi kan gi hematogen seeding til columna. Uttalt CRP-stigning med fokal ryggsmerte. Akutt blodprøver (blodkultur) og bildediagnostikk (MR lumbalcolumna). Empirisk iv antibiotika.'
    ),
    make_example(
        '48 år mann, HIV-positiv med lav CD4. Progredierende thorakolumbal smerte med feber og nattesvette over 6 uker. Vekttap 4 kg.',
        'AKUTT: Mistanke om spinal infeksjon hos immunsvekket pasient. Lav CD4 gir risiko for atypiske infeksjoner (TB, sopp). Feber, nattesvette og vekttap. Bildediagnostikk: MR hele columna. Blodprøver: blodkultur, TB-test, soppantigen. Infeksjonsmedisinsk hastehenvisning.'
    ),
    make_example(
        '65 år kvinne. Korsryggsmerte med feber 38.2°C. Nylig hatt kateter i 2 uker pga hofteoperasjon. Forhøyet CRP og hvite.',
        'HENVIS SAMME DAG: Mistanke om hematogen spinal infeksjon sekundært til urinveiskateter. Langvarig kateterbruk er risikofaktor for urosepsis med hematogen seeding. Feber med ryggsmerte og inflammasjonsmarkører. Blodprøver, urinkultur og MR lumbalcolumna.'
    ),
    make_example(
        '29 år mann, injiserer steroider im. Korsryggsmerte med abscessdannelse i injeksjonssted og nå feber. Smerte ved perkusjon lumbalcolumna.',
        'AKUTT: Mistanke om spinal infeksjon via hematogen spredning fra injeksjonsabscess. Im steroidmisbruk med lokal abscess og nå spinal ømhet med feber. Akutt blodprøver (blodkultur, CRP) og bildediagnostikk (MR lumbalcolumna). Akutt kirurgisk og infeksjonsmedisinsk vurdering.'
    ),
    make_example(
        '58 år mann med endokarditt under behandling. Nå akutt korsryggsmerte med feber. Konstant smerte uavhengig av stilling.',
        'AKUTT: Mistanke om septisk embolus til columna fra endokarditt. Kjent endokarditt med ny fokal ryggsmerte og feber er høyrisiko for hematogen spondylodiscitt. Blodprøver (nye blodkulturer) og akutt MR lumbalcolumna. Hastehenvisning infeksjonsmedisin. Juster antibiotika.'
    ),
    make_example(
        '44 år kvinne. Gradvis økende nakkesmerte med stivhet og feber over 1 uke. Nå nedsatt kraft og parestesier i begge hender. CRP 200.',
        'AKUTT: Cervikal epidural abscess med begynnende myelopati. Feber, uttalte inflammasjonsmarkører og nå bilateral håndaffeksjon tyder på medullakompresjon. Ring 113. Akutt MR cervikalcolumna og blodprøver. Nevrokirurgisk hastehenvisning for dekompresjon og drenasje.'
    ),
]

DANGEROUS_FRACTURE = [
    make_example(
        '78 år kvinne med osteoporose. Akutt thorakal ryggsmerte etter å ha løftet en handlepose. Uttalt palpasjonsømhet Th11. Kyfoseøkning.',
        'HENVIS SAMME DAG: Mistanke om osteoporotisk kompresjonsbrudd (fraktur). Minimal traumemekanisme hos kjent osteoporotisk pasient med fokal ømhet. Bildediagnostikk: røntgen (rtg) thorakolumbal columna. Smertestillende. Vurder DEXA hvis ikke utført nylig.'
    ),
    make_example(
        '82 år mann med kjent osteoporose. Plutselig korsryggsmerte etter hosting. Kan knapt reise seg. Palpasjonsøm Th12-L1. Ingen nevrologiske utfall.',
        'HENVIS SAMME DAG: Mistanke om osteoporotisk kompresjonsbrudd (fraktur). Hosteprovosert fraktur ved kjent osteoporose. Bildediagnostikk: røntgen thorakolumbal overgang. Smertestillende og korsett-vurdering. Oppstart/optimalisering av osteoporosebehandling.'
    ),
    make_example(
        '25 år mann, motorsykkelulykke. Thorakolumbal smerte, kan ikke bevege ryggen uten sterk smerte. Palpasjonsøm over flere segmenter. Ingen nevrologiske utfall foreløpig.',
        'AKUTT: Mistanke om traumatisk vertebral fraktur. Høyenergitraume med uttalt spinal smerte. Ring 113 hvis ikke allerede innlagt. Bildediagnostikk: CT thorakolumbal columna akutt. Immobilisering av ryggen. Nevrologisk overvåkning for myelopati.'
    ),
    make_example(
        '70 år kvinne på prednisolon for KOLS. Ny thorakal smerte uten traume. Stikkende smerte ved dyp innpust. Palpasjonsøm Th8.',
        'HENVIS SAMME DAG: Mistanke om steroidindusert osteoporotisk fraktur. Langvarig prednisolonbruk gir sekundær osteoporose. Spontan thorakal smerte med fokal ømhet krever bildediagnostikk: røntgen thorakalcolumna. Vurder osteoporoseutredning og kalsium/vitamin D.'
    ),
    make_example(
        '45 år mann, fall fra stige (ca 3 meter). Lumbal smerte, kan ikke stå oppreist. Smerter ved aksial kompresjon. Ingen nevrologiske utfall.',
        'AKUTT: Mistanke om burst-fraktur lumbalcolumna etter fall fra høyde. Høyenergitraume med aksial belastning. Ring 113. CT lumbalcolumna akutt. Immobilisering. Selv uten nevrologiske utfall kan ustabil fraktur foreligge.'
    ),
    make_example(
        '67 år kvinne med revmatoid artritt. Nakkesmerte etter mindre fall. Palpasjonsøm C1-C2-området. Begrenset nakkerotasjon. Ingen myelopatitegn.',
        'HENVIS SAMME DAG: Mistanke om fraktur i cervikal columna, spesielt dens axis. RA gir atlantoaksial instabilitet og osteoporose. Fall med fokal C1-C2-ømhet. Bildediagnostikk: røntgen (rtg) cervikalcolumna med dens-projeksjon, eventuelt CT. Immobiliser med halskrage.'
    ),
    make_example(
        '85 år mann, fall fra egen høyde. Lumbal smerte og kan ikke reise seg. Palpasjonsøm L1-L2. Bruker blodfortynnende.',
        'HENVIS SAMME DAG: Mistanke om fraktur hos eldre ved lavenergitraume. Alder >80 med fall og fokal spinal ømhet har høy frakturrisiko. Bildediagnostikk: røntgen lumbalcolumna. Blodfortynnende øker blødningsrisiko ved eventuelt epiduralt hematom. Monitorér nevrologi.'
    ),
    make_example(
        '55 år kvinne, kjent brystkreft. Ny thorakal smerte uten traume. Palpasjonsøm Th6. Smerte verst om natten.',
        'AKUTT: Mistanke om patologisk fraktur sekundært til metastase. Brystkreft med ny atraumatisk thorakal smerte og nattesmerter. Bildediagnostikk: MR thorakalcolumna (ikke bare rtg — metastaser synes bedre på MR). Hastehenvisning onkolog.'
    ),
    make_example(
        '30 år mann, rugby. Akutt nakkesmerte etter takling. Nummenhet i begge hender som varte 30 sekunder (forbigående tetraparese). Nå asymptomatisk.',
        'AKUTT: Mistanke om cervikal fraktur/instabilitet med forbigående nevropraksi (stinger). Forbigående tetraparese etter traume er alvorlig — kan indikere cervikalkanalstenose eller instabil fraktur. Ring 113. Bildediagnostikk: CT cervikalcolumna akutt. Halskrage inntil fraktur er utelukket.'
    ),
    make_example(
        '74 år kvinne. Falt på isen for 3 dager siden, landet på ryggen. Økende korsryggsmerte. Nå vanskelig å gå. Palpasjonsøm L1.',
        'HENVIS SAMME DAG: Mistanke om fraktur lumbalcolumna etter fall. Lavenergitraume hos eldre med progresiv smerte og gangvansker. Bildediagnostikk: røntgen lumbalcolumna, eventuelt MR ved usikker røntgen. Smertestillende og mobilisering etter stabilitetsvurdering.'
    ),
    make_example(
        '40 år mann med ankyloserende spondylitt. Fall fra sykkel. Uttalt thorakal smerte. Kan ikke rotere. Kjent bambusryggsøyle på røntgen.',
        'AKUTT: Mistanke om fraktur i ankylosert columna. Bambusryggsøyle ved AS bryter som langt rør — høy risiko for ustabil fraktur og medullaskade selv ved lavenergitraume. Ring 113. CT hele columna. Immobilisering. Nevrokirurgisk vurdering. Røntgen er utilstrekkelig ved AS.'
    ),
    make_example(
        '88 år kvinne, demens. Funnet på gulvet, ukjent fallmekanisme. Nakkesmerte og holder hodet i en rar stilling. Personalet rapporterer endret funksjon.',
        'AKUTT: Mistanke om cervikal fraktur hos eldre etter fall. Ukjent mekanisme, nakkesmerte og endret hodestilling. Eldre med demens kan ha atraumatisk fraktur. Ring 113. Bildediagnostikk: CT cervikalcolumna. Halskrage og immobilisering umiddelbart. Rtg er ikke tilstrekkelig.'
    ),
    make_example(
        '62 år mann, langvarig alkoholmisbruk. Akutt thorakal smerte etter hosteanfall. Palpasjonsøm over Th9. Kjent lavt D-vitamin.',
        'HENVIS SAMME DAG: Mistanke om osteoporotisk fraktur. Alkoholisme og D-vitaminmangel gir sekundær osteoporose. Hosteprovosert fraktur. Bildediagnostikk: røntgen thorakalcolumna. Vurder DEXA-skanning og osteoporoseutredning med blodprøver (kalsium, D-vitamin, PTH).'
    ),
    make_example(
        '35 år kvinne med epilepsi. Ryggsmerte etter generalisert krampeanfall i natt. Uttalt paravertebral ømhet thorakolumbalt. Muskelspasme.',
        'HENVIS SAMME DAG: Mistanke om fraktur etter krampe. Generaliserte kramper kan gi kompresjonsbrudd fra kraftig muskelkontraksjon. Bildediagnostikk: røntgen thorakolumbal columna. Smertestillende. Epilepsikontroll hos nevrolog.'
    ),
    make_example(
        '71 år mann, fall på trapp. Lumbal smerte med utstråling til bein. Palpasjonsøm L3. Nedsatt kraft ankeldorsalfleksjon høyre.',
        'AKUTT: Mistanke om fraktur med nerverotskompresjon. Traume med fokal ømhet og nytt nevrologisk utfall. Bildediagnostikk: CT lumbalcolumna akutt. Nevrologisk overvåkning. Ved progredierende nevrologisk forverring: ring 113 og akutt nevrokirurgisk vurdering.'
    ),
]

DANGEROUS_VASCULAR = [
    make_example(
        '52 år mann. Plutselig intens nakkesmerte etter kiropraktorbehandling. Nå svimmelhet, dobbeltsyn, svelgevansker og ustø gange.',
        'AKUTT: Mistanke om vertebrobasilær arteriell disseksjon. Nakkesmerte med hjernestammesymptomer (vertigo, diplopi, dysfagi, ataksi) etter nakkemanipulasjon er akutt vaskulær hendelse. Ring 113 umiddelbart. Pasient til sykehus for CTA/MRA og nevrologisk vurdering.'
    ),
    make_example(
        '38 år kvinne. Plutselig ensidig nakkesmerte og hodepine. Horners syndrom (miose, ptose, anhidrose) på samme side. Ingen traume.',
        'AKUTT: Mistanke om arteria carotis interna-disseksjon. Horners syndrom med ipsilateral nakkesmerte er klassisk for karotisdisseksjon. Ring 113. Akutt sykehus for CTA/MRA hals og cerebral angiografi. Antikoagulasjon vurderes. Tidskritisk for å forebygge hjerneinfarkt.'
    ),
    make_example(
        '65 år mann. Plutselig svimmelhet med kvalme, nystagmus som endrer retning, og vanskeligheter med å berøre nesen (finger-nese positiv). Falltendens til venstre.',
        'AKUTT: Mistanke om vertebrobasilær sirkulasjonsforstyrrelse — mulig lillehjerneslag. Sentral vertigo med ataksi og retningsforanderlig nystagmus. Ring 113. Akutt sykehus for MR diffusjon og CTA. Ikke forveksle med BPPV — sentrale tegn er til stede.'
    ),
    make_example(
        '45 år kvinne. Akutt sterk hodepine («verste noen gang») som startet for 2 timer siden. Nakkestivhet utviklet seg. Foto- og fonofobi. Ingen traumer.',
        'AKUTT: Mistanke om subaraknoidalblødning (SAH). Thunderclap-hodepine med nakkestivhet er SAH inntil motsatt bevist. Ring 113 umiddelbart. Sykehus for CT caput og lumbalpunksjon ved negativ CT. Nevrokirurgisk beredskap. Dødelig tilstand uten behandling.'
    ),
    make_example(
        '58 år mann, atrieflimmer. Plutselig svimmelhet, taleproblemer og svakhet i høyre arm. Symptomene har vart i 20 minutter.',
        'AKUTT: Mistanke om akutt hjerneinfarkt (iskemisk slag). Atrieflimmer er risikofaktor for kardioembolisk slag. Akutte fokalnev-rologiske utfall. Ring 113 umiddelbart. Sykehus for akutt CT/MR og trombolyse dersom innenfor tidsvindu (4.5 timer). Hvert minutt teller.'
    ),
    make_example(
        '42 år mann. Akutt ensidig nakkesmerte etterfulgt av kontralateral armsvakhet og beinsvakhet. Også Horners syndrom ipsilateralt til smerten.',
        'AKUTT: Mistanke om vertebral arterie-disseksjon med hjernestammeinfarkt. Ipsilateral nakkesmerte med Horners og kontralateral hemiparese (Wallenberg variant). Ring 113 umiddelbart. Akutt sykehus for MR/MRA og nevrologisk vurdering. Vaskulær nødsituasjon.'
    ),
    make_example(
        '35 år kvinne. Plutselig hodepine under trening med øyeblikkelig nakkestivhet. GCS 15 men uttalt fotofobi og uro.',
        'AKUTT: Mistanke om subaraknoidalblødning. Anstrengelsesutløst thunderclap-hodepine med meningisme. Ring 113. Akutt sykehus for CT caput (sensitivitet 98% innen 6 timer). LP ved negativ CT. Ikke gi antikoagulasjon. Nevrokirurgisk beredskap.'
    ),
    make_example(
        '72 år kvinne med leggsmerte og hevelse i høyre legg siste 3 dager. Varme og rødme. Nylig hoftekirurgi. Smerte ved dorsalfleksjon av foten.',
        'AKUTT: Mistanke om dyp venetrombose (DVT). Klassisk Virchows triade: postoperativ immobilisering, venøs skade (kirurgi), hevelse/rødme. Positiv Homans tegn. Ring 113 eller sykehus umiddelbart. D-dimer og ultralyd venesystem. Risiko for lungeemboli.'
    ),
    make_example(
        '48 år mann. Akutt intens hodepine med besvimelse. Våknet med nakkestivhet og forvirring. Blodtrykk 195/110.',
        'AKUTT: Mistanke om subaraknoidalblødning med bevissthetspåvirkning. Thunderclap-hodepine med synkope, meningisme og hypertensjon. Ring 113 umiddelbart. Sykehus for akutt CT caput. Nevrokirurgisk beredskap for aneurysmebehandling.'
    ),
    make_example(
        '55 år mann. Plutselig svimmelhet, kvalme og oppkast. HINTS-undersøkelse viser retningsforanderlig nystagmus, negativ hodeimpulstest og skew deviation.',
        'AKUTT: Sentral vertigo — mistanke om vertebrobasilær slag. HINTS-triade (negativ HIT, retningsforanderlig nystagmus, skew deviation) er mer sensitiv enn MR for posterior fossa-infarkt tidlig. Ring 113. Akutt sykehus for MR og vaskulær utredning.'
    ),
    make_example(
        '40 år kvinne med migrene. Denne hodepinen er annerledes — startet plutselig, ikke gradvis som vanlig. Intensitet 10/10 fra sekundet den startet.',
        'AKUTT: Thunderclap-hodepine — utelukk SAH selv hos migrenepasienter. En hodepine som er annerledes enn pasientens vanlige migrene, med perakutt debut, krever akutt utredning. Ring 113. CT caput og LP. Migrene er eksklusjonsdiagnose ved thunderclap-presentasjon.'
    ),
    make_example(
        '68 år mann. Ensidig legg-og lårhevelse med smerte. Kan knapt gå. Nylig langdistanseflyvning. Risikofaktorer: overvekt, røyker.',
        'AKUTT: Mistanke om DVT. Unilateral beinhevelse etter langvarig immobilisering (fly) hos pasient med risikofaktorer (overvekt, røyking). Akutt sykehus for D-dimer og ultralyd doppler. Ved bekreftet DVT: antikoagulasjon og vurdering av lungeemboli-risiko.'
    ),
    make_example(
        '50 år kvinne. Plutselig sterk nakkesmerte med pulserende karakter. Etterpå gradvis tilkommet svakhet i høyre arm. Pupilleforskjell.',
        'AKUTT: Mistanke om cervikal arteriell disseksjon med begynnende slag. Pulserende nakkesmerte med progredierende nevrologisk utfall og pupilleforskjell (Horners). Ring 113. Akutt sykehus for CTA hals og MR hjerne. Tidskritisk for å begrense hjerneskade.'
    ),
    make_example(
        '62 år mann med plutselig brystsmerte, dyspné og sinustakykardi etter langvarig sengeleie. SpO2 88%.',
        'AKUTT: Mistanke om lungeemboli. Brystsmerte med dyspné og hypoksi etter immobilisering. Ring 113 umiddelbart. Sykehus for CT pulmonal angiografi, D-dimer, troponin. Oksygentilskudd umiddelbart. Antikoagulasjon ved bekreftet PE.'
    ),
    make_example(
        '44 år kvinne. Akutt svimmelhet med dobbeltsyn og problemer med å koordinere bevegelser. Også nummenhet i ansiktet på venstre side.',
        'AKUTT: Mistanke om vertebrobasilær sirkulasjonsforstyrrelse — mulig hjernestammeinfarkt. Vertigo med diplopi, ataksi og facialisparestesi er hjernestammesymptomer. Ring 113. Akutt sykehus for MR diffusjon og CTA vertebrobasilært kretsløp. Tidsvindu for trombolyse.'
    ),
]

DANGEROUS_NEURO = [
    make_example(
        '42 år mann. Gradvis tilkommet svakhet i høyre fot over 3 uker — nå droppfot. Ryggsmerter med utstråling til laterale legg. Nedsatt sensibilitet L5-dermatomet.',
        'HENVIS SAMME DAG: Progressivt nevrologisk underskudd — droppfot. Progredierende L5-radikulopati med motorisk utfall (droppfot) over uker krever akutt bildediagnostikk (MR lumbalcolumna). Myelopati skal utelukkes. Hastehenvisning nevrokirurgi for vurdering av dekompresjon.'
    ),
    make_example(
        '55 år kvinne. Klossethet i begge hender og gangvansker siste 2 måneder. Hyperrefleksi i underekstremiteter. Positiv Babinski bilateralt. Nakkesmerte.',
        'HENVIS SAMME DAG: Mistanke om cervikal myelopati. Bilateral finmotorisk dysfunksjon, gangforstyrrelse, hyperrefleksi og positiv Babinski er øvre motornevron-tegn. Bildediagnostikk: MR cervikalcolumna. Hastehenvisning nevrokirurg for vurdering av dekompresjon. Ikke manipulér nakken.'
    ),
    make_example(
        '48 år mann. Gradvis tilkommet gangvansker med spastisitet i begge ben. Urinfrekvens og urgency. Lhermittes tegn positivt (elektrisk følelse nedover ryggen ved nakkefleksjon).',
        'HENVIS SAMME DAG: Cervikal myelopati med sfinkteraffeksjon. Positiv Lhermitte, spastisk gangforstyrrelse og blæresymptomer indikerer medullakompresjon. Bildediagnostikk: MR cervikalcolumna akutt. Henvisning nevrokirurg. Differensialdiagnoser: prolaps, stenose, demyelinisering.'
    ),
    make_example(
        '60 år kvinne. Bilateral armsvakhet med muskelatrofi i håndmuskulatur. Fascikulasjoner. Samtidig hyperrefleksi i bena. Svelgevansker begynt.',
        'HENVIS SAMME DAG: Mistanke om motornevronsykdom (ALS). Kombinert øvre og nedre motornevrontegn (atrofi + fascikulasjoner + hyperrefleksi) med bulbær involvering (dysfagi). Hastehenvisning nevrolog for utredning med EMG/NCV og MR. Bildediagnostikk for å utelukke myelopati.'
    ),
    make_example(
        '35 år mann. Over 2 dager utviklet han symmetrisk svakhet i begge ben som nå stiger oppover til hofter. Parestesier i hendene. Reflekser utslukket.',
        'AKUTT: Mistanke om Guillain-Barré syndrom. Akutt ascenderende polynevropati med arefleksi. Potensielt livstruende ved affeksjon av respirasjonsmuskulatur. Ring 113. Sykehus for nevrologisk vurdering, LP og spirometri. Behandling: iv immunglobulin eller plasmaferese.'
    ),
    make_example(
        '52 år kvinne. Gradvis tilkommet bilateral beinsvakhet og nummenhet fra navlen og nedover. Gangvansker siste 3 uker. Blæreproblemer startet denne uken.',
        'AKUTT: Mistanke om myelopati — thorakal medullakompresjon. Sensorisk nivå ved navlen (Th10), bilateral motorisk affeksjon og sfinkterproblemer. Bildediagnostikk: MR hele columna akutt. Hastehenvisning nevrokirurg. Kan skyldes tumor, prolaps, abscess eller vaskulær malformasjon.'
    ),
    make_example(
        '45 år mann. Progredierende svakhet i høyre hånd siste 6 uker. Nå vanskeligheter med knapper og nøkler. Også stiv gange. Hyperrefleksi bilateralt.',
        'HENVIS SAMME DAG: Cervikal myelopati — progredierende. Unilateral finmotorikktap med bilateral hyperrefleksi tyder på cervikal medullakompresjon. Bildediagnostikk: MR cervikalcolumna. Henvisning nevrokirurg. Manuell nakkebehandling kontraindisert ved myelopati.'
    ),
    make_example(
        '58 år mann. Bilateral droppfot utviklet over 1 uke. Ryggsmerter. Nedsatt sensibilitet i begge føtter og legger. Reflekser nedsatt.',
        'AKUTT: Bilateral droppfot — mulig cauda equina eller polyradikulopati. Bilateral motorisk utfall med sensorisk affeksjon over kort tid. Bildediagnostikk: MR lumbalcolumna akutt. Differensier mellom cauda equina syndrom og Guillain-Barré. Akutt nevrologisk henvisning.'
    ),
    make_example(
        '63 år kvinne. Gangvansker som har utviklet seg over 4 måneder. Brede, usikre steg. Hyperrefleksi og spastisitet i bena. Positiv Hoffmann bilateralt.',
        'HENVIS SAMME DAG: Cervikal myelopati med progredierende gangforstyrrelse. Positiv Hoffmann med hyperrefleksi og spastisitet er øvre motornevron-tegn fra cervikalt nivå. Bildediagnostikk: MR cervikalcolumna. Henvisning nevrokirurg for dekompresjonsvurdering.'
    ),
    make_example(
        '40 år mann. Akutt svakhet i venstre arm og bein over noen timer. Samtidig nakkesmerte. Blære OK. Hyperrefleksi ipsilateralt.',
        'AKUTT: Akutt myelopati — mulig cervikalt infarkt eller akutt prolaps med medullakompresjon. Akutt unilateral hemiparetisk presentasjon med hyperrefleksi. Ring 113. Akutt bildediagnostikk: MR cervikalcolumna og MR caput (utelukk intrakraniell årsak). Nevrologisk akuttvurdering.'
    ),
]

DANGEROUS_GCA = [
    make_example(
        '72 år kvinne. Ny hodepine over tinningene bilateralt siste 3 uker. Palpasjonsømme, forhårdede temporalarterier. Tyggeclaudicatio. SR 85.',
        'AKUTT: Mistanke om temporalisarteritt (kjempecellearteritt/GCA). Ny hodepine hos >50 med palpasjonsømme temporalarterier, tyggeclaudicatio og kraftig forhøyet SR. Synstrussel ved ubehandlet GCA. Akutt hastehenvisning revmatolog. Start prednisolon 40-60 mg i dag. Temporalarteribiopsi innen 14 dager.'
    ),
    make_example(
        '68 år mann. Hodepine siste 2 uker med intermittent synsforstyrrelse i venstre øye (tåkesyn som kommer og går). Tyggesmerte. SR 92, CRP 45.',
        'AKUTT: Temporalisarteritt med amaurosis fugax — synstruende. Forbigående synstap (amaurosis fugax) er forvarsel om permanent synstap ved GCA. Akutt hastehenvisning øyelege og revmatolog. Start prednisolon 60 mg umiddelbart. Ring sykehus for akutt vurdering.'
    ),
    make_example(
        '75 år kvinne med kjent polymyalgia rheumatica. Ny hodepine, hodebunnsømhet (vondt å børste håret), og tyggeclaudicatio. SR steget fra 25 til 70.',
        'AKUTT: GCA sekundært til PMR — eskalering. PMR kan utvikle seg til GCA. Ny hodepine med tyggeclaudicatio og stigende inflammasjonsmarkører. Øk prednisolondose til 40-60 mg/dag umiddelbart. Hastehenvisning revmatolog. Temporalarteribiopsi. Øyeundersøkelse akutt.'
    ),
    make_example(
        '80 år mann. Ensidig tinningshodepine med plutselig komplett synstap på høyre øye for 2 timer siden. SR 110. Palpasjonsøm temporalarterie.',
        'AKUTT: Temporalisarteritt med akutt permanernt synstap (anterior iskemisk optikusnevropati). Synstapet kan bli bilateralt uten behandling. Ring 113 / akutt sykehus. Iv metylprednisolon 1g i 3 dager, deretter oral prednisolon. Akutt øyelegevurdering. Biopsi innen 14 dager.'
    ),
    make_example(
        '70 år kvinne. Ny hodepine, utmattelse og uspesifikt sykdomsfølelse siste 4 uker. Mild tyggesmerte. Skalp-ømhet. SR 65. Ingen synssymptomer.',
        'HENVIS SAMME DAG: Mistanke om temporalisarteritt uten synssymptomer ennå. Ny hodepine hos eldre med skalp-ømhet, tyggeclaudicatio og forhøyet SR er GCA inntil motsatt bevist. Start prednisolon 40 mg i dag for å forebygge synstap. Hastehenvisning for biopsi.'
    ),
    make_example(
        '77 år mann. Bilateral tinningshodepine med feber 37.8°C. Vekttap 3 kg siste måned. Stiv og smertefull nakke/skulder om morgenen. SR 95.',
        'HENVIS SAMME DAG: Mistanke om GCA med systemiske symptomer. Hodepine, feber, vekttap og proximale smerter hos eldre med kraftig forhøyet SR. Differensier fra malignitet og infeksjon. Start prednisolon 40-60 mg. Blodprøver og hastehenvisning for temporalarteribiopsi.'
    ),
    make_example(
        '69 år kvinne. Plutselig dobbeltsyn og ensidig ptose. Hodepine siste uken. Palpasjonsøm temporalarterie. SR 78.',
        'AKUTT: GCA med okulomotorisk affeksjon. Diplopi og ptose ved GCA skyldes iskemi i ekstraokulære muskler eller nerver. Synstruende tilstand. Ring sykehus / akutt øyelege. Start prednisolon 60 mg umiddelbart. Hastehenvisning revmatolog. Biopsi.'
    ),
    make_example(
        '74 år mann. Kjevesmerter ved spising som tvinger ham til å stoppe å tygge. Hodepine over begge tinninger. Også smerter i skuldrene om morgenen. CRP 55, SR 80.',
        'HENVIS SAMME DAG: Typisk GCA med tyggeclaudicatio og PMR-komponent. Kjeveclaudicatio er et av de mest spesifikke symptomene for GCA. Proximale smerter tyder på overlappende PMR. Start prednisolon 40-60 mg. Hastehenvisning for temporalarteribiopsi innen 14 dager.'
    ),
    make_example(
        '78 år kvinne med diabetes. Ny ensidig hodepine og tåkesyn. Hodebunnsømhet. Blodprøver: SR 72, CRP 40, glukose forhøyet.',
        'AKUTT: Mistanke om GCA med visuell involvering. Synsforstyrrelser ved GCA krever akutt behandling. Diabetes kompliserer steroidbehandling men endrer ikke hastegrad. Start prednisolon 60 mg umiddelbart med tett glukoseovervåkning. Akutt øyelegevurdering og hastehenvisning revmatolog.'
    ),
    make_example(
        '71 år mann. Intermittent tungsynthet i høyre øye over 3 dager. Mild hodepine. Ingen tyggeclaudicatio men ømhet over temporalarterien. SR 58.',
        'AKUTT: Mistanke om GCA med tidlige visuelle symptomer. Intermittent synstap (amaurosis fugax) kan raskt progrediere til permanent blindhet. Selv moderat forhøyet SR (>50) hos eldre med visuelle symptomer krever akutt tiltak. Start prednisolon 60 mg. Akutt øyelege og revmatolog.'
    ),
]


def get_dangerous_examples():
    """Return all Category 2 DANGEROUS examples."""
    return (
        DANGEROUS_CAUDA_EQUINA
        + DANGEROUS_CANCER
        + DANGEROUS_INFECTION
        + DANGEROUS_FRACTURE
        + DANGEROUS_VASCULAR
        + DANGEROUS_NEURO
        + DANGEROUS_GCA
    )


# ============================================================
# CATEGORY 3: EDGE CASES — BORDERLINE PRESENTATIONS (100)
# ============================================================

EDGE_DISC_VS_CAUDA = [
    make_example(
        '45 år mann. Unilateral isjiassmerte venstre ben ned til foten. SLR positiv 30 grader. Kraft nedsatt for dorsalfleksjon venstre fot (4/5). Normal blærefunksjon, normal perineal sensibilitet.',
        'HENVIS SAMME DAG: L5-radikulopati med motorisk utfall — IKKE cauda equina. Unilateral smerte med ensidig motorisk utfall (4/5) men bevart blærefunksjon og perineal sensibilitet. Klinisk skille: unilateral + intakt sfinkter = radikulopati. MR lumbalcolumna. Revurder umiddelbart ved blæresymptomer.'
    ),
    make_example(
        '50 år kvinne. Bilateral isjiassmerte som startet unilateralt for 5 dager siden. Nå nummenhet i begge bein. Blærefunksjon: «usikker, kanskje litt annerledes». Perineal sensibilitet intakt.',
        'AKUTT: Mulig tidlig cauda equina — bilateral progresjon med usikker blære. Unilateral-til-bilateral progresjon med mulig blæreaffeksjon krever umiddelbar utredning selv med intakt perineal sensibilitet. Akutt MR lumbalcolumna. Henvis nevrokirurg. Lavterskel for innleggelse.'
    ),
    make_example(
        '38 år mann med stor L4-L5 prolaps. Intens unilateral beinsmerte, SLR positiv 20 grader. Kraft 3/5 dorsalfleksjon. Kan kontrollere urin. Perineal sensibilitet normal.',
        'HENVIS SAMME DAG: Alvorlig unilateral radikulopati med uttalt motorisk utfall — ikke cauda equina. Selv med alvorlig kraft-nedsettelse (3/5) er ensidig presentasjon med intakt blære og perineum radikulopati, ikke CES. MR akutt. Nevrokirurgisk vurdering pga uttalt motorisk utfall.'
    ),
    make_example(
        '55 år kvinne. Korsryggsmerte med bilateral beinsmerte. Nummenhet i venstre mediale lår, men perineum føles normalt. Tisser normalt. Reflekser symmetrisk nedsatt.',
        'MONITORÉR: Bilateral radikulopati, men IKKE cauda equina (ennå). Bilateral smerte med medial lårparestesi men bevart perineal sensibilitet og blærefunksjon. Grensetilfelle som krever tett oppfølging. MR lumbalcolumna innen 48 timer. Instruer om CES-symptomer å varsle om.'
    ),
    make_example(
        '43 år mann. Unilateral isjiassmerte høyre side. Normal nevrologisk undersøkelse unntatt redusert akillesrefleks høyre. Kan stå på tå. Blære OK.',
        'TRYGT: S1-radikulopati med isolert refleksnedsettelse — ikke cauda equina. Ensidig refleksnedsettelse uten motorisk eller sfinkterutfall er vanlig ved diskushernie. Konservativ behandling med monitorering. Henvis for MR dersom ingen bedring etter 6 uker.'
    ),
    make_example(
        '48 år kvinne. Bilateral isjiassmerte over 2 uker. Bilateral SLR positiv. Nå startet med obstipasjon og føler seg «litt nummen» i setet.',
        'AKUTT: Mulig cauda equina syndrom — bilateral isjiassmerte med begynnende sadelanestesi og tarmaffeksjon. Obstipasjon kan være tidlig sphincteraffeksjon. Bilateral SLR positivitet med endret perineal sensibilitet. Akutt MR lumbalcolumna. Henvis nevrokirurg samme dag.'
    ),
    make_example(
        '52 år mann. Ensidig beinsmerte L5-distribusjon med droppfot (kraft 1/5). Ingen blæresymptomer, normal perineal sensibilitet. Smertene er intense.',
        'HENVIS SAMME DAG: Akutt L5-radikulopati med uttalt droppfot — ikke cauda equina men krever akutt vurdering. Ensidig droppfot med kraft 1/5 kan bli irreversibelt uten dekompresjon. Akutt MR og nevrokirurgisk henvisning for operasjonsvurdering innen 48 timer.'
    ),
    make_example(
        '60 år kvinne. Bilateral korsryggsmerte med moderat bilateral beinsmerte til leggene. Normal kraft, normal sensibilitet, normale reflekser. Blære og tarm normal.',
        'TRYGT: Bilateral referert smerte uten nevrologisk utfall — ikke cauda equina. Bilateral smerte alene uten nevrologiske funn er vanlig ved sentral stenose eller bilateral facettirritasjon. Normal nevrologisk undersøkelse er beroligende. Konservativ behandling med monitorering.'
    ),
    make_example(
        '35 år mann. Akutt korsryggsmerte med venstressidig isjiassmerte. Nummenhet i laterale fot. Midlertidig ikke klart å tisse på sykehuset men deretter normal miktjon.',
        'MONITORÉR: Unilateral radikulopati med forbigående blærehesitasjon — sannsynlig psykogent/smerterelatert, men CES kan ikke utelukkes helt. Forbigående urinretensjon ved akutt ryggsmerte kan være smerteindusert. MR lumbalcolumna bør utføres. Tett monitorering av blærefunksjon neste 24 timer.'
    ),
    make_example(
        '47 år kvinne. Bilateral beinsmerte ved gange som tvinger henne til å stoppe, lindres ved å sette seg ned. Ingen smerte i hvile. Normal nevrologisk undersøkelse i liggende.',
        'HENVIS RUTINE: Nevrogen claudicatio ved lumbal spinalkanalstenose — ikke cauda equina. Pseudoclaudicatio (gangavhengig bilateral beinsmerte med hvilelinring) er typisk stenose. Normal hvileundersøkelse differensierer fra CES. MR lumbalcolumna. Stenosen kan behandles konservativt eller kirurgisk.'
    ),
    make_example(
        '42 år mann med kjent stor sentral prolaps. Merker at han må presse mer for å starte vannlating siste 2 dager. Ingen nummenhet i perineum. Unilateral isjiassmerte.',
        'AKUTT: Mulig tidlig cauda equina — blærehesitasjon ved kjent stor sentral prolaps. Endret blærefunksjon hos pasient med kjent sentral prolaps krever akutt MR selv med intakt perineal sensibilitet. Ikke vent på full sadelanestesi. Akutt nevrokirurgisk vurdering.'
    ),
    make_example(
        '56 år kvinne. Bilateral beinsvakhet etter langvarig epidural steroidinjeksjon. Nummenhet i sete. Blærefunksjon usikker (kateter in situ).',
        'AKUTT: Mulig iatrogen cauda equina syndrom etter epidural injeksjon — kan skyldes epiduralt hematom. Nytilkommet bilateral svakhet og sadelanestesi etter prosedyre. Kateter maskerer blærefunksjon. Akutt MR lumbalcolumna. Nevrokirurgisk hastehenvisning for mulig evakuering.'
    ),
    make_example(
        '50 år mann. Bilateral isjiassmerte med vekslende intensitet over 3 måneder. Blæren OK. Perineum OK. Kraft og sensibilitet normal. Reflekser symmetrisk nedsatt.',
        'MONITORÉR: Bilateral isjiassmerte uten nevrologiske utfall — sannsynlig sentral stenose, ikke CES. Kronisk bilateral symptompresentasjon uten sfinkter- eller sadelanestesi. Symmetrisk refleksnedsettelse kan være aldersbetinget eller stenose. MR lumbalcolumna planlagt. Instruer om alarmsymptomer.'
    ),
    make_example(
        '44 år kvinne. Unilateral intens S1-radikulopati med kraft 4/5 plantarfleksjon. Nedsatt akillesrefleks. Nummenhet laterale fot. Normal blærekontroll.',
        'HENVIS SAMME DAG: Moderat S1-radikulopati med motorisk utfall — ikke cauda equina. Unilateral presentasjon med bevart blærekontroll. Motorisk utfall (4/5) indikerer stor prolaps. MR lumbalcolumna. Henvis nevrokirurg ved manglende bedring 6-8 uker eller progresjon av svakhet.'
    ),
    make_example(
        '58 år mann. Progressiv bilateral beinsvakhet over 10 dager. Gangvansker. Blæren: økt frekvens men kan kontrollere. Perianal sensibilitet: «litt nedsatt bilateralt».',
        'AKUTT: Sannsynlig cauda equina syndrom — progredierende bilateral motorisk affeksjon med begynnende sfinkter- og sensorisk involvering. Progressiv bilateral svakhet med endret blære og mulig sadelanestesi. Akutt MR lumbalcolumna. Nevrokirurgisk hastehenvisning. Ring 113.'
    ),
    make_example(
        '37 år mann. Plutselig bilateral beinsmerte etter tungt løft. Uttalt smerte men kan gå. Tisser normalt, perineum intakt. Bilateral SLR positiv.',
        'MONITORÉR: Akutt bilateral radikulopati etter prolaps — grenseland CES. Bilateral presentasjon uten sfinkteraffeksjon nå. Bilateral SLR positivitet tyder på stor sentral prolaps. Akutt MR lumbalcolumna. Tett monitorering av blære og perineal sensibilitet hver 2. time.'
    ),
    make_example(
        '62 år kvinne med spinalkanalstenose. Akutt forverring med bilateral beinsmerte og gangvansker. Tisser oftere men ingen inkontinens. Perineum normalt.',
        'HENVIS SAMME DAG: Akutt forverring av spinalkanalstenose — klinisk grenseland CES. Akutt symptomsforverring ved kjent stenose med økt urinfrekvens men bevart kontinens og perineal sensibilitet. MR lumbalcolumna akutt. Nevrologisk revurdering i løpet av dagen. Henvis nevrokirurg.'
    ),
    make_example(
        '40 år mann. Akutt massiv sentral prolaps på MR (tatt for unilateral isjiassmerte). Nå i ventestilling for kirurgi. Foreløpig normal blære og perineum.',
        'MONITORÉR: Stor sentral prolaps med risiko for cauda equina — pre-symptomatisk. MR-verifisert stor sentral prolaps uten CES-symptomer ennå. Prioritert kirurgisk vurdering. Instruer pasient og pårørende om alarmsymptomer (blære, nummenhet sete, bilateral svakhet). Ring umiddelbart ved endring.'
    ),
    make_example(
        '53 år kvinne. Bilateral beinsmerte med nummenhet i begge føtter. Reflekser borte bilateralt. Blæren OK. Perineum OK. Diabetiker.',
        'MONITORÉR: Bilateral nevropati — differensier mellom diabetisk polynevropati og cauda equina. Arefleksi med bilateral parestesier hos diabetiker kan være perifer nevropati, ikke CES. Blære og perineum intakt er beroligende. MR lumbalcolumna og NCV/EMG for å differensiere. Blodprøver: HbA1c.'
    ),
    make_example(
        '48 år mann. Akutt korsryggsmerte med bilateral isjiassmerte. Kan ikke finne en komfortabel stilling. Gråter av smerte. Blæren: «har ikke prøvd å tisse pga smerte».',
        'AKUTT: Alvorlig bilateral radikulopati — CES kan ikke utelukkes. Bilateral isjiassmerte med ukjent blærestatus er CES inntil motsatt bevist. Smerte som hindrer miktjon kan maskere retensjon. Blærescanning umiddelbart. Akutt MR lumbalcolumna. Henvis nevrokirurg. Lavterskel for 113.'
    ),
]

EDGE_HEADACHE_VS_SAH = [
    make_example(
        '35 år kvinne. Plutselig intens hodepine under trening, nådde maks intensitet innen 1 minutt. Nakkestivhet. Kvalme. Ingen fokale nevrologiske utfall.',
        'AKUTT: Thunderclap-hodepine — utelukk subaraknoidalblødning (SAH). Hodepine som når maks intensitet innen sekunder til minutter er SAH inntil motsatt bevist, uavhengig av fravær av fokale utfall. Ring 113. CT caput akutt. LP dersom CT negativ men klinisk mistanke vedvarer.'
    ),
    make_example(
        '42 år mann. Hodepine som startet gradvis over 2 timer og er nå bilateral, trykkende. Stresset med jobb. Ingen kvalme, ingen nakkestivhet, ingen synsforstyrrelser.',
        'TRYGT: Spenningshodepine. Gradvis debut over timer (ikke sekunder) med bilateral trykkende karakter uten meningisme eller nevrologiske tegn. Stressrelatert kontekst. Distinkt fra SAH som har perakutt debut. Stresshåndtering og eventuelt analgetikk.'
    ),
    make_example(
        '55 år kvinne. Akutt hodepine som startet brått mens hun var på toalettet (Valsalva). Intensitet 8/10. Mild nakkestivhet. Ingen nevrologiske utfall.',
        'AKUTT: Thunderclap-hodepine med mulig SAH — Valsalva-utløst. Brått innsettende hodepine under anstrengelse/Valsalva med nakkestivhet. Ring 113. CT caput akutt. Valsalva kan utløse aneurysmruptur. Også vurder reversibelt cerebralt vasokonstriksjonssyndrom (RCVS).'
    ),
    make_example(
        '48 år mann. Hodepine siste 3 dager, gradvis tiltagende. Verst om morgenen. Kvalme. Noe nakkestivhet. Forhøyet blodtrykk 170/100.',
        'HENVIS SAMME DAG: Progredierende hodepine med morgenmaksimum og hypertensjon — utelukk intrakraniell patologi. Gradvis debut gjør SAH mindre sannsynlig, men morgenhodepine med kvalme og hypertensjon kan indikere forhøyet intrakranielt trykk. CT caput. Blodtrykkskontroll. Nevrolog-vurdering.'
    ),
    make_example(
        '30 år kvinne med kjent migrene. Denne hodepinen kom «som lyn fra klar himmel» — annerledes enn vanlig migrene. Maks intensitet innen 30 sekunder.',
        'AKUTT: Thunderclap-hodepine hos migrene-pasient — utelukk SAH. Pasientens egen vurdering av at hodepinen er annerledes enn vanlig er klinisk viktig. Perakutt debut skiller fra migrene. Ring 113. CT caput. Migrene er eksklusjonsdiagnose ved ny type hodepine med perakutt start.'
    ),
    make_example(
        '60 år mann. Hodepine som startet gradvis for 5 timer siden. Bilateral, moderat intensitet. Reagerer på ibuprofen. Ingen nakkestivhet. Normalt BT.',
        'TRYGT: Spenningshodepine. Gradvis debut, moderat intensitet, bilateral, responderer på NSAID og fravær av meningismustegn. Svært lav sannsynlighet for SAH ved denne presentasjonen. Monitorér ved manglende bedring over 24-48 timer.'
    ),
    make_example(
        '44 år kvinne. Hodepine som startet akutt for 6 timer siden under seksuell aktivitet. Intensitet 9/10, oksipital. Noe nakkestivhet. Nå avtagende.',
        'AKUTT: Koital thunderclap-hodepine — utelukk SAH. Seksuell aktivitet er kjent utløser for SAH (Valsalva, blodtrykksøkning). Selv om smerten nå avtar, er akutt utredning nødvendig. CT caput (sensitivitet faller med tid). LP dersom CT negativ. Differensialdiagnose: RCVS, benign orgasmehodepine.'
    ),
    make_example(
        '38 år mann. Hodepine frontalt som har vart i 2 uker. Konstant, mild intensitet. Lettere tett i nesen. Ingen feber. Forverres ved foroverlenig.',
        'TRYGT: Sinusrelatert hodepine. Frontal lokalisasjon med nasale symptomer, forverring ved foroverlenig og ingen systemiske tegn. Kronisk sinusitt/bihulebetennelse. Nasal skylling, avsvellende og eventuelt antibiotika ved bakteriell infeksjon. Distinkt fra SAH (gradvis, mild, forutsigbar).'
    ),
    make_example(
        '52 år kvinne. Plutselig «pop» i hodet etterfulgt av intens hodepine og oppkast. Nå døsig men vekbar. Nakkestiv.',
        'AKUTT: Høy sannsynlighet for SAH. Plutselig «pop» med intenst hodepine, oppkast og bevissthetspåvirkning med meningisme. Ring 113 umiddelbart. CT caput akutt — høy sensitivitet innen 6 timer. Nevrokirurgisk beredskap for aneurysmesikring.'
    ),
    make_example(
        '28 år mann, spente muskler. Bilateral oksipital hodepine som stråler oppover. Palpasjonsøm suboksipitalt. Forverres sent på dagen. Ingen morgenhodepine.',
        'TRYGT: Cervikogen/spenningshodepine. Oksipital hodepine med suboksipital muskelømhet og ettermiddagsforverring er cervikogent betinget. Fravær av morgenhodepine og akutt debut utelukker intrakraniell patologi. Manuell behandling av cervikalcolumna og triggerpunkter.'
    ),
    make_example(
        '65 år mann. Hodepine som startet plutselig for 2 timer siden under hagearbeid. Intensitet 10/10. «Verste hodepine i mitt liv.» Ikke-responderende på paracetamol.',
        'AKUTT: «Verste hodepine i mitt liv» — sentinel hodepine for SAH. Denne klassiske beskrivelsen med perakutt debut under anstrengelse er SAH inntil motsatt bevist. Ring 113. CT caput umiddelbart. LP ved negativ CT. Manglende respons på analgetikk styrker mistanken.'
    ),
    make_example(
        '40 år kvinne. Hodepine startet gradvis, nå bilateral trykkende. Stresset, dårlig søvn. Kjenner tightness i nakken. Ingen kvalme, ingen synsforstyrrelser, normal BT.',
        'TRYGT: Spenningshodepine med cervikalt bidrag. Typisk kontekst (stress, søvnmangel), gradvis debut, bilateral trykkende karakter med nakkemuskelkomponent. Ingen alarmsymptomer. Søvnhygiene, stresshåndtering og cervikal behandling.'
    ),
    make_example(
        '58 år mann. Akutt hodepine som startet under løfting. Kort bevissthetstap. Nå våken men forvirret. Oppkast 2 ganger.',
        'AKUTT: Thunderclap-hodepine med synkope — SAH eller annen intrakraniell blødning. Bevissthetstap og konfusjon med akutt hodepine er alvorlige tegn. Ring 113 umiddelbart. CT caput akutt. Nevrokirurgisk beredskap. Kan også vurdere cerebralt aneurysme uten ruptur.'
    ),
    make_example(
        '33 år kvinne med migrene med aura. Vanlig aurapresentasjon (flimmer, deretter hodepine) som startet for 1 time siden. Følger vanlig mønster.',
        'TRYGT: Migrene med aura — kjent mønster. Pasientens gjenkjenning av sitt vanlige auramønster er viktig. Typisk temporell progresjon (aura 20-60 min, deretter hodepine) skiller fra SAH (perakutt). Behandle med vanlig migrenemedisin. Henvis kun ved atypisk forløp.'
    ),
    make_example(
        '70 år mann. Akutt hodepine med synsforstyrrelser og kvalme. Samtidig korsryggsmerte. Fant liggende på gulvet, ukjent om han besvimte.',
        'AKUTT: Akutt hodepine med mulig bevissthetstap — utelukk SAH og intrakraniell blødning. Eldre mann med akutt hodepine, synsforstyrrelser og mulig synkope. Ring 113. CT caput akutt. Også vurder posterior fossa-blødning (cerebellær) som kan gi korsryggsmerte via meningeal irritasjon.'
    ),
]

EDGE_CHEST_PAIN = [
    make_example(
        '55 år mann, røyker, diabetes. Venstre brystsmerte som stråler til venstre arm. Startet under trapping. Klam og svett. Smerten lindres IKKE ved palpasjon.',
        'AKUTT: Mistanke om akutt koronarsyndrom. Anstrengelsesutløst brystsmerte med armsmerte, kaldsvette og risikofaktorer (røyking, diabetes, alder, mann). Ikke palpasjonsreprodusertbar. Ring 113 umiddelbart. EKG og troponin akutt. Gi aspirin 300 mg dersom tilgjengelig.'
    ),
    make_example(
        '32 år kvinne, treningsaktiv. Venstre brystsmerte som er skarp og forverres ved dyp innpust. Reproduserbar ved palpasjon over 3. ribbe. Ingen dyspné. Ingen risikofaktorer.',
        'TRYGT: Costochondritt. Ung kvinne uten risikofaktorer med palpasjonsreprodusertbar, respirasjonsavhengig brystsmerte. Lav risiko for kardial årsak. NSAID og beroligelse. Skarp, lokalisert, bevegelsesavhengig smerte er muskuloskelealt.'
    ),
    make_example(
        '62 år mann med hypertensjon. Brystsmerte som presser/klemmer midt i brystet. Startet i hvile. Utstråling til kjeven. Dyspné. Ikke palpasjonsøm.',
        'AKUTT: Mistanke om akutt koronarsyndrom/hjerteinfarkt. Trykkende/klemmende midtsternal smerte med kjeveutstråling, dyspné og risikofaktorer. Hvile-angina er alvorligere enn anstrengelsesutløst. Ring 113. EKG og troponin. Aspirin 300 mg. Nitroglyserin ved tilgjengelighet.'
    ),
    make_example(
        '45 år kvinne. Brystsmerte venstre side som varer i flere timer. Forverres ved å snu seg i sengen og puste dypt. Palpasjonsøm costovertebralt. Ingen kaldsvette.',
        'TRYGT: Costovertebral leddsdysfunksjon. Langvarig smerte forverret av bevegelse og respirasjon med palpasjonsfunn over costovertebral overgang. Fravær av kardiale symptomer (kaldsvette, dyspné). Thorakal mobilisering og NSAID.'
    ),
    make_example(
        '50 år mann, familiehistorie med hjertesykdom. Episodisk brystsmerte siste 2 uker, noen ganger ved trapper, noen ganger i hvile. Pressfølelse. Ingen palpasjonsømhet.',
        'HENVIS SAMME DAG: Ustabil angina pectoris inntil motsatt bevist. Episodisk brystsmerte med presskarakter, dels anstrengelsesutløst, hos mann med familiehistorie. Ikke palpasjonsreprodusertbar. Akutt EKG og troponin. Henvis fastlege/legevakt for kardiologisk vurdering i dag.'
    ),
    make_example(
        '28 år mann. Skarp brystsmerte venstre side som forverres ved innpust. Startet etter CrossFit-konkurranse med mange push-ups. Palpasjonsøm pectoralis major. Normalt EKG.',
        'TRYGT: Muskulær brystsmerte/pectoralis-strekkskade. Klar treningsrelatert årsak med palpasjonsreprodusertbar ømhet i pectoralis og normalt EKG. Lav risiko for kardial hendelse hos ung mann uten risikofaktorer. NSAID, is og gradvis tilbakegang.'
    ),
    make_example(
        '58 år kvinne med diabetes og hypertensjon. Diffust brystubehag med kvalme og fatigue. Ingen klassisk brystsmerte. Noe dyspné. Kald og klam.',
        'AKUTT: Atypisk presentasjon av mulig akutt koronarsyndrom. Kvinner og diabetikere kan ha «stille» MI med atypiske symptomer (kvalme, fatigue, dyspné). Kaldsvette og risikofaktorer. Ring 113. EKG og troponin akutt. Lavterskel for innleggelse.'
    ),
    make_example(
        '35 år mann med angst. Brystsmerte, hjertebank, prikking i fingrene, svimmelhet. Rask pust. Palpasjonsømhet over brystet. Symptomene varierer.',
        'MONITORÉR: Sannsynlig panikkangst med hyperventilasjon. Brystsmerte med parestesier i fingre, svimmelhet og takypné hos ung mann med kjent angst tyder på hyperventilasjon. Palpasjonsømhet fra muskelspasme. Pustøvelser. Vurder EKG ved første episode for å berolige.'
    ),
    make_example(
        '67 år mann. Brennende brystsmerte retrosternalt etter stort måltid. Forverres ved å ligge ned. Lindres av antacida. Ingen dyspné, ingen armsmerte.',
        'TRYGT: Gastroøsofageal reflukssykdom (GØRS). Retrosternal brenning etter måltid med nocturnal forverring og antacidarespons er typisk reflux. Fravær av kardiale tegn. Livsstilsråd og PPI-behandling. Monitorér; ved atypisk forløp vurder kardial utredning.'
    ),
    make_example(
        '48 år mann, kontorarbeider med kjent thorakal facettleddsdysfunksjon. Nå brystsmerte som stråler fremover, men ikke utløst av aktivitet som vanlig. Noe anstrengt pust. Svett.',
        'HENVIS SAMME DAG: Atypisk brystsmerte hos pasient med kjent muskuloskeletal problematik — ny presentasjon krever kardial utelukkelse. Endring fra vanlig mønster (ikke belastningsutløst, med dyspné og svette) hos mann >45 med ny symptomatologi. EKG og troponin i dag. Ikke anta muskuloskeletal årsak.'
    ),
    make_example(
        '72 år kvinne. Akutt brystsmerte med dyspné. Nylig hoftekirurgi. SpO2 91%. Sinustakykardi.',
        'AKUTT: Mistanke om lungeemboli. Akutt brystsmerte med dyspné, hypoksi og takykardi etter kirurgi (immobilisering). Ring 113. CT pulmonal angiografi akutt. Oksygentilskudd. Lavmolekylært heparin ved sterk mistanke.'
    ),
    make_example(
        '40 år kvinne. Brystsmerte i venstre bryst som øker premenstruelt. Palpasjonsøm i brystkjertelvevet. Ingen retrosternal smerte, ingen dyspné.',
        'TRYGT: Syklisk mastalgi — ikke kardial. Premenstruell brystømhet med palpasjonsømhet i kjertelvev er hormonelt betinget. Lokalisasjon i brystet (ikke retrosternalt) og syklisk mønster differensierer fra kardial smerte. Bekreft med sykehistorie og berolige.'
    ),
    make_example(
        '55 år mann. Brystsmerte som er verst ved rotasjon av overkroppen og dyp innpust. Samtidig kjenner han «hjertebank» som varer noen sekunder om gangen. Ingen EKG tatt.',
        'MONITORÉR: Sannsynlig muskuloskeletal brystsmerte med palpitasjoner. Bevegelsesavhengig og respirasjonsavhengig smerte er typisk muskuloskeletal. Palpitasjoner kan være angstrelatert eller benigne ekstrasytoler. EKG bør tas for å dokumentere rytmen. Henvis fastlege for EKG og eventuelt Holter ved persisterende palpitasjoner.'
    ),
    make_example(
        '60 år kvinne, røyker. Brystsmerte som startet i hvile, pressfølelse midt i brystet, utstråling mellom skulderbladene. Kvalme. Blek.',
        'AKUTT: Mistanke om akutt koronarsyndrom eller aortadisseksjon. Hvile-onset pressfølelse med interskapulær utstråling hos røyker. Aortadisseksjon gir klassisk interskapulær smerte. Ring 113 umiddelbart. CT angiografi og EKG/troponin akutt. Differensier mellom AKS og disseksjon.'
    ),
    make_example(
        '25 år mann, høy og slank. Plutselig skarp brystsmerte og dyspné. Reduserte pustelyder venstre side. Ingen traume.',
        'AKUTT: Mistanke om spontanpneumothorax. Typisk profil (ung, høy, slank mann) med akutt brystsmerte, dyspné og asymmetriske pustelyder. Ring 113. Røntgen thorax akutt. Ved stor pneumothorax: nåledekompresjon eller thoraxdren.'
    ),
]

EDGE_INFLAMMATORY_VS_MECHANICAL = [
    make_example(
        '25 år mann. Korsryggsmerte siste 8 måneder. Morgenstivhet over 1 time daglig. Smerte som er bedre med aktivitet, verre med hvile. Familiehistorie med psoriasis.',
        'HENVIS RUTINE: Mistanke om inflammatorisk ryggsmerte — mulig aksial spondyloartritt. Alder <40, symptomvarighet >3 mnd, morgenstivhet >45 min, bedring med aktivitet og familiær disposisjon (psoriasis). Blodprøver: SR, CRP, HLA-B27. MR SI-ledd. Henvis revmatolog.'
    ),
    make_example(
        '45 år kvinne. Korsryggsmerte siste 3 uker. Morgenstivhet 15 minutter. Verst etter hagearbeid, bedre med hvile. Ingen familiehistorie med inflammatorisk sykdom.',
        'TRYGT: Mekanisk korsryggsmerte. Kort morgenstivhet (<30 min), forverring ved aktivitet og bedring ved hvile er mekaniske kjennetegn. Kort varighet (3 uker) og klar mekanisk årsak (hagearbeid). Fravær av inflammatoriske risikofaktorer. Manuell behandling indisert.'
    ),
    make_example(
        '22 år mann. Korsryggsmerte i over 1 år som startet snikende. Uttalt morgenstivhet (90 min). Smerten vekker ham om natten. Bedre ved aktivitet. HLA-B27 positiv.',
        'HENVIS SAMME DAG: Sannsynlig ankyloserende spondylitt (Bekhterevs sykdom). Alder <40, snikende debut, morgenstivhet >60 min, nattlige smerter med aktivitetslindring og HLA-B27 positiv. Oppfyller inflammatorisk ryggsmerte-kriterier. Henvis revmatolog for MR SI-ledd og behandlingsstart (NSAID, eventuelt biologisk).'
    ),
    make_example(
        '50 år mann. Korsryggsmerte forverret etter lang biltur. Morgenstivhet 10 minutter. Verre mot slutten av dagen. Bedre med hvile og ispose.',
        'TRYGT: Mekanisk korsryggsmerte. Belastningsrelatert forverring, kort morgenstivhet, ettermiddags-/kveldsforverring og lindring ved hvile/is er typisk mekanisk mønster. Kiropraktisk behandling med ergonomisk rådgivning.'
    ),
    make_example(
        '28 år kvinne. Vekslende setesmerter (venstre, så høyre) siste 6 måneder. Morgenstivhet 45 minutter. Iritis (øyebetennelse) for 2 år siden.',
        'HENVIS RUTINE: Mistanke om aksial spondyloartritt. Alternerende setesmerte (SI-ledd) med morgenstivhet >45 min og tidligere iritis (ekstraartikulær manifestasjon av spondyloartritt). Blodprøver: CRP, SR, HLA-B27. MR SI-ledd. Revmatologisk henvisning.'
    ),
    make_example(
        '55 år mann. Korsryggsmerte i 2 måneder. Gradvis start. Litt stiv om morgenen (20 min). Verst ved løfting og bøying. Degenrative forandringer på tidligere røntgen.',
        'TRYGT: Degenerativ mekanisk korsryggsmerte. Moderat morgenstivhet (20 min) hos 55-åring med kjente degenerative forandringer og belastningsrelatert smerte er mekanisk. Inflammatorisk ryggsmerte er uvanlig debutalder >45 år. Konservativ behandling.'
    ),
    make_example(
        '30 år mann. Rygg- og setesmerter i 4 måneder. Våkner kl 4 om natten av smerte. Må stå opp og gå for å lindre. Morgenstivhet 75 minutter. NSAID hjelper godt.',
        'HENVIS RUTINE: Sterk mistanke om inflammatorisk ryggsmerte. Alle inflammatoriske kriterier oppfylt: alder <40, varighet >3 mnd, snikende debut, nattsmerte i andre halvdel, bedring ved bevegelse, morgenstivhet >60 min, NSAID-respons. Blodprøver og MR SI-ledd. Revmatolog-henvisning.'
    ),
    make_example(
        '60 år kvinne. Korsryggsmerte siste 10 år, gradvis forverret. Røntgen viser uttalte degenerative forandringer. Morgenstivhet 20-30 min. Verst etter aktivitet.',
        'TRYGT: Langvarig degenerativ mekanisk ryggsmerte. 10 års varighet med degenerative røntgenfunn, moderat morgenstivhet og aktivitetsforverring hos 60-åring er klassisk degenerativ årsak. Vedlikeholdsbehandling, trening og livsstilsmodifikasjon.'
    ),
    make_example(
        '26 år mann. Korsryggsmerte siste 5 måneder. Morgenstivhet varierer 30-50 min. Noen dager bedre enn andre. Usikker om aktivitet hjelper eller forverrer. Ingen ekstraartikulære symptomer.',
        'MONITORÉR: Uavklart ryggsmerte — grensetilfelle mellom mekanisk og inflammatorisk. Varierende morgenstivhet rundt 45-minuttersgrensen og usikkert aktivitetsmønster. Alder og varighet passer inflammatorisk, men mangler typisk mønster. Blodprøver (CRP, HLA-B27) som screening. Re-evaluér etter 4 uker.'
    ),
    make_example(
        '35 år kvinne. Korsryggsmerte og knesmerter med hevelse i høyre kne. Morgensstivhet kne 60 min. Ryggstivhet 40 min. Nylig hatt tarmbetennelse.',
        'HENVIS RUTINE: Mistanke om reaktiv artritt/spondyloartritt. Perifer artritt (kne) med aksiale symptomer og nylig enteritt (tarmbetennelse) er klassisk reaktiv artritt. Blodprøver: CRP, SR, HLA-B27. MR SI-ledd. Revmatologisk henvisning for helhetlig vurdering.'
    ),
    make_example(
        '68 år mann. Korsrygg- og bilaterale lårsmerte. Uttalt morgenstivhet 90 minutter. Også skulder- og nakkestivhet om morgenen. SR 55. Alder taler mot AS.',
        'HENVIS SAMME DAG: Mistanke om polymyalgia rheumatica (PMR). Bilateral proksimal smerte (skulder, hofte, nakke) med uttalt morgenstivhet og forhøyet SR hos pasient >60 år. PMR, ikke AS. Blodprøver: SR, CRP. Diagnostisk test: prednisolon 15 mg — dramatisk respons bekrefter PMR. Revmatolog.'
    ),
    make_example(
        '40 år kvinne. Korsryggsmerte med 25 minutters morgenstivhet. Løper 3 ganger i uken. Smerte etter løping, bedre med hvile. Ingen nattesmerte.',
        'TRYGT: Mekanisk/belastningsrelatert korsryggsmerte hos aktiv løper. Morgenstivhet <30 min, forverring etter aktivitet (ikke før/under), bedring ved hvile og fravær av nattesmerter er mekanisk. Vurder løpeteknikk, sko og belastningsstyring.'
    ),
    make_example(
        '19 år mann. Kjent Crohns sykdom. Nå ny korsryggsmerte siste 3 måneder med uttalt morgenstivhet (60 min). Forverres om natten.',
        'HENVIS RUTINE: Aksial spondyloartritt assosiert med inflammatorisk tarmsykdom. Crohns sykdom er kjent assosiert med spondyloartritt. Ny ryggsmerte med inflammatorisk mønster hos IBD-pasient. MR SI-ledd og blodprøver (CRP, HLA-B27). Koordiner med gastroenterolog og revmatolog.'
    ),
    make_example(
        '52 år mann. Korsryggsmerte siste 2 uker etter å ha gravd i hagen. Morgenstivhet 10-15 min. Lindres med varme og bevegelse. Ingen nattesmerter.',
        'TRYGT: Akutt mekanisk korsryggsmerte med klar utløsende årsak. Kort varighet, kort morgenstivhet, identifiserbar belastning og fravær av nattesmerter utelukker inflammatorisk årsak. Varmelindring er typisk mekanisk. Aktiv tilnærming med manuell behandling.'
    ),
    make_example(
        '33 år kvinne med psoriasis i hodebunn og negler. Ny korsryggsmerte siste 4 måneder. Morgenstivhet 50 min. Også smerter i hælene (akillodynie bilateralt).',
        'HENVIS RUTINE: Mistanke om psoriasisartritt med aksial involvering. Kjent psoriasis med ny inflammatorisk ryggsmerte og entesopatier (akillodynie). Oppfyller CASPAR-kriterier. Blodprøver: CRP, SR, HLA-B27. MR SI-ledd. Revmatologisk henvisning for DMARD-vurdering.'
    ),
]

EDGE_VERTIGO = [
    make_example(
        '58 år mann. Akutt svimmelhet med kvalme. Nystagmus som slår i én retning (horisontalt mot venstre). Positiv hodeimpulstest til høyre. Ingen skew deviation.',
        'TRYGT: Perifer vestibulær årsak — sannsynlig vestibulær nevritt. HINTS-undersøkelse tyder på perifer årsak: uniretninell nystagmus, positiv hodeimpulstest (korrigerende sakkade) og ingen skew deviation. Perifer vestibulær nevritt. Symptomatisk behandling og vestibulær rehabilitering.'
    ),
    make_example(
        '65 år kvinne. Svimmelhet med kvalme og oppkast. Nystagmus som skifter retning ved blikk til ulike sider. Negativ hodeimpulstest. Skew deviation tilstede.',
        'AKUTT: Sentral vertigo — HINTS-undersøkelse peker mot sentralt (hjernestamme/cerebellum). Retningsforanderlig nystagmus, negativ HIT og skew deviation er sentral-triade. Mistanke om vertebrobasilær slag. Ring 113. MR hjerne akutt. Nevrologisk vurdering.'
    ),
    make_example(
        '50 år mann. Svimmelhet i 2 dager, konstant med forverring ved hodebevegelser. Unidireksjonell nystagmus. Ingen hørselstap. Kan gå med støtte.',
        'MONITORÉR: Sannsynlig vestibulær nevritt — perifer årsak. Akutt vedvarende vertigo med unidireksjonell nystagmus uten hørselstap er typisk nevritt. Kan gå med støtte (mild ataksi forventes perifert). Differensier fra sentralt med HINTS. Vestibulær rehabilitering.'
    ),
    make_example(
        '72 år kvinne med atrieflimmer. Akutt svimmelhet med gangvansker. Falltendens til høyre. Dysartri (utydelig tale). Nystagmus.',
        'AKUTT: Sentral vertigo — mulig posterior fossa-infarkt. Vertigo med ataksi, dysartri og nystagmus hos pasient med atrieflimmer (embolikilde). Ring 113 umiddelbart. MR hjerne og CTA. Nevrologisk akuttvurdering. Trombolyse vurderes dersom innen tidsvindu.'
    ),
    make_example(
        '45 år kvinne. Svimmelhet med hørselstap og tinnitus i venstre øre. Trykkfølelse i øret. Anfall varer 2-4 timer.',
        'MONITORÉR: Ménières sykdom — perifer vestibulær årsak. Triaden vertigo, hørselstap og tinnitus med aurafølelse (trykk i øret) og episodisk forløp er klassisk Ménière. Henvis ØNH for audiometri og bekreftelse. Saltrestriksjon og eventuelt betahistin.'
    ),
    make_example(
        '60 år mann. Akutt svimmelhet med intens hodepine i bakhodet. Oppkast. Kan ikke stå uten å falle til venstre. Positiv finger-nese-test venstre.',
        'AKUTT: Akutt cerebellært infarkt eller blødning. Vertigo med oksipital hodepine, uttalt ataksi og ipsilateral cerebellær dysmetri. Ring 113 umiddelbart. CT caput akutt (utelukk blødning), MR diffusjon. Nevrokirurgisk beredskap ved cerebellar hevelse.'
    ),
    make_example(
        '35 år kvinne. Episodisk svimmelhet utløst av hodebevegelse, varighet 5-10 sekunder. Mellom anfall er hun helt normal. Ingen hørselstap.',
        'TRYGT: BPPV — benign paroksysmal posisjonsvertigo. Kort posisjonsutløst svimmelhet med normalitet mellom anfall og uten hørselstap. Dix-Hallpike test for å bekrefte. Epley-manøver som behandling. Svært godt prognose.'
    ),
    make_example(
        '68 år mann med hypertensjon og diabetes. Plutselig svimmelhet med Horners syndrom og dysfagi. Nummenhet i ansiktet kontralateralt til kroppen.',
        'AKUTT: Lateralt medullært syndrom (Wallenberg) — vertebral arterie-okklusjon. Ipsilateral Horners, dysfagi, ansiktsparestesi med kontralateral kroppsparestesi. Ring 113. MR hjerne og MRA/CTA vertebralarterier. Slagenhet for akuttbehandling og sekundærprofylakse.'
    ),
    make_example(
        '55 år kvinne. Svimmelhet som kommer og går over 2 måneder. Noen korte episoder, noen langvarige. Varierer i intensitet. Normal HINTS-undersøkelse mellom anfall.',
        'MONITORÉR: Kronisk intermitterende vertigo — bred differensialdiagnose. Varierende episodelengde og intensitet kan skyldes BPPV (korte), Ménière (timer), vestibulær migrene (variabelt). Normal HINTS mellom anfall taler mot kronisk sentralt. Audiometri, henvis ØNH/nevrolog for systematisk utredning.'
    ),
    make_example(
        '48 år mann. Svimmelhet med ensidig hørselstap og ansiktssvakhet (perifer facialisparese). Ingen andre nevrologiske utfall.',
        'HENVIS SAMME DAG: Mulig akustikusnevrinom eller annen cerebellopontin vinkel-lesjon. Kombinasjon av unilateral hørselstap, vertigo og perifer facialisparese peker mot masse i cerebellopontin vinkel. MR med kontrast. ØNH- og nevrologisk vurdering.'
    ),
    make_example(
        '40 år kvinne med kjent migrene. Svimmelhetsanfall med hodepine, lys- og lydoverfolsomhet. Anfallene varer 4-72 timer. Normal mellom anfall.',
        'TRYGT: Vestibulær migrene. Vertigo med typiske migrenefenomener (hodepine, foto-/fonofobi) og episodisk forløp med normalitet mellom anfall. Vestibulær migrene er en av de vanligste årsaker til episodisk vertigo. Migreneforebygging kan hjelpe. Henvis ved usikkerhet.'
    ),
    make_example(
        '75 år mann. Svimmelhet og gangvansker siste 3 måneder. Gradvis forverring. Nystagmus som er vanskelig å kategorisere. Også subtil hørselstap bilateralt.',
        'HENVIS SAMME DAG: Progressiv vertigo med gangforstyrrelse hos eldre — utelukk sentralt. Gradvis forverring over måneder med ustø gange og atypisk nystagmus. Differensier: posterior fossa-tumor, normal pressure hydrocephalus, sentralnervøs degenerasjon. MR hjerne med kontrast. Nevrologisk vurdering.'
    ),
    make_example(
        '52 år kvinne. Forbigående svimmelhet ved å reise seg raskt. Varer 5-10 sekunder. Ingen rotatorisk følelse, mer «svart for øynene». Lavt BT 95/60.',
        'TRYGT: Ortostatisk hypotensjon — ikke vestibulær årsak. Presymkope (svart for øynene) ved posisjonsendring med lavt BT er ortostatisk, ikke vestibulært. Hydreringsstatus, medikamentgjennomgang og ortostatisk BT-måling. Distinkt fra BPPV (rotatorisk, posisjonsavhengig).'
    ),
    make_example(
        '63 år mann. Akutt svimmelhet med hørselstap og tinnitus i høyre øre. Samtidig ansiktssvakhet høyre side og endret smaksans.',
        'HENVIS SAMME DAG: Ramsay Hunt syndrom (herpes zoster oticus) eller cerebellopontin masse. Akutt perifer vertigo med ipsilateral hørselstap, tinnitus og perifer facialisparese. Sjekk for vesikulært utslett i øregang (RH-syndrom). MR med kontrast for å utelukke masse. Akutt antiviral behandling ved Ramsay Hunt.'
    ),
    make_example(
        '44 år kvinne. Svimmelhet under cervikale bevegelser, spesielt rotasjon. Ingen nystagmus i nøytralt. Cervikal ømhet og stivhet. Ingen hodepine eller andre nevrologiske symptomer.',
        'MONITORÉR: Cervikal vertigo — men vertebrobasilær insuffisiens må utelukkes. Svimmelhet ved nakkerotasjon kan være proprioseptiv cervikal vertigo eller VBI. Fravær av hjernestammesymptomer (diplopi, dysfagi, dysartri) og andre nevrologiske utfall taler for cervikal årsak. Test: holde hodet stille og rotere kroppen. Cervikalt utløst = cervikal vertigo.'
    ),
]

EDGE_WEAKNESS = [
    make_example(
        '45 år mann med akutt ryggsmerte. Angir kraftsvikt i høyre bein, men ved testing er kraft 5/5 når han motiveres. Gir etter ved start av test men opprettholder ved oppmuntring.',
        'TRYGT: Smerteinhibert kraftsvikt — ikke ekte nevrologisk deficit. Effort-avhengig svakhet som normaliseres ved motivasjon er smerterelatert inhibisjon, ikke strukturell skade. «Give-way» mønster er klassisk for smerterelatert svakhet. Smertekontroll og gradvis aktivering.'
    ),
    make_example(
        '52 år kvinne. Svakhet i venstre bein som har utviklet seg over 3 uker. Konstant, ikke smerteavhengig. Nedsatt kraft dorsalfleksjon 3/5. Muskelatrofi observert. Reflekser nedsatt.',
        'HENVIS SAMME DAG: Ekte progressiv nevrologisk deficit med muskelatrofi. Gradvis kraftsvikt med atrofi og refleksnedsettelse over uker er strukturell nerveskade. Ikke smerterelatert. MR lumbalcolumna og EMG/NCV for å lokalisere og gradere nerveskaden. Nevrokirurgisk vurdering.'
    ),
    make_example(
        '38 år mann med akutt korsryggsmerte. Klarer ikke å gå på hæl høyre fot. Uttalt smerte ved forsøk. Normal sensibilitet. Refleks normal.',
        'MONITORÉR: Usikker droppfot — smerterelatert eller ekte L5-utfall? Manglende hælgang ved uttalt smerte kan være smerteinhibert. Normal sensibilitet og reflekser taler mot komplett nerveaffeksjon. Test i liggende (eliminér vektbæring). Re-test etter smertelindring. MR ved vedvarende svakhet.'
    ),
    make_example(
        '60 år kvinne. Oppgir svakhet i begge bein. Ved testing: gir etter umiddelbart men kan gå normalt i korridoren. Ingen muskelatrofi. Reflekser normale.',
        'TRYGT: Funksjonell/inkongruent svakhet — ikke organisk nevrologisk deficit. Diskrepans mellom formell testing (gir etter) og funksjonell observasjon (normal gange) tyder på non-organisk årsak. Normale reflekser og fravær av atrofi bekrefter. Vurder psykososiale faktorer.'
    ),
    make_example(
        '48 år mann. Gradvis svakhet i høyre grep og finmotorikk siste 6 uker. Kan ikke kneppe knapper. Muskelatrofi i thenarregionen. Fascikulasjoner.',
        'HENVIS SAMME DAG: Ekte nevrologisk deficit med atrofi og fascikulasjoner. Progredierende finmotorisk svikt med muskelatrofi og fascikulasjoner er alvorlige nedre motornevron-tegn. Differensier: carpal tunnel, C8-radikulopati, motornevronsykdom. EMG/NCV og MR cervikalcolumna. Nevrologisk henvisning.'
    ),
    make_example(
        '35 år kvinne med fibromyalgi. Oppgir svakhet i armene, verst om morgenen. Kraft ved testing 4+/5 men varierer med forsøk. Ingen atrofi. Normale reflekser.',
        'TRYGT: Opplevd svakhet relatert til fibromyalgi — ikke strukturell. Variabel kraftprestasjon uten atrofi eller refleksendring ved kjent fibromyalgi. Smerte og fatigue reduserer frivillig kraftutfoldelse. Differensier fra ekte svakhet: ingen atrofi, ingen refleksendring, variabel testing.'
    ),
    make_example(
        '55 år mann. Svakhet i venstre arm som startet plutselig for 3 timer siden. Kraft 2/5 i deltoideus og biceps. Normal i høyre arm. Hyperrefleksi venstre. Babinski positiv venstre.',
        'AKUTT: Akutt øvre motornevron-lesjon — mulig cerebralt infarkt. Plutselig ensidig svakhet med hyperrefleksi og positiv Babinski er akutt sentral nevrologisk hendelse. Ring 113 umiddelbart. CT/MR caput. Trombolyse dersom innen tidsvindu. Nevrologisk akuttvurdering.'
    ),
    make_example(
        '42 år kvinne med akutt nakkesmerte. Oppgir at armen «gir etter» intermittent. Normalt mellom episodene. Ingen atrofi. Reflekser normale.',
        'TRYGT: Intermittent smerterelatert svakhet — ikke strukturell. Episodisk «gi-etter»-svakhet med normalitet mellom episodene og ingen objektive nevrologiske funn. Smertebehandling og reassurering. Monitorér; henvis for MR kun ved vedvarende eller progredierenede svakhet.'
    ),
    make_example(
        '65 år mann med spinalkanalstenose. Svakhet i begge ben etter 200 meter gange som forsvinner ved hvile i 5 minutter. Normal styrke i hvile.',
        'HENVIS RUTINE: Nevrogen claudicatio ved lumbal stenose — aktivitetsutløst reversibel svakhet. Gangavhengig bilateral svakhet som resolves ved hvile er klassisk stenose-claudicatio, ikke permanent nevrologisk deficit. MR lumbalcolumna. Konservativ behandling eller kirurgisk dekompresjon.'
    ),
    make_example(
        '30 år kvinne. Bilateral beinsvakhet som utviklet seg over 3 dager. Arefleksi. Parestesier i hender og føtter. Startet i føttene og stiger oppover.',
        'AKUTT: Guillain-Barré syndrom — akutt ascenderende polynevropati. Raskt progredierende bilateral svakhet med arefleksi og ascenderende parestesier. Ring 113. Sykehus for LP (albuminocytologisk dissossiasjon), spirometri og nerveledningsstudier. Iv immunglobulin eller plasmaferese.'
    ),
]

EDGE_NIGHT_PAIN = [
    make_example(
        '50 år mann. Skuldersmerte som vekker ham om natten, spesielt når han ligger på den siden. Kan finne en komfortabel stilling ved å legge en pute under armen. Dagssmerter ved overhead-aktivitet.',
        'TRYGT: Nattlig skuldersmerte ved rotator cuff tendinopati — posisjonsavhengig. Smerte ved sideleie som lindres med posisjonsendring (pute) og dagssmerter ved overhead er mekanisk tendinopati. Distinksjonen fra tumorsmerte: posisjonsrelatert, lindring ved stillingsendring, dagaktivitetsmønster.'
    ),
    make_example(
        '62 år mann, tidligere røyker. Thorakal smerte som vekker ham hver natt uavhengig av stilling. Finner ingen komfortabel posisjon. Smerten er der også om dagen, uavhengig av aktivitet. Vekttap.',
        'HENVIS SAMME DAG: Nattlig ryggsmerte med alarmsignaler — utelukk malignitet. Nattesmerter som er stillingsUavhengig, konstant, med vekttap hos eldre eks-røyker. Posisjonsrefraktær nattsmerte skiller fra mekanisk. Bildediagnostikk: MR thorakal columna. Blodprøver: SR, CRP, ALP, LD.'
    ),
    make_example(
        '45 år kvinne. Korsryggsmerte som vekker henne ca kl 4 om natten. Bedre når hun står opp og beveger seg. Morgenstivhet 60 min. Ellers frisk.',
        'HENVIS RUTINE: Inflammatorisk nattsmerte — mulig spondyloartritt. Nattsmerte i andre halvdel av natten som bedres ved aktivitet med uttalt morgenstivhet er inflammatorisk mønster. Ikke tumoralarmerende (bedring ved bevegelse). Blodprøver: CRP, HLA-B27. MR SI-ledd.'
    ),
    make_example(
        '55 år mann. Skuldersmerte som vekker ham. Lindres ved å stå opp og la armen henge. Ingen feber, ingen vekttap. Palpasjonsøm supraspinatus.',
        'TRYGT: Nattsmerte ved supraspinatus tendinopati. Sideleie komprimerer subacromial rom; å stå opp avlaster. Palpasjonsømhet bekrefter lokal mekanisk årsak. Fravær av systemiske symptomer gjør tumor usannsynlig. Søvnstillingsjustering og rehabilitering.'
    ),
    make_example(
        '70 år kvinne. Korsryggsmerte som er konstant dag og natt. Finner aldri en god stilling. Gradvis forverring over 3 måneder. Fatigue, dårlig appetitt.',
        'HENVIS SAMME DAG: Vedvarende konstant smerte med systemiske symptomer — utelukk malignitet. Stillingsrefraktær smerte dag og natt hos eldre med fatigue og appetittap. Bildediagnostikk: MR lumbalcolumna. Blodprøver: SR, CRP, elektroforese (myelom), lever/nyrefunksjon.'
    ),
    make_example(
        '40 år mann. Hoftemerter som vekker ham om natten. Lindres ved å endre stilling fra sideleie til rygg. Dagstid: smerte ved lang gange. Positiv FABER.',
        'TRYGT: Nattlig hoftesmerter ved trochanterbursitt eller labrum-patologi. Posisjonsavhengig nattsmerte (sideleie) med dagaktivitetssmerte og positiv FABER er mekanisk hofte-/bursaårsak. Posisjonsrespons differensierer fra tumor. Sidelepute og fysioterapi.'
    ),
    make_example(
        '65 år mann. Beinsmerte som vekker ham om natten. Må stå opp og gå. Smerten er i begge legger. Også crampeproblemer. Perifer pulser palpable.',
        'MONITORÉR: Nattlige beinsmerter — differensier perifer karsykdom, restless legs og nevrogen årsak. Bilateral leggsmerte med kramper og nattlig forverring. Palpable pulser reduserer vaskulær mistanke men utelukker ikke helt. Vurder ankel-arm-indeks, jernstatus (RLS) og lumbal stenose (MR). Bredt utredningsbehov.'
    ),
    make_example(
        '48 år kvinne. Nakke- og armsmerte som er verst om natten. Våkner med nummen arm som løsner etter å ha ristet på den. Dersom hun sover med arm under hodet.',
        'TRYGT: Nattlig cervikobrakial smerte med posisjonsrelatert parestesi. Armnummenhet som resolves ved stillingsendring tyder på kompresjon ved ugunstig sovestilling. Distinkt fra radikulopati (vedvarende nummenhet) og tumor (stillingsrefraktær). Nakkeputeråd og ergonomisk vurdering.'
    ),
    make_example(
        '58 år mann. Ryggsmerte som har vært konstant i 6 uker. Verre om natten men lindres noe i fosterstilling. Også smerte om dagen ved aktivitet. Ingen vekttap, ingen feber.',
        'MONITORÉR: Vedvarende ryggsmerte med nattlig komponent — uavklart. Delvis stillingsresponsiv nattsmerte med aktivitetssmerte om dagen og uten systemiske tegn er grensetilfelle. Kan være mekanisk (diskogen), men 6 ukers vedvarende smerte krever utredning. MR lumbalcolumna ved manglende bedring etter 2 uker konservativ behandling.'
    ),
    make_example(
        '73 år kvinne. Thorakal smerte som vekker henne flere ganger per natt. Smerten er boraktig, dyp, konstant. Ingen stillingsendring hjelper. Tidligere brystkreft for 10 år siden.',
        'AKUTT: Nattlig stillingsrefraktær boraktig thorakalsmerte hos kreftpasient — mistanke om skjelettmetastase. Dyp, konstant, posisjonsrefraktær smerte hos tidligere brystkreftpasient er malignitet inntil motsatt bevist, selv etter 10 år. Akutt MR thorakalcolumna. Hastehenvisning for bildediagnostikk og onkologisk vurdering.'
    ),
]


def get_edge_examples():
    """Return all Category 3 EDGE CASE examples."""
    return (
        EDGE_DISC_VS_CAUDA
        + EDGE_HEADACHE_VS_SAH
        + EDGE_CHEST_PAIN
        + EDGE_INFLAMMATORY_VS_MECHANICAL
        + EDGE_VERTIGO
        + EDGE_WEAKNESS
        + EDGE_NIGHT_PAIN
    )


# ============================================================
# MAIN
# ============================================================

def generate_all_examples():
    """Generate all training examples, shuffled."""
    safe = get_safe_examples()
    dangerous = get_dangerous_examples()
    edge = get_edge_examples()

    all_examples = safe + dangerous + edge
    random.seed(42)
    random.shuffle(all_examples)
    return all_examples


def main():
    parser = argparse.ArgumentParser(
        description='Generate v2 red flag training data'
    )
    parser.add_argument(
        '--count', action='store_true',
        help='Print counts without writing file'
    )
    args = parser.parse_args()

    safe = get_safe_examples()
    dangerous = get_dangerous_examples()
    edge = get_edge_examples()

    all_examples = safe + dangerous + edge

    if args.count:
        print(f"Category 1 — SAFE scenarios:      {len(safe)}")
        print(f"Category 2 — DANGEROUS scenarios:  {len(dangerous)}")
        print(f"Category 3 — EDGE CASES:           {len(edge)}")
        print(f"TOTAL:                             {len(all_examples)}")
        return

    # Shuffle
    random.seed(42)
    random.shuffle(all_examples)

    # Output
    script_dir = Path(__file__).parent.parent
    output_dir = script_dir / 'data' / 'mined'
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / 'red-flags-v2-synthetic.jsonl'
    with open(output_file, 'w', encoding='utf-8') as f:
        for ex in all_examples:
            f.write(json.dumps(ex, ensure_ascii=False) + '\n')

    # Detailed counts
    safe_count = sum(
        1 for ex in all_examples
        if ex['messages'][-1]['content'].startswith('TRYGT:')
    )
    monitor_count = sum(
        1 for ex in all_examples
        if ex['messages'][-1]['content'].startswith('MONITORÉR:')
    )
    akutt_count = sum(
        1 for ex in all_examples
        if ex['messages'][-1]['content'].startswith('AKUTT:')
    )
    henvis_sd_count = sum(
        1 for ex in all_examples
        if ex['messages'][-1]['content'].startswith('HENVIS SAMME DAG:')
    )
    henvis_r_count = sum(
        1 for ex in all_examples
        if ex['messages'][-1]['content'].startswith('HENVIS RUTINE:')
    )

    print(f"Generated {len(all_examples)} red flag v2 training examples")
    print(f"")
    print(f"  Category 1 — SAFE scenarios:      {len(safe)}")
    print(f"  Category 2 — DANGEROUS scenarios:  {len(dangerous)}")
    print(f"  Category 3 — EDGE CASES:           {len(edge)}")
    print(f"")
    print(f"  By urgency classification:")
    print(f"    TRYGT:             {safe_count}")
    print(f"    MONITORÉR:         {monitor_count}")
    print(f"    HENVIS RUTINE:     {henvis_r_count}")
    print(f"    HENVIS SAMME DAG:  {henvis_sd_count}")
    print(f"    AKUTT:             {akutt_count}")
    print(f"")
    print(f"  Output: {output_file}")


if __name__ == '__main__':
    main()
