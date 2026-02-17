/**
 * Scheduler Decisions Component
 * Displays AI scheduling recommendations with approve/dismiss actions.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulerAPI } from '../../services/api';

const SchedulerDecisions = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('pending'); // pending | approved | dismissed

  const { data: decisionsData, isLoading } = useQuery({
    queryKey: ['scheduler-decisions', filter],
    queryFn: () => schedulerAPI.getDecisions({ status: filter }),
    retry: false,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, action }) => schedulerAPI.resolveDecision(id, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduler-decisions']);
    },
  });

  const handleApprove = (id) => resolveMutation.mutate({ id, action: 'approve' });
  const handleDismiss = (id) => resolveMutation.mutate({ id, action: 'dismiss' });

  const handleBatchApprove = () => {
    const decisions = decisionsData?.data || [];
    decisions.forEach((d) => {
      if (d.status === 'pending') {
        resolveMutation.mutate({ id: d.id, action: 'approve' });
      }
    });
  };

  const decisions = decisionsData?.data || [];

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-800">Planleggingsbeslutninger</h3>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded px-2 py-1"
          >
            <option value="pending">Ventende</option>
            <option value="approved">Godkjent</option>
            <option value="dismissed">Avvist</option>
          </select>
          {filter === 'pending' && decisions.length > 0 && (
            <button
              onClick={handleBatchApprove}
              className="text-xs px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
            >
              Godkjenn alle
            </button>
          )}
        </div>
      </div>

      {decisions.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-500">
          {filter === 'pending'
            ? 'Ingen ventende beslutninger.'
            : `Ingen ${filter === 'approved' ? 'godkjente' : 'avviste'} beslutninger.`}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {decisions.map((decision) => (
            <li key={decision.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">
                    {decision.title || decision.type || 'Anbefaling'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {decision.description || decision.reason || 'Ingen beskrivelse'}
                  </p>
                  {decision.patient_name && (
                    <p className="text-xs text-slate-400 mt-1">Pasient: {decision.patient_name}</p>
                  )}
                  {decision.suggested_time && (
                    <p className="text-xs text-teal-600 mt-1">
                      Foreslått tid: {new Date(decision.suggested_time).toLocaleString('no-NO')}
                    </p>
                  )}
                </div>
                {filter === 'pending' && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(decision.id)}
                      disabled={resolveMutation.isPending}
                      className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
                    >
                      Godkjenn
                    </button>
                    <button
                      onClick={() => handleDismiss(decision.id)}
                      disabled={resolveMutation.isPending}
                      className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                      Avvis
                    </button>
                  </div>
                )}
                {filter !== 'pending' && (
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      filter === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {filter === 'approved' ? 'Godkjent' : 'Avvist'}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SchedulerDecisions;
