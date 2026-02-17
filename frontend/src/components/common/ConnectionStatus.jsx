/**
 * ConnectionStatus - Visual indicator for online/offline status and sync state
 * Shows in corner of screen to give clinicians confidence their work is saved
 */

import _React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, _Cloud, _CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';

export default function ConnectionStatus({
  pendingChanges = 0,
  lastSyncTime = null,
  syncError = null,
  onRetrySync = null,
  position = 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-600',
        label: 'Offline',
        sublabel: pendingChanges > 0 ? `${pendingChanges} ventende` : 'Endringer lagres lokalt',
      };
    }

    if (syncError) {
      return {
        icon: AlertCircle,
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600',
        label: 'Synkroniseringsfeil',
        sublabel: 'Klikk for å prøve igjen',
      };
    }

    if (pendingChanges > 0) {
      return {
        icon: RefreshCw,
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-600',
        label: 'Synkroniserer...',
        sublabel: `${pendingChanges} endring${pendingChanges > 1 ? 'er' : ''}`,
        animate: true,
      };
    }

    return {
      icon: Check,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      label: 'Synkronisert',
      sublabel: lastSyncTime ? formatRelativeTime(lastSyncTime) : null,
    };
  };

  const formatRelativeTime = (date) => {
    if (!date) {
      return null;
    }
    const now = new Date();
    const then = date instanceof Date ? date : new Date(date);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 10) {
      return 'akkurat nå';
    }
    if (seconds < 60) {
      return `${seconds}s siden`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m siden`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}t siden`;
    }
    return then.toLocaleDateString('nb-NO');
  };

  const status = getStatusConfig();
  const Icon = status.icon;

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-40`}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      {/* Compact indicator */}
      <button
        onClick={() => {
          if (syncError && onRetrySync) {
            onRetrySync();
          } else {
            setShowDetails(!showDetails);
          }
        }}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm
          transition-all duration-200
          ${status.bgColor} ${status.borderColor} ${status.textColor}
          hover:shadow-md
        `}
      >
        <Icon className={`w-4 h-4 ${status.iconColor} ${status.animate ? 'animate-spin' : ''}`} />
        <span className="text-sm font-medium">{status.label}</span>
        {status.sublabel && <span className="text-xs opacity-75">{status.sublabel}</span>}
      </button>

      {/* Details popup */}
      {showDetails && (
        <div
          className={`
            absolute ${position.includes('bottom') ? 'bottom-full mb-2' : 'top-full mt-2'}
            ${position.includes('right') ? 'right-0' : 'left-0'}
            w-64 p-3 bg-white rounded-lg shadow-lg border border-gray-200
          `}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <div className="flex items-center gap-1.5">
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-yellow-600">Offline</span>
                  </>
                )}
              </div>
            </div>

            {lastSyncTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sist synkronisert</span>
                <span className="text-xs text-gray-500">{formatRelativeTime(lastSyncTime)}</span>
              </div>
            )}

            {pendingChanges > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Ventende endringer</span>
                <span className="text-xs font-medium text-blue-600">{pendingChanges}</span>
              </div>
            )}

            {syncError && onRetrySync && (
              <button
                onClick={onRetrySync}
                className="w-full mt-2 px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition-colors"
              >
                Prøv igjen
              </button>
            )}

            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                {isOnline
                  ? 'Alle endringer synkroniseres automatisk.'
                  : 'Endringer lagres lokalt og synkroniseres når du er online igjen.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
