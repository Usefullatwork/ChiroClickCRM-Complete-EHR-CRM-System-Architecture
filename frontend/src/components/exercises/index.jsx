/**
 * Exercise Components Index
 * Components for exercise prescription and documentation
 */

export const ExercisePanel = ({ className = '', value, onChange, onAddExercise, ...props }) => {
  return (
    <div className={`p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg ${className}`} {...props}>
      <div className="text-sm text-gray-500 text-center">
        <span className="font-medium">ExercisePanel</span>
        <span className="block text-xs mt-1">Exercise prescription panel - under development</span>
      </div>
    </div>
  )
}

export default ExercisePanel
