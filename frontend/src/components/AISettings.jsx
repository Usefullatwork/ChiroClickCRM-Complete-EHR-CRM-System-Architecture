import { useState } from 'react'
import { Brain, Cpu, Zap, Settings, Check, AlertCircle } from 'lucide-react'

/**
 * AI Settings Component
 * Manages AI model configuration and preferences
 */
const AISettings = () => {
  const [selectedModel, setSelectedModel] = useState('chiro-no')
  const [autoSuggest, setAutoSuggest] = useState(true)
  const [language, setLanguage] = useState('norwegian')

  const models = [
    { id: 'chiro-no', name: 'ChiroClick Standard', description: 'Balansert modell for generell bruk', icon: Brain },
    { id: 'chiro-fast', name: 'ChiroClick Rask', description: 'Rask autofullføring og forslag', icon: Zap },
    { id: 'chiro-norwegian', name: 'ChiroClick Norsk', description: 'Optimalisert for norsk språk', icon: Settings },
    { id: 'chiro-medical', name: 'ChiroClick Medisinsk', description: 'Klinisk resonnering og diagnostikk', icon: Cpu },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          AI-modell
        </h3>

        <div className="space-y-3">
          {models.map((model) => {
            const Icon = model.icon
            return (
              <label
                key={model.id}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedModel === model.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="ai-model"
                  value={model.id}
                  checked={selectedModel === model.id}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="sr-only"
                />
                <Icon className={`h-5 w-5 mr-3 ${selectedModel === model.id ? 'text-purple-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{model.name}</div>
                  <div className="text-sm text-gray-500">{model.description}</div>
                </div>
                {selectedModel === model.id && (
                  <Check className="h-5 w-5 text-purple-600" />
                )}
              </label>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">AI-innstillinger</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Automatiske forslag</div>
              <div className="text-sm text-gray-500">AI foreslår tekst mens du skriver</div>
            </div>
            <button
              onClick={() => setAutoSuggest(!autoSuggest)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoSuggest ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoSuggest ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Språk</div>
              <div className="text-sm text-gray-500">Foretrukket språk for AI-svar</div>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            >
              <option value="norwegian">Norsk</option>
              <option value="english">English</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-yellow-800">Merknad om AI</div>
            <div className="text-sm text-yellow-700 mt-1">
              AI-assistenten er et hjelpemiddel og skal ikke erstatte klinisk vurdering.
              Alle AI-genererte forslag bør gjennomgås av behandler før bruk.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AISettings
