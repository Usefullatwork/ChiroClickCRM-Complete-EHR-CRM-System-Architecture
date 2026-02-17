/**
 * Provider Management Component
 *
 * Multi-provider foundation for scaling the practice:
 * - Provider profiles (name, credentials, specialty, color)
 * - Working hours and availability
 * - Role-based access control
 * - Provider-specific views and filtering
 *
 * Bilingual: English/Norwegian
 */

import { useState } from 'react';

// =============================================================================
// TRANSLATIONS
// =============================================================================

const TRANSLATIONS = {
  en: {
    providers: 'Providers',
    addProvider: 'Add Provider',
    editProvider: 'Edit Provider',
    providerDetails: 'Provider Details',
    personalInfo: 'Personal Information',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    title: 'Title',
    credentials: 'Credentials',
    specialty: 'Specialty',
    bio: 'Bio',
    color: 'Calendar Color',
    workingHours: 'Working Hours',
    availability: 'Availability',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    startTime: 'Start Time',
    endTime: 'End Time',
    closed: 'Closed',
    role: 'Role',
    permissions: 'Permissions',
    admin: 'Admin',
    practitioner: 'Practitioner',
    staff: 'Staff',
    active: 'Active',
    inactive: 'Inactive',
    status: 'Status',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this provider?',
    noProviders: 'No providers added yet',
    appointmentsToday: 'Appointments Today',
    patientsTotal: 'Total Patients',
    viewSchedule: 'View Schedule',
    viewPatients: 'View Patients',
    selectProvider: 'Select Provider',
    allProviders: 'All Providers',
    hprnumber: 'HPR Number',
    defaultDuration: 'Default Appointment Duration',
    minutes: 'minutes',
  },
  no: {
    providers: 'Behandlere',
    addProvider: 'Legg til behandler',
    editProvider: 'Rediger behandler',
    providerDetails: 'Behandlerdetaljer',
    personalInfo: 'Personlig informasjon',
    firstName: 'Fornavn',
    lastName: 'Etternavn',
    email: 'E-post',
    phone: 'Telefon',
    title: 'Tittel',
    credentials: 'Legitimasjon',
    specialty: 'Spesialitet',
    bio: 'Bio',
    color: 'Kalenderfarge',
    workingHours: 'Arbeidstider',
    availability: 'Tilgjengelighet',
    monday: 'Mandag',
    tuesday: 'Tirsdag',
    wednesday: 'Onsdag',
    thursday: 'Torsdag',
    friday: 'Fredag',
    saturday: 'Lørdag',
    sunday: 'Søndag',
    startTime: 'Starttid',
    endTime: 'Sluttid',
    closed: 'Stengt',
    role: 'Rolle',
    permissions: 'Tillatelser',
    admin: 'Administrator',
    practitioner: 'Behandler',
    staff: 'Ansatt',
    active: 'Aktiv',
    inactive: 'Inaktiv',
    status: 'Status',
    save: 'Lagre',
    cancel: 'Avbryt',
    delete: 'Slett',
    confirmDelete: 'Er du sikker på at du vil slette denne behandleren?',
    noProviders: 'Ingen behandlere lagt til ennå',
    appointmentsToday: 'Avtaler i dag',
    patientsTotal: 'Totale pasienter',
    viewSchedule: 'Se timeplan',
    viewPatients: 'Se pasienter',
    selectProvider: 'Velg behandler',
    allProviders: 'Alle behandlere',
    hprnumber: 'HPR-nummer',
    defaultDuration: 'Standard avtaletid',
    minutes: 'minutter',
  },
};

// =============================================================================
// CONSTANTS
// =============================================================================

export const ROLES = {
  ADMIN: {
    id: 'ADMIN',
    name: { en: 'Admin', no: 'Administrator' },
    description: {
      en: 'Full access to all features and settings',
      no: 'Full tilgang til alle funksjoner og innstillinger',
    },
    permissions: ['all'],
  },
  PRACTITIONER: {
    id: 'PRACTITIONER',
    name: { en: 'Practitioner', no: 'Behandler' },
    description: {
      en: 'Access to clinical features and own patients',
      no: 'Tilgang til kliniske funksjoner og egne pasienter',
    },
    permissions: [
      'patients.view',
      'patients.create',
      'patients.edit',
      'appointments.view',
      'appointments.create',
      'appointments.edit',
      'notes.view',
      'notes.create',
      'notes.edit',
      'outcomes.view',
      'outcomes.create',
    ],
  },
  STAFF: {
    id: 'STAFF',
    name: { en: 'Staff', no: 'Ansatt' },
    description: {
      en: 'Front desk and administrative tasks',
      no: 'Resepsjon og administrative oppgaver',
    },
    permissions: [
      'patients.view',
      'patients.create',
      'appointments.view',
      'appointments.create',
      'appointments.edit',
      'messages.view',
      'messages.send',
    ],
  },
};

export const PERMISSIONS = {
  'patients.view': { en: 'View patients', no: 'Se pasienter' },
  'patients.create': { en: 'Create patients', no: 'Opprette pasienter' },
  'patients.edit': { en: 'Edit patients', no: 'Redigere pasienter' },
  'patients.delete': { en: 'Delete patients', no: 'Slette pasienter' },
  'appointments.view': { en: 'View appointments', no: 'Se avtaler' },
  'appointments.create': { en: 'Create appointments', no: 'Opprette avtaler' },
  'appointments.edit': { en: 'Edit appointments', no: 'Redigere avtaler' },
  'appointments.delete': { en: 'Cancel appointments', no: 'Avlyse avtaler' },
  'notes.view': { en: 'View clinical notes', no: 'Se kliniske notater' },
  'notes.create': { en: 'Create clinical notes', no: 'Opprette kliniske notater' },
  'notes.edit': { en: 'Edit clinical notes', no: 'Redigere kliniske notater' },
  'outcomes.view': { en: 'View outcomes', no: 'Se utfall' },
  'outcomes.create': { en: 'Create outcomes', no: 'Opprette utfall' },
  'billing.view': { en: 'View billing', no: 'Se fakturering' },
  'billing.create': { en: 'Create invoices', no: 'Opprette fakturaer' },
  'reports.view': { en: 'View reports', no: 'Se rapporter' },
  'settings.view': { en: 'View settings', no: 'Se innstillinger' },
  'settings.edit': { en: 'Edit settings', no: 'Redigere innstillinger' },
  'providers.manage': { en: 'Manage providers', no: 'Administrere behandlere' },
  'messages.view': { en: 'View messages', no: 'Se meldinger' },
  'messages.send': { en: 'Send messages', no: 'Sende meldinger' },
};

export const SPECIALTIES = [
  { id: 'chiropractic', name: { en: 'Chiropractic', no: 'Kiropraktikk' } },
  { id: 'physiotherapy', name: { en: 'Physiotherapy', no: 'Fysioterapi' } },
  { id: 'massage', name: { en: 'Massage Therapy', no: 'Massasjeterapi' } },
  { id: 'acupuncture', name: { en: 'Acupuncture', no: 'Akupunktur' } },
  { id: 'sports', name: { en: 'Sports Medicine', no: 'Idrettsmedisin' } },
  { id: 'pediatric', name: { en: 'Pediatric', no: 'Barn' } },
  { id: 'prenatal', name: { en: 'Prenatal/Postnatal', no: 'Gravid/Etter fødsel' } },
];

export const CALENDAR_COLORS = [
  { id: 'blue', hex: '#3b82f6', name: { en: 'Blue', no: 'Blå' } },
  { id: 'green', hex: '#22c55e', name: { en: 'Green', no: 'Grønn' } },
  { id: 'purple', hex: '#a855f7', name: { en: 'Purple', no: 'Lilla' } },
  { id: 'orange', hex: '#f97316', name: { en: 'Orange', no: 'Oransje' } },
  { id: 'pink', hex: '#ec4899', name: { en: 'Pink', no: 'Rosa' } },
  { id: 'teal', hex: '#14b8a6', name: { en: 'Teal', no: 'Turkis' } },
  { id: 'red', hex: '#ef4444', name: { en: 'Red', no: 'Rød' } },
  { id: 'yellow', hex: '#eab308', name: { en: 'Yellow', no: 'Gul' } },
];

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DEFAULT_HOURS = {
  monday: { enabled: true, start: '08:00', end: '17:00' },
  tuesday: { enabled: true, start: '08:00', end: '17:00' },
  wednesday: { enabled: true, start: '08:00', end: '17:00' },
  thursday: { enabled: true, start: '08:00', end: '17:00' },
  friday: { enabled: true, start: '08:00', end: '17:00' },
  saturday: { enabled: false, start: '09:00', end: '14:00' },
  sunday: { enabled: false, start: '', end: '' },
};

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_PROVIDERS = [
  {
    id: 1,
    firstName: 'Olav',
    lastName: 'Nordmann',
    email: 'olav@klinikken.no',
    phone: '+47 912 34 567',
    title: 'Kiropraktor',
    credentials: 'DC, MChiro',
    hprNumber: '1234567',
    specialty: 'chiropractic',
    color: 'blue',
    role: 'ADMIN',
    status: 'active',
    defaultDuration: 30,
    workingHours: DEFAULT_HOURS,
    stats: { appointmentsToday: 8, totalPatients: 245 },
  },
  {
    id: 2,
    firstName: 'Kari',
    lastName: 'Hansen',
    email: 'kari@klinikken.no',
    phone: '+47 923 45 678',
    title: 'Kiropraktor',
    credentials: 'DC',
    hprNumber: '2345678',
    specialty: 'sports',
    color: 'green',
    role: 'PRACTITIONER',
    status: 'active',
    defaultDuration: 30,
    workingHours: {
      ...DEFAULT_HOURS,
      friday: { enabled: false, start: '', end: '' },
    },
    stats: { appointmentsToday: 6, totalPatients: 180 },
  },
];

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Provider Card
 */
function ProviderCard({ provider, onEdit, onSelect, isSelected, lang }) {
  const t = TRANSLATIONS[lang];
  const color = CALENDAR_COLORS.find((c) => c.id === provider.color);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onClick={() => onSelect?.(provider)}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
          style={{ backgroundColor: color?.hex || '#6b7280' }}
        >
          {provider.firstName[0]}
          {provider.lastName[0]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {provider.firstName} {provider.lastName}
            </h3>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                provider.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {provider.status === 'active' ? t.active : t.inactive}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {provider.title} • {provider.credentials}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {ROLES[provider.role]?.name[lang]}
          </p>
        </div>

        {/* Edit Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(provider);
          }}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✎
        </button>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {provider.stats?.appointmentsToday || 0}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{t.appointmentsToday}</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {provider.stats?.totalPatients || 0}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{t.patientsTotal}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Working Hours Editor
 */
function WorkingHoursEditor({ hours, onChange, lang }) {
  const t = TRANSLATIONS[lang];

  const handleDayChange = (day, field, value) => {
    onChange({
      ...hours,
      [day]: {
        ...hours[day],
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-3">
      {DAYS_OF_WEEK.map((day) => (
        <div key={day} className="flex items-center gap-4">
          <label className="flex items-center gap-2 w-32">
            <input
              type="checkbox"
              checked={hours[day]?.enabled || false}
              onChange={(e) => handleDayChange(day, 'enabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{t[day]}</span>
          </label>

          {hours[day]?.enabled ? (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={hours[day]?.start || '08:00'}
                onChange={(e) => handleDayChange(day, 'start', e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-gray-500">-</span>
              <input
                type="time"
                value={hours[day]?.end || '17:00'}
                onChange={(e) => handleDayChange(day, 'end', e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          ) : (
            <span className="text-sm text-gray-400">{t.closed}</span>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Provider Form
 */
function ProviderForm({ provider, onSave, onCancel, onDelete, lang }) {
  const t = TRANSLATIONS[lang];
  const isNew = !provider?.id;

  const [formData, setFormData] = useState(
    provider || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      title: '',
      credentials: '',
      hprNumber: '',
      specialty: 'chiropractic',
      color: 'blue',
      role: 'PRACTITIONER',
      status: 'active',
      defaultDuration: 30,
      workingHours: DEFAULT_HOURS,
      bio: '',
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Info */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t.personalInfo}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.firstName} *
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.lastName} *
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.email} *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.phone}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Professional Info */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t.credentials}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.title}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Kiropraktor"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.credentials}
            </label>
            <input
              type="text"
              value={formData.credentials}
              onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
              placeholder="DC, MChiro"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.hprnumber}
            </label>
            <input
              type="text"
              value={formData.hprNumber}
              onChange={(e) => setFormData({ ...formData, hprNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.specialty}
            </label>
            <select
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {SPECIALTIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name[lang]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Role & Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t.role} & {t.status}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.role}
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Object.values(ROLES).map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name[lang]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.status}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="active">{t.active}</option>
              <option value="inactive">{t.inactive}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.defaultDuration}
            </label>
            <select
              value={formData.defaultDuration}
              onChange={(e) =>
                setFormData({ ...formData, defaultDuration: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={15}>15 {t.minutes}</option>
              <option value={30}>30 {t.minutes}</option>
              <option value={45}>45 {t.minutes}</option>
              <option value={60}>60 {t.minutes}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendar Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t.color}
        </label>
        <div className="flex gap-2">
          {CALENDAR_COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => setFormData({ ...formData, color: color.id })}
              className={`w-10 h-10 rounded-full transition-all ${
                formData.color === color.id ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name[lang]}
            />
          ))}
        </div>
      </div>

      {/* Working Hours */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t.workingHours}
        </h3>
        <WorkingHoursEditor
          hours={formData.workingHours}
          onChange={(hours) => setFormData({ ...formData, workingHours: hours })}
          lang={lang}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          {!isNew && onDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm(t.confirmDelete)) {
                  onDelete(provider.id);
                }
              }}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              {t.delete}
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t.save}
          </button>
        </div>
      </div>
    </form>
  );
}

/**
 * Provider Selector (for filtering)
 */
export function ProviderSelector({ providers, selected, onChange, lang, showAll = true }) {
  const t = TRANSLATIONS[lang];

  return (
    <select
      value={selected || ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
    >
      {showAll && <option value="">{t.allProviders}</option>}
      {providers.map((provider) => (
        <option key={provider.id} value={provider.id}>
          {provider.firstName} {provider.lastName}
        </option>
      ))}
    </select>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ProviderManagement({
  providers = MOCK_PROVIDERS,
  onSave,
  onDelete,
  lang = 'en',
}) {
  const t = TRANSLATIONS[lang];
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);

  const handleEdit = (provider) => {
    setEditingProvider(provider);
    setIsEditing(true);
  };

  const handleAdd = () => {
    setEditingProvider(null);
    setIsEditing(true);
  };

  const handleSave = (data) => {
    if (onSave) {
      onSave(data);
    }
    setIsEditing(false);
    setEditingProvider(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingProvider(null);
  };

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {editingProvider ? t.editProvider : t.addProvider}
        </h2>
        <ProviderForm
          provider={editingProvider}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={onDelete}
          lang={lang}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.providers}</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + {t.addProvider}
        </button>
      </div>

      {/* Provider Grid */}
      {providers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-4xl mb-4">👥</div>
          <p className="text-gray-600 dark:text-gray-400">{t.noProviders}</p>
          <button
            onClick={handleAdd}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t.addProvider}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onEdit={handleEdit}
              onSelect={setSelectedProvider}
              isSelected={selectedProvider?.id === provider.id}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Named exports
export { ProviderCard, ProviderForm, WorkingHoursEditor };
