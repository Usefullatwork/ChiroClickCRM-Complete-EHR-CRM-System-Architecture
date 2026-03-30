/**
 * IdentityVerify - Step 2: Verify patient identity with DOB
 *
 * Features:
 * - Date of birth input (touch-friendly)
 * - Simple verification step
 * - Security without revealing sensitive data
 */

import { useState } from 'react';
import { Loader2, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../i18n';

import logger from '../../utils/logger';

const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  no: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'],
};

export default function IdentityVerify({ appointment, onVerified, onBack, apiBase = '/api/v1' }) {
  const { t, lang } = useTranslation('kiosk');
  const months = MONTHS[lang] || MONTHS.no;

  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const isComplete = day && month && year;

  const verify = async () => {
    if (!isComplete) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Format date as YYYY-MM-DD
      const dateOfBirth = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const res = await fetch(`${apiBase}/kiosk/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          dateOfBirth,
        }),
      });

      const data = await res.json();

      if (data.verified) {
        setSuccess(true);
        // Brief delay to show success
        setTimeout(() => {
          onVerified({
            ...appointment,
            verifiedName: data.patientName,
          });
        }, 1000);
      } else {
        setError(t('verifyFailed', 'Fødselsdato stemmer ikke med våre registre'));
      }
    } catch (err) {
      logger.error('Verify error:', err);
      setError(t('verifyError', 'Bekreftelse mislyktes'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <div
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6
                        animate-bounce"
        >
          <ShieldCheck className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-green-700 mb-2">
          {t('verifySuccess', 'Identitet bekreftet!')}
        </h2>
        <p className="text-xl text-slate-600 dark:text-slate-300">
          {t('welcomeGreeting', 'Velkommen,')} {appointment.firstName}!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Back button */}
      <button
        onClick={onBack}
        className="self-start flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700
                   transition-colors mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('verifyBack', 'Tilbake')}
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
          {t('verifyTitle', 'Bekreft din identitet')}
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400">
          {t('verifySubtitle', 'Vennligst oppgi din fødselsdato')}
        </p>
        <p className="text-lg text-teal-600 font-medium mt-2">
          {appointment.firstName} {appointment.lastName}
        </p>
      </div>

      {/* Date inputs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Day */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2 text-center">
            {t('dayLabel', 'Dag')}
          </label>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="w-full text-2xl p-4 border-2 border-slate-200 rounded-xl
                       text-center focus:border-teal-500 focus:ring-4 focus:ring-teal-100
                       outline-none transition-all bg-white appearance-none"
          >
            <option value="">--</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Month */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2 text-center">
            {t('monthLabel', 'Måned')}
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full text-2xl p-4 border-2 border-slate-200 rounded-xl
                       text-center focus:border-teal-500 focus:ring-4 focus:ring-teal-100
                       outline-none transition-all bg-white appearance-none"
          >
            <option value="">--</option>
            {months.map((m, i) => (
              <option key={i + 1} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2 text-center">
            {t('yearLabel', 'År')}
          </label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full text-2xl p-4 border-2 border-slate-200 rounded-xl
                       text-center focus:border-teal-500 focus:ring-4 focus:ring-teal-100
                       outline-none transition-all bg-white appearance-none"
          >
            <option value="">--</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-medium">{error}</p>
              <p className="text-sm text-red-600 mt-1">
                {t('verifyTryAgain', 'Vennligst sjekk og prøv igjen, eller spør resepsjonen')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Verify button */}
      <button
        onClick={verify}
        disabled={!isComplete || loading}
        className="w-full py-5 md:py-6 bg-teal-600 text-white text-xl md:text-2xl font-bold
                   rounded-2xl hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed
                   transition-colors flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            {t('verifying', 'Bekrefter...')}
          </>
        ) : (
          <>
            <ShieldCheck className="w-6 h-6" />
            {t('verifyButton', 'Bekreft')}
          </>
        )}
      </button>
    </div>
  );
}
