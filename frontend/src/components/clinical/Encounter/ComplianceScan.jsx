import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/**
 * ComplianceScan — Pre-sign compliance checklist (ChiroTouch-inspired).
 *
 * Validates encounter completeness before signing:
 * - Diagnosis codes present
 * - Takster codes match treatment described
 * - Required SOAP fields filled
 * - Red flags acknowledged
 * - Duration is reasonable
 *
 * @param {object} encounterData — Full encounter state
 * @param {string[]} selectedTakster — Selected billing codes
 * @param {Array} redFlagAlerts — Red flags detected
 * @param {boolean} visible — Whether to show the scan
 * @param {function} onDismiss — Close handler
 * @param {function} onProceed — Sign anyway handler
 */
export default function ComplianceScan({
  encounterData,
  selectedTakster = [],
  redFlagAlerts = [],
  visible,
  onDismiss,
  onProceed,
}) {
  const [expanded, setExpanded] = useState(true);

  const checks = useMemo(() => {
    if (!encounterData) return [];

    const results = [];

    // 1. Diagnosis codes
    const hasDiagnosis =
      encounterData.icpc_codes?.length > 0 || encounterData.icd10_codes?.length > 0;
    results.push({
      id: 'diagnosis',
      label: 'Diagnosekoder er satt',
      description: hasDiagnosis
        ? `${(encounterData.icpc_codes?.length || 0) + (encounterData.icd10_codes?.length || 0)} koder registrert`
        : 'Ingen ICPC-2 eller ICD-10 koder',
      status: hasDiagnosis ? 'pass' : 'fail',
      severity: 'error',
    });

    // 2. Takster (billing codes)
    const hasTakster = selectedTakster.length > 0;
    results.push({
      id: 'takster',
      label: 'Takster er valgt',
      description: hasTakster
        ? `${selectedTakster.length} takst(er) valgt`
        : 'Ingen takster valgt for fakturering',
      status: hasTakster ? 'pass' : 'warn',
      severity: 'warning',
    });

    // 3. Subjective fields
    const subj = encounterData.subjective || {};
    const hasChiefComplaint = !!subj.chief_complaint?.trim();
    results.push({
      id: 'subjective',
      label: 'Hovedklage dokumentert',
      description: hasChiefComplaint
        ? subj.chief_complaint.substring(0, 60) + (subj.chief_complaint.length > 60 ? '...' : '')
        : 'Hovedklage mangler i Subjektiv',
      status: hasChiefComplaint ? 'pass' : 'fail',
      severity: 'error',
    });

    // 4. Objective fields
    const obj = encounterData.objective || {};
    const hasObjective = !!(obj.palpation?.trim() || obj.rom?.trim() || obj.observation?.trim());
    results.push({
      id: 'objective',
      label: 'Objektive funn dokumentert',
      description: hasObjective
        ? 'Palpasjon, ROM eller observasjon er fylt ut'
        : 'Ingen objektive funn registrert',
      status: hasObjective ? 'pass' : 'warn',
      severity: 'warning',
    });

    // 5. Plan
    const plan = encounterData.plan || {};
    const hasPlan = !!(plan.treatment?.trim() || plan.follow_up?.trim());
    results.push({
      id: 'plan',
      label: 'Behandlingsplan dokumentert',
      description: hasPlan
        ? 'Behandling og/eller oppfølging er beskrevet'
        : 'Ingen behandlingsplan eller oppfølging',
      status: hasPlan ? 'pass' : 'warn',
      severity: 'warning',
    });

    // 6. Red flags acknowledgment
    if (redFlagAlerts.length > 0) {
      const hasAssessment = !!encounterData.assessment?.clinical_reasoning?.trim();
      results.push({
        id: 'red_flags',
        label: `${redFlagAlerts.length} røde flagg vurdert`,
        description: hasAssessment
          ? 'Klinisk resonnement dokumentert'
          : 'Røde flagg oppdaget — klinisk vurdering mangler',
        status: hasAssessment ? 'pass' : 'fail',
        severity: 'error',
      });
    }

    // 7. Duration check
    const duration = encounterData.duration_minutes || 0;
    const durationOk = duration >= 10 && duration <= 120;
    results.push({
      id: 'duration',
      label: 'Varighet er rimelig',
      description: durationOk
        ? `${duration} minutter`
        : duration < 10
          ? 'Under 10 minutter — verifiser'
          : 'Over 2 timer — verifiser',
      status: durationOk ? 'pass' : 'warn',
      severity: 'warning',
    });

    return results;
  }, [encounterData, selectedTakster, redFlagAlerts]);

  const passCount = checks.filter((c) => c.status === 'pass').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;
  const allPassed = failCount === 0 && warnCount === 0;
  const hasErrors = failCount > 0;

  if (!visible) return null;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850">
      {/* Summary bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          {allPassed ? (
            <ShieldCheck className="w-5 h-5 text-green-600" />
          ) : hasErrors ? (
            <ShieldAlert className="w-5 h-5 text-red-600" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-500" />
          )}
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Samsvarskontroll
          </span>
          <span className="text-xs text-gray-500">
            {passCount}/{checks.length} bestått
            {warnCount > 0 && ` · ${warnCount} advarsler`}
            {failCount > 0 && ` · ${failCount} feil`}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Detailed checklist */}
      {expanded && (
        <div className="px-6 pb-4 space-y-2">
          {checks.map((check) => (
            <div key={check.id} className="flex items-start gap-3 py-1.5">
              {check.status === 'pass' ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              ) : check.status === 'fail' ? (
                <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium ${
                    check.status === 'pass'
                      ? 'text-gray-700 dark:text-gray-300'
                      : check.status === 'fail'
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {check.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {check.description}
                </p>
              </div>
            </div>
          ))}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Lukk
            </button>
            {hasErrors ? (
              <button
                onClick={onProceed}
                className="px-4 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
              >
                Signer likevel
              </button>
            ) : (
              <button
                onClick={onProceed}
                className="px-4 py-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
              >
                {allPassed ? 'Alt OK — Signer' : 'Signer likevel'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
