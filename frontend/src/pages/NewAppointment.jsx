/**
 * New Appointment Form
 * Create appointments for patients
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { appointmentsAPI, patientsAPI, usersAPI } from '../services/api';
import { ArrowLeft, Save, Calendar, Clock, User, Repeat } from 'lucide-react';
import { useTranslation, formatDate, formatTime } from '../i18n';
import Breadcrumbs from '../components/common/Breadcrumbs';

export default function NewAppointment() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation('appointments');

  const [formData, setFormData] = useState({
    patient_id: '',
    practitioner_id: '',
    start_time: '',
    end_time: '',
    appointment_type: 'REGULAR',
    recurring_pattern: '',
    recurring_end_date: '',
    patient_notes: '',
    status: 'PENDING',
  });

  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch patients for selection
  const { data: patientsResponse } = useQuery({
    queryKey: ['patients', searchTerm],
    queryFn: () => patientsAPI.getAll({ search: searchTerm, limit: 50 }),
    enabled: searchTerm.length > 1,
  });

  // Fetch practitioners/users
  const { data: usersResponse } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getAll(),
  });

  const patients = patientsResponse?.data?.patients || [];
  const users = usersResponse?.data?.users || [];

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: (data) => appointmentsAPI.create(data),
    onSuccess: () => {
      navigate('/appointments');
    },
    onError: (error) => {
      if (error.response?.data?.details) {
        const backendErrors = {};
        error.response.data.details.forEach(({ field, message }) => {
          backendErrors[field] = message;
        });
        setErrors(backendErrors);
      } else {
        setErrors({ general: error.response?.data?.message || t('failedToCreate') });
      }
    },
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));

    // Auto-calculate end time if start time changes (default 30 minutes)
    if (field === 'start_time' && value) {
      const startDate = new Date(value);
      const endDate = new Date(startDate.getTime() + 30 * 60000); // Add 30 minutes
      const endTimeString = endDate.toISOString().slice(0, 16);
      setFormData((prev) => ({ ...prev, end_time: endTimeString }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.patient_id) newErrors.patient_id = 'Patient is required';
    if (!formData.practitioner_id) newErrors.practitioner_id = 'Practitioner is required';
    if (!formData.start_time) newErrors.start_time = 'Start time is required';
    if (!formData.end_time) newErrors.end_time = 'End time is required';
    if (!formData.appointment_type) newErrors.appointment_type = 'Appointment type is required';

    // Validate end time is after start time
    if (formData.start_time && formData.end_time) {
      if (new Date(formData.end_time) <= new Date(formData.start_time)) {
        newErrors.end_time = 'End time must be after start time';
      }
    }

    // Validate recurring end date if pattern is set
    if (formData.recurring_pattern && !formData.recurring_end_date) {
      newErrors.recurring_end_date = 'Recurring end date is required for recurring appointments';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare data (remove empty optional fields)
    const submitData = {
      ...formData,
      recurring_pattern: formData.recurring_pattern || undefined,
      recurring_end_date: formData.recurring_end_date || undefined,
      patient_notes: formData.patient_notes || undefined,
    };

    createMutation.mutate(submitData);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/' },
          { label: t('appointments') || 'Appointments', href: '/appointments' },
          { label: t('newAppointment') || 'New Appointment' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/appointments')}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Back to appointments"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('newAppointment')}</h1>
            <p className="text-gray-600">{t('scheduleNewAppointment')}</p>
          </div>
        </div>
      </div>

      {/* General Error */}
      {errors.general && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{errors.general}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient & Practitioner Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">{t('patientPractitioner')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('patient')} <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchPatientPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              />
              {searchTerm.length > 1 && patients.length > 0 && (
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        handleChange('patient_id', patient.id);
                        setSearchTerm(`${patient.first_name} ${patient.last_name}`);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <p className="text-sm font-medium">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="text-xs text-gray-500">ID: {patient.solvit_id}</p>
                    </button>
                  ))}
                </div>
              )}
              {errors.patient_id && (
                <p className="text-red-600 text-sm mt-1">{errors.patient_id}</p>
              )}
            </div>

            {/* Practitioner Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('practitioner')} <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.practitioner_id}
                onChange={(e) => handleChange('practitioner_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.practitioner_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">{t('selectPractitionerPlaceholder')}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} - {user.role}
                  </option>
                ))}
              </select>
              {errors.practitioner_id && (
                <p className="text-red-600 text-sm mt-1">{errors.practitioner_id}</p>
              )}
            </div>
          </div>
        </div>

        {/* Appointment Time */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">{t('dateTime')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('startTime')} <span className="text-red-600">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.start_time ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.start_time && (
                <p className="text-red-600 text-sm mt-1">{errors.start_time}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('endTime')} <span className="text-red-600">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => handleChange('end_time', e.target.value)}
                min={formData.start_time || new Date().toISOString().slice(0, 16)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.end_time ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.end_time && <p className="text-red-600 text-sm mt-1">{errors.end_time}</p>}
            </div>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">{t('appointmentDetails')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('appointmentType')} <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.appointment_type}
                onChange={(e) => handleChange('appointment_type', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.appointment_type ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="REGULAR">{t('regularAppointment')}</option>
                <option value="INITIAL">{t('initialConsultation')}</option>
                <option value="FOLLOWUP">{t('followUp')}</option>
                <option value="EMERGENCY">{t('emergency')}</option>
                <option value="REEXAM">{t('reExamination')}</option>
              </select>
              {errors.appointment_type && (
                <p className="text-red-600 text-sm mt-1">{errors.appointment_type}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('status')}</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PENDING">{t('pending')}</option>
                <option value="CONFIRMED">{t('confirmed')}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('patientNotes')}
              </label>
              <textarea
                value={formData.patient_notes}
                onChange={(e) => handleChange('patient_notes', e.target.value)}
                rows={3}
                placeholder={t('patientNotesPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Recurring Appointments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Repeat className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">{t('recurringAppointment')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('recurringPattern')}
              </label>
              <select
                value={formData.recurring_pattern}
                onChange={(e) => handleChange('recurring_pattern', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('oneTimeAppointment')}</option>
                <option value="WEEKLY">{t('weekly')}</option>
                <option value="BIWEEKLY">{t('biweekly')}</option>
                <option value="MONTHLY">{t('monthly')}</option>
                <option value="CUSTOM">{t('custom')}</option>
              </select>
            </div>

            {formData.recurring_pattern && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('recurringUntil')} <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={formData.recurring_end_date}
                  onChange={(e) => handleChange('recurring_end_date', e.target.value)}
                  min={formData.start_time?.split('T')[0] || new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.recurring_end_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.recurring_end_date && (
                  <p className="text-red-600 text-sm mt-1">{errors.recurring_end_date}</p>
                )}
              </div>
            )}
          </div>

          {formData.recurring_pattern && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>{t('notes')}:</strong> {t('recurringNote')}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/appointments')}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Save className="w-4 h-4" />
            {createMutation.isPending ? t('creatingAppointment') : t('createAppointment')}
          </button>
        </div>
      </form>
    </div>
  );
}
