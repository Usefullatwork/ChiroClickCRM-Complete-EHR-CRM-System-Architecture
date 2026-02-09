#!/usr/bin/env python3
"""
Generate concise clinical response training data for chiro-fast model.

Creates short, precise clinical text field examples:
- Chief complaint (hovedklage) generation
- Assessment summaries
- Plan items
- Quick clinical phrases

Output: ChatML format compatible with train_unsloth.py
"""

import json
from pathlib import Path

SYSTEM_PROMPT = (
    'Du er en rask klinisk tekstassistent. '
    'Generer korte, presise kliniske tekstfelt for kiropraktisk dokumentasjon.'
)

# ============================================================
# Chief Complaint Examples (Hovedklage)
# ============================================================

CHIEF_COMPLAINTS = [
    # Neck
    {'input': 'Generer hovedklage for nakkesmerter', 'output': 'Hk: Nakkesmerter med stivhet, gradvis debut over 2 uker.'},
    {'input': 'Generer hovedklage for nakkesmerter etter bilulykke', 'output': 'Hk: Nakkesmerter etter påkjørsel bakfra for 3 dager siden. Hodepine og stivhet.'},
    {'input': 'Generer hovedklage for stiv nakke om morgenen', 'output': 'Hk: Morgenstivhet i nakke, siste 4 uker. Bedres utover dagen.'},
    {'input': 'Generer hovedklage for nakkesmerter med utstråling', 'output': 'Hk: Nakkesmerter med utstråling til hø arm. Prikking i 3. og 4. finger.'},
    {'input': 'Generer hovedklage for nakkesleng', 'output': 'Hk: Nakkeplager etter whiplash-skade for 6 uker siden. Hodepine og svimmelhet.'},

    # Low back
    {'input': 'Generer hovedklage for korsryggsmerte', 'output': 'Hk: Korsryggsmerter etter løfting, akutt debut i dag.'},
    {'input': 'Generer hovedklage for isjias', 'output': 'Hk: Korsryggsmerte med utstråling til ve ben, ned til legg. Verst ved sitting.'},
    {'input': 'Generer hovedklage for akutt hekseskudd', 'output': 'Hk: Akutt ryggsmerte etter å ha bøyd seg ned. Kan knapt stå rett.'},
    {'input': 'Generer hovedklage for kronisk ryggsmerte', 'output': 'Hk: Langvarige korsryggsmerter, >6 mnd. Varierende intensitet. NRS 4-6/10.'},
    {'input': 'Generer hovedklage for bekkensmerte i graviditet', 'output': 'Hk: Bekkensmerter, gravid uke 28. Smerter ved gange og vending i seng.'},

    # Shoulder
    {'input': 'Generer hovedklage for skuldersmerter', 'output': 'Hk: Hø skuldersmerter, gradvis debut over 3 mnd. Verst ved overhead-aktiviteter.'},
    {'input': 'Generer hovedklage for frossen skulder', 'output': 'Hk: Progressiv skuldersmerte og stivhet over 4 mnd. Betydelig redusert ROM.'},
    {'input': 'Generer hovedklage for rotatorcuff-skade', 'output': 'Hk: Akutt skuldersmerter etter fall. Klarer ikke løfte armen over hodet.'},

    # Headache
    {'input': 'Generer hovedklage for spenningshodepine', 'output': 'Hk: Trykkende hodepine bilateralt, båndformet. 3-4 ganger/uke.'},
    {'input': 'Generer hovedklage for migrene', 'output': 'Hk: Tilbakevendende ensidig hodepine med kvalme. Lysfølsomhet. 2 episoder/mnd.'},
    {'input': 'Generer hovedklage for cervikogen hodepine', 'output': 'Hk: Hodepine fra nakke, ensidig. Utløses av nakkebevegelser. Nakkestivhet.'},

    # Hip/Knee
    {'input': 'Generer hovedklage for hoftesmerter', 'output': 'Hk: Ve hoftesmerter, smerter i lyske ved gange. Gradvis debut over 6 mnd.'},
    {'input': 'Generer hovedklage for knesmerter', 'output': 'Hk: Medialt knesmerter hø side. Verst ved trapper og etter hvile.'},

    # Other
    {'input': 'Generer hovedklage for svimmelhet', 'output': 'Hk: Svimmelhet ved hodebevegelser, varighet sekunder. Kvalme. Startet for 5 dager siden.'},
    {'input': 'Generer hovedklage for kjevesmerter', 'output': 'Hk: Smerter ve kjeveledd, verst ved tygging. Klikking ved gaping. 2 mnd varighet.'},
    {'input': 'Generer hovedklage for tennisalbue', 'output': 'Hk: Smerte laterale albue hø side, 6 uker. Verst ved grep. Kontorarbeider.'},
    {'input': 'Generer hovedklage for fotsmerte', 'output': 'Hk: Smerter under hæl, verst ved første skritt om morgenen. 3 mnd varighet.'},
    {'input': 'Generer hovedklage for brystryggsmerte', 'output': 'Hk: Smerter mellom skulderbladene, gradvis debut. Stillesittende arbeid.'},
]

# ============================================================
# Assessment Summaries (Vurdering)
# ============================================================

ASSESSMENTS = [
    {'input': 'Kort vurdering: mekanisk nakkesmerte', 'output': 'V: Mekanisk nakkesmerte med myofascielle triggerpunkter i trapezius og levator scapulae. Ingen nevrologiske funn. Trolig stressrelatert muskulær dysfunksjon.'},
    {'input': 'Kort vurdering: lumbal radikulopati', 'output': 'V: Lumbal radikulopati L5-S1 dx, sannsynlig diskogen årsak. Positiv SLR 40°. Nedsatt S1-refleks hø. Ingen røde flagg. Konservativ behandling indisert.'},
    {'input': 'Kort vurdering: cervikogen hodepine', 'output': 'V: Cervikogen hodepine fra øvre cervikal dysfunksjon (C1-C2). Triggerpunkter i suboccipitale muskler. Positiv fleksjons-rotasjonstest.'},
    {'input': 'Kort vurdering: skulderimpingement', 'output': 'V: Subacromial impingement syndrom hø skulder. Positiv Hawkins og Neer. Full kraft rotatorcuff. Gradvis debut forenlig med overbelastning.'},
    {'input': 'Kort vurdering: akutt lumbago', 'output': 'V: Akutt lumbago uten nevrologiske funn. Paravertebral muskelspasme L3-L5. Antalgisk holdning. Ingen røde flagg.'},
    {'input': 'Kort vurdering: BPPV', 'output': 'V: BPPV bakre buegang hø side. Positiv Dix-Hallpike hø med torsjonell geotrop nystagmus. Latenstid 3 sek.'},
    {'input': 'Kort vurdering: SI-leddsdysfunksjon', 'output': 'V: SI-leddsdysfunksjon ve side. Positiv 3/5 provokasjonstester (FABER, Gaenslen, distraksjonstest). Bekkenasymmetri.'},
    {'input': 'Kort vurdering: TMD', 'output': 'V: Temporomandibulær dysfunksjon ve side. Klikking ved gaping, redusert gapeevne 32mm. Myofascielle triggerpunkter i masseter og temporalis.'},
    {'input': 'Kort vurdering: plantar fasciitt', 'output': 'V: Plantar fasciitt hø fot. Klassisk morgenstivhet og oppstartssmerte. Palpasjonsøm medialt calcaneus. Stram akillessene.'},
    {'input': 'Kort vurdering: lateral epikondylalgi', 'output': 'V: Lateral epikondylalgi hø albue. Positiv Cozen test. Nedsatt grepsstyrke. Overbelastningsrelatert, ergonomisk komponent.'},
]

# ============================================================
# Plan Items (Behandlingsplan)
# ============================================================

PLANS = [
    {'input': 'Kort plan: nakkesmerter', 'output': 'P: Manuell behandling 1x/uke i 4 uker. Triggerpunktbehandling trapezius/levator. Ergonomisk rådgivning. Hjemmeøvelser: chin tucks, nakkerotasjon. Revurder etter 4 behandlinger.'},
    {'input': 'Kort plan: akutt lumbago', 'output': 'P: Forsiktig mobilisering lumbalcolumna. Unngå manipulasjon akutt. Rådgiv aktivitet etter toleranse, unngå sengeleie. Ispakning 15 min x 3/dag. Kontroll om 3 dager.'},
    {'input': 'Kort plan: skulderimpingement', 'output': 'P: Manuell terapi skulder og torakal 1x/uke. Øvelser: scapula-stabilisering, eksentrisk rotatorcuff. Unngå overhead-aktiviteter midlertidig. Evaluering etter 6 uker.'},
    {'input': 'Kort plan: isjias konservativ', 'output': 'P: McKenzie-øvelser, forsiktig fleksjon/ekstensjon. Manuell behandling lumbal. Aktivitetsmodifisering. Nervemobilisering. Forventet bedring 4-12 uker. MR ved manglende fremgang.'},
    {'input': 'Kort plan: cervikogen hodepine', 'output': 'P: Mobilisering/manipulasjon øvre cervikal (C1-C2). Triggerpunktbehandling suboccipitale muskler. Øvelser: DNF-trening, nakketøyning. 2x/uke i 3 uker.'},
    {'input': 'Kort plan: BPPV', 'output': 'P: Epley-manøver utført 2 ganger i klinikk. Brandt-Daroff øvelser hjemme 3x/dag. Unngå raskt hodebevegelser. Kontroll om 1 uke for retest.'},
    {'input': 'Kort plan: TMD', 'output': 'P: Intraoral triggerpunktbehandling masseter/pterygoid. Cervikal mobilisering. Kjeveleddsmobilisering. Øvelser: kontrollert gaping, lateral bevegelse. Unngå tygging av hardt. 1x/uke i 4 uker.'},
    {'input': 'Kort plan: kronisk ryggsmerte', 'output': 'P: Multimodal tilnærming. Manuell terapi 2x/mnd vedlikehold. Styrketrening korsrygg/kjerne. Smerteedukasjon. Vurder tverrfaglig samarbeid ved behov. Langvarig plan 3-6 mnd.'},
]

# ============================================================
# Quick Clinical Phrases
# ============================================================

QUICK_PHRASES = [
    {'input': 'Gonstead listing C2', 'output': 'C2 PRS (posterior, right, superior)'},
    {'input': 'Gonstead listing C5', 'output': 'C5 PRI (posterior, right, inferior)'},
    {'input': 'Gonstead listing L4', 'output': 'L4 PR (posterior, right)'},
    {'input': 'Gonstead listing L5', 'output': 'L5 PL-M (posterior, left, mammillary)'},
    {'input': 'Gonstead listing T6', 'output': 'T6 PRS (posterior, right, superior)'},
    {'input': 'Diversified adjustment C1', 'output': 'C1: Lateral break adjustment, høyre. Pasient supine, drop-piece.'},
    {'input': 'Diversified adjustment T5', 'output': 'T5: Anterior thoracic adjustment, cross bilateral. Pasient prone.'},
    {'input': 'Kort objektiv nakke', 'output': 'O: ROM nakke: fleksjon 50°, ekstensjon 40°, rotasjon hø 60° ve 70°, lat.fleksjon hø 35° ve 40°. Palpasjonsøm C2-C3 ve, trp trapezius hø. Nevro: kraft, sensibilitet, reflekser ua.'},
    {'input': 'Kort objektiv korsrygg', 'output': 'O: ROM lumbal: fleksjon fingre-gulv 20cm, ekstensjon 20°, lat.fleksjon hø 25° ve 30°. SLR hø 60° ve 80°. Palpasjonsøm L4-L5. Nevro: kraft L4-S1 5/5 bil, sens ua, reflekser ua.'},
    {'input': 'Kort subjektiv oppfølging', 'output': 'S: Pasient rapporterer bedring etter forrige behandling. NRS fra 7 til 4/10. Bedre søvn. Gjør øvelsene daglig. Noe stivhet om morgenen fremdeles.'},
]

# ============================================================
# English Quick Examples
# ============================================================

EN_QUICK = [
    {'input': 'Generate chief complaint for neck pain', 'output': 'CC: Neck pain with stiffness, gradual onset over 2 weeks. Worsened by desk work.'},
    {'input': 'Generate chief complaint for low back pain', 'output': 'CC: Low back pain after lifting, acute onset. Unable to straighten up fully.'},
    {'input': 'Brief assessment: mechanical neck pain', 'output': 'A: Mechanical neck pain with myofascial trigger points in upper trapezius and levator scapulae. No neurological findings. Likely ergonomic/postural etiology.'},
    {'input': 'Brief plan: shoulder impingement', 'output': 'P: Manual therapy shoulder and thoracic 1x/week. Exercises: scapular stabilization, eccentric rotator cuff. Avoid overhead temporarily. Reassess at 6 weeks.'},
    {'input': 'Brief assessment: lumbar radiculopathy', 'output': 'A: Right L5-S1 radiculopathy, probable discogenic. Positive SLR 40 degrees. Decreased S1 reflex. No red flags. Conservative management indicated.'},
]


def generate_all_examples():
    """Generate all concise response training examples."""
    examples = []

    # Chief complaints
    for item in CHIEF_COMPLAINTS:
        examples.append({
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": item['input']},
                {"role": "assistant", "content": item['output']}
            ]
        })

    # Assessments
    for item in ASSESSMENTS:
        examples.append({
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": item['input']},
                {"role": "assistant", "content": item['output']}
            ]
        })

    # Plans
    for item in PLANS:
        examples.append({
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": item['input']},
                {"role": "assistant", "content": item['output']}
            ]
        })

    # Quick phrases
    for item in QUICK_PHRASES:
        examples.append({
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": item['input']},
                {"role": "assistant", "content": item['output']}
            ]
        })

    # English quick examples
    en_system = 'You are a fast clinical text assistant. Generate short, precise clinical text fields for chiropractic documentation.'
    for item in EN_QUICK:
        examples.append({
            "messages": [
                {"role": "system", "content": en_system},
                {"role": "user", "content": item['input']},
                {"role": "assistant", "content": item['output']}
            ]
        })

    return examples


def main():
    examples = generate_all_examples()

    # Output directory
    script_dir = Path(__file__).parent.parent
    output_dir = script_dir / 'data' / 'mined'
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / 'concise-responses.jsonl'
    with open(output_file, 'w', encoding='utf-8') as f:
        for ex in examples:
            f.write(json.dumps(ex, ensure_ascii=False) + '\n')

    print(f"Generated {len(examples)} concise response training examples")
    print(f"  Chief complaints: {len(CHIEF_COMPLAINTS)}")
    print(f"  Assessments: {len(ASSESSMENTS)}")
    print(f"  Plans: {len(PLANS)}")
    print(f"  Quick phrases: {len(QUICK_PHRASES)}")
    print(f"  English: {len(EN_QUICK)}")
    print(f"  Output: {output_file}")


if __name__ == '__main__':
    main()
