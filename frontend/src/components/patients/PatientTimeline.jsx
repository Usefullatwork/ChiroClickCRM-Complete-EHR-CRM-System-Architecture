import { useState, useMemo } from 'react';
import { FileText, MessageSquare, Filter, CheckCircle } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { useTranslation } from '../../i18n';

function TimelineEntry({ entry, patientId, onNavigate }) {
  const isEncounter = entry.type === 'encounter';
  const Icon = isEncounter ? FileText : MessageSquare;
  const dotColor = isEncounter
    ? 'bg-blue-500 dark:bg-blue-400'
    : 'bg-purple-500 dark:bg-purple-400';

  const brief = entry.brief
    ? entry.brief.length > 80
      ? `${entry.brief.slice(0, 80)}...`
      : entry.brief
    : null;

  const handleClick = () => {
    if (isEncounter && onNavigate) {
      onNavigate(`/patients/${patientId}/encounter/${entry.id}`);
    }
  };

  return (
    <div className="relative pl-8">
      {/* Dot on the timeline line */}
      <div
        className={`absolute left-0 top-3 w-3.5 h-3.5 rounded-full ${dotColor} ring-2 ring-white dark:ring-gray-800 z-10 flex items-center justify-center`}
      >
        <Icon className="w-2 h-2 text-white" />
      </div>

      {/* Entry card */}
      <button
        type="button"
        onClick={handleClick}
        className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
        aria-label={`${entry.title} - ${formatDate(entry.date)}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">{entry.title}</span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {entry.signed && (
              <CheckCircle
                className="w-4 h-4 text-green-500 dark:text-green-400"
                aria-label="Signert"
              />
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(entry.date)}
            </span>
          </div>
        </div>
        {brief && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{brief}</p>
        )}
      </button>
    </div>
  );
}

export default function PatientTimeline({ patientId, encounters = [], onNavigate }) {
  const { t } = useTranslation('patients');
  const [activeFilter, setActiveFilter] = useState('all');

  const FILTER_OPTIONS = [
    { key: 'all', label: t('filterAll', 'Alle') },
    { key: 'journals', label: t('filterJournals', 'Journaler') },
    { key: 'communications', label: t('filterCommunications', 'Kommunikasjon') },
  ];

  // Merge encounters (and future communications) into a unified timeline
  const timelineItems = useMemo(() => {
    const items = encounters.map((enc) => ({
      id: enc.id,
      type: 'encounter',
      title: enc.encounter_type || t('consultation', 'Konsultasjon'),
      date: enc.encounter_date,
      brief: enc.chief_complaint || enc.subjective?.slice(0, 80) || null,
      signed: !!enc.signed_at,
    }));

    // Future: merge communications here
    // e.g. communications.map(c => ({ id: c.id, type: 'communication', ... }))

    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [encounters]);

  // Apply active filter
  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return timelineItems;
    if (activeFilter === 'journals') return timelineItems.filter((i) => i.type === 'encounter');
    if (activeFilter === 'communications')
      return timelineItems.filter((i) => i.type === 'communication');
    return timelineItems;
  }, [timelineItems, activeFilter]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      {/* Header with filter pills */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Filter className="w-4 h-4" />
          {t('timeline', 'Tidslinje')}
        </h3>
        <div className="flex gap-1">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setActiveFilter(opt.key)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                activeFilter === opt.key
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
              aria-pressed={activeFilter === opt.key}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {filteredItems.length === 0 ? (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
          {t('noEvents', 'Ingen hendelser')}
        </p>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[6px] top-3 bottom-3 w-0.5 border-l-2 border-dashed border-gray-200 dark:border-gray-700" />

          <div className="flex flex-col gap-3">
            {filteredItems.map((item) => (
              <TimelineEntry
                key={`${item.type}-${item.id}`}
                entry={item}
                patientId={patientId}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
