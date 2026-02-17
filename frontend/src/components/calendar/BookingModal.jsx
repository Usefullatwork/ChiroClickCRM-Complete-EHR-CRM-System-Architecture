/**
 * BookingModal Component - Create/Edit Appointment Modal
 *
 * Features:
 * - Patient search with autocomplete
 * - Practitioner selection
 * - Date and time pickers
 * - Appointment type selection
 * - Duration selection
 * - Conflict detection (no double-booking)
 * - Notes field
 * - Edit mode for existing appointments
 * - Cancel appointment option
 * - Norwegian labels
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { patientsAPI } from '../../services/api';
import { format, parseISO, addMinutes } from 'date-fns';
import { nb } from 'date-fns/locale';
import {
  X,
  Search,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import toast from '../../utils/toast';

// =============================================================================
// CONSTANTS
// =============================================================================

const DURATIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 time' },
  { value: 90, label: '1.5 time' },
  { value: 120, label: '2 timer' },
];

const DEFAULT_DURATIONS_BY_TYPE = {
  INITIAL: 60,
  FOLLOWUP: 30,
  REASSESSMENT: 45,
  EMERGENCY: 30,
  PHONE: 15,
  VIDEO: 30,
  MAINTENANCE: 30,
};

// =============================================================================
// PATIENT SEARCH COMPONENT
// =============================================================================

function PatientSearch({ _value, _onChange, selectedPatient, onSelect, onClear }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Search patients
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['patients-search', searchTerm],
    queryFn: () => patientsAPI.search(searchTerm),
    enabled: searchTerm.length >= 2,
    staleTime: 30000,
  });

  const patients = searchResults?.data?.patients || [];

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setIsOpen(term.length >= 2);
  };

  const handleSelect = (patient) => {
    onSelect(patient);
    setSearchTerm('');
    setIsOpen(false);
  };

  // If a patient is selected, show their name
  if (selectedPatient) {
    return (
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <User className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <div className="font-medium text-blue-900">
            {selectedPatient.first_name} {selectedPatient.last_name}
          </div>
          {selectedPatient.phone && (
            <div className="text-sm text-blue-700">{selectedPatient.phone}</div>
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Sok etter pasient (navn, telefon, e-post)..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {patients.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchTerm.length < 2 ? 'Skriv minst 2 tegn for a soke' : 'Ingen pasienter funnet'}
            </div>
          ) : (
            <ul className="py-1">
              {patients.map((patient) => (
                <li key={patient.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(patient)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                  >
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {patient.phone || patient.email || 'Ingen kontaktinfo'}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CONFLICT WARNING COMPONENT
// =============================================================================

function ConflictWarning({ conflicts }) {
  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-red-800">Tidskonflikt oppdaget!</h4>
          <p className="text-sm text-red-700 mt-1">
            Denne tiden overlapper med eksisterende avtaler:
          </p>
          <ul className="mt-2 space-y-1">
            {conflicts.map((conflict, index) => (
              <li key={index} className="text-sm text-red-700">
                {format(parseISO(conflict.start_time), 'HH:mm')} -{' '}
                {format(parseISO(conflict.end_time), 'HH:mm')}: {conflict.patient_name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN BOOKING MODAL COMPONENT
// =============================================================================

export default function BookingModal({
  isOpen,
  onClose,
  initialSlot,
  editingAppointment,
  practitioners,
  existingAppointments,
  onSubmit,
  onCancel,
  isSubmitting,
  isCancelling,
  typeOptions,
}) {
  // Form state
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [practitionerId, setPractitionerId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('FOLLOWUP');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Initialize form from props
  useEffect(() => {
    if (editingAppointment) {
      // Editing mode - populate from existing appointment
      setSelectedPatient({
        id: editingAppointment.patient_id,
        first_name: editingAppointment.patient_name?.split(' ')[0] || '',
        last_name: editingAppointment.patient_name?.split(' ').slice(1).join(' ') || '',
        phone: editingAppointment.patient_phone,
      });
      setPractitionerId(editingAppointment.practitioner_id || '');
      setAppointmentDate(format(parseISO(editingAppointment.start_time), 'yyyy-MM-dd'));
      setAppointmentTime(format(parseISO(editingAppointment.start_time), 'HH:mm'));
      setAppointmentType(editingAppointment.appointment_type || 'FOLLOWUP');

      // Calculate duration
      const start = parseISO(editingAppointment.start_time);
      const end = parseISO(editingAppointment.end_time);
      const durationMins = Math.round((end - start) / 60000);
      setDuration(durationMins);

      setNotes(editingAppointment.patient_notes || '');
    } else if (initialSlot) {
      // New appointment - use slot data
      setSelectedPatient(null);
      setPractitionerId(practitioners[0]?.id || '');
      setAppointmentDate(initialSlot.date);
      setAppointmentTime(initialSlot.time);
      setAppointmentType('FOLLOWUP');
      setDuration(30);
      setNotes('');
    }
  }, [editingAppointment, initialSlot, practitioners]);

  // Update duration when type changes (for new appointments only)
  useEffect(() => {
    if (!editingAppointment && appointmentType) {
      const defaultDuration = DEFAULT_DURATIONS_BY_TYPE[appointmentType] || 30;
      setDuration(defaultDuration);
    }
  }, [appointmentType, editingAppointment]);

  // Check for conflicts
  const conflicts = useMemo(() => {
    if (!appointmentDate || !appointmentTime || !practitionerId) {
      return [];
    }

    const startDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const endDateTime = addMinutes(startDateTime, duration);

    return existingAppointments.filter((apt) => {
      // Skip the appointment we're editing
      if (editingAppointment && apt.id === editingAppointment.id) {
        return false;
      }

      // Skip cancelled appointments
      if (['CANCELLED', 'NO_SHOW'].includes(apt.status)) {
        return false;
      }

      // Only check same practitioner
      if (apt.practitioner_id !== practitionerId) {
        return false;
      }

      const aptStart = parseISO(apt.start_time);
      const aptEnd = parseISO(apt.end_time);

      // Check for overlap
      return (
        (startDateTime >= aptStart && startDateTime < aptEnd) ||
        (endDateTime > aptStart && endDateTime <= aptEnd) ||
        (startDateTime <= aptStart && endDateTime >= aptEnd)
      );
    });
  }, [
    appointmentDate,
    appointmentTime,
    duration,
    practitionerId,
    existingAppointments,
    editingAppointment,
  ]);

  // Calculate end time
  const endTime = useMemo(() => {
    if (!appointmentDate || !appointmentTime) {
      return '';
    }
    const startDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const endDateTime = addMinutes(startDateTime, duration);
    return format(endDateTime, 'HH:mm');
  }, [appointmentDate, appointmentTime, duration]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPatient || !practitionerId || !appointmentDate || !appointmentTime) {
      toast.warning('Vennligst fyll ut alle pakreve felter');
      return;
    }

    if (conflicts.length > 0) {
      const confirmed = window.confirm(
        'Det er en tidskonflikt. Er du sikker pa at du vil opprette denne avtalen likevel?'
      );
      if (!confirmed) {
        return;
      }
    }

    const startDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const endDateTime = addMinutes(startDateTime, duration);

    const formData = {
      patient_id: selectedPatient.id,
      practitioner_id: practitionerId,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      appointment_type: appointmentType,
      patient_notes: notes || null,
    };

    await onSubmit(formData);
  };

  // Handle cancel appointment
  const handleCancelAppointment = async () => {
    if (!cancelReason.trim()) {
      toast.warning('Vennligst oppgi en avsak for avlysning');
      return;
    }
    await onCancel(cancelReason);
    setShowCancelConfirm(false);
    setCancelReason('');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {editingAppointment ? 'Rediger avtale' : 'Ny avtale'}
            </h2>
            {appointmentDate && (
              <p className="text-sm text-gray-600">
                {format(parseISO(appointmentDate), 'EEEE d. MMMM yyyy', { locale: nb })}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto">
          <div className="p-6 space-y-5">
            {/* Patient Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pasient *</label>
              <PatientSearch
                selectedPatient={selectedPatient}
                onSelect={setSelectedPatient}
                onClear={() => setSelectedPatient(null)}
              />
            </div>

            {/* Practitioner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Behandler *</label>
              <select
                value={practitionerId}
                onChange={(e) => setPractitionerId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Velg behandler</option>
                {practitioners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Dato *
                </label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Tidspunkt *
                </label>
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  step="900" // 15 minute intervals
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Type and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                <select
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {Object.entries(typeOptions).map(([type, config]) => (
                    <option key={type} value={type}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Varighet</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* End time display */}
            {appointmentTime && endTime && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                <Clock className="w-4 h-4" />
                <span>
                  Avtalen varer fra <strong>{appointmentTime}</strong> til{' '}
                  <strong>{endTime}</strong>
                </span>
              </div>
            )}

            {/* Conflict Warning */}
            <ConflictWarning conflicts={conflicts} />

            {/* No conflicts message */}
            {practitionerId && appointmentDate && appointmentTime && conflicts.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span>Ingen tidskonflikter</span>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notater</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Eventuell informasjon om avtalen..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Cancel Appointment Section (Edit mode only) */}
            {editingAppointment &&
              !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(editingAppointment.status) && (
                <div className="border-t border-gray-200 pt-5">
                  {showCancelConfirm ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">Avlys avtale</h4>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Arsak til avlysning..."
                        rows={2}
                        className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-3 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleCancelAppointment}
                          disabled={isCancelling}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isCancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                          Bekreft avlysning
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCancelConfirm(false);
                            setCancelReason('');
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Avbryt
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(true)}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Avlys denne avtalen
                    </button>
                  )}
                </div>
              )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedPatient || !practitionerId}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingAppointment ? 'Lagre endringer' : 'Opprett avtale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
