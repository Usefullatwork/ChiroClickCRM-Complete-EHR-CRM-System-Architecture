/**
 * Red Flag Screening Panel
 *
 * Real-time red flag detection UI component with bilingual support.
 * Provides visual alerts, acknowledgement workflow, and referral actions.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Check,
  _X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Bell,
  BellOff,
  Activity,
} from 'lucide-react';
import { useRedFlagScreening } from '../../hooks/useRedFlagScreening';
import { SEVERITY, _CATEGORIES, getCategoryLabels } from '../../services/redFlagScreeningService';

// Bilingual labels
const LABELS = {
  en: {
    title: 'Red Flag Screening',
    noFlags: 'No red flags detected',
    flagsDetected: 'Red flags detected',
    criticalAlert: 'CRITICAL: Immediate action required',
    acknowledge: 'Acknowledge',
    acknowledgeAll: 'Acknowledge All',
    acknowledged: 'Acknowledged',
    viewDetails: 'View Details',
    hideDetails: 'Hide Details',
    action: 'Recommended Action',
    category: 'Category',
    severity: 'Severity',
    referral: 'Create Referral',
    copyReport: 'Copy Report',
    lastScreened: 'Last screened',
    screening: 'Screening...',
    enableAlerts: 'Enable Alerts',
    disableAlerts: 'Disable Alerts',
    severityLabels: {
      CRITICAL: 'Critical',
      HIGH: 'High',
      MEDIUM: 'Medium',
      LOW: 'Low',
    },
    summary: {
      critical: 'critical',
      high: 'high priority',
      total: 'total flags',
    },
  },
  no: {
    title: 'Rødt Flagg Screening',
    noFlags: 'Ingen røde flagg oppdaget',
    flagsDetected: 'Røde flagg oppdaget',
    criticalAlert: 'KRITISK: Umiddelbar handling påkrevd',
    acknowledge: 'Bekreft',
    acknowledgeAll: 'Bekreft Alle',
    acknowledged: 'Bekreftet',
    viewDetails: 'Vis Detaljer',
    hideDetails: 'Skjul Detaljer',
    action: 'Anbefalt Handling',
    category: 'Kategori',
    severity: 'Alvorlighetsgrad',
    referral: 'Opprett Henvisning',
    copyReport: 'Kopier Rapport',
    lastScreened: 'Sist sjekket',
    screening: 'Sjekker...',
    enableAlerts: 'Aktiver Varsler',
    disableAlerts: 'Deaktiver Varsler',
    severityLabels: {
      CRITICAL: 'Kritisk',
      HIGH: 'Høy',
      MEDIUM: 'Moderat',
      LOW: 'Lav',
    },
    summary: {
      critical: 'kritisk',
      high: 'høy prioritet',
      total: 'totalt flagg',
    },
  },
};

// Severity styling
const SEVERITY_STYLES = {
  CRITICAL: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    text: 'text-red-800',
    icon: 'text-red-600',
    badge: 'bg-red-600 text-white',
    ring: 'ring-red-500',
  },
  HIGH: {
    bg: 'bg-orange-50',
    border: 'border-orange-500',
    text: 'text-orange-800',
    icon: 'text-orange-600',
    badge: 'bg-orange-500 text-white',
    ring: 'ring-orange-500',
  },
  MEDIUM: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    text: 'text-yellow-800',
    icon: 'text-yellow-600',
    badge: 'bg-yellow-500 text-white',
    ring: 'ring-yellow-500',
  },
  LOW: {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    text: 'text-blue-800',
    icon: 'text-blue-600',
    badge: 'bg-blue-500 text-white',
    ring: 'ring-blue-500',
  },
};

/**
 * Individual Red Flag Card
 */
function RedFlagCard({ flag, isAcknowledged, onAcknowledge, lang = 'en' }) {
  const [expanded, setExpanded] = useState(false);
  const t = LABELS[lang] || LABELS.en;
  const styles = SEVERITY_STYLES[flag.severity] || SEVERITY_STYLES.LOW;

  return (
    <div
      className={`rounded-lg border-l-4 ${styles.border} ${styles.bg} overflow-hidden transition-all ${
        isAcknowledged ? 'opacity-60' : ''
      }`}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 text-xs font-bold rounded ${styles.badge}`}>
                  {t.severityLabels[flag.severity]}
                </span>
                <span className="text-xs text-gray-500">{flag.categoryLabel}</span>
              </div>
              <p className={`mt-1 font-medium ${styles.text}`}>{flag.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {!isAcknowledged && (
              <button
                onClick={() => onAcknowledge(flag.id)}
                className={`px-2 py-1 text-xs font-medium rounded border ${styles.border} ${styles.text} hover:bg-white transition-colors`}
              >
                {t.acknowledge}
              </button>
            )}
            {isAcknowledged && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <Check className="w-3 h-3" />
                {t.acknowledged}
              </span>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-white rounded transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-gray-600">{t.action}:</span>
                <p className={`text-sm mt-1 p-2 bg-white rounded border ${styles.border}`}>
                  {flag.action}
                </p>
              </div>
              {flag.matchedKeywords?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {flag.matchedKeywords.map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      "{kw}"
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Summary Badge
 */
function SummaryBadge({ summary, lang = 'en' }) {
  const t = LABELS[lang] || LABELS.en;

  if (summary.total === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">
        <ShieldCheck className="w-4 h-4" />
        <span className="text-sm font-medium">{t.noFlags}</span>
      </div>
    );
  }

  const hasCritical = summary.critical > 0;
  const hasHigh = summary.high > 0;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
        hasCritical
          ? 'bg-red-100 text-red-800'
          : hasHigh
            ? 'bg-orange-100 text-orange-800'
            : 'bg-yellow-100 text-yellow-800'
      }`}
    >
      {hasCritical ? <ShieldX className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
      <span className="text-sm font-medium">
        {summary.critical > 0 && `${summary.critical} ${t.summary.critical}`}
        {summary.critical > 0 && summary.high > 0 && ', '}
        {summary.high > 0 && `${summary.high} ${t.summary.high}`}
        {summary.critical === 0 && summary.high === 0 && `${summary.total} ${t.summary.total}`}
      </span>
    </div>
  );
}

/**
 * Main Red Flag Screening Panel
 */
export default function RedFlagScreeningPanel({
  patientData,
  textToScreen,
  onReferral,
  lang = 'en',
  compact = false,
  className = '',
}) {
  const t = LABELS[lang] || LABELS.en;
  const _categoryLabels = getCategoryLabels(lang);

  const {
    flags,
    summary,
    isScreening,
    lastScreened,
    acknowledgedFlags,
    unacknowledgedFlags,
    hasUnacknowledgedCritical,
    screenText,
    screenFullPatient,
    acknowledgeFlag,
    acknowledgeAllFlags,
  } = useRedFlagScreening({
    lang,
    autoScreen: true,
    onCriticalFlag: (criticalFlags) => {
      // Could trigger audio alert or notification here
      console.warn('Critical red flags detected:', criticalFlags);
    },
  });

  const [showAll, setShowAll] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  // Screen text when it changes
  useEffect(() => {
    if (textToScreen) {
      screenText(textToScreen);
    }
  }, [textToScreen, screenText]);

  // Screen full patient when data changes
  useEffect(() => {
    if (patientData) {
      screenFullPatient(patientData);
    }
  }, [patientData, screenFullPatient]);

  // Generate report text
  const generateReport = useCallback(() => {
    const lines = [
      lang === 'no' ? '=== RØDT FLAGG SCREENING RAPPORT ===' : '=== RED FLAG SCREENING REPORT ===',
      `${lang === 'no' ? 'Dato' : 'Date'}: ${new Date().toLocaleString(lang === 'no' ? 'nb-NO' : 'en-US')}`,
      `${lang === 'no' ? 'Totalt flagg' : 'Total flags'}: ${summary.total}`,
      `${lang === 'no' ? 'Kritiske' : 'Critical'}: ${summary.critical}`,
      `${lang === 'no' ? 'Høy prioritet' : 'High priority'}: ${summary.high}`,
      '',
      lang === 'no' ? '--- DETALJER ---' : '--- DETAILS ---',
    ];

    flags.forEach((flag) => {
      lines.push('');
      lines.push(`[${flag.severity}] ${flag.description}`);
      lines.push(`${lang === 'no' ? 'Kategori' : 'Category'}: ${flag.categoryLabel}`);
      lines.push(`${lang === 'no' ? 'Handling' : 'Action'}: ${flag.action}`);
    });

    return lines.join('\n');
  }, [flags, summary, lang]);

  const handleCopyReport = useCallback(() => {
    navigator.clipboard.writeText(generateReport());
  }, [generateReport]);

  // Compact mode - just show badge
  if (compact && summary.total === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <ShieldCheck className="w-4 h-4 text-green-600" />
        <span className="text-sm text-green-600">{t.noFlags}</span>
      </div>
    );
  }

  // Main panel
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div
        className={`px-4 py-3 border-b flex items-center justify-between ${
          hasUnacknowledgedCritical
            ? 'bg-red-600 text-white'
            : summary.high > 0
              ? 'bg-orange-500 text-white'
              : summary.total > 0
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-50 text-gray-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">{t.title}</h3>
            {isScreening && (
              <span className="text-xs opacity-80 flex items-center gap-1">
                <Activity className="w-3 h-3 animate-pulse" />
                {t.screening}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SummaryBadge summary={summary} lang={lang} />
          <button
            onClick={() => setAlertsEnabled(!alertsEnabled)}
            className={`p-1.5 rounded-lg transition-colors ${
              hasUnacknowledgedCritical ? 'hover:bg-white/20' : 'hover:bg-gray-100'
            }`}
            title={alertsEnabled ? t.disableAlerts : t.enableAlerts}
          >
            {alertsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {hasUnacknowledgedCritical && alertsEnabled && (
        <div className="px-4 py-3 bg-red-100 border-b border-red-200 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-bold text-red-800">{t.criticalAlert}</span>
          </div>
        </div>
      )}

      {/* Flags List */}
      {summary.total > 0 && (
        <div className="p-4 space-y-3">
          {/* Show critical and high first */}
          {flags
            .filter(
              (f) => f.severity === SEVERITY.CRITICAL || f.severity === SEVERITY.HIGH || showAll
            )
            .map((flag) => (
              <RedFlagCard
                key={flag.id}
                flag={flag}
                isAcknowledged={acknowledgedFlags.has(flag.id)}
                onAcknowledge={acknowledgeFlag}
                lang={lang}
              />
            ))}

          {/* Toggle for lower severity */}
          {!showAll &&
            flags.filter((f) => f.severity !== SEVERITY.CRITICAL && f.severity !== SEVERITY.HIGH)
              .length > 0 && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {t.viewDetails} ({summary.medium + summary.low} {lang === 'no' ? 'flere' : 'more'})
              </button>
            )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
            {unacknowledgedFlags.length > 0 && (
              <button
                onClick={acknowledgeAllFlags}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                {t.acknowledgeAll}
              </button>
            )}
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
              {t.copyReport}
            </button>
            {onReferral && (
              <button
                onClick={() => onReferral(flags)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {t.referral}
              </button>
            )}
          </div>
        </div>
      )}

      {/* No flags */}
      {summary.total === 0 && (
        <div className="p-6 text-center">
          <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <p className="text-green-700 font-medium">{t.noFlags}</p>
          {lastScreened && (
            <p className="text-xs text-gray-500 mt-1">
              {t.lastScreened}:{' '}
              {new Date(lastScreened).toLocaleTimeString(lang === 'no' ? 'nb-NO' : 'en-US')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Export sub-components
export { RedFlagCard, SummaryBadge };
