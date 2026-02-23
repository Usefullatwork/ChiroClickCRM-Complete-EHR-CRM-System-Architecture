#!/usr/bin/env python3
"""
Generate v4 targeted training data: 100 examples across 3 categories.

Categories:
  - 50 ICPC-2 diagnosis code examples (Norwegian chiropractic context)
  - 30 red flag detection examples (edge cases + subtle presentations)
  - 20 communication/SOAP examples (Norwegian clinical language)

Output: ChatML JSONL format for train_unsloth.py
Usage: python generate_v4_targeted.py [--output ../data/raw/v4-targeted.jsonl]
"""

import json
import random
import argparse
from pathlib import Path

# ============================================================
# SYSTEM PROMPTS
# ============================================================

SYSTEM_DIAGNOSIS = (
    'Du er en klinisk kodeassistent for kiropraktikk i Norge. '
    'Gi ICPC-2-koder basert på klinisk presentasjon. '
    'Inkluder primærkode og eventuelle sekundærkoder med begrunnelse.'
)

SYSTEM_RED_FLAG = (
    'Du er en medisinsk sikkerhetsrådgiver for kiropraktikk. '
    'Identifiser røde flagg, gi differensialdiagnostikk og klinisk resonnering. '
    'Prioriter alltid pasientsikkerhet. '
    'Klassifiser hastegrad: AKUTT (ring 113), HENVIS SAMME DAG, '
    'HENVIS RUTINE, MONITORÉR, eller TRYGT.'
)

SYSTEM_SOAP = (
    'Du er en klinisk dokumentasjonsassistent for kiropraktorer i Norge. '
    'Skriv profesjonelle SOAP-notater på norsk med korrekt medisinsk terminologi.'
)

# ============================================================
# HELPERS
# ============================================================

def make_example(system: str, user: str, assistant: str, meta: dict = None) -> dict:
    ex = {
        'messages': [
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': user},
            {'role': 'assistant', 'content': assistant},
        ]
    }
    if meta:
        ex['metadata'] = meta
    return ex

# ============================================================
# CATEGORY 1: ICPC-2 DIAGNOSIS CODES (50 examples)
# ============================================================

ICPC2_EXAMPLES = [
    # Spine conditions
    ('Pasient 45 år, akutte korsryggsmerter etter løft, ingen utstråling, positiv Kemp test.',
     'Primærkode: L84 Ryggsyndromer uten utstråling\nBegrunnelse: Akutt mekanisk korsryggsmerte uten nevrologiske funn. Kemp-positiv tyder på fasettleddsaffeksjon.\nSekundær: Ingen nødvendig.',
     {'icpc2': 'L84'}),

    ('Mann 32 år, nakkesmerter med utstråling til venstre arm, svekket bicepsrefleks C5-C6.',
     'Primærkode: L83 Nakkesyndromer med utstråling\nBegrunnelse: Cervikal radikulopati C5-C6 basert på dermatomal utstråling og reflekspåvirkning.\nSekundær: N94 Perifer nevritt/nevralgi',
     {'icpc2': 'L83'}),

    ('Kvinne 55 år, langvarig skuldersmerte >3 mnd, begrenset aktiv og passiv abduksjon, negativ Neer test.',
     'Primærkode: L92 Skuldersyndromer\nBegrunnelse: Klinisk bilde forenlig med adhesiv kapsulitt (frozen shoulder) basert på global bevegelsesrestriksjon.\nSekundær: Ingen.',
     {'icpc2': 'L92'}),

    ('Gutt 14 år, smerter mellom skulderbladene, forverret ved sitting, Scheuermann lignende kyfose.',
     'Primærkode: L85 Ervervede deformiteter i ryggsøylen\nBegrunnelse: Klinisk presentasjon forenlig med Scheuermanns sykdom. Bekreftes med røntgen.\nSekundær: Ingen.',
     {'icpc2': 'L85'}),

    ('Kvinne 38 år, hodepine fra nakken, ømhet suboccipitalt, forverret ved kontorarbeid.',
     'Primærkode: N95 Spenningshodepine\nBegrunnelse: Cervikogen komponent med muskulær ømhet suboccipitalt. Typisk arbeidsstillingsrelatert.\nSekundær: L83 Nakkesyndromer med utstråling',
     {'icpc2': 'N95'}),

    ('Mann 60 år, smerter i høyre kne, crepitus, redusert fleksjon, BMI 31.',
     'Primærkode: L90 Kne artrose\nBegrunnelse: Aldersadekvat artrose med typiske funn: crepitus, bevegelsesrestriksjon, overvekt som risikofaktor.\nSekundær: T82 Overvekt',
     {'icpc2': 'L90'}),

    ('Kvinne 28 år, kjeveleddssmerter, klikking ved gaping, ømme masseter, bruksisme anamnese.',
     'Primærkode: L07 Kjeveleddssymptomer\nBegrunnelse: TMD med diskdysfunksjon basert på klikking og muskulær ømhet.\nSekundær: Ingen.',
     {'icpc2': 'L07'}),

    ('Mann 45 år, bilateral isjiassmerte, gangvansker, urinretensjon siste 24t.',
     'Primærkode: L86 Ryggsyndromer med utstråling\nBegrunnelse: AKUTT cauda equina syndrom - umiddelbar henvisning! Bilateral ischias + blæredysfunksjon.\nSekundær: U02 Vannlatingsproblemer',
     {'icpc2': 'L86'}),

    ('Kvinne 70 år, akutt thorakalsmerte etter hoste, kjent osteoporose, punktømhet Th8.',
     'Primærkode: L76 Brudd annet\nBegrunnelse: Mistenkt osteoporotisk kompresjonsbrudd Th8. Lav-energi traume hos osteoporotisk pasient.\nSekundær: L95 Osteoporose',
     {'icpc2': 'L76'}),

    ('Mann 25 år, skuldersmerter etter fall på utstrakt hånd, apprehension test positiv.',
     'Primærkode: L92 Skuldersyndromer\nBegrunnelse: Mulig anterior skulderinstabilitet etter traume. Positiv apprehension test.\nSekundær: L81 Skade muskel/sene',
     {'icpc2': 'L92'}),

    # Hip/pelvis
    ('Kvinne 35 år, lyskesmerter høyre side, positiv FADIR, ingen traume.',
     'Primærkode: L13 Hoftesymptomer\nBegrunnelse: FAI (femoroacetabulær impingement) mistenkt basert på positiv FADIR-test og lyskesmerte uten traume.\nSekundær: Ingen.',
     {'icpc2': 'L13'}),

    ('Mann 50 år, smerter i seteregionen, piriformis stram, negativ SLR.',
     'Primærkode: L18 Muskelsmerter\nBegrunnelse: Piriformis syndrom basert på lokal ømhet og negativ SLR som utelukker diskogen årsak.\nSekundær: Ingen.',
     {'icpc2': 'L18'}),

    # Extremities
    ('Kvinne 42 år, smerter i albue lateralt, positiv Cozen test, kontorarbeider.',
     'Primærkode: L93 Tennisalbue\nBegrunnelse: Lateral epikondylitt med positiv belastningstesting.\nSekundær: Ingen.',
     {'icpc2': 'L93'}),

    ('Mann 55 år, nummenhet i tommel, pekefinger, langfinger. Positiv Phalen test.',
     'Primærkode: N93 Karpaltunnelsyndrom\nBegrunnelse: Typisk presentasjon med median nerve distribusjon og positiv provokasjonstest.\nSekundær: Ingen.',
     {'icpc2': 'N93'}),

    ('Kvinne 30 år, smerter under fot ved oppstart av aktivitet, ømhet medialt calcaneus.',
     'Primærkode: L98 Ervervet fotdeformitet\nBegrunnelse: Plantar fasciitt basert på typisk smerte ved oppstart og lokal ømhet.\nSekundær: Ingen.',
     {'icpc2': 'L98'}),

    # Headache
    ('Mann 40 år, ensidig pulserende hodepine med kvalme, fotofobi, varighet 8 timer.',
     'Primærkode: N89 Migrene\nBegrunnelse: Oppfyller ICHD-3 kriterier: unilateral, pulserende, moderat-alvorlig, kvalme, fotofobi, 4-72 timer.\nSekundær: Ingen.',
     {'icpc2': 'N89'}),

    ('Kvinne 22 år, daglig hodepine, bruker ibuprofen 4-5 dager/uke, >3 mnd.',
     'Primærkode: N89 Migrene\nBegrunnelse: Medikamentoverforbrukshodepine (MOH) basert på >15 dager/mnd hodepine med analgetikaoverforbruk.\nSekundær: A85 Legemiddelbivirkninger',
     {'icpc2': 'N89'}),

    # Dizziness
    ('Kvinne 65 år, posisjonssvimmelhet ved snuing i seng, positiv Dix-Hallpike høyre.',
     'Primærkode: N17 Svimmelhet\nBegrunnelse: BPPV i bakre buegang høyre basert på typisk anamnese og positiv Dix-Hallpike.\nSekundær: Ingen.',
     {'icpc2': 'N17'}),

    # Pediatric
    ('Jente 8 år, ryggsmerter ved aktivitet, lordose lumbal økt.',
     'Primærkode: L84 Ryggsyndromer uten utstråling\nBegrunnelse: Ryggsmerter hos barn krever videre utredning (røntgen) for å utelukke spondylolyse.\nSekundær: Ingen. Obs: Røntgen anbefalt.',
     {'icpc2': 'L84'}),

    # Pregnancy-related
    ('Kvinne 32 år, gravid uke 28, bekkensmerter, positiv ASLR test.',
     'Primærkode: W75 Skader/sykdom i svangerskapet\nBegrunnelse: Svangerskapsrelaterte bekkensmerter med SI-leddsdysfunksjon.\nSekundær: L02 Ryggsymptomer',
     {'icpc2': 'W75'}),

    # Neurological
    ('Mann 52 år, nummenhet begge føtter, diabetes type 2, svekket vibrasjonssans.',
     'Primærkode: N94 Perifer nevritt/nevralgi\nBegrunnelse: Diabetisk polynevropati. Symmetrisk distal sensorisk nevropati.\nSekundær: T90 Diabetes type 2',
     {'icpc2': 'N94'}),

    # Thoracic
    ('Kvinne 35 år, brystsmerter ved dyp inspirasjon, ømhet Th4-6, normal EKG.',
     'Primærkode: L84 Ryggsyndromer uten utstråling\nBegrunnelse: Thorakal dysfunksjon med kostovertebral irritasjon. Kardial årsak utelukket.\nSekundær: Ingen.',
     {'icpc2': 'L84'}),

    ('Mann 28 år, interscapulær smerte, dårlig arbeidsstilling, forverres ved PC-arbeid.',
     'Primærkode: L83 Nakkesyndromer med utstråling\nBegrunnelse: Referred smerte fra cervikothorakal overgang. Ergonomisk rådgivning indisert.\nSekundær: L18 Muskelsmerter',
     {'icpc2': 'L83'}),

    # Sports injuries
    ('Mann 19 år, ankelsmerte etter inversjonstraume, Ottawa-regler negativ.',
     'Primærkode: L77 Forstuvning/forstrekning ankel\nBegrunnelse: Lateralt ligamentskade ankel. Ottawa-regler negative utelukker fraktur.\nSekundær: Ingen.',
     {'icpc2': 'L77'}),

    ('Kvinne 25 år, fremre knesmerte, forverret ved trapping, positiv Clarke test.',
     'Primærkode: L15 Knesymptomer\nBegrunnelse: Patellofemoralt smertesyndrom med retropatellar irritasjon.\nSekundær: Ingen.',
     {'icpc2': 'L15'}),

    # Work-related
    ('Mann 48 år, repeterende skuldersmerte, maler, positiv Hawkins test, Empty can svak.',
     'Primærkode: L92 Skuldersyndromer\nBegrunnelse: Supraspinatus tendinopati/impingement. Arbeidsrelatert overbelastning.\nSekundær: Ingen.',
     {'icpc2': 'L92'}),

    # Elderly
    ('Kvinne 78 år, gradvis økende kyfose, høydetap 4 cm siste 5 år.',
     'Primærkode: L95 Osteoporose\nBegrunnelse: Progredierende thorakal kyfose med høydetap forenlig med osteoporotiske kompresjonsbrudd.\nSekundær: L85 Ervervede deformiteter i ryggsøylen',
     {'icpc2': 'L95'}),

    # Inflammatory
    ('Mann 24 år, morgenstivhet >1 time i korsryggen, bedre ved aktivitet, HLA-B27 positiv.',
     'Primærkode: L88 Revmatoid artritt\nBegrunnelse: Ankyloserende spondylitt mistenkt basert på inflammatorisk ryggsmerte og HLA-B27+. Henvisning revmatolog.\nSekundær: Ingen.',
     {'icpc2': 'L88'}),

    # Post-surgical
    ('Kvinne 50 år, vedvarende smerte 6 mnd etter laminektomi L4-L5.',
     'Primærkode: L86 Ryggsyndromer med utstråling\nBegrunnelse: Failed back surgery syndrome. Multimodal tilnærming anbefalt.\nSekundær: A97 Ingen sykdom',
     {'icpc2': 'L86'}),

    # Chronic pain
    ('Kvinne 45 år, utbredte smerter >3 mnd, 14/18 tender points, søvnvansker, fatigue.',
     'Primærkode: L18 Muskelsmerter\nBegrunnelse: Fibromyalgi basert på utbredte smerter, tender points og assosierte symptomer.\nSekundær: P06 Søvnforstyrrelse',
     {'icpc2': 'L18'}),

    # Whiplash
    ('Kvinne 30 år, nakkesmerter 2 uker etter bilulykke, stiv nakke, hodepine.',
     'Primærkode: L83 Nakkesyndromer med utstråling\nBegrunnelse: WAD grad II (whiplash) med bevegelsesrestriksjon. Gradert rehabilitering.\nSekundær: N95 Spenningshodepine',
     {'icpc2': 'L83'}),

    # Wrist/hand
    ('Mann 35 år, smerter i håndledd etter fall, snuff box ømhet.',
     'Primærkode: L74 Brudd håndledd/hånd\nBegrunnelse: Mistenkt scaphoidfraktur. Snuff box ømhet krever røntgen + ev. CT.\nSekundær: Ingen.',
     {'icpc2': 'L74'}),

    ('Kvinne 50 år, smerter radiale side håndledd, positiv Finkelstein test.',
     'Primærkode: L93 Tennisalbue\nBegrunnelse: De Quervains tenosynovitt. Kodes L93 (nærmeste ICPC-2 for tendinopati).\nSekundær: Ingen.',
     {'icpc2': 'L93'}),

    # Sacroiliac
    ('Mann 40 år, ensidig smerter over SI-ledd, positiv Gaenslen, negativ SLR.',
     'Primærkode: L84 Ryggsyndromer uten utstråling\nBegrunnelse: SI-leddsdysfunksjon basert på lokal smerte og positiv provokasjonstest.\nSekundær: Ingen.',
     {'icpc2': 'L84'}),

    # Myofascial
    ('Kvinne 38 år, referred smerte fra trapezius til tinningen, palpabel streng.',
     'Primærkode: L18 Muskelsmerter\nBegrunnelse: Myofascielt triggerpunkt i øvre trapezius med typisk referred smerte-mønster.\nSekundær: N95 Spenningshodepine',
     {'icpc2': 'L18'}),

    # Complex case
    ('Mann 65 år, korsryggsmerter med claudicatio, bedre ved foroverfleksjon, MR viser spinal stenose.',
     'Primærkode: L86 Ryggsyndromer med utstråling\nBegrunnelse: Lumbal spinal stenose med nevrogen claudicatio. MR-verifisert.\nSekundær: Ingen.',
     {'icpc2': 'L86'}),

    # Rib dysfunction
    ('Kvinne 45 år, smerte ved dyp innpust, ømhet costotransversalt Th5-7.',
     'Primærkode: L04 Brystsymptomer\nBegrunnelse: Kostotransversal dysfunksjon Th5-7. Kardial/pulmonal årsak utelukket.\nSekundær: Ingen.',
     {'icpc2': 'L04'}),

    # Coccydynia
    ('Kvinne 35 år, smerter i halebeinet etter fall, forverret ved sitting.',
     'Primærkode: L84 Ryggsyndromer uten utstråling\nBegrunnelse: Coccydyni post-traume. Sitepute og mobilisering.\nSekundær: Ingen.',
     {'icpc2': 'L84'}),

    # Groin pain differential
    ('Mann 30 år, lyskesmerter etter fotball, ømhet over adduktorfeste.',
     'Primærkode: L81 Skade muskel/sene\nBegrunnelse: Adduktorstrekk. Utelukk lyskebrokk ved klinisk undersøkelse.\nSekundær: Ingen.',
     {'icpc2': 'L81'}),

    # Lateral hip pain
    ('Kvinne 55 år, smerter lateralt over trochanter major, forverret ved sidelengs liggende.',
     'Primærkode: L13 Hoftesymptomer\nBegrunnelse: Trokanterisk bursitt / gluteal tendinopati.\nSekundær: Ingen.',
     {'icpc2': 'L13'}),

    # Achilles
    ('Mann 40 år, smerter i akillessene, fortykkelse palperes, morgensmerte.',
     'Primærkode: L87 Bursitt/tendinitt\nBegrunnelse: Akillestendinopati midporsjon basert på palpabel fortykkelse og typisk symptombilde.\nSekundær: Ingen.',
     {'icpc2': 'L87'}),

    # Complex headache
    ('Mann 55 år, ny type hodepine siste 3 uker, progressivt verre, morgenverst.',
     'Primærkode: N01 Hodepine\nBegrunnelse: NY hodepine >50 år, progressiv, morgenverst = rødt flagg. AKUTT MR cerebrum for å utelukke romoppfyllende prosess.\nSekundær: Ingen. HENVIS SAMME DAG.',
     {'icpc2': 'N01'}),

    # Jaw with referred pain
    ('Kvinne 40 år, øresmerter, men normal otoskopi. Ømhet lateral pterygoid.',
     'Primærkode: L07 Kjeveleddssymptomer\nBegrunnelse: Referred smerte fra TMD til øret. Typisk feildiagnostisering.\nSekundær: Ingen.',
     {'icpc2': 'L07'}),

    # Elbow - medial
    ('Mann 35 år, smerter medialt i albue, golfer, positiv revers Cozen test.',
     'Primærkode: L93 Tennisalbue\nBegrunnelse: Medial epikondylitt (golferalbue). Kodes L93.\nSekundær: Ingen.',
     {'icpc2': 'L93'}),

    # Shoulder - AC joint
    ('Mann 30 år, smerter over AC-ledd etter fall, positiv cross-body test.',
     'Primærkode: L92 Skuldersyndromer\nBegrunnelse: AC-leddsaffeksjon etter direkte traume. Røntgen for å gradere.\nSekundær: Ingen.',
     {'icpc2': 'L92'}),

    # Complex multisystem
    ('Kvinne 60 år, ryggsmerter, uforklart vekttap 5 kg/3 mnd, nattsvette.',
     'Primærkode: L84 Ryggsyndromer uten utstråling\nBegrunnelse: RØDT FLAGG: Uforklart vekttap + nattsvette + ryggsmerter = utredning for malignitet. HENVIS SAMME DAG.\nSekundær: A03 Feber',
     {'icpc2': 'L84'}),

    # Hypermobility
    ('Kvinne 22 år, generaliserte smerter, Beighton score 7/9, hyppige forstuvninger.',
     'Primærkode: L99 Andre sykdommer bevegelsesapparatet\nBegrunnelse: Hypermobilitetsspektrumforstyrrelse (HSD) eller hEDS. Stabiliserende treningsprogram.\nSekundær: Ingen.',
     {'icpc2': 'L99'}),

    # Tarsal tunnel
    ('Mann 50 år, brennende smerter medialt ankel til fotsåle, positiv Tinel bak mediale malleol.',
     'Primærkode: N94 Perifer nevritt/nevralgi\nBegrunnelse: Tarsaltunnelsyndrom (posterior tibial nerve entrapment).\nSekundær: Ingen.',
     {'icpc2': 'N94'}),
]

# ============================================================
# CATEGORY 2: RED FLAG DETECTION (30 examples)
# ============================================================

RED_FLAG_EXAMPLES = [
    # Subtle cauda equina
    ('Mann 48 år, korsryggsmerter med bilateral ischias. Rapporterer «endret følelse ved toalettbesøk» men ingen inkontinens. Normal kraft.',
     'HASTEGRAD: HENVIS SAMME DAG\n\nRØDE FLAGG:\n- Bilateral ischias = mulig sentral diskprolaps\n- Endret perianal sensibilitet = tidlig cauda equina tegn\n\nRESSONNERING: Selv uten manifeste sfinkterproblemer er endret sensibilitet perianalt et tidlig cauda equina-tegn. Krever MR innen 24 timer.\n\nTILTAK: Akutt MR lumbal, nevrokirurgisk vurdering.',
     {'severity': 'SAME_DAY'}),

    # Vertebral artery dissection
    ('Kvinne 35 år, akutt nakkesmerte og hodepine etter yoga, ingen traume. Svimmelhet ved hoderotasjon.',
     'HASTEGRAD: AKUTT (ring 113)\n\nRØDE FLAGG:\n- Akutt nakkesmerte + hodepine etter cervikalstrekk\n- Svimmelhet = mulig vertebralisaffeksjon\n\nRESSONNERING: Vertebral arterie disseksjon må utelukkes. Yoga-stillinger med nakkeekstensjon/rotasjon er kjent risikofaktor.\n\nTILTAK: IKKE manipuler nakken. Akutt CT-angiografi. Ring 113 ved nevrologiske utfall.',
     {'severity': 'ACUTE'}),

    # Temporal arteritis
    ('Kvinne 72 år, ny ensidig temporal hodepine, tyggeclaudicatio, SR 85.',
     'HASTEGRAD: HENVIS SAMME DAG\n\nRØDE FLAGG:\n- Alder >50 med ny hodepine\n- Tyggeclaudicatio = patognomonisk for temporalisarteritt\n- Forhøyet SR\n\nRESSONNERING: Kjempecellearteritt med risiko for permanent synstap. Start prednisolon UMIDDELBART, temporalisbiopsi innen 2 uker.\n\nTILTAK: Akutt blodprøver (SR, CRP), oftalmologisk vurdering, start steroidbehandling.',
     {'severity': 'SAME_DAY'}),

    # Cardiac masquerading as thoracic
    ('Mann 58 år, «ribbeismerter» venstre side, forverret ved anstrengelse, lindret av hvile. Diabetiker.',
     'HASTEGRAD: AKUTT (ring 113)\n\nRØDE FLAGG:\n- Smerte forverret ved anstrengelse, lindret av hvile = klassisk angina\n- Diabetikere kan ha atypisk presentasjon\n- Venstre thorakal smerte\n\nRESSONNERING: Selv om pasienten beskriver det som «ribbeismerter» er belastningsmønsteret typisk for kardial årsak. IKKE behandle muskuloskeletalt.\n\nTILTAK: Ring 113. EKG + troponiner akutt.',
     {'severity': 'ACUTE'}),

    # Safe case with distractors
    ('Mann 30 år, korsryggsmerter etter møbelflytting, smerte i seteregionen, positiv SLR 60° høyre. Normal kraft, normal sensibilitet, normal refleks.',
     'HASTEGRAD: TRYGT\n\nKLINISK VURDERING:\n- Mekanisk korsryggsmerte med irritasjon av nerverot\n- SLR 60° positiv men INGEN nevrologiske utfall\n- Normal kraft, sensibilitet og reflekser\n\nRESSONNERING: Akutt diskogen smerte uten nevrologisk kompromiss. Konservativ behandling trygt. Redevaluer hvis progresjon av nevrologiske utfall.\n\nTILTAK: Manipulasjon, mobilisering, rådgivning om aktivitet.',
     {'severity': 'SAFE'}),

    # Infection
    ('Kvinne 65 år, gradvis økende ryggsmerte, feber 38.5°C, nylig urinveisinfeksjon.',
     'HASTEGRAD: HENVIS SAMME DAG\n\nRØDE FLAGG:\n- Feber + ryggsmerte = mistenkt spondylodiskitt\n- Nylig infeksjon = mulig hematogen spredning\n\nRESSONNERING: Diskitt/osteomyelitt må utelukkes. Spesielt med pågående/nylig infeksjon.\n\nTILTAK: Blodprøver (SR, CRP, leukocytter, blodkultur), MR rygg, infeksjonsmedisinsk vurdering.',
     {'severity': 'SAME_DAY'}),

    # Safe - degenerative
    ('Kvinne 68 år, langvarig korsryggsmerte, verre etter lang gange, bedre ved hvile. Ingen nattsmerte, stabil vekt.',
     'HASTEGRAD: TRYGT\n\nKLINISK VURDERING:\n- Mekanisk smertemønster forenlig med degenerative forandringer\n- Ingen røde flagg: ingen nattsmerte, ingen vekttap\n\nRESSONNERING: Aldersadekvat degenerativ korsryggsmerte. Belastningsrelatert mønster er beroligende.\n\nTILTAK: Konservativ behandling, treningsbasert rehabilitering.',
     {'severity': 'SAFE'}),

    # Progressive neuro deficit
    ('Mann 42 år, dropper ting fra høyre hånd siste 2 uker, nakkesmerter, nummenhet C7.',
     'HASTEGRAD: HENVIS SAMME DAG\n\nRØDE FLAGG:\n- Progressiv motorisk svakhet (drop things)\n- Nevrologisk utfall i C7-distribusjon\n\nRESSONNERING: Progredierende nevrologisk utfall krever akutt bildediagnostikk. Mulig stor diskprolaps med myelopati-risiko.\n\nTILTAK: Akutt MR cervikalt, nevrokirurgisk vurdering.',
     {'severity': 'SAME_DAY'}),

    # Safe - muscle strain
    ('Mann 22 år, akutt smerter i korsryggen etter vektløfting, lokalisert til paraspinal muskulatur, full ROM men smertefullt.',
     'HASTEGRAD: TRYGT\n\nKLINISK VURDERING:\n- Akutt muskelstrekk etter klart utløsende årsak\n- Lokalisert smerte uten utstråling\n- Full bevegelsesutslag bevart\n\nRESSONNERING: Typisk mekanisk muskelstrekk. Ung pasient, klar mekanisme, ingen alarmtegn.\n\nTILTAK: Manuell behandling, råd om gradert tilbakegang til aktivitet.',
     {'severity': 'SAFE'}),

    # Myelopathy
    ('Mann 62 år, ustøhet ved gange, klossete hender, Lhermitte positiv.',
     'HASTEGRAD: HENVIS SAMME DAG\n\nRØDE FLAGG:\n- Gangvansker + finmotorisk svikt = myelopati-tegn\n- Lhermitte tegn = ryggmargsaffeksjon\n\nRESSONNERING: Cervikal myelopati. KONTRAINDISERT for cervikal manipulasjon. Krever akutt MR.\n\nTILTAK: IKKE manipuler. Akutt MR cervikalt, nevrokirurg.',
     {'severity': 'SAME_DAY'}),

    # Safe - tension headache
    ('Kvinne 35 år, bilateral trykkhodepine, stress på jobb, ømme muskler nakke-skulder, ingen kvalme.',
     'HASTEGRAD: TRYGT\n\nKLINISK VURDERING:\n- Typisk episodisk spenningshodepine\n- Bilateral, trykkende, uten kvalme/fotofobi\n- Klar stresskomponent med muskulære funn\n\nRESSONNERING: Oppfyller kriterier for spenningshodepine. Ingen alarmtegn.\n\nTILTAK: Manuell behandling nakke-skulder, ergonomisk rådgivning, stressmestring.',
     {'severity': 'SAFE'}),

    # Pathological fracture
    ('Mann 70 år, akutt ryggsmerte uten traume, kjent prostatakreft, nye smerter Th10.',
     'HASTEGRAD: AKUTT (ring 113)\n\nRØDE FLAGG:\n- Kjent malignitet + nye ryggsmerter = metastase inntil motbevist\n- Prostatakreft = høy risiko for skjelettmetastaser\n\nRESSONNERING: Patologisk fraktur eller vertebral metastase. KONTRAINDISERT for manipulasjon.\n\nTILTAK: IKKE manipuler. Akutt bildediagnostikk, onkologisk vurdering.',
     {'severity': 'ACUTE'}),

    # Safe - pregnancy
    ('Kvinne 30 år, gravid uke 30, bekkensmerter SI-ledd, forverret ved trappegang.',
     'HASTEGRAD: TRYGT\n\nKLINISK VURDERING:\n- Svangerskapsrelaterte bekkensmerter er normalt\n- SI-leddsdysfunksjon pga hormonell laksitet\n\nRESSONNERING: Vanlig svangerskapsplage. Trygt å behandle med tilpassede teknikker.\n\nTILTAK: Side-lying mobilisering, bekkenbelte, tilpassede øvelser.',
     {'severity': 'SAFE'}),

    # DVT
    ('Kvinne 45 år, ensidig hevelse i venstre legg, smerte ved dorsalfleksjon, nylig lang flyreise.',
     'HASTEGRAD: AKUTT (ring 113)\n\nRØDE FLAGG:\n- Unilateral legghevelse + smerte = DVT inntil motbevist\n- Langvarig flyreise = kjent risikofaktor\n- Positiv Homans tegn\n\nRESSONNERING: Dyp venetrombose. Risiko for lungeemboli ved mobilisering.\n\nTILTAK: IKKE massér eller manipuler leggen. Akutt ultralyd duplex.',
     {'severity': 'ACUTE'}),

    # Safe with anxiety
    ('Mann 25 år, brystsmerter, hyperventilering, nummenhet i fingre, panikkanfall-historikk.',
     'HASTEGRAD: MONITORÉR\n\nKLINISK VURDERING:\n- Hyperventilasjonssyndrom med perifer nummenhet\n- Kjent angst/panikk-historikk\n- Ung pasient uten kardiale risikofaktorer\n\nRESSONNERING: Sannsynlig psykogen/muskuloskeletal årsak, men førstegangs brystsmerter bør evalueres.\n\nTILTAK: Berolige, pustøvelser, anbefal EKG ved første episode.',
     {'severity': 'MONITOR'}),

    # Aortic aneurysm
    ('Mann 75 år, akutt korsryggsmerter, pulserende masse abdominalt, hypotensjon.',
     'HASTEGRAD: AKUTT (ring 113)\n\nRØDE FLAGG:\n- Pulserende abdominal masse = aortaaneurisme\n- Hypotensjon = mulig ruptur\n- LIVSTRUENDE\n\nRESSONNERING: Rumperende abdominalt aortaaneurisme. Ring 113 umiddelbart.\n\nTILTAK: Ring 113. IKKE palpér abdomen. Legg pasienten ned, elevert bein.',
     {'severity': 'ACUTE'}),

    # Safe - rotator cuff tendinopathy
    ('Mann 52 år, skuldersmerte ved overhead aktivitet, painful arc 60-120°, normal kraft.',
     'HASTEGRAD: TRYGT\n\nKLINISK VURDERING:\n- Supraspinatus tendinopati med typisk painful arc\n- Normal kraft utelukker fulltykkelse ruptur\n\nRESSONNERING: Degenerativ rotator cuff tendinopati. Konservativ behandling.\n\nTILTAK: Eksentrisk trening, manuell terapi, aktivitetsmodifisering.',
     {'severity': 'SAFE'}),

    # Saddle anesthesia
    ('Kvinne 50 år, korsryggsmerter, nummenhet i perineum, normal vannlating MEN «føler ikke papiret».',
     'HASTEGRAD: AKUTT (ring 113)\n\nRØDE FLAGG:\n- Perianal hypoestesi (saddle anesthesia) = cauda equina\n- Subtil presentasjon: «føler ikke papiret» er tidlig tegn\n\nRESSONNERING: Cauda equina syndrom. Selv uten inkontinens er sensorisk utfall i perineum alarmerende.\n\nTILTAK: Ring 113. Akutt MR. Nevrokirurgisk dekompresjon innen 48 timer.',
     {'severity': 'ACUTE'}),

    # Safe - post-exercise soreness
    ('Kvinne 28 år, bilateral muskelsmerte i lår 48 timer etter første styrketrening, normal kraft.',
     'HASTEGRAD: TRYGT\n\nKLINISK VURDERING:\n- DOMS (Delayed Onset Muscle Soreness)\n- Bilateral, symmetrisk, klar utløsende årsak\n- Normal kraft bevart\n\nRESSONNERING: Normal fysiologisk respons. Ingen behandling nødvendig.\n\nTILTAK: Berolige, lett aktivitet, progresjon av treningsprogram.',
     {'severity': 'SAFE'}),

    # Spinal cord compression
    ('Mann 68 år, progressiv svakhet begge ben siste 3 uker, hyperrefleksi, Babinski positiv.',
     'HASTEGRAD: AKUTT (ring 113)\n\nRØDE FLAGG:\n- Progressiv bilateral svakhet = myelopati\n- Øvre motornevron-tegn (hyperrefleksi, Babinski)\n- Raskt progredierende = akutt trussel\n\nRESSONNERING: Ryggmargskompresjon. Kontraindisert for all spinal manipulasjon.\n\nTILTAK: Ring 113. Akutt MR hele ryggsøylen.',
     {'severity': 'ACUTE'}),

    # Safe - posture related
    ('Jente 16 år, øvre ryggsmerter, mye mobilbruk, ingen nattsmerter, vekst normal.',
     'HASTEGRAD: TRYGT\n\nKLINISK VURDERING:\n- Holdningsrelatert brystryggsmerte\n- Typisk for ungdom med mye skjermbruk\n- Ingen alarmtegn (normal vekst, ingen nattsmerter)\n\nRESSONNERING: Muskulær overbelastning fra dårlig holdning. Ergonomisk intervensjon.\n\nTILTAK: Holdningsøvelser, skjermtidsreduksjon, thorakal mobilisering.',
     {'severity': 'SAFE'}),

    # Bone metastasis
    ('Kvinne 58 år, nattlige ryggsmerter som vekker henne, uforklart vekttap, trøtthet.',
     'HASTEGRAD: HENVIS SAMME DAG\n\nRØDE FLAGG:\n- Nattsmerte som vekker pasienten = patologisk prosess\n- Uforklart vekttap + fatigue = systemisk sykdom\n\nRESSONNERING: Alarmtegn for malignitet. Utredning nødvendig. IKKE behandle som mekanisk ryggsmerte.\n\nTILTAK: Blodprøver (SR, CRP, ALP, PSA/CA-125), MR rygg, fastlege for videre utredning.',
     {'severity': 'SAME_DAY'}),

    # Safe - breastfeeding
    ('Kvinne 32 år, thorakal smerte og stivhet, ammer tvillinger, dårlig holdning ved amming.',
     'HASTEGRAD: TRYGT\n\nKLINISK VURDERING:\n- Mekanisk thorakal smerte fra ammestilling\n- Klar biomekanisk forklaring\n\nRESSONNERING: Svært vanlig hos ammende mødre. Ergonomisk rådgivning og behandling trygt.\n\nTILTAK: Thorakal mobilisering, øvelser, ammestillingsveiledning.',
     {'severity': 'SAFE'}),

    # Cervical myelopathy subtle
    ('Mann 70 år, nummenhet i begge hender, vansker med knapper, normal EMG armer.',
     'HASTEGRAD: HENVIS RUTINE\n\nRØDE FLAGG:\n- Bilateral håndnummenhet med finmotorisk svikt\n- Normal EMG armer utelukker perifer nevropati\n- Sentral årsak mistenkt\n\nRESSONNERING: Cervikal myelopati må utelukkes (EMG er normal fordi lesjonen er sentral). MR cervikalt.\n\nTILTAK: MR cervikalt, nevrologisk vurdering.',
     {'severity': 'ROUTINE_REFER'}),

    # Safe - mechanical neck
    ('Mann 40 år, ensidig nakkesmerte etter å ha sovet feil, begrenset rotasjon, ømme muskler.',
     'HASTEGRAD: TRYGT\n\nKLINISK VURDERING:\n- Akutt torticollis / «vond nakke»\n- Klar utløsende årsak, ingen nevrologiske utfall\n\nRESSONNERING: Typisk akutt nakkesmerte. Muskelspasme med bevegelsesrestriksjon.\n\nTILTAK: Manipulasjon/mobilisering, varme, aktivt bevegelsesutslag-øvelser.',
     {'severity': 'SAFE'}),

    # Infection - septic arthritis
    ('Mann 72 år, akutt hevelse høyre kne, varmt, rødt, feber 39°C. Diabetes.',
     'HASTEGRAD: AKUTT (ring 113)\n\nRØDE FLAGG:\n- Akutt monoartikulær artritt + feber = septisk artritt inntil motbevist\n- Diabetes = immunsupprimert, økt risiko\n\nRESSONNERING: Septisk artritt krever akutt leddpunksjon og antibiotika. Forsinket behandling = ledddestruksjon.\n\nTILTAK: Ring 113. IKKE behandle konservativt. Akutt leddpunksjon + antibiotika.',
     {'severity': 'ACUTE'}),

    # Safe - exercise related
    ('Mann 35 år, smerter mellom skulderbladene etter 10 km løp, normal nevrologisk status.',
     'HASTEGRAD: TRYGT\n\nKLINISK VURDERING:\n- Postaktivitetssmerte i thorakal region\n- Klar utløsende årsak, normal nevrologisk status\n\nRESSONNERING: Mekanisk thorakal smerte fra løpebelastning. Ingen alarmtegn.\n\nTILTAK: Thorakal mobilisering, stretching, gradert tilbakegang.',
     {'severity': 'SAFE'}),

    # Drop foot
    ('Mann 38 år, kan ikke dorsalflektere høyre fot etter korsryggsmerte, SLR 30° positiv.',
     'HASTEGRAD: HENVIS SAMME DAG\n\nRØDE FLAGG:\n- Droppfot = motorisk utfall L4-L5\n- Markant positiv SLR = signifikant nerverotskompresjon\n\nRESSONNERING: Signifikant diskprolaps med motorisk utfall. Krever akutt bildediagnostikk og nevrokirurgisk vurdering.\n\nTILTAK: Akutt MR lumbal, nevrokirurgisk konsultasjon.',
     {'severity': 'SAME_DAY'}),

    # Safe - desk worker
    ('Kvinne 30 år, bilateral skulder-nakkesmerte, kontorarbeider, bedre i ferier.',
     'HASTEGRAD: TRYGT\n\nKLINISK VURDERING:\n- Ergonomisk betinget muskuloskeletal smerte\n- Bedring i ferier = sterk indikasjon på arbeidsrelatert\n\nRESSONNERING: Typisk arbeidsrelatert nakke-skuldersyndrom. Ergonomisk tilrettelegging viktigst.\n\nTILTAK: Ergonomisk vurdering av arbeidsplass, manuell behandling, hjemmeøvelser.',
     {'severity': 'SAFE'}),
]

# ============================================================
# CATEGORY 3: COMMUNICATION / SOAP (20 examples)
# ============================================================

SOAP_EXAMPLES = [
    ('Skriv subjektiv for pasient med akutte korsryggsmerter etter hagearbeid.',
     'S: Pasienten oppsøker klinikken grunnet akutte korsryggsmerter som oppstod i går ettermiddag under hagearbeid (løfting av tunge poser). Smertene er lokalisert til nedre del av korsryggen, mest uttalt på høyre side. Pasienten beskriver smerten som stikkende og verkende, VAS 7/10. Forverres ved foroverfleksjon, hosting og snuing i seng. Lindres noe ved hvile i sideleie med pute mellom knærne. Ingen utstråling til ben. Ingen nummenhet eller kraftsvikt. Ingen blære- eller tarmproblemer. Ingen feber eller allmennsymptomer. Tidligere frisk, ingen tidligere ryggproblemer.'),

    ('Skriv objektiv for cervikal undersøkelse, positiv kompresjonstest høyre.',
     'O: Observasjon: Normal cervikal lordose. Ingen muskelatrofi.\nPalpasjon: Ømhet i paraspinal muskulatur C4-C6 bilateralt, mest uttalt høyre. Fasettømhet C5-C6 høyre.\nBevegelsesutslag: Fleksjon 50° (normal), ekstensjon 40° (noe begrenset), høyre rotasjon 60° (begrenset med smerte), venstre rotasjon 70° (normal), høyre lateralfleksjon 30° (begrenset), venstre lateralfleksjon 40° (normal).\nOrtopediske tester: Spurlings test positiv høyre (utstråling til skulder), cervikal kompresjonstest positiv høyre, cervikal distraksjonstest lindrer. Jakson test positiv høyre.\nNevrologisk: Kraft 5/5 i alle myotomer C5-Th1. Sensibilitet normal. Biceps-, triceps- og brachioradialisrefleks symmetrisk og normal.'),

    ('Skriv assessment for skulder impingement.',
     'A: Kliniske funn forenlig med subakromialt impingement syndrom høyre skulder. Positiv Neer test, Hawkins-Kennedy test og painful arc 60-120° støtter diagnosen. Normal kraft i rotator cuff-muskulatur taler mot fulltykkelse ruptur. Negativ Speed test og O\'Brien test gjør labral patologi mindre sannsynlig. Sammenfatning: Subakromial bursitt/supraspinatustendinopati grad I-II. ICPC-2: L92. Differensialdiagnoser: AC-leddspatologi (mindre sannsynlig gitt negativ cross-body test), cervikal referred smerte (utelukket ved negativ Spurling).'),

    ('Skriv plan for ny pasient med korsrygg og utstrålende smerte høyre ben.',
     'P:\n1. Behandling: Manuell terapi med leddmobilisering L4-L5 og L5-S1. Bløtvevsbehandling av hypertone gluteale og piriformis muskler. Lateral glidning McKenzie-teknikk for å sentralisere symptomene.\n2. Hjemmeøvelser: Utlevert øvelsesprogram med McKenzie-ekstensjoner (10 rep x 3/dag), nervegliding for n. ischiadicus (3x15 rep/dag), og core-stabilisering (dead bug, bird-dog).\n3. Rådgivning: Unngå langvarig sitting >30 min, bruk lendestøtte. Gradert tilbakegang til normal aktivitet. Is 15 min ved akutte forverringer.\n4. Oppfølging: Ny time om 3-5 dager. Vurdere respons på behandling. Hvis ingen bedring etter 4 behandlinger, vurdere MR-henvisning.\n5. Røde flagg informasjon: Oppsøk legevakt ved urinretensjon, nummenhet i perineum, eller økende kraftsvikt i benet.'),

    ('Skriv en kort SOAP for oppfølgingstime, bedring etter 3 behandlinger.',
     'S: Pasienten rapporterer god bedring. VAS redusert fra 7/10 til 3/10. Kan nå sitte 45 min uten forverring (var 15 min). Gjennomfører hjemmeøvelser daglig. Sover bedre, våkner ikke lenger av smerte. Ingen utstråling til ben siste uke.\n\nO: Palpasjon: Redusert muskulær hypertonus paraspinalt L4-S1. Leddspill bedret L5-S1. SLR: 80° bilateralt (var 50° høyre). Full ROM lumbal uten smerteprovokasjon ved fleksjon (var smertefullt). Nevrologi uendret normal.\n\nA: God klinisk respons etter 3 behandlinger. Sentralisering av symptomer oppnådd. Prognostisk gunstig.\n\nP: Fortsett manuell terapi med fokus på mobilisering og stabilisering. Progresjon av hjemmeøvelser til mer krevende varianter. Øke intervall mellom behandlinger til 1x/uke. Mål: Full funksjon innen 2-3 uker.'),

    ('Skriv en pasientvennlig forklaring av korsryggsmerte på norsk.',
     'Korsryggen din er stiv og irritert akkurat nå. Tenk på det som en forstuelse — musklene og leddene i nedre rygg har blitt overbelastet. Det er vondt, men det er viktig å vite at dette vanligvis går over av seg selv.\n\nDe fleste med denne typen ryggplager blir bedre innen noen uker. Det viktigste du kan gjøre er å holde deg i bevegelse, selv om det er litt ubehagelig. Sengeleie over flere dager gjør faktisk vondt verre.\n\nHer er noen konkrete ting som hjelper:\n- Korte, rolige turer flere ganger daglig\n- Øvelsene jeg viste deg — gjør dem 2-3 ganger om dagen\n- Veksle mellom sittende, stående og gående posisjoner\n- Unngå tunge løft de neste ukene\n\nHvis smertene plutselig forverres, eller du merker nummenhet, prikking i beina, eller problemer med å holde på urin, skal du ringe legevakten med en gang.'),

    ('Skriv henvisning til MR for cervikal radikulopati.',
     'Til: Radiologisk avdeling\nFra: [Klinikknavn], kiropraktor\nDato: [dato]\n\nPasient: [Navn], [alder] år\nHenvisningsgrunn: Cervikal radikulopati C6 høyre\n\nAnamnese: 6 ukers sykehistorie med nakkesmerter og utstråling til høyre arm i C6-distribusjon (lateral underarm, tommel). VAS 6/10. Forverres ved cervikal ekstensjon og høyre rotasjon. Parestesier i tommel intermitterende.\n\nKliniske funn: Positiv Spurlings test høyre med utstråling til C6-dermatom. Svekket bicepsrefleks høyre (1+ vs 2+ venstre). Kraft: Biceps 4+/5 høyre. Sensibilitet: Lett nedsatt berøringssans laterale underarm og tommel høyre.\n\nKonservativ behandling med manuell terapi og øvelser i 4 uker uten tilfredsstillende bedring.\n\nØnske: MR cervikalt for å vurdere diskpatologi og foraminal stenose C5-C6.\n\nHastegrad: Innen 2 uker (progredierende nevrologisk utfall).'),

    ('Skriv oppfølgingsnotat for en pasient med TMD.',
     'S: Pasient rapporterer 50% bedring av kjevesmerter. Kan nå spise myk mat uten vesentlig smerte. Gaping fortsatt begrenset men bedre. Bruksisme-skinnen brukes hver natt. Hodepinen har avtatt fra daglig til 2-3 ganger per uke.\n\nO: Palpasjon: Redusert ømhet m. masseter bilateralt (VAS 4→2). M. temporalis fortsatt øm venstre. Gapiong: 38 mm (var 30 mm, normal >40 mm). Klikking i høyre TMJ ved åpning redusert. Lateral bevegelse 8 mm bilateralt (bedring fra 5 mm).\n\nA: God fremgang for TMD-behandling. Klikking redusert tyder på bedret diskposisjon. Muskulær ømhet avtagende.\n\nP: Fortsett intraoral myofascial behandling masseter og pterygoid. Cervikal mobilisering for assosiert nakkedysfunksjon. Kjeveøvelser videreføres. Neste time om 2 uker. Vurdere tannlege for oklusal vurdering hvis platå.'),

    ('Skriv SOAP-notat for gravid kvinne uke 32 med bekkensmerter.',
     'S: Gravid uke 32, primigravida. Tiltagende smerter over bekkenet siste 3 uker, mest uttalt over SI-ledd høyre og symfyse. VAS 5/10. Forverres ved trappegang, snuing i seng, og langvarig stående. Lindres ved hvile med pute mellom knærne. Bruker bekkenbelte som gir noe lindring. Ingen utstråling til ben. Ingen nummenhet.\n\nO: Gange med lett vaggende mønster (Duchenne). Ømhet over symfysen og høyre SI-ledd. ASLR positiv høyre (VAS 4, lindring med kompresjon). Gaenslen test positiv høyre. Patrick/FABER svakt positiv høyre. Ikke gjennomført SLR grunnet graviditet. Nevrologisk status: Normal kraft og sensibilitet UE.\n\nA: Svangerskapsrelaterte bekkensmerter (pelvic girdle pain, PGP) med SI-leddsdysfunksjon og symfysesmerte. Forventet forverring mot termin. Ingen nevrologiske alarmtegn.\n\nP: Side-lying SI-leddsmobilisering. Bløtvevsbehandling gluteale muskler. Bekkenbelte videreføres. Øvelser: Modifisert bridging, sit-to-stand, transversus aktivering. Ergonomiske råd: Unngå enbensstående aktiviteter, sov med pute mellom knær. Ny time om 1 uke.'),

    ('Skriv avslagsbrev for en pasient som ber om behandling du ikke kan gi.',
     'Kjære [pasientnavn],\n\nTakk for at du tok kontakt med klinikken vår angående dine plager.\n\nEtter min vurdering av din sykehistorie og kliniske bilde, mener jeg at kiropraktisk behandling ikke er den riktige behandlingsformen for dine nåværende plager. Basert på symptomene du beskriver, anbefaler jeg at du kontakter fastlegen din for videre utredning og henvisning til riktig spesialist.\n\nDette er ikke en avvisning av deg som pasient — det handler om å sikre at du får den best mulige behandlingen for akkurat din tilstand. Å behandle noe utenfor mitt kompetanseområde ville ikke vært forsvarlig.\n\nJeg har skrevet et kort notat til fastlegen din som du gjerne kan ta med. Der beskriver jeg mine funn og anbefaling.\n\nTa gjerne kontakt igjen dersom du har spørsmål, eller hvis fastlegen din mener det er aktuelt med kiropraktisk behandling som del av en tverrfaglig tilnærming.\n\nMed vennlig hilsen,\n[Kiropraktor navn]\n[Klinikknavn]'),

    ('Generer differensialdiagnoser for thorakal smerte hos 35-åring.',
     'Differensialdiagnoser for thorakal smerte, kvinne 35 år:\n\n**Mest sannsynlig (muskuloskeletalt):**\n1. Kostovertebral dysfunksjon — ømhet over kostovertebrale ledd, smerte ved dyp inspirasjon\n2. Thorakal fasettleddsdysfunksjon — segmental stivhet, lokal ømhet\n3. Myofascielt smertesyndrom — trigger points i rhomboideus/trapezius\n4. Kostokondritt — ømhet over kostokondrale overganger, Tietzes syndrom hvis hevelse\n\n**Bør vurderes:**\n5. Cervikal referred smerte — sjekk nakke-ROM og Spurlings\n6. Thoracic outlet syndrom — om armsymptomer foreligger\n7. Scheuermanns — om thorakal kyfose er prominent\n\n**Utelukkes (røde flagg):**\n8. Kardial årsak — EKG ved belastningsrelatert smerte (lav risiko 35 år kvinne)\n9. Lungeemboli — ved brystsmerter + dyspné + risikofaktorer\n10. Pneumothorax — akutt onset + dyspné\n11. Herpes zoster — ensidig, dermatomalt, vesikulært utslett\n\nAnbefalt fremgangsmåte: Start med grundig muskuloskeletal undersøkelse. Utelukk kardiale og pulmonale årsaker ved atypisk presentasjon.'),

    ('Skriv en sykemelding-anbefaling for pasient med akutt diskprolaps.',
     'Til: NAV / Fastlege [navn]\n\nPasient: [navn], [alder] år\nYrke: [yrke]\nDiagnose: ICPC-2 L86 — Lumbal diskprolaps med radikulopati\n\nKliniske funn:\n- MR-verifisert diskprolaps L4-L5 med kompresjon av L5-roten\n- VAS 8/10 med utstråling til venstre ben\n- Positiv SLR 30° venstre\n- Kraft: Dorsalfleksjon stortå 4/5 venstre\n\nAktivitetsbegrensninger:\n- Kan ikke sitte >10 minutter\n- Kan ikke løfte >2 kg\n- Gangdistanse begrenset til 100 meter\n\nAnbefaling:\n- Uke 1-2: Full sykemelding. Pasienten har betydelige funksjonsbegrensninger som hindrer enhver form for arbeid.\n- Uke 3-4: Vurdere gradert sykemelding 50% dersom klinisk bedring. Tilpasset arbeid uten løfting, mulighet for å veksle mellom sittende og stående.\n- Uke 5-8: Gradvis opptrapping til full arbeidstid med tilrettelegging.\n\nBehandlingsplan: Kiropraktisk behandling 2x/uke, hjemmeøvelser daglig, gradert aktivitetsøkning.'),

    ('Lag et kort epikrisenotat etter fullført behandlingsserie.',
     'Epikrise — Fullført behandlingsserie\n\nPasient: [navn], [alder] år\nBehandlingsperiode: [startdato] — [sluttdato]\nAntall behandlinger: 8\n\nHenvisningsårsak: Akutt korsryggsmerte med utstråling til høyre ben (L5-radikulopati)\n\nVed oppstart: VAS 7/10, SLR 40° høyre, nedsatt kraft dorsalfleksjon 4/5. Vesentlige funksjonsbegrensninger.\n\nBehandling gitt: Leddmobilisering L4-L5 og L5-S1, bløtvevsbehandling, McKenzie-øvelser, nervegliding, core-stabilisering.\n\nVed avslutning: VAS 1/10, SLR 85° bilateralt, full kraft. Gjenopptatt normal aktivitet inkludert trening.\n\nKonklusjon: God klinisk respons på konservativ behandling. Pasienten er velinformert om egenmestring og kontakt ved residiv.\n\nAnbefaling til fastlege: Ingen videre oppfølging nødvendig. MR ikke indisert gitt god klinisk bedring.'),

    ('Skriv pasientinformasjon om nakkeøvelser på norsk.',
     'Hjemmeøvelser for nakken — Gjør disse 2-3 ganger daglig\n\n1. HAKEINNTRUKK (Chin tuck)\nSitt rett. Trekk haken rett bakover som om du lager dobbelhake. Hold 5 sekunder. Slipp. Gjenta 10 ganger.\nDette styrker de dype nakkemusklene.\n\n2. NAKKESTREKK TIL SIDEN\nBøy hodet forsiktig mot høyre skulder. Kjenn strekk på venstre side. Hold 20 sekunder. Bytt side. Gjenta 3 ganger hver side.\n\n3. ROTASJON\nSnu hodet forsiktig til høyre, se over skulderen. Hold 5 sekunder. Snu til venstre. Gjenta 10 ganger til hver side.\n\n4. SKULDERHEVING\nLøft begge skuldre mot ørene. Hold 5 sekunder. Slipp ned og slapp av. Gjenta 10 ganger.\n\n5. VEGGENGEL\nStå med ryggen mot veggen. Press bakhode, skuldrer og albuer mot veggen. Skyv armene opp og ned langs veggen som engler i snøen. 10 repetisjoner.\n\nVIKTIG:\n- Stopp hvis det gjør vondt — det skal kjennes som et strekk, ikke smerte\n- Ikke press bevegelsene\n- Gjør øvelsene jevnt og rolig\n- Ring klinikken hvis du opplever svimmelhet, prikking i armene eller forverring'),

    ('Skriv en forsikringsrapport for trafikkskade.',
     'KIROPRAKTISK SPESIALISTERKLÆRING — TRAFIKKSKADE\n\nSkadedato: [dato]\nUndersøkelsesdato: [dato]\nSkadenummer: [nummer]\n\nPASIENTOPPLYSNINGER:\nNavn: [navn]\nFødselsdato: [dato]\nYrke: [yrke]\n\nSKADEMEKANISME:\nPasienten var fører av personbil som ble påkjørt bakfra i kø. Estimert hastighet ved kollisjon: ca 30 km/t. Pasienten hadde setebeltet på. Hodestøtten var korrekt innstilt. Symptomer oppstod innen 24 timer etter ulykken.\n\nSYMPTOMER VED FØRSTE KONSULTASJON:\n- Nakkesmerter VAS 6/10\n- Hodepine occipitalt VAS 5/10\n- Stivhet i nakke og øvre rygg\n- Svimmelhet ved hurtig hoderotasjon\n\nOBJEKTIVE FUNN:\n- Redusert cervikal ROM: Fleksjon 40° (n: 50°), ekstensjon 30° (n: 60°), rotasjon 50° bilateralt (n: 80°)\n- Uttalt muskelspasme i cervikale paraspinale muskler\n- Segmental dysfunksjon C2-C3, C5-C6\n- Nevrologisk status: Uten anmerkning\n\nDIAGNOSE: WAD grad II — Whiplash Associated Disorder\n\nBEHANDLING OG FORLØP:\n[Behandlingsdetaljer, antall timer, respons]\n\nKONKLUSJON:\nPasientens plager er forenlige med den beskrevne skademekanismen. Det foreligger medisinsk sannsynlighetsovervekt (>50%) for årsakssammenheng mellom ulykken og pasientens plager.'),

    ('Skriv en arbeidsevnevurdering for pasient med kroniske ryggsmerter.',
     'KIROPRAKTISK ARBEIDSEVNEVURDERING\n\nDato: [dato]\nPasient: [navn], [alder] år\nYrke: [nåværende yrke]\n\nBakgrunn:\nPasienten har kroniske korsryggsmerter (>6 måneder) med intermitterende utstråling til høyre ben. Behandlet med kiropraktikk, fysioterapi og smertemestring.\n\nFunksjonsvurdering:\n- Sittende: Tolererer 30 min sammenhengende (normalt for kontorarbeid: 60 min)\n- Stående: Tolererer 20 min\n- Gange: Kan gå 2 km uten forverring\n- Løfting: Kan løfte inntil 5 kg fra bord, ikke fra gulv\n- Bøying/vridning: Begrenset, utløser smerte\n\nArbeidskapasitet:\nPasienten vurderes å ha redusert arbeidskapasitet for sitt nåværende yrke som [yrke]. Spesifikt:\n- Kan ikke utføre tunge løft >5 kg\n- Trenger mulighet for posisjonsveksling\n- Bør unngå langvarig statisk stilling\n\nAnbefaling:\n- Tilpasset arbeidsplass med hev/senk-pult\n- Mulighet for pauser til posisjonsveksling\n- Gradert opptrapping av arbeidstid\n- Unntak fra tunge løfteoppgaver'),

    ('Generer røde flagg-sjekkliste for ny pasient med ryggsmerte.',
     'RØDE FLAGG — SYSTEMATISK SJEKKLISTE FOR RYGGSMERTER\n\n☐ Cauda equina syndrom:\n  - Blæreretensjon eller inkontinens?\n  - Avføringsinkontinens?\n  - Sadel-anestesi (nummenhet rundt sete/perineum)?\n  - Bilateral ischias?\n  - Progressiv nevrologisk svikt?\n\n☐ Malignitet:\n  - Kjent kreftsykdom?\n  - Uforklart vekttap >5 kg siste 3 mnd?\n  - Alder >50 med ny debut ryggsmerte?\n  - Nattsmerte som vekker pasienten?\n  - Smerter som ikke lindres av hvile?\n\n☐ Infeksjon:\n  - Feber?\n  - Nylig kirurgi eller invasiv prosedyre?\n  - Immunsuppresjon (diabetes, HIV, steroider)?\n  - IV rusbruk?\n  - Nylig infeksjon (UVI, hudinfeksjon)?\n\n☐ Fraktur:\n  - Betydelig traume?\n  - Alder >70 med lavenergi-traume?\n  - Kjent osteoporose?\n  - Langvarig steroidbruk?\n  - Punktømhet over spinalutskuddet?\n\n☐ Inflammatorisk:\n  - Alder <40 med >3 mnd morgenstivhet >1 time?\n  - Bedring ved aktivitet, verre ved hvile?\n  - Familiær anamnese for inflammatorisk sykdom?\n\n☐ Vaskulær:\n  - Pulserende abdominal masse? (AAA)\n  - Smerte i hvile med vaskulære risikofaktorer?\n\nFunn av ETT rødt flagg = videre utredning nødvendig.'),

    ('Skriv kvitteringsnotat for utlevert treningsprogram.',
     'TRENINGSPROGRAM — KVITTERING\n\nDato: [dato]\nPasient: [navn]\nBehandler: [kiropraktor navn]\n\nDiagnose: [diagnose]\n\nFølgende treningsprogram er gjennomgått og demonstrert:\n\n1. [Øvelse 1] — [sett x reps] — [formål]\n2. [Øvelse 2] — [sett x reps] — [formål]\n3. [Øvelse 3] — [sett x reps] — [formål]\n\nFrekvens: [antall ganger per dag/uke]\nProgresjon: [når og hvordan øke belastning]\n\nPasienten har forstått øvelsene og kan utføre dem korrekt.\nPasienten er informert om å stoppe ved smerte og kontakte klinikken ved forverring.\n\nSignatur pasient: _______________\nSignatur behandler: _______________'),

    ('Skriv pasientbrev om endring i behandlingsplan.',
     'Kjære [pasientnavn],\n\nJeg skriver for å informere deg om en justering i behandlingsplanen din.\n\nBasert på din fremgang de siste 4 behandlingene ser vi god bedring i bevegelighet og smertenivå. Du har gått fra VAS 6 til VAS 3, og nakke-ROM er normalisert.\n\nJeg anbefaler derfor at vi:\n1. Reduserer behandlingsfrekvensen fra 2x/uke til 1x/uke de neste 3 ukene\n2. Fokuserer mer på øvelser og egenmestring\n3. Evaluerer behovet for videre behandling etter 3 uker\n\nMålet er at du skal bli selvhjulpen og ikke avhengig av behandling. Øvelsene du har lært er det viktigste verktøyet for langsiktig bedring.\n\nDersom du opplever forverring mellom timene, ta kontakt med klinikken så finner vi en ekstra time.\n\nNeste time: [dato og tid]\n\nMed vennlig hilsen,\n[Kiropraktor navn]\n[Klinikknavn]'),
]


# ============================================================
# MAIN
# ============================================================

def generate_all():
    examples = []

    # ICPC-2 diagnosis codes (50)
    for scenario, response, meta in ICPC2_EXAMPLES:
        examples.append(make_example(SYSTEM_DIAGNOSIS, scenario, response, meta))

    # Red flag detection (30)
    for scenario, response, meta in RED_FLAG_EXAMPLES:
        examples.append(make_example(SYSTEM_RED_FLAG, f'Vurder røde flagg: {scenario}', response, meta))

    # Communication / SOAP (20)
    for prompt, response in SOAP_EXAMPLES:
        examples.append(make_example(SYSTEM_SOAP, prompt, response))

    return examples


def main():
    parser = argparse.ArgumentParser(description='Generate v4 targeted training data')
    parser.add_argument(
        '--output',
        type=str,
        default=str(Path(__file__).parent.parent / 'data' / 'raw' / 'v4-targeted.jsonl'),
        help='Output JSONL file path'
    )
    parser.add_argument('--shuffle', action='store_true', default=True, help='Shuffle examples')
    args = parser.parse_args()

    examples = generate_all()

    if args.shuffle:
        random.seed(42)  # Reproducible shuffle
        random.shuffle(examples)

    # Ensure output directory exists
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with open(out_path, 'w', encoding='utf-8') as f:
        for ex in examples:
            f.write(json.dumps(ex, ensure_ascii=False) + '\n')

    print(f'Generated {len(examples)} examples:')
    print(f'  - ICPC-2 diagnosis: {len(ICPC2_EXAMPLES)}')
    print(f'  - Red flag detection: {len(RED_FLAG_EXAMPLES)}')
    print(f'  - Communication/SOAP: {len(SOAP_EXAMPLES)}')
    print(f'  Total: {len(examples)}')
    print(f'  Output: {out_path}')


if __name__ == '__main__':
    main()
