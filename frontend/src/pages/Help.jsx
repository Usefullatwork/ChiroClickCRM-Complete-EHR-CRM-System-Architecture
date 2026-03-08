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
  BarChart3,
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
      title: 'Daglig arbeidsflyt',
      color: 'blue',
      items: [
        'Aapne appen og sjekk Dashbordet for dagens oversikt',
        'Gaa til Kalender for aa se timeplan og neste pasient',
        'Klikk paa en pasient for aa starte konsultasjon',
        'Fyll ut SOAP-notat (Subjektiv, Objektiv, Analyse, Plan)',
        'Legg til ovelser og oppfolgingsplan',
        'Signer journalnotatet og bestill neste time',
      ],
    },
    {
      icon: Users,
      title: 'Pasienthåndtering',
      color: 'green',
      items: [
        'Ctrl+N: Opprett ny pasient',
        'Sok etter pasient med Ctrl+K (kommandopalett)',
        'Se pasientjournal, tidligere konsultasjoner og ovelser',
        'Eksporter pasientdata via Fil-menyen',
      ],
    },
    {
      icon: FileText,
      title: 'SOAP-journalformat',
      color: 'purple',
      items: [
        'S (Subjektiv): Pasientens symptomer og sykehistorie',
        'O (Objektiv): Undersokelse, tester, funn',
        'A (Analyse): Diagnose, vurdering, rorode flagg',
        'P (Plan): Behandlingsplan, ovelser, oppfolging',
      ],
    },
    {
      icon: Cpu,
      title: 'AI-funksjoner',
      color: 'amber',
      items: [
        'AI-forslag vises automatisk under journalskriving',
        'Krever Ollama installert lokalt (port 11434)',
        'Gronn prikk = AI tilgjengelig, graa = ikke tilkoblet',
        'AI-forslag er veiledende — behandler har alltid siste ord',
      ],
    },
    {
      icon: Database,
      title: 'Sikkerhetskopiering',
      color: 'teal',
      items: [
        'Fil > Eksporter data (Ctrl+Shift+E) for SQL-backup',
        'Fil > Importer data (Ctrl+Shift+I) for gjenoppretting',
        'Data lagres lokalt i %APPDATA%\\chiroclickehr-desktop\\data\\',
        'Anbefalt: Daglig backup til USB eller skymappe',
      ],
    },
    {
      icon: Shield,
      title: 'Personvern og sikkerhet',
      color: 'red',
      items: [
        'All data lagres kun paa din maskin — ingen sky',
        'Kryptering med maskinspesifikk nokkel',
        'Revisjonslogg over all tilgang til pasientdata',
        'Kompatibel med Normen og personvernforskriften',
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hjelp</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Hurtigguide og tastatursnarveier for ChiroClickEHR
          </p>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Keyboard className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tastatursnarveier</h2>
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
            <span className="text-sm text-gray-700 dark:text-gray-300">Eksporter data</span>
            <div className="flex items-center gap-1">
              <ShortcutKey>Ctrl</ShortcutKey>
              <ShortcutKey>Shift</ShortcutKey>
              <ShortcutKey>E</ShortcutKey>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-sm text-gray-700 dark:text-gray-300">Importer data</span>
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
        <p>ChiroClickEHR Desktop Edition</p>
        <p className="flex items-center justify-center gap-1 mt-1">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Fullstendig dokumentasjon finnes i docs/-mappen i installasjonen</span>
        </p>
      </div>
    </div>
  );
}
