/**
 * UnsavedChangesDialog
 * Shows a confirmation dialog when the user tries to navigate away with unsaved changes.
 */
export default function UnsavedChangesDialog({ isBlocked, onProceed, onCancel }) {
  if (!isBlocked) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} aria-hidden="true" />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-title"
        aria-describedby="unsaved-desc"
      >
        <h2 id="unsaved-title" className="text-lg font-semibold text-gray-900 dark:text-white">
          Unsaved Changes
        </h2>
        <p id="unsaved-desc" className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          You have unsaved changes. Are you sure you want to leave this page? Your changes will be
          lost.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Stay on page
          </button>
          <button
            onClick={onProceed}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Leave page
          </button>
        </div>
      </div>
    </div>
  );
}
