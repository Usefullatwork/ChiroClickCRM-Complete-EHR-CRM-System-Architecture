/**
 * Exercises Page
 * Standalone exercise library management and prescription history
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import {
  ArrowLeft,
  Plus,
  Dumbbell,
  Loader2,
  AlertCircle,
  FileText,
  Check,
  Download,
  History,
  Mail,
  MessageSquare,
  Eye,
  X,
} from 'lucide-react';
import { exercisesApi } from '../api/exercises';
import ExerciseLibrary from '../components/exercises/ExerciseLibrary';
import ExercisePrescription from '../components/exercises/ExercisePrescription';

export default function Exercises() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  // View state
  const [activeTab, setActiveTab] = useState('library'); // library, prescriptions, create
  const { lang: language, setLang: setLanguage } = useTranslation();

  // Data state
  const [exercises, setExercises] = useState([]);
  const [categories, setCategories] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [_showCreateModal, _setShowCreateModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // Mock patient data (would come from context in real app)
  const patient = patientId
    ? {
        id: patientId,
        first_name: 'Demo',
        last_name: 'Pasient',
        email: 'demo@example.com',
        phone: '+4712345678',
      }
    : null;

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load exercises and categories in parallel
      const [exercisesRes, categoriesRes] = await Promise.all([
        exercisesApi.getExercises({ limit: 500 }),
        exercisesApi.getCategories(),
      ]);

      setExercises(exercisesRes.data || []);
      setCategories(categoriesRes.data || []);

      // Load prescriptions if we have a patient
      if (patientId) {
        const prescriptionsRes = await exercisesApi.getPatientPrescriptions(patientId);
        setPrescriptions(prescriptionsRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load exercises:', err);
      setError(language === 'no' ? 'Kunne ikke laste øvelser' : 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  // Handle exercise selection for prescription
  const handleSelectExercise = (exercise) => {
    const isAlreadySelected = selectedExercises.some(
      (ex) => ex.id === exercise.id || ex.exerciseId === exercise.id
    );

    if (isAlreadySelected) {
      setSelectedExercises((prev) =>
        prev.filter((ex) => ex.id !== exercise.id && ex.exerciseId !== exercise.id)
      );
    } else {
      setSelectedExercises((prev) => [
        ...prev,
        {
          ...exercise,
          exerciseId: exercise.id,
          sets: exercise.sets_default || 3,
          reps: exercise.reps_default || 10,
          holdSeconds: exercise.hold_seconds || 0,
          frequencyPerDay: exercise.frequency_per_day || 1,
          frequencyPerWeek: exercise.frequency_per_week || 7,
        },
      ]);
    }
  };

  // Save prescription
  const handleSavePrescription = async (prescriptionData) => {
    try {
      setSaving(true);
      setError(null);

      const response = await exercisesApi.createPrescription({
        patientId,
        ...prescriptionData,
        deliveryMethod: 'portal',
      });

      setSuccess(language === 'no' ? 'Øvelsesprogram lagret!' : 'Exercise program saved!');
      setTimeout(() => setSuccess(null), 3000);

      // Refresh prescriptions list
      if (patientId) {
        const prescriptionsRes = await exercisesApi.getPatientPrescriptions(patientId);
        setPrescriptions(prescriptionsRes.data || []);
      }

      // Reset selection
      setSelectedExercises([]);
      setActiveTab('prescriptions');

      return response.data;
    } catch (err) {
      console.error('Save failed:', err);
      setError(language === 'no' ? 'Kunne ikke lagre øvelsesprogram' : 'Failed to save program');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Send email
  const handleSendEmail = async (prescriptionId) => {
    try {
      setSending(true);
      setError(null);
      await exercisesApi.sendEmail(prescriptionId);
      setSuccess(language === 'no' ? 'E-post sendt!' : 'Email sent!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Send email failed:', err);
      setError(language === 'no' ? 'Kunne ikke sende e-post' : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  // Send SMS
  const handleSendSMS = async (prescriptionId) => {
    try {
      setSending(true);
      setError(null);
      await exercisesApi.sendSMS(prescriptionId);
      setSuccess(language === 'no' ? 'SMS sendt!' : 'SMS sent!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Send SMS failed:', err);
      setError(language === 'no' ? 'Kunne ikke sende SMS' : 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = async (prescriptionId) => {
    try {
      setSending(true);
      const blob = await exercisesApi.generatePDF(prescriptionId);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ovelsesprogram_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess(language === 'no' ? 'PDF lastet ned!' : 'PDF downloaded!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError(language === 'no' ? 'Kunne ikke generere PDF' : 'Failed to generate PDF');
    } finally {
      setSending(false);
    }
  };

  // Seed default exercises
  const handleSeedExercises = async () => {
    try {
      setLoading(true);
      await exercisesApi.seedDefaultExercises();
      setSuccess(language === 'no' ? 'Standard øvelser lagt til!' : 'Default exercises added!');
      setTimeout(() => setSuccess(null), 3000);
      await loadData();
    } catch (err) {
      console.error('Seed failed:', err);
      setError(language === 'no' ? 'Kunne ikke legge til øvelser' : 'Failed to add exercises');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) {
      return '-';
    }
    return new Date(dateStr).toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    const labels = {
      no: { active: 'Aktiv', completed: 'Fullført', paused: 'Pauset', cancelled: 'Avbrutt' },
      en: { active: 'Active', completed: 'Completed', paused: 'Paused', cancelled: 'Cancelled' },
    };
    return labels[language][status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {patientId && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Dumbbell className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {language === 'no' ? 'Øvelsesbibliotek' : 'Exercise Library'}
                </h1>
                {patient && (
                  <p className="text-sm text-gray-500">
                    {patient.first_name} {patient.last_name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setLanguage('no')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  language === 'no' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Norsk
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  language === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                English
              </button>
            </div>

            {/* Seed exercises button (for empty library) */}
            {exercises.length === 0 && !loading && (
              <button
                onClick={handleSeedExercises}
                className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                {language === 'no' ? 'Last inn standardøvelser' : 'Load default exercises'}
              </button>
            )}

            {/* Create prescription button */}
            {patientId && selectedExercises.length > 0 && (
              <button
                onClick={() => setActiveTab('create')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                {language === 'no' ? 'Lag program' : 'Create Program'}
                <span className="px-1.5 py-0.5 bg-blue-500 rounded text-xs">
                  {selectedExercises.length}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        {patientId && (
          <div className="flex gap-1 mt-4 border-b border-gray-200 -mb-4">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'library'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                {language === 'no' ? 'Bibliotek' : 'Library'}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'prescriptions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" />
                {language === 'no' ? 'Programmer' : 'Programs'}
                {prescriptions.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-gray-200 rounded-full text-xs">
                    {prescriptions.length}
                  </span>
                )}
              </div>
            </button>
            {selectedExercises.length > 0 && (
              <button
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'create'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {language === 'no' ? 'Nytt program' : 'New Program'}
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {selectedExercises.length}
                  </span>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-500">
              {language === 'no' ? 'Laster øvelser...' : 'Loading exercises...'}
            </span>
          </div>
        ) : activeTab === 'library' ? (
          /* Exercise Library Tab */
          <div className="bg-white rounded-lg shadow-sm">
            <ExerciseLibrary
              exercises={exercises}
              categories={categories}
              selectedExercises={selectedExercises}
              onSelectExercise={patientId ? handleSelectExercise : undefined}
              selectionMode={!!patientId}
              loading={loading}
            />
          </div>
        ) : activeTab === 'prescriptions' ? (
          /* Prescriptions Tab */
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {language === 'no' ? 'Øvelsesprogrammer' : 'Exercise Programs'}
                </h2>
              </div>
            </div>

            {prescriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <FileText className="w-12 h-12 text-gray-300 mb-3" />
                <p>{language === 'no' ? 'Ingen programmer opprettet' : 'No programs created'}</p>
                <p className="text-sm text-gray-400">
                  {language === 'no'
                    ? 'Velg øvelser fra biblioteket for å opprette et program'
                    : 'Select exercises from the library to create a program'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {prescriptions.map((prescription) => (
                  <div key={prescription.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {prescription.exercises?.length || 0}{' '}
                            {language === 'no' ? 'øvelser' : 'exercises'}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}
                          >
                            {getStatusLabel(prescription.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {language === 'no' ? 'Opprettet' : 'Created'}:{' '}
                          {formatDate(prescription.created_at)}
                        </p>
                        {prescription.patient_instructions && (
                          <p className="text-sm text-gray-600 mt-2 italic">
                            "{prescription.patient_instructions}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownloadPDF(prescription.id)}
                          disabled={sending}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                          title={language === 'no' ? 'Last ned PDF' : 'Download PDF'}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSendEmail(prescription.id)}
                          disabled={sending}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                          title={language === 'no' ? 'Send e-post' : 'Send email'}
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSendSMS(prescription.id)}
                          disabled={sending}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                          title={language === 'no' ? 'Send SMS' : 'Send SMS'}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedPrescription(prescription)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title={language === 'no' ? 'Vis detaljer' : 'View details'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Exercise list preview */}
                    {prescription.exercises && prescription.exercises.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {prescription.exercises.slice(0, 5).map((ex, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                          >
                            {ex.name_norwegian || ex.name}
                          </span>
                        ))}
                        {prescription.exercises.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
                            +{prescription.exercises.length - 5}{' '}
                            {language === 'no' ? 'til' : 'more'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'create' ? (
          /* Create Prescription Tab */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Selected exercises */}
            <div className="bg-white rounded-lg shadow-sm">
              <ExercisePrescription
                patient={patient}
                selectedExercises={selectedExercises}
                onExercisesChange={setSelectedExercises}
                onSave={handleSavePrescription}
                onSendEmail={() => {}}
                onSendSMS={() => {}}
                onGeneratePDF={() => {}}
                saving={saving}
                sending={sending}
              />
            </div>

            {/* Exercise library for adding more */}
            <div className="bg-white rounded-lg shadow-sm">
              <ExerciseLibrary
                exercises={exercises}
                categories={categories}
                selectedExercises={selectedExercises}
                onSelectExercise={handleSelectExercise}
                selectionMode={true}
                loading={loading}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Prescription Detail Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedPrescription(null)}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {language === 'no' ? 'Programdetaljer' : 'Program Details'}
                </h3>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPrescription.status)}`}
                  >
                    {getStatusLabel(selectedPrescription.status)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(selectedPrescription.created_at)}
                  </span>
                </div>

                {selectedPrescription.patient_instructions && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      {language === 'no' ? 'Instruksjoner' : 'Instructions'}
                    </h4>
                    <p className="text-gray-600">{selectedPrescription.patient_instructions}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {language === 'no' ? 'Øvelser' : 'Exercises'}
                  </h4>
                  <div className="space-y-2">
                    {selectedPrescription.exercises?.map((ex, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{ex.name_norwegian || ex.name}</span>
                          <span className="text-sm text-gray-500">
                            {ex.sets} sett × {ex.reps} rep
                          </span>
                        </div>
                        {ex.custom_instructions && (
                          <p className="text-sm text-gray-600 mt-1">{ex.custom_instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => handleDownloadPDF(selectedPrescription.id)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
                <button
                  onClick={() => handleSendEmail(selectedPrescription.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Mail className="w-4 h-4" />
                  {language === 'no' ? 'Send e-post' : 'Send Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
