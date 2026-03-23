/* global process */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, MessageSquare, Mail } from 'lucide-react';
import { organizationAPI } from '../../services/api';
import { useTranslation } from '../../i18n';
import toast from '../../utils/toast';

export default function AutomatedRemindersSettings() {
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();

  const { data: orgResponse, isLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: () => organizationAPI.getCurrent(),
  });

  const orgSettings = orgResponse?.data?.organization?.settings || {};

  const [settings, setSettings] = useState({
    reminder_appointment_enabled: true,
    reminder_exercise_enabled: true,
    recall_booking_link_enabled: true,
    reminder_birthday_enabled: false,
  });

  useEffect(() => {
    if (orgResponse?.data?.organization?.settings) {
      const s = orgResponse.data.organization.settings;
      setSettings((_prev) => ({
        reminder_appointment_enabled: s.reminder_appointment_enabled !== false,
        reminder_exercise_enabled: s.reminder_exercise_enabled !== false,
        recall_booking_link_enabled: s.recall_booking_link_enabled !== false,
        reminder_birthday_enabled: s.reminder_birthday_enabled === true,
      }));
    }
  }, [orgResponse]);

  const updateMutation = useMutation({
    mutationFn: (newSettings) =>
      organizationAPI.update({ settings: { ...orgSettings, ...newSettings } }),
    onSuccess: () => {
      queryClient.invalidateQueries(['organization']);
      toast.success(t('savedSuccessfully', 'Lagret'));
    },
    onError: () => {
      toast.error(t('saveError', 'Kunne ikke lagre'));
    },
  });

  const handleToggle = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    updateMutation.mutate({ [key]: updated[key] });
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
      key: 'reminder_appointment_enabled',
      label: t('appointmentRemindersToggle', 'Timepåminnelser'),
      desc: t(
        'appointmentRemindersToggleDesc',
        'Send SMS/e-post påminnelse 24 og 48 timer før timen'
      ),
      border: true,
    },
    {
      key: 'reminder_exercise_enabled',
      label: t('exerciseRemindersToggle', 'Øvelsespåminnelser'),
      desc: t(
        'exerciseRemindersToggleDesc',
        'Send påminnelse når pasienten ikke har logget øvelser på 7 dager'
      ),
      border: true,
    },
    {
      key: 'recall_booking_link_enabled',
      label: t('recallBookingLink', 'Recall-bestillingslenke'),
      desc: t('recallBookingLinkDesc', 'Send bestillingslenke til pasienter med forfalt recall'),
      border: true,
    },
    {
      key: 'reminder_birthday_enabled',
      label: t('birthdayGreetings', 'Bursdagshilsen'),
      desc: t('birthdayGreetingsDesc', 'Send automatisk gratulasjon på bursdagen'),
      border: false,
    },
  ];

  // Provider status (mock in desktop mode)
  const providerStatus = {
    sms: process.env.NODE_ENV === 'production' ? 'Twilio' : 'Mock (skrivebordsmodus)',
    email: process.env.NODE_ENV === 'production' ? 'SMTP' : 'Mock (skrivebordsmodus)',
  };

  return (
    <div className="space-y-6">
      {/* Toggles card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('automatedReminders', 'Automatiske påminnelser')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">
            {t(
              'automatedRemindersDesc',
              'Konfigurer automatiske påminnelser og meldinger til pasienter'
            )}
          </p>
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
                  checked={settings[key]}
                  onChange={() => handleToggle(key)}
                  disabled={updateMutation.isPending}
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Provider status card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('providerStatus', 'Leverandørstatus')}
          </h2>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">SMS</p>
              <p className="text-xs text-gray-500 dark:text-gray-200">{providerStatus.sms}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">E-post</p>
              <p className="text-xs text-gray-500 dark:text-gray-200">{providerStatus.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
