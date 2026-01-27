/**
 * Neurological Examination Component
 * Placeholder for full neurological exam documentation
 */

const NeurologicalExam = ({ className = '', value, onChange, ...props }) => {
  return (
    <div className={`p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg ${className}`} {...props}>
      <div className="text-sm text-gray-500 text-center">
        <span className="font-medium">NeurologicalExam</span>
        <span className="block text-xs mt-1">Full neurological examination panel - under development</span>
      </div>
    </div>
  )
}

export default NeurologicalExam
