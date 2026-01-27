import { useState } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

/**
 * Appointment Importer Component
 * Handles importing appointments from external sources (CSV, iCal, etc.)
 */
const AppointmentImporter = () => {
  const [file, setFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    // Simulated import - would normally send to backend
    await new Promise(resolve => setTimeout(resolve, 2000))
    setResult({
      success: true,
      imported: 15,
      skipped: 2,
      errors: 1
    })
    setImporting(false)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-medium text-gray-900">Importer avtaler</h3>
      </div>

      {result ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Import fullført</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-green-600 font-semibold">{result.imported}</div>
                <div className="text-green-700">Importert</div>
              </div>
              <div>
                <div className="text-yellow-600 font-semibold">{result.skipped}</div>
                <div className="text-yellow-700">Hoppet over</div>
              </div>
              <div>
                <div className="text-red-600 font-semibold">{result.errors}</div>
                <div className="text-red-700">Feil</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setFile(null); setResult(null); }}
            className="w-full py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Importer flere
          </button>
        </div>
      ) : (
        <>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : file
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="h-12 w-12 text-green-500" />
                <span className="font-medium text-gray-900">{file.name}</span>
                <span className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-12 w-12 text-gray-400" />
                <span className="text-gray-600">
                  Dra og slipp fil her, eller{' '}
                  <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                    velg fil
                    <input
                      type="file"
                      onChange={handleChange}
                      accept=".csv,.ics,.xlsx"
                      className="sr-only"
                    />
                  </label>
                </span>
                <span className="text-sm text-gray-500">
                  Støtter CSV, iCal (.ics), Excel (.xlsx)
                </span>
              </div>
            )}
          </div>

          {file && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                Eksisterende avtaler på samme tid vil bli hoppet over
              </div>
              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importerer...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Importer avtaler
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AppointmentImporter
