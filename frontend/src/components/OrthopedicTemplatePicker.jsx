/**
 * Orthopedic Template Picker
 * Comprehensive click-to-text template system for SOAP documentation
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { templatesAPI } from '../services/api';
import {
  Search,
  Star,
  Clock,
  ChevronRight,
  ChevronDown,
  X,
  Copy,
  BookOpen,
  Activity,
  Heart,
  Brain,
  Bone,
} from 'lucide-react';

const SOAP_SECTIONS = [
  { value: 'SUBJECTIVE', label: 'Subjektiv (S)', icon: <BookOpen size={16} /> },
  { value: 'OBJECTIVE', label: 'Objektiv (O)', icon: <Activity size={16} /> },
  { value: 'ASSESSMENT', label: 'Vurdering (A)', icon: <Brain size={16} /> },
  { value: 'PLAN', label: 'Plan (P)', icon: <Heart size={16} /> },
];

const BODY_REGIONS = [
  { value: 'cervical', label: 'Cervikalcolumna', icon: '🦴' },
  { value: 'thoracic', label: 'Thorakalcolumna', icon: '🦴' },
  { value: 'lumbar', label: 'Lumbalcolumna', icon: '🦴' },
  { value: 'shoulder', label: 'Skulder', icon: '💪' },
  { value: 'elbow', label: 'Albue', icon: '💪' },
  { value: 'wrist', label: 'Håndledd', icon: '✋' },
  { value: 'hip', label: 'Hofte', icon: '🦵' },
  { value: 'knee', label: 'Kne', icon: '🦵' },
  { value: 'ankle', label: 'Ankel', icon: '👣' },
];

export default function OrthopedicTemplatePicker({
  soapSection,
  onSelectTemplate,
  onClose,
  _currentField = null,
}) {
  const [activeTab, setActiveTab] = useState('templates'); // 'templates', 'tests', 'phrases', 'favorites'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBodyRegion, setSelectedBodyRegion] = useState(null);
  const [selectedTemplateType, _setSelectedTemplateType] = useState(null);

  // Fetch template categories
  const { data: categories } = useQuery({
    queryKey: ['template-categories', soapSection],
    queryFn: () => templatesAPI.getCategories({ soap_section: soapSection }),
  });

  // Fetch templates with filters
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: [
      'templates',
      selectedCategory,
      soapSection,
      selectedBodyRegion,
      searchQuery,
      selectedTemplateType,
      activeTab === 'favorites',
    ],
    queryFn: () =>
      templatesAPI.getAll({
        category_id: selectedCategory,
        soap_section: soapSection,
        body_region: selectedBodyRegion,
        template_type: selectedTemplateType,
        search: searchQuery,
        favorites_only: activeTab === 'favorites',
      }),
    enabled: activeTab === 'templates' || activeTab === 'favorites',
  });

  // Fetch orthopedic tests
  const { data: tests, isLoading: testsLoading } = useQuery({
    queryKey: ['orthopedic-tests', selectedBodyRegion, searchQuery],
    queryFn: () =>
      templatesAPI.getTestsLibrary({
        bodyRegion: selectedBodyRegion,
        search: searchQuery,
      }),
    enabled: activeTab === 'tests',
  });

  // Fetch phrases
  const { data: phrases, isLoading: phrasesLoading } = useQuery({
    queryKey: ['template-phrases', selectedBodyRegion, searchQuery],
    queryFn: () =>
      templatesAPI.getPhrases({
        body_region: selectedBodyRegion,
        search: searchQuery,
      }),
    enabled: activeTab === 'phrases',
  });

  // Fetch user preferences
  const { data: _userPrefs } = useQuery({
    queryKey: ['user-template-preferences'],
    queryFn: () => templatesAPI.getUserPreferences(),
  });

  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleTemplateClick = async (template) => {
    // Track usage
    await templatesAPI.trackUsage(template.id);

    // Parse template content and handle variables
    const content = template.content_no; // Using Norwegian by default

    // If template has variables, show a modal to fill them
    if (template.template_data?.variables && template.template_data.variables.length > 0) {
      // TODO: Show variable input modal
      // For now, just insert template with placeholder variables
    }

    // Call the parent's onSelectTemplate callback
    onSelectTemplate(content, template);

    // Close the picker
    onClose();
  };

  const handleTestClick = (test) => {
    const testText = `${test.test_name_no}: {{result}}`;
    onSelectTemplate(testText, test);
    onClose();
  };

  const handlePhraseClick = (phrase) => {
    onSelectTemplate(phrase.phrase_no, phrase);
    onClose();
  };

  const renderCategoryTree = (cats, level = 0) => {
    if (!cats) {
      return null;
    }

    return cats.map((cat) => (
      <div key={cat.id} className={`ml-${level * 4}`}>
        <div
          className={`flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer ${
            selectedCategory === cat.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          }`}
          onClick={() => {
            setSelectedCategory(cat.id);
            if (cat.children && cat.children.length > 0) {
              toggleCategory(cat.id);
            }
          }}
        >
          <div className="flex items-center gap-2">
            {cat.children &&
              cat.children.length > 0 &&
              (expandedCategories.has(cat.id) ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              ))}
            <span className="text-sm font-medium">{cat.name_no}</span>
            {cat.template_count > 0 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {cat.template_count}
              </span>
            )}
          </div>
        </div>

        {expandedCategories.has(cat.id) && cat.children && cat.children.length > 0 && (
          <div className="ml-4">{renderCategoryTree(cat.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  const renderTemplate = (template) => (
    <div
      key={template.id}
      className="border rounded-lg p-3 hover:border-blue-500 hover:shadow-sm cursor-pointer transition-all"
      onClick={() => handleTemplateClick(template)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{template.name_no}</h4>
            {template.template_type && (
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                {template.template_type}
              </span>
            )}
          </div>
          {template.category_name_no && (
            <p className="text-xs text-gray-500">{template.category_name_no}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {template.is_user_favorite && (
            <Star size={14} className="text-yellow-500 fill-yellow-500" />
          )}
          {template.usage_count > 10 && <Clock size={14} className="text-gray-400" />}
        </div>
      </div>

      <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded font-mono text-xs line-clamp-2">
        {template.content_no}
      </div>

      {template.keywords && template.keywords.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {template.keywords.slice(0, 3).map((keyword) => (
            <span key={keyword} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
              {keyword}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const renderTest = (test) => (
    <div
      key={test.code}
      className="border rounded-lg p-3 hover:border-green-500 hover:shadow-sm cursor-pointer transition-all"
      onClick={() => handleTestClick(test)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{test.test_name_no}</h4>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
              {test.test_category}
            </span>
          </div>
          {test.body_region && (
            <p className="text-xs text-gray-500 capitalize">{test.body_region}</p>
          )}
        </div>
        <Bone size={16} className="text-gray-400" />
      </div>

      {test.description_no && <p className="text-sm text-gray-600 mb-2">{test.description_no}</p>}

      {test.indicates_conditions && test.indicates_conditions.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {test.indicates_conditions.slice(0, 2).map((condition) => (
            <span
              key={condition}
              className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded"
            >
              {condition}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const renderPhrase = (phrase) => (
    <div
      key={phrase.id}
      className="border rounded-lg p-3 hover:border-purple-500 hover:shadow-sm cursor-pointer transition-all"
      onClick={() => handlePhraseClick(phrase)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 uppercase">{phrase.category}</span>
        <Copy size={14} className="text-gray-400" />
      </div>
      <p className="text-sm text-gray-700">{phrase.phrase_no}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Kliniske Maler</h2>
            <p className="text-sm text-gray-500">
              {soapSection ? `${SOAP_SECTIONS.find((s) => s.value === soapSection)?.label} - ` : ''}
              Velg mal for å sette inn tekst
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b flex">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'templates'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen size={16} className="inline mr-2" />
            Maler
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'tests'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bone size={16} className="inline mr-2" />
            Ortopediske Tester
          </button>
          <button
            onClick={() => setActiveTab('phrases')}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'phrases'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Copy size={16} className="inline mr-2" />
            Fraser
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === 'favorites'
                ? 'border-b-2 border-yellow-500 text-yellow-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Star size={16} className="inline mr-2" />
            Favoritter
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Søk maler, tester, fraser..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Body Region Filter */}
            <select
              value={selectedBodyRegion || ''}
              onChange={(e) => setSelectedBodyRegion(e.target.value || null)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Alle områder</option>
              {BODY_REGIONS.map((region) => (
                <option key={region.value} value={region.value}>
                  {region.icon} {region.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar - Categories (only for templates tab) */}
          {activeTab === 'templates' && categories && (
            <div className="w-64 border-r overflow-y-auto bg-gray-50">
              <div className="p-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Kategorier</h3>
                {renderCategoryTree(categories.data)}
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'templates' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templatesLoading ? (
                  <p className="text-gray-500 col-span-2 text-center py-8">Laster maler...</p>
                ) : templates?.data && templates.data.length > 0 ? (
                  templates.data.map(renderTemplate)
                ) : (
                  <p className="text-gray-500 col-span-2 text-center py-8">Ingen maler funnet</p>
                )}
              </div>
            )}

            {activeTab === 'tests' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {testsLoading ? (
                  <p className="text-gray-500 col-span-2 text-center py-8">Laster tester...</p>
                ) : tests?.data && tests.data.length > 0 ? (
                  tests.data.map(renderTest)
                ) : (
                  <p className="text-gray-500 col-span-2 text-center py-8">Ingen tester funnet</p>
                )}
              </div>
            )}

            {activeTab === 'phrases' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {phrasesLoading ? (
                  <p className="text-gray-500 col-span-3 text-center py-8">Laster fraser...</p>
                ) : phrases?.data && phrases.data.length > 0 ? (
                  phrases.data.map(renderPhrase)
                ) : (
                  <p className="text-gray-500 col-span-3 text-center py-8">Ingen fraser funnet</p>
                )}
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templatesLoading ? (
                  <p className="text-gray-500 col-span-2 text-center py-8">Laster favoritter...</p>
                ) : templates?.data && templates.data.length > 0 ? (
                  templates.data.map(renderTemplate)
                ) : (
                  <p className="text-gray-500 col-span-2 text-center py-8">
                    Ingen favoritter ennå. Klikk på stjerne-ikonet på en mal for å legge til
                    favoritter.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {activeTab === 'templates' &&
              templates?.pagination &&
              `Viser ${templates.data.length} av ${templates.pagination.total} maler`}
            {activeTab === 'tests' && tests?.data && `${tests.data.length} tester tilgjengelig`}
            {activeTab === 'phrases' &&
              phrases?.data &&
              `${phrases.data.length} fraser tilgjengelig`}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
}
