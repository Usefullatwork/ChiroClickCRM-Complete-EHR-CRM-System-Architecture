/**
 * RegionalExamination Component
 *
 * Full body assessment organized by body region.
 * Each region has normal (standard) tests and extra (special) tests.
 */

import _React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  _CheckCircle,
  _XCircle,
  FileText,
  RefreshCw,
  Activity,
} from 'lucide-react';

// Regional test definitions - Norwegian
const REGIONAL_TESTS = {
  cervical: {
    id: 'cervical',
    name: 'Nakke / Cervikalcolumna',
    icon: '🦴',
    normalTests: [
      {
        id: 'cerv_arom',
        name: 'Aktiv ROM',
        description: 'Fleksjon, ekstensjon, rotasjon, lateralfleksjon',
      },
      { id: 'cerv_prom', name: 'Passiv ROM', description: 'Slutt-følelse, smerte ved bevegelse' },
      {
        id: 'cerv_palp',
        name: 'Palpasjon',
        description: 'Muskulatur, processus spinosus, fasettledd',
      },
      { id: 'cerv_spurling', name: 'Spurlings test', description: 'Cervikal radikulopati' },
      { id: 'cerv_distraction', name: 'Distraksjonstest', description: 'Nerverotsavlastning' },
      { id: 'cerv_alar', name: 'Alar ligament test', description: 'Stabilitet C0-C2' },
    ],
    extraTests: [
      {
        id: 'cerv_sharp_purser',
        name: 'Sharp-Purser test',
        description: 'Atlantoaksial instabilitet',
      },
      { id: 'cerv_vbi', name: 'VBI screening', description: 'Vertebrobasilær insuffisiens' },
      { id: 'cerv_slump', name: 'Slump test (cervical)', description: 'Nevral mobilitet' },
      {
        id: 'cerv_ultt',
        name: 'ULTT (Upper limb tension)',
        description: 'Brachialplexus/nerverotstensjon',
      },
      {
        id: 'cerv_cranial_nerve',
        name: 'Hjernenervetest',
        description: 'CN V, VII, IX, X, XI, XII',
      },
      { id: 'cerv_myotomes', name: 'Myotomer C5-T1', description: 'Motorisk funksjon' },
      { id: 'cerv_dermatomes', name: 'Dermatomer C5-T1', description: 'Sensorisk funksjon' },
      { id: 'cerv_reflexes', name: 'Reflekser', description: 'Biceps, brachioradialis, triceps' },
    ],
  },
  thoracic: {
    id: 'thoracic',
    name: 'Thorax / Thorakalcolumna',
    icon: '🦴',
    normalTests: [
      {
        id: 'thor_arom',
        name: 'Aktiv ROM',
        description: 'Fleksjon, ekstensjon, rotasjon, lateralfleksjon',
      },
      { id: 'thor_prom', name: 'Passiv ROM', description: 'Segmentell bevegelse' },
      { id: 'thor_palp', name: 'Palpasjon', description: 'Costotransversal, paravertebral' },
      { id: 'thor_rib_spring', name: 'Ribbefjærtest', description: 'Rib cage mobilitet' },
      { id: 'thor_chest_exp', name: 'Brystveggsekspansjon', description: 'Respirasjonsbevegelse' },
      { id: 'thor_kyphosis', name: 'Kyfosevurdering', description: 'Holdning og kurve' },
    ],
    extraTests: [
      { id: 'thor_slump', name: 'Slump test (thoracic)', description: 'Nevral mobilitet' },
      { id: 'thor_adams', name: 'Adams forward bend', description: 'Skoliose screening' },
      { id: 'thor_compression', name: 'Thorax kompresjon', description: 'Costafraktur/lesjon' },
      { id: 'thor_first_rib', name: 'Første ribbetest', description: 'Dysfunksjon første ribbe' },
      { id: 'thor_breathing', name: 'Pustemønster', description: 'Diafragma vs apikal' },
      {
        id: 'thor_schober',
        name: 'Modifisert Schober',
        description: 'Thoracolumbal fleksibilitet',
      },
    ],
  },
  lumbar: {
    id: 'lumbar',
    name: 'Korsrygg / Lumbalcolumna',
    icon: '🦴',
    normalTests: [
      {
        id: 'lumb_arom',
        name: 'Aktiv ROM',
        description: 'Fleksjon, ekstensjon, rotasjon, lateralfleksjon',
      },
      { id: 'lumb_prom', name: 'Passiv ROM', description: 'Slutt-følelse, smerte' },
      { id: 'lumb_palp', name: 'Palpasjon', description: 'Paravertebral, SI-ledd, prosesser' },
      { id: 'lumb_slr', name: 'Straight Leg Raise (SLR)', description: 'Isjas/nerverotkompresjon' },
      { id: 'lumb_slump', name: 'Slump test', description: 'Nevral mobilitet' },
      {
        id: 'lumb_prone_instab',
        name: 'Prone instabilitetstest',
        description: 'Lumbal instabilitet',
      },
    ],
    extraTests: [
      { id: 'lumb_crossed_slr', name: 'Krysset SLR', description: 'Diskusprolaps' },
      { id: 'lumb_femoral', name: 'Femoral stretch', description: 'L2-L4 radikulopati' },
      { id: 'lumb_kemp', name: 'Kemps test', description: 'Fasettleddsaffeksjon' },
      { id: 'lumb_valsalva', name: 'Valsalva manøver', description: 'Intratekal patologi' },
      { id: 'lumb_myotomes', name: 'Myotomer L2-S1', description: 'Motorisk funksjon' },
      { id: 'lumb_dermatomes', name: 'Dermatomer L2-S2', description: 'Sensorisk funksjon' },
      { id: 'lumb_reflexes', name: 'Reflekser', description: 'Patella, achilles' },
      { id: 'lumb_babinski', name: 'Babinski', description: 'Øvre motornevron' },
      { id: 'lumb_clonus', name: 'Klonus', description: 'Øvre motornevron' },
    ],
  },
  sacroiliac: {
    id: 'sacroiliac',
    name: 'Bekken / SI-ledd',
    icon: '🦴',
    normalTests: [
      { id: 'si_palp', name: 'Palpasjon SI-ledd', description: 'Ømhet over SI-ledd' },
      { id: 'si_gapping', name: 'Gapping test', description: 'SI-ledd provokasjon' },
      { id: 'si_compression', name: 'Kompressjonstest', description: 'SI-ledd provokasjon' },
      { id: 'si_faber', name: 'FABER/Patricks test', description: 'SI-ledd/hofte differensial' },
      { id: 'si_gaenslen', name: 'Gaenslens test', description: 'SI-ledd stresstest' },
    ],
    extraTests: [
      { id: 'si_thigh_thrust', name: 'Thigh thrust', description: 'SI-ledd provokasjon' },
      { id: 'si_sacral_thrust', name: 'Sacral thrust', description: 'SI-ledd provokasjon' },
      { id: 'si_standing_flex', name: 'Standing flexion test', description: 'SI-ledd bevegelse' },
      { id: 'si_sitting_flex', name: 'Sitting flexion test', description: 'SI-ledd bevegelse' },
      { id: 'si_stork', name: 'Stork test', description: 'SI-ledd stabilitet' },
      { id: 'si_trendelenburg', name: 'Trendelenburg', description: 'Gluteus medius funksjon' },
    ],
  },
  tmj: {
    id: 'tmj',
    name: 'Kjeve / TMJ',
    icon: '😬',
    normalTests: [
      { id: 'tmj_arom', name: 'Aktiv gapeevne', description: 'Åpning, lukking, lateraldeviasjon' },
      { id: 'tmj_palp', name: 'Palpasjon', description: 'TMJ, masseter, temporalis, pterygoid' },
      { id: 'tmj_click', name: 'Klikk/krepitasjon', description: 'Ved åpning/lukking' },
      { id: 'tmj_deviation', name: 'Deviasjonsmønster', description: 'S-kurve, C-kurve' },
    ],
    extraTests: [
      { id: 'tmj_loading', name: 'TMJ belastningstest', description: 'Smerte ved tyggebelastning' },
      { id: 'tmj_cervical', name: 'Cervikal påvirkning', description: 'Nakke-kjeve relasjon' },
      { id: 'tmj_occlusion', name: 'Okklusjon', description: 'Bittforhold' },
      { id: 'tmj_headache', name: 'Assosiert hodepine', description: 'Temporal, frontal' },
    ],
  },
  shoulder: {
    id: 'shoulder',
    name: 'Skulder',
    icon: '💪',
    normalTests: [
      { id: 'shld_arom', name: 'Aktiv ROM', description: 'Fleksjon, abduksjon, rotasjon' },
      { id: 'shld_prom', name: 'Passiv ROM', description: 'Slutt-følelse, kapselmønster' },
      { id: 'shld_palp', name: 'Palpasjon', description: 'AC-ledd, bicepssene, rotator cuff' },
      { id: 'shld_neer', name: 'Neers test', description: 'Subacromial impingement' },
      { id: 'shld_hawkins', name: 'Hawkins-Kennedy', description: 'Subacromial impingement' },
      { id: 'shld_empty_can', name: 'Empty can/Jobe', description: 'Supraspinatus' },
    ],
    extraTests: [
      { id: 'shld_full_can', name: 'Full can test', description: 'Supraspinatus' },
      { id: 'shld_drop_arm', name: 'Drop arm test', description: 'Rotator cuff ruptur' },
      { id: 'shld_lift_off', name: 'Lift-off test', description: 'Subscapularis' },
      { id: 'shld_hornblower', name: 'Hornblower test', description: 'Teres minor' },
      { id: 'shld_external_lag', name: 'External rotation lag', description: 'Infraspinatus' },
      { id: 'shld_speed', name: 'Speed test', description: 'Biceps tendinopati' },
      { id: 'shld_yergason', name: 'Yergasons test', description: 'Biceps tendinopati' },
      { id: 'shld_obrien', name: "O'Brien test", description: 'SLAP lesjon' },
      { id: 'shld_apprehension', name: 'Apprehension test', description: 'Anterior instabilitet' },
      { id: 'shld_relocation', name: 'Relocation test', description: 'Anterior instabilitet' },
      { id: 'shld_sulcus', name: 'Sulcus sign', description: 'Inferior instabilitet' },
      { id: 'shld_cross_body', name: 'Cross-body adduksjon', description: 'AC-ledd patologi' },
    ],
  },
  elbow: {
    id: 'elbow',
    name: 'Albue',
    icon: '💪',
    normalTests: [
      {
        id: 'elb_arom',
        name: 'Aktiv ROM',
        description: 'Fleksjon, ekstensjon, pronasjon, supinasjon',
      },
      { id: 'elb_prom', name: 'Passiv ROM', description: 'Slutt-følelse' },
      { id: 'elb_palp', name: 'Palpasjon', description: 'Epikondyler, olecranon' },
      { id: 'elb_cozen', name: 'Cozens test', description: 'Lateral epikondylitt' },
      { id: 'elb_mill', name: 'Mills test', description: 'Lateral epikondylitt' },
    ],
    extraTests: [
      { id: 'elb_medial_epi', name: 'Medial epikondylitt test', description: "Golfer's elbow" },
      { id: 'elb_maudsley', name: 'Maudsleys test', description: 'Lateral epikondylitt' },
      { id: 'elb_tinel', name: 'Tinels test (albue)', description: 'Ulnar nevropati' },
      { id: 'elb_flexion_test', name: 'Albuebøyningstest', description: 'Ulnar nervekompresjon' },
      { id: 'elb_valgus', name: 'Valgus stresstest', description: 'MCL stabilitet' },
      { id: 'elb_varus', name: 'Varus stresstest', description: 'LCL stabilitet' },
    ],
  },
  wrist_hand: {
    id: 'wrist_hand',
    name: 'Håndledd / Hånd',
    icon: '✋',
    normalTests: [
      {
        id: 'wrist_arom',
        name: 'Aktiv ROM',
        description: 'Fleksjon, ekstensjon, radial/ulnar deviasjon',
      },
      { id: 'wrist_prom', name: 'Passiv ROM', description: 'Slutt-følelse' },
      { id: 'wrist_palp', name: 'Palpasjon', description: 'Karpalbein, sener' },
      { id: 'wrist_phalen', name: 'Phalens test', description: 'Karpaltunnelsyndrom' },
      { id: 'wrist_tinel', name: 'Tinels test (håndledd)', description: 'Karpaltunnelsyndrom' },
      { id: 'wrist_grip', name: 'Gripestyrke', description: 'Funksjonell styrke' },
    ],
    extraTests: [
      { id: 'wrist_durkan', name: 'Durkans test', description: 'Karpaltunnelsyndrom' },
      { id: 'wrist_finkelstein', name: 'Finkelsteins test', description: 'De Quervain' },
      { id: 'wrist_scaphoid', name: 'Anatomisk snusdåse', description: 'Scaphoidfraktur' },
      { id: 'wrist_watson', name: 'Watson test', description: 'Scapholunær instabilitet' },
      { id: 'wrist_piano', name: 'Piano key test', description: 'DRUJ instabilitet' },
      { id: 'wrist_fovea', name: 'Fovea sign', description: 'TFCC lesjon' },
      { id: 'wrist_pinch', name: 'Pinsetgrep', description: 'Finmotorikk' },
    ],
  },
  hip: {
    id: 'hip',
    name: 'Hofte',
    icon: '🦵',
    normalTests: [
      {
        id: 'hip_arom',
        name: 'Aktiv ROM',
        description: 'Fleksjon, ekstensjon, rotasjon, abduksjon/adduksjon',
      },
      { id: 'hip_prom', name: 'Passiv ROM', description: 'Kapselmønster' },
      { id: 'hip_palp', name: 'Palpasjon', description: 'Trochanter, adduktorer, iliopsoas' },
      { id: 'hip_faber', name: 'FABER/Patricks test', description: 'Hofte/SI-ledd' },
      { id: 'hip_fadir', name: 'FADIR test', description: 'Femoroacetabulær impingement' },
      { id: 'hip_thomas', name: 'Thomas test', description: 'Iliopsoas kontraktur' },
    ],
    extraTests: [
      { id: 'hip_scour', name: 'Scour test', description: 'Labrum/artrose' },
      { id: 'hip_log_roll', name: 'Log roll test', description: 'Intraarticulær patologi' },
      { id: 'hip_ober', name: 'Obers test', description: 'ITB stramhet' },
      { id: 'hip_piriformis', name: 'Piriformis test', description: 'Piriformissyndrom' },
      { id: 'hip_resisted', name: 'Isometrisk motstand', description: 'Muskelstyrke' },
      { id: 'hip_trendelenburg', name: 'Trendelenburg', description: 'Gluteus medius' },
      { id: 'hip_craig', name: 'Craigs test', description: 'Femoral anteversjon' },
    ],
  },
  knee: {
    id: 'knee',
    name: 'Kne',
    icon: '🦵',
    normalTests: [
      { id: 'knee_arom', name: 'Aktiv ROM', description: 'Fleksjon, ekstensjon' },
      { id: 'knee_prom', name: 'Passiv ROM', description: 'Slutt-følelse' },
      { id: 'knee_palp', name: 'Palpasjon', description: 'Leddlinje, patella, menisk' },
      { id: 'knee_effusion', name: 'Effusjonstest', description: 'Hevelse/væske' },
      { id: 'knee_mcmurray', name: 'McMurrays test', description: 'Meniskskade' },
      { id: 'knee_lachman', name: 'Lachman test', description: 'ACL' },
    ],
    extraTests: [
      { id: 'knee_anterior_drawer', name: 'Anterior skufftest', description: 'ACL' },
      { id: 'knee_posterior_drawer', name: 'Posterior skufftest', description: 'PCL' },
      { id: 'knee_valgus', name: 'Valgus stresstest', description: 'MCL' },
      { id: 'knee_varus', name: 'Varus stresstest', description: 'LCL' },
      { id: 'knee_pivot', name: 'Pivot shift', description: 'ACL rotatorisk' },
      { id: 'knee_apley', name: 'Apleys test', description: 'Menisk' },
      { id: 'knee_thessaly', name: 'Thessaly test', description: 'Menisk' },
      { id: 'knee_patella_grind', name: 'Patella grind', description: 'Patellofemoral' },
      {
        id: 'knee_apprehension',
        name: 'Patella apprehension',
        description: 'Patella instabilitet',
      },
      { id: 'knee_clarke', name: 'Clarkes test', description: 'Chondromalaci' },
    ],
  },
  ankle_foot: {
    id: 'ankle_foot',
    name: 'Ankel / Fot',
    icon: '🦶',
    normalTests: [
      {
        id: 'ankle_arom',
        name: 'Aktiv ROM',
        description: 'Dorsalfleksjon, plantarfleksjon, inversjon, eversjon',
      },
      { id: 'ankle_prom', name: 'Passiv ROM', description: 'Slutt-følelse' },
      { id: 'ankle_palp', name: 'Palpasjon', description: 'Malleol, achilles, plantar fascia' },
      { id: 'ankle_anterior_drawer', name: 'Anterior skufftest', description: 'ATFL' },
      { id: 'ankle_talar_tilt', name: 'Talar tilt', description: 'CFL' },
      { id: 'ankle_thompson', name: 'Thompsons test', description: 'Achillesruptur' },
    ],
    extraTests: [
      { id: 'ankle_squeeze', name: 'Squeeze test', description: 'Syndesmose' },
      { id: 'ankle_external_rot', name: 'Ekstern rotasjonstest', description: 'Syndesmose' },
      { id: 'ankle_windlass', name: 'Windlass test', description: 'Plantar fasciitt' },
      { id: 'ankle_tinel', name: 'Tinels test (tarsaltunnel)', description: 'Tarsaltunnelsyndrom' },
      { id: 'ankle_morton', name: 'Mortons test', description: 'Mortons nevrom' },
      { id: 'ankle_navicular_drop', name: 'Navicular drop', description: 'Fotbuepronasjon' },
      { id: 'ankle_heel_raise', name: 'Singel heel raise', description: 'Posterior tibialis' },
      { id: 'ankle_gait', name: 'Ganganalyse', description: 'Funksjonell vurdering' },
    ],
  },
  balance_neuro: {
    id: 'balance_neuro',
    name: 'Balanse / Generell nevrologi',
    icon: '🧠',
    normalTests: [
      { id: 'bal_romberg', name: 'Romberg', description: 'Stående balanse' },
      { id: 'bal_tandem', name: 'Tandem gange', description: 'Dynamisk balanse' },
      { id: 'bal_single_leg', name: 'Ettbens stående', description: 'Propriosepsjon' },
      { id: 'bal_gait', name: 'Gangobservasjon', description: 'Gangmønster' },
      { id: 'neuro_coordination', name: 'Koordinasjon', description: 'Finger-nese, hel-kne' },
      {
        id: 'neuro_diadochokinesis',
        name: 'Dysdiadokokinesi',
        description: 'Rask alternerende bevegelse',
      },
    ],
    extraTests: [
      { id: 'bal_fukuda', name: 'Fukuda stepping', description: 'Vestibulær asymmetri' },
      { id: 'bal_bess', name: 'BESS', description: 'Balance Error Scoring System' },
      { id: 'neuro_babinski', name: 'Babinski', description: 'Øvre motornevron' },
      { id: 'neuro_hoffmann', name: 'Hoffmann', description: 'Øvre motornevron' },
      { id: 'neuro_clonus', name: 'Klonus', description: 'Øvre motornevron' },
      { id: 'neuro_cranial', name: 'Hjernenerver', description: 'CN II-XII screening' },
      {
        id: 'bal_vestibular',
        name: 'Vestibulær screening',
        description: 'Dix-Hallpike, head impulse',
      },
      {
        id: 'neuro_sensation',
        name: 'Sensorisk screening',
        description: 'Lett berøring, pin-prick',
      },
    ],
  },
};

/**
 * Individual test item component
 */
function TestItem({ test, value, onChange, isExtra = false }) {
  return (
    <div
      className={`p-2.5 border rounded-lg transition-colors ${
        value === true
          ? 'border-amber-300 bg-amber-50'
          : value === false
            ? 'border-green-200 bg-green-50'
            : isExtra
              ? 'border-gray-200 bg-gray-50'
              : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          <button
            onClick={() => onChange(test.id, value === true ? null : true)}
            className={`p-1.5 rounded text-xs font-medium transition-colors ${
              value === true
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-amber-100 hover:text-amber-600'
            }`}
            title="Positiv"
          >
            Positiv
          </button>
          <button
            onClick={() => onChange(test.id, value === false ? null : false)}
            className={`p-1.5 rounded text-xs font-medium transition-colors ${
              value === false
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600'
            }`}
            title="Negativ"
          >
            Negativ
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <span
            className={`text-sm font-medium ${
              value === true
                ? 'text-amber-700'
                : value === false
                  ? 'text-green-700'
                  : 'text-gray-700'
            }`}
          >
            {test.name}
          </span>
          <span className="text-xs text-gray-500 ml-2">{test.description}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Region panel component
 */
function RegionPanel({ region, values = {}, onChange, expanded, onToggle }) {
  const [showExtra, setShowExtra] = useState(false);

  // Count results
  const normalCount = region.normalTests.filter((t) => values[t.id] !== undefined).length;
  const extraCount = region.extraTests.filter((t) => values[t.id] !== undefined).length;
  const positiveCount = [...region.normalTests, ...region.extraTests].filter(
    (t) => values[t.id] === true
  ).length;
  const totalTested = normalCount + extraCount;

  const handleTestChange = (testId, value) => {
    const newValues = { ...values };
    if (value === null) {
      delete newValues[testId];
    } else {
      newValues[testId] = value;
    }
    onChange(newValues);
  };

  return (
    <div
      className={`border rounded-lg overflow-hidden ${
        positiveCount > 0 ? 'border-amber-300' : 'border-gray-200'
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3 flex items-center justify-between ${
          positiveCount > 0 ? 'bg-amber-50' : 'bg-gray-50'
        } hover:bg-gray-100 transition-colors`}
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="text-xl">{region.icon}</span>
          <span className="font-medium text-gray-700">{region.name}</span>
        </div>
        <div className="flex items-center gap-3">
          {totalTested > 0 && (
            <span className="text-sm text-gray-500">
              {totalTested} tester
              {positiveCount > 0 && (
                <span className="text-amber-600 font-medium ml-1">({positiveCount} positiv)</span>
              )}
            </span>
          )}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Normal tests */}
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Normale tester ({normalCount}/{region.normalTests.length})
            </h4>
            <div className="space-y-2">
              {region.normalTests.map((test) => (
                <TestItem
                  key={test.id}
                  test={test}
                  value={values[test.id]}
                  onChange={handleTestChange}
                />
              ))}
            </div>
          </div>

          {/* Extra tests toggle */}
          <div>
            <button
              onClick={() => setShowExtra(!showExtra)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showExtra ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              Ekstra tester ({extraCount}/{region.extraTests.length})
            </button>

            {showExtra && (
              <div className="mt-2 space-y-2">
                {region.extraTests.map((test) => (
                  <TestItem
                    key={test.id}
                    test={test}
                    value={values[test.id]}
                    onChange={handleTestChange}
                    isExtra
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Main RegionalExamination component
 */
export default function RegionalExamination({
  values = {},
  onChange,
  onGenerateReport,
  _readOnly = false,
}) {
  const [expandedRegions, setExpandedRegions] = useState({});

  const handleRegionToggle = (regionId) => {
    setExpandedRegions((prev) => ({
      ...prev,
      [regionId]: !prev[regionId],
    }));
  };

  const handleRegionChange = (regionId, regionValues) => {
    onChange({
      ...values,
      [regionId]: regionValues,
    });
  };

  const handleReset = () => {
    onChange({});
    setExpandedRegions({});
  };

  // Calculate summary
  const summary = useMemo(() => {
    const stats = {
      totalTested: 0,
      totalPositive: 0,
      regions: [],
    };

    Object.entries(REGIONAL_TESTS).forEach(([key, region]) => {
      const regionValues = values[key] || {};
      const allTests = [...region.normalTests, ...region.extraTests];
      const tested = allTests.filter((t) => regionValues[t.id] !== undefined).length;
      const positive = allTests.filter((t) => regionValues[t.id] === true).length;

      stats.totalTested += tested;
      stats.totalPositive += positive;

      if (positive > 0) {
        stats.regions.push({
          id: key,
          name: region.name,
          icon: region.icon,
          positive,
          tested,
        });
      }
    });

    return stats;
  }, [values]);

  // Generate report
  const generateReport = useCallback(() => {
    const lines = [];
    lines.push('REGIONAL UNDERSØKELSE\n');
    lines.push(`Dato: ${new Date().toLocaleDateString('nb-NO')}\n`);

    Object.entries(REGIONAL_TESTS).forEach(([key, region]) => {
      const regionValues = values[key] || {};
      const allTests = [...region.normalTests, ...region.extraTests];
      const testedTests = allTests.filter((t) => regionValues[t.id] !== undefined);

      if (testedTests.length === 0) {
        return;
      }

      const positive = testedTests.filter((t) => regionValues[t.id] === true);
      const negative = testedTests.filter((t) => regionValues[t.id] === false);

      lines.push(`\n${region.icon} ${region.name}:`);

      if (positive.length > 0) {
        lines.push('  Positive funn:');
        positive.forEach((t) => {
          lines.push(`    • ${t.name}`);
        });
      }

      if (negative.length > 0 && positive.length === 0) {
        lines.push('  Alle tester negative');
      }
    });

    if (summary.totalPositive > 0) {
      lines.push('\n\nOPPSUMMERING:');
      lines.push(
        `Totalt ${summary.totalTested} tester utført, ${summary.totalPositive} positive funn.`
      );
      summary.regions.forEach((r) => {
        lines.push(`  ${r.icon} ${r.name}: ${r.positive} positive`);
      });
    } else if (summary.totalTested > 0) {
      lines.push('\n\nOPPSUMMERING:');
      lines.push(`Totalt ${summary.totalTested} tester utført, ingen positive funn.`);
    }

    return lines.join('\n');
  }, [values, summary]);

  const handleGenerateReport = () => {
    const report = generateReport();
    if (onGenerateReport) {
      onGenerateReport(report);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Regional undersøkelse</h2>
          <p className="text-sm text-gray-500">Full kroppsundersøkelse organisert etter region</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600
                      border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Nullstill
          </button>
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white
                      rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Generer rapport
          </button>
        </div>
      </div>

      {/* Summary */}
      {summary.totalTested > 0 && (
        <div
          className={`p-3 rounded-lg border ${
            summary.totalPositive > 0
              ? 'bg-amber-50 border-amber-200'
              : 'bg-green-50 border-green-200'
          }`}
        >
          <p className="text-sm font-medium">
            {summary.totalTested} tester utført • {summary.totalPositive} positive funn
          </p>
          {summary.regions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {summary.regions.map((r) => (
                <span
                  key={r.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium"
                >
                  {r.icon} {r.name}: {r.positive}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Region panels */}
      <div className="space-y-2">
        {Object.entries(REGIONAL_TESTS).map(([key, region]) => (
          <RegionPanel
            key={key}
            region={region}
            values={values[key] || {}}
            onChange={(v) => handleRegionChange(key, v)}
            expanded={expandedRegions[key] || false}
            onToggle={() => handleRegionToggle(key)}
          />
        ))}
      </div>
    </div>
  );
}
