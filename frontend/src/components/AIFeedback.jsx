/**
 * AI Feedback Component
 * Allows providers to give feedback on AI-generated suggestions
 */

import { useState, useCallback } from 'react';

// Feedback categories (should match database seed)
const FEEDBACK_CATEGORIES = {
  positive: [
    { id: 'accurate', label: 'Nøyaktig', icon: '✓' },
    { id: 'time_saving', label: 'Tidsbesparende', icon: '⏱' },
    { id: 'comprehensive', label: 'Omfattende', icon: '📋' },
    { id: 'well_written', label: 'God formulering', icon: '✍' },
  ],
  negative: [
    { id: 'inaccurate', label: 'Unøyaktig', icon: '✗' },
    { id: 'irrelevant', label: 'Irrelevant', icon: '❌' },
    { id: 'too_verbose', label: 'For omfattende', icon: '📝' },
    { id: 'missing_info', label: 'Manglet informasjon', icon: '❓' },
    { id: 'missed_red_flag', label: 'Manglet rødt flagg', icon: '🚨' },
  ],
  neutral: [
    { id: 'partially_helpful', label: 'Delvis nyttig', icon: '◐' },
    { id: 'needs_customization', label: 'Trenger tilpasning', icon: '⚙' },
  ],
};

/**
 * Quick feedback buttons (thumbs up/down)
 */
export const QuickFeedback = ({ suggestionId, onFeedback }) => {
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleFeedback = useCallback(
    async (isHelpful) => {
      setFeedback(isHelpful);
      setSubmitted(true);

      try {
        await onFeedback(suggestionId, { wasHelpful: isHelpful });
      } catch (error) {
        console.error('Failed to submit feedback:', error);
        setSubmitted(false);
      }
    },
    [suggestionId, onFeedback]
  );

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Takk for tilbakemelding!</span>
        {feedback ? (
          <span className="text-green-600">👍</span>
        ) : (
          <span className="text-red-600">👎</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Var dette nyttig?</span>
      <button
        onClick={() => handleFeedback(true)}
        className="p-1.5 rounded hover:bg-green-100 transition-colors"
        title="Ja, nyttig"
      >
        👍
      </button>
      <button
        onClick={() => handleFeedback(false)}
        className="p-1.5 rounded hover:bg-red-100 transition-colors"
        title="Nei, ikke nyttig"
      >
        👎
      </button>
    </div>
  );
};

/**
 * Detailed feedback form
 */
export const DetailedFeedback = ({ suggestionId, suggestionText, onSubmit, onCancel }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [modifiedText, setModifiedText] = useState(suggestionText);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleCategory = useCallback((categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        suggestionId,
        categories: selectedCategories,
        rating,
        comment,
        modifiedText: showTextEditor ? modifiedText : null,
        decision: modifiedText !== suggestionText ? 'MODIFIED' : 'APPROVED',
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">Gi tilbakemelding på AI-forslag</h3>

      <form onSubmit={handleSubmit}>
        {/* Original suggestion */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">AI-forslag</label>
          <div className="p-3 bg-gray-50 rounded border text-sm">{suggestionText}</div>
        </div>

        {/* Rating */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hvor nyttig var forslaget?
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-2xl transition-colors ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Category selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hva var bra eller dårlig? (velg alle som passer)
          </label>

          <div className="space-y-3">
            {/* Positive categories */}
            <div>
              <span className="text-xs text-green-600 font-medium">Positivt</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {FEEDBACK_CATEGORIES.positive.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      selectedCategories.includes(cat.id)
                        ? 'bg-green-100 border-green-400 text-green-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Negative categories */}
            <div>
              <span className="text-xs text-red-600 font-medium">Negativt</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {FEEDBACK_CATEGORIES.negative.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      selectedCategories.includes(cat.id)
                        ? 'bg-red-100 border-red-400 text-red-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Neutral categories */}
            <div>
              <span className="text-xs text-gray-600 font-medium">Nøytral</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {FEEDBACK_CATEGORIES.neutral.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      selectedCategories.includes(cat.id)
                        ? 'bg-blue-100 border-blue-400 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Text modification toggle */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowTextEditor(!showTextEditor)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showTextEditor ? '− Skjul tekstredigering' : '+ Rediger forslaget'}
          </button>

          {showTextEditor && (
            <textarea
              value={modifiedText}
              onChange={(e) => setModifiedText(e.target.value)}
              className="mt-2 w-full p-3 border rounded-lg text-sm resize-y min-h-[100px]"
              placeholder="Rediger teksten..."
            />
          )}
        </div>

        {/* Additional comment */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kommentar (valgfritt)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3 border rounded-lg text-sm resize-y min-h-[80px]"
            placeholder="Legg til kommentar for å forbedre AI-forslag i fremtiden..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Avbryt
          </button>
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Sender...' : 'Send tilbakemelding'}
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * AI Suggestion Review Card
 */
export const AISuggestionReview = ({ suggestion, onApprove, onModify, onReject }) => {
  const [isModifying, setIsModifying] = useState(false);
  const [modifiedText, setModifiedText] = useState(suggestion.suggestedText);

  const confidenceColor =
    suggestion.confidenceLevel === 'HIGH'
      ? 'text-green-600 bg-green-50'
      : suggestion.confidenceLevel === 'MEDIUM'
        ? 'text-yellow-600 bg-yellow-50'
        : 'text-red-600 bg-red-50';

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="font-medium">AI-forslag</span>
          <span className={`px-2 py-0.5 rounded text-xs ${confidenceColor}`}>
            {suggestion.confidenceLevel === 'HIGH'
              ? 'Høy'
              : suggestion.confidenceLevel === 'MEDIUM'
                ? 'Moderat'
                : 'Lav'}{' '}
            konfidens ({Math.round(suggestion.confidenceScore * 100)}%)
          </span>
        </div>
        {suggestion.hasRedFlags && (
          <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">
            🚨 Røde flagg oppdaget
          </span>
        )}
      </div>

      {/* Suggestion text */}
      {isModifying ? (
        <textarea
          value={modifiedText}
          onChange={(e) => setModifiedText(e.target.value)}
          className="w-full p-3 border rounded-lg text-sm mb-3 min-h-[100px]"
        />
      ) : (
        <div className="p-3 bg-gray-50 rounded-lg text-sm mb-3">{suggestion.suggestedText}</div>
      )}

      {/* Red flag warnings */}
      {suggestion.hasRedFlags && suggestion.redFlags?.length > 0 && (
        <div className="mb-3 p-2 bg-red-50 rounded border border-red-200">
          <div className="text-xs font-medium text-red-700 mb-1">Påkrevd vurdering:</div>
          <ul className="text-xs text-red-600 list-disc list-inside">
            {suggestion.redFlags.map((flag, idx) => (
              <li key={idx}>{flag.description}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {isModifying ? (
          <>
            <button
              onClick={() => {
                onModify(suggestion.id, modifiedText);
                setIsModifying(false);
              }}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Lagre endringer
            </button>
            <button
              onClick={() => {
                setModifiedText(suggestion.suggestedText);
                setIsModifying(false);
              }}
              className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
            >
              Avbryt
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onApprove(suggestion.id)}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              ✓ Godkjenn
            </button>
            <button
              onClick={() => setIsModifying(true)}
              className="flex-1 px-3 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm hover:bg-blue-50"
            >
              ✎ Rediger
            </button>
            <button
              onClick={() => onReject(suggestion.id)}
              className="px-3 py-2 border border-red-600 text-red-600 rounded-lg text-sm hover:bg-red-50"
            >
              ✗
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default {
  QuickFeedback,
  DetailedFeedback,
  AISuggestionReview,
};
