import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Printer } from 'lucide-react'
import VNGModule, { getDefaultVNGData } from '../components/assessment/VNGModule'

export default function VNGAssessment() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [language, setLanguage] = useState('no')
  const [vngData, setVngData] = useState(getDefaultVNGData())
  const [isSaving, setIsSaving] = useState(false)

  // Mock patient data for demo
  const patient = patientId ? {
    id: patientId,
    name: 'Demo Pasient',
    dateOfBirth: '1985-03-15'
  } : null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // TODO: Implement actual save to backend
      console.log('Saving VNG data:', vngData)
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert(language === 'no' ? 'VNG-undersøkelse lagret!' : 'VNG assessment saved!')
    } catch (error) {
      console.error('Error saving VNG data:', error)
      alert(language === 'no' ? 'Feil ved lagring' : 'Error saving')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {language === 'no' ? 'VNG-undersøkelse' : 'VNG Assessment'}
              </h1>
              {patient && (
                <p className="text-sm text-gray-500">{patient.name}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setLanguage('no')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  language === 'no'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Norsk
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  language === 'en'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                English
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              {language === 'no' ? 'Skriv ut' : 'Print'}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving
                ? (language === 'no' ? 'Lagrer...' : 'Saving...')
                : (language === 'no' ? 'Lagre' : 'Save')}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-6">
        <VNGModule
          data={vngData}
          onChange={setVngData}
          language={language}
          patientId={patientId}
        />
      </div>
    </div>
  )
}
