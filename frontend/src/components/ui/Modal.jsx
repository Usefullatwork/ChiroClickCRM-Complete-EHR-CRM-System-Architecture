import { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../../i18n';

export const Modal = ({ isOpen, onClose, title, description, children, size = 'md', footer }) => {
  const { t } = useTranslation('common');
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4',
  };

  const titleId = useId();
  const descId = useId();
  const modalRef = useRef(null);
  const triggerRef = useRef(null);

  // Focus restoration
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
    }
    return () => {
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus();
      }
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) {
      return;
    }
    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusable = modalRef.current.querySelectorAll(focusableSelector);
    if (focusable.length) {
      focusable[0].focus();
    }

    const handleTab = (e) => {
      if (e.key !== 'Tab') {
        return;
      }
      const currentFocusable = modalRef.current.querySelectorAll(focusableSelector);
      if (!currentFocusable.length) {
        return;
      }
      const first = currentFocusable[0];
      const last = currentFocusable[currentFocusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 id={titleId} className="text-xl font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label={t('close', 'Lukk')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-900">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
