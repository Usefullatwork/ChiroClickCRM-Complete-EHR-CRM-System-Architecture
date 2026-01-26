import { useState, useRef, useEffect } from 'react';
import { X, Clock, Zap, ChevronDown } from 'lucide-react';
import InlineAIButton from './InlineAIButton';

/**
 * SmartTextInput - Enhanced text input with quick-select phrases
 * Inspired by Jane App's "Phrases" and ChiroTouch's "Macros" features
 *
 * Features:
 * - Quick-select chips for common phrases
 * - Recent phrases history
 * - Auto-expand on focus
 * - Placeholder templates
 */
export default function SmartTextInput({
  label,
  value = '',
  onChange,
  placeholder = '',
  quickPhrases = [],
  recentPhrases = [],
  rows = 3,
  className = '',
  required = false,
  showQuickPhrases = true,
  // AI generation props
  aiEnabled = false,
  aiFieldType = null,
  aiContext = {},
  aiAvailable = true,
  language = 'no'
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPhraseDropdown, setShowPhraseDropdown] = useState(false);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowPhraseDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const insertPhrase = (phrase) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const currentValue = value || '';

      // Add space before phrase if needed
      const needsSpace = cursorPos > 0 && currentValue[cursorPos - 1] !== ' ' && currentValue[cursorPos - 1] !== '\n';
      const insertText = (needsSpace ? ' ' : '') + phrase;

      const newValue = currentValue.slice(0, cursorPos) + insertText + currentValue.slice(cursorPos);
      onChange(newValue);

      // Set cursor position after inserted text
      setTimeout(() => {
        textarea.focus();
        const newPos = cursorPos + insertText.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    } else {
      // Fallback: append to end
      onChange((value || '') + (value ? ' ' : '') + phrase);
    }
    setShowPhraseDropdown(false);
  };

  const clearText = () => {
    onChange('');
    textareaRef.current?.focus();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label with AI Button */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {aiEnabled && aiFieldType && (
            <InlineAIButton
              fieldType={aiFieldType}
              context={aiContext}
              language={language}
              disabled={!aiAvailable}
              onTextGenerated={(text) => {
                // Append generated text to existing value with proper spacing
                const newValue = value
                  ? `${value}${value.endsWith(' ') || value.endsWith('\n') ? '' : ' '}${text}`
                  : text;
                onChange(newValue);
              }}
            />
          )}
        </div>
      )}

      {/* Quick Phrases Bar */}
      {showQuickPhrases && quickPhrases.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {quickPhrases.slice(0, 6).map((phrase, index) => (
            <button
              key={index}
              type="button"
              onClick={() => insertPhrase(phrase.text || phrase)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <Zap className="w-3 h-3" />
              {phrase.label || phrase}
            </button>
          ))}
          {quickPhrases.length > 6 && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowPhraseDropdown(!showPhraseDropdown)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                +{quickPhrases.length - 6} more
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* Dropdown */}
              {showPhraseDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                  <div className="py-1">
                    {quickPhrases.slice(6).map((phrase, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => insertPhrase(phrase.text || phrase)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                      >
                        {phrase.label || phrase}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Text Area Container */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={isFocused ? Math.max(rows, 4) : rows}
          className={`w-full px-4 py-2 border rounded-lg transition-all resize-none ${
            isFocused
              ? 'border-blue-500 ring-2 ring-blue-200'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        />

        {/* Clear button */}
        {value && (
          <button
            type="button"
            onClick={clearText}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Recent Phrases (if any) */}
      {recentPhrases.length > 0 && isFocused && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Recent:
          </span>
          {recentPhrases.slice(0, 4).map((phrase, index) => (
            <button
              key={index}
              type="button"
              onClick={() => insertPhrase(phrase)}
              className="px-2 py-0.5 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              {phrase.length > 30 ? phrase.slice(0, 30) + '...' : phrase}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Pre-built quick phrase configurations
export const CHIEF_COMPLAINT_PHRASES = [
  { label: 'Lower back pain', text: 'Lower back pain' },
  { label: 'Neck pain', text: 'Neck pain' },
  { label: 'Headache', text: 'Headache' },
  { label: 'Shoulder pain', text: 'Shoulder pain' },
  { label: 'Mid back pain', text: 'Mid-back/thoracic pain' },
  { label: 'Hip pain', text: 'Hip pain' },
  { label: 'Sciatica', text: 'Radiating leg pain / sciatica symptoms' },
  { label: 'Stiffness', text: 'Stiffness and reduced mobility' },
];

export const ONSET_PHRASES = [
  { label: 'Gradual', text: 'Gradual onset over' },
  { label: 'Sudden', text: 'Sudden onset' },
  { label: 'After injury', text: 'Following injury/trauma' },
  { label: 'After lifting', text: 'After lifting heavy object' },
  { label: 'Woke up with', text: 'Woke up with symptoms' },
  { label: 'Work-related', text: 'Work-related repetitive strain' },
  { label: 'Sport injury', text: 'During sports/physical activity' },
  { label: 'Unknown', text: 'Unknown/insidious onset' },
];

export const HISTORY_PHRASES = [
  { label: 'First episode', text: 'This is the first episode of this condition.' },
  { label: 'Recurring', text: 'Patient reports recurring episodes.' },
  { label: 'Previous treatment', text: 'Has received previous treatment including' },
  { label: 'No prev treatment', text: 'No previous treatment for this condition.' },
  { label: 'Getting worse', text: 'Symptoms have been progressively worsening.' },
  { label: 'Stable', text: 'Symptoms have been relatively stable.' },
  { label: 'Improving', text: 'Patient reports gradual improvement.' },
  { label: 'Night pain', text: 'Reports night pain/sleep disturbance.' },
];

export const CLINICAL_REASONING_PHRASES = [
  { label: 'Mechanical', text: 'Clinical presentation consistent with mechanical spinal pain.' },
  { label: 'Facet involvement', text: 'Findings suggest facet joint involvement.' },
  { label: 'Disc involvement', text: 'Pattern consistent with discogenic pain.' },
  { label: 'Muscular', text: 'Primarily muscular/myofascial presentation.' },
  { label: 'SI dysfunction', text: 'Findings consistent with SI joint dysfunction.' },
  { label: 'Radiculopathy', text: 'Clinical signs suggestive of radiculopathy.' },
  { label: 'Good prognosis', text: 'Good prognosis with conservative care expected.' },
  { label: 'No red flags', text: 'No red flags identified. Safe to proceed with treatment.' },
];

export const FOLLOW_UP_PHRASES = [
  { label: '1 week', text: 'Follow-up in 1 week' },
  { label: '2 weeks', text: 'Follow-up in 2 weeks' },
  { label: 'As needed', text: 'Return as needed (PRN)' },
  { label: '3-4 visits', text: 'Recommend 3-4 visits over next 2 weeks' },
  { label: '6 visits', text: 'Treatment plan: 6 visits over 3 weeks' },
  { label: 'Re-evaluate', text: 'Re-evaluation in 4 weeks to assess progress' },
  { label: 'Discharge', text: 'Patient ready for discharge/self-management' },
  { label: 'Refer', text: 'Consider referral for further evaluation if no improvement' },
];

export const ADVICE_PHRASES = [
  { label: 'Ice 20min', text: 'Apply ice for 20 minutes, 2-3 times daily.' },
  { label: 'Heat', text: 'Apply heat for 15-20 minutes as needed for muscle relaxation.' },
  { label: 'Ergonomic', text: 'Review workstation ergonomics; ensure proper desk/chair setup.' },
  { label: 'Activity mod', text: 'Modify activities to avoid aggravating movements.' },
  { label: 'Stay active', text: 'Maintain light activity; avoid prolonged bed rest.' },
  { label: 'Posture', text: 'Focus on postural awareness throughout the day.' },
  { label: 'Walking', text: 'Light walking as tolerated, starting with 10-15 minutes.' },
  { label: 'Sleep', text: 'Sleep hygiene: supportive pillow, avoid stomach sleeping.' },
];
