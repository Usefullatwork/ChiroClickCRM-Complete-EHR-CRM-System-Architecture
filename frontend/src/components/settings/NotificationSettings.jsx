import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { usersAPI } from '../../services/api';
import toast from '../../utils/toast';

const DEFAULT_PREFS = {
  emailNotifications: true,
  appointmentReminders: true,
  followUpNotifications: true,
  systemUpdates: false,
};

export default function NotificationSettings({ t }) {
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  const { data: userResponse, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => usersAPI.getCurrent(),
  });

  useEffect(() => {
    const saved = userResponse?.data?.user?.notification_preferences;
    if (saved && typeof saved === 'object') {
      setPrefs((prev) => ({ ...prev, ...saved }));
    }
  }, [userResponse]);

  const updateMutation = useMutation({
    mutationFn: (newPrefs) => usersAPI.update({ notification_preferences: newPrefs }),
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user']);
      toast.success(t('savedSuccessfully') || 'Lagret');
    },
    onError: () => {
      toast.error(t('saveError') || 'Kunne ikke lagre');
    },
  });

  const handleToggle = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    updateMutation.mutate(updated);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const toggles = [
    {
      key: 'emailNotifications',
      label: t('emailNotifications'),
      desc: t('emailNotificationsDesc'),
      border: true,
    },
    {
      key: 'appointmentReminders',
      label: t('appointmentReminders'),
      desc: t('appointmentRemindersDesc'),
      border: true,
    },
    {
      key: 'followUpNotifications',
      label: t('followUpNotifications'),
      desc: t('followUpNotificationsDesc'),
      border: true,
    },
    {
      key: 'systemUpdates',
      label: t('systemUpdates'),
      desc: t('systemUpdatesDesc'),
      border: false,
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('notificationPrefs')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">{t('manageNotifications')}</p>
      </div>

      <div className="p-6 space-y-4">
        {toggles.map(({ key, label, desc, border }) => (
          <div
            key={key}
            className={`flex items-center justify-between py-3 ${border ? 'border-b border-gray-100' : ''}`}
          >
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-200">{desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={prefs[key]}
                onChange={() => handleToggle(key)}
                disabled={updateMutation.isPending}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
