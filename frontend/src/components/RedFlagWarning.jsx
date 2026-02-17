/**
 * Red Flag Warning Components
 * Displays clinical red flag warnings detected in patient documentation
 * Critical for patient safety in Norwegian chiropractic practice
 */

import _React, { useState, useCallback } from 'react';

// Severity level configurations
const SEVERITY_CONFIG = {
  CRITICAL: {
    bgColor: 'bg-red-100',
    borderColor: 'border-red-500',
    textColor: 'text-red-800',
    iconBg: 'bg-red-500',
    icon: '🚨',
    label: 'KRITISK',
    description: 'Krever umiddelbar handling',
  },
  HIGH: {
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-800',
    iconBg: 'bg-orange-500',
    icon: '⚠️',
    label: 'HØY',
    description: 'Krever vurdering før behandling',
  },
  MEDIUM: {
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-800',
    iconBg: 'bg-yellow-500',
    icon: '⚡',
    label: 'MODERAT',
    description: 'Bør vurderes',
  },
  LOW: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-800',
    iconBg: 'bg-blue-400',
    icon: 'ℹ️',
    label: 'LAV',
    description: 'Informasjon',
  },
};

/**
 * Single Red Flag Item
 */
const RedFlagItem = ({ flag, onAcknowledge }) => {
  const config = SEVERITY_CONFIG[flag.severity] || SEVERITY_CONFIG.LOW;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${config.bgColor}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full ${config.iconBg} flex items-center justify-center text-white text-sm`}
      >
        {config.icon}
      </div>
      <div className="flex-grow min-w-0">
        <div className={`font-medium ${config.textColor}`}>{flag.description}</div>
        {flag.details && (
          <div className={`text-sm ${config.textColor} opacity-75 mt-1`}>{flag.details}</div>
        )}
        <div className="text-xs text-gray-500 mt-1">Kategori: {flag.category}</div>
      </div>
      {onAcknowledge && (
        <button
          onClick={() => onAcknowledge(flag)}
          className={`flex-shrink-0 px-2 py-1 text-xs rounded border ${config.borderColor} ${config.textColor} hover:bg-white transition-colors`}
        >
          Vurdert
        </button>
      )}
    </div>
  );
};

/**
 * Red Flag Banner (for top of encounter)
 */
export const RedFlagBanner = ({ flags, onViewAll, onAcknowledgeAll }) => {
  if (!flags || flags.length === 0) {
    return null;
  }

  const criticalCount = flags.filter((f) => f.severity === 'CRITICAL').length;
  const highCount = flags.filter((f) => f.severity === 'HIGH').length;

  const bannerConfig = criticalCount > 0 ? SEVERITY_CONFIG.CRITICAL : SEVERITY_CONFIG.HIGH;

  return (
    <div
      className={`${bannerConfig.bgColor} ${bannerConfig.borderColor} border-l-4 p-4 mb-4 rounded-r-lg`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{bannerConfig.icon}</span>
          <div>
            <div className={`font-bold ${bannerConfig.textColor}`}>
              {criticalCount > 0 ? 'Kritiske røde flagg oppdaget!' : 'Røde flagg oppdaget'}
            </div>
            <div className={`text-sm ${bannerConfig.textColor} opacity-75`}>
              {criticalCount > 0 && `${criticalCount} kritisk`}
              {criticalCount > 0 && highCount > 0 && ', '}
              {highCount > 0 && `${highCount} høy prioritet`}
              {criticalCount === 0 && highCount === 0 && `${flags.length} funn`}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onViewAll}
            className={`px-3 py-1.5 text-sm rounded ${bannerConfig.borderColor} border ${bannerConfig.textColor} hover:bg-white transition-colors`}
          >
            Se alle
          </button>
          {onAcknowledgeAll && (
            <button
              onClick={onAcknowledgeAll}
              className={`px-3 py-1.5 text-sm rounded bg-white ${bannerConfig.textColor} hover:bg-gray-50 transition-colors`}
            >
              Bekreft vurdert
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Red Flag Modal (detailed view)
 */
export const RedFlagModal = ({
  isOpen,
  flags,
  patientName,
  onClose,
  onAcknowledge,
  onReferral,
}) => {
  const [acknowledgedFlags, setAcknowledgedFlags] = useState(new Set());
  const [referralNotes, setReferralNotes] = useState('');

  const handleAcknowledge = useCallback(
    (flag) => {
      setAcknowledgedFlags((prev) => new Set([...prev, flag.id || flag.description]));
      if (onAcknowledge) {
        onAcknowledge(flag);
      }
    },
    [onAcknowledge]
  );

  const handleAcknowledgeAll = useCallback(() => {
    const allIds = flags.map((f) => f.id || f.description);
    setAcknowledgedFlags(new Set(allIds));
    if (onAcknowledge) {
      flags.forEach((f) => onAcknowledge(f));
    }
  }, [flags, onAcknowledge]);

  const hasCritical = flags?.some((f) => f.severity === 'CRITICAL');
  const allAcknowledged = flags?.every((f) => acknowledgedFlags.has(f.id || f.description));

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`px-6 py-4 rounded-t-xl ${hasCritical ? 'bg-red-600' : 'bg-orange-500'}`}>
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {hasCritical ? '🚨' : '⚠️'} Røde Flagg
              </h2>
              <p className="text-sm opacity-90">Pasient: {patientName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6">
          {/* Critical warning */}
          {hasCritical && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-4">
              <div className="font-bold text-red-800 mb-2">
                ⚠️ Kritiske funn krever umiddelbar vurdering
              </div>
              <div className="text-sm text-red-700">
                Følgende symptomer/funn kan indikere alvorlig patologi. Vurder henvisning til
                spesialist eller akuttmottak.
              </div>
            </div>
          )}

          {/* Grouped by severity */}
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => {
            const severityFlags = flags?.filter((f) => f.severity === severity) || [];
            if (severityFlags.length === 0) {
              return null;
            }

            return (
              <div key={severity} className="mb-4">
                <h3 className={`text-sm font-medium mb-2 ${SEVERITY_CONFIG[severity].textColor}`}>
                  {SEVERITY_CONFIG[severity].label} ({severityFlags.length})
                </h3>
                <div className="space-y-2">
                  {severityFlags.map((flag, idx) => (
                    <RedFlagItem
                      key={flag.id || idx}
                      flag={flag}
                      onAcknowledge={
                        acknowledgedFlags.has(flag.id || flag.description)
                          ? null
                          : handleAcknowledge
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Referral section */}
          {onReferral && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="font-medium mb-2">Henvisning</h3>
              <textarea
                value={referralNotes}
                onChange={(e) => setReferralNotes(e.target.value)}
                placeholder="Notat til henvisning..."
                className="w-full p-3 border rounded-lg text-sm resize-y min-h-[80px]"
              />
              <button
                onClick={() => onReferral(referralNotes)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Opprett henvisning
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {allAcknowledged ? (
              <span className="text-green-600">✓ Alle funn er vurdert</span>
            ) : (
              <span>
                {acknowledgedFlags.size} av {flags?.length || 0} vurdert
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {!allAcknowledged && (
              <button
                onClick={handleAcknowledgeAll}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
              >
                Bekreft alle vurdert
              </button>
            )}
            <button
              onClick={onClose}
              disabled={hasCritical && !allAcknowledged}
              className={`px-4 py-2 rounded-lg transition-colors ${
                hasCritical && !allAcknowledged
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {hasCritical && !allAcknowledged ? 'Vurder alle kritiske først' : 'Lukk'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Inline Red Flag Indicator (for use in text editor)
 */
export const InlineRedFlagIndicator = ({ flag, onClick }) => {
  const config = SEVERITY_CONFIG[flag.severity] || SEVERITY_CONFIG.LOW;

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs cursor-pointer
                  ${config.bgColor} ${config.textColor} ${config.borderColor} border`}
      title={flag.description}
    >
      {config.icon} {flag.severity === 'CRITICAL' ? 'Kritisk!' : 'Rødt flagg'}
    </span>
  );
};

/**
 * Red Flag Summary Card (for dashboard)
 */
export const RedFlagSummaryCard = ({ _patientId, patientName, flags, onClick }) => {
  if (!flags || flags.length === 0) {
    return null;
  }

  const criticalCount = flags.filter((f) => f.severity === 'CRITICAL').length;
  const highCount = flags.filter((f) => f.severity === 'HIGH').length;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
        criticalCount > 0 ? 'bg-red-50 border-red-500' : 'bg-orange-50 border-orange-500'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{patientName}</div>
          <div className="text-sm text-gray-600">
            {criticalCount > 0 && (
              <span className="text-red-600 font-medium">{criticalCount} kritisk </span>
            )}
            {highCount > 0 && <span className="text-orange-600">{highCount} høy </span>}
            <span className="text-gray-500">røde flagg</span>
          </div>
        </div>
        <span className="text-2xl">{criticalCount > 0 ? '🚨' : '⚠️'}</span>
      </div>
    </div>
  );
};

export default {
  RedFlagBanner,
  RedFlagModal,
  RedFlagItem,
  InlineRedFlagIndicator,
  RedFlagSummaryCard,
};
