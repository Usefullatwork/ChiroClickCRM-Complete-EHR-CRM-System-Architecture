/**
 * MacroMatrix Component
 * Hot button grid for rapid clinical text insertion
 * Target: <100ms insertion time
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * Single Macro Button
 */
const MacroButton = React.memo(({ macro, onInsert, isLoading }) => {
  const handleClick = useCallback(() => {
    const startTime = performance.now();
    onInsert(macro);
    const insertTime = performance.now() - startTime;

    // Log if insertion exceeds target
    if (insertTime > 100) {
      console.warn(`Macro insertion exceeded 100ms target: ${insertTime.toFixed(2)}ms`);
    }
  }, [macro, onInsert]);

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        p-2 text-sm text-left rounded-lg border transition-all duration-100
        ${macro.isFavorite ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white'}
        hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm
        active:bg-blue-100 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-400
      `}
      title={macro.text}
    >
      <div className="font-medium truncate">{macro.name}</div>
      {macro.shortcutKey && <div className="text-xs text-gray-400 mt-0.5">{macro.shortcutKey}</div>}
    </button>
  );
});

MacroButton.displayName = 'MacroButton';

/**
 * Category Section
 */
const CategorySection = ({ category, macros, subcategories, onInsert, isCollapsed, onToggle }) => {
  return (
    <div className="border rounded-lg bg-white shadow-sm">
      {/* Category Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-2 flex items-center justify-between bg-gray-50 rounded-t-lg hover:bg-gray-100"
      >
        <span className="font-medium text-gray-700">{category}</span>
        <span className={`transform transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>
          ▼
        </span>
      </button>

      {/* Macros Grid */}
      {!isCollapsed && (
        <div className="p-3">
          {/* Top-level macros */}
          {macros.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
              {macros.map((macro) => (
                <MacroButton key={macro.id} macro={macro} onInsert={onInsert} />
              ))}
            </div>
          )}

          {/* Subcategories */}
          {Object.entries(subcategories).map(([subName, subMacros]) => (
            <div key={subName} className="mb-3">
              <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                {subName}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {subMacros.map((macro) => (
                  <MacroButton key={macro.id} macro={macro} onInsert={onInsert} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Favorites Bar
 */
const FavoritesBar = ({ favorites, onInsert }) => {
  if (!favorites || favorites.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-yellow-500">⭐</span>
        <span className="text-sm font-medium text-yellow-700">Favoritter</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {favorites.map((macro) => (
          <button
            key={macro.id}
            onClick={() => onInsert(macro)}
            className="px-3 py-1.5 text-sm bg-white border border-yellow-300 rounded-full
                       hover:bg-yellow-100 transition-colors"
          >
            {macro.macro_name || macro.name}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Search Bar
 */
const SearchBar = ({ value, onChange, onClear }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeydown = (e) => {
      // Ctrl/Cmd + M to focus macro search
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  return (
    <div className="relative mb-4">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Søk i makroer... (Ctrl+M)"
        className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  );
};

/**
 * SOAP Section Filter
 */
const SectionFilter = ({ activeSection, onChange }) => {
  const sections = [
    { id: null, label: 'Alle', icon: '📋' },
    { id: 'subjective', label: 'S', icon: '💬' },
    { id: 'objective', label: 'O', icon: '🔍' },
    { id: 'assessment', label: 'A', icon: '💭' },
    { id: 'plan', label: 'P', icon: '📝' },
  ];

  return (
    <div className="flex gap-1 mb-4">
      {sections.map((section) => (
        <button
          key={section.id || 'all'}
          onClick={() => onChange(section.id)}
          className={`
            px-3 py-1.5 text-sm rounded-lg transition-colors
            ${
              activeSection === section.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          {section.icon} {section.label}
        </button>
      ))}
    </div>
  );
};

/**
 * Main MacroMatrix Component
 */
export const MacroMatrix = ({
  macros,
  favorites,
  onInsert,
  onLoadMore,
  isLoading,
  _targetRef, // Reference to text input/textarea to insert into
  context, // Patient/encounter context for variable substitution
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Filter macros based on search and section
  const filteredMacros = useMemo(() => {
    if (!macros) {
      return {};
    }

    const filtered = {};

    Object.entries(macros).forEach(([categoryName, category]) => {
      const categoryMacros = [...category.macros];
      const categorySubcategories = { ...category.subcategories };

      // Apply filters
      Object.keys(categorySubcategories).forEach((subName) => {
        categorySubcategories[subName] = categorySubcategories[subName].filter((macro) => {
          const matchesSearch =
            !searchTerm ||
            macro.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            macro.text.toLowerCase().includes(searchTerm.toLowerCase());

          const matchesSection = !activeSection || macro.soapSection === activeSection;

          return matchesSearch && matchesSection;
        });

        // Remove empty subcategories
        if (categorySubcategories[subName].length === 0) {
          delete categorySubcategories[subName];
        }
      });

      const filteredTopLevel = categoryMacros.filter((macro) => {
        const matchesSearch =
          !searchTerm ||
          macro.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          macro.text.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSection = !activeSection || macro.soapSection === activeSection;

        return matchesSearch && matchesSection;
      });

      // Only include category if it has macros
      if (filteredTopLevel.length > 0 || Object.keys(categorySubcategories).length > 0) {
        filtered[categoryName] = {
          ...category,
          macros: filteredTopLevel,
          subcategories: categorySubcategories,
        };
      }
    });

    return filtered;
  }, [macros, searchTerm, activeSection]);

  // Handle macro insertion
  const handleInsert = useCallback(
    (macro) => {
      onInsert(macro, context);

      // Update usage count
      if (onLoadMore) {
        // This could trigger a background API call to record usage
      }
    },
    [onInsert, context, onLoadMore]
  );

  // Toggle category collapse
  const toggleCategory = useCallback((categoryName) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="animate-spin text-2xl mb-2">⏳</div>
        Laster makroer...
      </div>
    );
  }

  return (
    <div className="macro-matrix">
      {/* Search */}
      <SearchBar value={searchTerm} onChange={setSearchTerm} onClear={() => setSearchTerm('')} />

      {/* Section Filter */}
      <SectionFilter activeSection={activeSection} onChange={setActiveSection} />

      {/* Favorites */}
      <FavoritesBar favorites={favorites} onInsert={handleInsert} />

      {/* Categories */}
      <div className="space-y-3">
        {Object.entries(filteredMacros).map(([categoryName, category]) => (
          <CategorySection
            key={categoryName}
            category={categoryName}
            macros={category.macros}
            subcategories={category.subcategories}
            onInsert={handleInsert}
            isCollapsed={collapsedCategories[categoryName]}
            onToggle={() => toggleCategory(categoryName)}
          />
        ))}
      </div>

      {/* Empty state */}
      {Object.keys(filteredMacros).length === 0 && (
        <div className="p-8 text-center text-gray-500">
          {searchTerm || activeSection ? (
            <>
              <div className="text-2xl mb-2">🔍</div>
              Ingen makroer funnet.
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActiveSection(null);
                }}
                className="block mx-auto mt-2 text-blue-600 hover:underline"
              >
                Nullstill filter
              </button>
            </>
          ) : (
            <>
              <div className="text-2xl mb-2">📝</div>
              Ingen makroer tilgjengelig.
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MacroMatrix;
