import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, HardDrive, CheckCircle2, RotateCcw, Clock, ShieldCheck } from 'lucide-react';
import { backupAPI } from '../../services/api';
import { useTranslation } from '../../i18n';
import toast from '../../utils/toast';
import LoadingButton from '../ui/LoadingButton';
import ConfirmDialog from '../ui/ConfirmDialog';

const CARD = 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700';
const CARD_HEADER = 'px-6 py-4 border-b border-gray-200 dark:border-gray-700';
const HEADING = 'text-lg font-semibold text-gray-900 dark:text-white';
const SUB = 'text-xs text-gray-500 dark:text-gray-400';
const TH =
  'text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider';
const INPUT_CLS =
  'px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500';

function formatSize(bytes) {
  return bytes ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : '0 MB';
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const PHASES = {
  preparing: 'Klargjor data...',
  copying: 'Kopierer...',
  encrypting: 'Krypterer...',
  verifying: 'Verifiserer...',
  complete: 'Ferdig',
};

export default function BackupManager() {
  const { t } = useTranslation('settings');
  const qc = useQueryClient();
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [settings, setSettings] = useState({ autoBackup: false, time: '02:00', retentionCount: 7 });

  const { data: statusRes, isLoading: statusLoading } = useQuery({
    queryKey: ['backup-status'],
    queryFn: () => backupAPI.status(),
    refetchInterval: (q) => {
      const p = q.state.data?.data?.progress;
      return p && p.percent < 100 ? 2000 : false;
    },
  });
  const status = statusRes?.data || {};
  const progress = status.progress || null;

  const { data: listRes, isLoading: listLoading } = useQuery({
    queryKey: ['backup-list'],
    queryFn: () => backupAPI.list(),
  });
  const backups = listRes?.data?.backups || [];

  useEffect(() => {
    if (status.settings) setSettings((prev) => ({ ...prev, ...status.settings }));
  }, [status.settings]);

  const invalidate = (...keys) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  const createMut = useMutation({
    mutationFn: () => backupAPI.create(),
    onSuccess: () => {
      invalidate('backup-list', 'backup-status');
      toast.success('Sikkerhetskopi opprettet');
    },
    onError: () => toast.error('Kunne ikke opprette sikkerhetskopi'),
  });

  const restoreMut = useMutation({
    mutationFn: (f) => backupAPI.restore(f),
    onSuccess: () => {
      setRestoreTarget(null);
      toast.success('Gjenoppretting startet. Systemet starter pa nytt.');
    },
    onError: () => {
      setRestoreTarget(null);
      toast.error('Kunne ikke gjenopprette sikkerhetskopi');
    },
  });

  const settingsMut = useMutation({
    mutationFn: (s) => backupAPI.updateSettings(s),
    onSuccess: () => {
      invalidate('backup-status');
      toast.success('Innstillinger lagret');
    },
    onError: () => toast.error('Kunne ikke lagre innstillinger'),
  });

  if (statusLoading && listLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const inProgress = progress && progress.percent < 100;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={CARD}>
        <div className={CARD_HEADER}>
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
            <h2 className={HEADING}>{t('backupStatus', 'Status for sikkerhetskopi')}</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {[
              [
                'Siste sikkerhetskopi',
                status.lastBackup ? formatDate(status.lastBackup) : 'Ingen sikkerhetskopi enna',
              ],
              [
                'Neste planlagte',
                status.nextScheduled ? formatDate(status.nextScheduled) : 'Ikke planlagt',
              ],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className={SUB}>{label}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {inProgress && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>{PHASES[progress.phase] || progress.phase}</span>
                <span>{progress.percent}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  role="progressbar"
                  aria-valuenow={progress.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Fremdrift for sikkerhetskopi"
                  className="bg-teal-600 dark:bg-teal-400 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-4">
            <LoadingButton
              variant="primary"
              icon={HardDrive}
              loading={createMut.isPending || inProgress}
              loadingText="Oppretter sikkerhetskopi..."
              onClick={() => createMut.mutate()}
            >
              Lag sikkerhetskopi na
            </LoadingButton>
          </div>
        </div>
      </div>

      {/* Backup List */}
      <div className={CARD}>
        <div className={CARD_HEADER}>
          <h2 className={HEADING}>{t('backupList', 'Sikkerhetskopier')}</h2>
        </div>
        {listLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
              </div>
            ))}
          </div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center">
            <HardDrive
              className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Ingen sikkerhetskopier enna. Lag din forste na.
            </p>
            <LoadingButton
              variant="primary"
              size="sm"
              icon={HardDrive}
              loading={createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              Lag sikkerhetskopi
            </LoadingButton>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className={TH}>Dato</th>
                    <th className={TH}>Storrelse</th>
                    <th className={TH}>Status</th>
                    <th className={`${TH} text-right`}>Handling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {backups.map((b) => (
                    <tr key={b.filename} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-3 text-gray-900 dark:text-white">
                        {formatDate(b.createdAt)}
                      </td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                        {formatSize(b.size)}
                      </td>
                      <td className="px-6 py-3">
                        {b.verified ? (
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                            <span className="text-xs">Verifisert</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Ikke verifisert</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => setRestoreTarget(b.filename)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                          Gjenopprett
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden p-4 space-y-3">
              {backups.map((b) => (
                <div
                  key={b.filename}
                  className="border border-gray-100 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(b.createdAt)}
                      </p>
                      <p className={SUB}>{formatSize(b.size)}</p>
                    </div>
                    {b.verified && (
                      <ShieldCheck
                        className="w-4 h-4 text-green-600 dark:text-green-400"
                        aria-label="Verifisert"
                      />
                    )}
                  </div>
                  <button
                    onClick={() => setRestoreTarget(b.filename)}
                    className="w-full mt-2 text-center py-2 text-xs font-medium text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                    Gjenopprett
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Settings Card */}
      <div className={CARD}>
        <div className={CARD_HEADER}>
          <h2 className={HEADING}>{t('backupSettings', 'Innstillinger')}</h2>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Automatisk sikkerhetskopi
              </p>
              <p className={SUB}>Kjor sikkerhetskopi automatisk til valgt tidspunkt</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.autoBackup}
                onChange={(e) => setSettings((s) => ({ ...s, autoBackup: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 dark:peer-checked:bg-teal-500" />
            </label>
          </div>
          <div>
            <label
              htmlFor="backup-time"
              className="block text-sm font-medium text-gray-900 dark:text-white mb-1"
            >
              Tidspunkt
            </label>
            <input
              id="backup-time"
              type="time"
              value={settings.time}
              onChange={(e) => setSettings((s) => ({ ...s, time: e.target.value }))}
              className={`w-32 ${INPUT_CLS}`}
            />
          </div>
          <div>
            <label
              htmlFor="backup-retention"
              className="block text-sm font-medium text-gray-900 dark:text-white mb-1"
            >
              Antall kopier a beholde
            </label>
            <input
              id="backup-retention"
              type="number"
              min={1}
              max={30}
              value={settings.retentionCount}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  retentionCount: Math.max(1, Math.min(30, Number(e.target.value) || 1)),
                }))
              }
              className={`w-24 ${INPUT_CLS}`}
            />
          </div>
          <LoadingButton
            variant="primary"
            loading={settingsMut.isPending}
            loadingText="Lagrer..."
            onClick={() => settingsMut.mutate(settings)}
          >
            Lagre innstillinger
          </LoadingButton>
        </div>
      </div>

      <ConfirmDialog
        open={!!restoreTarget}
        onConfirm={() => restoreMut.mutate(restoreTarget)}
        onCancel={() => setRestoreTarget(null)}
        title="Gjenopprett sikkerhetskopi"
        description="Er du sikker? Gjenoppretting krever omstart av systemet. Alle ulagrede endringer vil ga tapt."
        confirmText="Gjenopprett"
        cancelText="Avbryt"
        variant="warning"
        loading={restoreMut.isPending}
      />
    </div>
  );
}
