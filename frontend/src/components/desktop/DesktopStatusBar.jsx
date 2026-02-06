/**
 * Desktop Status Bar
 * Shows system status indicators: DB, AI, backup, memory
 * Only visible in desktop (Electron) mode
 */

import React, { useState, useEffect } from 'react';

const StatusDot = ({ status, label }) => {
  const colors = {
    ok: 'bg-green-400',
    warning: 'bg-yellow-400',
    error: 'bg-red-400',
    loading: 'bg-blue-400 animate-pulse',
    off: 'bg-gray-400',
  };

  return (
    <div className="flex items-center gap-1.5" title={label}>
      <div className={`w-2 h-2 rounded-full ${colors[status] || colors.off}`} />
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    </div>
  );
};

const DesktopStatusBar = () => {
  const [status, setStatus] = useState({
    db: 'loading',
    ai: 'off',
    memory: 0,
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/health', { credentials: 'include' });
        const data = await res.json();
        setStatus(prev => ({
          ...prev,
          db: data.database === 'connected' ? 'ok' : 'error',
        }));
      } catch {
        setStatus(prev => ({ ...prev, db: 'error' }));
      }

      try {
        const res = await fetch('/api/v1/ai/status', { credentials: 'include' });
        const data = await res.json();
        setStatus(prev => ({
          ...prev,
          ai: data.available ? 'ok' : 'off',
        }));
      } catch {
        setStatus(prev => ({ ...prev, ai: 'off' }));
      }

      // Memory from Electron IPC (if available)
      if (window.electronAPI?.getInfo) {
        try {
          const info = await window.electronAPI.getInfo();
          setStatus(prev => ({ ...prev, memory: info?.memoryUsage || 0 }));
        } catch {
          // Not in Electron
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 px-3 py-1 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs">
      <StatusDot status={status.db} label="Database" />
      <StatusDot status={status.ai} label="AI" />
      {status.memory > 0 && (
        <span className="text-gray-400 dark:text-gray-500">
          RAM: {Math.round(status.memory)}MB
        </span>
      )}
      <span className="ml-auto text-gray-400 dark:text-gray-500">
        ChiroClickCRM v2.0.0
      </span>
    </div>
  );
};

export default DesktopStatusBar;
