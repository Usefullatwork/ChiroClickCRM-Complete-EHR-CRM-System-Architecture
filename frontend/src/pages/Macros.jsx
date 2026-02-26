/**
 * Macros Page
 * Clinical text macros management interface
 */

import { Zap } from 'lucide-react';
import MacroManager from '../components/macros/MacroManager';
import { useTranslation } from '../i18n';

export default function Macros() {
  const { t } = useTranslation('clinical');
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">{t('macros')}</h1>
        </div>
        <p className="text-gray-600">{t('macrosDescription')}</p>
      </div>
      <MacroManager />
    </div>
  );
}
