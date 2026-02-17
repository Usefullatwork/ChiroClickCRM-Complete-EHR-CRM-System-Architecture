import { useState, useMemo, useEffect, useCallback } from 'react';
import { Settings, Grid, List, Star, Search, Loader2 } from 'lucide-react';
import { macrosAPI } from '../../services/api';

/**
 * MacroMatrix - ChiroTouch-style "Hot Button" Macro System
 *
 * One click inserts a full narrative sentence or paragraph.
 * This is the core of the "15-second SOAP note" capability.
 *
 * Features:
 * - Loads macros from backend API (falls back to hardcoded defaults)
 * - Customizable user macros
 * - Grid and list view modes
 * - Favorites for quick access
 * - Search across all macros
 */

// Fallback macro categories (used when API is unavailable)
const DEFAULT_MACROS = {
  adjustments: {
    name: 'Adjustments',
    icon: '🦴',
    color: 'blue',
    macros: [
      {
        id: 'adj-cervical',
        label: 'Cervical Adj',
        text: 'Cervical spine adjustment performed. Patient tolerated the adjustment well with no adverse reaction.',
      },
      {
        id: 'adj-thoracic',
        label: 'Thoracic Adj',
        text: 'Thoracic spine adjustment performed. Patient tolerated the adjustment well with no adverse reaction.',
      },
      {
        id: 'adj-lumbar',
        label: 'Lumbar Adj',
        text: 'Lumbar spine adjustment performed. Patient tolerated the adjustment well with no adverse reaction.',
      },
      {
        id: 'adj-sacral',
        label: 'Sacral Adj',
        text: 'Sacroiliac joint adjustment performed. Patient tolerated the adjustment well with no adverse reaction.',
      },
      {
        id: 'adj-pelvis',
        label: 'Pelvic Adj',
        text: 'Pelvic adjustment performed to correct subluxation. Patient tolerated the adjustment well.',
      },
      {
        id: 'adj-extremity',
        label: 'Extremity Adj',
        text: 'Extremity adjustment performed. Joint mobilization tolerated well with no adverse reaction.',
      },
      {
        id: 'adj-full',
        label: 'Full Spine',
        text: 'Full spine adjustment performed from cervical through lumbar regions. Patient tolerated all adjustments well.',
      },
      {
        id: 'adj-diversified',
        label: 'Diversified',
        text: 'Diversified technique adjustment performed with high-velocity, low-amplitude thrust.',
      },
      {
        id: 'adj-gonstead',
        label: 'Gonstead',
        text: 'Gonstead technique adjustment performed with specific contact point and line of drive.',
      },
      {
        id: 'adj-activator',
        label: 'Activator',
        text: 'Activator Methods instrument adjustment performed. Low-force technique tolerated well.',
      },
      {
        id: 'adj-drop',
        label: 'Drop Table',
        text: 'Thompson Drop Table technique utilized for segmental adjustment.',
      },
      {
        id: 'adj-flexion',
        label: 'Flexion-Distraction',
        text: 'Cox Flexion-Distraction technique performed for disc decompression.',
      },
    ],
  },
  therapies: {
    name: 'Therapies',
    icon: '💆',
    color: 'green',
    macros: [
      {
        id: 'ther-estim',
        label: 'E-Stim',
        text: 'Electrical muscle stimulation applied to the affected area for 15 minutes to reduce muscle spasm and promote healing.',
      },
      {
        id: 'ther-ultrasound',
        label: 'Ultrasound',
        text: 'Therapeutic ultrasound applied to the affected area at 1.0 W/cm² for 5 minutes to promote tissue healing and reduce inflammation.',
      },
      {
        id: 'ther-heat',
        label: 'Heat Pack',
        text: 'Moist heat therapy applied for 15 minutes to increase circulation and relax muscle tissue.',
      },
      {
        id: 'ther-ice',
        label: 'Ice Pack',
        text: 'Cryotherapy applied for 15 minutes to reduce inflammation and provide analgesic effect.',
      },
      {
        id: 'ther-traction',
        label: 'Traction',
        text: 'Mechanical traction applied at appropriate poundage for 15 minutes to decompress spinal segments.',
      },
      {
        id: 'ther-massage',
        label: 'Massage',
        text: 'Therapeutic massage performed to reduce muscle tension and improve circulation. – 15 minutes',
      },
      {
        id: 'ther-stretch',
        label: 'Stretching',
        text: 'Therapeutic stretching performed to improve flexibility and reduce muscle tension. – 8 minutes',
      },
      {
        id: 'ther-myofascial',
        label: 'Myofascial Release',
        text: 'Myofascial release technique performed to address soft tissue restrictions and improve mobility.',
      },
      {
        id: 'ther-iastm',
        label: 'IASTM',
        text: 'Instrument-Assisted Soft Tissue Mobilization (IASTM) performed to break up adhesions and scar tissue. – 8 minutes',
      },
      {
        id: 'ther-cupping',
        label: 'Cupping',
        text: 'Therapeutic cupping applied to affected area to improve circulation and release muscle tension.',
      },
      {
        id: 'ther-kinesio',
        label: 'Kinesio Tape',
        text: 'Kinesio tape applied to provide support and facilitate proper movement patterns.',
      },
      {
        id: 'ther-laser',
        label: 'Cold Laser',
        text: 'Low-level laser therapy (LLLT) applied to promote cellular healing and reduce inflammation.',
      },
    ],
  },
  findings: {
    name: 'Findings',
    icon: '🔍',
    color: 'purple',
    macros: [
      {
        id: 'find-sublux',
        label: 'Subluxation',
        text: 'Palpation revealed vertebral subluxation with associated segmental joint dysfunction, point tenderness, and muscle hypertonicity.',
      },
      {
        id: 'find-spasm',
        label: 'Muscle Spasm',
        text: 'Palpation revealed significant muscle spasm and hypertonicity in the paraspinal musculature.',
      },
      {
        id: 'find-tender',
        label: 'Tenderness',
        text: 'Tenderness to palpation noted over the affected spinal segments.',
      },
      {
        id: 'find-restricted',
        label: 'Restricted ROM',
        text: 'Range of motion testing revealed restriction with pain at end range.',
      },
      {
        id: 'find-normal',
        label: 'Normal Exam',
        text: 'All orthopedic and neurological tests were within normal limits.',
      },
      {
        id: 'find-neuro-intact',
        label: 'Neuro Intact',
        text: 'Neurological examination revealed intact deep tendon reflexes, dermatomal sensation, and myotomal strength.',
      },
      {
        id: 'find-posture',
        label: 'Postural Deviation',
        text: 'Postural analysis revealed deviation from normal alignment with compensatory changes noted.',
      },
      {
        id: 'find-gait',
        label: 'Gait Normal',
        text: 'Gait analysis revealed normal ambulation pattern without antalgic deviation.',
      },
      {
        id: 'find-edema',
        label: 'Edema Present',
        text: 'Palpation revealed localized edema and capsular swelling over the affected joint.',
      },
      {
        id: 'find-trigger',
        label: 'Trigger Points',
        text: 'Multiple trigger points identified in the affected musculature with referred pain pattern.',
      },
    ],
  },
  subjective: {
    name: 'Subjective',
    icon: '💬',
    color: 'teal',
    macros: [
      {
        id: 'subj-better',
        label: 'Feeling Better',
        text: 'Patient reports improvement in symptoms since the last visit.',
      },
      {
        id: 'subj-same',
        label: 'No Change',
        text: 'Patient reports no significant change in symptoms since the last visit.',
      },
      {
        id: 'subj-worse',
        label: 'Feeling Worse',
        text: 'Patient reports worsening of symptoms since the last visit.',
      },
      {
        id: 'subj-50',
        label: '50% Better',
        text: 'Patient reports approximately 50% improvement in symptoms since the last visit.',
      },
      {
        id: 'subj-new',
        label: 'New Complaint',
        text: 'Patient presents with a new complaint in addition to the ongoing condition.',
      },
      {
        id: 'subj-sleep',
        label: 'Sleep Affected',
        text: 'Patient reports that symptoms are affecting sleep quality.',
      },
      {
        id: 'subj-work',
        label: 'Work Affected',
        text: 'Patient reports that symptoms are interfering with work activities.',
      },
      {
        id: 'subj-adl',
        label: 'ADL Affected',
        text: 'Patient reports difficulty performing activities of daily living due to symptoms.',
      },
      {
        id: 'subj-compliant',
        label: 'Compliant',
        text: 'Patient reports compliance with home exercise program and treatment recommendations.',
      },
      {
        id: 'subj-noncompliant',
        label: 'Non-Compliant',
        text: 'Patient reports non-compliance with prescribed home exercises and recommendations.',
      },
    ],
  },
  plan: {
    name: 'Plan',
    icon: '📝',
    color: 'orange',
    macros: [
      {
        id: 'plan-continue',
        label: 'Continue Care',
        text: 'Continue current treatment plan. Patient to return for follow-up visit as scheduled.',
      },
      {
        id: 'plan-2x',
        label: '2x/week',
        text: 'Recommend treatment frequency of 2 times per week for the next 2-4 weeks.',
      },
      {
        id: 'plan-3x',
        label: '3x/week',
        text: 'Recommend treatment frequency of 3 times per week for the acute phase.',
      },
      {
        id: 'plan-1x',
        label: '1x/week',
        text: 'Recommend treatment frequency of 1 time per week for maintenance care.',
      },
      {
        id: 'plan-prn',
        label: 'PRN',
        text: 'Patient may return on an as-needed basis for symptom management.',
      },
      {
        id: 'plan-reeval',
        label: 'Re-evaluation',
        text: 'Re-evaluation scheduled in 30 days to assess progress and adjust treatment plan as needed.',
      },
      {
        id: 'plan-refer',
        label: 'Referral',
        text: 'Referral made to appropriate specialist for further evaluation and co-management.',
      },
      {
        id: 'plan-imaging',
        label: 'Imaging',
        text: 'Diagnostic imaging ordered to further evaluate the condition.',
      },
      {
        id: 'plan-hep',
        label: 'Home Exercises',
        text: 'Home exercise program reviewed and reinforced. Patient instructed to perform exercises daily.',
      },
      {
        id: 'plan-ergo',
        label: 'Ergonomics',
        text: 'Ergonomic recommendations provided to address contributing factors.',
      },
      {
        id: 'plan-discharge',
        label: 'Discharge',
        text: 'Patient discharged from active care. May return as needed for future episodes.',
      },
    ],
  },
  response: {
    name: 'Response',
    icon: '✅',
    color: 'emerald',
    macros: [
      {
        id: 'resp-good',
        label: 'Good Response',
        text: 'Patient demonstrated good response to treatment with improved range of motion and decreased pain.',
      },
      {
        id: 'resp-excellent',
        label: 'Excellent',
        text: 'Patient demonstrated excellent response to treatment with significant symptomatic improvement.',
      },
      {
        id: 'resp-fair',
        label: 'Fair Response',
        text: 'Patient demonstrated fair response to treatment with mild improvement noted.',
      },
      {
        id: 'resp-poor',
        label: 'Poor Response',
        text: 'Patient demonstrated poor response to treatment. Plan modification may be indicated.',
      },
      {
        id: 'resp-immediate',
        label: 'Immediate Relief',
        text: 'Patient reported immediate relief following the adjustment.',
      },
      {
        id: 'resp-gradual',
        label: 'Gradual Improvement',
        text: 'Patient is experiencing gradual improvement with cumulative treatments.',
      },
      {
        id: 'resp-tolerated',
        label: 'Tolerated Well',
        text: 'Patient tolerated all procedures well with no adverse reactions noted.',
      },
      {
        id: 'resp-soreness',
        label: 'Post-Tx Soreness',
        text: 'Patient may experience mild post-treatment soreness for 24-48 hours. Ice recommended.',
      },
    ],
  },
};

// Color mapping for Tailwind
const COLOR_MAP = {
  blue: {
    bg: 'bg-blue-50',
    hover: 'hover:bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badge: 'bg-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    hover: 'hover:bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    badge: 'bg-green-600',
  },
  purple: {
    bg: 'bg-purple-50',
    hover: 'hover:bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
    badge: 'bg-purple-600',
  },
  teal: {
    bg: 'bg-teal-50',
    hover: 'hover:bg-teal-100',
    text: 'text-teal-700',
    border: 'border-teal-200',
    badge: 'bg-teal-600',
  },
  orange: {
    bg: 'bg-orange-50',
    hover: 'hover:bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
    badge: 'bg-orange-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    hover: 'hover:bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badge: 'bg-emerald-600',
  },
};

// Convert API matrix format to component format
function apiMatrixToComponentFormat(apiMatrix) {
  const colorCycle = ['blue', 'green', 'purple', 'teal', 'orange', 'emerald'];
  const iconMap = {
    Adjustments: '🦴',
    Justeringer: '🦴',
    Therapies: '💆',
    Terapier: '💆',
    Findings: '🔍',
    Funn: '🔍',
    Subjective: '💬',
    Subjektivt: '💬',
    Plan: '📝',
    Response: '✅',
    Respons: '✅',
  };

  const result = {};
  let colorIndex = 0;

  for (const [key, category] of Object.entries(apiMatrix)) {
    const allMacros = [...(category.macros || [])];
    for (const subcatMacros of Object.values(category.subcategories || {})) {
      allMacros.push(...subcatMacros);
    }

    result[key] = {
      name: category.name || key,
      icon: iconMap[category.name] || iconMap[key] || '📋',
      color: colorCycle[colorIndex % colorCycle.length],
      macros: allMacros.map((m) => ({
        id: m.id,
        label: m.name,
        text: m.text,
        shortcutKey: m.shortcutKey,
        soapSection: m.soapSection,
        isFavorite: m.isFavorite,
      })),
    };
    colorIndex++;
  }

  return result;
}

export default function MacroMatrix({
  onInsert,
  targetField = 'current',
  favorites: propFavorites = [],
  onFavoritesChange,
  customMacros = [],
  onCustomMacrosChange,
  viewMode: initialViewMode = 'grid',
  className = '',
}) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [showCustomize, setShowCustomize] = useState(false);
  const [_editingMacro, _setEditingMacro] = useState(null);
  const [macroData, setMacroData] = useState(DEFAULT_MACROS);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(propFavorites);
  const [searchResults, setSearchResults] = useState(null);

  // Fetch macros from API
  useEffect(() => {
    const fetchMacros = async () => {
      try {
        const res = await macrosAPI.getMatrix();
        const apiData = res.data?.data || res.data;
        if (apiData && Object.keys(apiData).length > 0) {
          setMacroData(apiMatrixToComponentFormat(apiData));
        }
      } catch {
        // Silently fall back to hardcoded defaults
      } finally {
        setLoading(false);
      }
    };
    fetchMacros();
  }, []);

  // Set initial active category once data is loaded
  useEffect(() => {
    if (!activeCategory && macroData) {
      const firstKey = Object.keys(macroData)[0];
      if (firstKey) {
        setActiveCategory(firstKey);
      }
    }
  }, [macroData, activeCategory]);

  // Combine default and custom macros
  const allMacros = useMemo(() => {
    const combined = { ...macroData };
    if (customMacros.length > 0) {
      combined.custom = {
        name: 'My Macros',
        icon: '⭐',
        color: 'purple',
        macros: customMacros,
      };
    }
    return combined;
  }, [customMacros, macroData]);

  // Debounced API search
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults(null);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await macrosAPI.search(searchTerm);
        const results = (res.data?.data || []).map((m) => ({
          id: m.id,
          label: m.macro_name || m.name,
          text: m.macro_text || m.text,
          category: m.category,
          categoryName: m.category,
        }));
        if (results.length > 0) {
          setSearchResults(results);
          return;
        }
      } catch {
        // Fall through to local search
      }

      // Local search fallback
      const search = searchTerm.toLowerCase();
      const results = [];
      Object.entries(allMacros).forEach(([catId, category]) => {
        category.macros.forEach((macro) => {
          if (
            macro.label.toLowerCase().includes(search) ||
            macro.text.toLowerCase().includes(search)
          ) {
            results.push({ ...macro, category: catId, categoryName: category.name });
          }
        });
      });
      setSearchResults(results.length > 0 ? results : []);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm, allMacros]);

  const handleInsert = useCallback(
    (macro) => {
      onInsert(macro.text, targetField);
      // Record usage in the background
      if (macro.id) {
        macrosAPI.recordUsage(macro.id).catch(() => {});
      }
    },
    [onInsert, targetField]
  );

  const toggleFavorite = useCallback(
    async (macroId) => {
      try {
        await macrosAPI.toggleFavorite(macroId);
        setFavorites((prev) =>
          prev.includes(macroId) ? prev.filter((id) => id !== macroId) : [...prev, macroId]
        );
      } catch {
        // Fall back to local toggle
        if (onFavoritesChange) {
          const newFavorites = favorites.includes(macroId)
            ? favorites.filter((id) => id !== macroId)
            : [...favorites, macroId];
          setFavorites(newFavorites);
          onFavoritesChange(newFavorites);
        }
      }
    },
    [favorites, onFavoritesChange]
  );

  const currentCategory = allMacros[activeCategory];
  const colors = COLOR_MAP[currentCategory?.color] || COLOR_MAP.blue;

  // Get favorite macros
  const favoriteMacros = useMemo(() => {
    const favs = [];
    Object.values(allMacros).forEach((category) => {
      category.macros.forEach((macro) => {
        if (favorites.includes(macro.id) || macro.isFavorite) {
          favs.push(macro);
        }
      });
    });
    return favs;
  }, [favorites, allMacros]);

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-8 flex items-center justify-center ${className}`}
      >
        <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-500">Loading macros...</span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Grid className="w-4 h-4" />
            Macro Matrix
          </h3>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search macros..."
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Customize */}
            {onCustomMacrosChange && (
              <button
                onClick={() => setShowCustomize(!showCustomize)}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className="p-4 border-b border-gray-200 bg-yellow-50">
          <p className="text-sm text-gray-600 mb-2">
            Found {searchResults.length} macros matching "{searchTerm}"
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((macro) => (
              <button
                key={macro.id}
                onClick={() => handleInsert(macro)}
                className="w-full text-left p-2 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{macro.label}</span>
                  <span className="text-xs text-gray-500">{macro.categoryName}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1 line-clamp-1">{macro.text}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Favorites Row */}
      {!searchResults && favoriteMacros.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-200 bg-amber-50">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />
            {favoriteMacros.map((macro) => (
              <button
                key={macro.id}
                onClick={() => handleInsert(macro)}
                className="px-3 py-1 text-xs font-medium bg-white border border-amber-200 rounded-full hover:bg-amber-100 whitespace-nowrap"
              >
                {macro.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      {!searchResults && (
        <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
          {Object.entries(allMacros).map(([catId, category]) => (
            <button
              key={catId}
              onClick={() => setActiveCategory(catId)}
              className={`
                flex items-center gap-1.5 px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${
                  activeCategory === catId
                    ? `border-${category.color}-600 text-${category.color}-700 bg-white`
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
              style={{
                borderBottomColor:
                  activeCategory === catId
                    ? COLOR_MAP[category.color]?.badge.replace('bg-', '')
                    : 'transparent',
              }}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
              <span className="text-xs text-gray-400">({category.macros.length})</span>
            </button>
          ))}
        </div>
      )}

      {/* Macro Grid/List */}
      {!searchResults && currentCategory && (
        <div className="p-4">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {currentCategory.macros.map((macro) => (
                <button
                  key={macro.id}
                  onClick={() => handleInsert(macro)}
                  className={`
                    relative p-2 text-center rounded-lg border transition-all group
                    ${colors.bg} ${colors.hover} ${colors.border}
                  `}
                  title={macro.text}
                >
                  <span className={`text-sm font-medium ${colors.text}`}>{macro.label}</span>
                  {/* Favorite toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(macro.id);
                    }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Star
                      className={`w-3 h-3 ${
                        favorites.includes(macro.id) || macro.isFavorite
                          ? 'text-amber-500 fill-current'
                          : 'text-gray-400'
                      }`}
                    />
                  </button>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {currentCategory.macros.map((macro) => (
                <button
                  key={macro.id}
                  onClick={() => handleInsert(macro)}
                  className={`
                    w-full text-left p-3 rounded-lg border transition-all group
                    ${colors.bg} ${colors.hover} ${colors.border}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${colors.text}`}>{macro.label}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(macro.id);
                      }}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          favorites.includes(macro.id) || macro.isFavorite
                            ? 'text-amber-500 fill-current'
                            : 'text-gray-300 group-hover:text-gray-400'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{macro.text}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact inline version
export function MacroMatrixInline({ onInsert, category = 'adjustments', maxItems = 8 }) {
  const macros = DEFAULT_MACROS[category]?.macros.slice(0, maxItems) || [];
  const colors = COLOR_MAP[DEFAULT_MACROS[category]?.color] || COLOR_MAP.blue;

  return (
    <div className="flex flex-wrap gap-1">
      {macros.map((macro) => (
        <button
          key={macro.id}
          onClick={() => onInsert(macro.text)}
          className={`
            px-2 py-1 text-xs font-medium rounded-lg border transition-colors
            ${colors.bg} ${colors.hover} ${colors.border} ${colors.text}
          `}
          title={macro.text}
        >
          {macro.label}
        </button>
      ))}
    </div>
  );
}

// Export default macros for customization
export { DEFAULT_MACROS };
