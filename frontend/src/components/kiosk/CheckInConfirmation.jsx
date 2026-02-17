/**
 * CheckInConfirmation - Step 6: Success screen
 *
 * Features:
 * - Animated success confirmation
 * - Instructions for patient
 * - Auto-reset after timeout
 */

import _React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, MapPin } from 'lucide-react';

const TRANSLATIONS = {
  en: {
    title: 'Check-In Complete!',
    subtitle: 'Thank you',
    waitingMessage: 'Please have a seat in the waiting area',
    providerMessage: 'Your practitioner will be with you shortly',
    estimatedWait: 'Estimated wait time',
    minutes: 'minutes',
    newCheckIn: 'New Check-In',
    autoResetMessage: 'This screen will reset in',
    seconds: 'seconds',
  },
  no: {
    title: 'Innsjekking fullført!',
    subtitle: 'Takk',
    waitingMessage: 'Vennligst ta plass i venterommet',
    providerMessage: 'Din behandler kommer snart',
    estimatedWait: 'Estimert ventetid',
    minutes: 'minutter',
    newCheckIn: 'Ny innsjekking',
    autoResetMessage: 'Denne skjermen tilbakestilles om',
    seconds: 'sekunder',
  },
};

const AUTO_RESET_SECONDS = 15;

export default function CheckInConfirmation({
  appointment,
  onReset,
  lang = 'no',
  estimatedWaitMinutes = 5,
}) {
  const t = TRANSLATIONS[lang];
  const [countdown, setCountdown] = useState(AUTO_RESET_SECONDS);
  const [showConfetti, setShowConfetti] = useState(true);

  // Auto-reset countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onReset();
          return AUTO_RESET_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onReset]);

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-8 relative overflow-hidden">
      {/* Confetti animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                backgroundColor: ['#14b8a6', '#f59e0b', '#3b82f6', '#ec4899'][
                  Math.floor(Math.random() * 4)
                ],
              }}
            />
          ))}
        </div>
      )}

      {/* Success icon */}
      <div className="relative mb-6">
        <div
          className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center
                        animate-scale-in"
        >
          <CheckCircle2 className="w-16 h-16 text-green-600" />
        </div>
        <div
          className="absolute -bottom-2 -right-2 w-10 h-10 bg-teal-500 rounded-full
                        flex items-center justify-center text-white text-xl animate-bounce"
        >
          ✓
        </div>
      </div>

      {/* Success message */}
      <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-2 animate-fade-in">
        {t.title}
      </h1>

      {appointment && (
        <p className="text-xl text-slate-600 mb-6">
          {t.subtitle}, {appointment.firstName}!
        </p>
      )}

      {/* Instructions card */}
      <div className="w-full max-w-md bg-slate-50 rounded-2xl p-6 mb-6 animate-slide-up">
        <div className="flex items-center gap-3 text-slate-700 mb-4">
          <MapPin className="w-6 h-6 text-teal-600" />
          <p className="text-lg">{t.waitingMessage}</p>
        </div>

        <div className="flex items-center gap-3 text-slate-600">
          <Clock className="w-6 h-6 text-teal-600" />
          <p className="text-lg">{t.providerMessage}</p>
        </div>

        {estimatedWaitMinutes > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">{t.estimatedWait}</p>
            <p className="text-2xl font-bold text-teal-600">
              ~{estimatedWaitMinutes} {t.minutes}
            </p>
          </div>
        )}
      </div>

      {/* Auto-reset notice */}
      <p className="text-sm text-slate-400 mb-4">
        {t.autoResetMessage} {countdown} {t.seconds}
      </p>

      {/* Manual reset button */}
      <button
        onClick={onReset}
        className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700
                   text-lg font-medium rounded-2xl hover:bg-slate-50 hover:border-slate-300
                   transition-all"
      >
        {t.newCheckIn}
      </button>

      {/* Custom animations */}
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes scale-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out 0.2s forwards;
          opacity: 0;
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out 0.4s forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
