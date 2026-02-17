/**
 * Appointment Importer Component
 * File upload for ICS/CSV files with preview, conflict detection, and selective import.
 */

import _React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsAPI, schedulerAPI } from '../../services/api';

/**
 * Parse ICS file content into appointment objects
 */
function parseICS(content) {
  const events = [];
  const eventBlocks = content.split('BEGIN:VEVENT');

  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i].split('END:VEVENT')[0];
    const event = {};

    const getField = (name) => {
      const match = block.match(new RegExp(`${name}[^:]*:(.+)`, 'm'));
      return match ? match[1].trim() : '';
    };

    const dtStart = getField('DTSTART');
    const dtEnd = getField('DTEND');

    event.summary = getField('SUMMARY');
    event.description = getField('DESCRIPTION').replace(/\\n/g, '\n').replace(/\\,/g, ',');
    event.location = getField('LOCATION');
    event.start = parseICSDate(dtStart);
    event.end = parseICSDate(dtEnd);
    event.uid = getField('UID');

    if (event.summary && event.start) {
      events.push(event);
    }
  }

  return events;
}

function parseICSDate(dateStr) {
  if (!dateStr) {
    return null;
  }
  // Remove timezone suffix
  const clean = dateStr.replace(/Z$/, '');
  // Format: 20260207T140000
  if (clean.length >= 15) {
    const y = clean.substring(0, 4);
    const m = clean.substring(4, 6);
    const d = clean.substring(6, 8);
    const h = clean.substring(9, 11);
    const min = clean.substring(11, 13);
    return new Date(`${y}-${m}-${d}T${h}:${min}:00`);
  }
  return new Date(dateStr);
}

/**
 * Parse CSV content into appointment objects
 * Expected headers: date,time,duration,patient,type,notes
 */
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const events = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });

    const dateStr = row.date || row.dato;
    const timeStr = row.time || row.tid || '09:00';
    const duration = parseInt(row.duration || row.varighet || '30', 10);

    if (dateStr) {
      events.push({
        summary: row.patient || row.pasient || row.name || row.navn || 'Ukjent',
        start: new Date(`${dateStr}T${timeStr}:00`),
        end: new Date(new Date(`${dateStr}T${timeStr}:00`).getTime() + duration * 60000),
        description: row.notes || row.notater || row.type || '',
        location: row.location || '',
        uid: `csv-${i}-${dateStr}`,
      });
    }
  }

  return events;
}

const AppointmentImporter = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [parsedEvents, setParsedEvents] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [conflicts, setConflicts] = useState({});
  const [importStatus, setImportStatus] = useState(null); // null | 'checking' | 'ready' | 'importing' | 'done'
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setError('');
    setFileName(file.name);
    setImportStatus('checking');

    try {
      const content = await file.text();
      let events;

      if (file.name.endsWith('.ics') || file.name.endsWith('.ical')) {
        events = parseICS(content);
      } else if (file.name.endsWith('.csv')) {
        events = parseCSV(content);
      } else {
        setError('Kun .ics og .csv filer støttes');
        setImportStatus(null);
        return;
      }

      if (events.length === 0) {
        setError('Ingen avtaler funnet i filen');
        setImportStatus(null);
        return;
      }

      // Add IDs for selection tracking
      const eventsWithIds = events.map((evt, idx) => ({ ...evt, _id: `import-${idx}` }));
      setParsedEvents(eventsWithIds);
      setSelectedIds(new Set(eventsWithIds.map((e) => e._id)));

      // Check conflicts
      try {
        const conflictChecks = await Promise.allSettled(
          eventsWithIds.map((evt) =>
            schedulerAPI.checkConflicts({
              start_time: evt.start?.toISOString(),
              end_time: evt.end?.toISOString(),
            })
          )
        );

        const conflictMap = {};
        conflictChecks.forEach((result, idx) => {
          if (result.status === 'fulfilled' && result.value?.data?.hasConflict) {
            conflictMap[eventsWithIds[idx]._id] = result.value.data.conflicts || [];
          }
        });
        setConflicts(conflictMap);
      } catch {
        // Conflict check is optional - proceed without it
      }

      setImportStatus('ready');
    } catch (err) {
      setError(`Kunne ikke lese filen: ${err.message}`);
      setImportStatus(null);
    }
  };

  const toggleEvent = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === parsedEvents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(parsedEvents.map((e) => e._id)));
    }
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const selected = parsedEvents.filter((e) => selectedIds.has(e._id));
      const results = await Promise.allSettled(
        selected.map((evt) =>
          appointmentsAPI.create({
            patient_name: evt.summary,
            start_time: evt.start?.toISOString(),
            end_time: evt.end?.toISOString(),
            notes: evt.description,
            type: 'IMPORTED',
            status: 'SCHEDULED',
          })
        )
      );
      return results;
    },
    onSuccess: (results) => {
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      setImportStatus('done');
      setError(failed > 0 ? `${succeeded} importert, ${failed} feilet` : '');
      queryClient.invalidateQueries(['appointments']);
    },
    onError: (err) => {
      setError(`Import feilet: ${err.message}`);
    },
  });

  const handleImport = () => {
    if (selectedIds.size === 0) {
      return;
    }
    setImportStatus('importing');
    importMutation.mutate();
  };

  const reset = () => {
    setParsedEvents([]);
    setSelectedIds(new Set());
    setConflicts({});
    setImportStatus(null);
    setFileName('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-lg font-medium text-slate-800">Importer avtaler</h3>
        <p className="text-xs text-slate-500 mt-1">Last opp ICS (kalender) eller CSV-filer</p>
      </div>

      <div className="p-4 space-y-4">
        {/* File Upload */}
        {!importStatus || importStatus === 'done' ? (
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".ics,.ical,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              Velg fil (.ics / .csv)
            </button>
            <p className="text-xs text-slate-400 mt-2">
              Eksporter fra Google Calendar, Outlook, eller annen kalender
            </p>
          </div>
        ) : null}

        {/* Checking Status */}
        {importStatus === 'checking' && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="h-4 w-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            Analyserer {fileName}...
          </div>
        )}

        {/* Preview Table */}
        {(importStatus === 'ready' || importStatus === 'importing') && parsedEvents.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {parsedEvents.length} avtaler funnet
                {Object.keys(conflicts).length > 0 && (
                  <span className="text-amber-600 ml-2">
                    ({Object.keys(conflicts).length} med konflikter)
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={toggleAll}
                  className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                >
                  {selectedIds.size === parsedEvents.length ? 'Fjern alle' : 'Velg alle'}
                </button>
                <button
                  onClick={reset}
                  className="text-xs px-2 py-1 text-slate-500 hover:text-slate-700"
                >
                  Avbryt
                </button>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left w-8"></th>
                    <th className="px-2 py-2 text-left">Dato</th>
                    <th className="px-2 py-2 text-left">Tid</th>
                    <th className="px-2 py-2 text-left">Pasient</th>
                    <th className="px-2 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedEvents.map((evt) => {
                    const hasConflict = !!conflicts[evt._id];
                    return (
                      <tr
                        key={evt._id}
                        className={`hover:bg-slate-50 ${hasConflict ? 'bg-amber-50' : ''}`}
                      >
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(evt._id)}
                            onChange={() => toggleEvent(evt._id)}
                            className="rounded text-teal-600"
                          />
                        </td>
                        <td className="px-2 py-2 text-slate-700">
                          {evt.start?.toLocaleDateString('no-NO')}
                        </td>
                        <td className="px-2 py-2 text-slate-700">
                          {evt.start?.toLocaleTimeString('no-NO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' - '}
                          {evt.end?.toLocaleTimeString('no-NO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-2 py-2 text-slate-800 font-medium">{evt.summary}</td>
                        <td className="px-2 py-2">
                          {hasConflict ? (
                            <span className="text-amber-600">Konflikt</span>
                          ) : (
                            <span className="text-green-600">OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleImport}
              disabled={selectedIds.size === 0 || importStatus === 'importing'}
              className="w-full py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {importStatus === 'importing'
                ? 'Importerer...'
                : `Importer ${selectedIds.size} avtale${selectedIds.size !== 1 ? 'r' : ''}`}
            </button>
          </>
        )}

        {/* Done */}
        {importStatus === 'done' && (
          <div className="text-center py-4">
            <p className="text-sm text-green-600 font-medium">Import fullført!</p>
            <button onClick={reset} className="text-xs text-teal-600 hover:underline mt-2">
              Importer flere
            </button>
          </div>
        )}

        {/* Error */}
        {error && <div className="p-2 rounded bg-red-50 text-red-700 text-sm">{error}</div>}
      </div>
    </div>
  );
};

export default AppointmentImporter;
