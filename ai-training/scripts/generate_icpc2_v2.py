#!/usr/bin/env python3
"""
Generate ICPC-2 diagnosis code training data v2 — targeting model weaknesses.

The existing generate_icpc2_codes.py has ~500 examples. This script generates
~300 ADDITIONAL examples specifically addressing the model's 37.5% pass rate
on ICPC-2 codes, with heavy emphasis on ICPC-2 vs ICD-10 disambiguation.

Categories (100 each):
  1. ICPC-2 vs ICD-10 Disambiguation — the #1 failure mode
  2. Code Hierarchy and Specificity — adjacent code distinctions
  3. Common Chiropractic ICPC-2 Codes — varied clinical presentations

Output file: ai-training/data/mined/icpc2-v2-synthetic.jsonl

Usage:
    python scripts/generate_icpc2_v2.py
    python scripts/generate_icpc2_v2.py --count  # Just count, don't write
"""

import json
import os
import random
import sys
from pathlib import Path

OUTPUT_FILE = Path(__file__).parent.parent / 'data' / 'mined' / 'icpc2-v2-synthetic.jsonl'

# =============================================================================
# SYSTEM PROMPTS
# =============================================================================

SYSTEM_STANDARD = (
    "Du er en diagnosekode-spesialist for kiropraktikk i Norge. "
    "Du hjelper med å velge riktige ICPC-2 koder basert på kliniske funn og symptomer. "
    "Gi alltid koden først, deretter kort forklaring."
)

SYSTEM_DISAMBIGUATION = (
    "Du er en diagnosekode-spesialist for kiropraktikk i Norge. "
    "Bruk KUN ICPC-2 kodeverk. IKKE bruk ICD-10 koder (som M54, G43, S83 etc). "
    "ICPC-2 koder starter med bokstav + 2 sifre (f.eks. L86, N02, H82)."
)

SYSTEM_JSON = (
    "Du er en klinisk AI-assistent som returnerer strukturerte diagnosekoder. "
    "Svar alltid i JSON-format med feltene: primary_code, primary_label, "
    "differential_codes (array), og clinical_reasoning."
)


def make_example(system, user, assistant):
    """Create a ChatML training example."""
    return {
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
            {"role": "assistant", "content": assistant},
        ]
    }


# =============================================================================
# CATEGORY 1: ICPC-2 vs ICD-10 DISAMBIGUATION (100 examples)
# =============================================================================

DISAMBIGUATION_EXAMPLES = [
    # --- L03 vs M54.5 (Low back pain) ---
    (
        "Hva er riktig ICPC-2 kode for korsryggsmerter?",
        "L03 — Korsryggsmerter uten utstråling\n\nICPC-2 koden er L03 for uspesifikke korsryggsmerter. NB: ICD-10 koden for dette er M54.5, men i ICPC-2 brukes L03."
    ),
    (
        "Pasient med akutte korsryggsmerter. Gi meg ICPC-2 kode, ikke ICD-10.",
        "L03 — Korsryggsmerter uten utstråling\n\nRiktig ICPC-2 kode er L03. NB: ICD-10 koden M54.5 (lumbago) er FEIL kodeverk. I ICPC-2 brukes L03 for akutte korsryggsmerter."
    ),
    (
        "Er M54.5 riktig kode for lumbago i ICPC-2?",
        "Nei. M54.5 er en ICD-10 kode, IKKE ICPC-2.\n\nRiktig ICPC-2 kode er L03 — Korsryggsmerter uten utstråling. ICPC-2 koder har format bokstav + 2 sifre (L03), mens ICD-10 har bokstav + 2-3 sifre + punkt (M54.5)."
    ),
    (
        "Lumbago uten utstråling, ICPC-2 kode?",
        "L03 — Korsryggsmerter uten utstråling\n\nL03 er riktig ICPC-2. NB: ICD-10 koden M54.5 skal IKKE brukes i ICPC-2 kodeverk."
    ),
    (
        "Kode for uspesifikke korsryggsmerter i ICPC-2 systemet?",
        "L03 — Korsryggsmerter uten utstråling\n\nICPC-2 koden er L03. Ikke forveksle med ICD-10 M54.5. ICPC-2 koder bruker alltid bokstav + 2 sifre."
    ),
    (
        "Hva er forskjellen mellom M54.5 og L03?",
        "M54.5 og L03 beskriver begge korsryggsmerter, men tilhører ulike kodeverk:\n\n- M54.5 = ICD-10 (brukes på sykehus)\n- L03 = ICPC-2 (brukes i primærhelsetjenesten/kiropraktikk)\n\nI kiropraktorpraksis brukes ALLTID L03."
    ),

    # --- L86 vs M54.1/M51.1 (Radiculopathy/disc) ---
    (
        "Lumbal radikulopati med utstråling til bein. ICPC-2 kode?",
        "L86 — Lumbalt ryggsyndrom med utstråling\n\nRiktig ICPC-2 kode er L86. NB: ICD-10 kodene M54.1 (radikulopati) og M51.1 (lumbal skiveprolaps) skal IKKE brukes. I ICPC-2 brukes L86."
    ),
    (
        "Skiveprolaps med isjas. Hvilken ICPC-2 kode bruker jeg?",
        "L86 — Lumbalt ryggsyndrom med utstråling\n\nL86 dekker skiveprolaps med radikulopati i ICPC-2. NB: ICD-10 koden M51.1 er FEIL kodeverk. ICPC-2 bruker L86 for alle lumbale ryggsyndromer med utstråling."
    ),
    (
        "Er M51.1 en ICPC-2 kode for diskusprolaps?",
        "Nei. M51.1 er ICD-10, IKKE ICPC-2.\n\nRiktig ICPC-2 kode er L86 — Lumbalt ryggsyndrom med utstråling. Koden dekker skiveprolaps, spinal stenose og andre årsaker til lumbal radikulopati."
    ),
    (
        "Pasient med positiv SLR og L5-radikulopati. ICPC-2?",
        "L86 — Lumbalt ryggsyndrom med utstråling\n\nL86 er korrekt ICPC-2 kode. NB: ICD-10 koden M54.1 (radikulopati) brukes IKKE i ICPC-2. Dokumentér nivå i fritekst."
    ),
    (
        "Hva er ICPC-2 ekvivalenten til ICD-10 M54.1?",
        "ICD-10 M54.1 (radikulopati) tilsvarer ICPC-2 L86 — Lumbalt ryggsyndrom med utstråling.\n\nI ICPC-2 skilles det ikke mellom årsaker til radikulopati (prolaps vs stenose) — alt kodes L86."
    ),

    # --- L83 vs M54.2 (Cervicalgia/neck) ---
    (
        "Nakkesmerter med stivhet. Korrekt ICPC-2 kode?",
        "L83 — Nakkesyndromer\n\nL83 er riktig ICPC-2 kode for nakkesmerter med stivhet. NB: ICD-10 koden M54.2 (cervikalgi) er FEIL kodeverk. I ICPC-2 brukes L83."
    ),
    (
        "Cervikalt myalgi. ICPC-2 kode, ikke ICD-10.",
        "L83 — Nakkesyndromer\n\nICPC-2 kode L83 for cervikalt myalgi/nakkesyndrom. NB: ICD-10 M54.2 skal IKKE brukes i kiropraktorpraksis."
    ),
    (
        "Er M54.2 en gyldig ICPC-2 kode?",
        "Nei. M54.2 er en ICD-10 kode for cervikalgi.\n\nRiktig ICPC-2 kode er L83 — Nakkesyndromer. ICPC-2 koder har ALLTID format: bokstav + 2 sifre (ingen punktum)."
    ),
    (
        "Hva tilsvarer ICD-10 M54.2 i ICPC-2?",
        "ICD-10 M54.2 (cervikalgi) tilsvarer ICPC-2 L83 — Nakkesyndromer.\n\nL83 er en bredere kode som dekker cervikalgi, cervikalt syndrom, nakkemyalgi og whiplash."
    ),
    (
        "Cervikobrakialt syndrom. ICPC-2?",
        "L83 — Nakkesyndromer\n\nCervikobrakialt syndrom kodes L83 i ICPC-2. NB: ICD-10 koden M53.1 brukes IKKE i ICPC-2. Dokumentér utstråling i fritekst."
    ),
    (
        "WAD grad II etter påkjørsel bakfra. ICPC-2 kode?",
        "L83 — Nakkesyndromer\n\nWhiplash (WAD) kodes L83 i ICPC-2. NB: ICD-10 S13.4 (whiplash) er FEIL kodeverk. Gradér WAD i fritekst: 'L83 — WAD grad II'."
    ),

    # --- L84 vs M54.6 (Thoracic pain) ---
    (
        "Torakale ryggsmerter uten utstråling. ICPC-2?",
        "L84 — Ryggsyndromer uten utstråling\n\nL84 er ICPC-2 kode for torakale smerter. NB: ICD-10 koden M54.6 (thorakal smerte) brukes IKKE i ICPC-2."
    ),
    (
        "Er M54.6 riktig for brystsøylesmerter i ICPC-2?",
        "Nei. M54.6 er ICD-10, ikke ICPC-2.\n\nRiktig ICPC-2 kode er L84 — Ryggsyndromer uten utstråling. L84 brukes for alle ryggsyndromer (torakale og lumbale) uten radikulær utstråling."
    ),
    (
        "Costovertebral dysfunksjon. Gi ICPC-2 kode.",
        "L84 — Ryggsyndromer uten utstråling\n\nCostovertebral dysfunksjon kodes L84 i ICPC-2. NB: ICD-10 M54.6 skal IKKE brukes. Dokumentér nivå i fritekst: 'L84 — Costovertebral dysfunksjon Th6-Th8'."
    ),
    (
        "Interkostal neuralgi med utspring fra brystsøylen. ICPC-2?",
        "L84 — Ryggsyndromer uten utstråling\n\nInterkostal neuralgi med spinalt opphav kodes primært L84. NB: ICD-10 M54.6 og G58.0 brukes IKKE i ICPC-2."
    ),

    # --- L92 vs M75.1 (Shoulder/rotator cuff) ---
    (
        "Rotatorcuff-tendinopati. ICPC-2 kode?",
        "L92 — Skuldersyndrom\n\nRotatorcuff-tendinopati kodes L92 i ICPC-2. NB: ICD-10 koden M75.1 (rotatorcuff-syndrom) brukes IKKE. I ICPC-2 brukes L92."
    ),
    (
        "Impingement i skulder. Gi meg ICPC-2, IKKE ICD-10.",
        "L92 — Skuldersyndrom\n\nSkulder-impingement kodes L92 i ICPC-2. NB: ICD-10 M75.4 (impingement) og M75.1 (rotatorcuff) er FEIL kodeverk."
    ),
    (
        "Er M75.1 en ICPC-2 kode?",
        "Nei. M75.1 er ICD-10 for rotatorcuff-syndrom.\n\nRiktig ICPC-2 kode er L92 — Skuldersyndrom. L92 dekker impingement, rotatorcuff-tendinopati og subakromialt smertesyndrom."
    ),
    (
        "Supraspinatus-tendinitt. Hvilken ICPC-2 kode?",
        "L92 — Skuldersyndrom\n\nSupraspinatus-tendinitt kodes L92. NB: ICD-10 M75.1 brukes IKKE i ICPC-2. Dokumentér: 'L92 — Supraspinatus-tendinitt'."
    ),
    (
        "Frozen shoulder / adhesiv kapsulitt. ICPC-2?",
        "L92 — Skuldersyndrom\n\nFrozen shoulder kodes L92 i ICPC-2. NB: ICD-10 M75.0 (adhesiv kapsulitt) brukes IKKE. I ICPC-2 samles alle skuldertilstander under L92."
    ),
    (
        "Hva tilsvarer ICD-10 M75 serien i ICPC-2?",
        "Hele ICD-10 M75-serien (M75.0-M75.9) tilsvarer ICPC-2 L92 — Skuldersyndrom.\n\nICPC-2 har kun én kode for alle skuldertilstander (L92), mens ICD-10 deler opp i undergrupper."
    ),

    # --- L89 vs M16/M17 (Hip/knee OA) ---
    (
        "Hofteartrose. ICPC-2 kode?",
        "L89 — Artrose hofte\n\nHofteartrose kodes L89 i ICPC-2. NB: ICD-10 koden M16 (coxartrose) brukes IKKE. I ICPC-2 brukes L89."
    ),
    (
        "Er M16 riktig ICPC-2 kode for coxartrose?",
        "Nei. M16 er ICD-10 for coxartrose.\n\nRiktig ICPC-2 kode er L89 — Artrose hofte. ICPC-2 koder har format bokstav + 2 sifre (aldri bokstav + 2 sifre + punkt)."
    ),
    (
        "Kneartrose, primær. ICPC-2?",
        "L90 — Artrose kne\n\nKneartrose kodes L90 i ICPC-2. NB: ICD-10 koden M17 (gonartrose) brukes IKKE i kiropraktorpraksis."
    ),
    (
        "Hva tilsvarer M17 i ICPC-2?",
        "ICD-10 M17 (gonartrose) tilsvarer ICPC-2 L90 — Artrose kne.\n\nBåde primær og sekundær kneartrose kodes L90 i ICPC-2."
    ),
    (
        "Bilateral hofteartrose med lyskelukking. ICPC-2?",
        "L89 — Artrose hofte\n\nBilateral hofteartrose kodes L89. NB: ICD-10 M16.0 (bilateral primær coxartrose) brukes IKKE. I ICPC-2 dokumentér bilateral i fritekst."
    ),

    # --- L96 vs S83.2 (Knee meniscus) ---
    (
        "Meniskskade i kne. ICPC-2 kode?",
        "L96 — Akutt indre skade kne\n\nMeniskskade kodes L96 i ICPC-2. NB: ICD-10 koden S83.2 (meniskruptur) brukes IKKE. I ICPC-2 brukes L96."
    ),
    (
        "Medial menisk lesjon etter vridningstraume. ICPC-2?",
        "L96 — Akutt indre skade kne\n\nMedial menisklesjon kodes L96. NB: ICD-10 S83.2 er FEIL kodeverk. L96 dekker menisk- og korsbåndsskader i ICPC-2."
    ),
    (
        "ACL-ruptur. Gi ICPC-2 kode.",
        "L96 — Akutt indre skade kne\n\nFremre korsbånd (ACL) ruptur kodes L96 i ICPC-2. NB: ICD-10 S83.5 er FEIL kodeverk. Dokumentér: 'L96 — ACL-ruptur'."
    ),
    (
        "Er S83.2 en gyldig ICPC-2 kode for meniskskade?",
        "Nei. S83.2 er ICD-10, IKKE ICPC-2.\n\nRiktig ICPC-2 kode er L96 — Akutt indre skade kne. L96 dekker menisk, korsbånd og andre indre kneskader."
    ),

    # --- L77 vs S93.4 (Ankle sprain) ---
    (
        "Ankelforstuing lateral. ICPC-2?",
        "L77 — Distorsjon/forstuing ankel\n\nLateral ankelforstuing kodes L77 i ICPC-2. NB: ICD-10 koden S93.4 brukes IKKE. I ICPC-2 brukes L77."
    ),
    (
        "Inversjonsskade ankel med hevelse. ICPC-2 kode?",
        "L77 — Distorsjon/forstuing ankel\n\nL77 er korrekt ICPC-2 kode. NB: ICD-10 S93.4 (fibulare ligamentskade) er FEIL kodeverk."
    ),
    (
        "Er S93.4 en ICPC-2 kode?",
        "Nei. S93.4 er ICD-10 for lateral ligamentskade i ankel.\n\nRiktig ICPC-2 kode er L77 — Distorsjon/forstuing ankel. ICPC-2 koder har format bokstav + 2 sifre (aldri S + 2 sifre + punkt + siffer)."
    ),
    (
        "Akutt lateral ligamentskade ankel etter sportsaktivitet. ICPC-2?",
        "L77 — Distorsjon/forstuing ankel\n\nL77 er korrekt ICPC-2 kode for ankeldistorsjon. NB: ICD-10 S93.4 brukes IKKE i ICPC-2 kodeverk."
    ),

    # --- L93 vs M77.1 (Tennis elbow) ---
    (
        "Lateral epikondylitt (tennisalbue). ICPC-2?",
        "L93 — Tennisalbue\n\nLateral epikondylitt kodes L93 i ICPC-2. NB: ICD-10 koden M77.1 (lateral epikondylitt) brukes IKKE. I ICPC-2 brukes L93."
    ),
    (
        "Er M77.1 en ICPC-2 kode?",
        "Nei. M77.1 er ICD-10 for lateral epikondylitt.\n\nRiktig ICPC-2 kode er L93 — Tennisalbue. L93 dekker lateral epikondylitt i ICPC-2."
    ),
    (
        "Smerter lateralt i albuen ved grep. ICPC-2 kode?",
        "L93 — Tennisalbue\n\nSmerter ved grep med lateral albuesmerte er klassisk lateral epikondylitt. ICPC-2 kode L93. NB: ICD-10 M77.1 brukes IKKE."
    ),
    (
        "Medial epikondylitt (golferalbue). ICPC-2?",
        "L93 — Tennisalbue\n\nBåde lateral og medial epikondylitt kodes L93 i ICPC-2. NB: ICD-10 M77.0 (medial) og M77.1 (lateral) brukes IKKE. Dokumentér lokalisasjon i fritekst."
    ),

    # --- L98 vs M72.2 (Plantar fasciitis) ---
    (
        "Plantar fascitt. ICPC-2 kode?",
        "L98 — Ervervet deformitet av ekstremitet\n\nPlantar fascitt kodes L98 i ICPC-2. NB: ICD-10 koden M72.2 brukes IKKE. I ICPC-2 brukes L98 for plantar fascitt."
    ),
    (
        "Er M72.2 korrekt ICPC-2 kode for hælspore?",
        "Nei. M72.2 er ICD-10 for plantar fascitt.\n\nRiktig ICPC-2 kode er L98 — Ervervet deformitet av ekstremitet. Alternativt L17 (fotsymptom) kan brukes."
    ),
    (
        "Hælsmerter, verre om morgenen. ICPC-2?",
        "L98 — Ervervet deformitet av ekstremitet\n\nKlassisk plantar fascitt (morgenstivhet i hælen) kodes L98. NB: ICD-10 M72.2 brukes IKKE i ICPC-2. Alternativt L17."
    ),

    # --- N02 vs G44.2 (Tension headache) ---
    (
        "Spenningshodepine. ICPC-2 kode?",
        "N02 — Spenningshodepine\n\nSpenningshodepine kodes N02 i ICPC-2. NB: ICD-10 koden G44.2 brukes IKKE i ICPC-2 kodeverk."
    ),
    (
        "Er G44.2 en ICPC-2 kode for tensjonshodepine?",
        "Nei. G44.2 er ICD-10 for tensjonshodepine.\n\nRiktig ICPC-2 kode er N02 — Spenningshodepine. ICPC-2 koder for hodepine starter med N (nevrologisk kapitel)."
    ),
    (
        "Bilateral trykkende hodepine, episodisk. ICPC-2?",
        "N02 — Spenningshodepine\n\nBilateral trykkende hodepine uten kvalme/foto-/fonofobi = spenningshodepine. ICPC-2 kode N02. NB: ICD-10 G44.2 brukes IKKE."
    ),
    (
        "Kronisk spenningshodepine, >15 dager/mnd. ICPC-2?",
        "N02 — Spenningshodepine\n\nKronisk spenningshodepine kodes N02 i ICPC-2. NB: ICD-10 G44.2 brukes IKKE. Dokumentér kronisk i fritekst: 'N02 — Kronisk spenningshodepine'."
    ),

    # --- N89 vs G43 (Migraine) ---
    (
        "Migrene uten aura. ICPC-2 kode?",
        "N89 — Migrene\n\nMigrene uten aura kodes N89 i ICPC-2. NB: ICD-10 koden G43.0 brukes IKKE. I ICPC-2 brukes N89 for alle migrenetyper."
    ),
    (
        "Er G43 en gyldig ICPC-2 kode?",
        "Nei. G43 og alle underkoder (G43.0, G43.1 osv.) er ICD-10.\n\nRiktig ICPC-2 kode er N89 — Migrene. N89 dekker alle migrenetyper (med/uten aura, kronisk) i ICPC-2."
    ),
    (
        "Migrene med aura. ICPC-2?",
        "N89 — Migrene\n\nMigrene med aura kodes N89. NB: ICD-10 G43.1 brukes IKKE. ICPC-2 har kun én kode for migrene (N89). Dokumentér type i fritekst."
    ),
    (
        "Hva tilsvarer ICD-10 G43 i ICPC-2?",
        "Hele ICD-10 G43-serien (G43.0-G43.9) tilsvarer ICPC-2 N89 — Migrene.\n\nICPC-2 har én samlet kode, mens ICD-10 deler opp i undergrupper."
    ),
    (
        "Kronisk migrene, >15 dager/mnd. ICPC-2?",
        "N89 — Migrene\n\nKronisk migrene kodes N89 i ICPC-2. NB: ICD-10 G43.3 (kronisk migrene) brukes IKKE. Dokumentér kronisk i fritekst."
    ),
    (
        "Vestibulær migrene med svimmelhet. ICPC-2 kode?",
        "N89 — Migrene\n\nVestibulær migrene kodes primært N89. Tilleggskode N17 (vertigo) kan brukes. NB: ICD-10 G43.1 brukes IKKE i ICPC-2."
    ),

    # --- N95 vs R51 (Headache NOS) ---
    (
        "Uspesifikk hodepine. ICPC-2 kode?",
        "N01 — Hodepine\n\nUspesifikk hodepine kodes N01 i ICPC-2. NB: ICD-10 koden R51 (hodepine) brukes IKKE. I ICPC-2 brukes N01."
    ),
    (
        "Er R51 en ICPC-2 kode?",
        "Nei. R51 er ICD-10 for hodepine NOS.\n\nRiktig ICPC-2 kode er N01 — Hodepine (symptom). N01 brukes når hodepinetypen ikke er spesifisert."
    ),
    (
        "Hodepine av ukjent type. Hvilken ICPC-2 kode?",
        "N01 — Hodepine\n\nNår hodepinetypen ikke er klassifisert, bruk N01. NB: ICD-10 R51 brukes IKKE i ICPC-2."
    ),

    # --- N17 vs H81.1 (BPPV) ---
    (
        "BPPV (benign paroksysmal posisjonsvertigo). ICPC-2?",
        "N17 — Vertigo/svimmelhet\n\nBPPV kodes N17 i ICPC-2. NB: ICD-10 koden H81.1 brukes IKKE. I ICPC-2 brukes N17 for BPPV."
    ),
    (
        "Er H81.1 en ICPC-2 kode for BPPV?",
        "Nei. H81.1 er ICD-10 for BPPV.\n\nRiktig ICPC-2 kode er N17 — Vertigo/svimmelhet. N17 dekker BPPV, cervikogen svimmelhet og annen perifer vertigo."
    ),
    (
        "Svimmelhet med positiv Dix-Hallpike. ICPC-2?",
        "N17 — Vertigo/svimmelhet\n\nPositiv Dix-Hallpike bekrefter BPPV. ICPC-2 kode N17. NB: ICD-10 H81.1 brukes IKKE. Dokumentér: 'N17 — BPPV, posterior kanal'."
    ),
    (
        "Akutt rotatorisk vertigo, provosert av hodedreiing. ICPC-2?",
        "N17 — Vertigo/svimmelhet\n\nN17 er korrekt ICPC-2 kode for akutt vertigo. NB: ICD-10 H81.1 brukes IKKE i ICPC-2 kodeverk."
    ),

    # --- H82 vs H81.9 (Vestibular disorder) ---
    (
        "Vestibulær dysfunksjon. ICPC-2 kode?",
        "H82 — Vertigo-syndrom\n\nVestibulær dysfunksjon kodes H82 i ICPC-2. NB: ICD-10 koden H81.9 brukes IKKE. H82 brukes for vestibulære syndromer i ICPC-2."
    ),
    (
        "Er H81.9 en ICPC-2 kode?",
        "Nei. H81.9 er ICD-10 for uspesifisert vestibulær forstyrrelse.\n\nRiktig ICPC-2 kode er H82 — Vertigo-syndrom. H82 dekker vestibulære lidelser i ICPC-2."
    ),
    (
        "Vestibulær nevritt. ICPC-2 kode?",
        "H82 — Vertigo-syndrom\n\nVestibulær nevritt kodes H82 i ICPC-2. NB: ICD-10 H81.2 (vestibulær nevronitt) brukes IKKE. I ICPC-2 brukes H82."
    ),

    # --- L18 vs K07.6 (TMJ disorder) ---
    (
        "TMJ-dysfunksjon (kjeveleddsproblemer). ICPC-2?",
        "L18 — Muskelsmerter/fibromyalgi\n\nTMJ-dysfunksjon kan kodes L18 i ICPC-2 ved muskulær komponent. NB: ICD-10 K07.6 brukes IKKE. Alternativt D82 for tannlegerelaterte plager."
    ),
    (
        "Kjevesmerter med klikking i kjeveledd. ICPC-2 kode?",
        "L18 — Muskelsmerter/fibromyalgi\n\nKjeveleddsplager med muskulær komponent kodes L18. NB: ICD-10 K07.6 (TMJ-dysfunksjon) brukes IKKE i ICPC-2."
    ),

    # --- L01 vs M54.2 (Neck symptom) ---
    (
        "Nakkesymptom, uspesifisert. ICPC-2?",
        "L01 — Nakkesymptom/plage\n\nUspesifisert nakkeplage kodes L01. NB: ICD-10 M54.2 brukes IKKE. L01 brukes for nakkesymptomer uten spesifikk diagnose."
    ),
    (
        "Ny pasient med nakkesmerter, ikke undersøkt ennå. ICPC-2?",
        "L01 — Nakkesymptom/plage\n\nBruk L01 som symptomkode inntil diagnose er stilt. NB: ICD-10 M54.2 brukes IKKE i ICPC-2. Kan oppgraderes til L83 etter vurdering."
    ),

    # --- L04 vs M54.6 (Thoracic symptom) ---
    (
        "Brystsøylesymptom, uspesifisert. ICPC-2?",
        "L04 — Brystsymptom/plage\n\nUspesifisert brystsøyleplage kodes L04. NB: ICD-10 M54.6 brukes IKKE i ICPC-2. L04 er symptomkode, L84 er diagnosekode."
    ),
    (
        "Thorakal smerte, ikke vurdert ennå. ICPC-2?",
        "L04 — Brystsymptom/plage\n\nL04 brukes som symptomkode. NB: ICD-10 M54.6 brukes IKKE. Oppgradér til L84 etter klinisk vurdering."
    ),

    # --- Additional disambiguation pairs ---
    (
        "Tendinopati i akilles. Gi ICPC-2, ikke ICD-10.",
        "L87 — Bursitt/tendinitt/synovitt\n\nAkillestendinopati kodes L87 i ICPC-2. NB: ICD-10 M76.6 brukes IKKE. Alternativt L17 (fotsymptom)."
    ),
    (
        "Er M76.6 en ICPC-2 kode for akillestendinitt?",
        "Nei. M76.6 er ICD-10 for akillestendinitt.\n\nRiktig ICPC-2 kode er L87 — Bursitt/tendinitt/synovitt. L87 dekker alle tendinopatier i ICPC-2."
    ),
    (
        "De Quervains tenosynovitt. ICPC-2?",
        "L87 — Bursitt/tendinitt/synovitt\n\nDe Quervains kodes L87 i ICPC-2. NB: ICD-10 M65.4 brukes IKKE i ICPC-2 kodeverk."
    ),
    (
        "Trochanterisk bursitt. ICPC-2 kode?",
        "L87 — Bursitt/tendinitt/synovitt\n\nTrochanterisk bursitt kodes L87 i ICPC-2. NB: ICD-10 M70.6 brukes IKKE. ICPC-2 samler alle bursitter under L87."
    ),
    (
        "Karpaltunnelsyndrom. ICPC-2?",
        "N93 — Karpaltunnelsyndrom\n\nKarpaltunnelsyndrom kodes N93 i ICPC-2. NB: ICD-10 G56.0 brukes IKKE. I ICPC-2 har karpaltunnel egen kode: N93."
    ),
    (
        "Er G56.0 ICPC-2 for karpaltunnelsyndrom?",
        "Nei. G56.0 er ICD-10.\n\nRiktig ICPC-2 kode er N93 — Karpaltunnelsyndrom. ICPC-2 har egen kode for denne tilstanden."
    ),
    (
        "Thoracic outlet syndrom. ICPC-2?",
        "N94 — Perifer nevropati\n\nThoracic outlet syndrom kodes N94 i ICPC-2. NB: ICD-10 G54.0 brukes IKKE. ICPC-2 bruker N94 for perifere nevropatier."
    ),
    (
        "Ischias uten spesifikk årsak. ICPC-2?",
        "L86 — Lumbalt ryggsyndrom med utstråling\n\nIschias kodes L86 i ICPC-2, uavhengig av årsak. NB: ICD-10 M54.3 (ischias) brukes IKKE. I ICPC-2 brukes L86."
    ),
    (
        "Piriformis-syndrom med isjas. ICPC-2?",
        "L86 — Lumbalt ryggsyndrom med utstråling\n\nPiriformis-syndrom med ischiassmerter kodes L86 i ICPC-2. NB: ICD-10 G57.0 brukes IKKE. Dokumentér piriformis-opphav i fritekst."
    ),
    (
        "Sacroiliakalt dysfunksjon. ICPC-2 kode?",
        "L03 — Korsryggsmerter uten utstråling\n\nSI-leddsdysfunksjon kodes L03 i ICPC-2. NB: ICD-10 M53.3 brukes IKKE. Dokumentér: 'L03 — SI-leddsdysfunksjon'."
    ),
    (
        "Spondylolistese. Gi ICPC-2 kode.",
        "L84 — Ryggsyndromer uten utstråling\n\nSpondylolistese kodes L84 i ICPC-2. NB: ICD-10 M43.1 brukes IKKE. Ved utstråling: bruk L86."
    ),
    (
        "Skoliose. ICPC-2?",
        "L85 — Ervervet deformitet av ryggsøyle\n\nSkoliose kodes L85 i ICPC-2. NB: ICD-10 M41 (skoliose) brukes IKKE i ICPC-2 kodeverk."
    ),
    (
        "Bekkenleddsmerter postpartum. ICPC-2?",
        "L03 — Korsryggsmerter uten utstråling\n\nPostpartum bekkenleddsmerter kodes L03 i ICPC-2. NB: ICD-10 O26.7 brukes IKKE. Dokumentér: 'L03 — Bekkenleddsmerter postpartum'."
    ),
    (
        "Myofascielt smertesyndrom i nakke. ICPC-2?",
        "L83 — Nakkesyndromer\n\nMyofascielt smertesyndrom i nakkeregionen kodes L83 i ICPC-2. NB: ICD-10 M79.1 (myalgi) brukes IKKE i ICPC-2."
    ),
    (
        "Cervikogen hodepine. ICPC-2 kode?",
        "N02 — Spenningshodepine\n\nCervikogen hodepine kodes primært N02 i ICPC-2. NB: ICD-10 G44.8 brukes IKKE. Tilleggskode L83 for cervikal komponent."
    ),
    (
        "Hva er ICPC-2 kode for M79.3 (panniculitis)?",
        "L99 — Annen muskelskjelettlidelse\n\nPanniculitis kodes L99 i ICPC-2 (samlekode for sjeldne tilstander). M79.3 er ICD-10 og brukes IKKE."
    ),
    (
        "Fibromyalgi. ICPC-2 kode, ikke ICD-10.",
        "L18 — Muskelsmerter/fibromyalgi\n\nFibromyalgi kodes L18 i ICPC-2. NB: ICD-10 M79.7 brukes IKKE. L18 dekker generaliserte muskelsmerter og fibromyalgi."
    ),
    (
        "Dupuytrens kontraktur. ICPC-2?",
        "L87 — Bursitt/tendinitt/synovitt\n\nDupuytrens kontraktur kodes L87 i ICPC-2. NB: ICD-10 M72.0 brukes IKKE. Alternativt L99 som samlekode."
    ),
    (
        "Morbus Scheuermann. ICPC-2?",
        "L85 — Ervervet deformitet av ryggsøyle\n\nScheuermanns sykdom kodes L85. NB: ICD-10 M42.0 brukes IKKE i ICPC-2. L85 dekker ervervede ryggdeformiteter."
    ),
    (
        "Coxalgi (hoftesmerter) uspesifisert. ICPC-2?",
        "L13 — Hoftesymptom/plage\n\nUspesifiserte hoftesmerter kodes L13 i ICPC-2. NB: ICD-10 M25.5 brukes IKKE. L13 er symptomkode, L89 er diagnose (artrose)."
    ),
    (
        "Gonalgi (knesmerter) uspesifisert. ICPC-2?",
        "L15 — Knesymptom/plage\n\nUspesifiserte knesmerter kodes L15 i ICPC-2. NB: ICD-10 M25.5 brukes IKKE. L15 er symptomkode, L90 er diagnose (artrose)."
    ),
    (
        "Revmatoid artritt i hånd. ICPC-2?",
        "L88 — Revmatoid artritt\n\nRevmatoid artritt kodes L88 i ICPC-2. NB: ICD-10 M05/M06 brukes IKKE. L88 dekker alle former for RA."
    ),
    (
        "Ankyloserende spondylitt (Bekhterevs). ICPC-2 kode?",
        "L84 — Ryggsyndromer uten utstråling\n\nAnkyloserende spondylitt kodes primært L84 i ICPC-2. NB: ICD-10 M45 brukes IKKE. Alternativt L88 ved perifer leddaffeksjon."
    ),
    (
        "Bursitt i olecranon. ICPC-2?",
        "L87 — Bursitt/tendinitt/synovitt\n\nOlecranon-bursitt kodes L87 i ICPC-2. NB: ICD-10 M70.2 brukes IKKE. L87 dekker alle bursitter."
    ),
    (
        "Meralgia paresthetica (lateralt lårsmerter). ICPC-2?",
        "N94 — Perifer nevropati\n\nMeralgia paresthetica kodes N94 i ICPC-2 (n. cutaneus femoris lateralis). NB: ICD-10 G57.1 brukes IKKE."
    ),
    (
        "Temporomandibulær dysfunksjon med bruksisme. ICPC-2?",
        "L18 — Muskelsmerter/fibromyalgi\n\nTMD med bruksisme og muskelkomponent kodes L18 i ICPC-2. NB: ICD-10 K07.6 brukes IKKE. Dokumentér bruksisme i fritekst."
    ),
    (
        "Heberdens knuter i fingre (artrose DIP-ledd). ICPC-2?",
        "L91 — Artrose, annen lokalisasjon\n\nFingerartrose (Heberdens knuter) kodes L91 i ICPC-2. NB: ICD-10 M15 brukes IKKE. L91 dekker artrose i ledd utenom hofte/kne."
    ),
]

# =============================================================================
# CATEGORY 2: CODE HIERARCHY AND SPECIFICITY (100 examples)
# =============================================================================

HIERARCHY_EXAMPLES = [
    # --- Back codes: L03 vs L84 vs L86 ---
    (
        "Akutte korsryggsmerter i 3 dager, ingen utstråling. Hvilken L-kode?",
        "L03 — Korsryggsmerter uten utstråling\n\nL03 brukes for akutte, uspesifikke korsryggsmerter. IKKE L84 — som er for kronisk ryggsyndrom. IKKE L86 — som krever radikulær utstråling."
    ),
    (
        "Korsryggsmerter i 4 måneder, ingen radikulopati. L03, L84 eller L86?",
        "L84 — Ryggsyndromer uten utstråling\n\nKronisk ryggsmerte (>3 mnd) uten utstråling = L84. L03 brukes for akutt/uspesifikk. L86 krever radikulær utstråling."
    ),
    (
        "Korsryggsmerter med utstråling til fot, positiv SLR. L03, L84 eller L86?",
        "L86 — Lumbalt ryggsyndrom med utstråling\n\nRadikulær utstråling + positiv SLR = L86. L03 = ingen utstråling. L84 = syndrom uten utstråling. L86 = med utstråling."
    ),
    (
        "Forskjellen mellom L03, L84 og L86?",
        "L03 — Korsryggsmerter uten utstråling: Akutt/uspesifikk ryggsmerte, symptomkode.\nL84 — Ryggsyndromer uten utstråling: Kronisk ryggsyndrom, diagnosekode.\nL86 — Med utstråling: Radikulopati, isjas, prolaps.\n\nHovedregel: L03 = symptom, L84 = diagnose uten utstråling, L86 = med utstråling."
    ),
    (
        "Degenerativ rygg med stivhet, ingen utstråling, 8 mnd varighet. Kode?",
        "L84 — Ryggsyndromer uten utstråling\n\nKronisk degenerativ rygglidelse uten utstråling kodes L84, IKKE L03 (symptomkode). L86 er feil fordi det ikke er utstråling."
    ),
    (
        "Akutt lumbago som stråler til gluteal region men ikke forbi kne. L03 eller L86?",
        "L03 — Korsryggsmerter uten utstråling\n\nSmerter som ikke passerer kneet regnes vanligvis som referert smerte, IKKE radikulopati. L86 krever radikulær utstråling (under kne, dermatomal). L03 er korrekt."
    ),
    (
        "Lumbal prolaps L5-S1 med utstråling og pareser. L84 eller L86?",
        "L86 — Lumbalt ryggsyndrom med utstråling\n\nProlaps med utstråling og motorisk utfall = L86. L84 er FEIL — den brukes kun UTEN utstråling. L86 dekker prolaps, stenose og andre årsaker til radikulopati."
    ),
    (
        "Pasient med kroniske ryggplager, smertemønster varierer dag til dag. Kode?",
        "L84 — Ryggsyndromer uten utstråling\n\nKronisk rygglidelse uten konsistent radikulopati = L84. Ikke L03 (akutt symptom). Ikke L86 (ingen vedvarende utstråling)."
    ),
    (
        "Ryggsmerte som stråler ned til L5-dermatomet, parestesier i fot. L03 eller L86?",
        "L86 — Lumbalt ryggsyndrom med utstråling\n\nDermatomal utstråling med parestesier = radikulopati = L86. L03 er FEIL ved dermatomal utstråling."
    ),
    (
        "Lavgradig korsryggsmerter etter trening, forsvinner etter 2 dager. Kode?",
        "L03 — Korsryggsmerter uten utstråling\n\nKortvarig, selvbegrensende ryggsmerte uten utstråling = L03. L84 er for kronisk ryggsyndrom. L86 er for radikulopati."
    ),
    (
        "Spondylolysthese med intermitterende isjas. L84 eller L86?",
        "L86 — Lumbalt ryggsyndrom med utstråling\n\nSpondylolistese MED isjas kodes L86 (utstråling). Uten isjas ville den kodes L84 (ryggsyndrom uten utstråling)."
    ),
    (
        "Akutt forverring av kronisk rygglidelse uten utstråling. L03 eller L84?",
        "L84 — Ryggsyndromer uten utstråling\n\nAkutt forverring av KRONISK rygglidelse = L84 (etablert diagnose). L03 brukes kun for ny, uspesifikk akutt ryggsmerte."
    ),
    (
        "Spinal stenose uten isjas, kun ryggsmerte. L84 eller L86?",
        "L84 — Ryggsyndromer uten utstråling\n\nSpinal stenose UTEN radikulopati = L84. Først ved nevrogen claudicatio eller radikulopati oppgraderes til L86."
    ),

    # --- Neck codes: L01 vs L83 ---
    (
        "Nakkesmerter etter dårlig sovestilling, 2 dager. L01 eller L83?",
        "L01 — Nakkesymptom/plage\n\nAkutt, uspesifikk nakkesmerte = L01 (symptomkode). L83 = nakkesyndromer (diagnosekode) brukes etter klinisk vurdering."
    ),
    (
        "Kronisk cervikalt syndrom med muskelspasmer. L01 eller L83?",
        "L83 — Nakkesyndromer\n\nEtablert cervikalt syndrom med kroniske plager = L83. L01 er symptomkode for ny/uspesifikk nakkeplage."
    ),
    (
        "Ny pasient, nakkesmerter, ikke undersøkt. L01 eller L83?",
        "L01 — Nakkesymptom/plage\n\nFør klinisk vurdering: bruk symptomkode L01. Etter diagnostikk: oppgradér til L83 (nakkesyndrom) hvis diagnose stilles."
    ),
    (
        "Nakkesmerter med redusert ROM og muskelømhet. L01 eller L83?",
        "L83 — Nakkesyndromer\n\nBevegelsesrestriksjon + muskulære funn = diagnostiske funn som støtter L83. L01 brukes kun for uspesifikke symptomer."
    ),
    (
        "Stiv nakke etter trening, mild ubehag. L01 eller L83?",
        "L01 — Nakkesymptom/plage\n\nMild, selvbegrensende nakkestivhet = L01 (symptom). L83 reserveres for syndromer med kliniske funn."
    ),
    (
        "Cervikalt fasettleddssyndrom med reflektorisk muskelspasme. Kode?",
        "L83 — Nakkesyndromer\n\nSpesifikk diagnose (fasettleddssyndrom) = L83. L01 er FEIL for spesifikke diagnoser. Dokumentér: 'L83 — Cervikalt fasettleddssyndrom C4-C5'."
    ),
    (
        "Telefonkonsultasjon: pasient ringer om nakkesmerter. Kode?",
        "L01 — Nakkesymptom/plage\n\nVed telefonkonsultasjon uten klinisk undersøkelse: bruk symptomkode L01. L83 krever klinisk diagnose."
    ),

    # --- Headache codes: N01 vs N02 vs N89 vs N95 ---
    (
        "Hodepine, uspesifisert. N01, N02, N89 eller N95?",
        "N01 — Hodepine\n\nUspesifikk hodepine = N01 (symptomkode). N02 = spenningshodepine. N89 = migrene. N95 = annen spesifikk hodepine. N01 brukes når type ikke er avklart."
    ),
    (
        "Bilateral, trykkende hodepine, mild-moderat, uten kvalme. Kode?",
        "N02 — Spenningshodepine\n\nBilateral + trykkende + ingen kvalme/aura = typisk spenningshodepine (N02). IKKE N89 (migrene krever kvalme/foto-fonofobi). IKKE N01 (uspesifikk)."
    ),
    (
        "Unilateral, pulserende hodepine med kvalme og fotofobi. Kode?",
        "N89 — Migrene\n\nUnilateral + pulserende + kvalme + fotofobi = migrene (N89). IKKE N02 (spenning er bilateral, trykkende). IKKE N01 (for uspesifikk)."
    ),
    (
        "Cervikogen hodepine fra nakken. N01, N02 eller N89?",
        "N02 — Spenningshodepine\n\nCervikogen hodepine kodes N02. Ikke N89 (migrene). Tilleggskode L83 for cervikal komponent. N01 er for udiagnostisert hodepine."
    ),
    (
        "Cluster-hodepine med tåreflod og nesetetthet. Kode?",
        "N95 — Annen spesifikk hodepine\n\nCluster-hodepine er en spesifikk hodepinetype som kodes N95. IKKE N89 (migrene). IKKE N02 (spenning). N95 brukes for hodepinetyper utenom migrene/spenning."
    ),
    (
        "Ny pasient med hodepine, ikke utredet. N01 eller N02?",
        "N01 — Hodepine\n\nBruk N01 som symptomkode før diagnostikk. Oppgradér til N02 (spenning), N89 (migrene) eller N95 (annen) etter klinisk vurdering."
    ),
    (
        "Medikamentoverforbrukshodepine. Kode?",
        "N95 — Annen spesifikk hodepine\n\nMedikamentoverforbrukshodepine (MOH) kodes N95 i ICPC-2. IKKE N02 (spenning). Dokumentér MOH spesifikt i fritekst."
    ),
    (
        "Migrene med visuell aura (flimmerskotom). N89 eller N95?",
        "N89 — Migrene\n\nMigrene med visuell aura er klassisk migrene = N89. N95 er for hodepinetyper som IKKE er migrene/spenning."
    ),
    (
        "Bilateral hodepine med kvalme og lysskyhet. N02 eller N89?",
        "N89 — Migrene\n\nKvalme + fotofobi = migrenetrekk, selv om bilateral. Migrene kan være bilateral hos ~40%. N89 er korrekt. N02 har IKKE kvalme/fotofobi."
    ),
    (
        "Stramming i pannen etter skjermarbeid. Kode?",
        "N02 — Spenningshodepine\n\nStramming/trykk etter skjermarbeid = typisk episodisk spenningshodepine. N02 er korrekt. IKKE N89 (ingen migrenefunksjoner)."
    ),

    # --- Joint codes: L89 vs L90 vs L91 vs L92 ---
    (
        "Artrose i hofte. L89, L90 eller L91?",
        "L89 — Artrose hofte\n\nHofteartrose = L89 (spesifikk hofteartrose-kode). L90 = kneartrose. L91 = annen artrose (andre ledd). Bruk spesifikk kode når lokalisasjon er kjent."
    ),
    (
        "Artrose i kne. L89 eller L90?",
        "L90 — Artrose kne\n\nKneartrose = L90. L89 er FEIL (hofteartrose). ICPC-2 har separate artrosekoder for hofte (L89) og kne (L90)."
    ),
    (
        "Artrose i tommelens CMC-ledd. L89, L90 eller L91?",
        "L91 — Artrose, annen lokalisasjon\n\nRhizartrose (CMC-artrose) kodes L91. L89 = kun hofte. L90 = kun kne. L91 = alle andre ledd."
    ),
    (
        "Artrose i AC-ledd i skulder. Kode?",
        "L91 — Artrose, annen lokalisasjon\n\nAC-leddsartrose kodes L91 (annen artrose). IKKE L92 (skuldersyndrom = bløtdelstilstand). IKKE L89 (hofte) eller L90 (kne)."
    ),
    (
        "Skuldersmerter med impingement-tegn. L91 eller L92?",
        "L92 — Skuldersyndrom\n\nSkulder-impingement = bløtdelstilstand = L92. L91 er for artrose i skulderleddet. L92 dekker rotatorcuff, impingement, bursitt i skulder."
    ),
    (
        "Artrose i begge hofter og knær. Kode?",
        "L89 — Artrose hofte + L90 — Artrose kne\n\nBruk begge koder: L89 (hofte) + L90 (kne). IKKE L91 — den brukes kun for ledd som IKKE har spesifikk kode."
    ),
    (
        "Generalisert artrose. L89, L90 eller L91?",
        "L91 — Artrose, annen lokalisasjon\n\nGeneralisert artrose = L91. Kan kombineres med L89 (hofte) og/eller L90 (kne) hvis disse leddene er involvert."
    ),
    (
        "Adhesiv kapsulitt i skulder. L91 eller L92?",
        "L92 — Skuldersyndrom\n\nAdhesiv kapsulitt = bløtdelsrelatert = L92. L91 er for ARTROSE. L92 dekker kapsulitt, impingement, rotatorcuff."
    ),

    # --- Trauma codes: L73 vs L76 vs L77 vs L78 vs L79 ---
    (
        "Brudd i håndledd. L73, L76 eller L77?",
        "L76 — Annet/multiple brudd\n\nHåndleddsbrudd kodes L76. L73 = brudd i underarm/albue. L77 = forstuing/distorsjon (IKKE brudd). L76 brukes for brudd i ekstremiteter generelt."
    ),
    (
        "Ankelforstuing uten brudd. L76 eller L77?",
        "L77 — Distorsjon/forstuing ankel\n\nAnkelforstuing UTEN brudd = L77. L76 er for BRUDD. L77 er spesifikk for ankeldistorsjon."
    ),
    (
        "Kontusjon i kne etter fall. L76, L77 eller L78?",
        "L78 — Kontusjon (blåmerke)\n\nKnekontusjon (blåmerke) = L78. L76 = brudd. L77 = ankelforstuing. L78 = kontusjon/blåmerke."
    ),
    (
        "Skulderluksasjon etter fall. Kode?",
        "L79 — Forstuing/dislokasjon annen\n\nSkulderluksasjon = L79 (dislokasjon). IKKE L92 (skuldersyndrom = bløtdel). IKKE L76 (brudd). L79 dekker luksasjoner."
    ),
    (
        "Ribbeinsbrudd etter fall. L73 eller L76?",
        "L76 — Annet/multiple brudd\n\nRibbeinsbrudd kodes L76. L73 = spesifikt for arm/underarm brudd. L76 = andre brudd (inkludert ribben, bekken, etc.)."
    ),
    (
        "Forstuet kne med MCL-smerte. L77 eller L96?",
        "L96 — Akutt indre skade kne\n\nMCL-skade i kne = L96 (indre kneskade). L77 = ankelforstuing. L96 dekker korsbånd, menisk og kollateralligamenter i kne."
    ),
    (
        "Fingerforstuing. L77 eller L79?",
        "L79 — Forstuing/dislokasjon annen\n\nFingerforstuing = L79. L77 er SPESIFIKK for ankel. L79 brukes for forstuinger og dislokasjoner i andre ledd."
    ),

    # --- Soft tissue: L18 vs L87 vs L93 vs L98 ---
    (
        "Generaliserte muskelsmerter, fibromyalgi. L18 eller L87?",
        "L18 — Muskelsmerter/fibromyalgi\n\nGeneraliserte muskelsmerter = L18. L87 = bursitt/tendinitt (lokalisert betennelse). L18 dekker diffuse muskelsmerter og fibromyalgi."
    ),
    (
        "Subakromial bursitt i skulder. L87 eller L92?",
        "L92 — Skuldersyndrom\n\nSubakromial bursitt kodes L92 (skuldersyndrom) i de fleste tilfeller. L87 kan brukes for bursitter i andre ledd. L92 er mer spesifikk for skulder."
    ),
    (
        "Bursitt i kne (prepatellar). L87 eller L90?",
        "L87 — Bursitt/tendinitt/synovitt\n\nPrepatellar bursitt = L87. L90 er ARTROSE (ikke bursitt). L87 dekker bursitter i alle ledd utenom skulder (L92)."
    ),
    (
        "Tennisalbue. L87 eller L93?",
        "L93 — Tennisalbue\n\nLateral epikondylitt = L93 (egen kode). L87 = andre bursitter/tendinitter. L93 er mer spesifikk for epikondylitt."
    ),
    (
        "Golferalbue. L87 eller L93?",
        "L93 — Tennisalbue\n\nMedial epikondylitt kodes OGSÅ L93. L87 er generell tendinitt-kode. L93 dekker BEGGE typer epikondylitt."
    ),
    (
        "Plantar fascitt. L87 eller L98?",
        "L98 — Ervervet deformitet av ekstremitet\n\nPlantar fascitt kodes L98. L87 = bursitt/tendinitt. L98 er mer korrekt for plantarfascitt. Alternativt L17 (fotsymptom)."
    ),
    (
        "TMJ-smerte med muskelkomponent. L18 eller L87?",
        "L18 — Muskelsmerter/fibromyalgi\n\nTMJ med muskulær komponent = L18. L87 = bursitt/tendinitt (leddrelatert). L18 brukes ved muskulær dominans. Alternativt D82."
    ),
    (
        "Myofascielle triggerpunkter i skulder. L18 eller L92?",
        "L18 — Muskelsmerter/fibromyalgi\n\nMyofascielle triggerpunkter = muskulær plage = L18. L92 = skulder-SYNDROM (impingement, rotatorcuff). L18 for myofascielle plager."
    ),
    (
        "Patellarsenetendinopati (hoppers knee). L87 eller L96?",
        "L87 — Bursitt/tendinitt/synovitt\n\nPatellarsenetendinopati = L87 (tendinitt). L96 = indre kneskade (menisk/korsbånd). L87 for seneproblemer."
    ),
    (
        "Iliotibialt båndsyndrom. L87, L96 eller L15?",
        "L15 — Knesymptom/plage\n\nITBS kodes L15 (knesymptom). Alternativt L87 (tendinitt). IKKE L96 (indre kneskade — ITBS er IKKE menisk/korsbånd)."
    ),

    # --- Symptom vs Diagnose codes: L01/L02/L03/L04 vs L83/L84/L86 ---
    (
        "Når bruker man symptomkoder (L01-L04) vs diagnosekoder (L83-L86)?",
        "Symptomkoder (L01-L04) brukes FØR klinisk vurdering, når pasienten presenterer plager uten diagnose:\n- L01 = nakkesymptom\n- L02 = ryggsymptom\n- L03 = korsryggsymptom\n- L04 = brystsymptom\n\nDiagnosekoder (L83-L86) brukes ETTER vurdering:\n- L83 = nakkesyndrom\n- L84 = ryggsyndrom uten utstråling\n- L86 = med utstråling"
    ),
    (
        "Pasient med nakkesmerter, første konsultasjon. L01 eller L83?",
        "L01 — Nakkesymptom/plage\n\nVed første konsultasjon brukes symptomkode L01. Etter undersøkelse oppgraderes til L83 (nakkesyndrom) hvis diagnose stilles."
    ),
    (
        "Oppfølging av kjent nakkesyndrom. L01 eller L83?",
        "L83 — Nakkesyndromer\n\nVed oppfølging av KJENT diagnose brukes L83. L01 er kun for nye/udiagnostiserte symptomer."
    ),
    (
        "Ryggsmerte rapportert per telefon. L02 eller L84?",
        "L02 — Ryggsymptom/plage\n\nTelefonkonsultasjon uten klinisk undersøkelse = symptomkode L02. L84 krever klinisk diagnostikk."
    ),

    # --- Vertigo codes: N17 vs H82 ---
    (
        "Perifer vertigo. N17 eller H82?",
        "N17 — Vertigo/svimmelhet\n\nN17 brukes for symptombasert svimmelhet/vertigo. H82 brukes for diagnostiserte vestibulære syndromer (vestibulær nevritt, Ménière)."
    ),
    (
        "Cervikogen svimmelhet. N17 eller H82?",
        "N17 — Vertigo/svimmelhet\n\nCervikogen svimmelhet = N17. H82 er for vestibulære lidelser (øre-opphav). Cervikogen svimmelhet har cervikalt opphav."
    ),
    (
        "Vestibulær nevritt med vedvarende svimmelhet. N17 eller H82?",
        "H82 — Vertigo-syndrom\n\nDiagnostisert vestibulær nevritt = H82. N17 brukes for uspesifikk svimmelhet. H82 for spesifikke vestibulære diagnoser."
    ),
    (
        "BPPV bekreftet med Dix-Hallpike. N17 eller H82?",
        "N17 — Vertigo/svimmelhet\n\nBPPV kodes N17 i de fleste kiropraktorpraksiser. H82 kan brukes for vestibulært syndrom. Begge er akseptable — N17 er vanligst."
    ),
    (
        "Ménières sykdom. N17 eller H82?",
        "H82 — Vertigo-syndrom\n\nDiagnostisert Ménières = H82. N17 er for svimmelhet som symptom. H82 er for spesifikke vestibulære diagnoser."
    ),

    # --- Fracture codes: L73 vs L75 vs L76 ---
    (
        "Kompresjonsbrudd i ryggvirvelen. L73, L75 eller L76?",
        "L76 — Annet/multiple brudd\n\nKompresjonsbrudd i columna = L76. L73 = brudd arm/underarm. L75 = brudd femur. L76 = alle andre brudd."
    ),
    (
        "Brudd i femur (lårbein). L73, L75 eller L76?",
        "L75 — Brudd femur\n\nFemurbrudd har EGEN kode: L75. L73 = arm/underarm. L76 = andre brudd. L75 er spesifikk for femur."
    ),
    (
        "Brudd i radius. L73 eller L76?",
        "L73 — Brudd arm/underarm\n\nRadiusbrudd (underarmsbrudd) = L73. L76 er for andre brudd (ikke arm/underarm). L73 er spesifikk for overekstremitet."
    ),
    (
        "Stressfraktur i metatarsal. L73 eller L76?",
        "L76 — Annet/multiple brudd\n\nMetatarsal stressfraktur = L76. L73 = kun arm/underarm. L76 dekker fot-, ribbeins- og andre brudd."
    ),

    # --- Symptom codes for extremities: L08-L17 ---
    (
        "Skuldersmerter. L08 eller L92?",
        "L08 — Skuldersymptom/plage\n\nUspesifikke skuldersmerter = L08 (symptomkode). L92 = skuldersyndrom (diagnosekode). Bruk L08 før diagnostikk, L92 etter."
    ),
    (
        "Albuesmerter uten klar diagnose. L10 eller L93?",
        "L10 — Albuesymptom/plage\n\nUspesifikke albuesmerter = L10. L93 = epikondylitt (spesifikk diagnose). L10 for symptom, L93 for diagnostisert tilstand."
    ),
    (
        "Håndleddssmerter. L11 eller L12?",
        "L11 — Håndleddssymptom/plage\n\nHåndleddssmerter = L11. L12 = hånd/finger-symptom. L11 for håndledd spesifikt, L12 for hånd/fingre."
    ),
    (
        "Fingersmerter. L11 eller L12?",
        "L12 — Hånd/fingersymptom/plage\n\nFingersmerter = L12. L11 = håndledd. Fingre tilhører L12, håndledd tilhører L11."
    ),
    (
        "Knesmerter etter traume. L15 eller L96?",
        "L15 — Knesymptom/plage\n\nKnesmerter etter traume = L15 som initiell kode. Oppgradér til L96 (indre kneskade) etter vurdering ved menisk-/korsbåndsmistanke."
    ),
    (
        "Leggkramper. L14 eller L17?",
        "L14 — Lår-/beinsymptom/plage\n\nLeggkramper = L14 (bein/lår). L17 = fot/tå. Legg tilhører beinkategorien (L14), ikke fot (L17)."
    ),
    (
        "Smerte under fotbuen. L14 eller L17?",
        "L17 — Fotsymptom/plage\n\nSmerte under fotbuen = L17 (fot). L14 = bein/lår. Fotbuen tilhører L17."
    ),

    # --- Nerve codes: N93 vs N94 vs N99 ---
    (
        "Karpaltunnelsyndrom. N93 eller N94?",
        "N93 — Karpaltunnelsyndrom\n\nKarpaltunnel har EGEN kode: N93. N94 = andre perifere nevropatier. N93 er mer spesifikk og foretrekkes."
    ),
    (
        "Kubitaltunnelsyndrom (ulnaris nevropati). N93 eller N94?",
        "N94 — Perifer nevropati\n\nUlnaris nevropati = N94. N93 er KUN for karpaltunnel (n. medianus). Andre perifere nevropatier kodes N94."
    ),
    (
        "Peroneusparese (dropfot). N94 eller L86?",
        "L86 — Lumbalt ryggsyndrom med utstråling\n\nDropfot med lumbal årsak = L86 primært. N94 brukes kun ved perifer nerveskade (trykk på n. peroneus). Årsak avgjør kode."
    ),
    (
        "Interkostal nevralgi. N94 eller L84?",
        "L84 — Ryggsyndromer uten utstråling\n\nInterkostal nevralgi med spinalt opphav = L84. N94 kun ved isolert perifer nerveskade. L84 når opprinnelse er fra ryggsøylen."
    ),

    # --- Infection/systemic codes ---
    (
        "Ryggsmerte med feber og nattsvette. L03 eller A78?",
        "A78 — Infeksjon annen\n\nRyggsmerte med feber og nattsvette = røde flagg. A78 (infeksjon) kan brukes. L03 er FEIL ved infeksjonsmistanke. Henvis AKUTT."
    ),
    (
        "Generell smerte. A01 eller L18?",
        "A01 — Generell smerte\n\nDiffus smerte uten muskulær dominans = A01. L18 = spesifikt muskelsmerter/fibromyalgi. A01 for generelt, L18 for muskulært."
    ),
    (
        "Trøtthet som hovedsymptom. A04 eller P06?",
        "A04 — Trøtthet/slapphet\n\nTrøtthet som hovedsymptom = A04. P06 = søvnforstyrrelse. A04 = fysisk trøtthet, P06 = søvnrelatert."
    ),

    # --- Additional hierarchy: L85 vs L84 vs L98 ---
    (
        "Skoliose. L84 eller L85?",
        "L85 — Ervervet deformitet av ryggsøyle\n\nSkoliose = strukturell deformitet = L85. L84 = ryggsyndrom (smertetilstand). L85 for deformiteter, L84 for smerte."
    ),
    (
        "Hyperkyfose i brystsøylen. L84 eller L85?",
        "L85 — Ervervet deformitet av ryggsøyle\n\nHyperkyfose = strukturell deformitet = L85. L84 ville brukes for smerte UTEN deformitet. L85 for strukturelle avvik."
    ),
    (
        "Hallux valgus. L17 eller L98?",
        "L98 — Ervervet deformitet av ekstremitet\n\nHallux valgus = ervervet deformitet = L98. L17 = fotsymptom (smerte). L98 for deformiteter, L17 for smerter."
    ),
    (
        "Plattfot. L17 eller L98?",
        "L98 — Ervervet deformitet av ekstremitet\n\nPes planus = ervervet deformitet = L98. L17 brukes ved fotsmerter uten deformitet. L98 for strukturelle avvik."
    ),

    # --- Differentiation within trauma ---
    (
        "Akutt vs kronisk skade i kne. L96 eller L15?",
        "L96 for AKUTT indre kneskade (fersk menisk/korsbånd). L15 for kronisk knesymptom eller uklar diagnose. L96 er traumekode, L15 er symptomkode."
    ),
    (
        "Gammel meniskskade med nye symptomer. L96 eller L15?",
        "L15 — Knesymptom/plage\n\nKronisk meniskplage = L15 (symptomkode). L96 = AKUTT indre skade. Ved kroniske plager fra gammel skade brukes L15."
    ),

    # --- Differentiation within shoulder ---
    (
        "AC-leddsskade etter fall. L79 eller L92?",
        "L79 — Forstuing/dislokasjon annen\n\nAkutt AC-leddsskade (separasjon) = L79 (traume). L92 = skuldersyndrom (bløtdel/overbelastning). L79 for akutt traume."
    ),
    (
        "Kronisk AC-leddsartrose med smerte. L91 eller L92?",
        "L91 — Artrose, annen lokalisasjon\n\nAC-leddsartrose = L91 (artrose). L92 = bløtdelstilstand (rotatorcuff, impingement). Artrose kodes med L91, ikke L92."
    ),

    # --- Pain vs pathology ---
    (
        "Ryggsmerte med revmatoid komponent. L84 eller L88?",
        "L88 — Revmatoid artritt\n\nVed revmatoid årsak = L88 (RA). L84 = mekanisk ryggsyndrom. L88 foretrekkes ved inflammatorisk/revmatoid patologi."
    ),
    (
        "Inflammatorisk ryggsmerte med morgenstivhet >30 min. L84 eller L88?",
        "L88 — Revmatoid artritt\n\nInflammatorisk ryggsmerte med morgenstivhet >30 min = mistenk inflammatorisk revmatisk sykdom = L88. L84 = mekanisk. Henvis revmatolog."
    ),

    # --- Multiple structures ---
    (
        "Pasient med BÅDE korsrygg og nakkesmerter. Koder?",
        "L03 — Korsryggsmerter + L01 — Nakkesymptom\n\nBruk separate koder for hvert område. L03 for korsrygg, L01 for nakke (symptomkoder). Eller L84 + L83 (diagnosekoder)."
    ),
    (
        "Skulder- og albuesmerte, samme side. L08 eller L92?",
        "L08 — Skuldersymptom + L10 — Albuesymptom\n\nBruk separate symptomkoder for hvert ledd: L08 (skulder), L10 (albue). Ikke bland ledd under én kode."
    ),
    (
        "Pasient med hodepine, nakkesmerter og svimmelhet — tre koder?",
        "Ja, bruk tre koder:\n- L83 — Nakkesyndromer (primær)\n- N02 — Spenningshodepine (sekundær)\n- N17 — Vertigo/svimmelhet (sekundær)\n\nPrimærkode er vanligvis årsaken (cervikalt opphav)."
    ),

    # --- Chronic vs acute ---
    (
        "Akutt vs kronisk ryggsmerte — ulike koder?",
        "Akutt korsryggsmerte = L03 (symptomkode)\nKronisk korsryggsmerte = L84 (diagnosekode)\n\nL03 for nyoppstått, selvbegrensende. L84 for kronisk (>3 mnd) syndrom."
    ),
    (
        "Akutt nakkesmerte vs kronisk nakkesyndrom?",
        "Akutt nakkesmerte = L01 (symptomkode)\nKronisk nakkesyndrom = L83 (diagnosekode)\n\nL01 for ny plage. L83 for etablert syndrom med kliniske funn."
    ),
    (
        "Akutt skulderskade vs kronisk skulderplage?",
        "Akutt skulderskade (traume) = L79 (dislokasjon) eller L08 (symptom)\nKronisk skuldersyndrom = L92 (diagnosekode)\n\nL79 for akutt traume. L92 for overbelastning/degenerativ tilstand."
    ),
    (
        "Akutt vs kronisk hoftesmerte?",
        "Akutt hoftesmerte = L13 (symptomkode) eller L79 (traume/dislokasjon)\nKronisk hoftesmerte = L89 (artrose) eller L13 (symptom)\n\nL13 for uspesifikk. L89 for diagnostisert artrose. L79 for akutt traume."
    ),
    (
        "Entesopatier generelt. L87 eller L93?",
        "L87 — Bursitt/tendinitt/synovitt\n\nGenerelle entesopatier = L87. L93 = KUN for epikondylitt (albue). L87 dekker alle andre tendinopatier/entesopatier."
    ),
]

# =============================================================================
# CATEGORY 3: COMMON CHIROPRACTIC ICPC-2 CODES (100 examples)
# =============================================================================

COMMON_CODES_EXAMPLES = [
    # --- L01 (Neck symptom) ---
    (
        "Pasient 45 år, nakkestivhet etter lang kjøretur. ICPC-2?",
        "L01 — Nakkesymptom/plage\n\nUspesifikk nakkestivhet etter statisk belastning kodes L01. Mild, selvbegrensende plage uten diagnostiske funn."
    ),
    (
        "Ung kvinne med spenning i nakken etter stress. ICPC-2?",
        "L01 — Nakkesymptom/plage\n\nStressrelatert nakkespenning kodes L01. Symptomkode brukes når det ikke er klinisk syndrom."
    ),
    (
        "Pasient ringer om nakkesmerter som begynte i dag. ICPC-2?",
        "L01 — Nakkesymptom/plage\n\nNy nakkeplage uten klinisk undersøkelse = L01 (symptomkode). Kan oppgraderes etter vurdering."
    ),

    # --- L02 (Back symptom) ---
    (
        "Ryggsmerter generelt, ikke lokalisert. ICPC-2?",
        "L02 — Ryggsymptom/plage\n\nUspesifikke ryggsmerter uten lokalisasjon kodes L02. Differensiér mellom thorakal (L04) og lumbal (L03) ved undersøkelse."
    ),
    (
        "Stivhet i ryggen etter hagearbeid. ICPC-2?",
        "L02 — Ryggsymptom/plage\n\nGenerell ryggstivhet kodes L02. Symptomkode som kan spesifiseres til L03 (lumbal), L04 (thorakal) etter vurdering."
    ),
    (
        "Uspesifikke ryggsmerter, vet ikke om lumbal eller thorakal. ICPC-2?",
        "L02 — Ryggsymptom/plage\n\nNår lokalisasjon er uklar, bruk L02. Presiser til L03 (korsrygg) eller L04 (brystsøyle) etter undersøkelse."
    ),

    # --- L03 (Low back symptom) ---
    (
        "30 år gammel mann, akutte korsryggsmerter etter løft på jobb. ICPC-2?",
        "L03 — Korsryggsmerter uten utstråling\n\nAkutt belastningsrelatert korsryggsmerte uten utstråling. L03 er primærkode. God prognose med aktiv tilnærming."
    ),
    (
        "Gravid kvinne med korsryggsmerter, uke 32. ICPC-2?",
        "L03 — Korsryggsmerter uten utstråling\n\nGraviditetsrelaterte korsryggsmerter kodes L03. Bekkenrelaterte smerter inkluderes. Dokumentér: 'L03 — Graviditetsrelatert korsryggsmerte'."
    ),
    (
        "Eldre pasient med morgensteiv korsrygg, bedres med aktivitet. ICPC-2?",
        "L03 — Korsryggsmerter uten utstråling\n\nMorgenstivhet i korsryggen kodes L03. Bedring med aktivitet er typisk for mekanisk ryggsmerte. Utelukk inflammatorisk årsak (morgenstivhet >30 min)."
    ),

    # --- L08 (Shoulder symptom) ---
    (
        "Skuldersmerter etter maling av tak. ICPC-2?",
        "L08 — Skuldersymptom/plage\n\nBelastningsrelaterte skuldersmerter kodes L08 (symptomkode). Kan oppgraderes til L92 etter klinisk vurdering."
    ),
    (
        "Diffust ubehag i skulderregionen uten spesifikke funn. ICPC-2?",
        "L08 — Skuldersymptom/plage\n\nUspesifikke skuldersmerter uten diagnostiske funn = L08. Symptomkode som brukes før diagnose stilles."
    ),
    (
        "Skulderstivhet om morgenen hos kontorarbeider. ICPC-2?",
        "L08 — Skuldersymptom/plage\n\nMorgenstivhet i skulder uten spesifikke funn = L08. Kan oppgraderes til L92 ved impingement/rotatorcuff-funn."
    ),

    # --- L13 (Hip symptom) ---
    (
        "Hoftesmerter etter løping, uklar årsak. ICPC-2?",
        "L13 — Hoftesymptom/plage\n\nBelastningsrelatert hoftesmerte uten diagnose kodes L13 (symptomkode). Utred artrose (L89), bursitt (L87), labrumskade."
    ),
    (
        "Stivhet i hofte om morgenen hos 50-åring. ICPC-2?",
        "L13 — Hoftesymptom/plage\n\nMorgenstivhet i hofte = L13 inntil artrose er bekreftet. Vurder L89 ved radiologisk bekreftet artrose."
    ),
    (
        "Lyskesmerter med mistanke om hofteaffeksjon. ICPC-2?",
        "L13 — Hoftesymptom/plage\n\nLyskesmerter med hoftemistanke = L13. Differensiér mot L03 (lumbal referert smerte) og L14 (lårsmerte)."
    ),

    # --- L14 (Leg/thigh symptom) ---
    (
        "Smerter i låret uten kjent årsak. ICPC-2?",
        "L14 — Lår-/beinsymptom/plage\n\nUspesifikke lårsmerter kodes L14. Utred lumbal radikulopati (L86), hofteaffeksjon (L13), perifer nevropati (N94)."
    ),
    (
        "Tyngdefølelse i beinene etter lang ståing. ICPC-2?",
        "L14 — Lår-/beinsymptom/plage\n\nTyngdefølelse i bein kodes L14. Differensiér mot vaskulære årsaker (K95 — åreknuter) og nevrogen claudicatio (L86)."
    ),
    (
        "Kramper i legg om natten. ICPC-2?",
        "L14 — Lår-/beinsymptom/plage\n\nNattlige leggkramper kodes L14. Vanlig, oftest ufarlig. Utred elektrolytter ved hyppige episoder."
    ),

    # --- L15 (Knee symptom) ---
    (
        "Knesmerter etter jogging, ingen traume. ICPC-2?",
        "L15 — Knesymptom/plage\n\nBelastningsrelaterte knesmerter kodes L15. Differensiér patellofemoralt syndrom, ITBS, menisk. Symptomkode inntil diagnose."
    ),
    (
        "Kne som låser seg. ICPC-2?",
        "L15 — Knesymptom/plage\n\nLåsning i kne = L15 som symptomkode. Mistenk meniskskade (L96) eller løst legeme. Henvis til MR ved vedvarende låsning."
    ),
    (
        "Fremre knesmerter hos tenåring (patellofemoralt). ICPC-2?",
        "L15 — Knesymptom/plage\n\nPatellofemoralt smertesyndrom kodes L15. Vanlig hos unge, aktive pasienter. Dokumentér: 'L15 — Patellofemoralt smertesyndrom'."
    ),

    # --- L17 (Foot/toe symptom) ---
    (
        "Fotsmerter etter lang gåtur. ICPC-2?",
        "L17 — Fotsymptom/plage\n\nBelastningsrelaterte fotsmerter kodes L17. Differensiér plantar fascitt (L98), metatarsalgi, stressfraktur (L76)."
    ),
    (
        "Nummenhet i tær. ICPC-2?",
        "L17 — Fotsymptom/plage\n\nNummenhet i tær kodes L17. Differensiér perifer nevropati (N94), Mortons nevrom, lumbal radikulopati (L86)."
    ),
    (
        "Hallux valgus med smerter. ICPC-2?",
        "L17 — Fotsymptom/plage\n\nHallux valgus kodes L17. Alternativt L98 (ervervet deformitet). L17 foretrekkes når smerte er hovedsymptom."
    ),

    # --- L18 (Muscle pain/fibromyalgia) ---
    (
        "Utbredte muskelsmerter, trøtthet, søvnproblemer. ICPC-2?",
        "L18 — Muskelsmerter/fibromyalgi\n\nFibromyalgi-trias (smerte, trøtthet, søvn) kodes L18. Vurder ACR-kriterier. Tilleggskoder: A04 (trøtthet), P06 (søvnforstyrrelse)."
    ),
    (
        "Myofascielle smerter i kjevemuskler. ICPC-2?",
        "L18 — Muskelsmerter/fibromyalgi\n\nMyofascielle kjevesmerter kodes L18. Vurder D82 ved tannlegerelatert årsak. L18 dekker muskulære smertesyndromer."
    ),
    (
        "Generell muskelstivhet og verking etter influensa. ICPC-2?",
        "L18 — Muskelsmerter/fibromyalgi\n\nPostinfeksiøse muskelsmerter kodes L18. Myalgier ved virusinfeksjon er vanlig og selvbegrensende."
    ),

    # --- L77 (Sprain/strain ankle) ---
    (
        "Forstuing venstre ankel under fotballkamp. ICPC-2?",
        "L77 — Distorsjon/forstuing ankel\n\nAkutt ankeldistorsjon under sport kodes L77. Gradér alvorlighet (I-III). Anvend Ottawa-reglene for å utelukke brudd."
    ),
    (
        "Recidiverende ankelforstuing, 4. gang siste 2 år. ICPC-2?",
        "L77 — Distorsjon/forstuing ankel\n\nRecidiverende ankelinstabilitet kodes L77. Vurder kronisk ankelinstabilitet. Dokumentér: 'L77 — Recidiverende lateral ankeldistorsjon'."
    ),
    (
        "Hevelse og smerter medialt i ankel etter vridning. ICPC-2?",
        "L77 — Distorsjon/forstuing ankel\n\nMedial ankeldistorsjon (deltoid ligament) kodes L77. Mediale skader er mer alvorlige — utelukk syndesmoserruptur."
    ),

    # --- L83 (Neck syndrome) ---
    (
        "Nakkesyndom med hodepine og svimmelhet. ICPC-2?",
        "L83 — Nakkesyndromer\n\nNakkesyndrom med assosiert hodepine og svimmelhet. L83 primær. Tilleggskoder: N02 (hodepine), N17 (svimmelhet) om nødvendig."
    ),
    (
        "Whiplash grad II, 1 uke etter ulykke. ICPC-2?",
        "L83 — Nakkesyndromer\n\nWAD grad II kodes L83. Bevegelsesrestriksjon + muskulære funn. Dokumentér: 'L83 — WAD grad II, nakke-/muskelømhet, redusert ROM'."
    ),
    (
        "Cervikal spondylose med nakkesteifhet. ICPC-2?",
        "L83 — Nakkesyndromer\n\nCervikal spondylose kodes L83 i ICPC-2. Degenerative forandringer med kliniske symptomer. Dokumentér røntgen-/MR-funn i fritekst."
    ),

    # --- L84 (Back syndrome w/o radiation) ---
    (
        "Kronisk torakal ryggsmerte med stivhet i 6 måneder. ICPC-2?",
        "L84 — Ryggsyndromer uten utstråling\n\nKronisk torakal smerte uten radikulopati = L84. Diagnosekode for etablerte ryggsyndromer."
    ),
    (
        "Degenerativ disc disease i korsrygg uten isjas. ICPC-2?",
        "L84 — Ryggsyndromer uten utstråling\n\nDegenerativ diskussykdom uten utstråling = L84. Dokumentér: 'L84 — Degenerativ diskussykdom L4-L5'. Oppgradér til L86 ved utstråling."
    ),
    (
        "Facettleddssyndrom thorakalt med lokal smerte. ICPC-2?",
        "L84 — Ryggsyndromer uten utstråling\n\nThorakalt facettleddssyndrom = L84. Typisk: lokal smerte, forverring ved ekstensjon. Dokumentér nivå i fritekst."
    ),

    # --- L86 (Back syndrome w/ radiation) ---
    (
        "Lumbal prolaps med S1-radikulopati, dropfot. ICPC-2?",
        "L86 — Lumbalt ryggsyndrom med utstråling\n\nProlaps med motorisk utfall (dropfot) = L86. Røde flagg: Sjekk blære/tarm. Vurder akutt MR og nevrokirurgisk henvisning."
    ),
    (
        "Isjas med smerter til ankel, forverring ved hoste. ICPC-2?",
        "L86 — Lumbalt ryggsyndrom med utstråling\n\nIsjas forverret av hoste/nysing = typisk diskogen årsak. L86 er korrekt. Positiv hoste-test støtter nerverotaffeksjon."
    ),
    (
        "Spinal stenose med nevrogen claudicatio. ICPC-2?",
        "L86 — Lumbalt ryggsyndrom med utstråling\n\nNevrogen claudicatio = L86. Skilles fra vaskulær claudicatio (K92) ved: bedring ved forover-bøying, forverring ved gange."
    ),

    # --- L87 (Bursitis/tendinitis) ---
    (
        "Prepatellar bursitt hos snekker. ICPC-2?",
        "L87 — Bursitt/tendinitt/synovitt\n\nPrepatellar bursitt (snekker-kne) = L87. Yrkesrelatert bursitt. Dokumentér: 'L87 — Prepatellar bursitt, yrkesrelatert'."
    ),
    (
        "Akillestendinopati hos løper. ICPC-2?",
        "L87 — Bursitt/tendinitt/synovitt\n\nAkillestendinopati kodes L87. Skille midportion (2-6 cm over hæl) vs insertionell. Dokumentér type i fritekst."
    ),
    (
        "De Quervains tenosynovitt i håndledd. ICPC-2?",
        "L87 — Bursitt/tendinitt/synovitt\n\nDe Quervains = L87. Positiv Finkelsteins test. Dokumentér: 'L87 — De Quervains tenosynovitt, positiv Finkelstein'."
    ),

    # --- L89 (OA hip) ---
    (
        "Hofteartrose med lyskelukking og startsmerte. ICPC-2?",
        "L89 — Artrose hofte\n\nHofteartrose med lyskelukking og startsmerte = L89. Typisk klinisk bilde. Dokumentér: ROM-reduksjon, Kellgren-Lawrence grad."
    ),
    (
        "Bilateral coxartrose med gangvansker. ICPC-2?",
        "L89 — Artrose hofte\n\nBilateral coxartrose = L89. Dokumentér bilateral i fritekst. Vurder henvisning til ortoped ved betydelig funksjonstap."
    ),
    (
        "Hofteartrose røntgenverifisert. ICPC-2?",
        "L89 — Artrose hofte\n\nRøntgenverifisert hofteartrose = L89. Dokumentér Kellgren-Lawrence grad i fritekst: 'L89 — Coxartrose, KL grad III'."
    ),

    # --- L90 (OA knee) ---
    (
        "Kneartrose med krepitasjon og startsmerter. ICPC-2?",
        "L90 — Artrose kne\n\nKrepitasjon + startsmerter = typisk kneartrose = L90. Dokumentér medial/lateral kompartment og grad."
    ),
    (
        "Gonartrose med Baker-cyste. ICPC-2?",
        "L90 — Artrose kne\n\nGonartrose med Baker-cyste = L90. Baker-cysten er sekundær til artrosen. Dokumentér: 'L90 — Gonartrose med sekundær Baker-cyste'."
    ),

    # --- L92 (Shoulder syndrome) ---
    (
        "Rotatorcuff-tendinopati med painful arc 60-120°. ICPC-2?",
        "L92 — Skuldersyndrom\n\nRotatorcuff-tendinopati med painful arc = L92. Klassisk presentasjon for subacromial impingement. Dokumentér positive tester."
    ),
    (
        "Frozen shoulder fase 2, stivhet 4 måneder. ICPC-2?",
        "L92 — Skuldersyndrom\n\nFrozen shoulder (adhesiv kapsulitt) = L92. Fase 2 = stivhetspreget. Dokumentér: 'L92 — Adhesiv kapsulitt, stivhetsfase'."
    ),
    (
        "Akutt calcific tendinitt i skulder. ICPC-2?",
        "L92 — Skuldersyndrom\n\nCalcific tendinitt = L92. Akutt debut med intens smerte. Dokumentér: 'L92 — Akutt calcific tendinitt, supraspinatus'."
    ),

    # --- L93 (Tennis elbow) ---
    (
        "Tennisalbue med smerter ved grep og håndtrykk. ICPC-2?",
        "L93 — Tennisalbue\n\nLateral epikondylitt med grepsvakhet = L93. Positiv Cozen test. Dokumentér: 'L93 — Lateral epikondylitt'."
    ),
    (
        "Medial albuesmerte hos golfspiller. ICPC-2?",
        "L93 — Tennisalbue\n\nMedial epikondylitt (golferalbue) kodes OGSÅ L93 i ICPC-2. L93 dekker begge typer. Dokumentér: 'L93 — Medial epikondylitt'."
    ),

    # --- L96 (Knee meniscus/ligament) ---
    (
        "Medial meniskskade etter vridning under fotball. ICPC-2?",
        "L96 — Akutt indre skade kne\n\nMedial meniskskade = L96. Positiv McMurray/Thessaly. Dokumentér mekanisme og positive tester. Vurder MR."
    ),
    (
        "ACL-ruptur med hemartros etter skiulykke. ICPC-2?",
        "L96 — Akutt indre skade kne\n\nACL-ruptur med hemartros = L96. Positiv Lachman, fremre skufflade. Henvis ortoped. Dokumentér instabilitet."
    ),
    (
        "Kombinert MCL og medial menisk skade. ICPC-2?",
        "L96 — Akutt indre skade kne\n\nKombinert ligament-/meniskskade = L96. L96 dekker alle indre kneskader. Dokumentér alle strukturer i fritekst."
    ),

    # --- L98 (Acquired deformity limb) ---
    (
        "Hallux rigidus med gangbesvær. ICPC-2?",
        "L98 — Ervervet deformitet av ekstremitet\n\nHallux rigidus = L98. Artrose i stortåens MTP-ledd. Dokumentér: 'L98 — Hallux rigidus, bilateral'."
    ),
    (
        "Platfot med smerter. ICPC-2?",
        "L98 — Ervervet deformitet av ekstremitet\n\nPes planus (platfot) = L98. Ervervet deformitet. Dokumentér: 'L98 — Pes planus med belastningssmerter'."
    ),

    # --- N01 (Headache) ---
    (
        "Hodepine 3 dager, ikke utredet. ICPC-2?",
        "N01 — Hodepine\n\nUutredet hodepine = N01 (symptomkode). Utred type: spenning (N02), migrene (N89), annen (N95). Røde flagg: akutt debut, nevrologiske utfall."
    ),
    (
        "Ny hodepine hos 60-åring. ICPC-2?",
        "N01 — Hodepine\n\nNy hodepine hos >50 år = N01 + røde flagg-vurdering. Utelukk temporal arteritt (SR, CRP), intrakraniell patologi. Dokumentér røde flagg-screening."
    ),

    # --- N02 (Tension headache) ---
    (
        "Episodisk spenningshodepine, 2-3 ganger/uke. ICPC-2?",
        "N02 — Spenningshodepine\n\nEpisodisk spenningshodepine = N02. Bilateral, trykkende, mild-moderat. Uten kvalme/fotofobi. Dokumentér frekvens."
    ),
    (
        "Hodepine fra nakkemuskulatur, forverres mot slutten av arbeidsdagen. ICPC-2?",
        "N02 — Spenningshodepine\n\nMuskulær hodepine forverret av statisk belastning = N02. Vurder tilleggskode L83 ved cervikale funn."
    ),
    (
        "Kronisk spenningshodepine med pericranial ømhet. ICPC-2?",
        "N02 — Spenningshodepine\n\nKronisk spenningshodepine (>15 dager/mnd) med pericranial ømhet = N02. Dokumentér: 'N02 — Kronisk spenningshodepine med pericranial ømhet'."
    ),

    # --- N89 (Migraine) ---
    (
        "Migrene med aura, 2-3 anfall/mnd. ICPC-2?",
        "N89 — Migrene\n\nMigrene med aura, episodisk = N89. Dokumentér frekvens, auratype, triggere. Vurder profylakse ved >4 anfall/mnd."
    ),
    (
        "Vestibulær migrene med rotatorisk vertigo. ICPC-2?",
        "N89 — Migrene\n\nVestibulær migrene = N89 primær, N17 (vertigo) sekundær. Diagnostiseres etter Bárány-kriteriene. Dokumentér vestibulære symptomer."
    ),
    (
        "Menstruell migrene, regelmessige anfall rundt mens. ICPC-2?",
        "N89 — Migrene\n\nMenstruell migrene = N89. Hormonell trigger. Dokumentér: 'N89 — Menstruell migrene, anfall dag -2 til +3'. Vurder X78 (menstruasjon) som tillegg."
    ),

    # --- N17 (Vertigo/dizziness) ---
    (
        "BPPV i posterior kanal, positiv Dix-Hallpike. ICPC-2?",
        "N17 — Vertigo/svimmelhet\n\nBPPV posterior kanal = N17. Positiv Dix-Hallpike. Behandling: Epley-manøver. Dokumentér kanal og side."
    ),
    (
        "Cervikogen svimmelhet etter nakkeskade. ICPC-2?",
        "N17 — Vertigo/svimmelhet\n\nCervikogen svimmelhet = N17 primær, L83 sekundær (nakkesyndrom). Typisk: svimmelhet ved nakkebevegelser uten nystagmus."
    ),
    (
        "Svimmelhet hos eldre, multifaktoriell. ICPC-2?",
        "N17 — Vertigo/svimmelhet\n\nMultifaktoriell svimmelhet hos eldre = N17. Vurder: BPPV, ortostatisk hypotensjon (K88), medikamentbivirkning. Dokumentér differensialdiagnoser."
    ),

    # --- H82 (Vestibular disorder) ---
    (
        "Vestibulær nevritt med akutt vertigo og nystagmus. ICPC-2?",
        "H82 — Vertigo-syndrom\n\nVestibulær nevritt = H82. Akutt rotatorisk vertigo, horisontal nystagmus. Positiv Head Impulse Test. Dokumentér nystagmusretning."
    ),
    (
        "Vestibulær hypoaktivitet etter labyrintitt. ICPC-2?",
        "H82 — Vertigo-syndrom\n\nPostinfeksiøs vestibulær hypoaktivitet = H82. Kronisk ubalanse etter labyrintitt. Vestibulær rehabilitering anbefales."
    ),
    (
        "Ménières sykdom med anfall av vertigo, tinnitus og hørselstap. ICPC-2?",
        "H82 — Vertigo-syndrom\n\nMénières sykdom = H82. Trias: vertigo, tinnitus, fluktuerende hørselstap. Dokumentér anfallsfrekvens. Henvis ØNH."
    ),

    # --- A01 (General pain) ---
    (
        "Generaliserte smerter, ingen spesifikk lokalisasjon. ICPC-2?",
        "A01 — Generell smerte\n\nUspesifikke generaliserte smerter = A01. Differensiér mot fibromyalgi (L18) ved utbredte muskelsmerter med trykk-ømhet."
    ),
    (
        "Pasient med uspesifikk smerte i hele kroppen etter virusinfeksjon. ICPC-2?",
        "A01 — Generell smerte\n\nPostinfeksiøse generelle smerter = A01. Alternativt L18 ved muskulær dominans. A01 for mer diffust smertemønster."
    ),

    # --- R02 (Breathing difficulty) ---
    (
        "Brystsmerter ved pusting, costovertebral opprinnelse. ICPC-2?",
        "L84 — Ryggsyndromer uten utstråling\n\nCostovertebralt opphav med pustebesvær: primært L84 (ryggsyndrom). Tilleggskode R02 (pustebesvær) ved respiratoriske symptomer. Utelukk kardiopulmonale årsaker."
    ),
    (
        "Pasient med dyspne og torakale smerter. Kjent costovertebral dysfunksjon. ICPC-2?",
        "L84 — Ryggsyndromer uten utstråling\n\nCostovertebral dysfunksjon med pustebesvær = L84 primær, R02 sekundær. Viktig: Utelukk hjerte-/lungeårsaker FØRST."
    ),

    # --- Extra common presentations ---
    (
        "40-åring med hodepine, nakkesmerter og svimmelhet. ICPC-2?",
        "L83 — Nakkesyndromer\n\nPrimærkode L83. Tilleggskoder: N02 (hodepine), N17 (svimmelhet). Cervikogen komponent sannsynlig. Undersøk cervikal ROM og segmental funksjon."
    ),
    (
        "Student med rygg- og nakkesmerter etter eksamen. ICPC-2?",
        "L02 — Ryggsymptom/plage\n\nStatisk belastning under eksamenstid gir generelle plager. L02 (rygg) + L01 (nakke). Ergonomisk rådgivning."
    ),
    (
        "Eldre mann med gangvansker, stenose-symptomer. ICPC-2?",
        "L86 — Lumbalt ryggsyndrom med utstråling\n\nNevrogen claudicatio ved spinal stenose = L86. Typisk: bensmerter ved gange, bedring ved å sitte/bøye seg fremover."
    ),
    (
        "Idrettsutøver med gjentagende hamstringstrekk. ICPC-2?",
        "L14 — Lår-/beinsymptom/plage\n\nRecidiverende hamstringskade kodes L14. Alternativt L87 (tendinitt) ved seneinsersjonssmerte. Dokumentér grad og lokalisasjon."
    ),
    (
        "Pasient med plantarfascitt og hælspore på røntgen. ICPC-2?",
        "L98 — Ervervet deformitet av ekstremitet\n\nPlantarfascitt med hælspore = L98. Hælspore er oftest tilfeldig funn. Dokumentér: 'L98 — Plantar fascitt, hælspore på rtg'."
    ),
    (
        "Kronisk ryggsmerte med komorbid depresjon. ICPC-2?",
        "L84 — Ryggsyndromer uten utstråling\n\nKronisk rygg = L84 primær. Tilleggskode P76 (depresjon) for psykisk komorbiditet. Biopsykososial tilnærming viktig."
    ),
    (
        "Skuldersmerter som stråler til overarm. ICPC-2?",
        "L92 — Skuldersyndrom\n\nSkulder med overarm-utstråling = L92 (typisk for rotatorcuff). IKKE L86 (lumbal radikulopati). Skulderreferert smerte følger IKKE dermatom."
    ),
    (
        "Hofteleddssmerter med positiv FADIR og FABER. ICPC-2?",
        "L13 — Hoftesymptom/plage\n\nPositiv FADIR/FABER = hofteintraarticulær patologi. L13 (symptomkode). Vurder L89 (artrose) eller labrumskade. MR for videre diagnostikk."
    ),
    (
        "Akutt torticollis etter å ha sovet feil. ICPC-2?",
        "L83 — Nakkesyndromer\n\nAkutt torticollis = L83. Muskulær årsak sannsynlig. God prognose, vanligvis selvbegrensende innen 1-2 uker."
    ),
    (
        "Hodepine og nakkesmerter etter sykkelulykke. ICPC-2?",
        "L83 — Nakkesyndromer\n\nTraumerelatert nakkesyndrom = L83 primær. Tilleggskode N01 (hodepine). Utelukk hjernerystelse. Vurder røntgen/CT ved alvorlig mekanisme."
    ),

    # --- Additional common presentations ---
    (
        "Pasient med karpaltunnelsymptomer, nummenhet i fingre 1-3. ICPC-2?",
        "N93 — Karpaltunnelsyndrom\n\nNummenhet i fingre 1-3 (medianusinnerverte) = klassisk karpaltunnel. N93. Positiv Tinel/Phalen styrker diagnosen."
    ),
    (
        "Skuldersmerte om natten, kan ikke sove på siden. ICPC-2?",
        "L92 — Skuldersyndrom\n\nNattlige skuldersmerter = typisk rotatorcuff-patologi. L92. Dokumentér: 'L92 — Rotatorcuff-tendinopati med nattlige smerter'."
    ),
    (
        "Pasient 65 år med knesmerter ved trappegåing. ICPC-2?",
        "L90 — Artrose kne\n\nKnesmerter ved trappegåing hos eldre = typisk kneartrose. L90. Dokumentér funksjonsnivå og smerteskala."
    ),
    (
        "Sportsutøver med lyskesmerter, mistanke om atletisk pubalgi. ICPC-2?",
        "L13 — Hoftesymptom/plage\n\nAtletisk pubalgi/sportsbrokk kodes L13 (hoftesymptom). Differensiér mot inguinalhernie. Dokumentér: 'L13 — Atletisk pubalgi'."
    ),
    (
        "Eldre dame med hoftebrudd etter fall. ICPC-2?",
        "L75 — Brudd femur\n\nHoftebrudd (collum femoris) = L75. Akutt henvisning ortopedisk avdeling. L75 er spesifikk kode for femurbrudd."
    ),
    (
        "Barn med voksesmerter i legger om natten. ICPC-2?",
        "L14 — Lår-/beinsymptom/plage\n\nVoksesmerter hos barn kodes L14. Typisk: bilateral leggsmerte om natten, normalt klinisk funn. Godartet tilstand."
    ),
    (
        "Pasient med piskesmell for 3 år siden, vedvarende plager. ICPC-2?",
        "L83 — Nakkesyndromer\n\nKronisk whiplash (WAD) kodes L83. Langvarige plager etter piskesmell. Dokumentér: 'L83 — Kronisk WAD, 3 år posttraumatisk'."
    ),
    (
        "Tannlege med skuldersmerter fra arbeidsstilling. ICPC-2?",
        "L92 — Skuldersyndrom\n\nYrkesrelatert skulderplage kodes L92. Statisk belastning i overhead-stilling. Vurder ergonomisk rådgivning."
    ),
    (
        "Gravid i uke 35 med bekkenbunnssmerter og symphysesmerte. ICPC-2?",
        "L03 — Korsryggsmerter uten utstråling\n\nSymphyserelaksasjon/bekkensmerter i graviditet = L03. Bekkenbunnssmerter faller under korsrygg-kategorien i ICPC-2."
    ),
    (
        "Kontorarbeider med generell trøtthet og nakkesmerter etter lang dag. ICPC-2?",
        "L01 — Nakkesymptom/plage\n\nStatisk belastningsrelatert nakkeplage = L01. Tilleggskode A04 (trøtthet) ved uttalt energiløshet."
    ),
    (
        "Gammel mann med spinal stenose, kan gå 200m før smerte. ICPC-2?",
        "L86 — Lumbalt ryggsyndrom med utstråling\n\nSpinal stenose med gangbegrenset nevrogen claudicatio = L86. Dokumentér gangdistanse og symptomforverring."
    ),
    (
        "Ung atlet med stressfraktur i tibia. ICPC-2?",
        "L76 — Annet/multiple brudd\n\nStressfraktur tibia = L76. Overbelastningsskade hos idrettsutøvere. Dokumentér: 'L76 — Stressfraktur tibia, høyre'."
    ),
    (
        "Pasient med akutt isjias som forverres ved hoste og nysing. ICPC-2?",
        "L86 — Lumbalt ryggsyndrom med utstråling\n\nForverring ved Valsalva-manøver (hoste/nysing) indikerer diskogen radikulopati. L86. Positiv hoste-test."
    ),
    (
        "Kronisk lateral albuesmerte hos snekker. ICPC-2?",
        "L93 — Tennisalbue\n\nKronisk lateral epikondylitt (yrkesrelatert) = L93. Dokumentér yrkeseksponering: 'L93 — Lateral epikondylitt, yrkesrelatert'."
    ),
    (
        "Reumatolog-henvist pasient med inflammatorisk ryggsmerte. ICPC-2?",
        "L84 — Ryggsyndromer uten utstråling\n\nInflammatorisk ryggsmerte = L84 primært. Vurder L88 (RA) ved bekreftet revmatisk diagnose. Dokumentér inflammatoriske funn."
    ),
]


def build_all_examples():
    """Build all 300 examples across three categories."""
    examples = []

    # Category 1: Disambiguation (100 examples) — use SYSTEM_DISAMBIGUATION
    for user, assistant in DISAMBIGUATION_EXAMPLES:
        examples.append(make_example(SYSTEM_DISAMBIGUATION, user, assistant))

    # Category 2: Hierarchy (100 examples) — use SYSTEM_STANDARD
    for user, assistant in HIERARCHY_EXAMPLES:
        examples.append(make_example(SYSTEM_STANDARD, user, assistant))

    # Category 3: Common codes (100 examples) — use SYSTEM_STANDARD
    for user, assistant in COMMON_CODES_EXAMPLES:
        examples.append(make_example(SYSTEM_STANDARD, user, assistant))

    return examples


def main():
    count_only = '--count' in sys.argv

    examples = build_all_examples()

    cat1_count = len(DISAMBIGUATION_EXAMPLES)
    cat2_count = len(HIERARCHY_EXAMPLES)
    cat3_count = len(COMMON_CODES_EXAMPLES)
    total = len(examples)

    print(f"ICPC-2 v2 Training Data Generator")
    print(f"=" * 50)
    print(f"Category 1 (ICPC-2 vs ICD-10 Disambiguation): {cat1_count}")
    print(f"Category 2 (Code Hierarchy & Specificity):     {cat2_count}")
    print(f"Category 3 (Common Chiropractic Codes):        {cat3_count}")
    print(f"{'=' * 50}")
    print(f"Total examples: {total}")

    if count_only:
        print("\n(--count mode, not writing file)")
        return

    # Shuffle for training diversity
    random.seed(42)
    random.shuffle(examples)

    # Ensure output directory exists
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        for ex in examples:
            f.write(json.dumps(ex, ensure_ascii=False) + '\n')

    print(f"\nWritten to: {OUTPUT_FILE}")
    print(f"File size: {OUTPUT_FILE.stat().st_size / 1024:.1f} KB")

    # Validation
    print(f"\nValidation:")
    errors = 0
    with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f, 1):
            try:
                data = json.loads(line)
                msgs = data['messages']
                assert len(msgs) == 3, f"Line {i}: expected 3 messages, got {len(msgs)}"
                assert msgs[0]['role'] == 'system', f"Line {i}: first message not system"
                assert msgs[1]['role'] == 'user', f"Line {i}: second message not user"
                assert msgs[2]['role'] == 'assistant', f"Line {i}: third message not assistant"

                # Check response length
                resp_len = len(msgs[2]['content'])
                if resp_len < 50:
                    print(f"  WARNING line {i}: response too short ({resp_len} chars)")
                    errors += 1
                if resp_len > 600:
                    print(f"  WARNING line {i}: response too long ({resp_len} chars)")
                    errors += 1

            except (json.JSONDecodeError, KeyError, AssertionError) as e:
                print(f"  ERROR line {i}: {e}")
                errors += 1

    if errors == 0:
        print(f"  All {total} examples valid!")
    else:
        print(f"  {errors} issues found")


if __name__ == '__main__':
    main()
