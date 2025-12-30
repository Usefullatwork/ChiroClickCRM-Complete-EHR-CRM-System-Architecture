/**
 * Patient Detail Page
 * Comprehensive patient profile with CRM fields
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  FileText,
  Clock,
  AlertCircle,
  MessageSquare,
  Globe,
  Shield
} from 'lucide-react'
import { patientsAPI, encountersAPI, appointmentsAPI } from '../services/api'
import { formatDate, formatPhone, calculateAge } from '../lib/utils'
import GDPRExportModal from '../components/GDPRExportModal'

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [showGDPRModal, setShowGDPRModal] = useState(false)

  // Fetch patient data
  const { data: patientResponse, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsAPI.getById(id),
    onSuccess: (data) => {
      setFormData(data.data)
    }
  })

  // Fetch encounters
  const { data: encountersResponse } = useQuery({
    queryKey: ['patient-encounters', id],
    queryFn: () => encountersAPI.getByPatient(id)
  })

  const patient = patientResponse?.data
  const encounters = encountersResponse?.data?.encounters || []

  // Update patient mutation
  const updateMutation = useMutation({
    mutationFn: (data) => patientsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['patient', id])
      setIsEditing(false)
    }
  })

  const handleSave = () => {
    updateMutation.mutate(formData)
  }

  const handleCancel = () => {
    setFormData(patient)
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Patient not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/patients')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-gray-600">
              {calculateAge(patient.date_of_birth)} years • ID: {patient.solvit_id}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowGDPRModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Export Patient Data (GDPR)"
              >
                <Shield className="w-4 h-4" />
                Export Data
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => navigate(`/patients/${id}/easy-assessment`)}
                className="flex items-center gap-2 px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                <FileText className="w-4 h-4" />
                Easy Assessment
              </button>
              <button
                onClick={() => navigate(`/patients/${id}/encounter`)}
                className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                <FileText className="w-4 h-4" />
                New Visit
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Patient Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Phone</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <p className="font-medium">{formatPhone(patient.phone) || '-'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Email</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <p className="font-medium">{patient.email || '-'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Preferred Contact</p>
                  {isEditing ? (
                    <select
                      value={formData.preferred_contact_method || ''}
                      onChange={(e) => setFormData({ ...formData, preferred_contact_method: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Not set</option>
                      <option value="SMS">SMS</option>
                      <option value="EMAIL">Email</option>
                      <option value="PHONE">Phone</option>
                      <option value="NO_CONTACT">Do not contact</option>
                    </select>
                  ) : (
                    <p className="font-medium">{patient.preferred_contact_method || '-'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Language</p>
                  {isEditing ? (
                    <select
                      value={formData.language || 'NO'}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="NO">Norsk</option>
                      <option value="EN">English</option>
                      <option value="OTHER">Other</option>
                    </select>
                  ) : (
                    <p className="font-medium">
                      {patient.language === 'NO' ? 'Norsk' : patient.language === 'EN' ? 'English' : 'Other'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {patient.address && (
              <div className="mt-4 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium">
                    {patient.address.street}<br />
                    {patient.address.postal_code} {patient.address.city}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Clinical Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Clinical Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Main Problem (Hovedproblem)</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.main_problem || ''}
                    onChange={(e) => setFormData({ ...formData, main_problem: e.target.value })}
                    placeholder="e.g., Nakke smerter, Rygg problemer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <p className="font-medium">{patient.main_problem || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Treatment Type (Behandlingstype)</label>
                {isEditing ? (
                  <select
                    value={formData.treatment_type || ''}
                    onChange={(e) => setFormData({ ...formData, treatment_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Not set</option>
                    <option value="KIROPRAKTOR">Kiropraktor</option>
                    <option value="NEVROBEHANDLING">Nevrobehandling</option>
                    <option value="MUSKELBEHANDLING">Muskelbehandling</option>
                    <option value="OTHER">Other</option>
                  </select>
                ) : (
                  <p className="font-medium">{patient.treatment_type || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Preferred Therapist</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.preferred_therapist || ''}
                    onChange={(e) => setFormData({ ...formData, preferred_therapist: e.target.value })}
                    placeholder="Mads, Andre, Mikael, Edle..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <p className="font-medium">{patient.preferred_therapist || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">General Notes</label>
                {isEditing ? (
                  <textarea
                    value={formData.general_notes || ''}
                    onChange={(e) => setFormData({ ...formData, general_notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <p className="font-medium whitespace-pre-wrap">{patient.general_notes || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Encounters */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Visits</h2>
            {encounters.length === 0 ? (
              <p className="text-gray-600">No visits recorded</p>
            ) : (
              <div className="space-y-3">
                {encounters.slice(0, 5).map((encounter) => (
                  <div
                    key={encounter.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/patients/${id}/encounter/${encounter.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{formatDate(encounter.encounter_date)}</p>
                        <p className="text-sm text-gray-600">{encounter.encounter_type}</p>
                      </div>
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {encounters.length > 5 && (
              <button className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
                View all {encounters.length} visits
              </button>
            )}
          </div>
        </div>

        {/* Right Column - Stats & Actions */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Visits</span>
                <span className="font-bold text-lg">{patient.total_visits || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Last Visit</span>
                <span className="font-medium">{formatDate(patient.last_visit_date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">First Visit</span>
                <span className="font-medium">{formatDate(patient.first_visit_date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  patient.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  patient.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {patient.status}
                </span>
              </div>
            </div>
          </div>

          {/* Follow-up Alert */}
          {patient.should_be_followed_up && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900">Follow-up Needed</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    Due: {formatDate(patient.should_be_followed_up)}
                  </p>
                  <button className="mt-2 text-sm text-yellow-900 font-medium hover:underline">
                    Mark as contacted
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Category Info */}
          {patient.category && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-2">Category</h3>
              <p className="text-sm text-gray-600">{patient.category.replace('_', ' ')}</p>
              {patient.referral_source && (
                <div className="mt-3">
                  <h3 className="font-semibold mb-1">Referral Source</h3>
                  <p className="text-sm text-gray-600">{patient.referral_source}</p>
                </div>
              )}
            </div>
          )}

          {/* Consent Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-3">Consent</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">SMS</span>
                <span className={patient.consent_sms ? 'text-green-600' : 'text-gray-400'}>
                  {patient.consent_sms ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Email</span>
                <span className={patient.consent_email ? 'text-green-600' : 'text-gray-400'}>
                  {patient.consent_email ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Marketing</span>
                <span className={patient.consent_marketing ? 'text-green-600' : 'text-gray-400'}>
                  {patient.consent_marketing ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Video Marketing</span>
                <span className={patient.consent_video_marketing ? 'text-green-600' : 'text-gray-400'}>
                  {patient.consent_video_marketing ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GDPR Export Modal */}
      {showGDPRModal && (
        <GDPRExportModal
          patient={patient}
          onClose={() => setShowGDPRModal(false)}
        />
      )}
    </div>
  )
}
