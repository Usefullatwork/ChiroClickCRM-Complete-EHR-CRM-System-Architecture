/**
 * New Patient Form
 * Create a new patient record
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { patientsAPI } from '../services/api';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  User,
  Phone,
  _Mail,
  MapPin,
  _Calendar,
  FileText,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import useUnsavedChanges from '../hooks/useUnsavedChanges';
import UnsavedChangesDialog from '../components/common/UnsavedChangesDialog';
import Breadcrumbs from '../components/common/Breadcrumbs';

export default function NewPatient() {
  const navigate = useNavigate();
  const { t, _lang } = useTranslation('patients');
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const { isBlocked, proceed, reset } = useUnsavedChanges(isDirty);

  // Form state
  const [formData, setFormData] = useState({
    solvit_id: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      postal_code: '',
      country: 'Norway',
    },
    category: '',
    referral_source: '',
    // Optional clinical fields
    red_flags: [],
    contraindications: [],
    allergies: [],
    current_medications: [],
    // CRM fields
    preferred_contact_method: '',
    language: 'NO',
    preferred_therapist: '',
    main_problem: '',
    treatment_type: '',
    general_notes: '',
    // Consent fields
    consent_sms: true,
    consent_email: true,
    consent_data_storage: true,
    consent_marketing: false,
    consent_video_marketing: false,
    // Treatment preferences
    treatment_pref_needles: null,
    treatment_pref_adjustments: null,
    treatment_pref_neck_adjustments: null,
    treatment_pref_notes: '',
  });

  // Create patient mutation
  const createMutation = useMutation({
    mutationFn: (data) => patientsAPI.create(data),
    onSuccess: (response) => {
      setIsDirty(false);
      const patientId = response.data.id;
      navigate(`/patients/${patientId}`);
    },
    onError: (error) => {
      if (error.response?.data?.details) {
        // Validation errors from backend
        const backendErrors = {};
        error.response.data.details.forEach(({ field, message }) => {
          backendErrors[field] = message;
        });
        setErrors(backendErrors);
      } else {
        setErrors({ general: error.response?.data?.message || 'Failed to create patient' });
      }
    },
  });

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleAddressChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.solvit_id?.trim()) {
      newErrors.solvit_id = 'SolvIt ID is required';
    }
    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    // Date validation
    if (formData.date_of_birth && new Date(formData.date_of_birth) > new Date()) {
      newErrors.date_of_birth = 'Date of birth cannot be in the future';
    }

    // Phone validation (Norwegian format)
    if (formData.phone && !/^(\+47)?[0-9]{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Phone must be a valid Norwegian phone number (8 digits)';
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email must be valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare data for submission (remove empty strings, format arrays)
    const submitData = {
      ...formData,
      // Clean up empty address object
      address:
        formData.address.street || formData.address.city || formData.address.postal_code
          ? formData.address
          : undefined,
      // Remove empty optional fields
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      category: formData.category || undefined,
      referral_source: formData.referral_source || undefined,
      preferred_contact_method: formData.preferred_contact_method || undefined,
      preferred_therapist: formData.preferred_therapist || undefined,
      main_problem: formData.main_problem || undefined,
      treatment_type: formData.treatment_type || undefined,
      general_notes: formData.general_notes || undefined,
    };

    createMutation.mutate(submitData);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <UnsavedChangesDialog isBlocked={isBlocked} onProceed={proceed} onCancel={reset} />
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/' },
          { label: t('patients') || 'Patients', href: '/patients' },
          { label: t('newPatient') || 'New Patient' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/patients')}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Back to patients"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('newPatient')}</h1>
            <p className="text-gray-600">Create a new patient record</p>
          </div>
        </div>
      </div>

      {/* General Error */}
      {errors.general && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-red-800">{errors.general}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">{t('personalInfo')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SolvIt ID <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.solvit_id}
                onChange={(e) => handleChange('solvit_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.solvit_id ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., SOLV12345"
              />
              {errors.solvit_id && <p className="text-red-600 text-sm mt-1">{errors.solvit_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('gender')} <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.gender ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select gender</option>
                <option value="MALE">{t('male')}</option>
                <option value="FEMALE">{t('female')}</option>
                <option value="OTHER">{t('other')}</option>
              </select>
              {errors.gender && <p className="text-red-600 text-sm mt-1">{errors.gender}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('firstName')} <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                data-testid="new-patient-first-name"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.first_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="First name"
              />
              {errors.first_name && (
                <p className="text-red-600 text-sm mt-1">{errors.first_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('lastName')} <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                data-testid="new-patient-last-name"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.last_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Last name"
              />
              {errors.last_name && <p className="text-red-600 text-sm mt-1">{errors.last_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('dateOfBirth')} <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                data-testid="new-patient-dob"
                value={formData.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date_of_birth && (
                <p className="text-red-600 text-sm mt-1">{errors.date_of_birth}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not set</option>
                <option value="OSLO">Oslo</option>
                <option value="OUTSIDE_OSLO">Outside Oslo</option>
                <option value="TRAVELING">Traveling</option>
                <option value="REFERRED">Referred</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">{t('contactInfo')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
              <input
                type="tel"
                data-testid="new-patient-phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., +47 12345678"
              />
              {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
              <input
                type="email"
                data-testid="new-patient-email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="email@example.com"
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('preferredContactMethod')}
              </label>
              <select
                value={formData.preferred_contact_method}
                onChange={(e) => handleChange('preferred_contact_method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not set</option>
                <option value="SMS">{t('sms')}</option>
                <option value="EMAIL">{t('email')}</option>
                <option value="PHONE">{t('phone')}</option>
                <option value="NO_CONTACT">Do not contact</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={formData.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="NO">Norsk</option>
                <option value="EN">English</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">{t('address')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Street address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('postalCode')}
              </label>
              <input
                type="text"
                value={formData.address.postal_code}
                onChange={(e) => handleAddressChange('postal_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 0123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('city')}</label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="City"
              />
            </div>
          </div>
        </div>

        {/* Clinical Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">{t('clinical')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('mainProblem')}
              </label>
              <input
                type="text"
                value={formData.main_problem}
                onChange={(e) => handleChange('main_problem', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Nakke smerter, Rygg problemer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Treatment Type (Behandlingstype)
              </label>
              <select
                value={formData.treatment_type}
                onChange={(e) => handleChange('treatment_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not set</option>
                <option value="KIROPRAKTOR">Kiropraktor</option>
                <option value="NEVROBEHANDLING">Nevrobehandling</option>
                <option value="MUSKELBEHANDLING">Muskelbehandling</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Therapist
              </label>
              <input
                type="text"
                value={formData.preferred_therapist}
                onChange={(e) => handleChange('preferred_therapist', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mads, Andre, Mikael, Edle..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referral Source
              </label>
              <input
                type="text"
                value={formData.referral_source}
                onChange={(e) => handleChange('referral_source', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Doctor, Friend, Google"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('notes')}</label>
              <textarea
                value={formData.general_notes}
                onChange={(e) => handleChange('general_notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional notes about the patient..."
              />
            </div>
          </div>
        </div>

        {/* Consent */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t('consentGiven')}</h2>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.consent_sms}
                onChange={(e) => handleChange('consent_sms', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Consent to SMS notifications</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.consent_email}
                onChange={(e) => handleChange('consent_email', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Consent to email notifications</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.consent_data_storage}
                onChange={(e) => handleChange('consent_data_storage', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Consent to data storage (GDPR required)</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.consent_marketing}
                onChange={(e) => handleChange('consent_marketing', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Consent to marketing communications</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.consent_video_marketing}
                onChange={(e) => handleChange('consent_video_marketing', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Consent to video marketing</span>
            </label>
          </div>
        </div>

        {/* Treatment Preferences */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Behandlingspreferanser</h3>
          <p className="text-sm text-gray-500 mb-4">
            Angi hva pasienten er komfortabel med. La stå tom hvis ikke avklart.
          </p>
          <div className="space-y-4">
            {/* Needles preference */}
            <div className="flex items-center gap-6">
              <span className="text-sm font-medium text-gray-700 w-40">
                Nåler (dry needling, akupunktur):
              </span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="treatment_pref_needles"
                    checked={formData.treatment_pref_needles === true}
                    onChange={() => handleChange('treatment_pref_needles', true)}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-green-700">OK</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="treatment_pref_needles"
                    checked={formData.treatment_pref_needles === false}
                    onChange={() => handleChange('treatment_pref_needles', false)}
                    className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <span className="text-sm text-red-700">Ikke OK</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="treatment_pref_needles"
                    checked={formData.treatment_pref_needles === null}
                    onChange={() => handleChange('treatment_pref_needles', null)}
                    className="w-4 h-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                  />
                  <span className="text-sm text-gray-500">Ikke avklart</span>
                </label>
              </div>
            </div>

            {/* Adjustments preference */}
            <div className="flex items-center gap-6">
              <span className="text-sm font-medium text-gray-700 w-40">Justeringer generelt:</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="treatment_pref_adjustments"
                    checked={formData.treatment_pref_adjustments === true}
                    onChange={() => handleChange('treatment_pref_adjustments', true)}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-green-700">OK</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="treatment_pref_adjustments"
                    checked={formData.treatment_pref_adjustments === false}
                    onChange={() => handleChange('treatment_pref_adjustments', false)}
                    className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <span className="text-sm text-red-700">Ikke OK</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="treatment_pref_adjustments"
                    checked={formData.treatment_pref_adjustments === null}
                    onChange={() => handleChange('treatment_pref_adjustments', null)}
                    className="w-4 h-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                  />
                  <span className="text-sm text-gray-500">Ikke avklart</span>
                </label>
              </div>
            </div>

            {/* Neck adjustments preference */}
            <div className="flex items-center gap-6">
              <span className="text-sm font-medium text-gray-700 w-40">
                Nakkejusteringer spesifikt:
              </span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="treatment_pref_neck_adjustments"
                    checked={formData.treatment_pref_neck_adjustments === true}
                    onChange={() => handleChange('treatment_pref_neck_adjustments', true)}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-green-700">OK</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="treatment_pref_neck_adjustments"
                    checked={formData.treatment_pref_neck_adjustments === false}
                    onChange={() => handleChange('treatment_pref_neck_adjustments', false)}
                    className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <span className="text-sm text-red-700">Ikke OK</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="treatment_pref_neck_adjustments"
                    checked={formData.treatment_pref_neck_adjustments === null}
                    onChange={() => handleChange('treatment_pref_neck_adjustments', null)}
                    className="w-4 h-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                  />
                  <span className="text-sm text-gray-500">Ikke avklart</span>
                </label>
              </div>
            </div>

            {/* Treatment preference notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notater om behandlingspreferanser
              </label>
              <textarea
                value={formData.treatment_pref_notes}
                onChange={(e) => handleChange('treatment_pref_notes', e.target.value)}
                rows={2}
                placeholder="f.eks. pasient er nervøs for nakkejusteringer pga tidligere ubehag..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button
            type="button"
            data-testid="new-patient-cancel"
            onClick={() => navigate('/patients')}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="new-patient-submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Save className="w-4 h-4" />
            {createMutation.isPending ? 'Creating...' : t('createPatient')}
          </button>
        </div>
      </form>
    </div>
  );
}
