import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesAPI } from '../services/api';
import { Search, Star, ChevronRight, ChevronDown, Copy, Heart, X } from 'lucide-react';

export default function TemplatePicker({ onSelectTemplate, _soapSection, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [_activeCategory, _setActiveCategory] = useState(null);

  // Fetch templates by category
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['templates-by-category'],
    queryFn: () => templatesAPI.getByCategory('NO'),
  });

  // Search templates
  const { data: searchResults } = useQuery({
    queryKey: ['templates-search', searchQuery],
    queryFn: () => templatesAPI.search(searchQuery, 'NO'),
    enabled: searchQuery.length > 2,
  });

  // Toggle favorite
  const toggleFavoriteMutation = useMutation({
    mutationFn: (templateId) => templatesAPI.toggleFavorite(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates-by-category']);
    },
  });

  const handleTemplateClick = async (template) => {
    // Increment usage count
    await templatesAPI.incrementUsage(template.id);

    // Pass template text to parent
    onSelectTemplate(template.text);

    // Invalidate queries to update usage counts
    queryClient.invalidateQueries(['templates-by-category']);
  };

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const renderTemplates = () => {
    if (searchQuery.length > 2 && searchResults?.data) {
      return (
        <div className="p-3 space-y-2">
          <p className="text-xs text-gray-500 mb-2">
            {searchResults.data.length} results for "{searchQuery}"
          </p>
          {searchResults.data.map((template) => (
            <div
              key={template.id}
              className="p-3 bg-gray-50 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors group"
              onClick={() => handleTemplateClick(template)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-900 truncate">
                      {template.template_name}
                    </span>
                    {template.is_favorite && (
                      <Heart className="w-3 h-3 text-red-500 fill-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{template.template_text}</p>
                  <span className="text-xs text-gray-400 mt-1 inline-block">
                    {template.category} • {template.subcategory}
                  </span>
                </div>
                <Copy className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!templatesData?.data) {
      return null;
    }

    return (
      <div className="divide-y divide-gray-200">
        {Object.entries(templatesData.data).map(([category, subcategories]) => (
          <div key={category}>
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900">{category}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {Object.values(subcategories).flat().length}
                </span>
                {expandedCategories[category] ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {expandedCategories[category] && (
              <div className="bg-gray-50">
                {Object.entries(subcategories).map(([subcategory, templates]) => (
                  <div key={subcategory} className="border-t border-gray-200">
                    <div className="px-4 py-2 bg-gray-100">
                      <span className="text-xs font-medium text-gray-700">{subcategory}</span>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className="px-4 py-2 hover:bg-white cursor-pointer transition-colors group relative"
                          onClick={() => handleTemplateClick(template)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-gray-900 truncate">
                                  {template.name}
                                </span>
                                {template.isFavorite && (
                                  <Heart className="w-3 h-3 text-red-500 fill-red-500 flex-shrink-0" />
                                )}
                                {template.usageCount > 10 && (
                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-2">{template.text}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavoriteMutation.mutate(template.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                              title="Toggle favorite"
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  template.isFavorite
                                    ? 'text-red-500 fill-red-500'
                                    : 'text-gray-400'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Kliniske Maler</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søk etter maler..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          renderTemplates()
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">Klikk på en mal for å sette inn teksten</p>
      </div>
    </div>
  );
}
