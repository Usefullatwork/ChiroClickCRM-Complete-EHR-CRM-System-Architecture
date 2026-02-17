/**
 * PatientFlowBoard - Visual Kanban-style patient flow dashboard
 *
 * Features:
 * - Drag-and-drop status changes
 * - Real-time view of patient flow
 * - Color-coded appointment types
 * - Quick actions on cards
 * - Bilingual support (EN/NO)
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Clock,
  FileText,
  MoreVertical,
  AlertTriangle,
  CheckCircle2,
  Play,
  XCircle,
  RefreshCw,
} from 'lucide-react';

// =============================================================================
// CONSTANTS & TRANSLATIONS
// =============================================================================

const COLUMNS = [
  { id: 'SCHEDULED', color: 'slate', icon: Clock },
  { id: 'CONFIRMED', color: 'blue', icon: CheckCircle2 },
  { id: 'ARRIVED', color: 'amber', icon: User },
  { id: 'IN_PROGRESS', color: 'purple', icon: Play },
  { id: 'COMPLETED', color: 'green', icon: CheckCircle2 },
];

const TRANSLATIONS = {
  en: {
    title: 'Patient Flow',
    subtitle: 'Drag cards to update status',
    SCHEDULED: 'Scheduled',
    CONFIRMED: 'Confirmed',
    ARRIVED: 'Arrived',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    NO_SHOW: 'No Show',
    CANCELLED: 'Cancelled',
    noPatients: 'No patients',
    viewChart: 'View Chart',
    startVisit: 'Start Visit',
    checkIn: 'Check In',
    markNoShow: 'Mark No Show',
    complete: 'Complete',
    newPatient: 'New Patient',
    followUp: 'Follow-up',
    acute: 'Acute',
    maintenance: 'Maintenance',
    refresh: 'Refresh',
    today: 'Today',
    kioskCheckin: 'Kiosk check-in',
  },
  no: {
    title: 'Pasientflyt',
    subtitle: 'Dra kort for å oppdatere status',
    SCHEDULED: 'Planlagt',
    CONFIRMED: 'Bekreftet',
    ARRIVED: 'Ankommet',
    IN_PROGRESS: 'Pågår',
    COMPLETED: 'Fullført',
    NO_SHOW: 'Uteblitt',
    CANCELLED: 'Avlyst',
    noPatients: 'Ingen pasienter',
    viewChart: 'Se journal',
    startVisit: 'Start besøk',
    checkIn: 'Sjekk inn',
    markNoShow: 'Merk uteblitt',
    complete: 'Fullfør',
    newPatient: 'Ny pasient',
    followUp: 'Oppfølging',
    acute: 'Akutt',
    maintenance: 'Vedlikehold',
    refresh: 'Oppdater',
    today: 'I dag',
    kioskCheckin: 'Kiosk-innsjekking',
  },
};

const APPOINTMENT_TYPES = {
  INITIAL: { en: 'New Patient', no: 'Ny pasient', color: 'blue' },
  NEW_PATIENT: { en: 'New Patient', no: 'Ny pasient', color: 'blue' },
  FOLLOWUP: { en: 'Follow-up', no: 'Oppfølging', color: 'green' },
  FOLLOW_UP: { en: 'Follow-up', no: 'Oppfølging', color: 'green' },
  ACUTE: { en: 'Acute', no: 'Akutt', color: 'red' },
  MAINTENANCE: { en: 'Maintenance', no: 'Vedlikehold', color: 'purple' },
  REEXAM: { en: 'Re-exam', no: 'Reundersøkelse', color: 'cyan' },
};

// =============================================================================
// PATIENT CARD COMPONENT
// =============================================================================

function PatientCard({
  appointment,
  lang,
  onDragStart,
  onStatusChange,
  onViewChart,
  onStartVisit,
}) {
  const t = TRANSLATIONS[lang];
  const [showMenu, setShowMenu] = useState(false);

  const typeInfo = APPOINTMENT_TYPES[appointment.appointmentType] ||
    APPOINTMENT_TYPES[appointment.appointment_type] || { en: 'Visit', no: 'Besøk', color: 'gray' };

  const patientName =
    appointment.patientName ||
    `${appointment.patient?.first_name || appointment.firstName || ''} ${appointment.patient?.last_name || appointment.lastName || ''}`.trim();

  const appointmentTime = appointment.startTime || appointment.start_time;
  const formattedTime = appointmentTime
    ? new Date(appointmentTime).toLocaleTimeString(lang === 'no' ? 'nb-NO' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '';

  const hasKioskIntake = appointment.hasIntake || appointment.has_intake;
  const hasRedFlags = appointment.redFlags?.length > 0 || appointment.red_flags?.length > 0;

  const handleDragStart = (e) => {
    e.dataTransfer.setData('appointmentId', appointment.id);
    e.dataTransfer.setData('currentStatus', appointment.status);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(appointment);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-white rounded-lg border border-gray-200 p-3 mb-2 cursor-grab
                 hover:shadow-md hover:border-gray-300 transition-all
                 active:cursor-grabbing active:shadow-lg active:scale-[1.02]
                 group relative"
    >
      {/* Red flag indicator */}
      {hasRedFlags && (
        <div
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full
                        flex items-center justify-center"
        >
          <AlertTriangle className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Header: Time + Type */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">{formattedTime}</span>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium
          bg-${typeInfo.color}-100 text-${typeInfo.color}-700`}
          style={{
            backgroundColor: `var(--color-${typeInfo.color}-100, #f0f9ff)`,
            color: `var(--color-${typeInfo.color}-700, #0369a1)`,
          }}
        >
          {typeInfo[lang]}
        </span>
      </div>

      {/* Patient Name */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-gray-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {patientName || 'Unknown Patient'}
          </p>
          {hasKioskIntake && (
            <p className="text-xs text-teal-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {t.kioskCheckin}
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions - visible on hover */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onViewChart?.(appointment)}
          className="flex-1 px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200
                     rounded text-gray-700 transition-colors flex items-center justify-center gap-1"
        >
          <FileText className="w-3 h-3" />
          {t.viewChart}
        </button>
        {appointment.status === 'ARRIVED' && (
          <button
            onClick={() => onStartVisit?.(appointment)}
            className="flex-1 px-2 py-1.5 text-xs bg-purple-100 hover:bg-purple-200
                       rounded text-purple-700 transition-colors flex items-center justify-center gap-1"
          >
            <Play className="w-3 h-3" />
            {t.startVisit}
          </button>
        )}
      </div>

      {/* Context menu button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100
                   opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MoreVertical className="w-4 h-4 text-gray-400" />
      </button>

      {/* Context menu dropdown */}
      {showMenu && (
        <div
          className="absolute right-0 top-8 z-10 w-40 bg-white rounded-lg shadow-lg
                        border border-gray-200 py-1"
        >
          <button
            onClick={() => {
              onViewChart?.(appointment);
              setShowMenu(false);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> {t.viewChart}
          </button>
          {appointment.status === 'CONFIRMED' && (
            <button
              onClick={() => {
                onStatusChange?.(appointment, 'ARRIVED');
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <User className="w-4 h-4" /> {t.checkIn}
            </button>
          )}
          {appointment.status === 'ARRIVED' && (
            <button
              onClick={() => {
                onStartVisit?.(appointment);
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> {t.startVisit}
            </button>
          )}
          {appointment.status === 'IN_PROGRESS' && (
            <button
              onClick={() => {
                onStatusChange?.(appointment, 'COMPLETED');
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> {t.complete}
            </button>
          )}
          {['SCHEDULED', 'CONFIRMED'].includes(appointment.status) && (
            <button
              onClick={() => {
                onStatusChange?.(appointment, 'NO_SHOW');
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" /> {t.markNoShow}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COLUMN COMPONENT
// =============================================================================

function FlowColumn({
  column,
  appointments,
  lang,
  onDrop,
  onStatusChange,
  onViewChart,
  onStartVisit,
}) {
  const t = TRANSLATIONS[lang];
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const appointmentId = e.dataTransfer.getData('appointmentId');
    const fromStatus = e.dataTransfer.getData('currentStatus');
    if (appointmentId && fromStatus !== column.id) {
      onDrop?.(appointmentId, column.id);
    }
  };

  const columnColors = {
    slate: 'bg-slate-50 border-slate-200',
    blue: 'bg-blue-50 border-blue-200',
    amber: 'bg-amber-50 border-amber-200',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
  };

  const headerColors = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    purple: 'bg-purple-100 text-purple-700',
    green: 'bg-green-100 text-green-700',
  };

  const IconComponent = column.icon;

  return (
    <div
      className={`flex-1 min-w-[240px] max-w-[320px] rounded-xl border-2 transition-all
        ${columnColors[column.color]}
        ${isDragOver ? 'ring-2 ring-blue-400 ring-offset-2 scale-[1.02]' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className={`px-4 py-3 rounded-t-lg ${headerColors[column.color]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconComponent className="w-4 h-4" />
            <h3 className="font-semibold text-sm">{t[column.id]}</h3>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/50">
            {appointments.length}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div className="p-3 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto">
        {appointments.length > 0 ? (
          appointments.map((apt) => (
            <PatientCard
              key={apt.id}
              appointment={apt}
              lang={lang}
              onStatusChange={onStatusChange}
              onViewChart={onViewChart}
              onStartVisit={onStartVisit}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t.noPatients}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PatientFlowBoard({
  appointments = [],
  lang = 'no',
  onStatusChange,
  onRefresh,
  isLoading = false,
}) {
  const navigate = useNavigate();
  const t = TRANSLATIONS[lang];

  // Group appointments by status
  const groupedAppointments = COLUMNS.reduce((acc, column) => {
    acc[column.id] = appointments.filter((apt) => apt.status === column.id);
    return acc;
  }, {});

  // Handle status change via drag and drop
  const handleDrop = useCallback(
    (appointmentId, newStatus) => {
      onStatusChange?.(appointmentId, newStatus);
    },
    [onStatusChange]
  );

  // Handle view chart
  const handleViewChart = useCallback(
    (appointment) => {
      const patientId = appointment.patientId || appointment.patient_id || appointment.patient?.id;
      if (patientId) {
        navigate(`/patients/${patientId}/encounter`);
      }
    },
    [navigate]
  );

  // Handle start visit
  const handleStartVisit = useCallback(
    (appointment) => {
      // First update status to IN_PROGRESS
      onStatusChange?.(appointment.id, 'IN_PROGRESS');
      // Then navigate to encounter
      const patientId = appointment.patientId || appointment.patient_id || appointment.patient?.id;
      if (patientId) {
        navigate(`/patients/${patientId}/encounter`);
      }
    },
    [navigate, onStatusChange]
  );

  // Count stats
  const totalToday = appointments.length;
  const completed = groupedAppointments['COMPLETED']?.length || 0;
  const inProgress = groupedAppointments['IN_PROGRESS']?.length || 0;
  const waiting = groupedAppointments['ARRIVED']?.length || 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-sm text-gray-500">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Stats pills */}
          <div className="hidden md:flex items-center gap-2">
            <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
              {t.today}: <strong>{totalToday}</strong>
            </span>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
              Waiting: <strong>{waiting}</strong>
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              In Progress: <strong>{inProgress}</strong>
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              Done: <strong>{completed}</strong>
            </span>
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg
                       hover:bg-gray-50 transition-colors flex items-center gap-2
                       disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t.refresh}
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {COLUMNS.map((column) => (
            <FlowColumn
              key={column.id}
              column={column}
              appointments={groupedAppointments[column.id] || []}
              lang={lang}
              onDrop={handleDrop}
              onStatusChange={(apt, status) => onStatusChange?.(apt.id, status)}
              onViewChart={handleViewChart}
              onStartVisit={handleStartVisit}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
