import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { formatDate, formatPhone, calculateAge } from '../../lib/utils';
import StatusBadge from '../ui/StatusBadge';
import { useTranslation } from '../../i18n';

const PREF_ICONS = {
  ok: ['text-green-600', '\u2713'],
  no: ['text-red-600', '\u2717'],
  unknown: ['text-gray-400 dark:text-gray-300', '?'],
};

function getPref(value) {
  if (value === true) {
    return PREF_ICONS.ok;
  }
  if (value === false) {
    return PREF_ICONS.no;
  }
  return PREF_ICONS.unknown;
}

function getInitials(patient) {
  const f = patient.first_name?.[0] || '';
  const l = patient.last_name?.[0] || '';
  return (f + l).toUpperCase();
}

export default function PatientChartSidebar({
  patient,
  encounters = [],
  _isEditing,
  onNavigate,
  t: tProp,
  lang: _langProp,
}) {
  const { t: tHook } = useTranslation('patients');
  const t = (key, fallback) => {
    if (tProp) {
      const result = tProp(key);
      if (result && result !== key) {
        return result;
      }
    }
    return tHook(key, fallback);
  };
  if (!patient) {
    return null;
  }

  const age = calculateAge(patient.date_of_birth);
  const hasRedFlags = patient.red_flags && patient.red_flags.length > 0;
  const totalVisits = encounters.length;
  const lastVisit =
    encounters.length > 0
      ? formatDate(
          encounters[encounters.length - 1]?.created_at || encounters[encounters.length - 1]?.date
        )
      : '-';
  const nextAppointment = patient.next_appointment
    ? formatDate(patient.next_appointment)
    : t('sidebarNone', 'Ingen');

  const [needles, adjustments, neck] = [
    getPref(patient.treatment_pref_needles),
    getPref(patient.treatment_pref_adjustments),
    getPref(patient.treatment_pref_neck_adjustments),
  ];

  return (
    <aside className="w-[300px] flex-shrink-0 h-full overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Avatar + Name + Age */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center text-xl font-bold">
          {getInitials(patient)}
        </div>
        <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white truncate max-w-full">
          {patient.first_name} {patient.last_name}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {age !== null && `${age} ${t('sidebarYears', 'år')}`}
          {patient.solvit_id && ` \u00b7 ID: ${patient.solvit_id}`}
        </p>
        <div className="mt-1.5">
          <StatusBadge
            status={patient.status || 'active'}
            label={patient.status || 'ACTIVE'}
            size="xs"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-center gap-3">
        {patient.phone && (
          <a
            href={`tel:${patient.phone}`}
            className="p-2 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300 dark:hover:bg-teal-900/50 transition-colors"
            title={t('sidebarCall', 'Ring')}
            aria-label={t('sidebarCall', 'Ring')}
          >
            <Phone className="w-4 h-4" />
          </a>
        )}
        <button
          onClick={() => onNavigate(`/patients/${patient.id}/communications`)}
          className="p-2 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300 dark:hover:bg-teal-900/50 transition-colors"
          title={t('sidebarSms', 'SMS')}
          aria-label={t('sidebarSms', 'SMS')}
        >
          <MessageSquare className="w-4 h-4" />
        </button>
        <button
          onClick={() => onNavigate(`/appointments/new?patient=${patient.id}`)}
          className="p-2 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300 dark:hover:bg-teal-900/50 transition-colors"
          title={t('sidebarBook', 'Bestill time')}
          aria-label={t('sidebarBook', 'Bestill time')}
        >
          <Calendar className="w-4 h-4" />
        </button>
        <button
          onClick={() => onNavigate(`/patients/${patient.id}/encounter`)}
          className="p-2 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300 dark:hover:bg-teal-900/50 transition-colors"
          title={t('sidebarJournal', 'Journal')}
          aria-label={t('sidebarJournal', 'Journal')}
        >
          <FileText className="w-4 h-4" />
        </button>
      </div>

      {/* Red Flags — ALWAYS visible */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        {hasRedFlags ? (
          <div className="rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 p-3">
            <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 text-sm font-medium mb-1">
              <AlertTriangle className="w-4 h-4" />
              {t('sidebarRedFlags', 'Røde flagg')}
            </div>
            <ul className="space-y-0.5">
              {patient.red_flags.map((flag, i) => (
                <li key={flag || i} className="text-xs text-red-600 dark:text-red-300 pl-5">
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-lg bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800 p-3 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">
              {t('sidebarNoRedFlags', 'Ingen røde flagg')}
            </span>
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 space-y-1.5">
        <h3 className="text-xs font-medium text-gray-400 dark:text-gray-300 uppercase tracking-wider mb-2">
          {t('sidebarContact', 'Kontakt')}
        </h3>
        {patient.phone && (
          <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-gray-300" />
            {formatPhone(patient.phone)}
          </p>
        )}
        {patient.email && (
          <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-gray-300" />
            <span className="truncate">{patient.email}</span>
          </p>
        )}
        {patient.preferred_contact && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('sidebarPreferred', 'Foretrukket')}: {patient.preferred_contact}
          </p>
        )}
      </div>

      {/* Treatment Preferences */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xs font-medium text-gray-400 dark:text-gray-300 uppercase tracking-wider mb-2">
          {t('sidebarPreferences', 'Preferanser')}
        </h3>
        <div className="space-y-1">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className={`font-medium ${needles[0]}`}>{needles[1]}</span>{' '}
            {t('sidebarPrefNeedles', 'Nåler')}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className={`font-medium ${adjustments[0]}`}>{adjustments[1]}</span>{' '}
            {t('sidebarPrefAdjustments', 'Justeringer')}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className={`font-medium ${neck[0]}`}>{neck[1]}</span>{' '}
            {t('sidebarPrefNeck', 'Nakkemanipulasjon')}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-5 py-4">
        <h3 className="text-xs font-medium text-gray-400 dark:text-gray-300 uppercase tracking-wider mb-2">
          {t('sidebarStats', 'Statistikk')}
        </h3>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">
              {t('sidebarTotalVisits', 'Besøk totalt')}
            </dt>
            <dd className="font-medium text-gray-900 dark:text-white">{totalVisits}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">
              {t('sidebarLastVisit', 'Siste besøk')}
            </dt>
            <dd className="font-medium text-gray-900 dark:text-white">{lastVisit}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">
              {t('sidebarNextAppt', 'Neste time')}
            </dt>
            <dd className="font-medium text-gray-900 dark:text-white">{nextAppointment}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t('sidebarStatus', 'Status')}</dt>
            <dd>
              <StatusBadge status={patient.status || 'active'} size="xs" />
            </dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
