import { useState } from 'react';
import { X, Mail, UserPlus, Loader2 } from 'lucide-react';

const ROLES = ['PRACTITIONER', 'ADMIN', 'RECEPTIONIST'];

export default function InviteUserModal({ isOpen, onClose, onSubmit, isLoading, t }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('PRACTITIONER');
  const [emailError, setEmailError] = useState('');

  if (!isOpen) {
    return null;
  }

  const validateEmail = (value) => {
    if (!value) {
      return t('emailRequired') || 'E-post er paakrevd';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return t('invalidEmail') || 'Ugyldig e-postadresse';
    }
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    onSubmit({ email, role });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('inviteUser')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="invite-email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t('emailNotifications') ? 'E-post' : 'Email'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder="bruker@eksempel.no"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white ${
                  emailError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                autoFocus
              />
            </div>
            {emailError && <p className="text-xs text-red-600 mt-1">{emailError}</p>}
          </div>

          <div>
            <label
              htmlFor="invite-role"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t('role') || 'Rolle'}
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('cancel') || 'Avbryt'}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {t('inviteUser')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
