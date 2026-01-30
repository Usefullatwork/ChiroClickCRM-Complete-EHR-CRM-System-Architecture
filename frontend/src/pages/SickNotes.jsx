import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, FileText, Search, Filter, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import SickNoteGenerator, { getDefaultSickNoteData } from '../components/documents/SickNoteGenerator'
import { lettersApi } from '../api/letters'

export default function SickNotes() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [language, setLanguage] = useState('no')
  const [view, setView] = useState(searchParams.get('new') ? 'create' : 'list')
  const [sickNoteData, setSickNoteData] = useState(getDefaultSickNoteData())
  const [searchTerm, setSearchTerm] = useState('')

  // API states
  const [sickNotes, setSickNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [generating, setGenerating] = useState(false)

  // Mock patient data (would come from patient context in real app)
  const patient = patientId ? {
    id: patientId,
    name: 'Demo Pasient',
    dateOfBirth: '1985-03-15',
    personalNumber: '15038512345',
    address: 'Testveien 1, 0123 Oslo'
  } : null

  // Fetch sick notes from API
  const fetchSickNotes = async () => {
    try {
      setLoading(true)
      setError(null)

      if (patientId) {
        // Fetch for specific patient
        const response = await lettersApi.getPatientLetters(patientId, { type: 'SICK_NOTE' })
        setSickNotes(response.letters || [])
      } else {
        // For now, show empty - in real app would fetch all org's sick notes
        setSickNotes([])
      }
    } catch (err) {
      console.error('Failed to fetch sick notes:', err)
      setError(language === 'no' ? 'Kunne ikke laste sykemeldinger' : 'Failed to load sick notes')
      // Fall back to empty array
      setSickNotes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSickNotes()
  }, [patientId])

  // Auto-populate patient data when creating new
  useEffect(() => {
    if (patient && view === 'create') {
      setSickNoteData(prev => ({
        ...prev,
        patientName: patient.name,
        patientDOB: patient.dateOfBirth,
        patientPersonalNumber: patient.personalNumber || '',
        patientAddress: patient.address || ''
      }))
    }
  }, [patient, view])

  // Generate letter content with AI
  const handleGenerateWithAI = async () => {
    try {
      setGenerating(true)
      setError(null)

      const response = await lettersApi.generateLetter('SICK_NOTE', {
        patientId,
        patientData: patient,
        currentData: sickNoteData
      })

      if (response.letter) {
        setSickNoteData(prev => ({
          ...prev,
          ...response.letter
        }))
      }
    } catch (err) {
      console.error('AI generation failed:', err)
      setError(language === 'no' ? 'AI-generering feilet' : 'AI generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async (data) => {
    try {
      setSaving(true)
      setError(null)

      await lettersApi.saveLetter({
        letterType: 'SICK_NOTE',
        patientId,
        content: data,
        status: 'DRAFT'
      })

      alert(language === 'no' ? 'Sykemelding lagret!' : 'Sick note saved!')
      setView('list')
      fetchSickNotes() // Refresh list
    } catch (err) {
      console.error('Save failed:', err)
      setError(language === 'no' ? 'Kunne ikke lagre sykemelding' : 'Failed to save sick note')
    } finally {
      setSaving(false)
    }
  }

  const filteredNotes = sickNotes.filter(note => {
    const patientName = note.patient_name || note.patientName || ''
    const diagnosis = note.diagnosis || ''
    return patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (view === 'create') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('list')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {language === 'no' ? 'Ny sykemelding' : 'New Sick Note'}
                </h1>
                {patient && (
                  <p className="text-sm text-gray-500">{patient.name}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* AI Generate Button */}
              <button
                onClick={handleGenerateWithAI}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {language === 'no' ? 'Generer med AI' : 'Generate with AI'}
              </button>

              {/* Language toggle */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLanguage('no')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    language === 'no' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Norsk
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    language === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Generator */}
        <div className="p-6">
          <SickNoteGenerator
            data={sickNoteData}
            onChange={setSickNoteData}
            onSave={handleSave}
            language={language}
            patientId={patientId}
            saving={saving}
          />
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {patientId && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {language === 'no' ? 'Sykemeldinger' : 'Sick Notes'}
              </h1>
              <p className="text-sm text-gray-500">
                {language === 'no' ? 'NAV-kompatible sykemeldinger' : 'NAV-compliant sick notes'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setLanguage('no')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  language === 'no' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Norsk
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  language === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                English
              </button>
            </div>

            <button
              onClick={() => setView('create')}
              className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {language === 'no' ? 'Ny sykemelding' : 'New Sick Note'}
            </button>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchSickNotes}
            className="ml-auto text-red-700 hover:text-red-800 underline text-sm"
          >
            {language === 'no' ? 'Prøv igjen' : 'Try again'}
          </button>
        </div>
      )}

      {/* Search and filter */}
      <div className="px-6 py-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'no' ? 'Søk etter pasient eller diagnose...' : 'Search by patient or diagnosis...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            {language === 'no' ? 'Filter' : 'Filter'}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="px-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-500">
                {language === 'no' ? 'Laster...' : 'Loading...'}
              </span>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'no' ? 'Pasient' : 'Patient'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'no' ? 'Diagnose' : 'Diagnosis'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'no' ? 'Periode' : 'Period'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'no' ? 'Grad' : 'Grade'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'no' ? 'Status' : 'Status'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNotes.map((note) => (
                  <tr key={note.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900">
                          {note.patient_name || note.patientName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {note.diagnosis || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {note.date_from || note.dateFrom} - {note.date_to || note.dateTo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {note.grad_percent || note.gradPercent}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        note.status === 'active' || note.status === 'FINALIZED'
                          ? 'bg-green-100 text-green-800'
                          : note.status === 'DRAFT'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {note.status === 'active' || note.status === 'FINALIZED'
                          ? (language === 'no' ? 'Aktiv' : 'Active')
                          : note.status === 'DRAFT'
                          ? (language === 'no' ? 'Utkast' : 'Draft')
                          : (language === 'no' ? 'Utløpt' : 'Expired')}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredNotes.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      {language === 'no'
                        ? 'Ingen sykemeldinger funnet'
                        : 'No sick notes found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
