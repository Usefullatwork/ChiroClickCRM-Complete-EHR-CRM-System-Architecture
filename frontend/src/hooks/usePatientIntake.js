import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

/**
 * API function to fetch kiosk intake data
 * @param {string} appointmentId - The appointment ID
 */
const fetchIntakeData = async (appointmentId) => {
  if (!appointmentId) return null

  try {
    const response = await fetch(`/api/v1/kiosk/intake/${appointmentId}`)
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error('Failed to fetch intake data')
    }
    return response.json()
  } catch (error) {
    console.error('Error fetching intake data:', error)
    return null
  }
}

/**
 * Convert intake data to narrative text for subjective section
 * @param {Object} intake - The intake data object
 * @returns {string} Formatted narrative text
 */
const generateSubjectiveNarrative = (intake) => {
  if (!intake) return ''

  const parts = []

  // Chief complaint
  if (intake.chiefComplaint) {
    parts.push(`Hovedklage: ${intake.chiefComplaint}`)
  }

  // Pain location
  if (intake.painLocation) {
    parts.push(`Lokalisasjon: ${intake.painLocation}`)
  }

  // Pain duration/onset
  if (intake.painDuration) {
    parts.push(`Varighet: ${intake.painDuration}`)
  }

  // Pain character
  if (intake.painCharacter) {
    parts.push(`Karakter: ${intake.painCharacter}`)
  }

  // Pain intensity (VAS)
  if (intake.painIntensity !== undefined) {
    parts.push(`Smerteintensitet (VAS): ${intake.painIntensity}/10`)
  }

  // Aggravating factors
  if (intake.aggravatingFactors) {
    parts.push(`Forverrer: ${intake.aggravatingFactors}`)
  }

  // Relieving factors
  if (intake.relievingFactors) {
    parts.push(`Lindrer: ${intake.relievingFactors}`)
  }

  // Previous treatment
  if (intake.previousTreatment) {
    parts.push(`Tidligere behandling: ${intake.previousTreatment}`)
  }

  // Medications
  if (intake.medications) {
    parts.push(`Medisiner: ${intake.medications}`)
  }

  // General health
  if (intake.generalHealth) {
    parts.push(`Generell helse: ${intake.generalHealth}`)
  }

  // Patient goals
  if (intake.goals) {
    parts.push(`Pasientens mål: ${intake.goals}`)
  }

  return parts.join('\n')
}

/**
 * Hook for fetching and managing patient kiosk intake data
 * @param {string} appointmentId - The appointment ID to fetch intake for
 * @returns {Object} Intake data and helper functions
 */
export const usePatientIntake = (appointmentId) => {
  // Fetch intake data
  const { data: intake, isLoading, error, refetch } = useQuery({
    queryKey: ['patientIntake', appointmentId],
    queryFn: () => fetchIntakeData(appointmentId),
    enabled: !!appointmentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1
  })

  // Generate narrative from intake data
  const subjectiveNarrative = useMemo(() => {
    return generateSubjectiveNarrative(intake)
  }, [intake])

  // Check if intake data exists and has content
  const hasIntake = useMemo(() => {
    return intake && Object.keys(intake).length > 0
  }, [intake])

  // Get specific fields from intake
  const getIntakeField = (fieldName) => {
    return intake?.[fieldName] || null
  }

  return {
    intake,
    subjectiveNarrative,
    hasIntake,
    isLoading,
    error,
    refetch,
    getIntakeField
  }
}

export default usePatientIntake
