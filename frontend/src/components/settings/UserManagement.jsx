import { User, Users, Loader2 } from 'lucide-react';

export default function UserManagement({
  t,
  organizationUsers,
  usersLoading,
  handleInviteUser,
  inviteUserMutation,
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('orgUsers')}</h2>
        <button
          onClick={handleInviteUser}
          disabled={inviteUserMutation.isLoading}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {t('inviteUser')}
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {usersLoading ? (
          <div className="px-6 py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-sm text-gray-500 dark:text-gray-200 mt-3">{t('loadingUsers')}</p>
          </div>
        ) : organizationUsers.length > 0 ? (
          organizationUsers.map((user) => (
            <div
              key={user.id}
              className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-200">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {user.role}
                  </span>
                  {user.status && (
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        user.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-200">{t('noUsersFound')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
