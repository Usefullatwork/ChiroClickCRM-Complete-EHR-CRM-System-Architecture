import { Key, AlertTriangle, Download, Info, Clock } from 'lucide-react';
import { useTranslation } from '../../i18n';

export default function IntegrationSettings({ t }) {
  const { t: tCommon } = useTranslation('common');

  const handleVcfExport = async () => {
    try {
      const response = await fetch('/api/v1/patients/export/vcf', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kontakter.vcf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // VCF endpoint will be available once Task 5 is complete
    }
  };

  return (
    <div className="space-y-6">
      {/* SolvIt Integration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('solvitIntegration')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">{t('solvitDesc')}</p>
          </div>
          <span className="px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {tCommon?.('notConfigured') || 'Ikke konfigurert'}
          </span>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Sett{' '}
              <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">SOLVIT_API_KEY</code> i
              miljovariabler for aa aktivere SolvIt-integrasjon.
            </p>
          </div>
        </div>
      </div>

      {/* Google Drive Integration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('googleDriveIntegration')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">{t('googleDriveDesc')}</p>
          </div>
          <span className="px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
            {tCommon?.('notAvailable') || 'Ikke tilgjengelig'}
          </span>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <Info className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Ikke tilgjengelig i skrivebordsmodus. Google Drive-integrasjon krever nettleserbasert
              autentisering.
            </p>
          </div>
        </div>
      </div>

      {/* Google Contacts Export */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Google Kontakter
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">
              Eksporter pasientkontakter som .vcf-fil for import i Google Kontakter
            </p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <button
            onClick={handleVcfExport}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Last ned kontakter som .vcf
          </button>
          <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Importer filen i Google Kontakter via contacts.google.com &rarr; Import
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Kun navn og mobilnummer eksporteres. Ingen helseopplysninger.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Integration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('stripeIntegration')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">{t('stripeDesc')}</p>
          </div>
          <span className="px-3 py-1 text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Planlagt
          </span>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <Info className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Stripe-integrasjon for betalingsbehandling kommer snart.
            </p>
          </div>
        </div>
      </div>

      {/* API Access */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('apiAccess')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-200 mt-1">{t('apiAccessDesc')}</p>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
            <Key className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                {t('apiComingSoon')}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                {t('apiComingSoonDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
