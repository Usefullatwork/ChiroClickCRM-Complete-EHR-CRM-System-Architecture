/**
 * EducationCategoryNav - Material grid and no-results placeholder
 * Sub-component of PatientEducationLibrary
 */

import EducationCard from './EducationCard';

export default function EducationCategoryNav({ filteredMaterials, onSelectMaterial }) {
  if (filteredMaterials.length === 0) {
    return (
      <div className="no-results">
        <h3>Ingen materialer funnet</h3>
        <p>Prov a justere soket eller filtrene</p>
      </div>
    );
  }

  return (
    <div className="materials-grid">
      {filteredMaterials.map((material) => (
        <EducationCard key={material.id} material={material} onClick={onSelectMaterial} />
      ))}
    </div>
  );
}
