import { useState, useEffect } from 'react';
import { Clock, Calendar, Bell, Save, X, AlertCircle, Users, Zap, Loader2 } from 'lucide-react';
import { crmAPI } from '../../services/api';
import logger from '../../utils/logger';

import {
  CheckinSettings,
  ScheduledDatesSettings,
  LifecycleSettings,
  NotificationSettings,
  AutomationSettings,
} from '../crm-settings';

// ---- Section navigation metadata ----

const SECTIONS = [
  {
    id: 'checkin',
    label: 'Innsjekking',
    icon: Clock,
    description: 'Automatisk oppfølging av inaktive pasienter',
  },
  {
    id: 'scheduled',
    label: 'Planlagte Utsendelser',
    icon: Calendar,
    description: 'Planlegg informasjon til spesifikke datoer',
  },
  {
    id: 'lifecycle',
    label: 'Livssyklus',
    icon: Users,
    description: 'Definer når pasienter skifter status',
  },
  {
    id: 'notifications',
    label: 'Varsler',
    icon: Bell,
    description: 'Automatiske varsler og påminnelser',
  },
  {
    id: 'automation',
    label: 'Automatisering',
    icon: Zap,
    description: 'Generelle automatiseringsinnstillinger',
  },
];

// ---- Default state values ----

const DEFAULT_CHECKIN = {
  enabled: true,
  inactiveDays: 30,
  messageTemplate:
    'Hei {name}! Det er en stund siden sist. Vi savner deg! Book din neste time på {booking_link}',
  channel: 'SMS',
  sendTime: '10:00',
  excludeWeekends: true,
  maxAttempts: 2,
  daysBetweenAttempts: 7,
};

const DEFAULT_LIFECYCLE = {
  newPatientDays: 30,
  onboardingVisits: 3,
  atRiskDays: 45,
  inactiveDays: 90,
  lostDays: 180,
};

const DEFAULT_NOTIFICATIONS = {
  appointmentReminder: true,
  appointmentReminderHours: 24,
  followUpAfterVisit: true,
  followUpHours: 48,
  birthdayGreeting: true,
  birthdayChannel: 'EMAIL',
  npsAfterVisit: true,
  npsAfterVisits: 3,
};

const DEFAULT_SCHEDULED = [
  {
    id: 1,
    name: 'Nyhetsbrev Januar',
    date: '2026-01-15',
    time: '10:00',
    targetAudience: 'ALL',
    channel: 'EMAIL',
    template: 'newsletter_january',
    enabled: true,
  },
  {
    id: 2,
    name: 'Påminnelse Vinterøvelser',
    date: '2026-02-01',
    time: '09:00',
    targetAudience: 'ACTIVE',
    channel: 'EMAIL',
    template: 'winter_exercises',
    enabled: true,
  },
  {
    id: 3,
    name: 'Påske Hilsen',
    date: '2026-04-09',
    time: '08:00',
    targetAudience: 'ALL',
    channel: 'SMS',
    template: 'easter_greeting',
    enabled: true,
  },
];

// ---- Helpers to merge API response (snake_case) into local state (camelCase) ----

function mergeCheckin(prev, src) {
  return {
    ...prev,
    enabled: src.enabled ?? prev.enabled,
    inactiveDays: src.inactive_days ?? src.inactiveDays ?? prev.inactiveDays,
    messageTemplate: src.message_template ?? src.messageTemplate ?? prev.messageTemplate,
    channel: src.channel ?? prev.channel,
    sendTime: src.send_time ?? src.sendTime ?? prev.sendTime,
    excludeWeekends: src.exclude_weekends ?? src.excludeWeekends ?? prev.excludeWeekends,
    maxAttempts: src.max_attempts ?? src.maxAttempts ?? prev.maxAttempts,
    daysBetweenAttempts:
      src.days_between_attempts ?? src.daysBetweenAttempts ?? prev.daysBetweenAttempts,
  };
}

function mergeLifecycle(prev, src) {
  return {
    ...prev,
    newPatientDays: src.new_patient_days ?? src.newPatientDays ?? prev.newPatientDays,
    onboardingVisits: src.onboarding_visits ?? src.onboardingVisits ?? prev.onboardingVisits,
    atRiskDays: src.at_risk_days ?? src.atRiskDays ?? prev.atRiskDays,
    inactiveDays: src.inactive_days ?? src.inactiveDays ?? prev.inactiveDays,
    lostDays: src.lost_days ?? src.lostDays ?? prev.lostDays,
  };
}

function mergeNotifications(prev, src) {
  return {
    ...prev,
    appointmentReminder:
      src.appointment_reminder ?? src.appointmentReminder ?? prev.appointmentReminder,
    appointmentReminderHours:
      src.appointment_reminder_hours ??
      src.appointmentReminderHours ??
      prev.appointmentReminderHours,
    followUpAfterVisit:
      src.follow_up_after_visit ?? src.followUpAfterVisit ?? prev.followUpAfterVisit,
    followUpHours: src.follow_up_hours ?? src.followUpHours ?? prev.followUpHours,
    birthdayGreeting: src.birthday_greeting ?? src.birthdayGreeting ?? prev.birthdayGreeting,
    birthdayChannel: src.birthday_channel ?? src.birthdayChannel ?? prev.birthdayChannel,
    npsAfterVisit: src.nps_after_visit ?? src.npsAfterVisit ?? prev.npsAfterVisit,
    npsAfterVisits: src.nps_after_visits ?? src.npsAfterVisits ?? prev.npsAfterVisits,
  };
}

function normalizeScheduledDates(dates) {
  return dates.map((d) => ({
    id: d.id,
    name: d.name,
    date: d.date,
    time: d.time,
    targetAudience: d.target_audience || d.targetAudience || 'ALL',
    channel: d.channel || 'EMAIL',
    template: d.template || '',
    enabled: d.enabled ?? true,
  }));
}

// ---- Orchestrator component ----

const CRMSettings = () => {
  const [activeSection, setActiveSection] = useState('checkin');
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [checkinSettings, setCheckinSettings] = useState(DEFAULT_CHECKIN);
  const [scheduledDates, setScheduledDates] = useState(DEFAULT_SCHEDULED);
  const [lifecycleSettings, setLifecycleSettings] = useState(DEFAULT_LIFECYCLE);
  const [notificationSettings, setNotificationSettings] = useState(DEFAULT_NOTIFICATIONS);

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = (await crmAPI.getSettings?.()) || { data: {} };
        const s = response.data || {};

        if (s.checkin) setCheckinSettings((prev) => mergeCheckin(prev, s.checkin));
        if (s.scheduled_dates || s.scheduledDates) {
          setScheduledDates(normalizeScheduledDates(s.scheduled_dates || s.scheduledDates));
        }
        if (s.lifecycle) setLifecycleSettings((prev) => mergeLifecycle(prev, s.lifecycle));
        if (s.notifications)
          setNotificationSettings((prev) => mergeNotifications(prev, s.notifications));
      } catch {
        // Settings API not available yet — use defaults
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // ---- Save handler ----

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await crmAPI.updateSettings?.({
        checkin: {
          enabled: checkinSettings.enabled,
          inactive_days: checkinSettings.inactiveDays,
          message_template: checkinSettings.messageTemplate,
          channel: checkinSettings.channel,
          send_time: checkinSettings.sendTime,
          exclude_weekends: checkinSettings.excludeWeekends,
          max_attempts: checkinSettings.maxAttempts,
          days_between_attempts: checkinSettings.daysBetweenAttempts,
        },
        scheduled_dates: scheduledDates.map((d) => ({
          id: d.id,
          name: d.name,
          date: d.date,
          time: d.time,
          target_audience: d.targetAudience,
          channel: d.channel,
          template: d.template,
          enabled: d.enabled,
        })),
        lifecycle: {
          new_patient_days: lifecycleSettings.newPatientDays,
          onboarding_visits: lifecycleSettings.onboardingVisits,
          at_risk_days: lifecycleSettings.atRiskDays,
          inactive_days: lifecycleSettings.inactiveDays,
          lost_days: lifecycleSettings.lostDays,
        },
        notifications: {
          appointment_reminder: notificationSettings.appointmentReminder,
          appointment_reminder_hours: notificationSettings.appointmentReminderHours,
          follow_up_after_visit: notificationSettings.followUpAfterVisit,
          follow_up_hours: notificationSettings.followUpHours,
          birthday_greeting: notificationSettings.birthdayGreeting,
          birthday_channel: notificationSettings.birthdayChannel,
          nps_after_visit: notificationSettings.npsAfterVisit,
          nps_after_visits: notificationSettings.npsAfterVisits,
        },
      });
      setHasChanges(false);
    } catch (err) {
      logger.error('Failed to save settings:', err);
      setError(err.message || 'Kunne ikke lagre innstillinger');
    } finally {
      setSaving(false);
    }
  };

  // ---- Scheduled-dates handlers ----

  const handleAddSchedule = (schedule) => {
    setScheduledDates((prev) => [...prev, schedule]);
    setHasChanges(true);
  };

  const handleDeleteSchedule = (id) => {
    setScheduledDates((prev) => prev.filter((s) => s.id !== id));
    setHasChanges(true);
  };

  const handleToggleSchedule = (id) => {
    setScheduledDates((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
    setHasChanges(true);
  };

  // ---- Loading state ----

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-300">Laster innstillinger...</span>
      </div>
    );
  }

  // ---- Active section renderer ----

  const renderSection = () => {
    switch (activeSection) {
      case 'checkin':
        return (
          <CheckinSettings
            settings={checkinSettings}
            onChange={(v) => {
              setCheckinSettings(v);
              setHasChanges(true);
            }}
          />
        );
      case 'scheduled':
        return (
          <ScheduledDatesSettings
            scheduledDates={scheduledDates}
            onAdd={handleAddSchedule}
            onDelete={handleDeleteSchedule}
            onToggle={handleToggleSchedule}
            onEdit={() => {}}
          />
        );
      case 'lifecycle':
        return (
          <LifecycleSettings
            settings={lifecycleSettings}
            onChange={(v) => {
              setLifecycleSettings(v);
              setHasChanges(true);
            }}
          />
        );
      case 'notifications':
        return (
          <NotificationSettings
            settings={notificationSettings}
            onChange={(v) => {
              setNotificationSettings(v);
              setHasChanges(true);
            }}
          />
        );
      case 'automation':
        return <AutomationSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CRM Innstillinger</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Konfigurer automatisering og pasientoppfølging
          </p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Lagrer...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Lagre Endringer
              </>
            )}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full px-4 py-3 flex items-start gap-3 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                    isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mt-0.5 ${isActive ? 'text-blue-600' : 'text-gray-400 dark:text-gray-300'}`}
                  />
                  <div>
                    <p className={`font-medium ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>
                      {section.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {section.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">{renderSection()}</div>
      </div>
    </div>
  );
};

export default CRMSettings;
