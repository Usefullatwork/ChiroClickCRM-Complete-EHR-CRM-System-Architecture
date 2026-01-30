/**
 * Offline Indicator Component
 *
 * Shows the current online/offline status to patients.
 * Features:
 * - Clear visual indicator when offline
 * - Pending sync count badge
 * - Animated transitions
 * - Dismissable notification
 * - Auto-hide when back online
 *
 * Bilingual: English/Norwegian
 */

import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  RefreshCw,
  Check,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';

// =============================================================================
// TRANSLATIONS
// =============================================================================

const TRANSLATIONS = {
  no: {
    offline: 'Du er frakoblet',
    offlineDesc: 'Ovelsene dine er fortsatt tilgjengelige',
    online: 'Du er tilkoblet',
    syncing: 'Synkroniserer...',
    syncComplete: 'Synkronisering fullfort',
    syncFailed: 'Synkronisering feilet',
    pendingSync: 'endringer venter pa synkronisering',
    pendingSyncSingle: 'endring venter pa synkronisering',
    viewDetails: 'Vis detaljer',
    hideDetails: 'Skjul detaljer',
    retry: 'Prov igjen',
    dismiss: 'Lukk',
    lastSynced: 'Sist synkronisert',
    never: 'Aldri',
    offlineFeatures: 'Tilgjengelig offline:',
    viewExercises: 'Se ovelser',
    trackProgress: 'Registrer fremgang',
    cachedVideos: 'bufrede videoer'
  },
  en: {
    offline: 'You are offline',
    offlineDesc: 'Your exercises are still available',
    online: 'You are online',
    syncing: 'Syncing...',
    syncComplete: 'Sync complete',
    syncFailed: 'Sync failed',
    pendingSync: 'changes waiting to sync',
    pendingSyncSingle: 'change waiting to sync',
    viewDetails: 'View details',
    hideDetails: 'Hide details',
    retry: 'Retry',
    dismiss: 'Dismiss',
    lastSynced: 'Last synced',
    never: 'Never',
    offlineFeatures: 'Available offline:',
    viewExercises: 'View exercises',
    trackProgress: 'Track progress',
    cachedVideos: 'cached videos'
  }
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * OfflineIndicator Component
 *
 * @param {object} props
 * @param {string} props.lang - Language ('no' or 'en')
 * @param {string} props.variant - Display variant ('banner', 'badge', 'toast', 'minimal')
 * @param {string} props.position - Position for toast variant ('top', 'bottom')
 * @param {boolean} props.showWhenOnline - Whether to show briefly when coming back online
 * @param {boolean} props.dismissable - Whether the indicator can be dismissed
 * @param {function} props.onSync - Callback when sync is triggered
 * @param {object} props.className - Additional CSS classes
 */
export function OfflineIndicator({
  lang = 'no',
  variant = 'banner',
  position = 'top',
  showWhenOnline = true,
  dismissable = true,
  onSync,
  className = ''
}) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.no;

  const {
    isOnline,
    isOffline,
    pendingSyncCount,
    isSyncing,
    syncStatus,
    lastSyncTime,
    cachedVideoCount,
    triggerSync
  } = useOffline();

  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showOnlineNotification, setShowOnlineNotification] = useState(false);

  // Show online notification briefly when coming back online
  useEffect(() => {
    if (isOnline && showWhenOnline) {
      setShowOnlineNotification(true);
      const timer = setTimeout(() => {
        setShowOnlineNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showWhenOnline]);

  // Reset dismissed state when going offline
  useEffect(() => {
    if (isOffline) {
      setDismissed(false);
    }
  }, [isOffline]);

  // Handle sync
  const handleSync = async () => {
    if (onSync) {
      await onSync();
    } else {
      await triggerSync();
    }
  };

  // Don't render if dismissed or online (and not showing notification)
  if (dismissed) return null;
  if (isOnline && !showOnlineNotification && !isSyncing && syncStatus !== 'error') return null;

  // Render based on variant
  switch (variant) {
    case 'banner':
      return (
        <OfflineBanner
          t={t}
          isOffline={isOffline}
          isSyncing={isSyncing}
          syncStatus={syncStatus}
          pendingSyncCount={pendingSyncCount}
          cachedVideoCount={cachedVideoCount}
          showDetails={showDetails}
          setShowDetails={setShowDetails}
          dismissable={dismissable}
          onDismiss={() => setDismissed(true)}
          onSync={handleSync}
          className={className}
        />
      );

    case 'toast':
      return (
        <OfflineToast
          t={t}
          isOffline={isOffline}
          isOnline={isOnline}
          isSyncing={isSyncing}
          syncStatus={syncStatus}
          pendingSyncCount={pendingSyncCount}
          showOnlineNotification={showOnlineNotification}
          position={position}
          dismissable={dismissable}
          onDismiss={() => setDismissed(true)}
          onSync={handleSync}
          className={className}
        />
      );

    case 'badge':
      return (
        <OfflineBadge
          t={t}
          isOffline={isOffline}
          isSyncing={isSyncing}
          pendingSyncCount={pendingSyncCount}
          className={className}
        />
      );

    case 'minimal':
      return (
        <OfflineMinimal
          t={t}
          isOffline={isOffline}
          pendingSyncCount={pendingSyncCount}
          className={className}
        />
      );

    default:
      return null;
  }
}

// =============================================================================
// VARIANT COMPONENTS
// =============================================================================

/**
 * Banner variant - Full-width banner at top of page
 */
function OfflineBanner({
  t,
  isOffline,
  isSyncing,
  syncStatus,
  pendingSyncCount,
  cachedVideoCount,
  showDetails,
  setShowDetails,
  dismissable,
  onDismiss,
  onSync,
  className
}) {
  return (
    <div
      className={`
        w-full px-4 py-3 transition-all duration-300
        ${isOffline
          ? 'bg-amber-50 border-b border-amber-200'
          : syncStatus === 'error'
            ? 'bg-red-50 border-b border-red-200'
            : 'bg-green-50 border-b border-green-200'
        }
        ${className}
      `}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          {/* Status Icon & Text */}
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${isOffline
                ? 'bg-amber-100'
                : syncStatus === 'error'
                  ? 'bg-red-100'
                  : 'bg-green-100'
              }
            `}>
              {isSyncing ? (
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              ) : isOffline ? (
                <WifiOff className="w-5 h-5 text-amber-600" />
              ) : syncStatus === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <Check className="w-5 h-5 text-green-600" />
              )}
            </div>

            <div>
              <p className={`font-medium ${
                isOffline
                  ? 'text-amber-800'
                  : syncStatus === 'error'
                    ? 'text-red-800'
                    : 'text-green-800'
              }`}>
                {isSyncing
                  ? t.syncing
                  : isOffline
                    ? t.offline
                    : syncStatus === 'error'
                      ? t.syncFailed
                      : t.syncComplete
                }
              </p>
              {isOffline && (
                <p className="text-sm text-amber-600">{t.offlineDesc}</p>
              )}
              {pendingSyncCount > 0 && !isOffline && (
                <p className="text-sm text-amber-600">
                  {pendingSyncCount} {pendingSyncCount === 1 ? t.pendingSyncSingle : t.pendingSync}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isOffline && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1"
              >
                {showDetails ? t.hideDetails : t.viewDetails}
                {showDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}

            {!isOffline && pendingSyncCount > 0 && !isSyncing && (
              <button
                onClick={onSync}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                {t.retry}
              </button>
            )}

            {dismissable && (
              <button
                onClick={onDismiss}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={t.dismiss}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Expandable Details */}
        {showDetails && isOffline && (
          <div className="mt-3 pt-3 border-t border-amber-200">
            <p className="text-sm font-medium text-amber-800 mb-2">{t.offlineFeatures}</p>
            <ul className="text-sm text-amber-700 space-y-1">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                {t.viewExercises}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                {t.trackProgress}
              </li>
              {cachedVideoCount > 0 && (
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  {cachedVideoCount} {t.cachedVideos}
                </li>
              )}
            </ul>
            {pendingSyncCount > 0 && (
              <p className="mt-2 text-sm text-amber-600">
                {pendingSyncCount} {pendingSyncCount === 1 ? t.pendingSyncSingle : t.pendingSync}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Toast variant - Floating notification
 */
function OfflineToast({
  t,
  isOffline,
  isOnline,
  isSyncing,
  syncStatus,
  pendingSyncCount,
  showOnlineNotification,
  position,
  dismissable,
  onDismiss,
  onSync,
  className
}) {
  const positionClasses = position === 'top'
    ? 'top-4 left-1/2 -translate-x-1/2'
    : 'bottom-4 left-1/2 -translate-x-1/2';

  return (
    <div
      className={`
        fixed z-50 ${positionClasses}
        flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg
        transition-all duration-300 transform
        ${isOffline
          ? 'bg-amber-600 text-white'
          : showOnlineNotification || isSyncing
            ? 'bg-green-600 text-white'
            : syncStatus === 'error'
              ? 'bg-red-600 text-white'
              : 'opacity-0 pointer-events-none'
        }
        ${className}
      `}
    >
      {/* Icon */}
      {isSyncing ? (
        <RefreshCw className="w-5 h-5 animate-spin" />
      ) : isOffline ? (
        <CloudOff className="w-5 h-5" />
      ) : (
        <Cloud className="w-5 h-5" />
      )}

      {/* Text */}
      <span className="font-medium">
        {isSyncing
          ? t.syncing
          : isOffline
            ? t.offline
            : showOnlineNotification
              ? t.online
              : syncStatus === 'error'
                ? t.syncFailed
                : ''
        }
      </span>

      {/* Pending count */}
      {pendingSyncCount > 0 && isOffline && (
        <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
          {pendingSyncCount}
        </span>
      )}

      {/* Retry button */}
      {!isOffline && syncStatus === 'error' && !isSyncing && (
        <button
          onClick={onSync}
          className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
        >
          {t.retry}
        </button>
      )}

      {/* Dismiss button */}
      {dismissable && (
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          aria-label={t.dismiss}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Badge variant - Compact status badge
 */
function OfflineBadge({ t, isOffline, isSyncing, pendingSyncCount, className }) {
  if (!isOffline && pendingSyncCount === 0 && !isSyncing) return null;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        ${isOffline
          ? 'bg-amber-100 text-amber-800'
          : isSyncing
            ? 'bg-blue-100 text-blue-800'
            : 'bg-yellow-100 text-yellow-800'
        }
        ${className}
      `}
    >
      {isSyncing ? (
        <RefreshCw className="w-3 h-3 animate-spin" />
      ) : isOffline ? (
        <WifiOff className="w-3 h-3" />
      ) : (
        <Cloud className="w-3 h-3" />
      )}
      <span>
        {isOffline
          ? t.offline
          : isSyncing
            ? t.syncing
            : `${pendingSyncCount} ${t.pendingSync}`
        }
      </span>
    </div>
  );
}

/**
 * Minimal variant - Just an icon
 */
function OfflineMinimal({ t, isOffline, pendingSyncCount, className }) {
  if (!isOffline) return null;

  return (
    <div
      className={`relative ${className}`}
      title={t.offline}
    >
      <WifiOff className="w-5 h-5 text-amber-600" />
      {pendingSyncCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
          {pendingSyncCount > 9 ? '9+' : pendingSyncCount}
        </span>
      )}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default OfflineIndicator;
