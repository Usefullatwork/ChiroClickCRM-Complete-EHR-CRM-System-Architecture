import { useState, useEffect } from 'react'
import { Calendar, Clock, User, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

/**
 * Scheduler Decisions Component
 * Shows pending scheduling decisions that need manual intervention
 */
const SchedulerDecisions = () => {
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(false)

  // Placeholder data - would normally fetch from API
  useEffect(() => {
    setDecisions([
      {
        id: 1,
        type: 'conflict',
        patient: 'Ola Nordmann',
        date: '2026-01-28',
        time: '10:00',
        issue: 'Dobbeltbooking oppdaget',
        options: ['Behold original', 'Flytt til 10:30', 'Kanseller']
      },
      {
        id: 2,
        type: 'reschedule',
        patient: 'Kari Hansen',
        date: '2026-01-29',
        time: '14:00',
        issue: 'Pasient forespør nytt tidspunkt',
        options: ['Godkjenn', 'Foreslå alternativ', 'Avslå']
      }
    ])
  }, [])

  const handleDecision = (id, action) => {
    setDecisions(prev => prev.filter(d => d.id !== id))
    // Would send decision to backend
  }

  if (decisions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-medium text-gray-900">Ventende beslutninger</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
          <p>Ingen ventende beslutninger</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-medium text-gray-900">Ventende beslutninger</h3>
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
            {decisions.length}
          </span>
        </div>
        <button
          onClick={() => setLoading(true)}
          className="text-gray-400 hover:text-gray-600"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        {decisions.map((decision) => (
          <div
            key={decision.id}
            className="border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{decision.patient}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{decision.date} kl. {decision.time}</span>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                decision.type === 'conflict'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {decision.type === 'conflict' ? 'Konflikt' : 'Forespørsel'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              {decision.issue}
            </div>

            <div className="flex gap-2">
              {decision.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDecision(decision.id, option)}
                  className={`text-sm px-3 py-1.5 rounded-md ${
                    idx === 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SchedulerDecisions
