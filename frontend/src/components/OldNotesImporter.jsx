/**
 * Old Notes Importer Component
 * Upload and organize old journal notes with AI assistance
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from '../utils/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/**
 * OldNotesImporter Component
 * Main component for importing old journal notes
 */
export default function OldNotesImporter({ patientId, onClose }) {
  const [noteContent, setNoteContent] = useState('');
  const [filename, setFilename] = useState('');
  const [uploadMode, setUploadMode] = useState('single'); // 'single' or 'multiple'
  const [multipleNotes, setMultipleNotes] = useState([{ content: '', filename: '' }]);
  const [processImmediately, setProcessImmediately] = useState(true);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  const queryClient = useQueryClient();

  // Fetch existing imported notes for this patient
  const { data: existingNotes, isLoading: loadingNotes } = useQuery({
    queryKey: ['oldNotes', patientId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/patients/${patientId}/old-notes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data;
    },
  });

  // Upload single note mutation
  const uploadNoteMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post(`${API_URL}/patients/${patientId}/old-notes`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['oldNotes', patientId]);
      setNoteContent('');
      setFilename('');
      toast.success('Notat lastet opp!');
    },
    onError: (error) => {
      toast.error(`Feil ved opplasting: ${error.response?.data?.error || error.message}`);
    },
  });

  // Upload multiple notes mutation
  const uploadMultipleMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post(`${API_URL}/patients/${patientId}/old-notes/batch`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['oldNotes', patientId]);
      setMultipleNotes([{ content: '', filename: '' }]);
      toast.success('Notater lastet opp!');
    },
    onError: (error) => {
      toast.error(`Feil ved opplasting: ${error.response?.data?.error || error.message}`);
    },
  });

  // Process note mutation
  const processNoteMutation = useMutation({
    mutationFn: async (noteId) => {
      const response = await axios.post(
        `${API_URL}/old-notes/${noteId}/process`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['oldNotes', patientId]);
      toast.success('Notat prosessert!');
    },
    onError: (error) => {
      toast.error(`Feil ved prosessering: ${error.response?.data?.error || error.message}`);
    },
  });

  // Approve note mutation
  const approveNoteMutation = useMutation({
    mutationFn: async ({ noteId, approved, reviewNotes }) => {
      const response = await axios.put(
        `${API_URL}/old-notes/${noteId}/review`,
        { approved, reviewNotes },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['oldNotes', patientId]);
      toast.success('Vurdering lagret!');
    },
  });

  // Convert to encounter mutation
  const convertMutation = useMutation({
    mutationFn: async (noteId) => {
      const response = await axios.post(
        `${API_URL}/old-notes/${noteId}/convert`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['oldNotes', patientId]);
      queryClient.invalidateQueries(['encounters', patientId]);
      toast.success(`Notat konvertert til journal #${data.encounter.id}!`);
    },
    onError: (error) => {
      toast.error(`Feil ved konvertering: ${error.response?.data?.error || error.message}`);
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId) => {
      await axios.delete(`${API_URL}/old-notes/${noteId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['oldNotes', patientId]);
      setSelectedNoteId(null);
      toast.success('Notat slettet!');
    },
  });

  const handleUploadSingle = () => {
    if (!noteContent.trim()) {
      toast.warning('Vennligst skriv inn notatinnhold');
      return;
    }

    uploadNoteMutation.mutate({
      content: noteContent,
      filename: filename || 'manual-upload.txt',
      processImmediately,
    });
  };

  const handleUploadMultiple = () => {
    const validNotes = multipleNotes.filter((n) => n.content.trim());

    if (validNotes.length === 0) {
      toast.warning('Vennligst skriv inn minst ett notat');
      return;
    }

    uploadMultipleMutation.mutate({
      notes: validNotes,
      batchName: `Import ${new Date().toLocaleDateString('nb-NO')}`,
      processImmediately,
    });
  };

  const addNoteField = () => {
    setMultipleNotes([...multipleNotes, { content: '', filename: '' }]);
  };

  const removeNoteField = (index) => {
    setMultipleNotes(multipleNotes.filter((_, i) => i !== index));
  };

  const updateNoteField = (index, field, value) => {
    const updated = [...multipleNotes];
    updated[index][field] = value;
    setMultipleNotes(updated);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-gray-100 text-gray-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      reviewed: 'bg-purple-100 text-purple-800',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badges[status] || badges.pending}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const selectedNote = existingNotes?.notes?.find((n) => n.id === selectedNoteId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Importer gamle journalnotater</h2>
              <p className="text-blue-100 mt-1">
                Last opp og organiser historiske pasientnotater med AI-assistanse
              </p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-blue-800 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Upload Section */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Slik fungerer det</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Lim inn eller skriv gamle journalnotater nedenfor</li>
                  <li>AI organiserer og strukturerer innholdet</li>
                  <li>Gjennomga og rediger det AI-genererte SOAP-formatet</li>
                  <li>Godkjenn og konverter til klinisk journal</li>
                </ol>
              </div>

              {/* Upload Mode Selector */}
              <div className="flex space-x-2 border-b">
                <button
                  onClick={() => setUploadMode('single')}
                  className={`px-4 py-2 font-medium ${
                    uploadMode === 'single'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Enkelt notat
                </button>
                <button
                  onClick={() => setUploadMode('multiple')}
                  className={`px-4 py-2 font-medium ${
                    uploadMode === 'multiple'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Flere notater
                </button>
              </div>

              {/* Single Note Upload */}
              {uploadMode === 'single' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filnavn (valgfritt)
                    </label>
                    <input
                      type="text"
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                      placeholder="e.g., 2020-01-15-visit.txt"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notatinnhold *
                    </label>
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Lim inn gammelt journalnotat her..."
                      rows={12}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="processImmediately"
                      checked={processImmediately}
                      onChange={(e) => setProcessImmediately(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="processImmediately" className="text-sm text-gray-700">
                      Prosesser med AI umiddelbart
                    </label>
                  </div>

                  <button
                    onClick={handleUploadSingle}
                    disabled={uploadNoteMutation.isPending}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                  >
                    {uploadNoteMutation.isPending ? 'Laster opp...' : 'Last opp notat'}
                  </button>
                </div>
              )}

              {/* Multiple Notes Upload */}
              {uploadMode === 'multiple' && (
                <div className="space-y-3">
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {multipleNotes.map((note, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">Notat {index + 1}</span>
                          {multipleNotes.length > 1 && (
                            <button
                              onClick={() => removeNoteField(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Fjern
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={note.filename}
                          onChange={(e) => updateNoteField(index, 'filename', e.target.value)}
                          placeholder="Filnavn (valgfritt)"
                          className="w-full px-2 py-1 border rounded mb-2 text-sm"
                        />
                        <textarea
                          value={note.content}
                          onChange={(e) => updateNoteField(index, 'content', e.target.value)}
                          placeholder="Notatinnhold..."
                          rows={4}
                          className="w-full px-2 py-1 border rounded font-mono text-xs"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addNoteField}
                    className="w-full border-2 border-dashed border-gray-300 text-gray-600 py-2 px-4 rounded-lg hover:border-blue-500 hover:text-blue-600"
                  >
                    + Legg til nytt notat
                  </button>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="processImmediatelyMultiple"
                      checked={processImmediately}
                      onChange={(e) => setProcessImmediately(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="processImmediatelyMultiple" className="text-sm text-gray-700">
                      Prosesser alle notater med AI umiddelbart
                    </label>
                  </div>

                  <button
                    onClick={handleUploadMultiple}
                    disabled={uploadMultipleMutation.isPending}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                  >
                    {uploadMultipleMutation.isPending
                      ? 'Laster opp...'
                      : `Last opp ${multipleNotes.filter((n) => n.content.trim()).length} notater`}
                  </button>
                </div>
              )}
            </div>

            {/* Right: Existing Notes List */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-lg">Importerte notater</h3>

              {loadingNotes ? (
                <div className="text-center py-8 text-gray-500">Laster...</div>
              ) : existingNotes?.notes?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Ingen importerte notater enna. Last opp ditt forste notat for a komme i gang.
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {existingNotes?.notes?.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => setSelectedNoteId(note.id)}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedNoteId === note.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-sm">{note.original_filename}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(note.upload_date).toLocaleDateString('nb-NO')}
                          </div>
                        </div>
                        {getStatusBadge(note.processing_status)}
                      </div>

                      {note.ai_confidence_score && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-600 mb-1">
                            AI-konfidens: {(note.ai_confidence_score * 100).toFixed(0)}%
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${note.ai_confidence_score * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {note.approved && (
                        <div className="mt-2 text-xs text-green-600 font-medium">✓ Godkjent</div>
                      )}

                      {note.converted_to_encounter_id && (
                        <div className="mt-2 text-xs text-purple-600 font-medium">
                          → Konvertert til journal #{note.converted_to_encounter_id}
                        </div>
                      )}

                      <div className="mt-2 flex space-x-2">
                        {note.processing_status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              processNoteMutation.mutate(note.id);
                            }}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                          >
                            Prosesser
                          </button>
                        )}

                        {note.processing_status === 'completed' && !note.approved && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              approveNoteMutation.mutate({ noteId: note.id, approved: true });
                            }}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                          >
                            Godkjenn
                          </button>
                        )}

                        {note.approved && !note.converted_to_encounter_id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              convertMutation.mutate(note.id);
                            }}
                            className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                          >
                            Konverter til journal
                          </button>
                        )}

                        {!note.converted_to_encounter_id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info('Vil du slette dette notatet?', {
                                action: {
                                  label: 'Slett',
                                  onClick: () => deleteNoteMutation.mutate(note.id),
                                },
                                cancel: {
                                  label: 'Avbryt',
                                  onClick: () => {},
                                },
                                duration: 10000,
                              });
                            }}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Slett
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Note Detail */}
          {selectedNote && (
            <div className="mt-6 border-t pt-6">
              <h3 className="font-semibold text-gray-900 text-lg mb-4">Notatdetaljer</h3>

              <div className="grid grid-cols-2 gap-6">
                {/* Original Content */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Originalt innhold</h4>
                  <div className="bg-gray-50 p-3 rounded border text-sm font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {selectedNote.original_content}
                  </div>
                </div>

                {/* AI-Generated SOAP */}
                {selectedNote.generated_soap && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">AI-generert SOAP-format</h4>
                    <div className="bg-green-50 p-3 rounded border text-sm max-h-64 overflow-y-auto space-y-2">
                      {selectedNote.generated_soap.subjective && (
                        <div>
                          <div className="font-semibold text-green-900">Subjective:</div>
                          <div className="text-gray-700 ml-2">
                            {selectedNote.generated_soap.subjective.chief_complaint}
                          </div>
                        </div>
                      )}
                      {selectedNote.generated_soap.objective && (
                        <div>
                          <div className="font-semibold text-green-900">Objective:</div>
                          <div className="text-gray-700 ml-2">
                            {selectedNote.generated_soap.objective.observation}
                          </div>
                        </div>
                      )}
                      {selectedNote.generated_soap.assessment && (
                        <div>
                          <div className="font-semibold text-green-900">Assessment:</div>
                          <div className="text-gray-700 ml-2">
                            {selectedNote.generated_soap.assessment.clinical_reasoning}
                          </div>
                        </div>
                      )}
                      {selectedNote.generated_soap.plan && (
                        <div>
                          <div className="font-semibold text-green-900">Plan:</div>
                          <div className="text-gray-700 ml-2">
                            {selectedNote.generated_soap.plan.treatment}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
