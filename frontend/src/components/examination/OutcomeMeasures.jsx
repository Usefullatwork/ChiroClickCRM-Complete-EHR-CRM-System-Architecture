/**
 * Outcome Measures Component
 * For tracking patient outcomes (NDI, ODI, PSFS, etc.)
 */

export const OutcomeMeasureSelector = ({ className = '', value, onChange, ...props }) => {
  return (
    <div className={`p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg ${className}`} {...props}>
      <div className="text-sm text-gray-500 text-center">
        <span className="font-medium">OutcomeMeasureSelector</span>
        <span className="block text-xs mt-1">Select outcome measures - under development</span>
      </div>
    </div>
  )
}

const OutcomeMeasures = ({ className = '', value, onChange, ...props }) => {
  return (
    <div className={`p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg ${className}`} {...props}>
      <div className="text-sm text-gray-500 text-center">
        <span className="font-medium">OutcomeMeasures</span>
        <span className="block text-xs mt-1">Outcome measures panel - under development</span>
      </div>
    </div>
  )
}

export default OutcomeMeasures
