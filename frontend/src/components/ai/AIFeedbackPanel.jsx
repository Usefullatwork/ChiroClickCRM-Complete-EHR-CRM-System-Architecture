/**
 * AIFeedbackPanel Component
 *
 * Main feedback component for AI suggestions with:
 * - Display AI suggestion with confidence score badge
 * - Quick action buttons: Accept, Edit & Accept, Reject
 * - Star rating (1-5)
 * - Optional correction textarea
 * - Time tracking (how long user takes to decide)
 * - Animated feedback submission
 * - Norwegian and English text support
 */

import _React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, X, Edit3, Star, Clock, Loader2, CheckCircle2, Send } from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { _Badge } from '../ui/Badge';
import { Textarea } from '../ui/Textarea';
import { AISuggestionCard } from './AISuggestionCard';

// Bilingual text support
const TEXTS = {
  NO: {
    title: 'AI-forslag',
    accept: 'Godkjenn',
    editAccept: 'Rediger og godkjenn',
    reject: 'Avvis',
    rating: 'Hvor nyttig var forslaget?',
    ratingLabels: ['Ikke nyttig', 'Lite nyttig', 'Ok', 'Nyttig', 'Veldig nyttig'],
    correction: 'Din korreksjon (valgfritt)',
    correctionPlaceholder: 'Skriv din korrigerte versjon her...',
    submit: 'Send tilbakemelding',
    submitting: 'Sender...',
    submitted: 'Takk for tilbakemeldingen!',
    timeSpent: 'Tid brukt',
    feedback: 'Tilbakemelding',
    additionalNotes: 'Ytterligere kommentarer',
    notesPlaceholder: 'Legg til kommentarer for fremtidig forbedring...',
  },
  EN: {
    title: 'AI Suggestion',
    accept: 'Accept',
    editAccept: 'Edit & Accept',
    reject: 'Reject',
    rating: 'How helpful was this suggestion?',
    ratingLabels: ['Not helpful', 'Slightly helpful', 'OK', 'Helpful', 'Very helpful'],
    correction: 'Your correction (optional)',
    correctionPlaceholder: 'Write your corrected version here...',
    submit: 'Submit Feedback',
    submitting: 'Submitting...',
    submitted: 'Thank you for your feedback!',
    timeSpent: 'Time spent',
    feedback: 'Feedback',
    additionalNotes: 'Additional notes',
    notesPlaceholder: 'Add comments for future improvement...',
  },
};

/**
 * Star Rating Component
 */
const StarRating = ({ value, onChange, labels, disabled = false }) => {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            className={`p-1 transition-all duration-150 ${
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'
            }`}
          >
            <Star
              size={28}
              className={`transition-colors duration-150 ${
                star <= (hoverValue || value)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-transparent text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
      {(hoverValue || value) > 0 && labels && (
        <span className="text-sm text-slate-600 animate-fade-in">
          {labels[(hoverValue || value) - 1]}
        </span>
      )}
    </div>
  );
};

/**
 * Time Tracker Display
 */
const TimeTracker = ({ startTime, text }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <Clock size={14} />
      <span>
        {text}: {formatTime(elapsed)}
      </span>
    </div>
  );
};

/**
 * Main AIFeedbackPanel Component
 */
export const AIFeedbackPanel = ({
  suggestion,
  onSubmitFeedback,
  language = 'NO',
  className = '',
  showTimeTracker = true,
  autoFocusCorrection = false,
}) => {
  const t = TEXTS[language] || TEXTS.NO;

  // State
  const [action, setAction] = useState(null); // 'accept' | 'edit' | 'reject'
  const [rating, setRating] = useState(0);
  const [correction, setCorrection] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showCorrectionField, setShowCorrectionField] = useState(false);

  // Refs
  const startTimeRef = useRef(Date.now());
  const correctionRef = useRef(null);

  // Reset start time when suggestion changes
  useEffect(() => {
    startTimeRef.current = Date.now();
    setAction(null);
    setRating(0);
    setCorrection('');
    setNotes('');
    setIsSubmitted(false);
    setShowCorrectionField(false);
  }, [suggestion?.id]);

  // Auto-focus correction field when editing
  useEffect(() => {
    if (showCorrectionField && autoFocusCorrection && correctionRef.current) {
      correctionRef.current.focus();
    }
  }, [showCorrectionField, autoFocusCorrection]);

  // Handle action selection
  const handleAction = useCallback(
    (selectedAction) => {
      setAction(selectedAction);

      if (selectedAction === 'edit') {
        setShowCorrectionField(true);
        setCorrection(suggestion?.suggestionText || '');
      } else {
        setShowCorrectionField(false);
        setCorrection('');
      }
    },
    [suggestion?.suggestionText]
  );

  // Calculate time to decision
  const getTimeToDecision = useCallback(() => {
    return Date.now() - startTimeRef.current;
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!action || rating === 0) {
      return;
    }

    setIsSubmitting(true);

    const feedbackData = {
      suggestionId: suggestion?.id,
      encounterId: suggestion?.encounterId,
      suggestionType: suggestion?.type,
      originalSuggestion: suggestion?.suggestionText,
      userCorrection: action === 'edit' ? correction : null,
      accepted: action !== 'reject',
      correctionType:
        action === 'accept' ? 'accepted_as_is' : action === 'edit' ? 'modified' : 'rejected',
      confidenceScore: suggestion?.confidenceScore,
      feedbackNotes: notes || null,
      userRating: rating,
      timeToDecision: getTimeToDecision(),
      contextData: suggestion?.contextData || null,
    };

    try {
      await onSubmitFeedback(feedbackData);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [action, rating, correction, notes, suggestion, onSubmitFeedback, getTimeToDecision]);

  // Submitted state
  if (isSubmitted) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <CardBody>
          <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-bounce-in">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <p className="text-lg font-medium text-slate-900">{t.submitted}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardBody className="space-y-6">
        {/* Header with time tracker */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{t.title}</h3>
          {showTimeTracker && <TimeTracker startTime={startTimeRef.current} text={t.timeSpent} />}
        </div>

        {/* AI Suggestion Display */}
        {suggestion && <AISuggestionCard suggestion={suggestion} language={language} expanded />}

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant={action === 'accept' ? 'primary' : 'secondary'}
            size="md"
            onClick={() => handleAction('accept')}
            icon={Check}
            className={`transition-all duration-200 ${
              action === 'accept' ? 'ring-2 ring-teal-500 ring-offset-2' : ''
            }`}
          >
            {t.accept}
          </Button>

          <Button
            variant={action === 'edit' ? 'primary' : 'secondary'}
            size="md"
            onClick={() => handleAction('edit')}
            icon={Edit3}
            className={`transition-all duration-200 ${
              action === 'edit' ? 'ring-2 ring-teal-500 ring-offset-2' : ''
            }`}
          >
            {t.editAccept}
          </Button>

          <Button
            variant={action === 'reject' ? 'danger' : 'secondary'}
            size="md"
            onClick={() => handleAction('reject')}
            icon={X}
            className={`transition-all duration-200 ${
              action === 'reject' ? 'ring-2 ring-red-500 ring-offset-2' : ''
            }`}
          >
            {t.reject}
          </Button>
        </div>

        {/* Correction Field (shown when editing) */}
        {showCorrectionField && (
          <div className="space-y-2 animate-slide-down">
            <label className="block text-sm font-medium text-slate-700">{t.correction}</label>
            <Textarea
              ref={correctionRef}
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
              placeholder={t.correctionPlaceholder}
              rows={4}
              className="transition-all duration-200 focus:ring-2 focus:ring-teal-500"
            />
          </div>
        )}

        {/* Star Rating */}
        {action && (
          <div className="space-y-2 animate-fade-in">
            <label className="block text-sm font-medium text-slate-700">{t.rating}</label>
            <StarRating
              value={rating}
              onChange={setRating}
              labels={t.ratingLabels}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Additional Notes */}
        {action && rating > 0 && (
          <div className="space-y-2 animate-fade-in">
            <label className="block text-sm font-medium text-slate-700">{t.additionalNotes}</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              rows={2}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Submit Button */}
        {action && rating > 0 && (
          <div className="flex justify-end animate-fade-in">
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
              icon={isSubmitting ? Loader2 : Send}
              className="min-w-[180px]"
            >
              {isSubmitting ? t.submitting : t.submit}
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default AIFeedbackPanel;
