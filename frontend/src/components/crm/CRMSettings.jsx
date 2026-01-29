import React, { useState } from 'react';
import {
  Settings, Clock, Calendar, Mail, MessageSquare, Bell,
  Save, Plus, Trash2, Edit, Check, X, AlertCircle,
  Users, Zap, FileText, ChevronDown, ChevronRight
} from 'lucide-react';

const CRMSettings = () => {
  const [activeSection, setActiveSection] = useState('checkin');
  const [hasChanges, setHasChanges] = useState(false);

  // Check-in settings
  const [checkinSettings, setCheckinSettings] = useState({
    enabled: true,
    inactiveDays: 30,
    messageTemplate: 'Hei {name}! Det er en stund siden sist. Vi savner deg! Book din neste time på {booking_link}',
    channel: 'SMS',
    sendTime: '10:00',
    excludeWeekends: true,
    maxAttempts: 2,
    daysBetweenAttempts: 7
  });

  // Scheduled information dates
  const [scheduledDates, setScheduledDates] = useState([
    {
      id: 1,
      name: 'Nyhetsbrev Januar',
      date: '2026-01-15',
      time: '10:00',
      targetAudience: 'ALL',
      channel: 'EMAIL',
      template: 'newsletter_january',
      enabled: true
    },
    {
      id: 2,
      name: 'Påminnelse Vinterøvelser',
      date: '2026-02-01',
      time: '09:00',
      targetAudience: 'ACTIVE',
      channel: 'EMAIL',
      template: 'winter_exercises',
      enabled: true
    },
    {
      id: 3,
      name: 'Påske Hilsen',
      date: '2026-04-09',
      time: '08:00',
      targetAudience: 'ALL',
      channel: 'SMS',
      template: 'easter_greeting',
      enabled: true
    }
  ]);

  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    date: '',
    time: '10:00',
    targetAudience: 'ALL',
    channel: 'EMAIL',
    template: '',
    enabled: true
  });

  // Lifecycle thresholds
  const [lifecycleSettings, setLifecycleSettings] = useState({
    newPatientDays: 30,
    onboardingVisits: 3,
    atRiskDays: 45,
    inactiveDays: 90,
    lostDays: 180
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    appointmentReminder: true,
    appointmentReminderHours: 24,
    followUpAfterVisit: true,
    followUpHours: 48,
    birthdayGreeting: true,
    birthdayChannel: 'EMAIL',
    npsAfterVisit: true,
    npsAfterVisits: 3
  });

  const sections = [
    { id: 'checkin', label: 'Innsjekking', icon: Clock, description: 'Automatisk oppfølging av inaktive pasienter' },
    { id: 'scheduled', label: 'Planlagte Utsendelser', icon: Calendar, description: 'Planlegg informasjon til spesifikke datoer' },
    { id: 'lifecycle', label: 'Livssyklus', icon: Users, description: 'Definer når pasienter skifter status' },
    { id: 'notifications', label: 'Varsler', icon: Bell, description: 'Automatiske varsler og påminnelser' },
    { id: 'automation', label: 'Automatisering', icon: Zap, description: 'Generelle automatiseringsinnstillinger' }
  ];

  const audienceOptions = [
    { value: 'ALL', label: 'Alle pasienter' },
    { value: 'ACTIVE', label: 'Aktive pasienter' },
    { value: 'NEW', label: 'Nye pasienter (siste 30 dager)' },
    { value: 'AT_RISK', label: 'Pasienter i fare' },
    { value: 'INACTIVE', label: 'Inaktive pasienter' },
    { value: 'VIP', label: 'VIP pasienter' }
  ];

  const handleSave = () => {
    console.log('Saving settings:', { checkinSettings, scheduledDates, lifecycleSettings, notificationSettings });
    setHasChanges(false);
  };

  const handleAddSchedule = () => {
    if (!newSchedule.name || !newSchedule.date) return;

    setScheduledDates(prev => [
      ...prev,
      { ...newSchedule, id: Date.now() }
    ]);
    setNewSchedule({
      name: '',
      date: '',
      time: '10:00',
      targetAudience: 'ALL',
      channel: 'EMAIL',
      template: '',
      enabled: true
    });
    setShowAddSchedule(false);
    setHasChanges(true);
  };

  const handleDeleteSchedule = (id) => {
    setScheduledDates(prev => prev.filter(s => s.id !== id));
    setHasChanges(true);
  };

  const handleToggleSchedule = (id) => {
    setScheduledDates(prev => prev.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CRM Innstillinger</h2>
          <p className="text-gray-600">Konfigurer automatisering og pasientoppfølging</p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Lagre Endringer
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {sections.map(section => {
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
                  <Icon className={`w-5 h-5 mt-0.5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <p className={`font-medium ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>
                      {section.label}
                    </p>
                    <p className="text-xs text-gray-500">{section.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Check-in Settings */}
          {activeSection === 'checkin' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Innsjekking - Automatisk Oppfølging
              </h3>

              <div className="space-y-6">
                {/* Enable toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Aktiver automatisk innsjekking</p>
                    <p className="text-sm text-gray-500">Send automatisk melding til pasienter som ikke har vært her på en stund</p>
                  </div>
                  <button
                    onClick={() => {
                      setCheckinSettings(prev => ({ ...prev, enabled: !prev.enabled }));
                      setHasChanges(true);
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      checkinSettings.enabled ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                      checkinSettings.enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className={`space-y-4 ${!checkinSettings.enabled && 'opacity-50 pointer-events-none'}`}>
                  {/* Inactive days */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Antall dager uten besøk før innsjekking
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={checkinSettings.inactiveDays}
                        onChange={(e) => {
                          setCheckinSettings(prev => ({ ...prev, inactiveDays: parseInt(e.target.value) }));
                          setHasChanges(true);
                        }}
                        min={7}
                        max={180}
                        className="w-24 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-500">dager</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Pasienter som ikke har besøkt klinikken på {checkinSettings.inactiveDays} dager vil motta en melding
                    </p>
                  </div>

                  {/* Channel */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kommunikasjonskanal
                    </label>
                    <div className="flex gap-2">
                      {['SMS', 'EMAIL'].map(channel => (
                        <button
                          key={channel}
                          onClick={() => {
                            setCheckinSettings(prev => ({ ...prev, channel }));
                            setHasChanges(true);
                          }}
                          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                            checkinSettings.channel === channel
                              ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                              : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                          }`}
                        >
                          {channel === 'SMS' ? <MessageSquare className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                          {channel === 'SMS' ? 'SMS' : 'E-post'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Send time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sendetidspunkt
                    </label>
                    <input
                      type="time"
                      value={checkinSettings.sendTime}
                      onChange={(e) => {
                        setCheckinSettings(prev => ({ ...prev, sendTime: e.target.value }));
                        setHasChanges(true);
                      }}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Message template */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meldingsmal
                    </label>
                    <textarea
                      value={checkinSettings.messageTemplate}
                      onChange={(e) => {
                        setCheckinSettings(prev => ({ ...prev, messageTemplate: e.target.value }));
                        setHasChanges(true);
                      }}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tilgjengelige variabler: {'{name}'}, {'{first_name}'}, {'{booking_link}'}, {'{clinic_name}'}
                    </p>
                  </div>

                  {/* Max attempts */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maks antall forsøk
                      </label>
                      <input
                        type="number"
                        value={checkinSettings.maxAttempts}
                        onChange={(e) => {
                          setCheckinSettings(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) }));
                          setHasChanges(true);
                        }}
                        min={1}
                        max={5}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dager mellom forsøk
                      </label>
                      <input
                        type="number"
                        value={checkinSettings.daysBetweenAttempts}
                        onChange={(e) => {
                          setCheckinSettings(prev => ({ ...prev, daysBetweenAttempts: parseInt(e.target.value) }));
                          setHasChanges(true);
                        }}
                        min={1}
                        max={30}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Exclude weekends */}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checkinSettings.excludeWeekends}
                      onChange={(e) => {
                        setCheckinSettings(prev => ({ ...prev, excludeWeekends: e.target.checked }));
                        setHasChanges(true);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Ikke send på helger</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Scheduled Dates */}
          {activeSection === 'scheduled' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Planlagte Utsendelser
                </h3>
                <button
                  onClick={() => setShowAddSchedule(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Legg til
                </button>
              </div>

              <p className="text-gray-500 mb-6">
                Planlegg når du vil sende ut informasjon til pasientene dine. Perfekt for nyhetsbrev, sesongbaserte tips, eller helligdagshilsener.
              </p>

              {/* Scheduled list */}
              <div className="space-y-3">
                {scheduledDates.map(schedule => (
                  <div
                    key={schedule.id}
                    className={`p-4 rounded-lg border ${
                      schedule.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleToggleSchedule(schedule.id)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            schedule.enabled ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform ${
                            schedule.enabled ? 'translate-x-5' : 'translate-x-0.5'
                          }`} />
                        </button>
                        <div>
                          <p className={`font-medium ${schedule.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                            {schedule.name}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(schedule.date).toLocaleDateString('nb-NO')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {schedule.time}
                            </span>
                            <span className="flex items-center gap-1">
                              {schedule.channel === 'EMAIL' ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                              {schedule.channel}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                              {audienceOptions.find(a => a.value === schedule.targetAudience)?.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingSchedule(schedule)}
                          className="p-2 text-gray-400 hover:text-blue-500 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {scheduledDates.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Ingen planlagte utsendelser</p>
                    <button
                      onClick={() => setShowAddSchedule(true)}
                      className="mt-2 text-blue-500 hover:underline"
                    >
                      Legg til din første
                    </button>
                  </div>
                )}
              </div>

              {/* Add schedule modal */}
              {showAddSchedule && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl p-6 w-full max-w-md">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Ny Planlagt Utsendelse</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Navn</label>
                        <input
                          type="text"
                          value={newSchedule.name}
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="F.eks. 'Nyhetsbrev Februar'"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Dato</label>
                          <input
                            type="date"
                            value={newSchedule.date}
                            onChange={(e) => setNewSchedule(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tid</label>
                          <input
                            type="time"
                            value={newSchedule.time}
                            onChange={(e) => setNewSchedule(prev => ({ ...prev, time: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Målgruppe</label>
                        <select
                          value={newSchedule.targetAudience}
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, targetAudience: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {audienceOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kanal</label>
                        <div className="flex gap-2">
                          {['EMAIL', 'SMS'].map(channel => (
                            <button
                              key={channel}
                              onClick={() => setNewSchedule(prev => ({ ...prev, channel }))}
                              className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
                                newSchedule.channel === channel
                                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                                  : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                              }`}
                            >
                              {channel === 'EMAIL' ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                              {channel === 'EMAIL' ? 'E-post' : 'SMS'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setShowAddSchedule(false)}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Avbryt
                      </button>
                      <button
                        onClick={handleAddSchedule}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Legg til
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lifecycle Settings */}
          {activeSection === 'lifecycle' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Livssyklusdefinisjoner
              </h3>

              <p className="text-gray-500 mb-6">
                Definer når pasienter automatisk flyttes mellom livssyklusstadier basert på aktivitet.
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ny pasient (dager)
                    </label>
                    <input
                      type="number"
                      value={lifecycleSettings.newPatientDays}
                      onChange={(e) => {
                        setLifecycleSettings(prev => ({ ...prev, newPatientDays: parseInt(e.target.value) }));
                        setHasChanges(true);
                      }}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Pasient regnes som "ny" i {lifecycleSettings.newPatientDays} dager</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Onboarding (antall besøk)
                    </label>
                    <input
                      type="number"
                      value={lifecycleSettings.onboardingVisits}
                      onChange={(e) => {
                        setLifecycleSettings(prev => ({ ...prev, onboardingVisits: parseInt(e.target.value) }));
                        setHasChanges(true);
                      }}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Onboarding varer til {lifecycleSettings.onboardingVisits} besøk</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      I fare (dager uten besøk)
                    </label>
                    <input
                      type="number"
                      value={lifecycleSettings.atRiskDays}
                      onChange={(e) => {
                        setLifecycleSettings(prev => ({ ...prev, atRiskDays: parseInt(e.target.value) }));
                        setHasChanges(true);
                      }}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inaktiv (dager uten besøk)
                    </label>
                    <input
                      type="number"
                      value={lifecycleSettings.inactiveDays}
                      onChange={(e) => {
                        setLifecycleSettings(prev => ({ ...prev, inactiveDays: parseInt(e.target.value) }));
                        setHasChanges(true);
                      }}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tapt (dager uten besøk)
                    </label>
                    <input
                      type="number"
                      value={lifecycleSettings.lostDays}
                      onChange={(e) => {
                        setLifecycleSettings(prev => ({ ...prev, lostDays: parseInt(e.target.value) }));
                        setHasChanges(true);
                      }}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Visual representation */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-3">Livssyklusflyt:</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">Ny ({lifecycleSettings.newPatientDays}d)</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">Onboarding ({lifecycleSettings.onboardingVisits} besøk)</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">Aktiv</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">I Fare ({lifecycleSettings.atRiskDays}d)</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">Inaktiv ({lifecycleSettings.inactiveDays}d)</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full">Tapt ({lifecycleSettings.lostDays}d)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeSection === 'notifications' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-500" />
                Automatiske Varsler
              </h3>

              <div className="space-y-6">
                {/* Appointment reminder */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">Timepåminnelse</p>
                      <p className="text-sm text-gray-500">Send påminnelse før avtalt time</p>
                    </div>
                    <button
                      onClick={() => {
                        setNotificationSettings(prev => ({ ...prev, appointmentReminder: !prev.appointmentReminder }));
                        setHasChanges(true);
                      }}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notificationSettings.appointmentReminder ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        notificationSettings.appointmentReminder ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  {notificationSettings.appointmentReminder && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Send</span>
                      <input
                        type="number"
                        value={notificationSettings.appointmentReminderHours}
                        onChange={(e) => {
                          setNotificationSettings(prev => ({ ...prev, appointmentReminderHours: parseInt(e.target.value) }));
                          setHasChanges(true);
                        }}
                        className="w-20 px-3 py-1 border border-gray-200 rounded-lg text-sm"
                      />
                      <span className="text-sm text-gray-600">timer før timen</span>
                    </div>
                  )}
                </div>

                {/* Follow-up after visit */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">Oppfølging etter besøk</p>
                      <p className="text-sm text-gray-500">Send melding for å sjekke hvordan det går</p>
                    </div>
                    <button
                      onClick={() => {
                        setNotificationSettings(prev => ({ ...prev, followUpAfterVisit: !prev.followUpAfterVisit }));
                        setHasChanges(true);
                      }}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notificationSettings.followUpAfterVisit ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        notificationSettings.followUpAfterVisit ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  {notificationSettings.followUpAfterVisit && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Send</span>
                      <input
                        type="number"
                        value={notificationSettings.followUpHours}
                        onChange={(e) => {
                          setNotificationSettings(prev => ({ ...prev, followUpHours: parseInt(e.target.value) }));
                          setHasChanges(true);
                        }}
                        className="w-20 px-3 py-1 border border-gray-200 rounded-lg text-sm"
                      />
                      <span className="text-sm text-gray-600">timer etter besøk</span>
                    </div>
                  )}
                </div>

                {/* Birthday greeting */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">Bursdagshilsen</p>
                      <p className="text-sm text-gray-500">Send automatisk hilsen på pasientens bursdag</p>
                    </div>
                    <button
                      onClick={() => {
                        setNotificationSettings(prev => ({ ...prev, birthdayGreeting: !prev.birthdayGreeting }));
                        setHasChanges(true);
                      }}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notificationSettings.birthdayGreeting ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        notificationSettings.birthdayGreeting ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* NPS after visits */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">NPS undersøkelse</p>
                      <p className="text-sm text-gray-500">Send tilfredshetundersøkelse etter behandlingsserier</p>
                    </div>
                    <button
                      onClick={() => {
                        setNotificationSettings(prev => ({ ...prev, npsAfterVisit: !prev.npsAfterVisit }));
                        setHasChanges(true);
                      }}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notificationSettings.npsAfterVisit ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                        notificationSettings.npsAfterVisit ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  {notificationSettings.npsAfterVisit && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Send etter hver</span>
                      <input
                        type="number"
                        value={notificationSettings.npsAfterVisits}
                        onChange={(e) => {
                          setNotificationSettings(prev => ({ ...prev, npsAfterVisits: parseInt(e.target.value) }));
                          setHasChanges(true);
                        }}
                        className="w-20 px-3 py-1 border border-gray-200 rounded-lg text-sm"
                      />
                      <span className="text-sm text-gray-600">besøk</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Automation Settings */}
          {activeSection === 'automation' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                Automatisering
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-medium text-blue-800 mb-2">Automatiske arbeidsflyter</p>
                  <p className="text-sm text-blue-600">
                    Konfigurer detaljerte arbeidsflyter i "Automatiseringer"-seksjonen i CRM-menyen.
                  </p>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Generelle innstillinger</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600" />
                      <span className="text-sm">Aktiver alle automatiseringer</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600" />
                      <span className="text-sm">Logg alle automatiske handlinger</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                      <span className="text-sm">Send kopi av alle meldinger til klinikk-e-post</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CRMSettings;
