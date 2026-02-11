import { User, Save, Loader2 } from 'lucide-react';

export default function ProfileSettings({
  t,
  currentUser,
  userLoading,
  editMode,
  formData,
  setFormData,
  handleEdit,
  handleCancel,
  handleSave,
  updateUserMutation,
}) {
  return (
    <div className="space-y-6">
      {userLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('userProfile')}
            </h2>
            {!editMode ? (
              <button
                onClick={() => handleEdit(currentUser)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t('edit')}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateUserMutation.isLoading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {updateUserMutation.isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('saving')}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t('save')}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                  {t('firstName')}
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 dark:text-white">
                    {currentUser.first_name || '-'}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                  {t('lastName')}
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 dark:text-white">
                    {currentUser.last_name || '-'}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                  {t('email')}
                </label>
                <p className="text-sm text-gray-900 dark:text-white">{currentUser.email || '-'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-200 mt-1">
                  {t('emailCannotChange')}
                </p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                  {t('role')}
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {currentUser.role || '-'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
