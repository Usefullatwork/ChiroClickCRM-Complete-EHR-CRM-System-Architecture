/**
 * RedFlagModal - Blocking modal for critical red flag acknowledgement
 *
 * Appears when critical-severity red flags are detected during clinical documentation.
 * Cannot be dismissed without explicit acknowledgement checkbox.
 */

import { useState } from 'react';
import { AlertTriangle, ExternalLink, ShieldX } from 'lucide-react';
// SEVERITY available from ../../services/redFlagScreeningService if needed

const LABELS = {
  no: {
    title: 'Kritiske Rode Flagg Oppdaget',
    subtitle: 'Umiddelbar handling er pakrevd',
    acknowledge: 'Bekreft og fortsett',
    referral: 'Opprett henvisning',
    checkbox: 'Jeg har vurdert rode flagg og tar ansvar for videre oppfolging',
    severity: 'Alvorlighetsgrad',
    category: 'Kategori',
    action: 'Anbefalt handling',
    flagCount: (n) => `${n} kritisk${n > 1 ? 'e' : ''} rode flagg`,
    severityLabels: {
      CRITICAL: 'Kritisk',
      HIGH: 'Hoy',
      MEDIUM: 'Moderat',
      LOW: 'Lav',
    },
  },
  en: {
    title: 'Critical Red Flags Detected',
    subtitle: 'Immediate action required',
    acknowledge: 'Acknowledge & Continue',
    referral: 'Create Referral',
    checkbox: 'I have assessed the red flags and take responsibility for follow-up',
    severity: 'Severity',
    category: 'Category',
    action: 'Recommended Action',
    flagCount: (n) => `${n} critical red flag${n > 1 ? 's' : ''}`,
    severityLabels: {
      CRITICAL: 'Critical',
      HIGH: 'High',
      MEDIUM: 'Medium',
      LOW: 'Low',
    },
  },
};

const SEVERITY_BADGE = {
  CRITICAL: 'bg-red-600 text-white',
  HIGH: 'bg-orange-500 text-white',
  MEDIUM: 'bg-yellow-500 text-white',
  LOW: 'bg-blue-500 text-white',
};

export default function RedFlagModal({
  isOpen,
  onClose,
  criticalFlags = [],
  onAcknowledge,
  onReferral,
  lang = 'no',
}) {
  const [checked, setChecked] = useState(false);
  const t = LABELS[lang] || LABELS.no;

  if (!isOpen || criticalFlags.length === 0) {
    return null;
  }

  const handleAcknowledge = () => {
    if (!checked) {
      return;
    }
    onAcknowledge?.(criticalFlags);
    setChecked(false);
    onClose?.();
  };

  const handleReferral = () => {
    onReferral?.(criticalFlags);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
    >
      {/* Backdrop - no click-outside dismiss */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl border-2 border-red-500 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-red-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-700 rounded-lg">
              <ShieldX className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t.title}</h2>
              <p className="text-red-100 text-sm">{t.subtitle}</p>
            </div>
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-700 text-red-100 text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t.flagCount(criticalFlags.length)}
            </span>
          </div>
        </div>

        {/* Flag list */}
        <div className="px-6 py-4 max-h-80 overflow-y-auto space-y-3">
          {criticalFlags.map((flag) => (
            <div key={flag.id} className="rounded-lg border-l-4 border-red-500 bg-red-50 p-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded ${
                        SEVERITY_BADGE[flag.severity] || SEVERITY_BADGE.CRITICAL
                      }`}
                    >
                      {t.severityLabels[flag.severity]}
                    </span>
                    <span className="text-xs text-gray-500">{flag.categoryLabel}</span>
                  </div>
                  <p className="text-sm font-medium text-red-800">{flag.description}</p>
                  <div className="mt-2 p-2 bg-white rounded border border-red-200">
                    <span className="text-xs font-medium text-gray-600">{t.action}:</span>
                    <p className="text-sm text-red-700 mt-0.5">{flag.action}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 space-y-3">
          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700 font-medium">{t.checkbox}</span>
          </label>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAcknowledge}
              disabled={!checked}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t.acknowledge}
            </button>
            {onReferral && (
              <button
                onClick={handleReferral}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                {t.referral}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
