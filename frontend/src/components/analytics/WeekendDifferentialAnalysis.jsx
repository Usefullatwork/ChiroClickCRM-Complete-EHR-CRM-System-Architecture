import _React, { useMemo } from 'react';
import { Calendar, MapPin, TrendingUp, Users, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useWeekendDifferentials } from '../../hooks/useAnalytics';
import { _getDistanceCategory, _isSaturday } from '../../utils/geographicUtils';

/**
 * Weekend Differential Analysis Component
 *
 * Shows correlation between Saturday visits and non-Oslo patients
 * Helps understand how weekend appointments affect PVA metrics
 *
 * Key Insights:
 * - Saturday visits vs. weekday visits
 * - Oslo vs. non-Oslo patient breakdown
 * - PVA differential (weekend PVA vs. weekday PVA)
 * - Saturday + non-Oslo correlation
 */
export const WeekendDifferentialAnalysis = ({ timeRange, selectedDate }) => {
  const { data, isLoading } = useWeekendDifferentials(timeRange, selectedDate);

  const analysis = useMemo(() => {
    if (!data) {
      return null;
    }

    const {
      totalVisits,
      weekdayVisits,
      saturdayVisits,
      sundayVisits,
      osloPatients,
      nonOsloPatients,
      saturdayNonOsloVisits,
      weekdayPVA,
      saturdayPVA,
      overallPVA,
    } = data;

    // Calculate percentages
    const saturdayPercentage =
      totalVisits > 0 ? ((saturdayVisits / totalVisits) * 100).toFixed(1) : 0;
    const nonOsloPercentage =
      totalVisits > 0 ? ((nonOsloPatients.visits / totalVisits) * 100).toFixed(1) : 0;
    const saturdayNonOsloPercentage =
      saturdayVisits > 0 ? ((saturdayNonOsloVisits / saturdayVisits) * 100).toFixed(1) : 0;

    // Calculate PVA impact
    const pvaImpact = saturdayPVA && weekdayPVA ? saturdayPVA - weekdayPVA : 0;
    const pvaImpactPercentage = weekdayPVA > 0 ? ((pvaImpact / weekdayPVA) * 100).toFixed(1) : 0;

    return {
      totalVisits,
      weekdayVisits,
      saturdayVisits,
      sundayVisits,
      saturdayPercentage,
      osloPatients,
      nonOsloPatients,
      nonOsloPercentage,
      saturdayNonOsloVisits,
      saturdayNonOsloPercentage,
      weekdayPVA,
      saturdayPVA,
      overallPVA,
      pvaImpact,
      pvaImpactPercentage,
    };
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <Card.Body>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Calendar size={24} className="text-teal-600" />
          Weekend Differential Analysis
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Understanding how Saturday visits and non-Oslo patients affect your metrics
        </p>
      </div>

      {/* Key Insight Card */}
      <Card className="border-2 border-teal-200 bg-teal-50">
        <Card.Body>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-100 rounded-lg">
              <TrendingUp size={24} className="text-teal-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 text-lg">Saturday Impact on PVA</h3>
              <p className="text-sm text-slate-700 mt-2">
                <strong>{analysis.saturdayNonOsloPercentage}%</strong> of Saturday visits are from
                non-Oslo patients. Saturday PVA (
                {analysis.saturdayPVA ? analysis.saturdayPVA.toFixed(2) : 'N/A'}) is{' '}
                <strong className={analysis.pvaImpact > 0 ? 'text-red-600' : 'text-green-600'}>
                  {analysis.pvaImpact > 0 ? 'higher' : 'lower'}
                </strong>{' '}
                than weekday PVA ({analysis.weekdayPVA ? analysis.weekdayPVA.toFixed(2) : 'N/A'}) by{' '}
                <strong>{Math.abs(analysis.pvaImpactPercentage)}%</strong>.
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Saturday Visits */}
        <Card>
          <Card.Body>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Saturday Visits</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{analysis.saturdayVisits}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {analysis.saturdayPercentage}% of total visits
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar size={20} className="text-purple-600" />
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Weekday Visits */}
        <Card>
          <Card.Body>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Weekday Visits</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{analysis.weekdayVisits}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {(
                    100 -
                    analysis.saturdayPercentage -
                    (analysis.sundayVisits / analysis.totalVisits) * 100
                  ).toFixed(1)}
                  % of total
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock size={20} className="text-blue-600" />
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Non-Oslo Patients */}
        <Card>
          <Card.Body>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Non-Oslo Patients</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {analysis.nonOsloPatients.visits}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {analysis.nonOsloPercentage}% of total visits
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <MapPin size={20} className="text-orange-600" />
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Saturday + Non-Oslo */}
        <Card>
          <Card.Body>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Sat + Non-Oslo</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {analysis.saturdayNonOsloVisits}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {analysis.saturdayNonOsloPercentage}% of Saturdays
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Users size={20} className="text-red-600" />
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* PVA Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold text-slate-900">Overall PVA</h3>
          </Card.Header>
          <Card.Body>
            <div className="text-center">
              <p className="text-4xl font-bold text-slate-900">
                {analysis.overallPVA ? analysis.overallPVA.toFixed(2) : '0.00'}
              </p>
              <p className="text-sm text-slate-600 mt-2">visits per active patient</p>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold text-slate-900">Weekday PVA</h3>
          </Card.Header>
          <Card.Body>
            <div className="text-center">
              <p className="text-4xl font-bold text-teal-600">
                {analysis.weekdayPVA ? analysis.weekdayPVA.toFixed(2) : '0.00'}
              </p>
              <p className="text-sm text-slate-600 mt-2">Mon-Fri average</p>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h3 className="text-lg font-semibold text-slate-900">Saturday PVA</h3>
          </Card.Header>
          <Card.Body>
            <div className="text-center">
              <p
                className={`text-4xl font-bold ${
                  analysis.pvaImpact > 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {analysis.saturdayPVA ? analysis.saturdayPVA.toFixed(2) : '0.00'}
              </p>
              <p className="text-sm text-slate-600 mt-2">
                {analysis.pvaImpact > 0 ? '+' : ''}
                {analysis.pvaImpactPercentage}% vs weekday
              </p>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Geographic Breakdown */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-semibold text-slate-900">Geographic Distribution</h3>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            {/* Oslo Patients */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-teal-600" />
                  <span className="font-medium text-slate-900">Oslo Patients</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-900">
                    {analysis.osloPatients.visits} visits
                  </span>
                  <span className="text-sm text-slate-500 ml-2">
                    ({analysis.osloPatients.uniquePatients} patients)
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-teal-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${100 - analysis.nonOsloPercentage}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Non-Oslo Patients */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-orange-600" />
                  <span className="font-medium text-slate-900">Non-Oslo Patients</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-900">
                    {analysis.nonOsloPatients.visits} visits
                  </span>
                  <span className="text-sm text-slate-500 ml-2">
                    ({analysis.nonOsloPatients.uniquePatients} patients)
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${analysis.nonOsloPercentage}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Saturday Breakdown */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-3">Saturday Visit Breakdown</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-600">Oslo Patients on Saturday</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {analysis.saturdayVisits - analysis.saturdayNonOsloVisits}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {((1 - analysis.saturdayNonOsloPercentage / 100) * 100).toFixed(1)}% of Saturday
                  visits
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-slate-600">Non-Oslo Patients on Saturday</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">
                  {analysis.saturdayNonOsloVisits}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {analysis.saturdayNonOsloPercentage}% of Saturday visits
                </p>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Insights and Recommendations */}
      <Card className="border-l-4 border-l-teal-600">
        <Card.Header>
          <h3 className="text-lg font-semibold text-slate-900">Insights & Recommendations</h3>
        </Card.Header>
        <Card.Body>
          <ul className="space-y-3 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <Badge variant="info" className="mt-0.5">
                TIP
              </Badge>
              <span>
                When reporting clinic performance, consider excluding Saturday visits or reporting
                them separately to get a true "regular patient" PVA metric.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="info" className="mt-0.5">
                TIP
              </Badge>
              <span>
                Non-Oslo patients visiting on Saturdays likely have different visit patterns (less
                frequent) which naturally lowers PVA. Track these cohorts separately for accurate
                benchmarking.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="info" className="mt-0.5">
                TIP
              </Badge>
              <span>
                Use "Weekday PVA" ({analysis.weekdayPVA ? analysis.weekdayPVA.toFixed(2) : 'N/A'})
                for email reports to clinic leads as it represents your core Oslo patient base.
              </span>
            </li>
          </ul>
        </Card.Body>
      </Card>
    </div>
  );
};
