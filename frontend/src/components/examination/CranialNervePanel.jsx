/**
 * CranialNervePanel Component
 *
 * Complete cranial nerve examination panel (CN I-XII) with OSCE-style
 * checklist items, bilateral testing, and clinical findings documentation.
 *
 * Based on standardized neurological examination protocols.
 */

import React, { useMemo, useState } from 'react';
import {
  Eye,
  Ear,
  Wind,
  Smile,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MinusCircle,
  Info
} from 'lucide-react';

// Finding states
const FINDING_STATES = {
  NOT_TESTED: { value: 'NT', label: 'NT', labelNo: 'IT', color: 'bg-gray-100 text-gray-500' },
  NORMAL: { value: 'normal', label: 'Normal', labelNo: 'Normal', color: 'bg-green-100 text-green-700' },
  ABNORMAL: { value: 'abnormal', label: 'Abnormal', labelNo: 'Patologisk', color: 'bg-red-100 text-red-700' },
  EQUIVOCAL: { value: 'equivocal', label: 'Equivocal', labelNo: 'Usikker', color: 'bg-amber-100 text-amber-700' }
};

// Complete Cranial Nerve data with all 12 nerves
const CRANIAL_NERVES = [
  {
    id: 'cn1',
    number: 'I',
    name: 'Olfactory',
    nameNo: 'Olfaktorius',
    function: 'Smell',
    functionNo: 'Lukt',
    icon: Wind,
    bilateral: true,
    tests: [
      {
        id: 'smell_identification',
        name: 'Smell Identification',
        nameNo: 'Luktidentifikasjon',
        description: 'Test each nostril separately with familiar scents (coffee, vanilla, peppermint)',
        descriptionNo: 'Test hvert nesebor separat med kjente lukter (kaffe, vanilje, peppermynte)',
        findings: ['normal', 'anosmia', 'hyposmia', 'parosmia']
      }
    ],
    redFlags: ['Anosmia after head trauma', 'Unilateral loss (tumor)'],
    redFlagsNo: ['Anosmi etter hodeskade', 'Unilateral tap (tumor)']
  },
  {
    id: 'cn2',
    number: 'II',
    name: 'Optic',
    nameNo: 'Optikus',
    function: 'Vision',
    functionNo: 'Syn',
    icon: Eye,
    bilateral: true,
    tests: [
      {
        id: 'visual_acuity',
        name: 'Visual Acuity',
        nameNo: 'Visus',
        description: 'Snellen chart or finger counting',
        descriptionNo: 'Snellen-tavle eller fingertelling'
      },
      {
        id: 'visual_fields',
        name: 'Visual Fields',
        nameNo: 'Synsfelt',
        description: 'Confrontation testing in all quadrants',
        descriptionNo: 'Konfrontasjonstest i alle kvadranter'
      },
      {
        id: 'pupil_direct',
        name: 'Pupil Direct Response',
        nameNo: 'Direkte pupillrefleks',
        description: 'Shine light in eye, observe ipsilateral constriction',
        descriptionNo: 'Lys i øyet, observer ipsilateral konstriksjon'
      },
      {
        id: 'pupil_consensual',
        name: 'Pupil Consensual Response',
        nameNo: 'Konsensuel pupillrefleks',
        description: 'Shine light in one eye, observe contralateral constriction',
        descriptionNo: 'Lys i ett øye, observer kontralateral konstriksjon'
      },
      {
        id: 'rapd',
        name: 'RAPD (Swinging Flashlight)',
        nameNo: 'RAPD (Svingende lommelykt)',
        description: 'Relative afferent pupillary defect test',
        descriptionNo: 'Relativ afferent pupilldefekt-test'
      },
      {
        id: 'fundoscopy',
        name: 'Fundoscopy',
        nameNo: 'Fundoskopi',
        description: 'Examine optic disc and retina',
        descriptionNo: 'Undersøk papillen og retina'
      }
    ],
    redFlags: ['Papilledema', 'Optic atrophy', 'RAPD positive'],
    redFlagsNo: ['Papilleødem', 'Optikusatrofi', 'RAPD positiv']
  },
  {
    id: 'cn3',
    number: 'III',
    name: 'Oculomotor',
    nameNo: 'Okulomotorius',
    function: 'Eye movement, pupil, eyelid',
    functionNo: 'Øyebevegelse, pupill, øyelokk',
    icon: Eye,
    bilateral: true,
    tests: [
      {
        id: 'eyelid_ptosis',
        name: 'Eyelid Position (Ptosis)',
        nameNo: 'Øyelokksposisjon (Ptose)',
        description: 'Observe for drooping eyelid',
        descriptionNo: 'Observer hengende øyelokk'
      },
      {
        id: 'pupil_size',
        name: 'Pupil Size',
        nameNo: 'Pupillstørrelse',
        description: 'Compare pupil size bilaterally',
        descriptionNo: 'Sammenlign pupillstørrelse bilateralt'
      },
      {
        id: 'eye_movement_up',
        name: 'Eye Movement - Up',
        nameNo: 'Øyebevegelse - Opp',
        description: 'Superior rectus and inferior oblique',
        descriptionNo: 'Superior rektus og inferior oblikus'
      },
      {
        id: 'eye_movement_down',
        name: 'Eye Movement - Down',
        nameNo: 'Øyebevegelse - Ned',
        description: 'Inferior rectus',
        descriptionNo: 'Inferior rektus'
      },
      {
        id: 'eye_movement_medial',
        name: 'Eye Movement - Medial',
        nameNo: 'Øyebevegelse - Medialt',
        description: 'Medial rectus (adduction)',
        descriptionNo: 'Medial rektus (adduksjon)'
      },
      {
        id: 'accommodation',
        name: 'Accommodation',
        nameNo: 'Akkommodasjon',
        description: 'Near response - pupil constriction and convergence',
        descriptionNo: 'Nærrespons - pupillkonstriksjon og konvergens'
      }
    ],
    redFlags: ['Complete CN III palsy with pupil involvement (aneurysm)', 'Painful ophthalmoplegia'],
    redFlagsNo: ['Komplett CN III parese med pupillaffeksjon (aneurisme)', 'Smertefull oftalmoplegi']
  },
  {
    id: 'cn4',
    number: 'IV',
    name: 'Trochlear',
    nameNo: 'Trochlearis',
    function: 'Eye movement (down and in)',
    functionNo: 'Øyebevegelse (ned og inn)',
    icon: Eye,
    bilateral: true,
    tests: [
      {
        id: 'eye_down_in',
        name: 'Eye Movement - Down and In',
        nameNo: 'Øyebevegelse - Ned og inn',
        description: 'Superior oblique - look down and medially',
        descriptionNo: 'Superior oblikus - se ned og medialt'
      },
      {
        id: 'head_tilt',
        name: 'Head Tilt Test',
        nameNo: 'Hodehelningstest',
        description: 'Bielschowsky head tilt test for SO palsy',
        descriptionNo: 'Bielschowsky hodehelningstest for SO parese'
      }
    ],
    redFlags: ['Vertical diplopia worse looking down (reading, stairs)'],
    redFlagsNo: ['Vertikal diplopi verre ved å se ned (lesing, trapper)']
  },
  {
    id: 'cn5',
    number: 'V',
    name: 'Trigeminal',
    nameNo: 'Trigeminus',
    function: 'Face sensation, mastication',
    functionNo: 'Ansiktssensibilitet, tygging',
    icon: Smile,
    bilateral: true,
    tests: [
      {
        id: 'sensation_v1',
        name: 'Sensation V1 (Ophthalmic)',
        nameNo: 'Sensibilitet V1 (Oftalmisk)',
        description: 'Light touch forehead, upper eyelid',
        descriptionNo: 'Lett berøring panne, øvre øyelokk'
      },
      {
        id: 'sensation_v2',
        name: 'Sensation V2 (Maxillary)',
        nameNo: 'Sensibilitet V2 (Maksillær)',
        description: 'Light touch cheek, upper lip, lateral nose',
        descriptionNo: 'Lett berøring kinn, overleppe, lateral nese'
      },
      {
        id: 'sensation_v3',
        name: 'Sensation V3 (Mandibular)',
        nameNo: 'Sensibilitet V3 (Mandibulær)',
        description: 'Light touch jaw, lower lip, chin',
        descriptionNo: 'Lett berøring kjeve, underleppe, hake'
      },
      {
        id: 'corneal_reflex',
        name: 'Corneal Reflex',
        nameNo: 'Kornealrefleks',
        description: 'Touch cornea with cotton wisp - blink response',
        descriptionNo: 'Berør kornea med bomullsdott - blunkerespons'
      },
      {
        id: 'jaw_clench',
        name: 'Jaw Clench (Masseter)',
        nameNo: 'Kjevesammenbitn (Masseter)',
        description: 'Palpate masseter during clenching',
        descriptionNo: 'Palper masseter under sammenbiting'
      },
      {
        id: 'jaw_jerk',
        name: 'Jaw Jerk Reflex',
        nameNo: 'Kjeverefleks',
        description: 'Tap chin with mouth slightly open',
        descriptionNo: 'Bank på haken med munnen litt åpen'
      },
      {
        id: 'jaw_deviation',
        name: 'Jaw Opening Deviation',
        nameNo: 'Kjeveåpningsdeviasjon',
        description: 'Observe jaw deviation on opening (pterygoids)',
        descriptionNo: 'Observer kjevedeviasjon ved åpning (pterygoideus)'
      }
    ],
    redFlags: ['Trigeminal neuralgia', 'Numbness with CN V, VI, VII (cavernous sinus)'],
    redFlagsNo: ['Trigeminusnevralgi', 'Nummenhet med CN V, VI, VII (sinus cavernosus)']
  },
  {
    id: 'cn6',
    number: 'VI',
    name: 'Abducens',
    nameNo: 'Abducens',
    function: 'Eye movement (lateral)',
    functionNo: 'Øyebevegelse (lateralt)',
    icon: Eye,
    bilateral: true,
    tests: [
      {
        id: 'eye_abduction',
        name: 'Eye Abduction',
        nameNo: 'Øyeabduksjon',
        description: 'Lateral rectus - look laterally',
        descriptionNo: 'Lateral rektus - se lateralt'
      },
      {
        id: 'horizontal_diplopia',
        name: 'Horizontal Diplopia Assessment',
        nameNo: 'Horisontal diplopivurdering',
        description: 'Worse at distance, looking toward affected side',
        descriptionNo: 'Verre på avstand, ser mot affisert side'
      }
    ],
    redFlags: ['Isolated CN VI palsy in elderly (microvascular)', 'With papilledema (raised ICP)'],
    redFlagsNo: ['Isolert CN VI parese hos eldre (mikrovaskulær)', 'Med papilleødem (økt ICP)']
  },
  {
    id: 'cn7',
    number: 'VII',
    name: 'Facial',
    nameNo: 'Facialis',
    function: 'Face movement, taste (anterior 2/3)',
    functionNo: 'Ansiktsbevegelse, smak (fremre 2/3)',
    icon: Smile,
    bilateral: true,
    tests: [
      {
        id: 'raise_eyebrows',
        name: 'Raise Eyebrows',
        nameNo: 'Løft øyenbryn',
        description: 'Frontalis muscle - forehead wrinkling',
        descriptionNo: 'Frontalismuskel - pannerynking'
      },
      {
        id: 'close_eyes_tight',
        name: 'Close Eyes Tightly',
        nameNo: 'Lukk øynene stramt',
        description: 'Orbicularis oculi - resist opening',
        descriptionNo: 'Orbicularis oculi - motstå åpning'
      },
      {
        id: 'puff_cheeks',
        name: 'Puff Out Cheeks',
        nameNo: 'Blås ut kinnene',
        description: 'Buccinator - check for air leak',
        descriptionNo: 'Buccinator - sjekk for luftlekkasje'
      },
      {
        id: 'show_teeth',
        name: 'Show Teeth / Smile',
        nameNo: 'Vis tenner / Smil',
        description: 'Observe symmetry of nasolabial folds',
        descriptionNo: 'Observer symmetri av nasolabialfolder'
      },
      {
        id: 'taste_anterior',
        name: 'Taste (Anterior 2/3 Tongue)',
        nameNo: 'Smak (Fremre 2/3 tunge)',
        description: 'Test with sugar, salt, citric acid',
        descriptionNo: 'Test med sukker, salt, sitronsyre'
      }
    ],
    redFlags: ['Upper vs Lower motor neuron pattern', 'Bells palsy - exclude Lyme, Ramsay Hunt'],
    redFlagsNo: ['Øvre vs nedre motornevron mønster', 'Bells parese - utelukk Borrelia, Ramsay Hunt']
  },
  {
    id: 'cn8',
    number: 'VIII',
    name: 'Vestibulocochlear',
    nameNo: 'Vestibulocochlearis',
    function: 'Hearing, balance',
    functionNo: 'Hørsel, balanse',
    icon: Ear,
    bilateral: true,
    tests: [
      {
        id: 'whisper_test',
        name: 'Whisper Test',
        nameNo: 'Hvisketest',
        description: 'Whisper numbers/letters at 60cm, occlude opposite ear',
        descriptionNo: 'Hvisk tall/bokstaver på 60cm, okkluder motsatt øre'
      },
      {
        id: 'finger_rub',
        name: 'Finger Rub Test',
        nameNo: 'Fingergnidningstest',
        description: 'Rub fingers near each ear',
        descriptionNo: 'Gni fingre nær hvert øre'
      },
      {
        id: 'rinne_test',
        name: 'Rinne Test',
        nameNo: 'Rinnes prøve',
        description: '512Hz tuning fork: air vs bone conduction',
        descriptionNo: '512Hz stemmegaffel: luft vs beinledning'
      },
      {
        id: 'weber_test',
        name: 'Weber Test',
        nameNo: 'Webers prøve',
        description: '512Hz tuning fork on vertex - lateralization',
        descriptionNo: '512Hz stemmegaffel på vertex - lateralisering'
      },
      {
        id: 'nystagmus',
        name: 'Nystagmus Assessment',
        nameNo: 'Nystagmusvurdering',
        description: 'Observe for spontaneous or gaze-evoked nystagmus',
        descriptionNo: 'Observer for spontan eller blikkutløst nystagmus'
      },
      {
        id: 'head_impulse',
        name: 'Head Impulse Test (HIT)',
        nameNo: 'Hodeimpulstest (HIT)',
        description: 'Rapid head turn while fixating on nose',
        descriptionNo: 'Rask hodedreining mens pasienten fikserer på nesen'
      },
      {
        id: 'dix_hallpike',
        name: 'Dix-Hallpike Test',
        nameNo: 'Dix-Hallpike test',
        description: 'BPPV assessment - posterior canal',
        descriptionNo: 'BPPV-vurdering - bakre buegang'
      }
    ],
    redFlags: ['Sudden unilateral hearing loss (emergency)', 'Vertigo with neurological signs'],
    redFlagsNo: ['Plutselig unilateralt hørselstap (ø-hjelp)', 'Svimmelhet med nevrologiske tegn']
  },
  {
    id: 'cn9',
    number: 'IX',
    name: 'Glossopharyngeal',
    nameNo: 'Glossopharyngeus',
    function: 'Taste (posterior 1/3), gag reflex afferent',
    functionNo: 'Smak (bakre 1/3), brekningsrefleks afferent',
    icon: MessageCircle,
    bilateral: true,
    tests: [
      {
        id: 'gag_reflex_afferent',
        name: 'Gag Reflex (Afferent)',
        nameNo: 'Brekningsrefleks (Afferent)',
        description: 'Touch posterior pharynx with tongue depressor - sensation',
        descriptionNo: 'Berør bakre svelg med tungespattel - sensibilitet'
      },
      {
        id: 'taste_posterior',
        name: 'Taste (Posterior 1/3 Tongue)',
        nameNo: 'Smak (Bakre 1/3 tunge)',
        description: 'Test bitter taste on posterior tongue',
        descriptionNo: 'Test bitter smak på bakre tunge'
      },
      {
        id: 'palatal_sensation',
        name: 'Palatal Sensation',
        nameNo: 'Palatal sensibilitet',
        description: 'Light touch to soft palate',
        descriptionNo: 'Lett berøring av bløte gane'
      }
    ],
    redFlags: ['Glossopharyngeal neuralgia', 'Absent gag with swallowing difficulty'],
    redFlagsNo: ['Glossopharyngeusnevralgi', 'Fraværende brekningsrefleks med svelgevansker']
  },
  {
    id: 'cn10',
    number: 'X',
    name: 'Vagus',
    nameNo: 'Vagus',
    function: 'Palate movement, voice, gag reflex efferent',
    functionNo: 'Ganebevegelse, stemme, brekningsrefleks efferent',
    icon: MessageCircle,
    bilateral: true,
    tests: [
      {
        id: 'voice_quality',
        name: 'Voice Quality',
        nameNo: 'Stemmekvalitet',
        description: 'Listen for hoarseness, nasal speech, bovine cough',
        descriptionNo: 'Lytt etter heshet, nasal tale, \"ku-hoste\"'
      },
      {
        id: 'palate_elevation',
        name: 'Palate Elevation',
        nameNo: 'Ganehevning',
        description: 'Say "Aah" - observe uvula and soft palate',
        descriptionNo: 'Si \"Aah\" - observer uvula og bløte gane'
      },
      {
        id: 'uvula_deviation',
        name: 'Uvula Deviation',
        nameNo: 'Uvuladeviasjon',
        description: 'Uvula deviates away from lesion side',
        descriptionNo: 'Uvula devierer bort fra lesjonssiden'
      },
      {
        id: 'gag_reflex_efferent',
        name: 'Gag Reflex (Efferent)',
        nameNo: 'Brekningsrefleks (Efferent)',
        description: 'Motor response to gag - palate elevation',
        descriptionNo: 'Motorisk respons på brekningsrefleks - ganehevning'
      },
      {
        id: 'cough_strength',
        name: 'Cough Strength',
        nameNo: 'Hostekraft',
        description: 'Ask patient to cough - assess strength',
        descriptionNo: 'Be pasienten hoste - vurder styrke'
      },
      {
        id: 'swallowing',
        name: 'Swallowing Assessment',
        nameNo: 'Svelgevurdering',
        description: 'Observe swallowing water - any coughing/choking',
        descriptionNo: 'Observer svelging av vann - hoste/kvelning'
      }
    ],
    redFlags: ['Dysphagia with aspiration', 'Vocal cord paralysis'],
    redFlagsNo: ['Dysfagi med aspirasjon', 'Stemmebåndsparese']
  },
  {
    id: 'cn11',
    number: 'XI',
    name: 'Accessory',
    nameNo: 'Accessorius',
    function: 'SCM, trapezius',
    functionNo: 'SCM, trapezius',
    icon: Smile,
    bilateral: true,
    tests: [
      {
        id: 'scm_strength',
        name: 'SCM Strength',
        nameNo: 'SCM-styrke',
        description: 'Turn head against resistance - palpate SCM',
        descriptionNo: 'Drei hodet mot motstand - palper SCM'
      },
      {
        id: 'trapezius_strength',
        name: 'Trapezius Strength',
        nameNo: 'Trapezius-styrke',
        description: 'Shrug shoulders against resistance',
        descriptionNo: 'Trekk skuldrene mot motstand'
      },
      {
        id: 'trapezius_bulk',
        name: 'Trapezius Bulk/Wasting',
        nameNo: 'Trapezius bulk/atrofi',
        description: 'Inspect for asymmetry or wasting',
        descriptionNo: 'Inspiser for asymmetri eller atrofi'
      },
      {
        id: 'shoulder_drop',
        name: 'Shoulder Drop',
        nameNo: 'Skulderfall',
        description: 'Observe for unilateral shoulder droop',
        descriptionNo: 'Observer for unilateralt skulderfall'
      }
    ],
    redFlags: ['Wasting after neck surgery/dissection', 'Torticollis'],
    redFlagsNo: ['Atrofi etter nakkekirurgi/disseksjon', 'Torticollis']
  },
  {
    id: 'cn12',
    number: 'XII',
    name: 'Hypoglossal',
    nameNo: 'Hypoglossus',
    function: 'Tongue movement',
    functionNo: 'Tungebevegelse',
    icon: MessageCircle,
    bilateral: false,
    tests: [
      {
        id: 'tongue_inspection',
        name: 'Tongue Inspection at Rest',
        nameNo: 'Tungeinspeksjon i hvile',
        description: 'Look for wasting, fasciculations',
        descriptionNo: 'Se etter atrofi, fascikulasjoner'
      },
      {
        id: 'tongue_protrusion',
        name: 'Tongue Protrusion',
        nameNo: 'Tungeprotrusjon',
        description: 'Stick out tongue - observe for deviation',
        descriptionNo: 'Stikk ut tungen - observer for deviasjon'
      },
      {
        id: 'tongue_strength',
        name: 'Tongue Strength',
        nameNo: 'Tungestyrke',
        description: 'Push tongue against cheek against resistance',
        descriptionNo: 'Dytt tungen mot kinnet mot motstand'
      },
      {
        id: 'tongue_movements',
        name: 'Rapid Tongue Movements',
        nameNo: 'Raske tungebevegelser',
        description: 'Move tongue rapidly side to side',
        descriptionNo: 'Beveg tungen raskt fra side til side'
      },
      {
        id: 'dysarthria',
        name: 'Dysarthria Assessment',
        nameNo: 'Dysartrivurdering',
        description: 'Repeat "la-la-la", "baby hippopotamus"',
        descriptionNo: 'Gjenta "la-la-la", "British constitution"'
      }
    ],
    redFlags: ['LMN: wasting, fasciculations, deviation TO lesion', 'UMN: spastic, slow, deviation AWAY'],
    redFlagsNo: ['Nedre motornevron: atrofi, fascikulasjoner, deviasjon MOT lesjon', 'Øvre motornevron: spastisk, langsom, deviasjon BORT']
  }
];

/**
 * Finding toggle button component
 */
function FindingToggle({ value, onChange, disabled = false, lang = 'no' }) {
  const states = [
    { ...FINDING_STATES.NOT_TESTED, icon: MinusCircle },
    { ...FINDING_STATES.NORMAL, icon: CheckCircle },
    { ...FINDING_STATES.ABNORMAL, icon: XCircle },
    { ...FINDING_STATES.EQUIVOCAL, icon: AlertTriangle }
  ];

  const currentIndex = states.findIndex(s => s.value === value) || 0;
  const current = states[currentIndex] || states[0];
  const Icon = current.icon;

  const handleClick = () => {
    if (disabled) return;
    const nextIndex = (currentIndex + 1) % states.length;
    onChange(states[nextIndex].value);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                 border transition-colors ${current.color}
                 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
    >
      <Icon className="w-3 h-3" />
      <span>{lang === 'no' ? current.labelNo : current.label}</span>
    </button>
  );
}

/**
 * Individual test item row
 */
function TestItem({ test, nerve, values, onChange, lang, showDescription = true }) {
  const leftKey = `${nerve.id}_${test.id}_left`;
  const rightKey = `${nerve.id}_${test.id}_right`;
  const notesKey = `${nerve.id}_${test.id}_notes`;

  const leftValue = values[leftKey] || 'NT';
  const rightValue = values[rightKey] || 'NT';
  const notes = values[notesKey] || '';

  const handleChange = (key, value) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">
          {lang === 'no' ? test.nameNo : test.name}
        </p>
        {showDescription && (
          <p className="text-xs text-gray-500 mt-0.5">
            {lang === 'no' ? test.descriptionNo : test.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {nerve.bilateral ? (
          <>
            <div className="text-center">
              <span className="text-[10px] text-gray-400 block mb-0.5">
                {lang === 'no' ? 'V' : 'L'}
              </span>
              <FindingToggle
                value={leftValue}
                onChange={(v) => handleChange(leftKey, v)}
                lang={lang}
              />
            </div>
            <div className="text-center">
              <span className="text-[10px] text-gray-400 block mb-0.5">
                {lang === 'no' ? 'H' : 'R'}
              </span>
              <FindingToggle
                value={rightValue}
                onChange={(v) => handleChange(rightKey, v)}
                lang={lang}
              />
            </div>
          </>
        ) : (
          <FindingToggle
            value={leftValue}
            onChange={(v) => handleChange(leftKey, v)}
            lang={lang}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Single cranial nerve section
 */
function CranialNerveSection({
  nerve,
  values,
  onChange,
  lang,
  expanded,
  onToggle,
  showDescription
}) {
  const Icon = nerve.icon;

  // Calculate summary for this nerve
  const abnormalCount = useMemo(() => {
    let count = 0;
    nerve.tests.forEach(test => {
      const leftKey = `${nerve.id}_${test.id}_left`;
      const rightKey = `${nerve.id}_${test.id}_right`;
      if (values[leftKey] === 'abnormal') count++;
      if (nerve.bilateral && values[rightKey] === 'abnormal') count++;
    });
    return count;
  }, [values, nerve]);

  const testedCount = useMemo(() => {
    let count = 0;
    nerve.tests.forEach(test => {
      const leftKey = `${nerve.id}_${test.id}_left`;
      const rightKey = `${nerve.id}_${test.id}_right`;
      if (values[leftKey] && values[leftKey] !== 'NT') count++;
      if (nerve.bilateral && values[rightKey] && values[rightKey] !== 'NT') count++;
    });
    return count;
  }, [values, nerve]);

  return (
    <div className={`border rounded-lg overflow-hidden
                    ${abnormalCount > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50
                   hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center
                          ${abnormalCount > 0 ? 'bg-red-100' : 'bg-teal-100'}`}>
            <Icon className={`w-4 h-4 ${abnormalCount > 0 ? 'text-red-600' : 'text-teal-600'}`} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700">CN {nerve.number}</span>
              <span className="font-medium text-gray-700">
                {lang === 'no' ? nerve.nameNo : nerve.name}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {lang === 'no' ? nerve.functionNo : nerve.function}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {testedCount > 0 && (
            <span className="text-xs text-gray-500">
              {testedCount} {lang === 'no' ? 'testet' : 'tested'}
            </span>
          )}
          {abnormalCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
              {abnormalCount} {lang === 'no' ? 'patologisk' : 'abnormal'}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-4 bg-white border-t border-gray-100">
          {/* Tests */}
          <div className="space-y-1">
            {nerve.tests.map((test) => (
              <TestItem
                key={test.id}
                test={test}
                nerve={nerve}
                values={values}
                onChange={onChange}
                lang={lang}
                showDescription={showDescription}
              />
            ))}
          </div>

          {/* Red flags */}
          {nerve.redFlags && nerve.redFlags.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-2 text-red-700 text-xs font-medium mb-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{lang === 'no' ? 'Røde flagg' : 'Red Flags'}</span>
              </div>
              <ul className="text-xs text-red-600 space-y-0.5">
                {(lang === 'no' ? nerve.redFlagsNo : nerve.redFlags).map((flag, idx) => (
                  <li key={idx}>• {flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes field */}
          <div className="mt-3">
            <textarea
              value={values[`${nerve.id}_notes`] || ''}
              onChange={(e) => onChange({ ...values, [`${nerve.id}_notes`]: e.target.value })}
              placeholder={lang === 'no' ? 'Kliniske notater...' : 'Clinical notes...'}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                        focus:ring-1 focus:ring-teal-500 focus:border-teal-500
                        resize-none"
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Quick screening panel
 */
function QuickScreeningPanel({ values, onChange, lang }) {
  const screeningTests = [
    { nerveId: 'cn2', testId: 'visual_acuity', label: 'Visual Acuity', labelNo: 'Visus' },
    { nerveId: 'cn3', testId: 'pupil_direct', label: 'Pupils', labelNo: 'Pupiller' },
    { nerveId: 'cn5', testId: 'sensation_v1', label: 'V1-V3 Sensation', labelNo: 'V1-V3 Sensibilitet' },
    { nerveId: 'cn7', testId: 'show_teeth', label: 'Facial Symmetry', labelNo: 'Ansiktssymmetri' },
    { nerveId: 'cn8', testId: 'whisper_test', label: 'Hearing', labelNo: 'Hørsel' },
    { nerveId: 'cn9', testId: 'gag_reflex_afferent', label: 'Gag Reflex', labelNo: 'Brekningsrefleks' },
    { nerveId: 'cn11', testId: 'trapezius_strength', label: 'Trapezius', labelNo: 'Trapezius' },
    { nerveId: 'cn12', testId: 'tongue_protrusion', label: 'Tongue', labelNo: 'Tunge' }
  ];

  const setAllNormal = () => {
    const updates = {};
    screeningTests.forEach(({ nerveId, testId }) => {
      updates[`${nerveId}_${testId}_left`] = 'normal';
      updates[`${nerveId}_${testId}_right`] = 'normal';
    });
    onChange({ ...values, ...updates });
  };

  return (
    <div className="bg-teal-50 rounded-lg p-3 border border-teal-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-teal-800">
          {lang === 'no' ? 'Hurtigscreening' : 'Quick Screening'}
        </span>
        <button
          type="button"
          onClick={setAllNormal}
          className="px-2 py-1 text-xs bg-teal-600 text-white rounded hover:bg-teal-700"
        >
          {lang === 'no' ? 'Alle normale' : 'All Normal'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {screeningTests.map(({ nerveId, testId, label, labelNo }) => {
          const leftKey = `${nerveId}_${testId}_left`;
          const isNormal = values[leftKey] === 'normal';
          const isAbnormal = values[leftKey] === 'abnormal';

          return (
            <div
              key={`${nerveId}_${testId}`}
              className={`px-2 py-1 rounded text-xs
                         ${isNormal ? 'bg-green-100 text-green-700' :
                           isAbnormal ? 'bg-red-100 text-red-700' :
                           'bg-gray-100 text-gray-600'}`}
            >
              {lang === 'no' ? labelNo : label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Main CranialNervePanel component
 */
export default function CranialNervePanel({
  values = {},
  onChange,
  lang = 'no',
  readOnly = false,
  showDescription = true,
  onGenerateNarrative,
  defaultExpanded = []
}) {
  const [expandedNerves, setExpandedNerves] = useState(new Set(defaultExpanded));
  const [expandAll, setExpandAll] = useState(false);

  const toggleNerve = (nerveId) => {
    const newExpanded = new Set(expandedNerves);
    if (newExpanded.has(nerveId)) {
      newExpanded.delete(nerveId);
    } else {
      newExpanded.add(nerveId);
    }
    setExpandedNerves(newExpanded);
  };

  const handleExpandAll = () => {
    if (expandAll) {
      setExpandedNerves(new Set());
    } else {
      setExpandedNerves(new Set(CRANIAL_NERVES.map(n => n.id)));
    }
    setExpandAll(!expandAll);
  };

  // Calculate summary statistics
  const summary = useMemo(() => {
    let tested = 0;
    let normal = 0;
    let abnormal = 0;
    let equivocal = 0;

    CRANIAL_NERVES.forEach(nerve => {
      nerve.tests.forEach(test => {
        const leftKey = `${nerve.id}_${test.id}_left`;
        const rightKey = `${nerve.id}_${test.id}_right`;

        [leftKey, rightKey].forEach(key => {
          if (values[key] && values[key] !== 'NT') {
            tested++;
            if (values[key] === 'normal') normal++;
            else if (values[key] === 'abnormal') abnormal++;
            else if (values[key] === 'equivocal') equivocal++;
          }
        });
      });
    });

    return { tested, normal, abnormal, equivocal };
  }, [values]);

  // Generate narrative text
  const generateNarrative = useMemo(() => {
    const findings = [];
    const abnormalFindings = [];

    CRANIAL_NERVES.forEach(nerve => {
      const nerveFindings = [];

      nerve.tests.forEach(test => {
        const leftKey = `${nerve.id}_${test.id}_left`;
        const rightKey = `${nerve.id}_${test.id}_right`;
        const leftVal = values[leftKey];
        const rightVal = values[rightKey];

        if (leftVal === 'abnormal' || rightVal === 'abnormal') {
          const testName = lang === 'no' ? test.nameNo : test.name;
          let finding = testName;

          if (nerve.bilateral) {
            if (leftVal === 'abnormal' && rightVal === 'abnormal') {
              finding += ` (${lang === 'no' ? 'bilateralt patologisk' : 'bilateral abnormal'})`;
            } else if (leftVal === 'abnormal') {
              finding += ` (${lang === 'no' ? 'venstre patologisk' : 'left abnormal'})`;
            } else {
              finding += ` (${lang === 'no' ? 'høyre patologisk' : 'right abnormal'})`;
            }
          } else {
            finding += ` (${lang === 'no' ? 'patologisk' : 'abnormal'})`;
          }

          nerveFindings.push(finding);
        }
      });

      if (nerveFindings.length > 0) {
        const nerveName = `CN ${nerve.number} (${lang === 'no' ? nerve.nameNo : nerve.name})`;
        abnormalFindings.push(`${nerveName}: ${nerveFindings.join(', ')}`);
      }
    });

    if (abnormalFindings.length === 0) {
      return lang === 'no'
        ? 'Hjernenerveundersøkelse: Alle testede hjernenerver innen normalgrenser.'
        : 'Cranial Nerve Examination: All tested cranial nerves within normal limits.';
    }

    const prefix = lang === 'no' ? 'Hjernenerveundersøkelse:' : 'Cranial Nerve Examination:';
    return `${prefix} ${abnormalFindings.join('. ')}.`;
  }, [values, lang]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {lang === 'no' ? 'Hjernenerveundersøkelse (CN I-XII)' : 'Cranial Nerve Examination (CN I-XII)'}
          </h3>
          {summary.tested > 0 && (
            <p className="text-sm text-gray-500">
              {summary.tested} {lang === 'no' ? 'tester' : 'tests'}
              {summary.normal > 0 && (
                <span className="text-green-600 ml-2">
                  • {summary.normal} {lang === 'no' ? 'normale' : 'normal'}
                </span>
              )}
              {summary.abnormal > 0 && (
                <span className="text-red-600 ml-2">
                  • {summary.abnormal} {lang === 'no' ? 'patologiske' : 'abnormal'}
                </span>
              )}
              {summary.equivocal > 0 && (
                <span className="text-amber-600 ml-2">
                  • {summary.equivocal} {lang === 'no' ? 'usikre' : 'equivocal'}
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExpandAll}
            className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg
                      hover:bg-gray-50 transition-colors"
          >
            {expandAll
              ? (lang === 'no' ? 'Lukk alle' : 'Collapse All')
              : (lang === 'no' ? 'Åpne alle' : 'Expand All')}
          </button>

          {onGenerateNarrative && (
            <button
              onClick={() => onGenerateNarrative(generateNarrative)}
              className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg
                        hover:bg-teal-700 transition-colors"
            >
              {lang === 'no' ? 'Generer tekst' : 'Generate Text'}
            </button>
          )}
        </div>
      </div>

      {/* Quick Screening */}
      <QuickScreeningPanel values={values} onChange={onChange} lang={lang} />

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span>{lang === 'no' ? 'Normal' : 'Normal'}</span>
        </div>
        <div className="flex items-center gap-1">
          <XCircle className="w-3 h-3 text-red-500" />
          <span>{lang === 'no' ? 'Patologisk' : 'Abnormal'}</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span>{lang === 'no' ? 'Usikker' : 'Equivocal'}</span>
        </div>
        <div className="flex items-center gap-1">
          <MinusCircle className="w-3 h-3 text-gray-400" />
          <span>{lang === 'no' ? 'Ikke testet' : 'Not Tested'}</span>
        </div>
      </div>

      {/* Cranial Nerve Sections */}
      <div className="space-y-2">
        {CRANIAL_NERVES.map((nerve) => (
          <CranialNerveSection
            key={nerve.id}
            nerve={nerve}
            values={values}
            onChange={onChange}
            lang={lang}
            expanded={expandedNerves.has(nerve.id)}
            onToggle={() => toggleNerve(nerve.id)}
            showDescription={showDescription}
          />
        ))}
      </div>

      {/* Info box */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">
            {lang === 'no' ? 'Klinisk tips' : 'Clinical Tips'}
          </p>
          <ul className="mt-1 space-y-0.5 text-blue-600">
            <li>• {lang === 'no'
              ? 'Klikk på status-knappen for å bla gjennom: IT → Normal → Patologisk → Usikker'
              : 'Click status button to cycle through: NT → Normal → Abnormal → Equivocal'}</li>
            <li>• {lang === 'no'
              ? 'CN II, III, IV, VI testes sammen med øyebevegelser'
              : 'CN II, III, IV, VI tested together with eye movements'}</li>
            <li>• {lang === 'no'
              ? 'CN IX og X testes sammen med svelgfunksjon'
              : 'CN IX and X tested together with swallowing function'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Export cranial nerve data for use in other components
export { CRANIAL_NERVES, FINDING_STATES };
