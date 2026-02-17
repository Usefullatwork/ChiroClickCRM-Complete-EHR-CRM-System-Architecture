/**
 * AIFeedbackHistory Component
 *
 * Shows user's past feedback with:
 * - List of recent corrections
 * - Filter by type, date
 * - Stats summary (acceptance rate, avg rating)
 */

import { useState, useMemo } from 'react';
import {
  History,
  Filter,
  Calendar,
  Star,
  Check,
  X,
  Edit3,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

// Bilingual text support
const TEXTS = {
  NO: {
    title: 'Tilbakemeldingshistorikk',
    subtitle: 'Dine tidligere AI-tilbakemeldinger',
    filterByType: 'Filtrer etter type',
    filterByDate: 'Filtrer etter dato',
    allTypes: 'Alle typer',
    allDates: 'Alle datoer',
    last7Days: 'Siste 7 dager',
    last30Days: 'Siste 30 dager',
    last90Days: 'Siste 90 dager',
    noFeedback: 'Ingen tilbakemeldinger funnet',
    noFeedbackSubtitle: 'Gi tilbakemelding pa AI-forslag for a se dem her',
    loading: 'Laster...',
    showMore: 'Vis flere',
    stats: {
      totalFeedback: 'Totale tilbakemeldinger',
      acceptanceRate: 'Godkjenningsrate',
      avgRating: 'Gjennomsnittlig vurdering',
      avgDecisionTime: 'Gjennomsnittlig beslutningstid',
    },
    actions: {
      accepted: 'Godkjent',
      modified: 'Redigert',
      rejected: 'Avvist',
    },
    types: {
      subjective: 'Subjektiv',
      objective: 'Objektiv',
      assessment: 'Vurdering',
      plan: 'Plan',
      diagnosis: 'Diagnose',
      treatment: 'Behandling',
      summary: 'Sammendrag',
      default: 'Forslag',
    },
    refresh: 'Oppdater',
  },
  EN: {
    title: 'Feedback History',
    subtitle: 'Your previous AI feedback',
    filterByType: 'Filter by type',
    filterByDate: 'Filter by date',
    allTypes: 'All types',
    allDates: 'All dates',
    last7Days: 'Last 7 days',
    last30Days: 'Last 30 days',
    last90Days: 'Last 90 days',
    noFeedback: 'No feedback found',
    noFeedbackSubtitle: 'Submit feedback on AI suggestions to see them here',
    loading: 'Loading...',
    showMore: 'Show more',
    stats: {
      totalFeedback: 'Total Feedback',
      acceptanceRate: 'Acceptance Rate',
      avgRating: 'Average Rating',
      avgDecisionTime: 'Avg Decision Time',
    },
    actions: {
      accepted: 'Accepted',
      modified: 'Modified',
      rejected: 'Rejected',
    },
    types: {
      subjective: 'Subjective',
      objective: 'Objective',
      assessment: 'Assessment',
      plan: 'Plan',
      diagnosis: 'Diagnosis',
      treatment: 'Treatment',
      summary: 'Summary',
      default: 'Suggestion',
    },
    refresh: 'Refresh',
  },
};

/**
 * Stats Summary Card
 */
const StatsSummary = ({ stats, language = 'NO' }) => {
  const t = TEXTS[language] || TEXTS.NO;

  const statCards = [
    {
      key: 'total',
      label: t.stats.totalFeedback,
      value: stats?.totalFeedback || 0,
      icon: History,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      key: 'acceptance',
      label: t.stats.acceptanceRate,
      value: `${stats?.acceptanceRate?.toFixed(1) || 0}%`,
      icon: TrendingUp,
      color: 'text-green-600 bg-green-100',
    },
    {
      key: 'rating',
      label: t.stats.avgRating,
      value: stats?.avgRating?.toFixed(1) || '0.0',
      icon: Star,
      color: 'text-yellow-600 bg-yellow-100',
      suffix: '/5',
    },
    {
      key: 'time',
      label: t.stats.avgDecisionTime,
      value: formatDecisionTime(stats?.avgDecisionTime),
      icon: Clock,
      color: 'text-purple-600 bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map(({ key, label, value, icon: Icon, color, suffix }) => (
        <div
          key={key}
          className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-3"
        >
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            <p className="text-lg font-bold text-slate-900">
              {value}
              {suffix && <span className="text-sm font-normal text-slate-500">{suffix}</span>}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Format decision time in seconds to readable format
 */
function formatDecisionTime(ms) {
  if (!ms || ms === 0) {
    return '0s';
  }
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format date to localized string
 */
function formatDate(dateString, language = 'NO') {
  const date = new Date(dateString);
  const locale = language === 'NO' ? 'nb-NO' : 'en-US';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Feedback Item Component
 */
const FeedbackItem = ({ feedback, language = 'NO' }) => {
  const t = TEXTS[language] || TEXTS.NO;
  const [expanded, setExpanded] = useState(false);

  const {
    _id,
    suggestionType,
    originalSuggestion,
    userCorrection,
    correctionType,
    userRating,
    timeToDecision,
    createdAt,
    feedbackNotes,
  } = feedback;

  const getActionIcon = () => {
    switch (correctionType) {
      case 'accepted_as_is':
        return <Check size={14} className="text-green-600" />;
      case 'modified':
        return <Edit3 size={14} className="text-blue-600" />;
      case 'rejected':
        return <X size={14} className="text-red-600" />;
      default:
        return null;
    }
  };

  const getActionBadgeVariant = () => {
    switch (correctionType) {
      case 'accepted_as_is':
        return 'success';
      case 'modified':
        return 'info';
      case 'rejected':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getActionLabel = () => {
    switch (correctionType) {
      case 'accepted_as_is':
        return t.actions.accepted;
      case 'modified':
        return t.actions.modified;
      case 'rejected':
        return t.actions.rejected;
      default:
        return correctionType;
    }
  };

  const typeLabel = t.types[suggestionType?.toLowerCase()] || t.types.default;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden transition-all duration-200 hover:border-slate-300">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Badge variant="default" size="sm">
            {typeLabel}
          </Badge>
          <Badge variant={getActionBadgeVariant()} size="sm">
            {getActionIcon()}
            <span className="ml-1">{getActionLabel()}</span>
          </Badge>

          {/* Star Rating */}
          {userRating && (
            <div className="flex items-center gap-1">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-slate-700">{userRating}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:block">
            {formatDate(createdAt, language)}
          </span>
          {expanded ? (
            <ChevronUp size={18} className="text-slate-400" />
          ) : (
            <ChevronDown size={18} className="text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 py-3 space-y-3 bg-white animate-slide-down">
          {/* Original Suggestion */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">
              {language === 'NO' ? 'Opprinnelig forslag' : 'Original Suggestion'}
            </p>
            <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded">
              {originalSuggestion?.length > 300
                ? `${originalSuggestion.slice(0, 300)}...`
                : originalSuggestion}
            </p>
          </div>

          {/* User Correction (if modified) */}
          {userCorrection && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">
                {language === 'NO' ? 'Din korrigering' : 'Your Correction'}
              </p>
              <p className="text-sm text-slate-700 bg-blue-50 p-2 rounded border border-blue-200">
                {userCorrection?.length > 300
                  ? `${userCorrection.slice(0, 300)}...`
                  : userCorrection}
              </p>
            </div>
          )}

          {/* Feedback Notes */}
          {feedbackNotes && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">
                {language === 'NO' ? 'Kommentarer' : 'Notes'}
              </p>
              <p className="text-sm text-slate-600 italic">{feedbackNotes}</p>
            </div>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDecisionTime(timeToDecision)}
            </span>
            <span className="sm:hidden">{formatDate(createdAt, language)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main AIFeedbackHistory Component
 */
export const AIFeedbackHistory = ({
  feedbackList = [],
  stats = {},
  isLoading = false,
  onRefresh,
  language = 'NO',
  className = '',
  pageSize = 10,
}) => {
  const t = TEXTS[language] || TEXTS.NO;

  // Filter state
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [displayCount, setDisplayCount] = useState(pageSize);

  // Get unique types from feedback
  const availableTypes = useMemo(() => {
    const types = new Set(feedbackList.map((f) => f.suggestionType));
    return Array.from(types).filter(Boolean);
  }, [feedbackList]);

  // Filter feedback list
  const filteredFeedback = useMemo(() => {
    let filtered = [...feedbackList];

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((f) => f.suggestionType === typeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let cutoffDate;
      switch (dateFilter) {
        case '7':
          cutoffDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30':
          cutoffDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90':
          cutoffDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = null;
      }
      if (cutoffDate) {
        filtered = filtered.filter((f) => new Date(f.createdAt) >= cutoffDate);
      }
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return filtered;
  }, [feedbackList, typeFilter, dateFilter]);

  // Paginated feedback
  const displayedFeedback = filteredFeedback.slice(0, displayCount);
  const hasMore = displayCount < filteredFeedback.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Summary */}
      <StatsSummary stats={stats} language={language} />

      {/* Main Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t.title}</h2>
            <p className="text-sm text-slate-500">{t.subtitle}</p>
          </div>

          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              icon={RefreshCw}
              className={isLoading ? 'animate-spin' : ''}
            >
              {t.refresh}
            </Button>
          )}
        </CardHeader>

        <CardBody>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-sm border border-slate-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="all">{t.allTypes}</option>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {t.types[type?.toLowerCase()] || type}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-sm border border-slate-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="all">{t.allDates}</option>
                <option value="7">{t.last7Days}</option>
                <option value="30">{t.last30Days}</option>
                <option value="90">{t.last90Days}</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={24} className="text-teal-600 animate-spin" />
              <span className="ml-2 text-slate-600">{t.loading}</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredFeedback.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History size={48} className="text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">{t.noFeedback}</p>
              <p className="text-sm text-slate-400">{t.noFeedbackSubtitle}</p>
            </div>
          )}

          {/* Feedback List */}
          {!isLoading && displayedFeedback.length > 0 && (
            <div className="space-y-3">
              {displayedFeedback.map((feedback) => (
                <FeedbackItem key={feedback.id} feedback={feedback} language={language} />
              ))}

              {/* Show More Button */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDisplayCount((prev) => prev + pageSize)}
                    icon={ChevronDown}
                  >
                    {t.showMore} ({filteredFeedback.length - displayCount} more)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default AIFeedbackHistory;
