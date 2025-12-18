/**
 * Outcome Questionnaire Component
 *
 * Interactive form for patients to complete outcome measures:
 * - Section-based questionnaires (NDI, ODI)
 * - Slider-based scales (VAS)
 * - Numeric rating scales (NRS)
 * - Multi-subscale questionnaires (FABQ)
 *
 * Features:
 * - Progress indicator
 * - Auto-save draft
 * - Immediate scoring
 * - Comparison with previous results
 *
 * Bilingual: English/Norwegian
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  QUESTIONNAIRES,
  calculateScore,
  calculateFABQScore,
  calculateChange,
} from './questionnaires';

// =============================================================================
// TRANSLATIONS
// =============================================================================

const TRANSLATIONS = {
  en: {
    startQuestionnaire: 'Start Questionnaire',
    continue: 'Continue',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    question: 'Question',
    of: 'of',
    progress: 'Progress',
    yourScore: 'Your Score',
    interpretation: 'Interpretation',
    previousScore: 'Previous Score',
    change: 'Change',
    improved: 'Improved',
    worsened: 'Worsened',
    noChange: 'No significant change',
    clinicallySignificant: 'Clinically significant change',
    thankYou: 'Thank you for completing the questionnaire',
    resultsBelow: 'Your results are shown below',
    selectAnswer: 'Please select an answer',
    optional: '(Optional)',
    skip: 'Skip this question',
  },
  no: {
    startQuestionnaire: 'Start spørreskjema',
    continue: 'Fortsett',
    back: 'Tilbake',
    next: 'Neste',
    submit: 'Send inn',
    question: 'Spørsmål',
    of: 'av',
    progress: 'Fremgang',
    yourScore: 'Din score',
    interpretation: 'Tolkning',
    previousScore: 'Forrige score',
    change: 'Endring',
    improved: 'Forbedret',
    worsened: 'Forverret',
    noChange: 'Ingen betydelig endring',
    clinicallySignificant: 'Klinisk signifikant endring',
    thankYou: 'Takk for at du fullførte spørreskjemaet',
    resultsBelow: 'Resultatene dine vises nedenfor',
    selectAnswer: 'Vennligst velg et svar',
    optional: '(Valgfritt)',
    skip: 'Hopp over dette spørsmålet',
  },
};

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Progress Bar
 */
function ProgressBar({ current, total, lang }) {
  const t = TRANSLATIONS[lang];
  const percentage = (current / total) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
        <span>{t.question} {current} {t.of} {total}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Section Question (NDI, ODI style)
 */
function SectionQuestion({ section, answer, onChange, lang }) {
  const t = TRANSLATIONS[lang];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {section.title[lang]}
        {section.optional && (
          <span className="ml-2 text-sm font-normal text-gray-500">{t.optional}</span>
        )}
      </h3>
      <div className="space-y-2">
        {section.options.map((option, index) => (
          <label
            key={index}
            className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
              answer === option.score
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <input
              type="radio"
              name={section.id}
              value={option.score}
              checked={answer === option.score}
              onChange={() => onChange(option.score)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-gray-900 dark:text-white">
              {option.text[lang]}
            </span>
          </label>
        ))}
      </div>
      {section.optional && (
        <button
          onClick={() => onChange(null)}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          {t.skip}
        </button>
      )}
    </div>
  );
}

/**
 * VAS Slider
 */
function VASSlider({ questionnaire, value, onChange, lang }) {
  const [localValue, setLocalValue] = useState(value || 0);

  const handleChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    setLocalValue(newValue);
  };

  const handleRelease = () => {
    onChange(localValue);
  };

  const getColor = () => {
    if (localValue <= 30) return 'from-green-500 to-yellow-500';
    if (localValue <= 60) return 'from-yellow-500 to-orange-500';
    return 'from-orange-500 to-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
          {localValue}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {questionnaire.scoring.interpretation.find(
            (i) => localValue >= i.min && localValue <= i.max
          )?.label[lang]}
        </div>
      </div>

      <div className="relative pt-6 pb-2">
        <input
          type="range"
          min={questionnaire.min}
          max={questionnaire.max}
          value={localValue}
          onChange={handleChange}
          onMouseUp={handleRelease}
          onTouchEnd={handleRelease}
          className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #22c55e 0%, #eab308 30%, #f97316 60%, #ef4444 100%)`,
          }}
        />
        <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{questionnaire.labels.left[lang]}</span>
          <span>{questionnaire.labels.right[lang]}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * NRS Numeric Scale
 */
function NRSScale({ questionnaire, value, onChange, lang }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
          {value ?? '-'}
        </div>
        {value !== null && value !== undefined && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {questionnaire.scoring.interpretation.find(
              (i) => value >= i.min && value <= i.max
            )?.label[lang]}
          </div>
        )}
      </div>

      <div className="flex justify-center gap-2 flex-wrap">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`w-12 h-12 rounded-lg font-bold text-lg transition-all ${
              value === i
                ? 'bg-blue-600 text-white scale-110'
                : i === 0
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : i <= 3
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                : i <= 6
                ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
          >
            {i}
          </button>
        ))}
      </div>

      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>{questionnaire.labels[0][lang]}</span>
        <span>{questionnaire.labels[10][lang]}</span>
      </div>
    </div>
  );
}

/**
 * FABQ Question (0-6 scale)
 */
function FABQQuestion({ item, answer, onChange, lang }) {
  const options = QUESTIONNAIRES.FABQ.options;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        {item.text[lang]}
      </h3>
      <div className="flex justify-between gap-1">
        {options.map((option) => (
          <button
            key={option.score}
            onClick={() => onChange(option.score)}
            className={`flex-1 py-3 px-2 rounded-lg text-sm font-medium transition-all ${
              answer === option.score
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {option.score}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{options[0].text[lang]}</span>
        <span>{options[3].text[lang]}</span>
        <span>{options[6].text[lang]}</span>
      </div>
    </div>
  );
}

/**
 * Results Display
 */
function ResultsDisplay({ questionnaireId, score, previousScore, lang }) {
  const t = TRANSLATIONS[lang];
  const questionnaire = QUESTIONNAIRES[questionnaireId];

  const change = previousScore
    ? calculateChange(previousScore.percentage, score.percentage, questionnaire.scoring.mcid)
    : null;

  const getColorClass = (interpretation) => {
    switch (interpretation?.color) {
      case 'green': return 'text-green-600 bg-green-100';
      case 'yellow': return 'text-yellow-600 bg-yellow-100';
      case 'orange': return 'text-orange-600 bg-orange-100';
      case 'red': return 'text-red-600 bg-red-100';
      case 'darkred': return 'text-red-800 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t.thankYou}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">{t.resultsBelow}</p>
      </div>

      {/* Score Display */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-4">
          <div className="text-5xl font-bold text-gray-900 dark:text-white">
            {questionnaireId === 'FABQ' ? (
              <>
                <span className="text-3xl">PA: {score.physical.score}</span>
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-3xl">W: {score.work.score}</span>
              </>
            ) : (
              <>
                {score.rawScore || score.percentage}
                {score.percentage !== undefined && (
                  <span className="text-2xl text-gray-500">%</span>
                )}
              </>
            )}
          </div>
          <div className="mt-2">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getColorClass(score.interpretation)}`}>
              {score.interpretation?.label[lang]}
            </span>
          </div>
        </div>

        {/* Progress Bar Visual */}
        {score.percentage !== undefined && (
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                score.percentage <= 20 ? 'bg-green-500' :
                score.percentage <= 40 ? 'bg-yellow-500' :
                score.percentage <= 60 ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${score.percentage}%` }}
            />
          </div>
        )}
      </div>

      {/* Comparison with Previous */}
      {change && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
            {t.change}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t.previousScore}</div>
              <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                {previousScore.percentage}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t.change}</div>
              <div className={`text-2xl font-bold ${
                change.absoluteChange > 0 ? 'text-green-600' :
                change.absoluteChange < 0 ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {change.absoluteChange > 0 ? '-' : '+'}
                {Math.abs(change.absoluteChange)}%
              </div>
            </div>
          </div>
          {change.clinicallySignificant && (
            <div className={`mt-4 p-3 rounded-lg ${
              change.significance === 'improved'
                ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {change.significance === 'improved' ? '✓ ' : '⚠ '}
              {t.clinicallySignificant}: {change.significance === 'improved' ? t.improved : t.worsened}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function OutcomeQuestionnaire({
  questionnaireId,
  patientId,
  previousScore,
  onComplete,
  onCancel,
  lang = 'en',
}) {
  const t = TRANSLATIONS[lang];
  const questionnaire = QUESTIONNAIRES[questionnaireId];

  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(null);

  // Handle answer change
  const handleAnswer = useCallback((sectionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [sectionId]: value,
    }));
  }, []);

  // Calculate total sections
  const totalSections = useMemo(() => {
    if (questionnaire.type === 'slider' || questionnaire.type === 'numeric') {
      return 1;
    }
    return questionnaire.sections.length;
  }, [questionnaire]);

  // Navigate
  const goNext = () => {
    if (currentSection < totalSections - 1) {
      setCurrentSection((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const goBack = () => {
    if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
    }
  };

  // Submit
  const handleSubmit = () => {
    let calculatedScore;

    if (questionnaireId === 'FABQ') {
      calculatedScore = calculateFABQScore(answers);
    } else {
      calculatedScore = calculateScore(questionnaireId, answers);
    }

    setScore(calculatedScore);
    setIsComplete(true);

    if (onComplete) {
      onComplete({
        questionnaireId,
        patientId,
        answers,
        score: calculatedScore,
        completedAt: new Date().toISOString(),
      });
    }
  };

  // Render current question
  const renderCurrentQuestion = () => {
    if (questionnaire.type === 'slider') {
      return (
        <VASSlider
          questionnaire={questionnaire}
          value={answers.value}
          onChange={(val) => handleAnswer('value', val)}
          lang={lang}
        />
      );
    }

    if (questionnaire.type === 'numeric') {
      return (
        <NRSScale
          questionnaire={questionnaire}
          value={answers.value}
          onChange={(val) => handleAnswer('value', val)}
          lang={lang}
        />
      );
    }

    if (questionnaireId === 'FABQ') {
      const item = questionnaire.sections[currentSection];
      return (
        <FABQQuestion
          item={item}
          answer={answers[item.id]}
          onChange={(val) => handleAnswer(item.id, val)}
          lang={lang}
        />
      );
    }

    const section = questionnaire.sections[currentSection];
    return (
      <SectionQuestion
        section={section}
        answer={answers[section.id]}
        onChange={(val) => handleAnswer(section.id, val)}
        lang={lang}
      />
    );
  };

  // Check if current question is answered
  const isCurrentAnswered = () => {
    if (questionnaire.type === 'slider' || questionnaire.type === 'numeric') {
      return answers.value !== undefined;
    }
    if (questionnaireId === 'FABQ') {
      return answers[questionnaire.sections[currentSection].id] !== undefined;
    }
    const section = questionnaire.sections[currentSection];
    return answers[section.id] !== undefined || section.optional;
  };

  if (!questionnaire) {
    return <div>Questionnaire not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {questionnaire.name[lang]}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {questionnaire.description[lang]}
        </p>
      </div>

      {isComplete ? (
        <ResultsDisplay
          questionnaireId={questionnaireId}
          score={score}
          previousScore={previousScore}
          lang={lang}
        />
      ) : (
        <>
          {/* Progress */}
          <ProgressBar
            current={currentSection + 1}
            total={totalSections}
            lang={lang}
          />

          {/* Instructions (first question only) */}
          {currentSection === 0 && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300">
              {questionnaire.instructions[lang]}
            </div>
          )}

          {/* Current Question */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
            {renderCurrentQuestion()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={currentSection === 0 ? onCancel : goBack}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {currentSection === 0 ? 'Cancel' : t.back}
            </button>
            <button
              onClick={goNext}
              disabled={!isCurrentAnswered()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {currentSection < totalSections - 1 ? t.next : t.submit}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Named exports for individual components
export {
  SectionQuestion,
  VASSlider,
  NRSScale,
  FABQQuestion,
  ResultsDisplay,
  ProgressBar,
};
