/**
 * Clinical Notes Page
 * Kliniske notater og SOAP-dokumentasjon
 *
 * Clinical notes and SOAP documentation management
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useConfirm } from '../components/ui/ConfirmDialog';
import {
  FileText,
  Plus,
  Search,
  User,
  ChevronDown,
  Edit,
  X,
  RefreshCw,
  ClipboardList,
  Activity,
} from 'lucide-react';
import { clinicalNotesAPI } from '../api/clinicalNotes';
import { api } from '../api/client';
import toast from '../utils/toast';
import logger from '../utils/logger';
import NotesList from '../components/notes/NotesList';
import NotePreview from '../components/notes/NotePreview';
import SOAPTemplate from '../components/notes/SOAPTemplate';
import InitialConsultTemplate from '../components/notes/InitialConsultTemplate';
import FollowUpTemplate from '../components/notes/FollowUpTemplate';
import VestibularAssessment from '../components/notes/VestibularAssessment';

/**
 * ClinicalNotes Component
 * Hovedkomponent for kliniske notater
 *
 * @returns {JSX.Element} Clinical notes management page
 */
export default function ClinicalNotes() {
  const { patientId: routePatientId } = useParams();
  const [searchParams, _setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  // State management
  const [selectedPatientId, setSelectedPatientId] = useState(routePatientId || null);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteType, setNoteType] = useState('soap');
  const [searchTerm, setSearchTerm] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientSelector, setShowPatientSelector] = useState(!routePatientId);
  const [noteTypeFilter, setNoteTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showPreview, setShowPreview] = useState(false);
  const [previewNoteId, setPreviewNoteId] = useState(null);
  const [showNewNoteMenu, setShowNewNoteMenu] = useState(false);

  // Get note type from URL if present
  useEffect(() => {
    const type = searchParams.get('type');
    if (type) {
      setNoteType(type);
      setShowNoteEditor(true);
    }
    const noteId = searchParams.get('noteId');
    if (noteId) {
      setSelectedNoteId(noteId);
    }
  }, [searchParams]);

  // Fetch patients for selector
  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ['patients', patientSearchTerm],
    queryFn: () => api.patients.search(patientSearchTerm || ''),
    enabled: showPatientSelector || !selectedPatientId,
  });

  // Fetch selected patient details
  const { data: selectedPatient, isLoading: _patientLoading } = useQuery({
    queryKey: ['patient', selectedPatientId],
    queryFn: () => api.patients.getById(selectedPatientId),
    enabled: !!selectedPatientId,
  });

  // Fetch notes for selected patient
  const {
    data: notesData,
    isLoading: notesLoading,
    refetch: _refetchNotes,
  } = useQuery({
    queryKey: ['clinical-notes', selectedPatientId, noteTypeFilter, dateRange, searchTerm],
    queryFn: () =>
      clinicalNotesAPI.getByPatient(selectedPatientId, {
        templateType: noteTypeFilter !== 'all' ? noteTypeFilter : undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        search: searchTerm || undefined,
        includeDrafts: true,
      }),
    enabled: !!selectedPatientId,
  });

  // Fetch note details for preview
  const { data: previewNote, isLoading: previewLoading } = useQuery({
    queryKey: ['clinical-note', previewNoteId],
    queryFn: () => clinicalNotesAPI.getById(previewNoteId),
    enabled: !!previewNoteId && showPreview,
  });

  // Fetch note for editing
  const { data: editingNote, isLoading: editingNoteLoading } = useQuery({
    queryKey: ['clinical-note', selectedNoteId],
    queryFn: () => clinicalNotesAPI.getById(selectedNoteId),
    enabled: !!selectedNoteId && showNoteEditor,
  });

  // Fetch user's draft notes
  const { data: draftsData } = useQuery({
    queryKey: ['clinical-notes-drafts'],
    queryFn: () => clinicalNotesAPI.getDrafts(),
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: (data) => clinicalNotesAPI.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['clinical-notes', selectedPatientId]);
      queryClient.invalidateQueries(['clinical-notes-drafts']);
      if (response?.data?.id) {
        setSelectedNoteId(response.data.id);
      }
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }) => clinicalNotesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clinical-notes', selectedPatientId]);
      queryClient.invalidateQueries(['clinical-notes-drafts']);
    },
  });

  // Sign note mutation
  const signNoteMutation = useMutation({
    mutationFn: (id) => clinicalNotesAPI.sign(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['clinical-notes', selectedPatientId]);
      queryClient.invalidateQueries(['clinical-notes-drafts']);
      setShowNoteEditor(false);
      setSelectedNoteId(null);
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (id) => clinicalNotesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['clinical-notes', selectedPatientId]);
      queryClient.invalidateQueries(['clinical-notes-drafts']);
    },
  });

  /**
   * Handle patient selection
   * Handterer pasientvalg
   */
  const handleSelectPatient = (patient) => {
    setSelectedPatientId(patient.id);
    setShowPatientSelector(false);
    setPatientSearchTerm('');
    // Update URL
    navigate(`/notes/${patient.id}`, { replace: true });
  };

  /**
   * Handle creating new note
   * Handterer opprettelse av nytt notat
   */
  const handleCreateNote = (type) => {
    if (!selectedPatientId) {
      setShowPatientSelector(true);
      return;
    }
    setNoteType(type);
    setSelectedNoteId(null);
    setShowNoteEditor(true);
    setShowNewNoteMenu(false);
  };

  /**
   * Handle viewing note details
   * Handterer visning av notatdetaljer
   */
  const handleViewNote = (noteId) => {
    setPreviewNoteId(noteId);
    setShowPreview(true);
  };

  /**
   * Handle editing note
   * Handterer redigering av notat
   */
  const handleEditNote = (note) => {
    setSelectedNoteId(note.id);
    setNoteType(note.template_type || 'soap');
    setShowNoteEditor(true);
    setShowPreview(false);
  };

  /**
   * Handle saving note
   * Handterer lagring av notat
   */
  const handleSaveNote = async (noteData) => {
    const data = {
      patient_id: selectedPatientId,
      note_type: 'SOAP',
      template_type: noteType,
      ...noteData,
      is_draft: true,
    };

    if (selectedNoteId) {
      await updateNoteMutation.mutateAsync({ id: selectedNoteId, data });
    } else {
      const response = await createNoteMutation.mutateAsync(data);
      if (response?.data?.id) {
        setSelectedNoteId(response.data.id);
      }
    }
  };

  /**
   * Handle signing/locking note
   * Handterer signering/lasting av notat
   */
  const handleSignNote = async (noteData) => {
    // First save, then sign
    await handleSaveNote({ ...noteData, is_draft: false });
    if (selectedNoteId) {
      await signNoteMutation.mutateAsync(selectedNoteId);
    }
  };

  /**
   * Handle deleting note
   * Handterer sletting av notat
   */
  const handleDeleteNote = async (noteId) => {
    const ok = await confirm({
      title: 'Slett notat',
      description: 'Er du sikker på at du vil slette dette notatet? Dette kan ikke angres.',
      variant: 'destructive',
    });
    if (ok) {
      await deleteNoteMutation.mutateAsync(noteId);
      if (showPreview && previewNoteId === noteId) {
        setShowPreview(false);
        setPreviewNoteId(null);
      }
    }
  };

  /**
   * Handle print note
   * Handterer utskrift av notat
   */
  const handlePrintNote = async (noteId) => {
    try {
      const response = await clinicalNotesAPI.generateFormatted(noteId);
      const formattedNote = response?.data?.data?.formatted_note;

      // Open print window
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Klinisk Notat</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
              pre { white-space: pre-wrap; font-family: inherit; }
              @media print {
                body { padding: 20px; }
              }
            </style>
          </head>
          <body>
            <pre>${formattedNote}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      logger.error('Error printing note:', error);
      toast.error('Kunne ikke generere utskrift. Prosv igjen.');
    }
  };

  /**
   * Handle PDF export
   * Handterer PDF-eksport
   */
  const handleExportPDF = async (noteId) => {
    try {
      // Get the PDF from the backend
      const response = await clinicalNotesAPI.downloadPDF(noteId);

      // Create blob from response data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = `klinisk-notat-${noteId}.pdf`;
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="(.+)"/);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Create download link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Error exporting note:', error);
      toast.error('Kunne ikke eksportere PDF. Vennligst prov igjen.');
    }
  };

  /**
   * Get note type badge color
   * Henter farge for notattype-merke
   */
  const getNoteTypeBadge = (type) => {
    const badges = {
      soap: 'bg-blue-100 text-blue-800',
      standard: 'bg-blue-100 text-blue-800',
      initial: 'bg-green-100 text-green-800',
      initial_consult: 'bg-green-100 text-green-800',
      followup: 'bg-purple-100 text-purple-800',
      follow_up: 'bg-purple-100 text-purple-800',
      discharge: 'bg-orange-100 text-orange-800',
      vestibular: 'bg-teal-100 text-teal-800',
      VESTIBULAR: 'bg-teal-100 text-teal-800',
    };
    return badges[type] || 'bg-gray-100 text-gray-800';
  };

  /**
   * Get note type label in Norwegian
   * Henter notattype-etikett pa norsk
   */
  const getNoteTypeLabel = (type) => {
    const labels = {
      soap: 'SOAP',
      standard: 'SOAP',
      initial: 'Forstegangskonsultasjon',
      initial_consult: 'Forstegangskonsultasjon',
      followup: 'Oppfolging',
      follow_up: 'Oppfolging',
      discharge: 'Utskrivning',
      vestibular: 'Vestibular',
      VESTIBULAR: 'Vestibular',
    };
    return labels[type] || type;
  };

  /**
   * Render the appropriate note template
   * Rendrer riktig notatmal
   */
  const renderNoteTemplate = () => {
    const patient = selectedPatient?.data || selectedPatient;
    const noteData = editingNote?.data || editingNote;
    const readOnly = noteData?.signed_at !== null && noteData?.signed_at !== undefined;

    const commonProps = {
      patient,
      initialData: noteData,
      onSave: handleSaveNote,
      onLock: handleSignNote,
      readOnly,
    };

    switch (noteType) {
      case 'initial':
      case 'initial_consult':
        return <InitialConsultTemplate {...commonProps} />;
      case 'followup':
      case 'follow_up':
        return <FollowUpTemplate {...commonProps} />;
      case 'vestibular':
      case 'VESTIBULAR':
        return <VestibularAssessment {...commonProps} />;
      case 'soap':
      case 'standard':
      default:
        return <SOAPTemplate {...commonProps} />;
    }
  };

  const notes = notesData?.data?.data || notesData?.data || [];
  const drafts = draftsData?.data?.data || draftsData?.data || [];
  const patients = patientsData?.data?.data || patientsData?.data || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / Overskrift */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Kliniske Notater</h1>
              </div>

              {/* Patient selector button */}
              <button
                onClick={() => setShowPatientSelector(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <User className="w-4 h-4 text-gray-600" />
                {selectedPatient?.data?.first_name || selectedPatient?.first_name ? (
                  <span className="text-sm font-medium text-gray-900">
                    {selectedPatient?.data?.first_name || selectedPatient?.first_name}{' '}
                    {selectedPatient?.data?.last_name || selectedPatient?.last_name}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">Velg pasient...</span>
                )}
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Drafts indicator */}
              {drafts.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Edit className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">{drafts.length} utkast</span>
                </div>
              )}

              {/* New note button with dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowNewNoteMenu(!showNewNoteMenu)}
                  disabled={!selectedPatientId}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Nytt notat
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showNewNoteMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => handleCreateNote('soap')}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">SOAP Notat</p>
                        <p className="text-xs text-gray-500">Standard konsultasjon</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleCreateNote('initial')}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <ClipboardList className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Forstegangskonsultasjon</p>
                        <p className="text-xs text-gray-500">Ny pasient</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleCreateNote('followup')}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                    >
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Oppfolgingskonsultasjon</p>
                        <p className="text-xs text-gray-500">Eksisterende pasient</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleCreateNote('vestibular')}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                    >
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                        <Activity className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Vestibular vurdering</p>
                        <p className="text-xs text-gray-500">Svimmelhet/balanse</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {showNoteEditor ? (
          /* Note Editor View */
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowNoteEditor(false);
                    setSelectedNoteId(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedNoteId ? 'Rediger notat' : `Nytt ${getNoteTypeLabel(noteType)} notat`}
                </h2>
              </div>
            </div>

            {editingNoteLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              renderNoteTemplate()
            )}
          </div>
        ) : (
          /* Notes List View */
          <>
            {/* Quick Actions / Hurtighandlinger */}
            {selectedPatientId && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <button
                  onClick={() => handleCreateNote('soap')}
                  className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">SOAP Notat</p>
                    <p className="text-xs text-gray-500">Standard konsultasjon</p>
                  </div>
                </button>
                <button
                  onClick={() => handleCreateNote('initial')}
                  className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Forstegangskonsultasjon</p>
                    <p className="text-xs text-gray-500">Ny pasient</p>
                  </div>
                </button>
                <button
                  onClick={() => handleCreateNote('followup')}
                  className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Oppfolgingskonsultasjon</p>
                    <p className="text-xs text-gray-500">Eksisterende pasient</p>
                  </div>
                </button>
                <button
                  onClick={() => handleCreateNote('vestibular')}
                  className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-teal-300 hover:bg-teal-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Vestibular vurdering</p>
                    <p className="text-xs text-gray-500">Svimmelhet/balanse</p>
                  </div>
                </button>
              </div>
            )}

            {/* Search and Filters / Sok og filtre */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Sok i notater..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <select
                  value={noteTypeFilter}
                  onChange={(e) => setNoteTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Alle typer</option>
                  <option value="soap">SOAP</option>
                  <option value="initial">Forstegangskonsultasjon</option>
                  <option value="followup">Oppfolging</option>
                  <option value="vestibular">Vestibular</option>
                </select>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Fra dato"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Til dato"
                />
              </div>
            </div>

            {/* Notes List Component */}
            <NotesList
              notes={notes}
              isLoading={notesLoading}
              onViewNote={handleViewNote}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
              onPrintNote={handlePrintNote}
              onExportNote={handleExportPDF}
              selectedPatientId={selectedPatientId}
              getNoteTypeBadge={getNoteTypeBadge}
              getNoteTypeLabel={getNoteTypeLabel}
            />
          </>
        )}
      </div>

      {/* Patient Selector Modal / Pasientvelger-modal */}
      {showPatientSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Velg pasient</h3>
              <button
                onClick={() => setShowPatientSelector(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Sok etter pasient..."
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="max-h-96 overflow-y-auto">
                {patientsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : patients.length > 0 ? (
                  <div className="space-y-2">
                    {patients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {patient.date_of_birth &&
                              new Date(patient.date_of_birth).toLocaleDateString('no-NO')}
                            {patient.solvit_id && ` - ${patient.solvit_id}`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {patientSearchTerm
                      ? 'Ingen pasienter funnet'
                      : 'Skriv for a soke etter pasienter'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Preview Modal / Notatforhondsvisning-modal */}
      {showPreview && (
        <NotePreview
          note={previewNote?.data || previewNote}
          isLoading={previewLoading}
          onClose={() => {
            setShowPreview(false);
            setPreviewNoteId(null);
          }}
          onEdit={handleEditNote}
          onPrint={handlePrintNote}
          onExport={handleExportPDF}
          onDelete={handleDeleteNote}
          getNoteTypeBadge={getNoteTypeBadge}
          getNoteTypeLabel={getNoteTypeLabel}
        />
      )}

      {/* Click outside to close new note menu */}
      {showNewNoteMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNewNoteMenu(false)} />
      )}
    </div>
  );
}
