import { useState, useCallback, useRef, useEffect, createContext, useContext } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../../i18n';

/**
 * PromptDialog — Replaces all browser prompt() calls.
 *
 * Two usage patterns:
 *
 * 1. Declarative: <PromptDialog open onConfirm onCancel ... />
 * 2. Imperative via context: const prompt = usePrompt();
 *    const value = await prompt({ title, placeholder, defaultValue });
 *    Returns the entered string on confirm, or null on cancel.
 */

// ─── Declarative component ───────────────────────────────────

export default function PromptDialog({
  open,
  onConfirm,
  onCancel,
  title,
  placeholder = '',
  defaultValue = '',
  confirmText,
  cancelText,
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef(null);

  const resolvedTitle = title ?? t('enter');
  const resolvedConfirm = confirmText ?? t('confirm');
  const resolvedCancel = cancelText ?? t('cancel');

  // Reset value when dialog opens with a new defaultValue
  useEffect(() => {
    if (open) {
      setValue(defaultValue);
    }
  }, [open, defaultValue]);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

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
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-title"
        className="relative z-50 w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-soft-lg p-6 animate-slide-up"
        onKeyDown={handleKeyDown}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={t('close')}
        >
          <X className="w-4 h-4" />
        </button>

        <h2
          id="prompt-title"
          className="text-base font-semibold text-gray-900 dark:text-white mb-4"
        >
          {resolvedTitle}
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {resolvedCancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              {resolvedConfirm}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Imperative hook via context ────────────────────────────

const PromptContext = createContext(null);

export function PromptProvider({ children }) {
  const [state, setState] = useState(null);

  const prompt = useCallback(
    (options) =>
      new Promise((resolve) => {
        setState({
          ...options,
          onConfirm: (value) => {
            setState(null);
            resolve(value);
          },
          onCancel: () => {
            setState(null);
            resolve(null);
          },
        });
      }),
    []
  );

  return (
    <PromptContext.Provider value={prompt}>
      {children}
      {state && <PromptDialog open {...state} />}
    </PromptContext.Provider>
  );
}

export function usePrompt() {
  const ctx = useContext(PromptContext);
  if (!ctx) {
    throw new Error('usePrompt must be used within a PromptProvider');
  }
  return ctx;
}
