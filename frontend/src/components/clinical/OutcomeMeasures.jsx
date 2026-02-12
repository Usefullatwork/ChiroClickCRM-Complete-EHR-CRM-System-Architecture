/**
 * OutcomeMeasures - Clinical questionnaire forms (ODI, NDI, VAS, DASH, NPRS)
 * Allows practitioners to submit scored questionnaires for patients
 */

import React, { useState, useCallback } from 'react';
import { ClipboardList, Check, AlertCircle } from 'lucide-react';
import { outcomesAPI } from '../../services/api';

const QUESTIONNAIRE_TYPES = [
  {
    value: 'NPRS',
    label: 'NPRS (Numeric Pain Rating Scale)',
    items: 1,
    description: 'Quick 0-10 pain rating',
  },
  {
    value: 'VAS',
    label: 'VAS (Visual Analog Scale)',
    items: 1,
    description: '0-100mm pain intensity',
  },
  {
    value: 'ODI',
    label: 'ODI (Oswestry Disability Index)',
    items: 10,
    description: 'Low back pain disability',
  },
  {
    value: 'NDI',
    label: 'NDI (Neck Disability Index)',
    items: 10,
    description: 'Neck pain disability',
  },
  {
    value: 'DASH',
    label: 'DASH (Disabilities of Arm/Shoulder/Hand)',
    items: 30,
    description: 'Upper extremity disability',
  },
];

const ODI_SECTIONS = [
  'Pain Intensity',
  'Personal Care',
  'Lifting',
  'Walking',
  'Sitting',
  'Standing',
  'Sleeping',
  'Social Life',
  'Traveling',
  'Employment/Homemaking',
];

const NDI_SECTIONS = [
  'Pain Intensity',
  'Personal Care',
  'Lifting',
  'Reading',
  'Headaches',
  'Concentration',
  'Work',
  'Driving',
  'Sleeping',
  'Recreation',
];

const DASH_ITEMS = [
  'Open a tight jar',
  'Write',
  'Turn a key',
  'Prepare a meal',
  'Push open a heavy door',
  'Place object on high shelf',
  'Heavy household chores',
  'Garden or yard work',
  'Make a bed',
  'Carry a shopping bag',
  'Carry a heavy object (>5kg)',
  'Change a lightbulb overhead',
  'Wash or blow-dry hair',
  'Wash your back',
  'Put on a pullover',
  'Use a knife to cut food',
  'Recreational activities (low force)',
  'Recreational activities (force/impact)',
  'Recreational activities (free arm movement)',
  'Manage transportation',
  'Sexual activities',
  'Social activities',
  'Work/daily activities limited',
  'Arm/shoulder/hand pain during activities',
  'Arm/shoulder/hand pain at rest',
  'Tingling in arm/shoulder/hand',
  'Weakness in arm/shoulder/hand',
  'Stiffness in arm/shoulder/hand',
  'Difficulty sleeping due to pain',
  'Less capable/confident due to condition',
];

function NPRSForm({ onSubmit }) {
  const [value, setValue] = useState(null);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Select your current pain level (0 = no pain, 10 = worst possible):
      </p>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setValue(i)}
            className={`w-12 h-12 rounded-lg border-2 font-bold text-lg transition-colors ${
              value === i
                ? 'bg-teal-600 border-teal-600 text-white'
                : i <= 3
                  ? 'border-green-300 hover:bg-green-50'
                  : i <= 6
                    ? 'border-yellow-300 hover:bg-yellow-50'
                    : 'border-red-300 hover:bg-red-50'
            }`}
          >
            {i}
          </button>
        ))}
      </div>
      {value !== null && (
        <div className="text-sm font-medium text-gray-700">
          Selected: {value}/10
          {value === 0 && ' - No pain'}
          {value >= 1 && value <= 3 && ' - Mild pain'}
          {value >= 4 && value <= 6 && ' - Moderate pain'}
          {value >= 7 && ' - Severe pain'}
        </div>
      )}
      <button
        type="button"
        onClick={() => value !== null && onSubmit({ value })}
        disabled={value === null}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit NPRS
      </button>
    </div>
  );
}

function VASForm({ onSubmit }) {
  const [value, setValue] = useState(50);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Drag the slider to indicate your pain intensity:</p>
      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => setValue(parseInt(e.target.value))}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer accent-teal-600"
          style={{
            background: `linear-gradient(to right, #22c55e 0%, #eab308 50%, #ef4444 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>No pain (0)</span>
          <span>Worst pain (100)</span>
        </div>
      </div>
      <div className="text-sm font-medium text-gray-700">
        Selected: {value} mm
        {value === 0 && ' - No pain'}
        {value >= 1 && value <= 30 && ' - Mild'}
        {value >= 31 && value <= 60 && ' - Moderate'}
        {value >= 61 && ' - Severe'}
      </div>
      <button
        type="button"
        onClick={() => onSubmit({ value })}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
      >
        Submit VAS
      </button>
    </div>
  );
}

function MultiSectionForm({ sections, label, maxPerItem, onSubmit }) {
  const [answers, setAnswers] = useState(Array(sections.length).fill(null));

  const setAnswer = (idx, val) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const answeredCount = answers.filter((a) => a !== null).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Rate each section from 0 (no problem) to {maxPerItem} (worst):
        <span className="ml-2 font-medium">
          {answeredCount}/{sections.length} answered
        </span>
      </p>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {sections.map((section, idx) => (
          <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
            <span className="text-sm text-gray-700 w-48 flex-shrink-0">
              {idx + 1}. {section}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: maxPerItem + 1 }, (_, v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAnswer(idx, v)}
                  className={`w-9 h-9 rounded text-sm font-medium transition-colors ${
                    answers[idx] === v
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onSubmit(answers)}
        disabled={answeredCount === 0}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit {label}
      </button>
    </div>
  );
}

function DASHForm({ onSubmit }) {
  const [answers, setAnswers] = useState(Array(30).fill(null));

  const setAnswer = (idx, val) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const answeredCount = answers.filter((a) => a !== null).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Rate each item: 1 = No difficulty, 5 = Unable.
        <span className="ml-2 font-medium">{answeredCount}/30 answered (min 27 required)</span>
      </p>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {DASH_ITEMS.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
            <span className="text-sm text-gray-700 w-56 flex-shrink-0">
              {idx + 1}. {item}
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAnswer(idx, v)}
                  className={`w-9 h-9 rounded text-sm font-medium transition-colors ${
                    answers[idx] === v
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onSubmit(answers)}
        disabled={answeredCount < 27}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit DASH ({answeredCount < 27 ? `${27 - answeredCount} more needed` : 'Ready'})
      </button>
    </div>
  );
}

export default function OutcomeMeasures({ patientId, encounterId, onSubmitted }) {
  const [selectedType, setSelectedType] = useState('NPRS');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (rawAnswers) => {
      setSubmitting(true);
      setError(null);
      setResult(null);

      try {
        const response = await outcomesAPI.submitQuestionnaire({
          patientId,
          encounterId,
          questionnaireType: selectedType,
          rawAnswers,
        });
        setResult(response.data);
        if (onSubmitted) onSubmitted(response.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setSubmitting(false);
      }
    },
    [patientId, encounterId, selectedType, onSubmitted]
  );

  const renderForm = () => {
    switch (selectedType) {
      case 'NPRS':
        return <NPRSForm onSubmit={handleSubmit} />;
      case 'VAS':
        return <VASForm onSubmit={handleSubmit} />;
      case 'ODI':
        return (
          <MultiSectionForm
            sections={ODI_SECTIONS}
            label="ODI"
            maxPerItem={5}
            onSubmit={handleSubmit}
          />
        );
      case 'NDI':
        return (
          <MultiSectionForm
            sections={NDI_SECTIONS}
            label="NDI"
            maxPerItem={5}
            onSubmit={handleSubmit}
          />
        );
      case 'DASH':
        return <DASHForm onSubmit={handleSubmit} />;
      default:
        return null;
    }
  };

  const severityColor = (severity) => {
    if (!severity) return 'text-gray-600';
    const s = severity.toLowerCase();
    if (s.includes('no ') || s.includes('minimal') || s.includes('none')) return 'text-green-600';
    if (s.includes('mild')) return 'text-yellow-600';
    if (s.includes('moderate')) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-semibold text-gray-800">Outcome Measures</h3>
      </div>

      {/* Type selector */}
      <div className="mb-4">
        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value);
            setResult(null);
            setError(null);
          }}
          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          {QUESTIONNAIRE_TYPES.map((qt) => (
            <option key={qt.value} value={qt.value}>
              {qt.label} - {qt.description}
            </option>
          ))}
        </select>
      </div>

      {/* Form */}
      {submitting ? (
        <div className="flex items-center gap-2 py-8 justify-center text-gray-500">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-teal-600 border-t-transparent" />
          Scoring...
        </div>
      ) : (
        renderForm()
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-teal-600" />
            <span className="font-semibold text-teal-800">Score Recorded</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Score:</span>{' '}
              <span className="font-medium">
                {result.scoring?.score ?? result.calculated_score} /{' '}
                {result.scoring?.maxScore ?? result.max_possible_score}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Percentage:</span>{' '}
              <span className="font-medium">
                {result.scoring?.percentage ?? result.percentage_score}%
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Severity:</span>{' '}
              <span
                className={`font-medium ${severityColor(result.scoring?.severity ?? result.severity_category)}`}
              >
                {result.scoring?.severity ?? result.severity_category}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
