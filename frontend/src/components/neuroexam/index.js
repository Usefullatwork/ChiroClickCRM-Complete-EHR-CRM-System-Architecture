/**
 * Neuro Exam Components Index
 * Compact neurological examination components
 */

export const NeurologicalExamCompact = ({ _patientId, _encounterId, _onDataChange }) => {
  return (
    <div className="p-3 border rounded-lg bg-white">
      <h4 className="text-md font-medium mb-2">Neuro (kompakt)</h4>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="text-gray-600 dark:text-gray-300">Reflekser: Normal</div>
        <div className="text-gray-600 dark:text-gray-300">Sensibilitet: Normal</div>
        <div className="text-gray-600 dark:text-gray-300">Motorikk: Normal</div>
      </div>
    </div>
  );
};

export default NeurologicalExamCompact;
