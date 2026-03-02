/**
 * NotificationDropdown - Bell icon with unread badge and notification panel.
 * Self-contained: manages own open/close state, fetches via react-query.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  BellDot,
  Check,
  CheckCheck,
  AlertTriangle,
  Calendar,
  MessageSquare,
  UserPlus,
  Shield,
  Brain,
} from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import { useTranslation } from '../../i18n';

const TYPE_ICONS = {
  APPOINTMENT_REMINDER: Calendar,
  MESSAGE_RECEIVED: MessageSquare,
  NEW_PATIENT: UserPlus,
  SECURITY_ALERT: Shield,
  AI_RETRAINING_READY: Brain,
  SYSTEM_ERROR: AlertTriangle,
};

function formatTimeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s siden`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m siden`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}t siden`;
  const days = Math.floor(hours / 24);
  return `${days}d siden`;
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  // Click-outside detection
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsAPI.getUnreadCount(),
    refetchInterval: 30_000,
    select: (res) => res.data?.count ?? 0,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationsAPI.getAll({ limit: 10 }),
    enabled: open,
    select: (res) => res.data?.notifications ?? [],
  });

  const unread = countData ?? 0;

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  const handleMarkRead = async (id) => {
    await notificationsAPI.markRead(id);
    invalidate();
  };

  const handleMarkAllRead = async () => {
    await notificationsAPI.markAllRead();
    invalidate();
  };

  const IconForType = (type) => TYPE_ICONS[type] || Bell;

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative"
        aria-label={t('notifications', 'Varsler')}
      >
        {unread > 0 ? (
          <BellDot className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        ) : (
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        )}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('notifications', 'Varsler')}
            </h3>
            {unread > 0 && (
              <span className="text-xs text-gray-500">
                {unread} {t('unread', 'uleste')}
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-center text-gray-500 dark:text-gray-400">
                {t('no_notifications', 'Ingen varsler')}
              </p>
            ) : (
              notifications.map((n) => {
                const Icon = IconForType(n.type);
                return (
                  <button
                    key={n.id}
                    onClick={() => !n.read && handleMarkRead(n.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex gap-3 ${
                      !n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mt-0.5 shrink-0 ${!n.read ? 'text-blue-500' : 'text-gray-400'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm truncate ${!n.read ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}
                      >
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {n.message}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatTimeAgo(n.created_at)}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {notifications.length > 0 && unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="w-full px-4 py-2.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              {t('mark_all_read', 'Merk alle som lest')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
