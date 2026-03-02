import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Users,
  CalendarDays,
  Kanban,
  MessageSquare,
  CheckCircle2,
  DollarSign,
  Settings,
  UserPlus,
  CalendarPlus,
  FileText,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { patientsAPI } from '../../services/api';
import { calculateAge, formatDate } from '../../lib/utils';

const NAV_ITEMS = [
  { label: 'Dashbord', path: '/', icon: LayoutDashboard },
  { label: 'Pasienter', path: '/patients', icon: Users },
  { label: 'Kalender', path: '/calendar', icon: CalendarDays },
  { label: 'Pasientflyt', path: '/patient-flow', icon: Kanban },
  { label: 'Kommunikasjon', path: '/communications', icon: MessageSquare },
  { label: 'Oppfolginger', path: '/follow-ups', icon: CheckCircle2 },
  { label: 'Okonomi', path: '/financial', icon: DollarSign },
  { label: 'Innstillinger', path: '/settings', icon: Settings },
];

const ACTION_ITEMS = [
  { label: 'Ny pasient', path: '/patients/new', icon: UserPlus },
  { label: 'Ny time', path: '/calendar?new=true', icon: CalendarPlus },
  { label: 'Ny journal', action: 'newEncounter', icon: FileText },
];

function fuzzyMatch(text, query) {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return null;
  return { start: idx, end: idx + q.length };
}

function HighlightText({ text, query }) {
  if (!query) return text;
  const match = fuzzyMatch(text, query);
  if (!match) return text;
  return (
    <>
      {text.slice(0, match.start)}
      <mark className="bg-teal-200 dark:bg-teal-700 text-inherit rounded-sm px-0.5">
        {text.slice(match.start, match.end)}
      </mark>
      {text.slice(match.end)}
    </>
  );
}

function getInitials(first, last) {
  return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();
}

export default function CommandPalette({ isOpen, onClose }) {
  const { t } = useTranslation('navigation');
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Search patients with debounce
  useEffect(() => {
    if (!query || query.length < 2) {
      setPatients([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await patientsAPI.getAll({ search: query, limit: 5 });
        setPatients(res.data?.patients || []);
      } catch {
        setPatients([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Filter nav and action items
  const filteredNav = useMemo(() => {
    if (!query) return NAV_ITEMS;
    return NAV_ITEMS.filter((item) => fuzzyMatch(item.label, query));
  }, [query]);

  const filteredActions = useMemo(() => {
    if (!query) return ACTION_ITEMS;
    return ACTION_ITEMS.filter((item) => fuzzyMatch(item.label, query));
  }, [query]);

  // Build flat list of all items for keyboard nav
  const allItems = useMemo(() => {
    const items = [];
    patients.forEach((p) => items.push({ type: 'patient', data: p }));
    filteredNav.forEach((n) => items.push({ type: 'nav', data: n }));
    filteredActions.forEach((a) => items.push({ type: 'action', data: a }));
    return items;
  }, [patients, filteredNav, filteredActions]);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setPatients([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Clamp active index when list changes
  useEffect(() => {
    if (activeIndex >= allItems.length) {
      setActiveIndex(Math.max(0, allItems.length - 1));
    }
  }, [allItems.length, activeIndex]);

  const selectItem = useCallback(
    (item) => {
      onClose();
      if (item.type === 'patient') {
        navigate(`/patients/${item.data.id}`);
      } else if (item.type === 'nav') {
        navigate(item.data.path);
      } else if (item.data.action === 'newEncounter') {
        // Dispatch custom event for encounter creation
        window.dispatchEvent(new CustomEvent('command:newEncounter'));
      } else if (item.data.path) {
        navigate(item.data.path);
      }
    },
    [navigate, onClose]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && allItems[activeIndex]) {
        e.preventDefault();
        selectItem(allItems[activeIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [allItems, activeIndex, selectItem, onClose]
  );

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!isOpen) return null;

  let flatIndex = 0;
  const getIdx = () => flatIndex++;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-xl w-full mx-4 overflow-hidden border border-gray-200 dark:border-gray-700"
        role="dialog"
        aria-modal="true"
        aria-label={t('commandPalette', 'Kommandopalett')}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('searchPlaceholder', 'Sok etter pasient, side eller handling...')}
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
            aria-label={t('searchLabel', 'Sok')}
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {/* Patients section */}
          {(patients.length > 0 || loading) && (
            <div>
              <div className="px-4 py-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Pasienter
              </div>
              {loading && <div className="px-4 py-2 text-sm text-gray-400">Soker...</div>}
              {patients.map((p) => {
                const idx = getIdx();
                const name = `${p.first_name} ${p.last_name}`;
                const age = calculateAge(p.date_of_birth);
                return (
                  <button
                    key={p.id}
                    data-index={idx}
                    onClick={() => selectItem({ type: 'patient', data: p })}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                      activeIndex === idx
                        ? 'bg-teal-50 dark:bg-teal-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-200 flex items-center justify-center text-xs font-medium shrink-0">
                      {getInitials(p.first_name, p.last_name)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        <HighlightText text={name} query={query} />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {age != null && <span>{age} ar</span>}
                        {p.last_visit_date && (
                          <span className="ml-2">Sist: {formatDate(p.last_visit_date)}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Navigation section */}
          {filteredNav.length > 0 && (
            <div>
              <div className="px-4 py-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Navigasjon
              </div>
              {filteredNav.map((item) => {
                const idx = getIdx();
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    data-index={idx}
                    onClick={() => selectItem({ type: 'nav', data: item })}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                      activeIndex === idx
                        ? 'bg-teal-50 dark:bg-teal-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      <HighlightText text={item.label} query={query} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Actions section */}
          {filteredActions.length > 0 && (
            <div>
              <div className="px-4 py-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Handlinger
              </div>
              {filteredActions.map((item) => {
                const idx = getIdx();
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    data-index={idx}
                    onClick={() => selectItem({ type: 'action', data: item })}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                      activeIndex === idx
                        ? 'bg-teal-50 dark:bg-teal-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      <HighlightText text={item.label} query={query} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!loading && query.length >= 2 && allItems.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              Ingen resultater for &laquo;{query}&raquo;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
