import { useTranslation } from '../i18n';
import { SHORTCUTS } from '../hooks/useGlobalKeyboardShortcuts';
import {
  HelpCircle,
  Keyboard,
  BookOpen,
  Shield,
  Database,
  Cpu,
  Calendar,
  Users,
  FileText,
  BarChart3 as _BarChart3,
} from 'lucide-react';

function ShortcutKey({ children }) {
  return (
    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">
      {children}
    </kbd>
  );
}

export default function Help() {
  const { t } = useTranslation('common');

  const sections = [
    {
      icon: Calendar,
      title: t('helpSectionDailyWorkflow', 'Daglig arbeidsflyt'),
      color: 'blue',
      items: [
        t('helpDailyStep1', 'Åpne appen og sjekk Dashbordet for dagens oversikt'),
        t('helpDailyStep2', 'Gå til Kalender for å se timeplan og neste pasient'),
        t('helpDailyStep3', 'Klikk på en pasient for å starte konsultasjon'),
        t('helpDailyStep4', 'Fyll ut SOAP-notat (Subjektiv, Objektiv, Analyse, Plan)'),
        t('helpDailyStep5', 'Legg til øvelser og oppfølgingsplan'),
        t('helpDailyStep6', 'Signer journalnotatet og bestill neste time'),
      ],
    },
    {
      icon: Users,
      title: t('helpSectionPatientManagement', 'Pasienthåndtering'),
      color: 'green',
      items: [
        t('helpPatientStep1', 'Ctrl+N: Opprett ny pasient'),
        t('helpPatientStep2', 'Søk etter pasient med Ctrl+K (kommandopalett)'),
        t('helpPatientStep3', 'Se pasientjournal, tidligere konsultasjoner og øvelser'),
        t('helpPatientStep4', 'Eksporter pasientdata via Fil-menyen'),
      ],
    },
    {
      icon: FileText,
      title: t('helpSectionSOAP', 'SOAP-journalformat'),
      color: 'purple',
      items: [
        t('helpSOAPStep1', 'S (Subjektiv): Pasientens symptomer og sykehistorie'),
        t('helpSOAPStep2', 'O (Objektiv): Undersøkelse, tester, funn'),
        t('helpSOAPStep3', 'A (Analyse): Diagnose, vurdering, røde flagg'),
        t('helpSOAPStep4', 'P (Plan): Behandlingsplan, øvelser, oppfølging'),
      ],
    },
    {
      icon: Cpu,
      title: t('helpSectionAI', 'AI-funksjoner'),
      color: 'amber',
      items: [
        t('helpAIStep1', 'AI-forslag vises automatisk under journalskriving'),
        t('helpAIStep2', 'Krever Ollama installert lokalt (port 11434)'),
        t('helpAIStep3', 'Grønn prikk = AI tilgjengelig, grå = ikke tilkoblet'),
        t('helpAIStep4', 'AI-forslag er veiledende — behandler har alltid siste ord'),
      ],
    },
    {
      icon: Database,
      title: t('helpSectionBackup', 'Sikkerhetskopiering'),
      color: 'teal',
      items: [
        t('helpBackupStep1', 'Fil > Eksporter data (Ctrl+Shift+E) for SQL-backup'),
        t('helpBackupStep2', 'Fil > Importer data (Ctrl+Shift+I) for gjenoppretting'),
        t('helpBackupStep3', 'Data lagres lokalt i %APPDATA%\\chiroclickehr-desktop\\data\\'),
        t('helpBackupStep4', 'Anbefalt: Daglig backup til USB eller skymappe'),
      ],
    },
    {
      icon: Shield,
      title: t('helpSectionPrivacy', 'Personvern og sikkerhet'),
      color: 'red',
      items: [
        t('helpPrivacyStep1', 'All data lagres kun på din maskin — ingen sky'),
        t('helpPrivacyStep2', 'Kryptering med maskinspesifikk nøkkel'),
        t('helpPrivacyStep3', 'Revisjonslogg over all tilgang til pasientdata'),
        t('helpPrivacyStep4', 'Kompatibel med Normen og personvernforskriften'),
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-50 rounded-xl">
          <HelpCircle className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('helpTitle', 'Hjelp')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t('helpSubtitle', 'Hurtigguide og tastatursnarveier for ChiroClickEHR')}
          </p>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Keyboard className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('keyboardShortcuts', 'Tastatursnarveier')}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SHORTCUTS.map((shortcut, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, ki) => (
                  <ShortcutKey key={ki}>{key}</ShortcutKey>
                ))}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t('exportData', 'Eksporter data')}
            </span>
            <div className="flex items-center gap-1">
              <ShortcutKey>Ctrl</ShortcutKey>
              <ShortcutKey>Shift</ShortcutKey>
              <ShortcutKey>E</ShortcutKey>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t('importData', 'Importer data')}
            </span>
            <div className="flex items-center gap-1">
              <ShortcutKey>Ctrl</ShortcutKey>
              <ShortcutKey>Shift</ShortcutKey>
              <ShortcutKey>I</ShortcutKey>
            </div>
          </div>
        </div>
      </div>

      {/* Help Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <h3 className="font-semibold text-gray-900 dark:text-white">{section.title}</h3>
              </div>
              <ul className="space-y-2">
                {section.items.map((item, ii) => (
                  <li key={ii} className="text-sm text-gray-600 dark:text-gray-400 flex gap-2">
                    <span className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0">
                      &bull;
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Version Info */}
      <div className="mt-8 text-center text-sm text-gray-400 dark:text-gray-500">
        <p>{t('appName', 'ChiroClickEHR Desktop Edition')}</p>
        <p className="flex items-center justify-center gap-1 mt-1">
          <BookOpen className="w-3.5 h-3.5" />
          <span>
            {t(
              'fullDocumentation',
              'Fullstendig dokumentasjon finnes i docs/-mappen i installasjonen'
            )}
          </span>
        </p>
      </div>
    </div>
  );
}
