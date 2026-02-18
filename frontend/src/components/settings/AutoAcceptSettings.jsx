/**
 * Auto-Accept Settings Component
 * Configure automatic acceptance of appointments and referrals
 */

import { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  Bell,
  AlertCircle,
  Check,
  Save,
  History,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import api from '../../services/api';

import logger from '../../utils/logger';
const AutoAcceptSettings = () => {
  // State
  const [settings, setSettings] = useState({
    autoAcceptAppointments: false,
    appointmentAcceptDelayMinutes: 0,
    appointmentTypesIncluded: [],
    appointmentTypesExcluded: [],
    appointmentMaxDailyLimit: null,
    appointmentBusinessHoursOnly: true,
    autoAcceptReferrals: false,
    referralAcceptDelayMinutes: 0,
    referralSourcesIncluded: [],
    referralSourcesExcluded: [],
    referralRequireCompleteInfo: true,
    notifyOnAutoAccept: true,
    notificationEmail: '',
    notificationSms: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [log, setLog] = useState([]);
  const [expandedSection, setExpandedSection] = useState('appointments');

  // Appointment types (these would typically come from an API)
  const appointmentTypes = [
    'Nytt møte',
    'Kontroll',
    'Behandling',
    'Akutt',
    'Telefonkonsultasjon',
    'Videokonsultasjon',
  ];

  // Referral sources
  const referralSources = [
    'Fastlege',
    'Spesialist',
    'Sykehus',
    'Fysioterapeut',
    'Annen kiropraktor',
    'Selvhenvisning',
  ];

  // Load settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auto-accept/settings');
      if (response.data.data) {
        setSettings({
          ...settings,
          ...response.data.data,
          appointmentTypesIncluded: response.data.data.appointment_types_included || [],
          appointmentTypesExcluded: response.data.data.appointment_types_excluded || [],
          referralSourcesIncluded: response.data.data.referral_sources_included || [],
          referralSourcesExcluded: response.data.data.referral_sources_excluded || [],
          autoAcceptAppointments: response.data.data.auto_accept_appointments || false,
          appointmentAcceptDelayMinutes: response.data.data.appointment_accept_delay_minutes || 0,
          appointmentMaxDailyLimit: response.data.data.appointment_max_daily_limit || null,
          appointmentBusinessHoursOnly: response.data.data.appointment_business_hours_only ?? true,
          autoAcceptReferrals: response.data.data.auto_accept_referrals || false,
          referralAcceptDelayMinutes: response.data.data.referral_accept_delay_minutes || 0,
          referralRequireCompleteInfo: response.data.data.referral_require_complete_info ?? true,
          notifyOnAutoAccept: response.data.data.notify_on_auto_accept ?? true,
          notificationEmail: response.data.data.notification_email || '',
          notificationSms: response.data.data.notification_sms || '',
        });
      }
    } catch (err) {
      logger.error('Error loading settings:', err);
      setError('Kunne ikke laste innstillinger');
    } finally {
      setLoading(false);
    }
  };

  const loadLog = async () => {
    try {
      const response = await api.get('/auto-accept/log', {
        params: { limit: 50 },
      });
      setLog(response.data.data || []);
    } catch (err) {
      logger.error('Error loading log:', err);
    }
  };

  // Save settings
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      await api.put('/auto-accept/settings', settings);

      setSuccess('Innstillinger lagret!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      logger.error('Error saving settings:', err);
      setError('Kunne ikke lagre innstillinger');
    } finally {
      setSaving(false);
    }
  };

  // Toggle array item
  const toggleArrayItem = (field, item) => {
    setSettings((prev) => {
      const array = prev[field] || [];
      const newArray = array.includes(item) ? array.filter((i) => i !== item) : [...array, item];
      return { ...prev, [field]: newArray };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Auto-godkjenning</h1>
        <p className="text-gray-600 mt-1">
          Konfigurer automatisk godkjenning av avtaler og henvisninger
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <Check className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Appointments Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'appointments' ? null : 'appointments')
            }
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <h2 className="font-medium text-gray-900">Avtaler</h2>
                <p className="text-sm text-gray-500">Automatisk bekreft nye timebestillinger</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  settings.autoAcceptAppointments
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {settings.autoAcceptAppointments ? 'Aktiv' : 'Inaktiv'}
              </span>
              {expandedSection === 'appointments' ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </button>

          {expandedSection === 'appointments' && (
            <div className="p-4 border-t border-gray-100 space-y-4">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Aktiver auto-godkjenning av avtaler
                </label>
                <button
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      autoAcceptAppointments: !prev.autoAcceptAppointments,
                    }))
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.autoAcceptAppointments ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.autoAcceptAppointments ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {settings.autoAcceptAppointments && (
                <>
                  {/* Delay */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Forsinkelse før auto-godkjenning
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.appointmentAcceptDelayMinutes}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            appointmentAcceptDelayMinutes: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg"
                        min="0"
                        max="1440"
                      />
                      <span className="text-sm text-gray-500">minutter</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Vent denne tiden før avtalen godkjennes automatisk
                    </p>
                  </div>

                  {/* Business Hours Only */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Kun i kontortid</label>
                      <p className="text-xs text-gray-500">
                        Godkjenn kun avtaler innenfor 08:00-18:00 på hverdager
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          appointmentBusinessHoursOnly: !prev.appointmentBusinessHoursOnly,
                        }))
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.appointmentBusinessHoursOnly ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings.appointmentBusinessHoursOnly ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Daily Limit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maks antall per dag (valgfritt)
                    </label>
                    <input
                      type="number"
                      value={settings.appointmentMaxDailyLimit || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          appointmentMaxDailyLimit: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        }))
                      }
                      className="w-24 px-3 py-2 border border-gray-200 rounded-lg"
                      min="1"
                      placeholder="Ingen grense"
                    />
                  </div>

                  {/* Appointment Types */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ekskluder disse avtaletypene
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {appointmentTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => toggleArrayItem('appointmentTypesExcluded', type)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            settings.appointmentTypesExcluded?.includes(type)
                              ? 'bg-red-100 text-red-700 ring-1 ring-red-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Disse avtaletypene vil kreve manuell godkjenning
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Referrals Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === 'referrals' ? null : 'referrals')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <h2 className="font-medium text-gray-900">Henvisninger</h2>
                <p className="text-sm text-gray-500">Automatisk godta innkommende henvisninger</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  settings.autoAcceptReferrals
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {settings.autoAcceptReferrals ? 'Aktiv' : 'Inaktiv'}
              </span>
              {expandedSection === 'referrals' ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </button>

          {expandedSection === 'referrals' && (
            <div className="p-4 border-t border-gray-100 space-y-4">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Aktiver auto-godkjenning av henvisninger
                </label>
                <button
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      autoAcceptReferrals: !prev.autoAcceptReferrals,
                    }))
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.autoAcceptReferrals ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.autoAcceptReferrals ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {settings.autoAcceptReferrals && (
                <>
                  {/* Delay */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Forsinkelse før auto-godkjenning
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.referralAcceptDelayMinutes}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            referralAcceptDelayMinutes: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg"
                        min="0"
                        max="1440"
                      />
                      <span className="text-sm text-gray-500">minutter</span>
                    </div>
                  </div>

                  {/* Require Complete Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Krev fullstendig informasjon
                      </label>
                      <p className="text-xs text-gray-500">
                        Godkjenn kun henvisninger med pasientnavn, henvisende lege og årsak
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          referralRequireCompleteInfo: !prev.referralRequireCompleteInfo,
                        }))
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.referralRequireCompleteInfo ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings.referralRequireCompleteInfo ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Referral Sources */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Godta kun fra disse kildene (la tom for alle)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {referralSources.map((source) => (
                        <button
                          key={source}
                          onClick={() => toggleArrayItem('referralSourcesIncluded', source)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            settings.referralSourcesIncluded?.includes(source)
                              ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {source}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Notifications Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'notifications' ? null : 'notifications')
            }
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left">
                <h2 className="font-medium text-gray-900">Varsler</h2>
                <p className="text-sm text-gray-500">Få beskjed når noe blir automatisk godkjent</p>
              </div>
            </div>
            {expandedSection === 'notifications' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSection === 'notifications' && (
            <div className="p-4 border-t border-gray-100 space-y-4">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Send varsel ved auto-godkjenning
                </label>
                <button
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      notifyOnAutoAccept: !prev.notifyOnAutoAccept,
                    }))
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.notifyOnAutoAccept ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.notifyOnAutoAccept ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {settings.notifyOnAutoAccept && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-post for varsler
                    </label>
                    <input
                      type="email"
                      value={settings.notificationEmail}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          notificationEmail: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      placeholder="eksempel@klinikk.no"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMS for varsler (valgfritt)
                    </label>
                    <input
                      type="tel"
                      value={settings.notificationSms}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          notificationSms: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      placeholder="+47 XXX XX XXX"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            onClick={() => {
              setShowLog(!showLog);
              if (!showLog) {
                loadLog();
              }
            }}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <History className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-left">
                <h2 className="font-medium text-gray-900">Aktivitetslogg</h2>
                <p className="text-sm text-gray-500">Se historikk over automatiske godkjenninger</p>
              </div>
            </div>
            {showLog ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showLog && (
            <div className="border-t border-gray-100 max-h-64 overflow-y-auto">
              {log.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">Ingen aktivitet ennå</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {log.map((entry, index) => (
                    <div key={index} className="p-3 flex items-center gap-3 text-sm">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          entry.action === 'accepted' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <div className="flex-1">
                        <span className="capitalize">{entry.resource_type}</span>{' '}
                        <span
                          className={
                            entry.action === 'accepted' ? 'text-green-700' : 'text-red-700'
                          }
                        >
                          {entry.action === 'accepted' ? 'godkjent' : 'avvist'}
                        </span>
                        {entry.reason && <span className="text-gray-500"> - {entry.reason}</span>}
                      </div>
                      <span className="text-gray-400 text-xs">
                        {new Date(entry.created_at).toLocaleString('nb-NO')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Lagrer...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Lagre innstillinger
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AutoAcceptSettings;
