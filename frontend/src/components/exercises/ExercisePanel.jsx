/**
 * Exercise Panel Component
 * Combined panel for exercise prescription within clinical encounters
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
  Download,
  Loader2,
} from 'lucide-react';
import ExerciseLibrary from './ExerciseLibrary';
import ExercisePrescription from './ExercisePrescription';
import api from '../../services/api';

const ExercisePanel = ({ patient, encounterId, isOpen, onClose, onPrescriptionSaved }) => {
  // State
  const [exercises, setExercises] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [panelWidth, setPanelWidth] = useState(50); // percentage
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Load exercises and categories
  useEffect(() => {
    if (isOpen) {
      loadExercises();
      loadCategories();
    }
  }, [isOpen]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const response = await api.get('/exercises', {
        params: { limit: 500 },
      });
      setExercises(response.data.data || []);
    } catch (err) {
      setError('Kunne ikke laste øvelser');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/exercises/categories');
      setCategories(response.data.data || []);
    } catch {
      // Categories are non-critical, silently fail
    }
  };

  // Handle exercise selection
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
          sets: exercise.sets_default,
          reps: exercise.reps_default,
          holdSeconds: exercise.hold_seconds,
          frequencyPerDay: exercise.frequency_per_day,
          frequencyPerWeek: exercise.frequency_per_week,
        },
      ]);
    }
  };

  // Save prescription
  const handleSave = async (prescriptionData) => {
    try {
      setSaving(true);
      setError(null);

      const response = await api.post('/exercises/prescriptions', {
        ...prescriptionData,
        deliveryMethod: 'portal',
      });

      setSuccess('Øvelsesprogram lagret!');
      setTimeout(() => setSuccess(null), 3000);

      if (onPrescriptionSaved) {
        onPrescriptionSaved(response.data.data);
      }

      return response.data.data;
    } catch (err) {
      setError('Kunne ikke lagre øvelsesprogram');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Send email
  const handleSendEmail = async () => {
    try {
      setSending(true);
      setError(null);

      // First save the prescription
      const prescription = await handleSave({
        patientId: patient?.id,
        encounterId,
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
      });

      // Then send email
      await api.post(`/exercises/prescriptions/${prescription.id}/send-email`);

      setSuccess('E-post sendt til pasienten!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Kunne ikke sende e-post');
    } finally {
      setSending(false);
    }
  };

  // Send SMS
  const handleSendSMS = async () => {
    try {
      setSending(true);
      setError(null);

      // First save the prescription
      const prescription = await handleSave({
        patientId: patient?.id,
        encounterId,
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
      });

      // Then send SMS
      await api.post(`/exercises/prescriptions/${prescription.id}/send-sms`);

      setSuccess('SMS sendt til pasienten!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Kunne ikke sende SMS');
    } finally {
      setSending(false);
    }
  };

  // Generate PDF
  const handleGeneratePDF = async () => {
    try {
      setSending(true);
      setError(null);

      // First save the prescription
      const prescription = await handleSave({
        patientId: patient?.id,
        encounterId,
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
      });

      // Then download PDF
      const response = await api.get(`/exercises/prescriptions/${prescription.id}/pdf`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `ovelsesprogram_${patient?.first_name || 'pasient'}_${new Date().toISOString().split('T')[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('PDF lastet ned!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Kunne ikke generere PDF');
    } finally {
      setSending(false);
    }
  };

  // Download PDF handout for the patient's current exercises
  const handleDownloadPDFHandout = async () => {
    if (!patient?.id) return;
    try {
      setDownloadingPDF(true);
      setError(null);
      const response = await api.get(`/patients/${patient.id}/exercises/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `ovelsesprogram_${patient.first_name || 'pasient'}_${new Date().toISOString().split('T')[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccess('PDF-handout lastet ned!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Kunne ikke laste ned PDF-handout');
    } finally {
      setDownloadingPDF(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-6xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Øvelsesprogram</h2>
              {patient && (
                <p className="text-sm text-gray-500">
                  {patient.first_name} {patient.last_name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDFHandout}
              disabled={downloadingPDF || !patient?.id}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Last ned PDF-handout"
            >
              {downloadingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {downloadingPDF ? 'Laster...' : 'PDF-handout'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <Check className="w-4 h-4" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Exercise Library */}
          <div
            className="border-r border-gray-200 overflow-hidden"
            style={{ width: `${panelWidth}%` }}
          >
            <ExerciseLibrary
              exercises={exercises}
              categories={categories}
              selectedExercises={selectedExercises}
              onSelectExercise={handleSelectExercise}
              selectionMode={true}
              loading={loading}
            />
          </div>

          {/* Resizer */}
          <div
            className="w-2 bg-gray-100 hover:bg-blue-200 cursor-col-resize flex items-center justify-center"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = panelWidth;

              const handleMouseMove = (e) => {
                const delta = ((e.clientX - startX) / window.innerWidth) * 100;
                const newWidth = Math.min(Math.max(startWidth + delta, 30), 70);
                setPanelWidth(newWidth);
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            <div className="flex flex-col gap-1">
              <div className="w-1 h-6 bg-gray-300 rounded"></div>
            </div>
          </div>

          {/* Right Panel - Prescription */}
          <div className="overflow-hidden" style={{ width: `${100 - panelWidth}%` }}>
            <ExercisePrescription
              patient={patient}
              encounterId={encounterId}
              selectedExercises={selectedExercises}
              onExercisesChange={setSelectedExercises}
              onSave={handleSave}
              onSendEmail={handleSendEmail}
              onSendSMS={handleSendSMS}
              onGeneratePDF={handleGeneratePDF}
              saving={saving}
              sending={sending}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExercisePanel;
