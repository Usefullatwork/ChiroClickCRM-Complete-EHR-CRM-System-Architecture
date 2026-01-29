/**
 * KioskLayout - Full-screen touch-friendly wrapper for kiosk mode
 *
 * Features:
 * - No navigation/header (clean patient-facing UI)
 * - Large touch targets (min 48px)
 * - High contrast, large fonts
 * - Inactivity timeout → return to start
 * - Progress indicator
 */

import React, { useState, useEffect, useCallback } from 'react';

const IDLE_TIMEOUT = 120; // 2 minutes

export default function KioskLayout({
  children,
  step = 0,
  totalSteps = 6,
  clinicName = 'ChiroClickCRM',
  lang = 'no',
  onReset
}) {
  const [idleTime, setIdleTime] = useState(0);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  // Reset idle timer on any interaction
  const resetIdle = useCallback(() => {
    setIdleTime(0);
    setShowTimeoutWarning(false);
  }, []);

  // Idle timeout logic
  useEffect(() => {
    const timer = setInterval(() => {
      setIdleTime(prev => {
        const newTime = prev + 1;

        // Show warning at 100 seconds
        if (newTime >= IDLE_TIMEOUT - 20 && newTime < IDLE_TIMEOUT) {
          setShowTimeoutWarning(true);
        }

        // Reset at timeout
        if (newTime >= IDLE_TIMEOUT) {
          if (onReset) {
            onReset();
          } else {
            window.location.href = '/kiosk';
          }
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onReset]);

  // Global event listeners for activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, resetIdle, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdle);
      });
    };
  }, [resetIdle]);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800
                 flex flex-col items-center justify-center p-6 md:p-8 relative overflow-hidden"
      onClick={resetIdle}
      onTouchStart={resetIdle}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-teal-900/20 rounded-full blur-3xl" />
      </div>

      {/* Timeout Warning Modal */}
      {showTimeoutWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl animate-pulse">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {lang === 'no' ? 'Er du fortsatt der?' : 'Are you still there?'}
            </h2>
            <p className="text-lg text-slate-600 mb-6">
              {lang === 'no'
                ? `Skjermen tilbakestilles om ${IDLE_TIMEOUT - idleTime} sekunder`
                : `Screen will reset in ${IDLE_TIMEOUT - idleTime} seconds`}
            </p>
            <button
              onClick={resetIdle}
              className="w-full py-4 bg-teal-600 text-white text-xl font-bold rounded-2xl
                         hover:bg-teal-700 transition-colors"
            >
              {lang === 'no' ? 'Ja, jeg er her' : 'Yes, I\'m here'}
            </button>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {step > 0 && step < totalSteps && (
        <div className="w-full max-w-2xl mb-6 relative z-10">
          <div className="flex justify-between items-center">
            {Array.from({ length: totalSteps - 1 }).map((_, i) => (
              <React.Fragment key={i}>
                {/* Step circle */}
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center
                    text-lg md:text-xl font-bold transition-all duration-300
                    ${i + 1 < step
                      ? 'bg-white text-teal-600 shadow-lg'
                      : i + 1 === step
                        ? 'bg-white text-teal-600 ring-4 ring-white/50 shadow-xl scale-110'
                        : 'bg-teal-500/30 text-white/60'
                    }`}
                >
                  {i + 1 < step ? '✓' : i + 1}
                </div>

                {/* Connector line */}
                {i < totalSteps - 2 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded-full transition-colors duration-300
                      ${i + 1 < step ? 'bg-white/80' : 'bg-teal-500/30'}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Main content card */}
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6 md:p-8
                   relative z-10 min-h-[400px] flex flex-col"
      >
        {children}
      </div>

      {/* Clinic branding */}
      <div className="mt-6 text-center relative z-10">
        <div className="text-white/80 text-lg font-medium">{clinicName}</div>
        <div className="text-white/50 text-sm mt-1">
          {lang === 'no' ? 'Trykk for å begynne' : 'Tap to begin'}
        </div>
      </div>
    </div>
  );
}
