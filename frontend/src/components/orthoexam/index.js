/**
 * Ortho Exam Components Index
 * Compact orthopedic examination components
 */

export const OrthopedicExamCompact = ({ _patientId, _encounterId, _onDataChange }) => {
  return (
    <div className="p-3 border rounded-lg bg-white">
      <h4 className="text-md font-medium mb-2">Ortopedisk (kompakt)</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="text-gray-600">ROM: Innenfor normalomrade</div>
        <div className="text-gray-600">Provokasjonstester: Negative</div>
      </div>
    </div>
  );
};

export default OrthopedicExamCompact;
