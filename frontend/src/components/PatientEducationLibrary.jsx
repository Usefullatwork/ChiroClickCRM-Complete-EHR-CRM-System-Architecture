import { useState } from 'react';

/**
 * Patient Education Library Component (Orchestrator)
 * Sub-components: EducationSearch, EducationCategoryNav, EducationViewer
 */

import { educationMaterials } from './PatientEducationLibrary/educationData';
import { educationLibraryStyles } from './PatientEducationLibrary/styles';
import EducationSearch from './PatientEducationLibrary/EducationSearch';
import EducationCategoryNav from './PatientEducationLibrary/EducationCategoryNav';
import EducationViewer from './PatientEducationLibrary/EducationViewer';

const PatientEducationLibrary = ({ _onSelectMaterial, onSendToPatient }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['all', ...new Set(educationMaterials.map((m) => m.category))];

  const filteredMaterials = educationMaterials.filter((material) => {
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    const matchesSearch =
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="education-library">
      <style>{educationLibraryStyles}</style>

      <div className="library-header">
        <h1>Patient Education Library</h1>
        <p>Evidence-based information to help patients understand and manage their conditions</p>
      </div>

      {!selectedMaterial ? (
        <>
          <EducationSearch
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
          />
          <EducationCategoryNav
            filteredMaterials={filteredMaterials}
            onSelectMaterial={setSelectedMaterial}
          />
        </>
      ) : (
        <EducationViewer
          material={selectedMaterial}
          onBack={() => setSelectedMaterial(null)}
          onSendToPatient={onSendToPatient}
        />
      )}
    </div>
  );
};

export default PatientEducationLibrary;
