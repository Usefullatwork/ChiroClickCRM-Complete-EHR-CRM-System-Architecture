/**
 * Patient Detail Page — Split-View Layout
 * Fixed sidebar with always-visible patient info + tabbed content area
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertCircle,
  MessageSquare,
  Globe,
  Shield,
} from 'lucide-react';
import { patientsAPI, encountersAPI } from '../services/api';
import { formatDate, formatPhone, calculateAge } from '../lib/utils';
import GDPRExportModal from '../components/GDPRExportModal';
import PatientSummaryCard from '../components/patients/PatientSummaryCard';
import PatientChartSidebar from '../components/patients/PatientChartSidebar';
import PatientTimeline from '../components/patients/PatientTimeline';
import TreatmentPlanProgress from '../components/treatment/TreatmentPlanProgress';
import OutcomeChart from '../components/clinical/OutcomeChart';
import ComplianceDashboard from '../components/clinical/ComplianceDashboard';
import _Breadcrumbs from '../components/common/Breadcrumbs';
import { useTranslation } from '../i18n';
import usePatientPresence from '../hooks/usePatientPresence';
import { useAuth } from '../hooks/useAuth';
import PatientMessages from '../components/portal/PatientMessages';

const TABS = [
  { key: 'overview', labelEn: 'Overview', labelNo: 'Oversikt' },
  { key: 'journals', labelEn: 'Journals', labelNo: 'Journaler' },
  { key: 'timeline', labelEn: 'Timeline', labelNo: 'Tidslinje' },
  { key: 'results', labelEn: 'Results', labelNo: 'Resultater' },
  { key: 'messages', labelEn: 'Messages', labelNo: 'Meldinger' },
];

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, lang } = useTranslation('patients');
  const { user: currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [showGDPRModal, setShowGDPRModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Track who else is viewing this patient
  const patientViewers = usePatientPresence(
    id,
    currentUser?.name || currentUser?.full_name || currentUser?.email || 'Behandler'
  );

  // Fetch patient data
  const { data: patientResponse, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsAPI.getById(id),
  });

  // Fetch encounters
  const { data: encountersResponse } = useQuery({
    queryKey: ['patient-encounters', id],
    queryFn: () => encountersAPI.getByPatient(id),
  });

  const patient = patientResponse?.data?.data || patientResponse?.data;

  // Sync formData when patient data loads (replaces deprecated onSuccess)
  useEffect(() => {
    if (patientResponse?.data) {
      setFormData(patientResponse.data?.data || patientResponse.data);
    }
  }, [patientResponse]);
  const encountersRaw = encountersResponse?.data?.data || encountersResponse?.data;
  const encounters = encountersRaw?.encounters || [];

  // Update patient mutation
  const updateMutation = useMutation({
    mutationFn: (data) => patientsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['patient', id]);
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData(patient);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">{t('patientNotFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/patients')}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label={t('backToPatients')}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1
              data-testid="patient-detail-name"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {calculateAge(patient.date_of_birth)} {t('sidebar.years', 'år')} • ID:{' '}
              {patient.solvit_id}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <X className="w-4 h-4" />
                {t('cancel', 'Avbryt')}
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:bg-gray-400"
              >
                <Save className="w-4 h-4" />
                {t('savePatient')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowGDPRModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                title="GDPR Export"
              >
                <Shield className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">{t('editPatient', 'Rediger')}</span>
              </button>
              <button
                onClick={() => navigate(`/patients/${id}/easy-assessment`)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">{t('quickAssessment', 'Hurtigvurdering')}</span>
              </button>
              <button
                onClick={() => navigate(`/patients/${id}/encounter`)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-teal-600 rounded-lg hover:bg-teal-700"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">{t('newVisit')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Presence Indicator */}
      {patientViewers.length > 0 && (
        <div className="flex items-center gap-2 px-6 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="flex -space-x-2">
            {patientViewers.map((viewer) => (
              <div
                key={viewer.userId}
                className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white dark:ring-gray-800"
                title={viewer.name}
              >
                {viewer.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            ))}
          </div>
          <span className="text-xs text-amber-800 dark:text-amber-300">
            {patientViewers.map((v) => v.name).join(', ')}{' '}
            {t('alsoViewing', 'ser også på denne pasienten')}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">Live</span>
          </div>
        </div>
      )}

      {/* Split-view: Sidebar + Tabbed Content */}
      <div data-testid="patient-detail-tabs" className="flex flex-1 min-h-0">
        {/* Sidebar — hidden on mobile, 300px on desktop */}
        <div className="hidden lg:block">
          <PatientChartSidebar
            patient={patient}
            encounters={encounters}
            isEditing={isEditing}
            onNavigate={navigate}
            t={t}
            lang={lang}
          />
        </div>

        {/* Tabbed content area */}
        <div
          data-testid="patient-detail-panel"
          className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900"
        >
          {/* Tab bar */}
          <div
            role="tablist"
            aria-label="Pasientdetaljer"
            className="flex items-center gap-1 px-6 pt-4 pb-0"
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                id={`tab-${tab.key}`}
                aria-selected={activeTab === tab.key}
                aria-controls={`tabpanel-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-gray-800 text-teal-700 dark:text-teal-400 border border-gray-200 dark:border-gray-700 border-b-white dark:border-b-gray-800'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {lang === 'no' ? tab.labelNo : tab.labelEn}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mx-6 mb-6 rounded-b-lg rounded-tr-lg shadow-sm"
          >
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="p-6 space-y-6">
                {/* Mobile-only summary card (sidebar content for mobile) */}
                <div className="lg:hidden">
                  <PatientSummaryCard patient={patient} patientId={id} />
                </div>

                {/* Contact Information */}
                <div data-testid="patient-detail-tab-contact">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {t('contactInfo')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 dark:text-gray-300 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('phone')}</p>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={formData.phone || ''}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                          />
                        ) : (
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatPhone(patient.phone) || '-'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 dark:text-gray-300 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('email')}</p>
                        {isEditing ? (
                          <input
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                          />
                        ) : (
                          <p className="font-medium text-gray-900 dark:text-white">
                            {patient.email || '-'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-gray-400 dark:text-gray-300 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('preferredContactMethod')}
                        </p>
                        {isEditing ? (
                          <select
                            value={formData.preferred_contact_method || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, preferred_contact_method: e.target.value })
                            }
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                          >
                            <option value="">{t('notSet', 'Ikke satt')}</option>
                            <option value="SMS">SMS</option>
                            <option value="EMAIL">{t('email')}</option>
                            <option value="PHONE">{t('phone')}</option>
                            <option value="NO_CONTACT">{t('noContact', 'Ikke kontakt')}</option>
                          </select>
                        ) : (
                          <p className="font-medium text-gray-900 dark:text-white">
                            {patient.preferred_contact_method || '-'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-gray-400 dark:text-gray-300 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('language', 'Språk')}
                        </p>
                        {isEditing ? (
                          <select
                            value={formData.language || 'NO'}
                            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                          >
                            <option value="NO">Norsk</option>
                            <option value="EN">English</option>
                            <option value="OTHER">{t('other', 'Annet')}</option>
                          </select>
                        ) : (
                          <p className="font-medium text-gray-900 dark:text-white">
                            {patient.language === 'NO'
                              ? 'Norsk'
                              : patient.language === 'EN'
                                ? 'English'
                                : patient.language || '-'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {patient.address && (
                    <div className="mt-4 flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-300 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('address')}</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {patient.address.street}
                          <br />
                          {patient.address.postal_code} {patient.address.city}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Clinical Information */}
                <div data-testid="patient-detail-tab-clinical">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {t('clinical')}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {t('mainProblem')}
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.main_problem || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, main_problem: e.target.value })
                          }
                          placeholder={t(
                            'mainProblemPlaceholder',
                            'F.eks. nakkesmerter, ryggproblemer'
                          )}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                        />
                      ) : (
                        <p className="font-medium text-gray-900 dark:text-white">
                          {patient.main_problem || '-'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {t('treatmentType', 'Behandlingstype')}
                      </label>
                      {isEditing ? (
                        <select
                          value={formData.treatment_type || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, treatment_type: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                        >
                          <option value="">{t('notSet', 'Ikke satt')}</option>
                          <option value="KIROPRAKTOR">Kiropraktor</option>
                          <option value="NEVROBEHANDLING">Nevrobehandling</option>
                          <option value="MUSKELBEHANDLING">Muskelbehandling</option>
                          <option value="OTHER">{t('other', 'Annet')}</option>
                        </select>
                      ) : (
                        <p className="font-medium text-gray-900 dark:text-white">
                          {patient.treatment_type || '-'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {t('notes')}
                      </label>
                      {isEditing ? (
                        <textarea
                          value={formData.general_notes || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, general_notes: e.target.value })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                        />
                      ) : (
                        <p className="font-medium text-gray-900 dark:text-white whitespace-pre-wrap">
                          {patient.general_notes || '-'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Treatment Preferences */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {t('treatmentPreferences')}
                  </h2>
                  {!isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { key: 'needles', field: 'treatment_pref_needles' },
                        { key: 'adjustments', field: 'treatment_pref_adjustments' },
                        { key: 'neckAdjustments', field: 'treatment_pref_neck_adjustments' },
                      ].map(({ key, field }) => {
                        const val = patient[field];
                        return (
                          <div
                            key={key}
                            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                val === true
                                  ? 'bg-green-100 dark:bg-green-900/30'
                                  : val === false
                                    ? 'bg-red-100 dark:bg-red-900/30'
                                    : 'bg-gray-100 dark:bg-gray-700'
                              }`}
                            >
                              <span
                                className={`text-lg ${val === true ? 'text-green-600' : val === false ? 'text-red-600' : 'text-gray-400 dark:text-gray-300'}`}
                              >
                                {val === true ? '✓' : val === false ? '✗' : '?'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{t(key)}</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {val === true
                                  ? t('prefOk')
                                  : val === false
                                    ? t('prefNotOk')
                                    : t('prefNotCleared')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        {
                          key: 'needles',
                          field: 'treatment_pref_needles',
                          name: 'edit_pref_needles',
                        },
                        {
                          key: 'adjustments',
                          field: 'treatment_pref_adjustments',
                          name: 'edit_pref_adj',
                        },
                        {
                          key: 'neckAdjustments',
                          field: 'treatment_pref_neck_adjustments',
                          name: 'edit_pref_neck',
                        },
                      ].map(({ key, field, name }) => (
                        <div key={key} className="flex items-center gap-6">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
                            {t(key)}:
                          </span>
                          <div className="flex items-center gap-4">
                            {[
                              {
                                val: true,
                                label: t('prefOk'),
                                color: 'text-green-700 dark:text-green-400',
                              },
                              {
                                val: false,
                                label: t('prefNotOk'),
                                color: 'text-red-700 dark:text-red-400',
                              },
                              {
                                val: null,
                                label: t('prefNotCleared'),
                                color: 'text-gray-500 dark:text-gray-400',
                              },
                            ].map(({ val, label, color }) => (
                              <label
                                key={String(val)}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name={name}
                                  checked={formData[field] === val}
                                  onChange={() => setFormData({ ...formData, [field]: val })}
                                  className="w-4 h-4"
                                />
                                <span className={`text-sm ${color}`}>{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="mt-4">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {t('preferenceNotes')}
                        </label>
                        <textarea
                          value={formData.treatment_pref_notes || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, treatment_pref_notes: e.target.value })
                          }
                          rows={2}
                          placeholder={t('treatmentNotesPlaceholder')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                  {!isEditing && patient.treatment_pref_notes && (
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                      {patient.treatment_pref_notes}
                    </p>
                  )}
                </div>

                {/* Consent Status */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {t('consentGiven')}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { key: 'sms', field: 'consent_sms' },
                      { key: 'email', field: 'consent_email' },
                      { key: 'marketing', field: 'consent_marketing', label: 'Marketing' },
                      { key: 'video', field: 'consent_video_marketing', label: 'Video' },
                    ].map(({ key, field, label }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2 rounded border border-gray-200 dark:border-gray-700"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {label || t(key)}
                        </span>
                        <span
                          className={
                            patient[field] ? 'text-green-600' : 'text-gray-400 dark:text-gray-300'
                          }
                        >
                          {patient[field] ? '✓' : '✗'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Journals Tab */}
            {activeTab === 'journals' && (
              <div data-testid="patient-detail-tab-visits" className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('recentVisits')}
                </h2>
                {encounters.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">{t('noVisitsRecorded')}</p>
                ) : (
                  <div className="space-y-3">
                    {encounters.map((encounter) => (
                      <div
                        key={encounter.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors"
                        onClick={() => navigate(`/patients/${id}/encounter/${encounter.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatDate(encounter.encounter_date)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {encounter.encounter_type}
                            </p>
                            {encounter.chief_complaint && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                {encounter.chief_complaint}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {encounter.signed_at && (
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                {t('signed', 'Signert')}
                              </span>
                            )}
                            <FileText className="w-5 h-5 text-gray-400 dark:text-gray-300" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Treatment Plan + Outcomes */}
                <TreatmentPlanProgress
                  patientId={id}
                  onNewPlan={() => navigate(`/patients/${id}/treatment-plan/new`)}
                  lang={lang === 'en' ? 'en' : 'no'}
                />
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="p-6">
                <PatientTimeline patientId={id} encounters={encounters} onNavigate={navigate} />
              </div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <div className="p-6 space-y-6">
                <OutcomeChart patientId={id} />
                <ComplianceDashboard patientId={id} />

                {/* Follow-up Alert */}
                {patient.should_be_followed_up && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-yellow-900 dark:text-yellow-200">
                          {t('followUpNeeded', 'Oppfølging nødvendig')}
                        </p>
                        <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                          {t('dueLabel', 'Frist')}: {formatDate(patient.should_be_followed_up)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div className="p-6">
                <PatientMessages patientId={id} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GDPR Export Modal */}
      {showGDPRModal && (
        <GDPRExportModal patient={patient} onClose={() => setShowGDPRModal(false)} />
      )}
    </div>
  );
}
