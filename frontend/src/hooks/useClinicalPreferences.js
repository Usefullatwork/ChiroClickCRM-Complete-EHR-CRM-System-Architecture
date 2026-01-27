import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { clinicalSettingsAPI } from '../services/api'

/**
 * Notation methods available in the system
 */
export const NOTATION_METHODS = [
  {
    id: 'segment_listing',
    name: { en: 'Segment Listing', no: 'Segmentlisting' },
    description: {
      en: 'Traditional chiropractic listing notation (e.g., C5 PRS, T4 PL-SP)',
      no: 'Tradisjonell kiropraktisk listingnotasjon (f.eks. C5 PRS, T4 PL-SP)'
    },
    isVisual: false
  },
  {
    id: 'body_chart',
    name: { en: 'Body Chart', no: 'Kroppskart' },
    description: {
      en: 'Visual body diagram with symptom markers and regions',
      no: 'Visuelt kroppsdiagram med symptommarkører og regioner'
    },
    isVisual: true
  },
  {
    id: 'anatomical_chart',
    name: { en: 'Anatomical Chart', no: 'Anatomisk Kart' },
    description: {
      en: 'Detailed anatomy with dermatomes, muscles, and trigger points',
      no: 'Detaljert anatomi med dermatomer, muskler og triggerpunkter'
    },
    isVisual: true
  },
  {
    id: 'soap_narrative',
    name: { en: 'SOAP Narrative', no: 'SOAP Narrativ' },
    description: {
      en: 'Text-based SOAP note format with structured sections',
      no: 'Tekstbasert SOAP-notatformat med strukturerte seksjoner'
    },
    isVisual: false
  }
]

/**
 * Hook for managing clinical documentation preferences
 * @returns {Object} Clinical preferences and helper functions
 */
export const useClinicalPreferences = () => {
  const [language, setLanguage] = useState('no')

  // Fetch clinical settings from API
  const { data: settings, isLoading } = useQuery({
    queryKey: ['clinicalSettings'],
    queryFn: () => clinicalSettingsAPI.getSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    // Return defaults if API fails
    placeholderData: {
      adjustment: {
        style: 'segment_listing',
        gonstead: { useFullNotation: true, includeDirection: true },
        diversified: { useAnatomicalTerms: true, includeRestriction: true }
      },
      tests: {
        orthopedic: { resultFormat: 'plus_minus' },
        neurological: { reflexGrading: 'numeric' },
        rom: { format: 'degrees' }
      }
    }
  })

  // Get current notation method based on settings
  const currentNotationMethod = settings?.adjustment?.style || 'segment_listing'

  // Get notation method name in current language
  const getNotationName = useCallback((methodId = currentNotationMethod) => {
    const method = NOTATION_METHODS.find(m => m.id === methodId)
    return method ? method.name[language] || method.name.no : methodId
  }, [currentNotationMethod, language])

  // Check if current notation method is visual
  const isVisualNotation = useCallback((methodId = currentNotationMethod) => {
    const method = NOTATION_METHODS.find(m => m.id === methodId)
    return method?.isVisual || false
  }, [currentNotationMethod])

  // Get method details
  const getMethodDetails = useCallback((methodId) => {
    return NOTATION_METHODS.find(m => m.id === methodId)
  }, [])

  return {
    preferences: settings,
    currentNotationMethod,
    getNotationName,
    isVisualNotation,
    getMethodDetails,
    language,
    setLanguage,
    isLoading,
    notationMethods: NOTATION_METHODS
  }
}

export default useClinicalPreferences
