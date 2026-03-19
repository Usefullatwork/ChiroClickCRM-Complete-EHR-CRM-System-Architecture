/**
 * BookingRequests — Staff-facing component for managing patient booking requests
 * Displays pending/confirmed/rejected requests with approve/reject actions
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, Check, X, Loader2, Filter } from 'lucide-react';
import { portalAPI } from '../../services/api';
import { useTranslation } from '../../i18n';

const STATUS_FILTERS = [
  { key: 'PENDING', label: 'Ventende' },
  { key: 'CONFIRMED', label: 'Godkjent' },
  { key: 'REJECTED', label: 'Avvist' },
];

export default function BookingRequests() {
  const { t } = useTranslation('portal');
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('PENDING');
  const [approveFormId, setApproveFormId] = useState(null);
  const [approveData, setApproveData] = useState({ date: '', time: '' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['booking-requests', activeFilter],
    queryFn: () => portalAPI.getBookingRequests({ status: activeFilter }).then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, payload }) => portalAPI.handleBookingRequest(id, payload),
    onSuccess: () => {
      setApproveFormId(null);
      setApproveData({ date: '', time: '' });
      queryClient.invalidateQueries({ queryKey: ['booking-requests'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => portalAPI.handleBookingRequest(id, { action: 'reject' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-requests'] });
    },
  });

  const handleApprove = (id) => {
    if (!approveData.date || !approveData.time) return;
    approveMutation.mutate({
      id,
      payload: {
        action: 'approve',
        appointment_date: approveData.date,
        appointment_time: approveData.time,
        duration: 30,
        visit_type: 'consultation',
      },
    });
  };

  const requests = data?.requests || [];

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <Filter className="w-4 h-4 text-gray-400" />
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeFilter === filter.key
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t(`filter.${filter.key}`, filter.label)}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-8 text-red-500">
          {t('bookingLoadError', 'Kunne ikke laste timeforespørsler')}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && requests.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">{t('noBookingRequests', 'Ingen timeforespørsler')}</p>
        </div>
      )}

      {/* Request cards */}
      {!isLoading &&
        requests.map((req) => (
          <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">
                  {req.first_name} {req.last_name}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {req.preferred_date
                      ? new Date(req.preferred_date).toLocaleDateString('nb-NO')
                      : '-'}
                  </span>
                  {req.preferred_time_slot && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {req.preferred_time_slot}
                    </span>
                  )}
                </div>
                {req.reason && <p className="mt-2 text-sm text-gray-600">{req.reason}</p>}
                <p className="mt-1 text-xs text-gray-400">
                  {t('requestedAt', 'Forespurt')}{' '}
                  {new Date(req.created_at).toLocaleString('nb-NO', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Actions for PENDING requests */}
              {activeFilter === 'PENDING' && (
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => {
                      setApproveFormId(approveFormId === req.id ? null : req.id);
                      setApproveData({
                        date: req.preferred_date?.split('T')[0] || '',
                        time: req.preferred_time_slot || '',
                      });
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {t('approve', 'Godkjenn')}
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(req.id)}
                    disabled={rejectMutation.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    {t('reject', 'Avvis')}
                  </button>
                </div>
              )}

              {/* Status badges for non-pending */}
              {activeFilter === 'CONFIRMED' && (
                <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  {t('confirmed', 'Godkjent')}
                </span>
              )}
              {activeFilter === 'REJECTED' && (
                <span className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  {t('rejected', 'Avvist')}
                </span>
              )}
            </div>

            {/* Inline approve form */}
            {approveFormId === req.id && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-end gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {t('appointmentDate', 'Dato')}
                  </label>
                  <input
                    type="date"
                    value={approveData.date}
                    onChange={(e) => setApproveData((prev) => ({ ...prev, date: e.target.value }))}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    {t('appointmentTime', 'Tidspunkt')}
                  </label>
                  <input
                    type="time"
                    value={approveData.time}
                    onChange={(e) => setApproveData((prev) => ({ ...prev, time: e.target.value }))}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => handleApprove(req.id)}
                  disabled={!approveData.date || !approveData.time || approveMutation.isPending}
                  className="px-4 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t('confirmApproval', 'Bekreft')
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
