/**
 * Exercise Prescription Builder Page
 * Komplett grensesnitt for terapeuter til a opprette treningsprogrammer
 *
 * Complete interface for therapists to create exercise programs for patients
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Dumbbell,
  Save,
  Send,
  ArrowLeft,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Mail,
  MessageSquare,
  FileText,
  ChevronDown,
  X,
  User,
  Loader2,
  Download,
} from 'lucide-react';
import { exercisesApi } from '../api/exercises';
import PrescriptionBuilder from '../components/exercises/PrescriptionBuilder';
import ExerciseSelector from '../components/exercises/ExerciseSelector';
import PrescriptionPreview from '../components/exercises/PrescriptionPreview';
import TemplateSelector from '../components/exercises/TemplateSelector';
import WeeklyScheduleView from '../components/exercises/WeeklyScheduleView';

import logger from '../utils/logger';
/**
 * ExercisePrescription Component
 * Hovedkomponent for treningsforskrivningsbygger
 *
 * @returns {JSX.Element} Exercise prescription builder page
 */
export default function ExercisePrescription() {
  const { patientId, prescriptionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get patient info from search params if available
  const patientName = searchParams.get('patientName') || 'Pasient';
  const _patientEmail = searchParams.get('email') || '';

  // State for prescription data
  const [prescription, setPrescription] = useState({
    name: '',
    patientInstructions: '',
    clinicalNotes: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    deliveryMethod: 'email',
  });

  const [selectedExercises, setSelectedExercises] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [_showExerciseSelector, setShowExerciseSelector] = useState(true);
  const [rightPanelView, setRightPanelView] = useState('selector'); // 'selector', 'templates', 'schedule'
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [savedPrescriptionId, setSavedPrescriptionId] = useState(null);

  const isEditing = !!prescriptionId;

  // Fetch exercises from API
  const { data: exercisesData, isLoading: loadingExercises } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => exercisesApi.getExercises({ limit: 500 }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['exerciseCategories'],
    queryFn: () => exercisesApi.getCategories(),
    staleTime: 10 * 60 * 1000,
  });

  // Fetch templates
  const {
    data: templatesData,
    isLoading: loadingTemplates,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: ['exerciseTemplates'],
    queryFn: () => exercisesApi.getTemplates(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch existing prescription if editing
  const { data: existingPrescription, isLoading: loadingPrescription } = useQuery({
    queryKey: ['prescription', prescriptionId],
    queryFn: () => exercisesApi.getPrescriptionById(prescriptionId),
    enabled: !!prescriptionId,
  });

  // Load existing prescription data when editing
  useEffect(() => {
    if (existingPrescription?.data) {
      const p = existingPrescription.data;
      setPrescription({
        name: p.name || '',
        patientInstructions: p.patient_instructions || '',
        clinicalNotes: p.clinical_notes || '',
        startDate: p.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        endDate: p.end_date?.split('T')[0] || '',
        deliveryMethod: p.delivery_method || 'email',
      });
      if (p.exercises) {
        setSelectedExercises(
          p.exercises.map((ex) => ({
            ...ex.exercise,
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            holdSeconds: ex.holdSeconds,
            frequencyPerDay: ex.frequencyPerDay,
            frequencyPerWeek: ex.frequencyPerWeek,
            customInstructions: ex.customInstructions,
          }))
        );
      }
    }
  }, [existingPrescription]);

  const exercises = exercisesData?.data || [];
  const categories = categoriesData?.data || [];
  const templates = templatesData?.data || [];

  /**
   * Handle adding exercise to prescription
   */
  const handleAddExercise = useCallback(
    (exercise) => {
      const isAlreadySelected = selectedExercises.some(
        (ex) => ex.id === exercise.id || ex.exerciseId === exercise.id
      );

      if (isAlreadySelected) {
        // Remove if already selected
        setSelectedExercises((prev) =>
          prev.filter((ex) => ex.id !== exercise.id && ex.exerciseId !== exercise.id)
        );
      } else {
        // Add with default parameters
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
            customInstructions: '',
          },
        ]);
      }
    },
    [selectedExercises]
  );

  /**
   * Handle removing exercise from prescription
   */
  const handleRemoveExercise = useCallback((index) => {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Handle updating exercise parameters
   */
  const handleUpdateExercise = useCallback((index, field, value) => {
    setSelectedExercises((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  /**
   * Handle reordering exercises
   */
  const handleReorderExercises = useCallback((fromIndex, toIndex) => {
    setSelectedExercises((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  /**
   * Handle selecting a template
   * Handterer valg av mal
   */
  const handleSelectTemplate = useCallback(
    (template) => {
      if (!template.exercises || template.exercises.length === 0) {
        setError('Malen inneholder ingen ovelser');
        return;
      }

      // Find full exercise data for each template exercise
      const templateExercises = template.exercises
        .map((templateEx) => {
          const fullExercise = exercises.find((e) => e.id === templateEx.exerciseId);
          if (fullExercise) {
            return {
              ...fullExercise,
              exerciseId: fullExercise.id,
              sets: templateEx.sets || fullExercise.sets_default || 3,
              reps: templateEx.reps || fullExercise.reps_default || 10,
              holdSeconds: templateEx.holdSeconds || fullExercise.hold_seconds || 0,
              frequencyPerDay: templateEx.frequencyPerDay || fullExercise.frequency_per_day || 1,
              frequencyPerWeek: templateEx.frequencyPerWeek || fullExercise.frequency_per_week || 7,
              customInstructions: templateEx.customInstructions || '',
            };
          }
          return null;
        })
        .filter(Boolean);

      if (templateExercises.length > 0) {
        setSelectedExercises(templateExercises);
        setSuccess(`Mal "${template.name}" lastet med ${templateExercises.length} ovelser`);
        setRightPanelView('selector');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Kunne ikke finne ovelser fra malen');
      }
    },
    [exercises]
  );

  /**
   * Handle saving current program as template
   * Handterer lagring av gjeldende program som mal
   */
  const handleSaveAsTemplate = useCallback(
    async (templateData) => {
      try {
        await exercisesApi.createTemplate(templateData);
        setSuccess('Mal opprettet!');
        refetchTemplates();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        logger.error('Error saving template:', err);
        setError('Kunne ikke opprette mal');
        throw err;
      }
    },
    [refetchTemplates]
  );

  /**
   * Handle saving prescription
   */
  const handleSave = async () => {
    if (selectedExercises.length === 0) {
      setError('Velg minst en ovelse');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const prescriptionData = {
        patientId,
        patientInstructions: prescription.patientInstructions,
        clinicalNotes: prescription.clinicalNotes,
        startDate: prescription.startDate,
        endDate: prescription.endDate || null,
        deliveryMethod: prescription.deliveryMethod,
        exercises: selectedExercises.map((ex, index) => ({
          exerciseId: ex.exerciseId || ex.id,
          sets: ex.sets,
          reps: ex.reps,
          holdSeconds: ex.holdSeconds,
          frequencyPerDay: ex.frequencyPerDay,
          frequencyPerWeek: ex.frequencyPerWeek,
          customInstructions: ex.customInstructions,
          displayOrder: index,
        })),
      };

      const response = await exercisesApi.createPrescription(prescriptionData);

      setSuccess('Treningsprogram lagret!');
      setSavedPrescriptionId(response.data?.id);

      // Invalidate queries
      queryClient.invalidateQueries(['patientPrescriptions', patientId]);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      logger.error('Save failed:', err);
      setError(err.message || 'Kunne ikke lagre treningsprogram');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle sending prescription to patient via email
   */
  const handleSendEmail = async () => {
    const idToSend = savedPrescriptionId || prescriptionId;
    if (!idToSend) {
      setError('Lagre programmet forst');
      return;
    }

    try {
      setSending(true);
      setError(null);
      await exercisesApi.sendEmail(idToSend);
      setSuccess('E-post sendt til pasient!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      logger.error('Send email failed:', err);
      setError('Kunne ikke sende e-post');
    } finally {
      setSending(false);
    }
  };

  /**
   * Handle sending SMS link to patient
   */
  const handleSendSMS = async () => {
    const idToSend = savedPrescriptionId || prescriptionId;
    if (!idToSend) {
      setError('Lagre programmet forst');
      return;
    }

    try {
      setSending(true);
      setError(null);
      await exercisesApi.sendSMS(idToSend);
      setSuccess('SMS sendt til pasient!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      logger.error('Send SMS failed:', err);
      setError('Kunne ikke sende SMS');
    } finally {
      setSending(false);
    }
  };

  /**
   * Handle downloading PDF
   */
  const handleDownloadPDF = async () => {
    const idToDownload = savedPrescriptionId || prescriptionId;
    if (!idToDownload) {
      setError('Lagre programmet forst');
      return;
    }

    try {
      setSending(true);
      const blob = await exercisesApi.generatePDF(idToDownload);

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `treningsprogram_${new Date().toISOString().split('T')[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('PDF lastet ned!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      logger.error('PDF download failed:', err);
      setError('Kunne ikke generere PDF');
    } finally {
      setSending(false);
    }
  };

  // Calculate estimated time
  const estimatedTime = selectedExercises.reduce((total, ex) => {
    const setsTime = (ex.sets || 3) * (ex.reps || 10) * 3; // ~3 sec per rep
    const holdTime = (ex.holdSeconds || 0) * (ex.sets || 3);
    return total + setsTime + holdTime + 30; // +30 sec rest between exercises
  }, 0);

  const isLoading = loadingExercises || loadingPrescription;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Rediger treningsprogram' : 'Nytt treningsprogram'}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                {patientId && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {patientName}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Dumbbell className="w-3.5 h-3.5" />
                  {selectedExercises.length} ovelser
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />~{Math.ceil(estimatedTime / 60)} min
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(true)}
              disabled={selectedExercises.length === 0}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Eye className="w-4 h-4" />
              Forhandsvis
            </button>

            <button
              onClick={handleSave}
              disabled={saving || selectedExercises.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Lagrer...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Lagre
                </>
              )}
            </button>

            {/* Send dropdown */}
            <div className="relative group">
              <button
                disabled={sending || (!savedPrescriptionId && !prescriptionId)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sender...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send til pasient
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 hidden group-hover:block z-30">
                <button
                  onClick={handleSendEmail}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Mail className="w-4 h-4" />
                  Send pa e-post
                </button>
                <button
                  onClick={handleSendSMS}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send SMS-lenke
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Last ned PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4 text-red-500 hover:text-red-700" />
          </button>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-500">Laster...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Prescription Builder */}
            <div className="space-y-6">
              {/* Program Details */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Programdetaljer
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instruksjoner til pasient
                    </label>
                    <textarea
                      value={prescription.patientInstructions}
                      onChange={(e) =>
                        setPrescription((p) => ({ ...p, patientInstructions: e.target.value }))
                      }
                      placeholder="F.eks. 'Gjor ovelsene morgen og kveld. Stopp hvis du opplever okt smerte.'"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Startdato
                      </label>
                      <input
                        type="date"
                        value={prescription.startDate}
                        onChange={(e) =>
                          setPrescription((p) => ({ ...p, startDate: e.target.value }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sluttdato (valgfritt)
                      </label>
                      <input
                        type="date"
                        value={prescription.endDate}
                        onChange={(e) =>
                          setPrescription((p) => ({ ...p, endDate: e.target.value }))
                        }
                        min={prescription.startDate}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kliniske notater (kun for journal)
                    </label>
                    <textarea
                      value={prescription.clinicalNotes}
                      onChange={(e) =>
                        setPrescription((p) => ({ ...p, clinicalNotes: e.target.value }))
                      }
                      placeholder="Interne notater som ikke sendes til pasient..."
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Prescription Builder */}
              <PrescriptionBuilder
                exercises={selectedExercises}
                onRemove={handleRemoveExercise}
                onUpdate={handleUpdateExercise}
                onReorder={handleReorderExercises}
                onAddClick={() => setShowExerciseSelector(true)}
              />

              {/* Summary */}
              {selectedExercises.length > 0 && (
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <h3 className="font-medium text-blue-900 mb-3">Programoversikt</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600">Antall ovelser</span>
                      <p className="font-semibold text-blue-900">{selectedExercises.length}</p>
                    </div>
                    <div>
                      <span className="text-blue-600">Estimert tid</span>
                      <p className="font-semibold text-blue-900">
                        ~{Math.ceil(estimatedTime / 60)} min
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-600">Varighet</span>
                      <p className="font-semibold text-blue-900">
                        {prescription.endDate
                          ? `${Math.ceil((new Date(prescription.endDate) - new Date(prescription.startDate)) / (1000 * 60 * 60 * 24))} dager`
                          : 'Lopende'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Exercise Selector / Templates / Schedule */}
            <div className="lg:sticky lg:top-24 lg:self-start space-y-4">
              {/* View Tabs */}
              <div className="bg-white rounded-lg border border-gray-200 p-1 flex">
                <button
                  onClick={() => setRightPanelView('selector')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    rightPanelView === 'selector'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Ovelsebibliotek
                </button>
                <button
                  onClick={() => setRightPanelView('templates')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    rightPanelView === 'templates'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Maler
                </button>
                <button
                  onClick={() => setRightPanelView('schedule')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    rightPanelView === 'schedule'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Ukeoversikt
                </button>
              </div>

              {/* Panel Content */}
              {rightPanelView === 'selector' && (
                <ExerciseSelector
                  exercises={exercises}
                  categories={categories}
                  selectedExercises={selectedExercises}
                  onSelectExercise={handleAddExercise}
                  loading={loadingExercises}
                />
              )}

              {rightPanelView === 'templates' && (
                <TemplateSelector
                  templates={templates}
                  onSelectTemplate={handleSelectTemplate}
                  onSaveAsTemplate={handleSaveAsTemplate}
                  currentExercises={selectedExercises}
                  loading={loadingTemplates}
                />
              )}

              {rightPanelView === 'schedule' && (
                <WeeklyScheduleView
                  exercises={selectedExercises}
                  startDate={prescription.startDate ? new Date(prescription.startDate) : new Date()}
                  onExerciseClick={(_exercise) => {
                    // Exercise clicked - could expand details or scroll to it
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PrescriptionPreview
          prescription={{
            ...prescription,
            exercises: selectedExercises,
          }}
          patientName={patientName}
          onClose={() => setShowPreview(false)}
          onSendEmail={handleSendEmail}
          onDownloadPDF={handleDownloadPDF}
        />
      )}
    </div>
  );
}
