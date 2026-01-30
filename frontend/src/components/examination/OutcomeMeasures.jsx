/**
 * Outcome Measures Component
 * Patient outcome questionnaires and tracking
 */

import React from 'react';

export const OutcomeMeasureSelector = ({ onSelect, selectedMeasures = [] }) => {
  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h4 className="text-md font-medium mb-2">Velg utfallsmal</h4>
      <p className="text-sm text-gray-600">
        Utfallsmal-velger kommer snart.
      </p>
    </div>
  );
};

const OutcomeMeasures = ({ patientId, encounterId, onDataChange }) => {
  return (
    <div className="p-4 border rounded-lg bg-white">
      <h3 className="text-lg font-medium mb-4">Utfallsmal</h3>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          NDI, ODI, FABQ og andre utfallsmal - kommer snart.
        </p>
      </div>
    </div>
  );
};

export default OutcomeMeasures;
