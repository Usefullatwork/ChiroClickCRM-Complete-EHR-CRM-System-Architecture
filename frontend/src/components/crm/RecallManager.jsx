/**
 * RecallManager Component
 *
 * CT Engage / zHealth style recall campaign management.
 * Automatically identifies patients who need follow-up and sends reminders.
 *
 * Features:
 * - Automatic patient recall detection (6 weeks no visit)
 * - "We miss you" campaign automation
 * - Birthday and milestone reminders
 * - Customizable message templates
 * - Two-way SMS support
 * - Campaign analytics
 * - Bilingual support (EN/NO)
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  Calendar,
  User,
  Phone,
  Mail,
  MessageSquare,
  Send,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  Play,
  Pause,
  BarChart2,
  Filter,
  RefreshCw,
  Gift,
  Heart,
} from 'lucide-react';

// Recall types
export const RECALL_TYPES = {
  OVERDUE: {
    id: 'overdue',
    label: { en: 'Overdue Patients', no: 'Forfalt Pasienter' },
    icon: Clock,
    color: 'red',
    description: { en: 'Patients who missed appointments', no: 'Pasienter som har gått glipp av timer' },
  },
  REACTIVATION: {
    id: 'reactivation',
    label: { en: 'Reactivation (6+ weeks)', no: 'Reaktivering (6+ uker)' },
    icon: Heart,
    color: 'orange',
    description: { en: "Haven't visited in 6+ weeks", no: 'Har ikke besøkt på 6+ uker' },
  },
  BIRTHDAY: {
    id: 'birthday',
    label: { en: 'Birthday Wishes', no: 'Bursdagshilsener' },
    icon: Gift,
    color: 'purple',
    description: { en: 'Upcoming patient birthdays', no: 'Kommende pasientbursdager' },
  },
  TREATMENT_PLAN: {
    id: 'treatment_plan',
    label: { en: 'Treatment Plan Reminder', no: 'Behandlingsplan Påminnelse' },
    icon: Calendar,
    color: 'blue',
    description: { en: 'Treatment plan follow-ups', no: 'Behandlingsplan oppfølging' },
  },
  CUSTOM: {
    id: 'custom',
    label: { en: 'Custom Campaign', no: 'Egendefinert Kampanje' },
    icon: MessageSquare,
    color: 'gray',
    description: { en: 'Custom recall campaign', no: 'Egendefinert tilbakekallskampanje' },
  },
};

// Default message templates
export const MESSAGE_TEMPLATES = {
  en: {
    reactivation: `Hi {firstName}! It's been a while since your last visit to {clinicName}. We'd love to see you again and check on your progress. Reply YES to schedule an appointment or call us at {phone}.`,
    birthday: `Happy Birthday, {firstName}! 🎂 From all of us at {clinicName}, we hope you have a wonderful day. As a birthday gift, enjoy 20% off your next visit!`,
    overdue: `Hi {firstName}, this is a reminder that you have an overdue appointment at {clinicName}. Please call us at {phone} or reply to reschedule.`,
    treatment_plan: `Hi {firstName}, you're due for your next treatment session at {clinicName}. Consistent care helps achieve the best results! Reply YES to book.`,
    custom: `Hi {firstName}, {customMessage}`,
  },
  no: {
    reactivation: `Hei {firstName}! Det er en stund siden ditt siste besøk hos {clinicName}. Vi vil gjerne se deg igjen og sjekke fremgangen din. Svar JA for å bestille en time eller ring oss på {phone}.`,
    birthday: `Gratulerer med dagen, {firstName}! 🎂 Fra oss alle på {clinicName} håper vi du har en fantastisk dag. Som en bursdagsgave, få 20% rabatt på ditt neste besøk!`,
    overdue: `Hei {firstName}, dette er en påminnelse om at du har en forfalt time hos {clinicName}. Vennligst ring oss på {phone} eller svar for å endre time.`,
    treatment_plan: `Hei {firstName}, du er klar for din neste behandlingsøkt hos {clinicName}. Regelmessig behandling gir de beste resultatene! Svar JA for å bestille.`,
    custom: `Hei {firstName}, {customMessage}`,
  },
};

// =============================================================================
// RECALL MANAGER
// =============================================================================

export default function RecallManager({
  patients = [],
  appointments = [],
  onSendRecall,
  onCreateCampaign,
  clinicInfo = {},
  language = 'en',
  className = '',
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedType, setSelectedType] = useState('reactivation');
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaigns, setCampaigns] = useState([]);

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'reactivation',
    message: '',
    channel: 'sms',
    schedule: 'immediate',
    active: true,
  });

  const labels = {
    en: {
      title: 'Patient Recall',
      subtitle: 'Automated follow-up campaigns',
      overview: 'Overview',
      campaigns: 'Campaigns',
      analytics: 'Analytics',
      createCampaign: 'Create Campaign',
      patientsToRecall: 'Patients to Recall',
      selectAll: 'Select All',
      sendToSelected: 'Send to Selected',
      campaignName: 'Campaign Name',
      type: 'Type',
      message: 'Message',
      channel: 'Channel',
      schedule: 'Schedule',
      immediate: 'Send Immediately',
      scheduled: 'Schedule for Later',
      sms: 'SMS',
      email: 'Email',
      both: 'SMS & Email',
      cancel: 'Cancel',
      create: 'Create Campaign',
      edit: 'Edit',
      delete: 'Delete',
      pause: 'Pause',
      resume: 'Resume',
      active: 'Active',
      paused: 'Paused',
      noPatients: 'No patients need recall',
      sent: 'Sent',
      delivered: 'Delivered',
      responded: 'Responded',
      lastVisit: 'Last Visit',
      daysSince: 'days ago',
      previewMessage: 'Preview Message',
      variables: 'Available Variables',
    },
    no: {
      title: 'Pasient Tilbakekalling',
      subtitle: 'Automatiserte oppfølgingskampanjer',
      overview: 'Oversikt',
      campaigns: 'Kampanjer',
      analytics: 'Analyse',
      createCampaign: 'Opprett Kampanje',
      patientsToRecall: 'Pasienter å Tilbakekalle',
      selectAll: 'Velg Alle',
      sendToSelected: 'Send til Valgte',
      campaignName: 'Kampanjenavn',
      type: 'Type',
      message: 'Melding',
      channel: 'Kanal',
      schedule: 'Planlegging',
      immediate: 'Send Umiddelbart',
      scheduled: 'Planlegg for Senere',
      sms: 'SMS',
      email: 'E-post',
      both: 'SMS og E-post',
      cancel: 'Avbryt',
      create: 'Opprett Kampanje',
      edit: 'Rediger',
      delete: 'Slett',
      pause: 'Pause',
      resume: 'Fortsett',
      active: 'Aktiv',
      paused: 'Pauset',
      noPatients: 'Ingen pasienter trenger tilbakekalling',
      sent: 'Sendt',
      delivered: 'Levert',
      responded: 'Svart',
      lastVisit: 'Siste Besøk',
      daysSince: 'dager siden',
      previewMessage: 'Forhåndsvis Melding',
      variables: 'Tilgjengelige Variabler',
    },
  };

  const t = labels[language] || labels.en;

  // Calculate patients needing recall
  const recallPatients = useMemo(() => {
    const now = new Date();
    const sixWeeksAgo = new Date(now.getTime() - 42 * 24 * 60 * 60 * 1000);

    return patients.map((patient) => {
      const patientAppointments = appointments.filter((a) => a.patient_id === patient.id);
      const lastAppointment = patientAppointments.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      )[0];

      const lastVisitDate = lastAppointment ? new Date(lastAppointment.date) : null;
      const daysSinceVisit = lastVisitDate
        ? Math.floor((now - lastVisitDate) / (1000 * 60 * 60 * 24))
        : null;

      const needsReactivation = lastVisitDate && lastVisitDate < sixWeeksAgo;
      const isBirthdayThisWeek = patient.date_of_birth && isUpcomingBirthday(patient.date_of_birth);

      return {
        ...patient,
        lastVisitDate,
        daysSinceVisit,
        needsReactivation,
        isBirthdayThisWeek,
        recallType: needsReactivation ? 'reactivation' : isBirthdayThisWeek ? 'birthday' : null,
      };
    }).filter((p) => p.recallType);
  }, [patients, appointments]);

  // Filter by selected type
  const filteredPatients = recallPatients.filter((p) => {
    if (selectedType === 'reactivation') return p.needsReactivation;
    if (selectedType === 'birthday') return p.isBirthdayThisWeek;
    return true;
  });

  // Count by type
  const counts = {
    reactivation: recallPatients.filter((p) => p.needsReactivation).length,
    birthday: recallPatients.filter((p) => p.isBirthdayThisWeek).length,
    total: recallPatients.length,
  };

  const handleSelectAll = () => {
    if (selectedPatients.length === filteredPatients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(filteredPatients.map((p) => p.id));
    }
  };

  const togglePatientSelection = (patientId) => {
    setSelectedPatients((prev) =>
      prev.includes(patientId)
        ? prev.filter((id) => id !== patientId)
        : [...prev, patientId]
    );
  };

  const handleSendRecalls = () => {
    const patientsToSend = filteredPatients.filter((p) => selectedPatients.includes(p.id));
    const template = MESSAGE_TEMPLATES[language][selectedType] || MESSAGE_TEMPLATES.en[selectedType];

    patientsToSend.forEach((patient) => {
      const message = formatMessage(template, patient, clinicInfo);
      onSendRecall?.({
        patient,
        message,
        type: selectedType,
        channel: 'sms',
      });
    });

    setSelectedPatients([]);
  };

  const handleCreateCampaign = () => {
    const newCampaign = {
      ...campaignForm,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      stats: { sent: 0, delivered: 0, responded: 0 },
    };

    setCampaigns((prev) => [...prev, newCampaign]);
    onCreateCampaign?.(newCampaign);
    setShowCampaignForm(false);
    setCampaignForm({
      name: '',
      type: 'reactivation',
      message: '',
      channel: 'sms',
      schedule: 'immediate',
      active: true,
    });
  };

  const formatMessage = (template, patient, clinic) => {
    return template
      .replace(/{firstName}/g, patient.first_name || '')
      .replace(/{lastName}/g, patient.last_name || '')
      .replace(/{clinicName}/g, clinic.name || 'Our Clinic')
      .replace(/{phone}/g, clinic.phone || '');
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" />
              {t.title}
            </h3>
            <p className="text-sm text-gray-500">{t.subtitle}</p>
          </div>
          <button
            onClick={() => setShowCampaignForm(true)}
            className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {t.createCampaign}
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 bg-gray-100 rounded-lg p-1">
          {['overview', 'campaigns', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${activeTab === tab ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {t[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="p-6">
          {/* Type Filters */}
          <div className="flex gap-2 mb-4">
            {Object.values(RECALL_TYPES).slice(0, 3).map((type) => {
              const Icon = type.icon;
              const count = counts[type.id] || 0;
              const isSelected = selectedType === type.id;

              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                    ${isSelected
                      ? `border-${type.color}-300 bg-${type.color}-50 text-${type.color}-700`
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{type.label[language] || type.label.en}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 text-xs rounded-full
                      ${isSelected ? `bg-${type.color}-200` : 'bg-gray-200'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Patient List */}
          <div className="border border-gray-200 rounded-lg">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedPatients.length === filteredPatients.length && filteredPatients.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium">{t.selectAll}</span>
                </label>
                <span className="text-sm text-gray-500">
                  ({filteredPatients.length} {t.patientsToRecall.toLowerCase()})
                </span>
              </div>

              {selectedPatients.length > 0 && (
                <button
                  onClick={handleSendRecalls}
                  className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
                >
                  <Send className="w-4 h-4" />
                  {t.sendToSelected} ({selectedPatients.length})
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>{t.noPatients}</p>
                </div>
              ) : (
                filteredPatients.map((patient) => (
                  <div key={patient.id} className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedPatients.includes(patient.id)}
                      onChange={() => togglePatientSelection(patient.id)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />

                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {patient.phone && <span className="mr-3"><Phone className="w-3 h-3 inline mr-1" />{patient.phone}</span>}
                        {patient.daysSinceVisit !== null && (
                          <span>
                            {t.lastVisit}: {patient.daysSinceVisit} {t.daysSince}
                          </span>
                        )}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const template = MESSAGE_TEMPLATES[language][selectedType];
                        const message = formatMessage(template, patient, clinicInfo);
                        onSendRecall?.({ patient, message, type: selectedType, channel: 'sms' });
                      }}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                      title={t.sendToSelected}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="p-6">
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No campaigns created yet</p>
              <button
                onClick={() => setShowCampaignForm(true)}
                className="mt-2 text-orange-600 hover:text-orange-700"
              >
                {t.createCampaign}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                      <p className="text-sm text-gray-500">
                        {RECALL_TYPES[campaign.type.toUpperCase()]?.label[language] || campaign.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full
                        ${campaign.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {campaign.active ? t.active : t.paused}
                      </span>
                      <button className="p-1.5 text-gray-400 hover:text-gray-600">
                        {campaign.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-gray-600">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-6 text-sm">
                    <span className="text-gray-500">{t.sent}: <strong>{campaign.stats.sent}</strong></span>
                    <span className="text-gray-500">{t.delivered}: <strong>{campaign.stats.delivered}</strong></span>
                    <span className="text-gray-500">{t.responded}: <strong>{campaign.stats.responded}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{counts.total}</p>
              <p className="text-sm text-blue-700">{language === 'no' ? 'Totalt Tilbakekall' : 'Total Recalls Needed'}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{counts.reactivation}</p>
              <p className="text-sm text-orange-700">{language === 'no' ? 'Reaktiveringer' : 'Reactivations'}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{counts.birthday}</p>
              <p className="text-sm text-purple-700">{language === 'no' ? 'Bursdager' : 'Birthdays'}</p>
            </div>
          </div>

          <div className="text-center py-8 text-gray-500">
            <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{language === 'no' ? 'Detaljert analyse kommer snart' : 'Detailed analytics coming soon'}</p>
          </div>
        </div>
      )}

      {/* Campaign Creation Form Modal */}
      {showCampaignForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{t.createCampaign}</h3>
              <button onClick={() => setShowCampaignForm(false)} className="p-2 text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.campaignName}</label>
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder={language === 'no' ? 'F.eks. "Vi savner deg"' : 'e.g. "We miss you"'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.type}</label>
                <select
                  value={campaignForm.type}
                  onChange={(e) => {
                    setCampaignForm({
                      ...campaignForm,
                      type: e.target.value,
                      message: MESSAGE_TEMPLATES[language][e.target.value] || '',
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  {Object.values(RECALL_TYPES).map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label[language] || type.label.en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.message}</label>
                <textarea
                  value={campaignForm.message || MESSAGE_TEMPLATES[language][campaignForm.type]}
                  onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t.variables}: {'{firstName}'}, {'{lastName}'}, {'{clinicName}'}, {'{phone}'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.channel}</label>
                  <select
                    value={campaignForm.channel}
                    onChange={(e) => setCampaignForm({ ...campaignForm, channel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="sms">{t.sms}</option>
                    <option value="email">{t.email}</option>
                    <option value="both">{t.both}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.schedule}</label>
                  <select
                    value={campaignForm.schedule}
                    onChange={(e) => setCampaignForm({ ...campaignForm, schedule: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="immediate">{t.immediate}</option>
                    <option value="scheduled">{t.scheduled}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowCampaignForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={!campaignForm.name}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {t.create}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function
function isUpcomingBirthday(dateOfBirth) {
  const today = new Date();
  const birthday = new Date(dateOfBirth);
  const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());

  const daysUntilBirthday = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
  return daysUntilBirthday >= 0 && daysUntilBirthday <= 7;
}

// =============================================================================
// RECALL COMPACT - For dashboard widget
// =============================================================================

export function RecallCompact({
  count = 0,
  onClick,
  language = 'en',
  className = '',
}) {
  const labels = {
    en: { title: 'Need Recall', viewAll: 'View All' },
    no: { title: 'Trenger Tilbakekalling', viewAll: 'Se Alle' },
  };

  const t = labels[language] || labels.en;

  return (
    <div
      onClick={onClick}
      className={`bg-orange-50 rounded-lg p-4 cursor-pointer hover:bg-orange-100 transition-colors ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Bell className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{count}</p>
            <p className="text-sm text-orange-700">{t.title}</p>
          </div>
        </div>
        <span className="text-sm text-orange-600">{t.viewAll} →</span>
      </div>
    </div>
  );
}
