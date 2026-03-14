/**
 * Portal Appointments - Appointment management for patients
 * View upcoming, request new, cancel existing, past history
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  ChevronLeft,
  Plus,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  History,
} from 'lucide-react';
import { patientPortalAPI } from '../../services/api';
import { useTranslation } from '../../i18n';
import logger from '../../utils/logger';

export default function PortalAppointments() {
  const navigate = useNavigate();
  const { t } = useTranslation('appointments');
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [cancelingId, setCancelingId] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const [requestForm, setRequestForm] = useState({
    preferredDate: '',
    preferredTime: '',
    reason: '',
  });
  const [requestStatus, setRequestStatus] = useState(null);

  const VISIT_TYPE_LABELS = useMemo(
    () => ({
      initial: t('portalVisitInitial'),
      follow_up: t('portalVisitFollowUp'),
      reassessment: t('portalVisitReassessment'),
      emergency: t('portalVisitEmergency'),
      consultation: t('portalVisitConsultation'),
    }),
    [t]
  );

  const STATUS_STYLES = useMemo(
    () => ({
      scheduled: { label: t('portalStatusScheduled'), cls: 'bg-blue-100 text-blue-700' },
      confirmed: { label: t('portalStatusConfirmed'), cls: 'bg-green-100 text-green-700' },
      checked_in: { label: t('portalStatusCheckedIn'), cls: 'bg-teal-100 text-teal-700' },
      completed: {
        label: t('portalStatusCompleted'),
        cls: 'bg-gray-100 text-gray-600 dark:text-gray-300',
      },
      cancelled: { label: t('portalStatusCancelled'), cls: 'bg-red-100 text-red-600' },
      no_show: { label: t('portalStatusNoShow'), cls: 'bg-yellow-100 text-yellow-700' },
    }),
    [t]
  );

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await patientPortalAPI.getAppointments();
      setAppointments(res.data?.appointments || []);
    } catch (err) {
      logger.error('Failed to load appointments:', err);
      setError(t('portalCouldNotLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      setCancelingId(appointmentId);
      await patientPortalAPI.cancelAppointment(appointmentId);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: 'cancelled' } : a))
      );
    } catch (err) {
      logger.error('Failed to cancel appointment:', err);
      setError(t('portalCancelFailed'));
    } finally {
      setCancelingId(null);
    }
  };

  const handleRequestAppointment = async (e) => {
    e.preventDefault();
    try {
      setRequestStatus('sending');
      await patientPortalAPI.requestAppointment(requestForm);
      setRequestStatus('sent');
      setRequestForm({ preferredDate: '', preferredTime: '', reason: '' });
      setTimeout(() => {
        setShowRequestForm(false);
        setRequestStatus(null);
      }, 2000);
    } catch (err) {
      logger.error('Failed to request appointment:', err);
      setRequestStatus('error');
    }
  };

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => new Date(a.appointment_date) >= now && a.status !== 'cancelled' && a.status !== 'no_show'
  );
  const past = appointments.filter(
    (a) =>
      new Date(a.appointment_date) < now || a.status === 'cancelled' || a.status === 'completed'
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/portal')}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">{t('portalMyAppointments')}</h1>
          </div>
          <button
            onClick={() => setShowRequestForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('portalRequestAppointment')}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Request Appointment Form */}
        {showRequestForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{t('portalRequestNew')}</h2>
              <button
                onClick={() => {
                  setShowRequestForm(false);
                  setRequestStatus(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-400 dark:text-gray-300" />
              </button>
            </div>

            {requestStatus === 'sent' ? (
              <div className="text-center py-4">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="font-medium text-gray-900">{t('portalRequestSent')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('portalClinicConfirm')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestAppointment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('portalPreferredDate')}
                  </label>
                  <input
                    type="date"
                    value={requestForm.preferredDate}
                    onChange={(e) =>
                      setRequestForm((f) => ({ ...f, preferredDate: e.target.value }))
                    }
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('portalPreferredTime')}
                  </label>
                  <select
                    value={requestForm.preferredTime}
                    onChange={(e) =>
                      setRequestForm((f) => ({ ...f, preferredTime: e.target.value }))
                    }
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="">{t('portalFlexible')}</option>
                    <option value="morning">{t('portalMorning')}</option>
                    <option value="afternoon">{t('portalAfternoon')}</option>
                    <option value="evening">{t('portalEvening')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('portalAppointmentReason')}
                  </label>
                  <textarea
                    value={requestForm.reason}
                    onChange={(e) => setRequestForm((f) => ({ ...f, reason: e.target.value }))}
                    placeholder={t('portalReasonPlaceholder')}
                    rows={3}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={requestStatus === 'sending'}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {requestStatus === 'sending' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('portalSending')}
                    </>
                  ) : (
                    t('portalSendRequest')
                  )}
                </button>
                {requestStatus === 'error' && (
                  <p className="text-sm text-red-600 text-center">{t('portalSendFailed')}</p>
                )}
              </form>
            )}
          </div>
        )}

        {/* Upcoming appointments */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-1 mb-3">
            {t('portalUpcoming')}
          </h2>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
              <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">{t('portalNoUpcoming')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((appt) => {
                const style = STATUS_STYLES[appt.status] || STATUS_STYLES.scheduled;
                return (
                  <div
                    key={appt.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {new Date(appt.appointment_date).toLocaleDateString('nb-NO', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{appt.appointment_time?.slice(0, 5)}</span>
                          <span className="text-gray-300">|</span>
                          <span>
                            {VISIT_TYPE_LABELS[appt.visit_type] ||
                              appt.visit_type ||
                              t('portalVisitConsultation')}
                          </span>
                        </div>
                        <span
                          className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${style.cls}`}
                        >
                          {style.label}
                        </span>
                      </div>
                      {appt.status !== 'cancelled' && appt.status !== 'checked_in' && (
                        <button
                          onClick={() => handleCancelAppointment(appt.id)}
                          disabled={cancelingId === appt.id}
                          className="text-sm text-red-500 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded transition-colors"
                        >
                          {cancelingId === appt.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            t('portalCancel')
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Past appointments toggle */}
        {past.length > 0 && (
          <div>
            <button
              onClick={() => setShowPast(!showPast)}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 px-1 mb-3"
            >
              <History className="w-4 h-4" />
              {showPast ? t('portalHidePast') : t('portalShowPast')} {t('portalPastAppointments')} (
              {past.length})
            </button>
            {showPast && (
              <div className="space-y-2">
                {past.map((appt) => {
                  const style = STATUS_STYLES[appt.status] || STATUS_STYLES.completed;
                  return (
                    <div
                      key={appt.id}
                      className="bg-gray-50 rounded-xl border border-gray-100 p-3 opacity-70"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {new Date(appt.appointment_date).toLocaleDateString('nb-NO', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {appt.appointment_time?.slice(0, 5)} &bull;{' '}
                            {VISIT_TYPE_LABELS[appt.visit_type] || t('portalVisitConsultation')}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.cls}`}
                        >
                          {style.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-300">
        <p>{t('portalFooterContact')}</p>
      </footer>
    </div>
  );
}
