/**
 * Patient Portal Login Page
 * Simple token-based login from email link
 * Validates access token and redirects to exercises
 */

import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Dumbbell,
  Loader2,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail
} from 'lucide-react'
import { patientApi, storeToken, getTokenFromUrl } from '../../api/patientApi'

const PatientLogin = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tokenData, setTokenData] = useState(null)
  const [manualToken, setManualToken] = useState('')
  const [showManualEntry, setShowManualEntry] = useState(false)

  // Get token from URL on mount
  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      validateToken(token)
    } else {
      setLoading(false)
      setShowManualEntry(true)
    }
  }, [searchParams])

  /**
   * Validate the access token
   */
  const validateToken = async (token) => {
    try {
      setLoading(true)
      setError(null)

      const response = await patientApi.validateToken(token)

      if (response.success && response.valid) {
        setTokenData(response.data)
        storeToken(token)

        // Auto-redirect after showing welcome
        setTimeout(() => {
          navigate(`/portal/mine-ovelser?token=${token}`)
        }, 2000)
      } else {
        setError(response.error || 'Tilgangskoden er ugyldig')
        setShowManualEntry(true)
      }
    } catch (err) {
      console.error('Token validation error:', err)
      setError(err.message || 'Kunne ikke validere tilgangskoden')
      setShowManualEntry(true)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle manual token submission
   */
  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualToken.trim().length >= 32) {
      validateToken(manualToken.trim())
    } else {
      setError('Tilgangskoden må være minst 32 tegn')
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Validerer tilgang...
          </h1>
          <p className="text-gray-500">Vennligst vent</p>
        </div>
      </div>
    )
  }

  // Success state - show welcome before redirect
  if (tokenData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Velkommen, {tokenData.patient?.firstName}!
          </h1>
          <p className="text-gray-600 mb-4">
            Du er logget inn hos {tokenData.clinic?.name}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Laster øvelsene dine...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error/Manual entry state
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Pasientportalen
          </h1>
          <p className="text-gray-500 mt-1">
            Logg inn for å se øvelsene dine
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Tilgang avvist</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Manual Token Entry */}
        {showManualEntry && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Skriv inn tilgangskode
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Du finner tilgangskoden i e-posten du fikk fra klinikken.
              Koden er en lang rekke med bokstaver og tall.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                  Tilgangskode
                </label>
                <input
                  type="text"
                  id="token"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Lim inn tilgangskoden her..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                disabled={manualToken.length < 32}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Logg inn</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Finner du ikke tilgangskoden?
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Kontakt klinikken din for å få en ny lenke.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            Dette er en sikker innloggingsside.
            Din tilgangskode er personlig og bør ikke deles med andre.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PatientLogin
