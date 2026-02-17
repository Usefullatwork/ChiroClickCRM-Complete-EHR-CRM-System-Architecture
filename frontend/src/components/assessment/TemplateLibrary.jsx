import { useState, useMemo } from 'react';
import { X, Search, Star, Clock } from 'lucide-react';

/**
 * TemplateLibrary - Jane App-style chart template library
 *
 * Features:
 * - Search across all templates
 * - Filter by discipline
 * - Template categories with counts
 * - Favorites and recently used
 */

// Discipline categories with template counts (like Jane App)
const DISCIPLINES = [
  { id: 'all', name: 'All Disciplines', count: 2847 },
  { id: 'chiropractic', name: 'Chiropractic', count: 1440 },
  { id: 'physiotherapy', name: 'Physiotherapy', count: 1281 },
  { id: 'massage', name: 'Massage Therapy', count: 1381 },
  { id: 'osteopathy', name: 'Osteopathy', count: 117 },
  { id: 'naturopathic', name: 'Naturopathic Medicine', count: 555 },
  { id: 'acupuncture', name: 'Acupuncture', count: 508 },
  { id: 'athletic', name: 'Athletic Therapy', count: 82 },
  { id: 'counselling', name: 'Counselling', count: 268 },
  { id: 'dietetics', name: 'Dietetics', count: 42 },
  { id: 'kinesiology', name: 'Kinesiology', count: 115 },
  { id: 'occupational', name: 'Occupational Therapy', count: 82 },
  { id: 'podiatry', name: 'Podiatry', count: 76 },
  { id: 'psychology', name: 'Psychology', count: 65 },
  { id: 'other', name: 'Other', count: 453 },
];

// Template database organized by discipline and category
const TEMPLATES = {
  chiropractic: {
    Subjective: {
      'Chief Complaint': [
        {
          id: 'cc1',
          name: 'Low Back Pain - Initial',
          text: 'Patient presents with low back pain. Pain is described as [sharp/dull/aching] and located in the [lower lumbar/lumbosacral] region. Pain intensity rated at [X]/10. Onset was [gradual/sudden] approximately [duration] ago.',
        },
        {
          id: 'cc2',
          name: 'Neck Pain - Initial',
          text: 'Patient presents with neck pain. Pain is described as [sharp/dull/aching] and located in the [cervical/upper thoracic] region. Pain intensity rated at [X]/10. Onset was [gradual/sudden] approximately [duration] ago.',
        },
        {
          id: 'cc3',
          name: 'Headache - Cervicogenic',
          text: 'Patient presents with headaches originating from the neck region. Headaches are [unilateral/bilateral] and described as [throbbing/pressure/dull ache]. Frequency is [daily/weekly/intermittent].',
        },
        {
          id: 'cc4',
          name: 'Sciatica Presentation',
          text: 'Patient presents with radiating pain from the low back into the [right/left/bilateral] lower extremity. Numbness/tingling reported in [dermatomal distribution]. Pain worse with [sitting/standing/walking].',
        },
        {
          id: 'cc5',
          name: 'Mid Back Pain',
          text: 'Patient presents with mid-back/thoracic pain. Pain is located between the shoulder blades and is [sharp/dull/aching]. Pain intensity [X]/10.',
        },
        {
          id: 'cc6',
          name: 'Shoulder Pain',
          text: 'Patient presents with [right/left] shoulder pain. Pain is described as [sharp/dull/aching] and [localized/radiating]. Pain intensity [X]/10.',
        },
      ],
      History: [
        {
          id: 'h1',
          name: 'First Episode',
          text: 'This is the first episode of this condition. No prior treatment received. Patient denies previous similar episodes.',
        },
        {
          id: 'h2',
          name: 'Recurring Condition',
          text: 'Patient has a history of similar episodes. Previous episodes occurred [frequency/duration]. Prior treatment included [treatment types] with [good/moderate/poor] response.',
        },
        {
          id: 'h3',
          name: 'Post-MVA',
          text: 'Symptoms began following a motor vehicle accident on [date]. Patient was the [driver/passenger] and was struck from [direction]. Airbags [did/did not] deploy. Patient [did/did not] go to ER.',
        },
        {
          id: 'h4',
          name: 'Work-Related Injury',
          text: 'Symptoms began following a work-related incident on [date]. Mechanism of injury: [describe]. WCB claim [filed/pending].',
        },
        {
          id: 'h5',
          name: 'Sports Injury',
          text: 'Symptoms began during [sport/activity] on [date]. Mechanism of injury: [describe]. Initial treatment included [describe].',
        },
        {
          id: 'h6',
          name: 'Gradual Onset',
          text: 'Symptoms developed gradually over [duration] without specific injury or trauma. Patient attributes onset to [activity/posture/unknown].',
        },
      ],
      'Pain Pattern': [
        {
          id: 'pp1',
          name: 'Constant Pain',
          text: 'Pain is constant and present throughout the day. Intensity varies from [X-Y]/10. Sleep is [affected/not affected].',
        },
        {
          id: 'pp2',
          name: 'Intermittent Pain',
          text: 'Pain is intermittent, occurring [frequency]. Episodes last [duration]. Triggered by [activities].',
        },
        {
          id: 'pp3',
          name: 'Morning Stiffness',
          text: 'Pain and stiffness are worst in the morning, lasting approximately [duration]. Improves with movement and activity.',
        },
        {
          id: 'pp4',
          name: 'End of Day Pain',
          text: 'Pain progressively worsens throughout the day. Minimal in the morning, peaks in the evening. Aggravated by prolonged [activity].',
        },
      ],
    },
    Objective: {
      Posture: [
        {
          id: 'o1',
          name: 'Normal Posture',
          text: 'Postural assessment reveals balanced posture with normal spinal curvatures. Head position centered, shoulders level, and pelvis balanced.',
        },
        {
          id: 'o2',
          name: 'Forward Head Posture',
          text: 'Postural assessment reveals forward head carriage with increased cervical lordosis. Shoulders rounded anteriorly. Upper crossed syndrome pattern observed.',
        },
        {
          id: 'o3',
          name: 'Scoliotic Curve',
          text: 'Postural assessment reveals [right/left] lateral curvature in the [thoracic/lumbar] spine. Shoulder and hip height asymmetry noted.',
        },
        {
          id: 'o4',
          name: 'Hyperlordosis',
          text: 'Postural assessment reveals increased lumbar lordosis with anterior pelvic tilt. Lower crossed syndrome pattern observed.',
        },
        {
          id: 'o5',
          name: 'Flat Back',
          text: 'Postural assessment reveals decreased lumbar lordosis with posterior pelvic tilt. Tight hamstrings and weak hip flexors suspected.',
        },
      ],
      ROM: [
        {
          id: 'r1',
          name: 'Cervical ROM Normal',
          text: 'Cervical ROM: Flexion WNL, Extension WNL, Right Rotation WNL, Left Rotation WNL, Right Lateral Flexion WNL, Left Lateral Flexion WNL.',
        },
        {
          id: 'r2',
          name: 'Cervical ROM Restricted',
          text: 'Cervical ROM: Flexion [WNL/Reduced], Extension [WNL/Reduced X%], Right Rotation [WNL/Reduced X%], Left Rotation [WNL/Reduced X%], Right Lateral Flexion [WNL/Reduced X%], Left Lateral Flexion [WNL/Reduced X%]. Pain at end range in [directions].',
        },
        {
          id: 'r3',
          name: 'Lumbar ROM Normal',
          text: 'Lumbar ROM: Flexion WNL, Extension WNL, Right Rotation WNL, Left Rotation WNL, Right Lateral Flexion WNL, Left Lateral Flexion WNL.',
        },
        {
          id: 'r4',
          name: 'Lumbar ROM Restricted',
          text: 'Lumbar ROM: Flexion [WNL/Reduced X%], Extension [WNL/Reduced X%], Right Rotation [WNL/Reduced X%], Left Rotation [WNL/Reduced X%], Right Lateral Flexion [WNL/Reduced X%], Left Lateral Flexion [WNL/Reduced X%]. Pain at end range in [directions].',
        },
      ],
      Palpation: [
        {
          id: 'p1',
          name: 'Cervical Palpation',
          text: 'Palpation reveals tenderness at [C2-C7] with associated muscle hypertonicity in the [upper trapezius/levator scapulae/SCM/scalenes]. Trigger points identified in [muscles].',
        },
        {
          id: 'p2',
          name: 'Thoracic Palpation',
          text: 'Palpation reveals tenderness at [T1-T12] with associated muscle hypertonicity in the [rhomboids/middle trapezius/erector spinae]. Rib restrictions noted at [levels].',
        },
        {
          id: 'p3',
          name: 'Lumbar Palpation',
          text: 'Palpation reveals tenderness at [L1-L5/SI joints] with associated muscle hypertonicity in the [paraspinals/quadratus lumborum/gluteals/piriformis]. Trigger points identified in [muscles].',
        },
        {
          id: 'p4',
          name: 'No Significant Findings',
          text: 'Palpation reveals no significant tenderness or muscle hypertonicity. Joints mobile and non-tender.',
        },
      ],
      'Orthopedic Tests': [
        {
          id: 'ot1',
          name: 'Lumbar Tests Negative',
          text: "Orthopedic Testing: SLR negative bilaterally, Braggard's negative, Kemp's negative bilaterally, Valsalva negative, Milgram's negative. Heel/toe walk intact.",
        },
        {
          id: 'ot2',
          name: 'Lumbar Tests Positive',
          text: "Orthopedic Testing: SLR positive [right/left] at [degrees] with [pain/numbness/tingling] in [distribution]. Braggard's [pos/neg], Kemp's [pos/neg] [right/left], Valsalva [pos/neg], Milgram's [pos/neg].",
        },
        {
          id: 'ot3',
          name: 'Cervical Tests Negative',
          text: "Orthopedic Testing: Spurling's negative bilaterally, Distraction test negative, Compression test negative, Shoulder Abduction Relief negative. Upper limb tension tests negative.",
        },
        {
          id: 'ot4',
          name: 'Cervical Tests Positive',
          text: "Orthopedic Testing: Spurling's positive [right/left] reproducing [symptoms]. Distraction test [pos/neg], Compression test [pos/neg], Shoulder Abduction Relief [pos/neg].",
        },
        {
          id: 'ot5',
          name: 'SI Joint Tests',
          text: "SI Joint Testing: FABER positive [right/left], Gaenslen's [pos/neg], SI Compression [pos/neg], SI Distraction [pos/neg], Sacral Thrust [pos/neg]. [X/5] positive tests suggesting SI involvement.",
        },
      ],
      Neurological: [
        {
          id: 'n1',
          name: 'Neuro Normal',
          text: 'Neurological Examination: DTRs 2+ and symmetrical (biceps, triceps, brachioradialis, patellar, Achilles). Dermatomal sensation intact. Myotomal strength 5/5 throughout. No pathological reflexes.',
        },
        {
          id: 'n2',
          name: 'Neuro Abnormal',
          text: 'Neurological Examination: DTRs [findings]. Dermatomal sensation [findings] in [distribution]. Myotomal weakness noted in [muscles/myotome]. [Pathological reflexes if any].',
        },
      ],
    },
    Assessment: [
      {
        id: 'a1',
        name: 'Mechanical LBP',
        text: 'Clinical presentation consistent with mechanical low back pain. Likely facet involvement based on extension/rotation pain pattern. No neurological deficits. Red flags negative. Prognosis good with conservative care.',
      },
      {
        id: 'a2',
        name: 'Lumbar Radiculopathy',
        text: 'Clinical presentation consistent with lumbar radiculopathy at [level]. Positive nerve tension signs and dermatomal findings suggest [nerve root] involvement. Monitor for progression. Consider imaging if no improvement in [timeframe].',
      },
      {
        id: 'a3',
        name: 'Cervicogenic Headache',
        text: 'Clinical presentation consistent with cervicogenic headache. Cervical joint dysfunction at [levels] with referred pain pattern to head. No red flags for secondary headache. Prognosis good with manual therapy.',
      },
      {
        id: 'a4',
        name: 'Mechanical Neck Pain',
        text: 'Clinical presentation consistent with mechanical neck pain. Joint dysfunction at [levels] with associated muscle hypertonicity. No radicular findings. Prognosis good with conservative care.',
      },
      {
        id: 'a5',
        name: 'SI Joint Dysfunction',
        text: 'Clinical presentation consistent with sacroiliac joint dysfunction [right/left]. [X/5] positive provocation tests. Associated muscle imbalances in hip/pelvis. Prognosis good with manipulation and stabilization exercises.',
      },
    ],
    Plan: {
      Treatment: [
        {
          id: 't1',
          name: 'Spinal Manipulation',
          text: 'Treatment today: Spinal manipulation/mobilization to [regions]. Soft tissue therapy to [muscles]. Patient tolerated treatment well. Immediate post-treatment improvement noted.',
        },
        {
          id: 't2',
          name: 'Comprehensive Treatment',
          text: 'Treatment today: Spinal manipulation to [regions], myofascial release to [muscles], trigger point therapy to [muscles], assisted stretching to [muscles/regions]. Modalities: [heat/ice/EMS/ultrasound] applied to [region]. Patient tolerated treatment well.',
        },
        {
          id: 't3',
          name: 'Soft Tissue Focus',
          text: 'Treatment today: Soft tissue therapy focus. Myofascial release, trigger point therapy, and assisted stretching to [muscles/regions]. Gentle mobilization to [joints]. Patient tolerated treatment well.',
        },
      ],
      Exercises: [
        {
          id: 'e1',
          name: 'Core Stabilization',
          text: 'Home exercises prescribed: Core stabilization program including dead bugs, bird dogs, and planks. Perform [sets x reps] daily. Written/video instructions provided.',
        },
        {
          id: 'e2',
          name: 'Cervical Exercises',
          text: 'Home exercises prescribed: Chin tucks, cervical AROM, upper trap stretches, levator scapulae stretches. Perform [sets x reps] [frequency]. Written/video instructions provided.',
        },
        {
          id: 'e3',
          name: 'McKenzie Extension',
          text: 'Home exercises prescribed: McKenzie extension protocol - prone props, press-ups. Perform every [frequency] and as needed for centralization. Written/video instructions provided.',
        },
        {
          id: 'e4',
          name: 'Hip/Pelvis Program',
          text: 'Home exercises prescribed: Hip flexor stretches, piriformis stretches, glute bridges, clamshells. Perform [sets x reps] daily. Written/video instructions provided.',
        },
      ],
      'Follow-up': [
        {
          id: 'f1',
          name: 'Standard Follow-up',
          text: 'Treatment Plan: Recommend [X] treatments over [X] weeks. Re-evaluate progress at [visit number]. Return in [X] days for next appointment.',
        },
        {
          id: 'f2',
          name: 'Acute Care Plan',
          text: 'Treatment Plan: Acute care phase - [X] visits over [X] weeks at [frequency] per week. Transition to corrective care upon symptom stabilization. Re-evaluate in [X] visits.',
        },
        {
          id: 'f3',
          name: 'PRN Basis',
          text: 'Patient stable. Return on PRN (as needed) basis. Continue home exercise program. Return if symptoms worsen or new symptoms develop.',
        },
      ],
    },
  },
  physiotherapy: {
    Assessment: [
      {
        id: 'pt1',
        name: 'Post-Surgical Knee',
        text: 'Post-operative [procedure] day [X]. Incision healing well. ROM: Flexion [X]°, Extension [X]°. Quad activation [present/absent]. Weight bearing status: [status].',
      },
      {
        id: 'pt2',
        name: 'Rotator Cuff',
        text: 'Clinical presentation consistent with rotator cuff [tendinopathy/tear]. Positive [tests]. Pain arc at [degrees]. Strength: [findings]. ROM: [findings].',
      },
      {
        id: 'pt3',
        name: 'ACL Rehabilitation',
        text: 'ACL reconstruction [graft type] - [timeframe] post-op. ROM: [findings]. Strength: [findings]. Functional testing: [findings]. Phase [X] of rehabilitation protocol.',
      },
    ],
  },
  massage: {
    'Treatment Notes': [
      {
        id: 'm1',
        name: 'Full Body Relaxation',
        text: '60-minute full body relaxation massage. Techniques: Swedish effleurage and petrissage. Areas treated: Back, shoulders, neck, legs, arms. Pressure: [light/medium/deep]. Client response: [findings].',
      },
      {
        id: 'm2',
        name: 'Therapeutic Deep Tissue',
        text: '60-minute therapeutic deep tissue massage. Focus areas: [regions]. Techniques: Deep tissue, myofascial release, trigger point therapy. Significant tension noted in [muscles]. Client tolerated treatment well.',
      },
      {
        id: 'm3',
        name: 'Sports Massage',
        text: 'Sports massage treatment. Pre/post event focus on [muscle groups]. Techniques: [techniques used]. Treatment goals: [goals]. Recommendations: [recommendations].',
      },
    ],
  },
};

// Get all templates flattened for search
const getAllTemplates = () => {
  const all = [];
  Object.entries(TEMPLATES).forEach(([discipline, categories]) => {
    Object.entries(categories).forEach(([category, subcategories]) => {
      if (Array.isArray(subcategories)) {
        // Direct array of templates
        subcategories.forEach((template) => {
          all.push({ ...template, discipline, category, subcategory: null });
        });
      } else {
        // Nested subcategories
        Object.entries(subcategories).forEach(([subcategory, templates]) => {
          templates.forEach((template) => {
            all.push({ ...template, discipline, category, subcategory });
          });
        });
      }
    });
  });
  return all;
};

export default function TemplateLibrary({
  isOpen = true,
  onClose,
  onSelectTemplate,
  _soapSection = null,
  showHeader = true,
  embedded = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('chiropractic');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [recentlyUsed, setRecentlyUsed] = useState([]);

  const allTemplates = useMemo(() => getAllTemplates(), []);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let results = allTemplates;

    // Filter by discipline
    if (selectedDiscipline !== 'all') {
      results = results.filter((t) => t.discipline === selectedDiscipline);
    }

    // Filter by search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.text.toLowerCase().includes(search) ||
          t.category.toLowerCase().includes(search)
      );
    }

    // Filter by category
    if (selectedCategory) {
      results = results.filter((t) => t.category === selectedCategory);
    }

    return results;
  }, [allTemplates, selectedDiscipline, searchTerm, selectedCategory]);

  // Get categories for selected discipline
  const categories = useMemo(() => {
    if (selectedDiscipline === 'all') {
      return [...new Set(allTemplates.map((t) => t.category))];
    }
    const disciplineTemplates = TEMPLATES[selectedDiscipline];
    return disciplineTemplates ? Object.keys(disciplineTemplates) : [];
  }, [selectedDiscipline, allTemplates]);

  const handleSelectTemplate = (template) => {
    // Build content object based on template category
    const content = {
      text: template.text,
    };

    // Map template category to SOAP section
    if (
      template.category === 'Chief Complaint' ||
      template.category === 'History' ||
      template.category === 'Pain Pattern'
    ) {
      content.subjective = template.text;
      if (template.category === 'History') {
        content.history = template.text;
      }
    } else if (
      template.category === 'Posture' ||
      template.category === 'ROM' ||
      template.category === 'Palpation' ||
      template.category === 'Orthopedic Tests' ||
      template.category === 'Neurological'
    ) {
      content.objective = template.text;
    } else if (template.soapSection === 'Assessment') {
      content.assessment = template.text;
    } else if (
      template.category === 'Treatment' ||
      template.category === 'Home Exercises' ||
      template.category === 'Goals' ||
      template.category === 'Follow-up'
    ) {
      content.plan = template.text;
    }

    onSelectTemplate({ ...template, content });

    // Add to recently used
    setRecentlyUsed((prev) => {
      const filtered = prev.filter((t) => t.id !== template.id);
      return [template, ...filtered].slice(0, 10);
    });
  };

  const toggleFavorite = (template, e) => {
    e.stopPropagation();
    setFavorites((prev) => {
      if (prev.some((t) => t.id === template.id)) {
        return prev.filter((t) => t.id !== template.id);
      }
      return [...prev, template];
    });
  };

  if (!isOpen) {
    return null;
  }

  // Wrapper component - either modal or inline
  const Wrapper = ({ children }) => {
    if (embedded) {
      return <div className="bg-white flex flex-col h-full">{children}</div>;
    }
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    );
  };

  return (
    <Wrapper>
      {/* Header - only shown if not embedded or showHeader is true */}
      {showHeader && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-teal-600 font-bold text-sm">J</span>
            </div>
            <h2 className="text-xl font-semibold text-white">Chart Template Library</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Search */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for a template..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Discipline Filter */}
        <div className="w-80 border-r border-gray-200 overflow-y-auto bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Filter by Discipline</h3>
          <div className="grid grid-cols-2 gap-2">
            {DISCIPLINES.map((discipline) => (
              <button
                key={discipline.id}
                onClick={() => {
                  setSelectedDiscipline(discipline.id);
                  setSelectedCategory(null);
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedDiscipline === discipline.id
                    ? 'bg-teal-50 border-teal-300 text-teal-800'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium text-sm truncate">{discipline.name}</div>
                <div className="text-xs text-gray-500">{discipline.count} templates</div>
              </button>
            ))}
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full px-3 py-2 rounded-lg text-left text-sm ${
                    !selectedCategory
                      ? 'bg-teal-100 text-teal-800 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full px-3 py-2 rounded-lg text-left text-sm ${
                      selectedCategory === category
                        ? 'bg-teal-100 text-teal-800 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Recently Used */}
          {recentlyUsed.length > 0 && !searchTerm && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recently Used
              </h3>
              <div className="space-y-2">
                {recentlyUsed.slice(0, 3).map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="w-full p-3 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{template.name}</div>
                    <div className="text-sm text-gray-500 truncate">
                      {template.text.slice(0, 80)}...
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Favorites */}
          {favorites.length > 0 && !searchTerm && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Favorites
              </h3>
              <div className="space-y-2">
                {favorites.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="w-full p-3 bg-yellow-50 rounded-lg text-left hover:bg-yellow-100 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{template.name}</div>
                    <div className="text-sm text-gray-500 truncate">
                      {template.text.slice(0, 80)}...
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Template Results */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              {searchTerm ? `Search Results (${filteredTemplates.length})` : 'Templates'}
            </h3>
            <div className="space-y-2">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No templates found matching your criteria
                </div>
              ) : (
                filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="group p-4 bg-white border border-gray-200 rounded-lg hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{template.name}</span>
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                            {template.category}
                          </span>
                          {template.subcategory && (
                            <span className="px-2 py-0.5 text-xs bg-teal-50 text-teal-700 rounded">
                              {template.subcategory}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{template.text}</p>
                      </div>
                      <button
                        onClick={(e) => toggleFavorite(template, e)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          favorites.some((t) => t.id === template.id)
                            ? 'text-yellow-500 hover:bg-yellow-50'
                            : 'text-gray-300 hover:text-yellow-500 hover:bg-yellow-50'
                        }`}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            favorites.some((t) => t.id === template.id) ? 'fill-current' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - only show if onClose is provided */}
      {onClose && (
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      )}
    </Wrapper>
  );
}

// Compact version for sidebar use
export function TemplateLibraryCompact({ onSelectTemplate, discipline = 'chiropractic' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const allTemplates = useMemo(() => getAllTemplates(), []);

  const filteredTemplates = useMemo(() => {
    let results = allTemplates.filter((t) => t.discipline === discipline);
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      results = results.filter(
        (t) => t.name.toLowerCase().includes(search) || t.text.toLowerCase().includes(search)
      );
    }
    return results.slice(0, 10);
  }, [allTemplates, discipline, searchTerm]);

  return (
    <div className="bg-white rounded-lg border p-3">
      <div className="flex items-center gap-2 mb-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search templates..."
          className="flex-1 text-sm border-none focus:outline-none"
        />
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className="w-full text-left px-2 py-1.5 text-xs bg-gray-50 rounded hover:bg-blue-50 transition-colors"
          >
            <div className="font-medium text-gray-900 truncate">{template.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Export constants
export { DISCIPLINES, TEMPLATES as TEMPLATE_DATABASE };
