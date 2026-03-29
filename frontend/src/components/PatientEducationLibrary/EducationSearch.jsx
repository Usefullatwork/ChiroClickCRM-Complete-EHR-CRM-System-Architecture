/**
 * EducationSearch - Search and category filter bar
 * Sub-component of PatientEducationLibrary
 */

export default function EducationSearch({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
}) {
  return (
    <div className="search-filter-bar">
      <input
        type="text"
        className="search-input"
        placeholder="Search education materials..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="category-filters">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'all' ? 'All Categories' : cat}
          </button>
        ))}
      </div>
    </div>
  );
}
