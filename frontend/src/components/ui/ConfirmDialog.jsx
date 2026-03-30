import { useState, useCallback, useEffect, useRef, useId, createContext, useContext } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import LoadingButton from './LoadingButton';
import { useTranslation } from '../../i18n';

/**
 * ConfirmDialog — Replaces all browser confirm() calls.
 *
 * Two usage patterns:
 *
 * 1. Declarative: <ConfirmDialog open onConfirm onCancel ... />
 * 2. Imperative via context: const confirm = useConfirm();
 *    const ok = await confirm({ title, description });
 */

// ─── Declarative component ───────────────────────────────────

export default function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description = '',
  confirmText,
  cancelText,
  variant = 'destructive',
  loading = false,
}) {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const confirmBtnRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  const resolvedTitle = title ?? t('areYouSure');
  const resolvedConfirm = confirmText ?? t('confirm');
  const resolvedCancel = cancelText ?? t('cancel');

  // Focus restoration
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
    }
    return () => {
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus();
      }
    };
  }, [open]);

  // Auto-focus confirm button + ESC handler + focus trap
  useEffect(() => {
    if (!open || !dialogRef.current) {
      return;
    }

    // Auto-focus the confirm button
    const timer = setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 50);

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(focusableSelector);
        if (!focusable.length) {
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  const icon = variant === 'destructive' ? Trash2 : AlertTriangle;
  const Icon = icon;

  const iconBg =
    variant === 'destructive'
      ? 'bg-red-100 dark:bg-red-900/30'
      : 'bg-amber-100 dark:bg-amber-900/30';
  const iconColor =
    variant === 'destructive'
      ? 'text-red-600 dark:text-red-400'
      : 'text-amber-600 dark:text-amber-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="relative z-50 w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-soft-lg p-6 animate-slide-up"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={t('close')}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-4">
          <div
            className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}
          >
            <Icon className={`w-5 h-5 ${iconColor}`} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-gray-900 dark:text-white">
              {resolvedTitle}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {resolvedCancel}
          </button>
          <LoadingButton
            ref={confirmBtnRef}
            onClick={onConfirm}
            variant={variant}
            size="md"
            loading={loading}
          >
            {resolvedConfirm}
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}

// ─── Imperative hook via context ────────────────────────────

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setState({
          ...options,
          onConfirm: () => {
            setState(null);
            resolve(true);
          },
          onCancel: () => {
            setState(null);
            resolve(false);
          },
        });
      }),
    []
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && <ConfirmDialog open {...state} />}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return ctx;
}
