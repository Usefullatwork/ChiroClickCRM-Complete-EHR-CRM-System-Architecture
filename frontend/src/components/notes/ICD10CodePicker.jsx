/**
 * ICD10CodePicker Component
 * Sokbar ICD-10 kodevelger med vanlige kiropraktorkoder
 *
 * Searchable ICD-10 code picker with common chiropractic codes
 */

import { useState, useEffect, useMemo } from 'react';
import { Search, X, ChevronDown, ChevronRight, Star, Clock, CheckCircle } from 'lucide-react';

/**
 * Common ICD-10 codes for chiropractic practice
 * Vanlige ICD-10 koder for kiropraktisk praksis
 */
const ICD10_CODES = {
  // Rygglidelser / Spinal disorders
  spine: {
    label: 'Rygglidelser',
    codes: [
      { code: 'M54.2', description: 'Cervikalgi', descriptionNo: 'Nakkesmerter' },
      { code: 'M54.5', description: 'Low back pain', descriptionNo: 'Korsryggsmerter' },
      {
        code: 'M54.6',
        description: 'Pain in thoracic spine',
        descriptionNo: 'Smerter i thorakalcolumna',
      },
      { code: 'M54.4', description: 'Lumbago with sciatica', descriptionNo: 'Lumbago med isjias' },
      { code: 'M54.1', description: 'Radiculopathy', descriptionNo: 'Radikulopati' },
      { code: 'M54.3', description: 'Sciatica', descriptionNo: 'Isjias' },
      { code: 'M47.8', description: 'Other spondylosis', descriptionNo: 'Annen spondylose' },
      {
        code: 'M47.9',
        description: 'Spondylosis, unspecified',
        descriptionNo: 'Spondylose, uspesifisert',
      },
      {
        code: 'M51.1',
        description: 'Lumbar disc disorder with radiculopathy',
        descriptionNo: 'Lumbal skivesykdom med radikulopati',
      },
      {
        code: 'M51.2',
        description: 'Other specified intervertebral disc displacement',
        descriptionNo: 'Annen spesifisert mellomvirvelskiveforskyvning',
      },
      {
        code: 'M53.1',
        description: 'Cervicobrachial syndrome',
        descriptionNo: 'Cervikobrakialt syndrom',
      },
      {
        code: 'M53.3',
        description: 'Sacrococcygeal disorders',
        descriptionNo: 'Lidelser i sacrococcygealregionen',
      },
      { code: 'M48.0', description: 'Spinal stenosis', descriptionNo: 'Spinal stenose' },
      {
        code: 'M50.1',
        description: 'Cervical disc disorder with radiculopathy',
        descriptionNo: 'Cervikal skivesykdom med radikulopati',
      },
      {
        code: 'M50.2',
        description: 'Other cervical disc displacement',
        descriptionNo: 'Annen cervikal skiveforskyvning',
      },
      { code: 'M43.1', description: 'Spondylolisthesis', descriptionNo: 'Spondylolistese' },
    ],
  },
  // Hodepine / Headache
  headache: {
    label: 'Hodepine',
    codes: [
      { code: 'G44.2', description: 'Tension-type headache', descriptionNo: 'Spenningshodepine' },
      {
        code: 'G43.9',
        description: 'Migraine, unspecified',
        descriptionNo: 'Migrene, uspesifisert',
      },
      { code: 'G44.0', description: 'Cluster headache syndrome', descriptionNo: 'Klasehodepine' },
      {
        code: 'M53.0',
        description: 'Cervicocranial syndrome',
        descriptionNo: 'Cervikokranialt syndrom',
      },
      { code: 'R51', description: 'Headache', descriptionNo: 'Hodepine' },
    ],
  },
  // Skulder / Shoulder
  shoulder: {
    label: 'Skulder',
    codes: [
      {
        code: 'M75.1',
        description: 'Rotator cuff syndrome',
        descriptionNo: 'Rotatormansjett-syndrom',
      },
      {
        code: 'M75.0',
        description: 'Adhesive capsulitis of shoulder',
        descriptionNo: 'Frossen skulder',
      },
      { code: 'M75.2', description: 'Bicipital tendinitis', descriptionNo: 'Bicepstendinitt' },
      {
        code: 'M75.3',
        description: 'Calcific tendinitis of shoulder',
        descriptionNo: 'Kalktendinitt i skulder',
      },
      {
        code: 'M75.4',
        description: 'Impingement syndrome of shoulder',
        descriptionNo: 'Impingement-syndrom i skulder',
      },
      { code: 'M75.5', description: 'Bursitis of shoulder', descriptionNo: 'Bursitt i skulder' },
      { code: 'M25.51', description: 'Pain in shoulder', descriptionNo: 'Smerter i skulder' },
    ],
  },
  // Hofte og bekken / Hip and pelvis
  hip: {
    label: 'Hofte og bekken',
    codes: [
      { code: 'M25.55', description: 'Pain in hip', descriptionNo: 'Smerter i hofte' },
      { code: 'M70.6', description: 'Trochanteric bursitis', descriptionNo: 'Trokanteritt' },
      { code: 'M76.1', description: 'Psoas tendinitis', descriptionNo: 'Psoastendinitt' },
      { code: 'M53.2', description: 'Spinal instabilities', descriptionNo: 'Spinal instabilitet' },
      { code: 'M53.86', description: 'SI-joint dysfunction', descriptionNo: 'SI-ledd dysfunksjon' },
    ],
  },
  // Kne / Knee
  knee: {
    label: 'Kne',
    codes: [
      { code: 'M25.56', description: 'Pain in knee', descriptionNo: 'Smerter i kne' },
      { code: 'M76.5', description: 'Patellar tendinitis', descriptionNo: 'Patellartendinitt' },
      {
        code: 'M22.2',
        description: 'Patellofemoral disorders',
        descriptionNo: 'Patellofemoralt syndrom',
      },
      { code: 'M70.4', description: 'Prepatellar bursitis', descriptionNo: 'Prepatellar bursitt' },
      {
        code: 'M23.5',
        description: 'Chronic instability of knee',
        descriptionNo: 'Kronisk kneinstabilitet',
      },
    ],
  },
  // Albue og handledd / Elbow and wrist
  elbow: {
    label: 'Albue og handledd',
    codes: [
      { code: 'M77.1', description: 'Lateral epicondylitis', descriptionNo: 'Tennisalbue' },
      { code: 'M77.0', description: 'Medial epicondylitis', descriptionNo: 'Golferalbue' },
      {
        code: 'G56.0',
        description: 'Carpal tunnel syndrome',
        descriptionNo: 'Karpaltunnelsyndrom',
      },
      { code: 'M25.53', description: 'Pain in wrist', descriptionNo: 'Smerter i handledd' },
      {
        code: 'M65.4',
        description: 'Radial styloid tenosynovitis',
        descriptionNo: 'De Quervains tendinose',
      },
    ],
  },
  // Ankel og fot / Ankle and foot
  ankle: {
    label: 'Ankel og fot',
    codes: [
      {
        code: 'M25.57',
        description: 'Pain in ankle and joints of foot',
        descriptionNo: 'Smerter i ankel og fotledd',
      },
      { code: 'M77.3', description: 'Calcaneal spur', descriptionNo: 'Helespore' },
      { code: 'M72.2', description: 'Plantar fasciitis', descriptionNo: 'Plantar fascitt' },
      { code: 'M76.6', description: 'Achilles tendinitis', descriptionNo: 'Akillestendinitt' },
    ],
  },
  // Myalgi og muskelsmerter / Myalgia and muscle pain
  muscle: {
    label: 'Muskelsmerter',
    codes: [
      { code: 'M79.1', description: 'Myalgia', descriptionNo: 'Myalgi' },
      { code: 'M79.3', description: 'Panniculitis, unspecified', descriptionNo: 'Panniculitt' },
      { code: 'M62.83', description: 'Muscle spasm', descriptionNo: 'Muskelspasme' },
      { code: 'M79.7', description: 'Fibromyalgia', descriptionNo: 'Fibromyalgi' },
      {
        code: 'M60.9',
        description: 'Myositis, unspecified',
        descriptionNo: 'Myositt, uspesifisert',
      },
    ],
  },
  // Svimmelhet / Dizziness
  vestibular: {
    label: 'Svimmelhet og balanse',
    codes: [
      { code: 'H81.1', description: 'BPPV', descriptionNo: 'Benign paroksysmal posisjonsvertigo' },
      { code: 'R42', description: 'Dizziness and giddiness', descriptionNo: 'Svimmelhet' },
      {
        code: 'H81.3',
        description: 'Other peripheral vertigo',
        descriptionNo: 'Annen perifer vertigo',
      },
      {
        code: 'H81.9',
        description: 'Vestibular function disorder',
        descriptionNo: 'Vestibular funksjonforstyrrelse',
      },
      { code: 'R26.2', description: 'Difficulty in walking', descriptionNo: 'Gangvansker' },
    ],
  },
  // Skader / Injuries
  trauma: {
    label: 'Skader og traumer',
    codes: [
      {
        code: 'S13.4',
        description: 'Sprain of cervical spine',
        descriptionNo: 'Forstuvning av nakke (whiplash)',
      },
      {
        code: 'S33.5',
        description: 'Sprain of lumbar spine',
        descriptionNo: 'Forstuvning av lumbalcolumna',
      },
      {
        code: 'S33.6',
        description: 'Sprain of sacroiliac joint',
        descriptionNo: 'Forstuvning av SI-ledd',
      },
      {
        code: 'S43.4',
        description: 'Sprain of shoulder joint',
        descriptionNo: 'Forstuvning av skulder',
      },
      { code: 'S93.4', description: 'Sprain of ankle', descriptionNo: 'Ankelforstuvning' },
    ],
  },
};

/**
 * ICD10CodePicker Component
 * Modal for valg av ICD-10 diagnosekoder
 *
 * @param {Object} props - Component props
 * @param {Function} props.onSelect - Callback when code is selected
 * @param {Function} props.onClose - Callback when picker is closed
 * @param {Array} props.selectedCodes - Already selected codes
 * @returns {JSX.Element} ICD-10 code picker modal
 */
export default function ICD10CodePicker({ onSelect, onClose, selectedCodes = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(['spine']);
  const [recentCodes, setRecentCodes] = useState([]);
  const [favoriteCodes, setFavoriteCodes] = useState([]);

  // Load recent and favorite codes from localStorage
  useEffect(() => {
    try {
      const recent = JSON.parse(localStorage.getItem('recentICD10Codes') || '[]');
      const favorites = JSON.parse(localStorage.getItem('favoriteICD10Codes') || '[]');
      setRecentCodes(recent);
      setFavoriteCodes(favorites);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  /**
   * Filter codes based on search term
   * Filtrer koder basert pa sokord
   */
  const filteredCodes = useMemo(() => {
    if (!searchTerm) {
      return null;
    }

    const term = searchTerm.toLowerCase();
    const results = [];

    Object.entries(ICD10_CODES).forEach(([category, { codes }]) => {
      codes.forEach((code) => {
        if (
          code.code.toLowerCase().includes(term) ||
          code.description.toLowerCase().includes(term) ||
          code.descriptionNo.toLowerCase().includes(term)
        ) {
          results.push({ ...code, category });
        }
      });
    });

    return results;
  }, [searchTerm]);

  /**
   * Toggle category expansion
   * Veksle kategoriutvidelse
   */
  const toggleCategory = (category) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  /**
   * Handle code selection
   * Handter kodevalg
   */
  const handleSelect = (code) => {
    // Add to recent codes
    const updatedRecent = [code, ...recentCodes.filter((c) => c.code !== code.code)].slice(0, 10);
    setRecentCodes(updatedRecent);
    localStorage.setItem('recentICD10Codes', JSON.stringify(updatedRecent));

    onSelect(code);
  };

  /**
   * Toggle favorite status
   * Veksle favorittstatus
   */
  const toggleFavorite = (code, e) => {
    e.stopPropagation();
    const isFavorite = favoriteCodes.some((c) => c.code === code.code);
    const updatedFavorites = isFavorite
      ? favoriteCodes.filter((c) => c.code !== code.code)
      : [...favoriteCodes, code];

    setFavoriteCodes(updatedFavorites);
    localStorage.setItem('favoriteICD10Codes', JSON.stringify(updatedFavorites));
  };

  /**
   * Check if code is selected
   * Sjekk om kode er valgt
   */
  const isSelected = (code) => selectedCodes.includes(code.code);

  /**
   * Check if code is favorite
   * Sjekk om kode er favoritt
   */
  const isFavorite = (code) => favoriteCodes.some((c) => c.code === code.code);

  /**
   * Code item component
   * Kodeelement-komponent
   */
  const CodeItem = ({ code }) => (
    <button
      onClick={() => handleSelect(code)}
      disabled={isSelected(code)}
      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
        isSelected(code)
          ? 'bg-green-50 border-green-200 cursor-default'
          : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium text-blue-600">{code.code}</span>
          {isSelected(code) && <CheckCircle className="w-4 h-4 text-green-500" />}
        </div>
        <p className="text-sm text-gray-900">{code.descriptionNo}</p>
        <p className="text-xs text-gray-500">{code.description}</p>
      </div>
      <button onClick={(e) => toggleFavorite(code, e)} className="p-1 hover:bg-gray-100 rounded">
        <Star
          className={`w-4 h-4 ${isFavorite(code) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
        />
      </button>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header / Overskrift */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Velg ICD-10 kode</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Search / Sok */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Sok etter kode eller beskrivelse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Content / Innhold */}
        <div className="flex-1 overflow-y-auto p-4">
          {searchTerm ? (
            /* Search Results / Sokeresultater */
            <div className="space-y-2">
              {filteredCodes && filteredCodes.length > 0 ? (
                filteredCodes.map((code) => <CodeItem key={code.code} code={code} />)
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Ingen koder funnet for "{searchTerm}"
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Favorites / Favoritter */}
              {favoriteCodes.length > 0 && (
                <div className="mb-6">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Favoritter
                  </h4>
                  <div className="space-y-2">
                    {favoriteCodes.map((code) => (
                      <CodeItem key={code.code} code={code} />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent / Nylig brukt */}
              {recentCodes.length > 0 && (
                <div className="mb-6">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    Nylig brukt
                  </h4>
                  <div className="space-y-2">
                    {recentCodes.slice(0, 5).map((code) => (
                      <CodeItem key={code.code} code={code} />
                    ))}
                  </div>
                </div>
              )}

              {/* Categories / Kategorier */}
              <div className="space-y-2">
                {Object.entries(ICD10_CODES).map(([key, { label, codes }]) => (
                  <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(key)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{codes.length} koder</span>
                        {expandedCategories.includes(key) ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>
                    {expandedCategories.includes(key) && (
                      <div className="p-2 space-y-2 bg-white">
                        {codes.map((code) => (
                          <CodeItem key={code.code} code={code} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer / Bunntekst */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {selectedCodes.length} kode{selectedCodes.length !== 1 && 'r'} valgt
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Ferdig
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
