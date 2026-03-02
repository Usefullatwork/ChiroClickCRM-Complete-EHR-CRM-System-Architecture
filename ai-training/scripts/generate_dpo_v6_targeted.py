#!/usr/bin/env python3
"""
Generate 200 targeted DPO pairs for v6 model improvement.

Categories:
1. Letters — 60 pairs (HIGHEST PRIORITY, v5 had 0 letter DPO pairs)
2. Diagnosis codes — 40 pairs
3. Red flags — 40 pairs
4. Communication — 40 pairs
5. Quick fields — 20 pairs

Output: data/dpo/v6_targeted.jsonl (200 pairs)
"""

import json
import random
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
AI_TRAINING_DIR = SCRIPT_DIR.parent
OUTPUT_DIR = AI_TRAINING_DIR / "data" / "dpo"

random.seed(42)

# System prompts
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
SYSTEM_QUICK = (
    'Du er en klinisk feltgenerator. Generer korte, presise kliniske feltverdier.'
)
SYSTEM_LETTER = (
    'Du skriver profesjonelle medisinske brev og henvisninger for '
    'kiropraktisk klinikk i Norge. Bruk formelt medisinsk språk med '
    'korrekt norsk terminologi.'
)


def make_pair(system: str, user: str, chosen: str, rejected: str) -> dict:
    prompt = f"<|im_start|>system\n{system}<|im_end|>\n<|im_start|>user\n{user}<|im_end|>\n<|im_start|>assistant\n"
    return {"prompt": prompt, "chosen": chosen, "rejected": rejected}


# ============================================================
# LETTERS — 60 pairs
# ============================================================

def generate_letter_pairs():
    pairs = []

    # 2A-1: Referral to neurologist (10)
    neuro_refs = [
        {"user": "Skriv henvisning til nevrolog for pasient med mistenkt cervikal radikulopati C6. Pasient 48 år mann, smerter og parestesier i høyre arm i 8 uker.",
         "chosen": "Henvisning\nTil: Nevrologisk avdeling\nFra: Kiropraktor [Navn], [Klinikk]\nDato: [Dato]\n\nPasient: [Navn], 48 år mann\n\nProblemstilling: Mistenkt cervikal radikulopati C6 høyre side. Pasienten har hatt progredierende smerter og parestesier i høyre overekstremitet i 8 uker, dermatomalt i C6-distribusjon. Klinisk undersøkelse viser redusert bicepsrefleks, nedsatt sensibilitet laterale underarm. Spurlings test positiv høyre. Ber om nevrologisk vurdering og eventuell MR cervikalcolumna.",
         "rejected": "Patient has C6 radiculopathy, please evaluate."},
        {"user": "Skriv henvisning til nevrolog for 55 år kvinne med lumbal radikulopati L5 venstre. Dropfot utviklet siste 2 uker.",
         "chosen": "Henvisning\nTil: Nevrologisk avdeling\nFra: Kiropraktor [Navn], [Klinikk]\nDato: [Dato]\n\nPasient: [Navn], 55 år kvinne\n\nProblemstilling: Progredierende lumbal radikulopati L5 venstre med utvikling av dropfot siste 2 uker. Kraftgrad dorsalfleksjon venstre fot 3/5, positiv SLR 30 grader. Dermatom L5 hypoestesi. Pasienten har ikke respondert på konservativ behandling. Ber om hastehenvisning for nevrologisk vurdering grunnet motorisk utfall.",
         "rejected": "Dropfot, trenger MR."},
        {"user": "Skriv henvisning til nevrolog for 62 år mann med bilateral håndsvakhet og klossete fingre. Mistenkt cervikal myelopati.",
         "chosen": "Henvisning\nTil: Nevrologisk avdeling\nFra: Kiropraktor [Navn], [Klinikk]\nDato: [Dato]\n\nPasient: [Navn], 62 år mann\n\nProblemstilling: Mistenkt cervikal myelopati. Pasienten presenterer med progressiv bilateral finmotoriksvikt og klossete fingre over 3 måneder. Klinisk funn: hyperrefleksi bilateralt, positiv Hoffmanns tegn, bred gangbase. Lhermittes tegn negativ. Ber om akutt nevrologisk vurdering og MR cervikalcolumna for å utelukke kompressiv myelopati.",
         "rejected": "Svake hender, kan du sjekke?"},
        {"user": "Skriv henvisning til nevrolog for 35 år kvinne med vedvarende hodepine og synsforstyrrelser. Mistenkt intrakraniell patologi.",
         "chosen": "Henvisning\nTil: Nevrologisk avdeling\nFra: Kiropraktor [Navn], [Klinikk]\nDato: [Dato]\n\nPasient: [Navn], 35 år kvinne\n\nProblemstilling: Ny type hodepine med synsforstyrrelser siste 6 uker. Pasienten beskriver progredierende unilateral hodepine med flimring og intermitterende dobbeltsyn. Ingen effekt av standard smertelindring. Nevrologisk screening viser papilødem ved oftalmoskopi. Ber om hastehenvisning for bildediagnostikk og nevrologisk vurdering.",
         "rejected": "Hodepine med synsproblemer."},
        {"user": "Skriv henvisning til nevrolog for 41 år mann med radikulopati C7 og progredierende tricepssvakhet.",
         "chosen": "Henvisning\nTil: Nevrologisk avdeling\nFra: Kiropraktor [Navn], [Klinikk]\nDato: [Dato]\n\nPasient: [Navn], 41 år mann\n\nProblemstilling: Cervikal radikulopati C7 høyre med progredierende motorisk utfall. Kraftgrad triceps 3+/5, redusert tricepsrefleks, parestesier i langfinger. Debut etter nakkeskade for 4 uker siden, forverring tross konservativ behandling. Ber om nevrologisk vurdering og MR cervikal for å kartlegge eventuell diskherniering C6-C7.",
         "rejected": "C7 problem, vennligst undersøk."},
        {"user": "Skriv henvisning til nevrolog for 28 år kvinne med parestesier i begge ben og balansevansker.",
         "chosen": "Henvisning\nTil: Nevrologisk avdeling\nFra: Kiropraktor [Navn], [Klinikk]\nDato: [Dato]\n\nPasient: [Navn], 28 år kvinne\n\nProblemstilling: Bilateral parestesi i underekstremitetene og ustøhet siste 3 uker. Klinisk undersøkelse viser hyperrefleksi i begge ben, positiv Babinski bilateralt, nedsatt propriosepsjon i tær. Rombergs test positiv. Funnene er forenlige med øvre motornevronlesjon. Ber om nevrologisk utredning inkludert MR medulla og cerebrum.",
         "rejected": "Nummenhet i bena."},
        {"user": "Skriv henvisning til nevrolog for 50 år mann med lumbal radikulopati S1 og manglende akillesrefleks.",
         "chosen": "Henvisning\nTil: Nevrologisk avdeling\nFra: Kiropraktor [Navn], [Klinikk]\nDato: [Dato]\n\nPasient: [Navn], 50 år mann\n\nProblemstilling: Lumbal radikulopati S1 venstre med manglende akillesrefleks og smerter i legg/fot. SLR positiv 40 grader, dermatomal hypoestesi laterale fot. Symptomvarighet 10 uker uten bedring ved konservativ behandling. Ber om nevrologisk vurdering og MR lumbalcolumna for å vurdere operasjonsindikasjon.",
         "rejected": "S1 nerven er klem."},
        {"user": "Skriv henvisning til nevrolog for 44 år kvinne med karpaltunnelsyndrom bilateral som ikke responderer på skinne.",
         "chosen": "Henvisning\nTil: Nevrologisk avdeling\nFra: Kiropraktor [Navn], [Klinikk]\nDato: [Dato]\n\nPasient: [Navn], 44 år kvinne\n\nProblemstilling: Bilateral karpaltunnelsyndrom med utilfredsstillende respons på 3 måneder med nattskinne. Vedvarende parestesier i median nervens distribusjon, positiv Phalen og Tinel bilateralt, begynnende thenar-atrofi venstre hånd. Ber om nevrografi og vurdering for eventuell kirurgisk dekompresjon.",
         "rejected": "Karpaltunnel begge hender."},
        {"user": "Skriv henvisning til nevrolog for 67 år mann med spinal stenose og claudicatio neurogenes.",
         "chosen": "Henvisning\nTil: Nevrologisk avdeling\nFra: Kiropraktor [Navn], [Klinikk]\nDato: [Dato]\n\nPasient: [Navn], 67 år mann\n\nProblemstilling: Lumbal spinal stenose med nevrogen claudicatio. Pasienten rapporterer bilateral smerte og nummenhet i legger ved gange >200 meter, lindring ved fleksjon. Klinisk: nedsatt lumbal ekstensjon, normal perifer sirkulasjon. Symptomene er progredierende over 6 måneder. Ber om MR lumbalcolumna og vurdering av dekompresjon.",
         "rejected": "Trange nerver i rygg."},
        {"user": "Skriv henvisning til nevrolog for 38 år mann med akutt isjias og cauda equina-symptomer.",
         "chosen": "Henvisning — HASTER\nTil: Nevrologisk avdeling / Akuttmottak\nFra: Kiropraktor [Navn], [Klinikk]\nDato: [Dato]\n\nPasient: [Navn], 38 år mann\n\nProblemstilling: Akutt lumbal radikulopati med mistenkt cauda equina syndrom. Pasienten har bilateral isjias, sadelbedøvelse i perinealregionen, og nyoppstått vannlatingsvansker siste 24 timer. Redusert anal sphinctertonus. AKUTT henvisning for MR lumbalcolumna og nevrokirurgisk vurdering. Pasienten er informert om å oppsøke akuttmottak umiddelbart.",
         "rejected": "Isjias med litt nummenhet."},
    ]
    for s in neuro_refs:
        pairs.append(make_pair(SYSTEM_LETTER, s["user"], s["chosen"], s["rejected"]))

    # 2A-2: Sick leave certificates (10)
    sick_leave = [
        {"user": "Skriv sykemelding for 42 år mann med akutt lumbal skiveprolaps. 100% i 4 uker.",
         "chosen": "Medisinsk grunnlag for sykemelding\n\nPasient: [Navn], 42 år\nDiagnose: L86 Ryggsyndrom med utstråling (ICPC-2) / M51.1 Lumbal skiveprolaps (ICD-10)\n\nFunksjonsvurdering: Pasienten har akutt lumbal skiveprolaps med radikulopati L5 venstre. Kan ikke sitte >15 min, ikke løfte >2 kg, eller utføre fysisk tungt arbeid. VAS 8/10. Positiv SLR 30°. Behov for hyppig stillingsskifte.\n\nSykemelding: 100% i 4 uker fra [dato] til [dato].\nOppfølging: Kontroll om 2 uker for revurdering av sykemelding og funksjonsnivå.",
         "rejected": "Prolaps, trenger fri fra jobb i 4 uker."},
        {"user": "Skriv sykemelding for 35 år kvinne med akutt nakkeskade etter trafikkulykke. Whiplash WAD II.",
         "chosen": "Medisinsk grunnlag for sykemelding\n\nPasient: [Navn], 35 år\nDiagnose: L83 Nakkesyndrom (ICPC-2) / S13.4 Nakkeslengskade (ICD-10)\nSkademekanisme: Påkjørt bakfra [dato]. WAD grad II.\n\nFunksjonsvurdering: Uttalt cervikalgi med bevegelsesrestriksjon, hodepine, konsentrasjonsvansker. Kan ikke utføre kontorarbeid grunnet smerter ved skjermarbeid. VAS 7/10. Redusert cervikalt ROM alle plan.\n\nSykemelding: 100% i 2 uker fra [dato]. Gradert tilbakeføring planlegges.\nOppfølging: Kontroll om 1 uke.",
         "rejected": "Nakkesleng etter ulykke, trenger fri."},
        {"user": "Skriv sykemelding for 50 år mann, lagerarbeider med akutt ryggsmerte etter løft på jobb.",
         "chosen": "Medisinsk grunnlag for sykemelding\n\nPasient: [Navn], 50 år, yrke: lagerarbeider\nDiagnose: L03 Symptomer korsrygg (ICPC-2)\nSkademekanisme: Akutt debut ved tungt løft på arbeidsplass [dato].\n\nFunksjonsvurdering: Akutt mekanisk korsryggsmerte med paravertebral muskelspasme. Kan ikke utføre løfting, bøying eller langvarig stående arbeid. VAS 7/10. Antalgisk holdning.\n\nSykemelding: 100% i 2 uker fra [dato] til [dato]. Vurder gradert sykemelding deretter med tilrettelagt arbeid uten løft.\nOppfølging: Kontroll om 10 dager.",
         "rejected": "Vondt i ryggen etter løft."},
        {"user": "Skriv sykemelding for 29 år kvinne med skulderimpingement. Frisør, kan ikke løfte armene.",
         "chosen": "Medisinsk grunnlag for sykemelding\n\nPasient: [Navn], 29 år, yrke: frisør\nDiagnose: L92 Skuldersyndrom (ICPC-2)\n\nFunksjonsvurdering: Skulderimpingement syndrom høyre med uttalt smerte ved elevasjon >90°. Positiv Hawkins og Neer test. Kan ikke utføre frisørarbeid som krever vedvarende armelevasjon. VAS 6/10.\n\nSykemelding: 50% gradert i 3 uker fra [dato]. Anbefaler tilrettelagt arbeid med oppgaver under skulderhøyde.\nOppfølging: Kontroll om 2 uker med revurdering.",
         "rejected": "Skuldersmerte."},
        {"user": "Skriv sykemelding for 45 år mann med cervikobrakialgi og kontorjobb.",
         "chosen": "Medisinsk grunnlag for sykemelding\n\nPasient: [Navn], 45 år, yrke: kontorarbeider\nDiagnose: L83 Nakkesyndrom (ICPC-2)\n\nFunksjonsvurdering: Cervikobrakialgi med radikulære symptomer C6 høyre. Smerter forverres ved skjermarbeid og langvarig sitting. Nedsatt konsentrasjonsevne grunnet smerte. VAS 6/10.\n\nSykemelding: 50% gradert i 2 uker. Kan jobbe halve dager med ergonomisk tilrettelegging.\nOppfølging: Kontroll om 2 uker.",
         "rejected": "Nakkevondt, kan ikke jobbe."},
        {"user": "Skriv sykemelding for 38 år kvinne med bekkenleddsmerter i svangerskapet. Uke 32.",
         "chosen": "Medisinsk grunnlag for sykemelding\n\nPasient: [Navn], 38 år, gravid uke 32\nDiagnose: L03 Symptomer korsrygg (ICPC-2) — bekkenrelaterte smerter i svangerskap\n\nFunksjonsvurdering: Uttalt bekkenleddsinstabilitet med smerter ved gange, trappegange og vektbæring. Kan ikke utføre stående arbeid eller gange >100 meter. Bruk av krykker. VAS 7/10.\n\nSykemelding: 100% fra [dato] til svangerskapspermisjon.\nOppfølging: Bekkenbelte tilpasset. Kontroll om 2 uker.",
         "rejected": "Bekkensmerter, gravid."},
        {"user": "Skriv sykemelding for 55 år mann med torakal smerte etter fall. Bygningsarbeider.",
         "chosen": "Medisinsk grunnlag for sykemelding\n\nPasient: [Navn], 55 år, yrke: bygningsarbeider\nDiagnose: L04 Symptomer brystrygg (ICPC-2)\nSkademekanisme: Fall fra stige [dato], landet på ryggen.\n\nFunksjonsvurdering: Torakal smerte Th6-Th8 med interkostal utstråling. Smerte ved dype inspirasjoner og rotasjon. Røntgen viser ingen fraktur. Kan ikke utføre fysisk krevende bygningsarbeid.\n\nSykemelding: 100% i 2 uker fra [dato]. Revurderes basert på smerteutvikling.\nOppfølging: Kontroll om 10 dager.",
         "rejected": "Fall fra stige, vondt i brystet."},
        {"user": "Skriv sykemelding for 33 år kvinne med epicondylitt. Dataingeniør.",
         "chosen": "Medisinsk grunnlag for sykemelding\n\nPasient: [Navn], 33 år, yrke: dataingeniør\nDiagnose: L93 Tennisalbue (ICPC-2)\n\nFunksjonsvurdering: Lateral epicondylitt høyre albue med smerter ved tastatur- og musbruk. Grep svekket, kan ikke utføre heldags skrivearbeid. Positiv Cozen's test.\n\nSykemelding: 50% gradert i 3 uker. Ergonomisk mus og tastatur anbefalt. Korte økter med pauser.\nOppfølging: Fysioterapi parallelt. Kontroll om 3 uker.",
         "rejected": "Tennisalbue, trenger fri."},
        {"user": "Skriv sykemelding for 60 år mann med lumbal spinal stenose. Bussjåfør.",
         "chosen": "Medisinsk grunnlag for sykemelding\n\nPasient: [Navn], 60 år, yrke: bussjåfør\nDiagnose: L86 Ryggsyndrom med utstråling (ICPC-2)\n\nFunksjonsvurdering: Lumbal spinal stenose med nevrogen claudicatio. Smerter og nummenhet i begge legger etter 15 min sitting. Kan ikke utføre bussjåførarbeid med langvarig sitting og vibrasjonseksponering.\n\nSykemelding: 100% i 4 uker fra [dato]. MR lumbal er bestilt. Vurderes for henvisning nevrokirurg.\nOppfølging: Kontroll etter MR-svar.",
         "rejected": "Trang rygg, kan ikke kjøre buss."},
        {"user": "Skriv sykemelding for 27 år kvinne med akutt torticollis.",
         "chosen": "Medisinsk grunnlag for sykemelding\n\nPasient: [Navn], 27 år\nDiagnose: L83 Nakkesyndrom (ICPC-2)\n\nFunksjonsvurdering: Akutt torticollis med uttalt bevegelsesrestriksjon cervikalt, spesielt rotasjon. Kompensatorisk skjevstilling. Intakt nevrologi. Kan ikke kjøre bil eller utføre arbeid som krever nakkerotasjon.\n\nSykemelding: 100% i 3-5 dager. Forventet rask bedring med behandling.\nOppfølging: Kontroll om 3 dager. Ingen behov for bildediagnostikk.",
         "rejected": "Stiv nakke."},
    ]
    for s in sick_leave:
        pairs.append(make_pair(SYSTEM_LETTER, s["user"], s["chosen"], s["rejected"]))

    # 2A-3: Insurance reports (10)
    insurance = [
        {"user": "Skriv erklæring til forsikringsselskap for whiplash etter bilulykke. 40 år mann, 4 mnd siden.",
         "chosen": "Erklæring til forsikringsselskap\n\nPasient: [Navn], 40 år mann\nSkadetidspunkt: [Dato], ca. 4 måneder siden\nSkademekanisme: Påkjørt bakfra i trafikkork. Whiplash/nakkesleng WAD grad II.\n\nNåværende funksjonsevne: Vedvarende nakkesmerter VAS 5/10, hodepine 3-4x/uke, konsentrasjonsvansker. Nedsatt cervikalt ROM: rotasjon 40° (normalt 80°), fleksjon 30° (normalt 50°). Redusert arbeidskapasitet, klarer ikke full dag med skjermarbeid.\n\nBehandling: 12 konsultasjoner kiropraktisk behandling med gradvis bedring.\nPrognose: Moderat. Forventet ytterligere bedring med fortsatt rehabilitering.",
         "rejected": "Nakkesleng etter krasj."},
        {"user": "Skriv forsikringserklæring for arbeidsskade. 52 år kvinne, falt på glatt gulv på jobb.",
         "chosen": "Erklæring til forsikringsselskap — Yrkesskade\n\nPasient: [Namn], 52 år kvinne\nSkadetidspunkt: [Dato]\nSkadested: Arbeidsplass [Navn]\nSkademekanisme: Falt på glatt gulv, landet på venstre hofte og håndledd.\n\nSkadeomfang: Kontusjon venstre hofte, forstuing venstre håndledd. Røntgen uten fraktur.\nFunksjonsevne: Halter ved gange, kan ikke bære >3 kg med venstre arm. Smerte VAS 5/10 hofte, 4/10 håndledd.\n\nBehandling: Manuell behandling, mobilisering, øvelser. 8 konsultasjoner hittil.\nPrognose: God. Forventet full restitusjon innen 3-4 måneder.\nArbeidsfravær: 3 uker 100%, deretter 2 uker gradert.",
         "rejected": "Falt på jobb."},
        {"user": "Skriv forsikringserklæring for kronisk nakkesleng. 33 år mann, 18 mnd etter bilulykke.",
         "chosen": "Erklæring til forsikringsselskap\n\nPasient: [Namn], 33 år mann\nSkadetidspunkt: [Dato], ca. 18 måneder siden\nSkademekanisme: Frontkollisjon, nakkesleng WAD grad III.\n\nFunksjonsevne ved aktuelle vurdering: Kronisk nakkesmerte VAS 4-6/10, daglig hodepine, søvnvansker, nedsatt konsentrasjon. Cervikalt ROM redusert 50% av normalt. Kognitive vansker påvirker arbeidsevne. Har ikke klart å returnere til full stilling.\n\nBehandlingsforløp: 24 konsultasjoner kiropraktisk + fysioterapi. Platå i bedring siste 6 mnd.\nPrognose: Forsiktig. Risiko for varig funksjonsnedsettelse. Anbefaler tverrfaglig rehabilitering.\nMedisinsk invaliditetsgrad: Estimert 10-15% varig medisinsk invaliditet.",
         "rejected": "Fortsatt nakkevondt etter ulykke."},
        {"user": "Skriv erklæring for reiseforsikring. 25 år kvinne, akutt ryggsmerte på ferie.",
         "chosen": "Erklæring til reiseforsikring\n\nPasient: [Navn], 25 år kvinne\nReisedato: [Dato] — [Dato]\nSkadedato: [Dato], under ferie i [Land]\n\nHendelsesforløp: Akutt korsryggsmerte etter aktivitet på ferie. Oppsøkte lokal lege [dato] som ga smertestillende.\n\nKliniske funn ved hjemkomst: Akutt mekanisk korsryggsmerte L4-L5 med muskelspasme. Ingen nevrologiske utfall. VAS 6/10.\n\nBehandling: 4 kiropraktiske konsultasjoner med god respons.\nArbeidsfravær: 5 dager.\nVurdering: Akutt skade oppstått under reise, behandling var medisinsk nødvendig.",
         "rejected": "Vondt i ryggen på ferie."},
        {"user": "Skriv forsikringserklæring for idrettsskade. 20 år mann, korsbåndsskade fotball.",
         "chosen": "Erklæring til forsikringsselskap — Idrettsskade\n\nPasient: [Navn], 20 år mann\nSkadetidspunkt: [Dato], under fotballkamp\nSkademekanisme: Vridningstraume venstre kne ved retningsendring.\n\nKliniske funn: Positiv Lachmans test, positiv pivot shift, effusjon venstre kne. MR bekrefter fremre korsbåndruptur.\nFunksjonsevne: Kan ikke drive sport, ustabilitet ved trappegange, hevelse ved belastning.\n\nBehandling: Henvist ortoped for vurdering av ACL-rekonstruksjon. Pre-operativ rehabilitering påbegynt.\nPrognose: Operasjon nødvendig for retur til konkurranseidrett. Forventet rehabiliteringstid 9-12 måneder.\nEstimert behandlingskostnad: Operasjon + rehabilitering.",
         "rejected": "Knesskade fotball."},
        {"user": "Skriv forsikringserklæring for pasient med nakkesleng og kognitiv svikt etter ulykke.",
         "chosen": "Erklæring til forsikringsselskap\n\nPasient: [Navn]\nSkadedato: [Dato]\nSkademekanisme: Nakkesleng/whiplash WAD grad II etter kollisjon.\n\nFunksjonsevne: Kronisk nakke- og hodepine, konsentrasjonsvansker, lysømfintlighet, svimmelhet. Nevropsykologisk testing viser nedsatt arbeidshukommelse og prosesseringshastighet. Kan ikke fullføre hel arbeidsdag med kognitivt krevende oppgaver.\n\nObjektive funn: Redusert cervikalt ROM, palpatorisk hypertonus, positiv kraniocervikal fleksjonstest.\nPrognose: Usikker for full restitusjon. Varig funksjonsnedsettelse sannsynlig.",
         "rejected": "Klarer ikke å tenke etter ulykken."},
        {"user": "Skriv forsikringserklæring for skulderskade etter sykkelulykke. 45 år kvinne.",
         "chosen": "Erklæring til forsikringsselskap\n\nPasient: [Navn], 45 år kvinne\nSkadedato: [Dato]\nSkademekanisme: Sykkelulykke, falt på utstrakt høyre arm.\n\nSkadeomfang: Rotatorcuff-lesjon høyre skulder. MR viser partiell supraspinatusruptur.\nFunksjonsevne: Kan ikke løfte høyre arm over 90°, smerte ved belastning VAS 6/10, forstyrret nattesøvn.\n\nBehandling: Konservativ rehabilitering med kiropraktisk behandling og øvelsesterapi. 10 behandlinger hittil.\nPrognose: Moderat til god ved fortsatt rehabilitering. Kirurgi kan bli aktuelt ved manglende bedring.\nArbeidsfravær: 4 uker totalt, hvorav 2 uker 100% og 2 uker gradert.",
         "rejected": "Vondt i skulder etter sykling."},
        {"user": "Skriv forsikringserklæring for ryggskade etter fallulykke i butikk. 58 år mann.",
         "chosen": "Erklæring til forsikringsselskap — Ansvarssak\n\nPasient: [Navn], 58 år mann\nSkadedato: [Dato]\nSkadested: [Butikknavn], [Adresse]\nSkademekanisme: Falt på vått gulv uten skilting. Landet på rygg/hale.\n\nSkadeomfang: Kontusjon sakrum/coccyx, akutt korsryggsmerte med funksjonsnedsettelse.\nFunksjonsevne: Smerter ved sitting >20 min, kan ikke løfte >5 kg, forstyrret gange.\n\nBehandling: 8 kiropraktiske konsultasjoner, smertestillende. Gradvis bedring.\nArbeidsfravær: 10 dager 100%, 2 uker gradert tilbakeføring.\nTotale behandlingskostnader: [Beløp] kr.",
         "rejected": "Falt i butikk, vondt i ryggen."},
        {"user": "Skriv forsikringserklæring for knesmerter etter skiulykke. 30 år kvinne.",
         "chosen": "Erklæring til forsikringsselskap — Fritidsforsikring\n\nPasient: [Navn], 30 år kvinne\nSkadedato: [Dato], under alpinkjøring\nSkademekanisme: Vridningstraume høyre kne etter fall i slalåmløype.\n\nKliniske funn: Hevelse høyre kne, positiv McMurray test, smerte medialt. MR viser meniskskade medialt.\nFunksjonsevne: Halter, kan ikke knele, smerte ved trappegange. VAS 5/10.\n\nBehandling: Konservativ behandling med kiropraktikk og rehabilitering. Henvist ortoped for vurdering.\nPrognose: Artroskopi kan bli nødvendig. Rehabiliteringstid 6-12 uker.\nArbeidsfravær: 1 uke så langt.",
         "rejected": "Kne skadet på ski."},
        {"user": "Skriv forsikringserklæring for whiplash med tinnitus. 47 år mann.",
         "chosen": "Erklæring til forsikringsselskap\n\nPasient: [Navn], 47 år mann\nSkadedato: [Dato]\nSkademekanisme: Nakkesleng/whiplash WAD grad II etter påkjørsel bakfra.\n\nSymptomer: Kronisk nakkesmerte, hodepine, tinnitus venstre øre, svimmelhet. Symptomene oppstod innen 48 timer etter ulykken og har vedvart.\nFunksjonsevne: Nedsatt konsentrasjon grunnet tinnitus, kan ikke arbeide i støyende miljøer. Søvnvansker.\n\nObjektive funn: Redusert cervikalt ROM, palpatorisk ømhet SCM og suboccipitalt, audiometri viser normal hørsel men subjektiv tinnitus.\nPrognose: Usikker. Tinnitus kan være varig. Tverrfaglig vurdering anbefalt.",
         "rejected": "Øresus etter bilulykke."},
    ]
    for s in insurance:
        pairs.append(make_pair(SYSTEM_LETTER, s["user"], s["chosen"], s["rejected"]))

    # 2A-4: Physio referrals (10)
    physio_refs = [
        {"user": "Skriv henvisning til fysioterapeut for rehabilitering etter skulderoperasjon.",
         "chosen": "Henvisning til fysioterapeut\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Navn], operert for rotatorcuff-reparasjon [dato].\n\nØnsket rehabilitering: Gradvis opptrening av skulder med fokus på ROM, styrke og funksjon. Følg kirurgens protokoll: 0-6 uker passiv ROM, 6-12 uker aktiv assistert, >12 uker styrketrening. Spesiell forsiktighet med abduksjon og utadrotasjon initialt.",
         "rejected": "Skulderoperert, trenger øvelser."},
        {"user": "Skriv henvisning til fysioterapeut for korsrygg-rehabilitering. Kronisk pasient.",
         "chosen": "Henvisning til fysioterapeut\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Navn], kronisk korsryggsmerte >12 mnd.\n\nØnsket rehabilitering: Strukturert treningsbasert rehabilitering med fokus på motorisk kontroll, progressiv belastning og smertemestring. Anbefaler McGill Big 3 som utgangspunkt, med gradvis overgang til generell styrketrening. Psykososiale faktorer er kartlagt — fryktunngåelse er en faktor.",
         "rejected": "Ryggtrening."},
        {"user": "Skriv henvisning til fysioterapeut for vestibulær rehabilitering etter BPPV.",
         "chosen": "Henvisning til fysioterapeut — Vestibulær rehabilitering\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Navn], gjennomgått BPPV (benign paroksysmal posisjonsvertigo) behandlet med Epley-manøver.\n\nØnsket rehabilitering: Vestibulær rehabilitering med habituasjonsøvelser, balansetrening og blikkstabiliseringsøvelser. Pasienten har residual ustøhet og svimmelhet ved raske hodebevegelser.",
         "rejected": "Svimmelhet, trenger trening."},
        {"user": "Skriv henvisning til fysioterapeut for knerehabilitering etter meniskskade.",
         "chosen": "Henvisning til fysioterapeut\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Navn], konservativt behandlet medial meniskskade høyre kne.\n\nØnsket rehabilitering: Progressiv knerehabilitering med fokus på quadricepsstyrke, hamstringsbalanse og propriosepsjon. Unngå dyp knebøy og rotasjonsbelastning initialt. Mål: Retur til normal aktivitet innen 8-12 uker.",
         "rejected": "Knetrening."},
        {"user": "Skriv henvisning til fysioterapeut for nakke etter whiplash.",
         "chosen": "Henvisning til fysioterapeut\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Navn], nakkesleng WAD grad II, 6 uker etter skade.\n\nØnsket rehabilitering: Cervikalt stabiliseringsprogram med fokus på dyp cervikalfleksor-styrke (kraniocervikal fleksjonstest svak), gradvis ROM-økning og smertemestring. Unngå passiv behandling alene — aktiv tilnærming viktig for prognose.",
         "rejected": "Nakkevondt etter ulykke."},
        {"user": "Skriv henvisning til fysioterapeut for hofteartrose.",
         "chosen": "Henvisning til fysioterapeut\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Navn], 65 år, hofteartrose venstre. Røntgen viser moderat coxartrose.\n\nØnsket rehabilitering: Treningsbasert behandling for hofteartrose i henhold til NICE-retningslinjer. Fokus på styrketrening glutealt og quadriceps, aerob kapasitet og bevegelighetstrening. Vanntrening kan være aktuelt.",
         "rejected": "Slitt hofte."},
        {"user": "Skriv henvisning til fysioterapeut for bekkenbunn etter fødsel.",
         "chosen": "Henvisning til fysioterapeut — Bekkenbunn\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Navn], 32 år, 3 mnd postpartum. Vaginal fødsel med forlenget trykkeperiode.\n\nØnsket rehabilitering: Bekkenbunnstrening med fokus på restitusjon av bekkenbunn og mage. Pasienten rapporterer stressinkontinens og bekkenbunnssmerter. Vurderes for diastase recti.",
         "rejected": "Trenger bekkenbunnstrening."},
        {"user": "Skriv henvisning til fysioterapeut for håndrehabilitering.",
         "chosen": "Henvisning til fysioterapeut / Håndterapeut\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Navn], 50 år, karpaltunnelsyndrom høyre behandlet med skinne og kiropraktikk.\n\nØnsket rehabilitering: Nerveglidende øvelser for n. medianus, seneglideøvelser, styrketrening gripestyrke. Ergonomisk veiledning for arbeidsplass. Pasienten er kontorarbeider.",
         "rejected": "Håndproblemer."},
        {"user": "Skriv henvisning til fysioterapeut for ankelrehabilitering etter forstuing.",
         "chosen": "Henvisning til fysioterapeut\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Navn], 22 år, lateral ankelforstuing grad II venstre, 3 uker siden.\n\nØnsket rehabilitering: Progressiv ankelrehabilitering med proprioseptiv trening, peronealstyring, gradvis vektbæring og sportsspesifikk opptrening. Pasienten er fotballspiller med mål om retur til trening innen 4 uker.",
         "rejected": "Ankeltrening."},
        {"user": "Skriv henvisning til fysioterapeut for respirasjonsfysioterapi.",
         "chosen": "Henvisning til fysioterapeut — Respirasjon\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Navn], 40 år, hyperventilasjonssyndrom med brystsmerter og svimmelhet.\n\nØnsket rehabilitering: Pusteteknikk-opplæring med fokus på diafragmatisk pusting, regulering av pustemønster og avspenning. Pasienten har dysfunksjonelt pustemønster med apikal pust og lav CO2.",
         "rejected": "Pustevansker."},
    ]
    for s in physio_refs:
        pairs.append(make_pair(SYSTEM_LETTER, s["user"], s["chosen"], s["rejected"]))

    # 2A-5: MRI referrals (10)
    mri_refs = [
        {"user": "Skriv henvisning til MR lumbalcolumna for vedvarende radikulopati.",
         "chosen": "Henvisning til MR-undersøkelse\nTil: Radiologisk avdeling\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Navn]\nRekvirert undersøkelse: MR lumbalcolumna\n\nKlinisk informasjon: Vedvarende lumbal radikulopati L5 venstre i 8 uker tross konservativ behandling. Positiv SLR 35°, nedsatt kraft dorsalfleksjon stortå 4/5, dermatomal hypoestesi. Ber om MR for kartlegging av eventuell diskherniering.",
         "rejected": "MRI of the lumbar spine requested."},
        {"user": "Skriv henvisning til MR cervikalcolumna for mistenkt diskherniering.",
         "chosen": "Henvisning til MR-undersøkelse\nTil: Radiologisk avdeling\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Navn], 45 år\nRekvirert undersøkelse: MR cervikal columna\n\nKlinisk informasjon: Cervikal radikulopati C6 høyre med motorisk utfall. Redusert bicepskraft 4/5, hypoestesi laterale underarm. Symptomvarighet 6 uker. Ber om MR for å kartlegge diskherniering eller foraminal stenose C5-C6.",
         "rejected": "Need cervical MRI."},
        {"user": "Skriv henvisning til MR kne for mistenkt meniskskade.",
         "chosen": "Henvisning til MR-undersøkelse\nTil: Radiologisk avdeling\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Navn], 35 år\nRekvirert undersøkelse: MR høyre kne\n\nKlinisk informasjon: Vridningstraume under sport for 3 uker siden. Vedvarende medialt knesmerter, mekanisk låsning. Positiv McMurray medialt, leddlinje-ømhet, lett effusjon. Ber om MR for kartlegging av meniskskade og vurdering av eventuell korsbåndlesjon.",
         "rejected": "Trenger MRI kne."},
        {"user": "Skriv henvisning til MR skulder for mistenkt rotatorcuffskade.",
         "chosen": "Henvisning til MR-undersøkelse\nTil: Radiologisk avdeling\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Navn], 55 år\nRekvirert undersøkelse: MR høyre skulder\n\nKlinisk informasjon: Skuldersmerte etter fall for 4 uker siden. Positiv drop arm test, svak utadrotasjon mot motstand, nattlige smerter. Mistenkt rotatorcuff-lesjon. Ber om MR for å kartlegge omfang av eventuell ruptur.",
         "rejected": "MRI skulder for rotator cuff."},
        {"user": "Skriv henvisning til MR hofte for mistenkt labralskade.",
         "chosen": "Henvisning til MR-undersøkelse\nTil: Radiologisk avdeling\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Namn], 30 år aktiv idrettsutøver\nRekvirert undersøkelse: MR venstre hofte med artrogram\n\nKlinisk informasjon: Lyskesmerte venstre ved rotasjon og dyp fleksjon. Positiv FADIR-test, klikking i hoften. Mistenkt labralskade. Ber om MR med artrogram for kartlegging.",
         "rejected": "Hofteskanning."},
        {"user": "Skriv henvisning til MR lumbal for eldre pasient med progressiv stenose.",
         "chosen": "Henvisning til MR-undersøkelse\nTil: Radiologisk avdeling\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Navn], 70 år\nRekvirert undersøkelse: MR lumbalcolumna\n\nKlinisk informasjon: Progressiv nevrogen claudicatio bilateral. Gangdistanse redusert til 100 meter. Lindring ved fleksjon. Symptomforverring siste 6 mnd. Ber om MR for kartlegging av spinalkanal-diameter og vurdering av dekompresjon.",
         "rejected": "Gammel mann med trange nerver i ryggen."},
        {"user": "Skriv henvisning til MR cervikal for ung pasient med nakkesmerter og hodepine.",
         "chosen": "Henvisning til MR-undersøkelse\nTil: Radiologisk avdeling\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Namn], 25 år\nRekvirert undersøkelse: MR cervikal columna\n\nKlinisk informasjon: 3 mnd nakkesmerter med okksipital hodepine og interscapulær smerte. Ikke respondert på 8 konsultasjoner kiropraktisk behandling. Normal nevrologi, men vedvarende symptomer reiser spørsmål om strukturell patologi. Ber om MR for å utelukke diskpatologi eller annen årsak.",
         "rejected": "Ung med hodepine, ta MRI."},
        {"user": "Skriv henvisning til MR torakalcolumna for brystsmerter.",
         "chosen": "Henvisning til MR-undersøkelse\nTil: Radiologisk avdeling\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Namn], 60 år\nRekvirert undersøkelse: MR torakal columna\n\nKlinisk informasjon: Vedvarende interscapulær smerte og torakal stivhet i 4 mnd. Normal kardiologisk utredning. Progressiv kyfose. Bekymring for osteoporotisk kompresjonsfraktur gitt alder og kjønn. Ber om MR for å utelukke vertebral fraktur.",
         "rejected": "Brystsmerter, ta MRI av ryggen."},
        {"user": "Skriv henvisning til MR for sacroiliacaleddet.",
         "chosen": "Henvisning til MR-undersøkelse\nTil: Radiologisk avdeling\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Namn], 28 år mann\nRekvirert undersøkelse: MR sacroiliacaledd bilateral (inkl. STIR-sekvenser)\n\nKlinisk informasjon: Inflammatorisk ryggsmerte: morgenstivhet >45 min, bedring ved aktivitet, debut <30 år. Positiv FABER og Gaenslens test bilateral. Mistenkt aksial spondylartritt. Ber om MR SI-ledd med STIR for kartlegging av eventuelt beinmargsødem.",
         "rejected": "SI-ledd MRI."},
        {"user": "Skriv henvisning til MR caput for ny hodepine med nevrologiske utfall.",
         "chosen": "Henvisning til MR-undersøkelse — HASTER\nTil: Radiologisk avdeling\nFra: Kiropraktor [Navn]\nDato: [Dato]\n\nPasient: [Namn], 55 år\nRekvirert undersøkelse: MR caput med kontrast\n\nKlinisk informasjon: Nyoppstått hodepine siste 4 uker med progressiv forverring. Kvalme, synsforstyrrelser og lett papilleødem ved oftalmoskopi. Ingen tidligere hodepinehistorikk. Røde flagg for intrakraniell patologi. Ber om hastehenvisning for MR caput med kontrast.",
         "rejected": "Hodepine, ta MRI."},
    ]
    for s in mri_refs:
        pairs.append(make_pair(SYSTEM_LETTER, s["user"], s["chosen"], s["rejected"]))

    # 2A-6: GP summaries (10)
    gp_summaries = [
        {"user": "Skriv epikrise til fastlege etter behandling av kronisk korsryggsmerte.",
         "chosen": "Epikrise til fastlege\n\nFra: Kiropraktor [Navn]\nTil: Fastlege [Navn]\nDato: [Dato]\n\nPasient: [Navn]\nDiagnose: L86 Ryggsyndrom med utstråling\n\nBehandlingsperiode: [Dato]-[Dato], 12 konsultasjoner.\nBehandling: Manuell terapi (mobilisering/manipulasjon L3-L5), bløtdelsteknikker, øvelsesterapi med fokus på motorisk kontroll og progressiv belastning.\n\nResultat: God bedring. VAS redusert fra 7/10 til 2/10. ROM normalisert. Pasienten har returnert til full arbeidskapasitet.\n\nAnbefaling: Vedlikeholdstrening hjemme. Kontroll ved behov.",
         "rejected": "Ryggbehandling ferdig, ble bedre."},
        {"user": "Skriv brev til fastlege om pasient som trenger bildediagnostikk.",
         "chosen": "Brev til fastlege\n\nFra: Kiropraktor [Navn]\nTil: Fastlege [Navn]\nDato: [Dato]\n\nPasient: [Namn]\n\nJeg har behandlet ovennevnte pasient for nakkesmerter med radikulære symptomer i C6-dermatomet. Etter 6 konsultasjoner er det ikke tilfredsstillende bedring, og motorisk utfall (bicepskraft 4/5) har tilkommet. Jeg ber om at det rekvireres MR cervikalcolumna for å kartlegge årsaken, med tanke på eventuell kirurgisk vurdering.",
         "rejected": "Trenger MR, kan du rekvirere?"},
        {"user": "Skriv oppsummering til fastlege for pasient med spenningshodepine.",
         "chosen": "Epikrise til fastlege\n\nFra: Kiropraktor [Navn]\nTil: Fastlege [Navn]\nDato: [Dato]\n\nPasient: [Namn]\nDiagnose: N02 Spenningshodepine\n\nBehandlingsperiode: [Dato]-[Dato], 8 konsultasjoner.\nBehandling: Cervikalt rettet manuell terapi, triggerpunktbehandling suboccipitalt og øvre trapezius, ergonomisk veiledning, øvelser for cervikal stabilisering.\n\nResultat: Hodepinefrekvens redusert fra daglig til 1-2x/uke. Intensitet redusert fra VAS 6 til VAS 3. Pasienten opplever tydelig bedring.\n\nAnbefaling: Fortsatt egenøvelser. Vurder medikamentell profylakse ved tilbakefall.",
         "rejected": "Hodepinebehandling gikk bra."},
        {"user": "Skriv brev til fastlege om bekymring for inflammatorisk ryggsykdom.",
         "chosen": "Brev til fastlege\n\nFra: Kiropraktor [Namn]\nTil: Fastlege [Namn]\nDato: [Dato]\n\nPasient: [Namn], 26 år mann\n\nJeg behandler ovennevnte for korsryggsmerter. Klinisk presentasjon vekker mistanke om inflammatorisk ryggsykdom: debut <30 år, morgenstivhet >45 min, bedring ved aktivitet, verre i hvile. SI-ledds-provokasjonstester positive bilateralt. Ber om blodprøver (CRP, SR, HLA-B27) og eventuell MR SI-ledd for å utelukke aksial spondylartritt. Vennligst vurder revmatologisk henvisning.",
         "rejected": "Ung mann med stiv rygg om morgenen."},
        {"user": "Skriv epikrise til fastlege etter behandling av skuldersmerte.",
         "chosen": "Epikrise til fastlege\n\nFra: Kiropraktor [Navn]\nTil: Fastlege [Navn]\nDato: [Dato]\n\nPasient: [Navn]\nDiagnose: L92 Skuldersyndrom\n\nBehandlingsperiode: [Dato]-[Dato], 10 konsultasjoner.\nBehandling: Manuell terapi (glenohumeralt og cervikothorakalt), rotator cuff-rehabilitering, eksentrisk trening.\n\nResultat: Moderat bedring. Elevasjon økt fra 100° til 155°. VAS fra 6 til 3. Noe vedvarende smerte ved belastning over skulderhøyde.\n\nAnbefaling: Fortsett øvelser. Ultralyd kan vurderes ved manglende videre fremgang.",
         "rejected": "Skulder litt bedre."},
        {"user": "Skriv brev til fastlege om pasient med mistenkt osteoporose.",
         "chosen": "Brev til fastlege\n\nFra: Kiropraktor [Navn]\nTil: Fastlege [Navn]\nDato: [Dato]\n\nPasient: [Navn], 68 år kvinne\n\nOvennevnte pasient presenterer med torakal kyfose og interscapulær smerte. Ved palpasjon er det ømhet over Th7-Th9. Pasienten har høydetap >4 cm siste 10 år. Risikofaktorer: postmenopausal, familiehistorikk for hoftefraktur, lav BMI. Ber om DEXA-scan for osteoporosescreening og røntgen torakalcolumna for å utelukke kompresjonsfraktur.",
         "rejected": "Mulig beinskjørhet."},
        {"user": "Skriv brev til fastlege om uhensiktsmessig medisinbruk hos pasient.",
         "chosen": "Brev til fastlege\n\nFra: Kiropraktor [Navn]\nTil: Fastlege [Navn]\nDato: [Dato]\n\nPasient: [Navn]\n\nJeg ønsker å gjøre oppmerksom på at ovennevnte pasient rapporterer daglig bruk av tramadol og paracetamol/kodein for korsryggsmerter de siste 4 månedene. Pasienten uttrykker selv bekymring for avhengighet. Den kliniske presentasjonen er forenlig med mekanisk korsryggsmerte som responderer godt på manuell behandling og øvelser. Vennligst vurder medikamentgjennomgang og eventuell nedtrappingsplan.",
         "rejected": "Pasienten bruker mye smertestillende."},
        {"user": "Skriv epikrise til fastlege etter behandling av svimmelhet/BPPV.",
         "chosen": "Epikrise til fastlege\n\nFra: Kiropraktor [Navn]\nTil: Fastlege [Navn]\nDato: [Dato]\n\nPasient: [Navn]\nDiagnose: H82 BPPV (benign paroksysmal posisjonsvertigo)\n\nBehandling: 3 konsultasjoner. Dix-Hallpike positiv høyre posterior kanal. Behandlet med Epley-manøver x3. Oppfølgende Dix-Hallpike negativ etter 3. behandling.\n\nResultat: Full symptomfrihet. Pasienten informert om residivrisiko og instruksert i Brandt-Daroff øvelser ved tilbakefall.\n\nAnbefaling: Ingen ytterligere behandling nødvendig. Ny vurdering ved residiv.",
         "rejected": "BPPV behandlet, bra nå."},
        {"user": "Skriv epikrise til fastlege etter kiropraktisk behandling av gravid pasient.",
         "chosen": "Epikrise til fastlege\n\nFra: Kiropraktor [Navn]\nTil: Fastlege [Navn]/Jordmor\nDato: [Dato]\n\nPasient: [Navn], gravid uke 34\nDiagnose: L03 Bekkenrelaterte smerter i svangerskap\n\nBehandling: 6 konsultasjoner med bekkenleddsbehandling, myofascielle teknikker og tilpassede øvelser. Bekkenbelte tilpasset.\n\nResultat: Smerter redusert fra VAS 7 til VAS 3. Gangfunksjon forbedret. Pasienten kan gjennomføre daglige aktiviteter.\n\nAnbefaling: Kontroll etter fødsel for bekkenbunn-vurdering. Kan gjenoppta behandling ved behov postpartum.",
         "rejected": "Gravid med bekkensmerter, behandlet."},
        {"user": "Skriv epikrise til fastlege etter behandling av TMD/kjevesmerter.",
         "chosen": "Epikrise til fastlege\n\nFra: Kiropraktor [Navn]\nTil: Fastlege [Navn]/Tannlege\nDato: [Dato]\n\nPasient: [Navn]\nDiagnose: L18 Kjevesmerter/TMD\n\nBehandling: 6 konsultasjoner. Myofascielle teknikker masseter og pterygoideus, cervikalt rettet mobilisering, biofeedback for bruksisme, øvelser.\n\nResultat: Gapeevne økt fra 28mm til 42mm. Kjevesmerter redusert fra VAS 6 til VAS 2. Krepitasjon vedvarer.\n\nAnbefaling: Tannlege bør vurdere bittskinne ved nattlig bruksisme. Fortsett egentøyning av kjeveleddet.",
         "rejected": "Kjevebehandling OK."},
    ]
    for s in gp_summaries:
        pairs.append(make_pair(SYSTEM_LETTER, s["user"], s["chosen"], s["rejected"]))

    return pairs


# ============================================================
# DIAGNOSIS CODES — 40 pairs
# ============================================================

def generate_diagnosis_pairs():
    pairs = []

    # Primary code preference (20)
    dx_primary = [
        ("Foreslå diagnosekode for skoliose hos 16 år jente.", "ICPC-2: L85 (Ervervede deformiteter rygg). Strukturell skoliose i vekstperiode.", "ICD-10: M41.1 (Juvenil idiopatisk skoliose)."),
        ("Foreslå diagnosekode for karpaltunnelsyndrom hos 45 år kvinne.", "ICPC-2: N93 (Karpaltunnelsyndrom). Kompresjonsneuropati n. medianus.", "ICD-10: G56.0 (Carpal tunnel syndrome)."),
        ("Foreslå diagnosekode for plantar fasciitt hos 55 år mann.", "ICPC-2: L98 (Ervervede deformiteter fot). Plantar fasciopati.", "ICD-10: M72.2 (Plantar fascial fibromatosis)."),
        ("Foreslå diagnosekode for lateral epicondylitt hos 40 år mann.", "ICPC-2: L93 (Tennisalbue). Lateral epicondylalgi/tendinopati.", "ICD-10: M77.1 (Lateral epicondylitis)."),
        ("Foreslå diagnosekode for ankelforstuing hos 22 år kvinne.", "ICPC-2: L77 (Forstuvning/forstrekning ankel). Lateral ligamentskade.", "ICD-10: S93.4 (Ankle sprain)."),
        ("Foreslå diagnosekode for TMD/kjeveproblemer hos 35 år kvinne.", "ICPC-2: L18 (Muskelsmerter). Temporomandibulær dysfunksjon.", "ICD-10: K07.6 (TMJ disorders)."),
        ("Foreslå diagnosekode for BPPV hos 60 år mann.", "ICPC-2: H82 (Svimmelhetssyndromer). Benign paroksysmal posisjonsvertigo.", "ICD-10: H81.1 (Benign paroxysmal vertigo)."),
        ("Foreslå diagnosekode for torticollis hos 30 år kvinne.", "ICPC-2: L83 (Nakkesyndrom). Akutt torticollis, cervikal muskulær dysfunksjon.", "ICD-10: M43.6 (Torticollis)."),
        ("Foreslå diagnosekode for frozen shoulder hos 52 år mann.", "ICPC-2: L92 (Skuldersyndrom). Adhesiv kapsulitt/frozen shoulder.", "ICD-10: M75.0 (Adhesive capsulitis)."),
        ("Foreslå diagnosekode for piriformis syndrom hos 40 år kvinne.", "ICPC-2: L18 (Muskelsmerter). Piriformis syndrom med isjiasliknende symptomer.", "L99 er feil. Bruk M79.1 (Myalgi)."),
        ("Foreslå diagnosekode for hofteartrose hos 65 år mann.", "ICPC-2: L89 (Artrose hofte). Degenerativ coxartrose.", "ICD-10: M16.1 (Primary coxarthrosis)."),
        ("Foreslå diagnosekode for spenningshodepine hos 28 år kvinne.", "ICPC-2: N02 (Spenningshodepine). Kronisk spenningstype hodepine.", "ICD-10: G44.2 (Tension-type headache)."),
        ("Foreslå diagnosekode for migrene hos 35 år kvinne.", "ICPC-2: N89 (Migrene). Migrene uten aura.", "ICD-10: G43.0 (Migraine without aura)."),
        ("Foreslå diagnosekode for isjias hos 48 år mann.", "ICPC-2: L86 (Ryggsyndrom med utstråling). Lumbal radikulopati/isjias.", "ICD-10: M54.3 (Sciatica)."),
        ("Foreslå diagnosekode for costochondritt hos 25 år mann.", "ICPC-2: L04 (Symptomer/plager brystvirvelsøyle). Costochondritt/Tietzes syndrom.", "ICD-10: M94.0 (Tietze syndrome). Feil kodeverk."),
        ("Foreslå diagnosekode for hallux rigidus hos 58 år kvinne.", "ICPC-2: L98 (Ervervede deformiteter fot). Hallux rigidus, degenerativ artrose MTP-1.", "L17 er feil, det er fotsmertesymptom."),
        ("Foreslå diagnosekode for akillestendinopati hos 42 år mann.", "ICPC-2: L98 (Ervervede deformiteter fot). Akillestendinopati, midtporsjon.", "L77 er feil, det er forstuing."),
        ("Foreslå diagnosekode for fibromyalgi hos 45 år kvinne.", "ICPC-2: L18 (Muskelsmerter). Fibromyalgi med utbredte smerter.", "ICD-10: M79.7 (Fibromyalgia)."),
        ("Foreslå diagnosekode for De Quervains tenosynovitt.", "ICPC-2: L94 (Perifer entesopati). De Quervains tenosynovitt, radial styloid.", "L12 er for uspesifikt, bruk L94."),
        ("Foreslå diagnosekode for lyskesmerte hos 20 år fotballspiller.", "ICPC-2: L18 (Muskelsmerter). Lyskesmerte relatert til adduktortendinopati.", "L13 er hoftesymptom, ikke lyskesmerter."),
    ]
    for user, chosen, rejected in dx_primary:
        pairs.append(make_pair(SYSTEM_ICPC, user, chosen, rejected))

    # Multi-code scenarios (10)
    dx_multi = [
        ("Foreslå diagnosekoder for korsryggsmerte med radikulopati.", "ICPC-2: L86 (Ryggsyndrom med utstråling) som hoveddianose, L03 (Symptomer korsrygg) som tilleggsdiagnose for den lokale smerten.", "ICPC-2: L03 (Korsryggsmerte)."),
        ("Foreslå diagnosekoder for nakkesmerte med hodepine.", "ICPC-2: L83 (Nakkesyndrom) og N02 (Spenningshodepine). Cervikogen komponent til hodepine.", "ICPC-2: L83 (Nakkesyndrom)."),
        ("Foreslå diagnosekoder for skulder med cervikalt bidrag.", "ICPC-2: L92 (Skuldersyndrom) og L83 (Nakkesyndrom). Cervikal komponent bidrar til skuldersmerte.", "ICPC-2: L92 (Skuldersyndrom)."),
        ("Foreslå diagnosekoder for bekkensmerte med isjias.", "ICPC-2: L03 (Korsrygg/bekkensymptomer) og L86 (Ryggsyndrom med utstråling). SI-leddsrelatert med isjiaskomponent.", "ICPC-2: L03 (Korsrygg)."),
        ("Foreslå diagnosekoder for migrene og nakkesmerte.", "ICPC-2: N89 (Migrene) og L83 (Nakkesyndrom). Migrene med cervikalt triggerpunkt.", "ICPC-2: N89 (Migrene)."),
        ("Foreslå diagnosekoder for knesmerter med hoftehenvisning.", "ICPC-2: L96 (Kne intern derangement) og L89 (Hofteartrose). Referert smerte fra hofte til kne.", "ICPC-2: L96 (Knesmerter)."),
        ("Foreslå diagnosekoder for svimmelhet med nakkesmerter.", "ICPC-2: N17 (Svimmelhet) og L83 (Nakkesyndrom). Cervikal bidrag til svimmelhet.", "ICPC-2: N17 (Svimmelhet)."),
        ("Foreslå diagnosekoder for torakal smerte med interkostal utstråling.", "ICPC-2: L04 (Symptomer brystvirvelsøyle) og L02 (Ryggsymptom). Thorakal intercostalnevralgi.", "ICPC-2: L04 (Brystsmerter)."),
        ("Foreslå diagnosekoder for karpaltunnel med nakkebidrag.", "ICPC-2: N93 (Karpaltunnelsyndrom) og L83 (Nakkesyndrom). Dobbeltknipe-syndrom med cervikal komponent.", "ICPC-2: N93 (Karpaltunnel)."),
        ("Foreslå diagnosekoder for ankelskade med knesmerte.", "ICPC-2: L77 (Ankelforstuing) og L96 (Knedeangement). Kompensatorisk knebelastning etter ankelskade.", "ICPC-2: L77 (Ankelforstuing)."),
    ]
    for user, chosen, rejected in dx_multi:
        pairs.append(make_pair(SYSTEM_ICPC, user, chosen, rejected))

    # Rare codes (10)
    dx_rare = [
        ("Foreslå diagnosekode for thoracic outlet syndrom.", "ICPC-2: N94 (Perifer nevritt/nevropati). Thoracic outlet syndrom med nevrovaskulær kompresjon.", "L99 (Annet muskuloskeletalt) er for uspesifikt."),
        ("Foreslå diagnosekode for Scheuermanns sykdom.", "ICPC-2: L85 (Ervervede deformiteter rygg). Scheuermanns sykdom med torakal kyfose.", "L84 er uspesifikt ryggproblem."),
        ("Foreslå diagnosekode for patellofemoral smerte.", "ICPC-2: L96 (Kne intern derangement). Patellofemoralt smertesyndrom.", "L15 er bare knesymptom."),
        ("Foreslå diagnosekode for cubital tunnel syndrom.", "ICPC-2: N94 (Perifer nevritt/nevropati). Ulnarisneuropati ved albuen.", "L93 er tennisalbue, feil diagnose."),
        ("Foreslå diagnosekode for Dupuytrens kontraktur.", "ICPC-2: L94 (Perifer entesopati). Dupuytrens kontraktur palmar fascie.", "L12 er bare håndsymptom."),
        ("Foreslå diagnosekode for meralgia paresthetica.", "ICPC-2: N94 (Perifer nevritt/nevropati). Meralgia paresthetica, n. cutaneus femoris lateralis.", "L13 er bare hoftesymptom."),
        ("Foreslå diagnosekode for Mortons nevrom.", "ICPC-2: N94 (Perifer nevritt/nevropati). Mortons nevrom/interdigital nevralgi.", "L98 kan brukes, men N94 er mer presis."),
        ("Foreslå diagnosekode for osteochondritis dissecans kne.", "ICPC-2: L96 (Kne intern derangement). Osteochondritis dissecans mediale femurkondyl.", "L15 er bare symptom, ikke diagnose."),
        ("Foreslå diagnosekode for iliotibialband syndrom.", "ICPC-2: L96 (Kne intern derangement). ITB-syndrom med lateralt knesmerter.", "L18 muskelsmerter kan brukes men er mindre presis."),
        ("Foreslå diagnosekode for trochanter bursitt.", "ICPC-2: L89 (Artrose hofte) eller L13 (Hoftesymptom). Trokanterisk smertesyndrom.", "ICD-10: M70.6 (Trochanteric bursitis). Feil kodeverk."),
    ]
    for user, chosen, rejected in dx_rare:
        pairs.append(make_pair(SYSTEM_ICPC, user, chosen, rejected))

    return pairs


# ============================================================
# RED FLAGS — 40 pairs
# ============================================================

def generate_red_flag_pairs():
    pairs = []

    # Safe cases with "mekanisk" keyword (20)
    safe = [
        ("Vurder røde flagg: 42 år mann, kontorarbeider. Skuldersmerte ved overhead-bevegelser. Positiv Hawkins test, ellers normal nevrologi.",
         "TRYGT: Mekanisk skuldersmerte forenlig med subakromialt impingement. Positiv Hawkins uten nevrologiske utfall indikerer mekanisk årsak. Egnet for kiropraktisk behandling.",
         "HENVIS RUTINE: Positiv impingement-test kan indikere rotatorcuffskade som krever MR-utredning."),
        ("Vurder røde flagg: 35 år kvinne. Korsryggsmerte 2 uker, forverres ved sitting, bedre med bevegelse. Ingen utstråling under kneet.",
         "TRYGT: Mekanisk korsryggsmerte med typisk mekanisk mønster — forverres ved statisk belastning, bedres ved bevegelse. Ingen radikulære tegn. Lav risiko.",
         "MONITORÉR: Korsryggsmerte som ikke bedres innen 2 uker bør utredes med bildediagnostikk."),
        ("Vurder røde flagg: 28 år mann, smerter høyre kne etter fotballkamp. Hevelse, men kan gå. Normal nevrologisk status.",
         "TRYGT: Mekanisk kneskade etter idrettsbelastning. Hevelse og smerte uten nevrologiske utfall er forenlig med bløtdelsskade. Kan behandles konservativt.",
         "HENVIS SAMME DAG: Knehevelse etter traume kan indikere korsbåndskade som krever akutt MR."),
        ("Vurder røde flagg: 55 år kvinne. Nakkestivhet og hodepine i 3 dager etter langvarig skrivearbeid. Ingen feber, ingen nevrologiske utfall.",
         "TRYGT: Mekanisk nakkesmerte med spenningshodepine. Aktivitetsrelatert debut uten systemiske symptomer. Mekaniske årsaker forenlig med ergonomisk overbelastning.",
         "HENVIS RUTINE: Hodepine hos kvinne >50 bør utredes for temporal arteritt med blodprøver."),
        ("Vurder røde flagg: 45 år mann. Torakal smerte venstre side, verst ved dyp innpust og rotasjon. Kjent slitasjegikt.",
         "TRYGT: Mekanisk interkostal smerte. Smertemønsteret med forverring ved pust og rotasjon er typisk mekanisk costovertebralt. Ingen kardiologiske risikofaktorer.",
         "HENVIS SAMME DAG: Brystsmerter venstre side krever kardiologisk utredning for å utelukke hjerteinfarkt."),
        ("Vurder røde flagg: 60 år kvinne. Hoftesmerte ved gange, stivhet om morgenen 10 min. Gradvis debut over 2 år.",
         "TRYGT: Mekanisk hoftesmerte forenlig med degenerativ coxartrose. Kort morgenstivhet (<30 min) og gradvis debut er typisk mekanisk/degenerativ årsak.",
         "HENVIS RUTINE: Hofteaffeksjon hos 60-åring bør undersøkes for avaskular nekrose."),
        ("Vurder røde flagg: 32 år mann, ryggsmerte etter hagearbeid. Akutt debut, unilateral gluteal smerte, intakt kraft og sensibilitet.",
         "TRYGT: Akutt mekanisk korsryggsmerte med somatisk referert smerte til glutealregion. Intakt nevrologi utelukker radikulopati. Mekanisk årsak med god prognose.",
         "MONITORÉR: Gluteal smerte kan indikere piriformis syndrom eller sacroiliacaleddsaffeksjon."),
        ("Vurder røde flagg: 50 år kvinne. Thorakal ryggsmerte mellom skulderbladene. Forverres ved langvarig sitting, bedre ved bevegelse.",
         "TRYGT: Mekanisk interscapulær smerte. Postural belastningssmerte med typisk mekanisk mønster. Ingen systemiske symptomer. Egnet for manuell behandling.",
         "HENVIS RUTINE: Interskapulær smerte kan refereres fra galleblære eller hjerte."),
        ("Vurder røde flagg: 25 år mann, ankelsmerte etter inversjonstraume. Kan belaste, moderat hevelse lateralt.",
         "TRYGT: Mekanisk ankelskade forenlig med lateral ligamentdistorsjon. Kan belaste = Ottawa Ankle Rules negativ. Trygt for konservativ behandling.",
         "HENVIS SAMME DAG: Ankelskade med hevelse krever røntgen for å utelukke fraktur."),
        ("Vurder røde flagg: 38 år kvinne. Albuesmerter lateralt ved grep. Gradvis debut, ingen traume.",
         "TRYGT: Mekanisk lateral epicondylalgi (tennisalbue). Belastningsrelatert tendinopati uten systemiske eller nevrologiske tegn. Trygt for behandling.",
         "MONITORÉR: Lateral albuesmerter kan maskere cervikal radikulopati C6."),
        ("Vurder røde flagg: 48 år mann. Akutt låsning i nakken ved oppvåkning. Kan ikke rotere til venstre, ellers normal nevrologisk status.",
         "TRYGT: Akutt mekanisk torticollis. Typisk presentasjon med akutt nakkelåsning uten traume. Intakt nevrologi utelukker alvorlig patologi. God prognose med behandling.",
         "HENVIS RUTINE: Akutt nakkelåsning kan skyldes cervikal diskherniering."),
        ("Vurder røde flagg: 30 år kvinne. Korsryggsmerter med morgenstivhet 10 min, bedre etter oppvarming. BMI 22, frisk.",
         "TRYGT: Mekanisk korsryggsmerte med kort morgenstivhet. Stivhet under 30 minutter som bedres ved aktivitet er mekanisk, ikke inflammatorisk. Ingen røde flagg.",
         "MONITORÉR: Morgenstivhet hos ung kvinne bør screenes for ankyloserende spondylitt."),
        ("Vurder røde flagg: 58 år mann. Knesmerter ved trappegange. Krepitasjon, litt hevelse. Gradvis over 5 år.",
         "TRYGT: Mekanisk knesmerte forenlig med gonartrose. Langvarig gradvis forløp med krepitasjon er typisk degenerativ årsak. Ingen akutte faresignaler.",
         "HENVIS RUTINE: Kneleddseffusjon bør punkteres for å utelukke infeksjon eller krystallsykdom."),
        ("Vurder røde flagg: 40 år mann. Lyskesmerte etter fotballtrening. Smerter ved adduksjon mot motstand.",
         "TRYGT: Mekanisk lyskesmerte forenlig med adduktortendinopati etter idrettsbelastning. Ingen hernieindikasjon. Trygt for rehabilitering.",
         "HENVIS RUTINE: Lyskesmerte kan skyldes hernie og krever ultralyd."),
        ("Vurder røde flagg: 33 år kvinne. Bekkenleddsmerter, 6 mnd postpartum. Smerte ved ettbensstående.",
         "TRYGT: Mekanisk bekkenleddssmerte postpartum. SI-leddsinstabilitet etter svangerskap er vanlig og mekanisk betinget. Ingen systemiske symptomer.",
         "HENVIS RUTINE: Postpartum bekkensmerter kan skyldes stressfraktur i sakrum."),
        ("Vurder røde flagg: 22 år mann. Skuldersmerter etter styrketrening. Smerte ved abduksjon 60-120 grader.",
         "TRYGT: Mekanisk skuldersmerte med smertebuemønster forenlig med subakromialt impingement. Belastningsrelatert hos ung aktiv person. Ingen alvorlige funn.",
         "HENVIS SAMME DAG: Skuldersmerter etter trening kan indikere labralskade."),
        ("Vurder røde flagg: 65 år mann. Cervikalt foraminalt smerte med utstråling til skulder. Forverres ved cervikalt ekstensjon+rotasjon.",
         "TRYGT: Mekanisk cervikal foraminalstenose. Smertemønsteret med forverring ved ekstensjon og ipsilateral rotasjon (Spurlings-liknende) er typisk mekanisk foraminal irritasjon. Ingen motoriske utfall.",
         "HENVIS SAMME DAG: Cervikal smerte med utstråling hos 65-åring krever MR for å utelukke metastaser."),
        ("Vurder røde flagg: 27 år kvinne. Diffuse korsryggsmerter etter langdistanseløping. Ingen nevrologiske funn.",
         "TRYGT: Mekanisk korsryggsmerte etter idrettsbelastning. Belastningsrelatert uten nevrologiske tegn er benign. Veiledning om treningsmodifisering.",
         "MONITORÉR: Ryggsmerter hos ung løper kan indikere stressfraktur."),
        ("Vurder røde flagg: 52 år mann. Lumbalt fasettleddssyndrom med unilateral smerte, forverres ved ekstensjon.",
         "TRYGT: Mekanisk fasettleddssyndrom. Unilateral smerte forverret ved ekstensjon uten nevrologiske utfall er klassisk mekanisk fasettleddspresentasjon.",
         "HENVIS RUTINE: Unilateral ryggsmerte krever utredning for nyrestein."),
        ("Vurder røde flagg: 44 år kvinne. Plantarfasciemerter ved første steg om morgenen. Gradvis debut.",
         "TRYGT: Mekanisk plantarfasciesmerte. Typisk startsmerte ved plantar fasciopati. Mekanisk belastningsrelatert uten systemiske tegn. Trygt for behandling.",
         "MONITORÉR: Fotsmerter kan skyldes stressfraktur eller nervekompresjon."),
    ]
    for user, chosen, rejected in safe:
        pairs.append(make_pair(SYSTEM_RED_FLAG, user, chosen, rejected))

    # Danger cases with "henvisning" keyword (20)
    danger = [
        ("Vurder røde flagg: 68 år mann med kjent prostatakreft. Ny korsryggsmerte, nattlig, vekttap 5 kg.",
         "HENVIS SAMME DAG: Mistenkt spinal metastase. Nattlig ryggsmerte med vekttap hos pasient med kjent malignitet krever akutt MR og onkologisk henvisning. AKUTT bildediagnostikk nødvendig.",
         "TRYGT: Korsryggsmerte er vanlig og kan behandles konservativt."),
        ("Vurder røde flagg: 55 år kvinne. Plutselig kraftig hodepine, verste noensinne, nakkestivhet.",
         "AKUTT (ring 113): Mistenkt subaraknoidalblødning. Thunderclap-hodepine er SAH inntil motsatt bevist. Akutt henvisning til nevrokirurgisk vurdering og CT caput umiddelbart.",
         "MONITORÉR: Alvorlig hodepine kan skyldes migrene. Prøv smertestillende."),
        ("Vurder røde flagg: 45 år mann. Bilateral beinsvakhet, urinretensjon, sadelbedøvelse.",
         "AKUTT (ring 113): Mistenkt cauda equina syndrom. Tredimensjonal med bilateral motorisk svikt, blæredysfunksjon og sadelhypoestesi krever akutt MR og nevrokirurgisk henvisning innen timer.",
         "MONITORÉR: Nummenhet i setepartiet kan skyldes lang sitting."),
        ("Vurder røde flagg: 72 år mann. Pulserende ryggsmerte som stråler til magen. Hypotensjon.",
         "AKUTT (ring 113): Mistenkt aortaaneurysmeruptur. Pulserende ryggsmerte med abdominal utstråling og hypotensjon er akutt vaskulær katastrofe. Ring 113 for akutt kirurgisk henvisning.",
         "TRYGT: Ryggsmerte med mageutstråling er vanlig muskelsmerte."),
        ("Vurder røde flagg: 40 år kvinne. Nakkesmerte med Horners syndrom (ptose, miose, anhydrose).",
         "HENVIS SAMME DAG: Mistenkt karotisdisseksjon. Nakkesmerte med ipsilateral Horners syndrom er karotisdisseksjon inntil motsatt bevist. Akutt henvisning for CTA nakke. Kontraindikasjon for nakkemanipulasjon.",
         "TRYGT: Horners syndrom kan skyldes muskelkompresjon i nakken."),
        ("Vurder røde flagg: 30 år mann. Ryggsmerte, feber 39°C, IV-rusbruk i anamnesen.",
         "HENVIS SAMME DAG: Mistenkt spinal epidural abscess. Klassisk triade: ryggsmerte + feber + risikofaktor (IV-rusbruk). Akutt henvisning for MR columna og blodkulturer. Antibiotika hastesak.",
         "MONITORÉR: Ryggsmerter med feber, gi paracetamol."),
        ("Vurder røde flagg: 60 år kvinne. Ny temporalhodepine, tyggesmerter, forhøyet SR.",
         "HENVIS SAMME DAG: Mistenkt temporal arteritt (kjempecellearteritt). Unilateral temporalhodepine med tyggesmerter og forhøyet SR er klassisk presentasjon. Akutt henvisning for temporalbiopsi og høydose prednisolon. Risiko for irreversibelt synstap.",
         "TRYGT: Hodepine med kjevesmerter kan skyldes TMD."),
        ("Vurder røde flagg: 25 år mann. Progredierende bilateral hånd- og beinsvakhet over 2 uker.",
         "HENVIS SAMME DAG: Mistenkt Guillain-Barré syndrom. Progredierende ascenderende bilateral svakhet krever akutt nevrologisk henvisning og innleggelse. Risiko for respirasjonsvikt.",
         "MONITORÉR: Bilateral svakhet kan skyldes overtrening."),
        ("Vurder røde flagg: 50 år mann. Ryggsmerte med uforklart vekttap 8 kg over 3 mnd.",
         "HENVIS RUTINE: Mistenkt malignitet. Uforklart vekttap >5% med ryggsmerte krever utredning for spinal tumor eller visceral malignitet. Henvisning for blodprøver, MR columna og CT thorax/abdomen.",
         "TRYGT: Vekttap med ryggsmerte kan skyldes stress."),
        ("Vurder røde flagg: 35 år kvinne. Akutt diplopi, ataksi, dysartri etter nakkemanipulasjon.",
         "AKUTT (ring 113): Mistenkt vertebrobasilær disseksjon med hjernestamme-ischemi. Akutte nevrologiske utfall etter nakkebehandling krever umiddelbar akutt henvisning til sykehus for CTA og nevrologisk vurdering.",
         "MONITORÉR: Forbigående svimmelhet etter nakkebehandling er normalt."),
        ("Vurder røde flagg: 8 år gutt. Nakkesmerter etter fall fra klatrestativ. Holder hodet stivt.",
         "HENVIS SAMME DAG: Mistenkt cervikal fraktur eller ligamentskade hos barn. Traumemekanisme med nakkestivhet krever bildediagnostikk. Immobiliser. Akutt henvisning til barneavdeling.",
         "TRYGT: Nakkesmerter hos barn etter lek er vanlig muskelstrekk."),
        ("Vurder røde flagg: 58 år mann. Høyre beinsmerte, hevelse, rødhet, nylig langdistanseflyvning.",
         "HENVIS SAMME DAG: Mistenkt dyp venetrombose (DVT). Unilateral beinsmerte med hevelse og rødhet etter langvarig immobilitet har høy DVT-risiko. Akutt henvisning for ultralyd og D-dimer.",
         "TRYGT: Beinsmerte med hevelse er muskelkrampe."),
        ("Vurder røde flagg: 44 år kvinne. Progressiv bilateral fotdropp over 4 uker.",
         "HENVIS SAMME DAG: Mistenkt alvorlig lumbal patologi eller perifer nevropati. Bilateral fotdropp er alvorlig nevrologisk utfall som krever akutt MR og nevrologisk henvisning for å utelukke cauda equina eller polyradikulopati.",
         "MONITORÉR: Bilateral fotsvakhet kan skyldes deconditionering."),
        ("Vurder røde flagg: 70 år mann. Kraftig brystsmerte med utstråling til venstre arm og kjeve, svetter.",
         "AKUTT (ring 113): Mistenkt akutt myokardinfarkt. Brystsmerter med armstråling, kjevesmerte og diaporese er hjerteinfarkt inntil motsatt bevist. Ring 113 umiddelbart. Akutt kardiologisk henvisning.",
         "TRYGT: Brystsmerter kan skyldes costochondritt."),
        ("Vurder røde flagg: 65 år kvinne. Ryggsmerte etter minimalt traume, bruker steroider kronisk.",
         "HENVIS RUTINE: Mistenkt osteoporotisk kompresjonsfraktur. Ryggsmerte etter minimalt traume hos steroidbruker har høy frakturrisiko. Henvisning for røntgen/MR columna og DEXA.",
         "TRYGT: Ryggsmerter etter lett traume er vanlig muskelstrekk."),
        ("Vurder røde flagg: 42 år mann. Ensidig pulserende hodepine med aura, plutselig debut, verste hodepine.",
         "HENVIS SAMME DAG: Thunderclap-hodepine med plutselig debut krever akutt utredning. Selv med auraliknende symptomer må subaraknoidalblødning og disseksjon utelukkes. Akutt CT og eventuelt LP. Henvisning til nevrologisk akuttvurdering.",
         "TRYGT: Migrene med aura, vanlig og ufarlig."),
        ("Vurder røde flagg: 55 år mann. Nattlige ryggsmerter som vekker fra søvn, ikke relatert til stilling.",
         "HENVIS RUTINE: Nattlige smerter som ikke er stillingsavhengige er rødt flagg for tumor, infeksjon eller inflammatorisk sykdom. Krever utvidet blodprøver og MR columna. Henvisning for utredning.",
         "TRYGT: Nattlige smerter skyldes ofte dårlig madrass."),
        ("Vurder røde flagg: 38 år kvinne. Akutt svimmelhet, nystagmus, hørselstap, øresus.",
         "HENVIS SAMME DAG: Mistenkt akutt vestibulær patologi. Kombinasjonen svimmelhet + hørselstap + tinnitus kan indikere Ménières sykdom, labyrintitt eller akustikusnevrinom. Akutt ØNH-henvisning for audiometri og MR indre øre.",
         "TRYGT: Svimmelhet med øresus er vanlig BPPV."),
        ("Vurder røde flagg: 48 år mann. Progredierende gangvansker, spastisitet i bena, blæreurgency.",
         "HENVIS SAMME DAG: Mistenkt cervikal myelopati. Gangvansker med øvre motornevron-tegn og blæredysfunksjon krever akutt MR cervikalcolumna. Akutt nevrokirurgisk henvisning for vurdering av dekompresjon.",
         "MONITORÉR: Gangvansker kan skyldes aldringsrelaterte forandringer."),
        ("Vurder røde flagg: 62 år kvinne. Nyoppstått ansiktsnummenhet, svelgevansker, diplopi.",
         "AKUTT (ring 113): Mistenkt hjernestammeslag. Akutte kranienerveutfall med svelgevansker og diplopi krever umiddelbar akutt henvisning til slagavdeling. Ring 113. Trombolyse kan være indisert innen 4,5 timer.",
         "MONITORÉR: Ansiktsnummenhet kan skyldes trigeminusnevralgi."),
    ]
    for user, chosen, rejected in danger:
        pairs.append(make_pair(SYSTEM_RED_FLAG, user, chosen, rejected))

    return pairs


# ============================================================
# COMMUNICATION — 40 pairs
# ============================================================

def generate_communication_pairs():
    pairs = []

    # Length-appropriate SMS (20)
    sms = [
        ("Skriv SMS-påminnelse for time i morgen kl. 09:00.",
         "Påminnelse: Du har time hos Klinikken i morgen kl. 09:00. Vennligst gi beskjed om du ikke kan komme. Mvh Klinikken",
         "Hei! Vi ønsker bare å minne deg på at du har en avtalt konsultasjon hos oss i morgen tidlig klokken 09:00. Det er veldig viktig for oss at du kommer, men dersom du av ulike årsaker ikke har mulighet til å møte opp, ber vi deg vennligst om å gi oss beskjed i god tid slik at vi kan tilby timen til en annen pasient som venter."),
        ("Skriv SMS om at pasienten bør avbestille timen hvis de er syke.",
         "Hei! Er du forkjølet eller har feber, vennligst avbestill timen din så vi kan gi den til en annen pasient. Ring 22 XX XX XX eller avbestill via nettbooking. Mvh Klinikken",
         "A"),
        ("Skriv SMS om hjemmeøvelser etter behandling.",
         "Husk hjemmeøvelsene dine! Gjør øvelsene 2x daglig som instruert. Tøyning: hold 30 sek, gjenta 3 ganger. Styrke: 3x10 repetisjoner. Kontakt oss ved spørsmål. Mvh Klinikken",
         "Hei, husk å gjøre øvelser."),
        ("Skriv SMS for oppfølgingstime etter 4 uker.",
         "Hei [Navn]! Det er 4 uker siden siste behandling. Vi anbefaler en kontrolltime for å vurdere fremgangen din. Book enkelt online: [link]. Mvh Klinikken",
         "Du burde komme tilbake."),
        ("Skriv SMS om at klinikken har åpnet ny kveldstid.",
         "Nyhet: Vi tilbyr nå kveldstimer onsdager kl. 17:00-20:00! Book din time online eller ring 22 XX XX XX. Mvh Klinikken",
         "Vi har nå utvidet våre åpningstider og er glade for å kunne meddele at vi heretter tilbyr konsultasjoner også på onsdagskveldene mellom klokken 17:00 og 20:00. Dette gir deg som pasient enda større fleksibilitet."),
        ("Skriv bursdags-SMS til pasient.",
         "Gratulerer med dagen, [Navn]! Vi i Klinikken ønsker deg en fantastisk bursdag. Mvh Klinikken",
         "G"),
        ("Skriv SMS om forsikringsdokumentasjon.",
         "Hei [Navn]! Erklæringen til forsikringsselskapet ditt er sendt til din e-post. Gi beskjed om du trenger tilleggsdokumentasjon. Mvh Klinikken",
         "Forsikringsdokumenter er klare, vi har sendt erklæring til forsikring."),
        ("Skriv SMS om ledig time i dag kl. 14:30.",
         "Ledig time i dag kl. 14:30! Ønsker du å komme? Svar JA eller ring 22 XX XX XX. Mvh Klinikken",
         "Vi har fått en avbestilling og har nå en ledig time i dag klokken 14:30. Dersom du er interessert i å benytte deg av denne timen, vennligst svar på denne meldingen med JA."),
        ("Skriv SMS om at operasjon-forberedelse er viktig.",
         "Hei [Navn]! Før operasjonen din er det viktig med pre-hab øvelser. Fortsett øvelsesprogrammet daglig for best mulig resultat. Spørsmål? Ring oss. Mvh Klinikken",
         "Trening før operasjon."),
        ("Skriv SMS om at røntgenbilder er klare.",
         "Hei [Navn]! Røntgenbildene dine er klare. Resultatene gjennomgås ved neste konsultasjon [dato] kl. [tid]. Mvh Klinikken",
         "Bilder ferdige."),
        ("Skriv SMS-påminnelse for time kl. 10:00 overmorgen.",
         "Påminnelse: Time hos Klinikken [dato] kl. 10:00. Husk å ta med eventuelle MR-bilder eller prøvesvar. Mvh Klinikken",
         "Time kl 10."),
        ("Skriv SMS om at ventelisten har plass.",
         "Hei [Navn]! En time har blitt ledig [dato] kl. [tid]. Ønsker du timen? Svar innen kl. 12:00 i dag. Mvh Klinikken",
         "Ledig time."),
        ("Skriv SMS om bekkenbeltebruk etter behandling.",
         "Hei [Navn]! Bruk bekkenbeltet som instruert: 2 timer om gangen, spesielt ved gange og aktivitet. Ikke bruk det om natten. Kontakt oss ved spørsmål. Mvh Klinikken",
         "B"),
        ("Skriv SMS for å informere om ny behandler.",
         "Hei [Navn]! Ved din neste time [dato] vil du bli behandlet av [Behandler], som overtar fra [Gammel behandler]. Samme høye kvalitet. Mvh Klinikken",
         "Ny behandler neste gang."),
        ("Skriv SMS om endring av klokkeslett.",
         "Hei [Navn]! Vi må dessverre endre timen din fra kl. 09:00 til kl. 10:00 [dato]. Passer det? Svar eller ring 22 XX XX XX. Mvh Klinikken",
         "Timeendring."),
        ("Skriv SMS om at trening er viktig for rehabilitering.",
         "Hei [Navn]! Regelmessig trening er nøkkelen til god rehabilitering. Husk øvelsene 2x daglig. Neste time: [dato] kl. [tid]. Mvh Klinikken",
         "Tren mer."),
        ("Skriv SMS til ny pasient som nettopp har booket.",
         "Velkommen til Klinikken, [Navn]! Din førstekonsultasjon er [dato] kl. [tid]. Ta med legitimasjon og eventuelle røntgenbilder. Førstekonsultasjon varer ca. 45 min. Mvh Klinikken",
         "Ny time booket."),
        ("Skriv SMS om at det er viktig å fullføre behandlingsplanen.",
         "Hei [Navn]! For best resultat anbefaler vi å fullføre behandlingsplanen. Du har 2 behandlinger igjen. Book neste time: [link]. Mvh Klinikken",
         "Fullfør behandlingen."),
        ("Skriv SMS om årskontrollen.",
         "Hei [Navn]! Det er tid for din årlige kontroll. En oppfølgingstime sikrer at du holder deg i form. Book enkelt online: [link]. Mvh Klinikken",
         "K"),
        ("Skriv SMS om sommerferiestengning.",
         "Klinikken holder sommerferie [dato]-[dato]. Ved akutt behov, kontakt legevakt 116117. Vi gleder oss til å se deg igjen! Mvh Klinikken",
         "Ferie."),
    ]
    for user, chosen, rejected in sms:
        pairs.append(make_pair(SYSTEM_COMMS, user, chosen, rejected))

    # Keyword-specific (20)
    keyword_sms = [
        ("Skriv SMS til pasient som bør avbestille pga. smittefare.",
         "Har du forkjølelse, feber eller magesyke? Vennligst avbestill timen din for å beskytte andre pasienter. Avbestill via nettbooking eller ring 22 XX XX XX. Mvh Klinikken",
         "Ikke kom hvis du er syk."),
        ("Skriv SMS om øvelser for nakken.",
         "Hei [Navn]! Her er øvelsene for nakken din: 1) Hakeinntak 10x3, 2) Isometrisk sidebøy 10x3, 3) Tøyning trapezius 30s x3. Gjør øvelsene morgen og kveld. Mvh Klinikken",
         "Tøy nakken."),
        ("Skriv SMS om forsikringssak.",
         "Hei [Navn]! Vi har mottatt forespørselen fra forsikringsselskapet. Erklæringen er under arbeid og sendes innen 5 virkedager. Mvh Klinikken",
         "Forsikringsting er påbegynt."),
        ("Skriv SMS om kontrolltime om 3 mnd.",
         "Hei [Navn]! Vi anbefaler en kontrolltime om 3 måneder for vedlikehold. Book din oppfølgingstime online: [link]. Mvh Klinikken",
         "Kom tilbake om litt."),
        ("Skriv SMS om forberedelse til operasjon.",
         "Hei [Navn]! Før operasjonen er det viktig å fortsette med øvelsene og unngå NSAIDs siste uke. Ta med MR-bilder til kirurgen. Lykke til! Mvh Klinikken",
         "Forbered deg til operasjonen."),
        ("Skriv SMS om bekkenøvelser for gravid pasient.",
         "Hei [Navn]! Fortsett med bekkenøvelsene daglig: 1) Bekkenvipp 10x3, 2) Kneklem med ball 10x3, 3) Sideplanke 20s x3. Bruk bekkenbeltet ved gange. Mvh Klinikken",
         "Gjør bekkentreningsøvelser."),
        ("Skriv SMS om tidlig morgentid kl. 08:00.",
         "Påminnelse: Time i morgen kl. 08:00. Klinikken åpner kl. 07:50. Vennligst vær presis. Mvh Klinikken",
         "Tidlig time."),
        ("Skriv SMS om at det er ledig time kl. 09:00 i morgen.",
         "Ledig time i morgen kl. 09:00! Passer det for deg? Svar raskt så vi kan reservere plassen. Mvh Klinikken",
         "Mulig time i morgen."),
        ("Skriv SMS om hjemmeøvelser for skulder.",
         "Hei [Navn]! Skulderøvelsene dine: 1) Pendel 2 min, 2) Utadrotasjon med strikk 3x15, 3) Vegg-push-ups 3x10. Unngå tunge løft over skulder. Gjør øvelsene daglig. Mvh Klinikken",
         "Tren skulderen."),
        ("Skriv SMS om avbestilling og venteliste.",
         "Hei [Navn]! Vi har registrert din avbestilling for [dato]. Du er satt på venteliste for en tidligere time. Vi gir beskjed om noe åpner seg. Mvh Klinikken",
         "Avbestilt."),
        ("Skriv SMS om at pasienten trenger å avbestille 24 timer i forveien.",
         "Påminnelse: Avbestilling må skje minst 24 timer før timen. Avbestill via nettbooking eller ring 22 XX XX XX. Sen avbestilling kan medføre gebyr. Mvh Klinikken",
         "24 timers frist for å avbestille time hos oss."),
        ("Skriv SMS om at pasienten bør ta med forsikringspapirer.",
         "Hei [Navn]! Til neste time, ta med forsikringsdokumentasjon og eventuelt referansenummer fra forsikringsselskapet. Mvh Klinikken",
         "Ta med forsikringsting."),
        ("Skriv SMS om årskontroll og forebygging.",
         "Hei [Navn]! Årskontroll forebygger tilbakefall. Vi anbefaler en kontroll hvert halvår for vedlikehold av god rygghelse. Book online: [link]. Mvh Klinikken",
         "Kontrolltime."),
        ("Skriv SMS om operasjon-oppfølging.",
         "Hei [Navn]! Hvordan går det etter operasjonen? Vi anbefaler en vurdering hos oss 4-6 uker post-op for å starte rehabiliteringen. Book time: [link]. Mvh Klinikken",
         "Oppfølging etter operasjon nødvendig."),
        ("Skriv SMS om time kl. 14:30 neste uke.",
         "Påminnelse: Time hos Klinikken [dato] kl. 14:30. Ta med treningsklær om du ønsker øvelsesinstruksjon. Mvh Klinikken",
         "Time 14:30."),
        ("Skriv SMS om bekkenbelte-instruksjoner.",
         "Hei [Navn]! Bekkenbeltet brukes 2-3 timer daglig, spesielt ved gange og aktivitet. Plasser det rundt bekkenringen, under hoftekammen. Ikke for stramt! Mvh Klinikken",
         "Bruk beltet."),
        ("Skriv SMS om endret øvelsesplan.",
         "Hei [Navn]! Vi har oppdatert øvelsesprogrammet ditt. De nye øvelsene fokuserer på styrke og stabilitet. Se vedlagt PDF eller be om instruksjoner ved neste time. Mvh Klinikken",
         "Nye øvelser."),
        ("Skriv SMS om at klinikken anbefaler MR.",
         "Hei [Navn]! Vi anbefaler MR-undersøkelse for videre utredning. Be fastlegen din om henvisning, eller ring oss for veiledning. Mvh Klinikken",
         "Trenger MR."),
        ("Skriv SMS om tidlig morgentime kl. 07:30.",
         "Tidlig time i morgen kl. 07:30! Klinikken åpner kl. 07:20. Kaffe er klar! Mvh Klinikken",
         "Time kl 0730."),
        ("Skriv SMS om at forsikringserklæring er ferdig.",
         "Hei [Namn]! Erklæringen til forsikringsselskapet er ferdig og sendt til din e-post. Kontakt oss om du trenger endringer. Mvh Klinikken",
         "Forsikringserklæring ferdig."),
    ]
    for user, chosen, rejected in keyword_sms:
        pairs.append(make_pair(SYSTEM_COMMS, user, chosen, rejected))

    return pairs


# ============================================================
# QUICK FIELDS — 20 pairs
# ============================================================

def generate_quick_field_pairs():
    pairs = []

    quick = [
        ("Generer behandlingsmål. Maks 50 tegn.", "Smertefri ROM cervikal, full arbeidsdeltakelse", "Bli bedre"),
        ("Generer kort hovedklage.", "Akutt korsryggsmerte med gluteal utstråling, VAS 7/10", "Vondt i ryggen"),
        ("Generer kort objektiv funn for nakke.", "Cervikal hypomobilitet C4-C5, hypertonus øvre trapezius bilat, Spurling neg", "Stiv nakke og ømme muskler i skulder- og nakkeregionen ved palpasjon og undersøkelse av pasienten i dag"),
        ("Generer kort diagnose-oppsummering.", "L86 Lumbalt radikulopati L5 sin, mekanisk", "Ryggproblemer med utstråling"),
        ("Generer behandlingsnotat. Maks 80 tegn.", "Manipulasjon Th4-Th5, bløtdelsteknikk paravertebral, McKenzie ekstensjon", "Behandlet ryggen"),
        ("Generer funn for skulderundersøkelse.", "Hawkins pos, Neer pos, Empty can 4/5, full passiv ROM, Speed neg", "Tester var positive og negative i skulderen med noe redusert kraft og smerte ved bevegelse og provokasjon"),
        ("Generer funn for kneundersøkelse.", "McMurray neg bilat, Lachman neg, valgus/varus stabile, krepitasjon medialt", "Kneet er undersøkt"),
        ("Generer kort behandlingsrespons.", "God respons, VAS 7→3, ROM normalisert, ADL forbedret etter 4 beh", "Mye bedre"),
        ("Generer kort SLR-funn.", "SLR pos 40° venstre med dermatomal utstråling L5, neg høyre", "SLR test utført"),
        ("Generer kort cervikalt ROM-funn.", "Fleksjon 40°(50), ekstensjon 50°(60), rotasjon 60°/65°(80), sidebøy 35°/30°(45)", "Nedsatt bevegelighet i nakken i alle retninger sammenlignet med normalverdier"),
        ("Generer kort behandlingsplan.", "6 beh/3 uker: mobilisering L3-S1, øvelser motorisk kontroll, ergonomisk rådgivning", "Skal behandle pasienten et antall ganger over en periode og gi øvelser"),
        ("Generer kort prognose.", "God prognose, forventet full bedring innen 6-8 uker med aktiv rehabilitering", "Bra prognose"),
        ("Generer kort risikofaktor-notat.", "Risikofaktorer: sedentær livsstil, ergonomisk ugunstig arbeidsplass, BMI 31", "Overvektig og sitter mye"),
        ("Generer kort ortopedisk test-resultat for hofte.", "FADIR pos venstre, FABER pos venstre, Trendelenburg neg, Thomas neg bilat", "Hoftetestene viste noen positive funn på venstre side og normale funn ellers"),
        ("Generer funn for thorakal undersøkelse.", "Segmentær hypomobilitet Th6-Th8, ømhet costovertebralt bilat, Adson neg", "Stiv i brystet"),
        ("Generer kort epikrisesammendrag.", "12 beh over 8 uker. VAS 8→2. Full ROM. Retur arbeid. Vedlikeholdstrening anbefalt.", "Behandlet ferdig"),
        ("Generer kort palpasjonsfunn lumbal.", "L4-L5 hypomobil, L5-S1 ømhet, paravertebral spasme bilat L3-S1, SI-ledd ømhet sin", "Ømt og stivt i nedre del av ryggen ved palpasjon av de aktuelle segmentene og musklene"),
        ("Generer kort tiltak-notat.", "Mobilisering C5-C6, triggerpunkt SCM sin, chin tuck øvelse, ergonomi-rådgivning", "Behandling gitt"),
        ("Generer kort komplikasjonsnotat.", "Lett ømhet 24-48t post-behandling, normal reaksjon. Ingen alvorlige komplikasjoner.", "Ble litt øm"),
        ("Generer kort screeningsresultat.", "STarT Back: lav risiko (3/9), Örebro: 42/100 (lav-moderat), NDI: 28% (moderat)", "Screeninger utført med akseptable resultater som indikerer moderat påvirkning"),
    ]
    for user, chosen, rejected in quick:
        pairs.append(make_pair(SYSTEM_QUICK, user, chosen, rejected))

    return pairs


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 60)
    print("  Generating v6 targeted DPO pairs")
    print("=" * 60)

    all_pairs = []

    letter_pairs = generate_letter_pairs()
    print(f"  Letters:          {len(letter_pairs)}")
    all_pairs.extend(letter_pairs)

    dx_pairs = generate_diagnosis_pairs()
    print(f"  Diagnosis codes:  {len(dx_pairs)}")
    all_pairs.extend(dx_pairs)

    rf_pairs = generate_red_flag_pairs()
    print(f"  Red flags:        {len(rf_pairs)}")
    all_pairs.extend(rf_pairs)

    comms_pairs = generate_communication_pairs()
    print(f"  Communication:    {len(comms_pairs)}")
    all_pairs.extend(comms_pairs)

    quick_pairs = generate_quick_field_pairs()
    print(f"  Quick fields:     {len(quick_pairs)}")
    all_pairs.extend(quick_pairs)

    total = len(all_pairs)
    print(f"\n  Total:            {total}")

    # Validate
    errors = 0
    for pair in all_pairs:
        if not pair.get("prompt") or not pair.get("chosen") or not pair.get("rejected"):
            errors += 1
        if pair.get("chosen") == pair.get("rejected"):
            errors += 1
    print(f"  Validation errors: {errors}")

    # Write output
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / "v6_targeted.jsonl"
    with open(out_path, "w", encoding="utf-8") as f:
        for pair in all_pairs:
            f.write(json.dumps(pair, ensure_ascii=False) + "\n")

    print(f"\n  Output: {out_path}")
    print(f"  Size:   {out_path.stat().st_size / 1024:.1f} KB")
    print("=" * 60)

    return 0 if errors == 0 else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
