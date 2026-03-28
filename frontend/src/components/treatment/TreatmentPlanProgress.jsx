/**
 * TreatmentPlanProgress - Dashboard widget showing treatment plan progress
 * Displays active plans with session completion, milestones, and quick actions
 */

import { useState, useEffect } from 'react';
import { treatmentPlansAPI } from '../../services/api';
import { useTranslation } from '../../i18n';

export default function TreatmentPlanProgress({
  patientId,
  onViewPlan,
  onNewPlan,
  compact = false,
  _lang = 'no',
}) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState(null);
  const { t } = useTranslation('exercises');

  useEffect(() => {
    if (!patientId) {
      return;
    }

    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await treatmentPlansAPI.getPatientPlans(patientId, 'active');
        setPlans(response.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [patientId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (compact && plans.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {t('treatmentPlans', 'Behandlingsplaner')}
        </h3>
        {onNewPlan && (
          <button onClick={onNewPlan} className="text-sm text-blue-600 hover:text-blue-800">
            + {t('createPlan', 'Opprett plan')}
          </button>
        )}
      </div>

      {plans.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-3">
            {t('noActivePlans', 'Ingen aktive behandlingsplaner')}
          </p>
          {onNewPlan && (
            <button
              onClick={onNewPlan}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('createPlan', 'Opprett plan')}
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {plans.map((plan) => {
            const percentage = plan.total_sessions
              ? Math.round((plan.completed_sessions / plan.total_sessions) * 100)
              : 0;

            return (
              <div key={plan.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{plan.title}</h4>
                    {plan.condition_description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {plan.condition_description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                      plan.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : plan.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {plan.status === 'active'
                      ? t('statusActive', 'Aktiv')
                      : plan.status === 'paused'
                        ? t('paused', 'Pauset')
                        : plan.status === 'draft'
                          ? t('draft', 'Utkast')
                          : plan.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>
                      {plan.completed_sessions} / {plan.total_sessions}{' '}
                      {t('sessionsLabel', 'besøk')}
                    </span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {onViewPlan && (
                  <button
                    onClick={() => onViewPlan(plan.id)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {t('viewDetails', 'Se detaljer')} &rarr;
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
