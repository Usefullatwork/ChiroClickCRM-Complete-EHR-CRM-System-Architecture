/**
 * AIConfidenceBadge - Traffic light confidence visualization for AI suggestions
 * Shows confidence level with optional expandable reasoning
 */

import _React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

const CONFIDENCE_LEVELS = {
  high: {
    threshold: 0.85,
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    dotColor: 'bg-green-500',
    label: 'Høy sikkerhet',
    description: 'AI er sikker på dette forslaget',
  },
  medium: {
    threshold: 0.6,
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    dotColor: 'bg-yellow-500',
    label: 'Gjennomgang anbefalt',
    description: 'Vennligst verifiser før bruk',
  },
  low: {
    threshold: 0,
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    dotColor: 'bg-red-500',
    label: 'Manuell verifisering',
    description: 'AI er usikker - krever klinisk vurdering',
  },
};

function getConfidenceLevel(score) {
  if (score >= CONFIDENCE_LEVELS.high.threshold) {
    return CONFIDENCE_LEVELS.high;
  }
  if (score >= CONFIDENCE_LEVELS.medium.threshold) {
    return CONFIDENCE_LEVELS.medium;
  }
  return CONFIDENCE_LEVELS.low;
}

export default function AIConfidenceBadge({
  confidence, // 0-1 score
  reasoning = [], // Array of strings explaining the confidence
  compact = false, // Show only dot without label
  showDetails = true, // Allow expansion to show reasoning
  className = '',
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const level = getConfidenceLevel(confidence);

  if (compact) {
    return (
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${level.dotColor}`}
        title={`${level.label} (${Math.round(confidence * 100)}%)`}
      />
    );
  }

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <button
        onClick={() => showDetails && setIsExpanded(!isExpanded)}
        className={`
          inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
          ${level.bgColor} ${level.textColor} ${level.borderColor} border
          ${showDetails ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
          transition-opacity
        `}
      >
        <span className={`w-2 h-2 rounded-full ${level.dotColor}`} />
        <span>{level.label}</span>
        {showDetails &&
          reasoning.length > 0 &&
          (isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </button>

      {/* Expanded reasoning */}
      {isExpanded && reasoning.length > 0 && (
        <div
          className={`
          mt-1 p-2 rounded-md text-xs
          ${level.bgColor} ${level.borderColor} border
        `}
        >
          <p className="font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Basert på:
          </p>
          <ul className="space-y-0.5 text-gray-600">
            {reasoning.map((reason, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-gray-400">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Simpler inline version for use in lists
export function AIConfidenceDot({ confidence, size = 'sm' }) {
  const level = getConfidenceLevel(confidence);
  const sizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <span
      className={`inline-block rounded-full ${level.dotColor} ${sizes[size]}`}
      title={`${level.label} (${Math.round(confidence * 100)}%)`}
    />
  );
}

// Export confidence calculation helper
export function calculateConfidence({
  matchingSimilarCases = 0,
  templateMatch = 0,
  contentLength = 0,
  medicalTermsPresent = 0,
}) {
  const factors = [];
  let score = 0.5; // Base confidence

  if (matchingSimilarCases > 20) {
    score += 0.2;
    factors.push(`Matcher ${matchingSimilarCases} lignende konsultasjoner`);
  } else if (matchingSimilarCases > 5) {
    score += 0.1;
    factors.push(`Matcher ${matchingSimilarCases} tidligere tilfeller`);
  }

  if (templateMatch > 0.8) {
    score += 0.15;
    factors.push('Høy mal-match');
  }

  if (contentLength > 100 && contentLength < 500) {
    score += 0.1;
    factors.push('Passende lengde');
  }

  if (medicalTermsPresent > 3) {
    score += 0.05;
    factors.push('Klinisk terminologi bekreftet');
  }

  return {
    score: Math.min(score, 0.98),
    factors,
  };
}
