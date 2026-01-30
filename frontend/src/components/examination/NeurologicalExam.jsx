/**
 * Neurological Exam Component
 * Full neurological examination panel
 */

import React from 'react';

const NeurologicalExam = ({ patientId, encounterId, onDataChange }) => {
  return (
    <div className="p-4 border rounded-lg bg-white">
      <h3 className="text-lg font-medium mb-4">Neurologisk undersokelse</h3>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Full neurologisk undersokelse - kommer snart.
        </p>
      </div>
    </div>
  );
};

export default NeurologicalExam;
