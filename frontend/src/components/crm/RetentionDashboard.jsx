import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  UserPlus,
  UserMinus,
  Activity,
  Clock,
  AlertTriangle,
  Star,
  ChevronRight,
  RefreshCw,
  Target,
  Loader2,
} from 'lucide-react';
import { crmAPI } from '../../services/api';

const RetentionDashboard = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [_selectedMetric, _setSelectedMetric] = useState('retention');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retentionData, setRetentionData] = useState({
    currentRate: 0,
    previousRate: 0,
    trend: 0,
    monthlyChurn: 0,
    avgLifetime: 0,
    avgVisitsPerPatient: 0,
    reactivationRate: 0,
  });
  const [patientFlow, setPatientFlow] = useState({
    newPatients: 0,
    reactivated: 0,
    churned: 0,
    atRisk: 0,
    netChange: 0,
  });
  const [cohortData, setCohortData] = useState([]);
  const [atRiskPatients, setAtRiskPatients] = useState([]);
  const [segmentRetention, setSegmentRetention] = useState([]);

  // Fetch retention data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [dashboardRes, churnRes] = await Promise.all([
          crmAPI.getRetentionDashboard({ period: timeRange }),
          crmAPI.getChurnAnalysis({ period: timeRange }),
        ]);

        if (dashboardRes.data) {
          setRetentionData({
            currentRate: dashboardRes.data.retention_rate || 0,
            previousRate: dashboardRes.data.previous_retention_rate || 0,
            trend: dashboardRes.data.trend || 0,
            monthlyChurn: dashboardRes.data.monthly_churn || 0,
            avgLifetime: dashboardRes.data.avg_lifetime_months || 0,
            avgVisitsPerPatient: dashboardRes.data.avg_visits_per_patient || 0,
            reactivationRate: dashboardRes.data.reactivation_rate || 0,
          });
          setPatientFlow({
            newPatients: dashboardRes.data.new_patients || 0,
            reactivated: dashboardRes.data.reactivated || 0,
            churned: dashboardRes.data.churned || 0,
            atRisk: dashboardRes.data.at_risk || 0,
            netChange: dashboardRes.data.net_change || 0,
          });
          setCohortData(dashboardRes.data.cohorts || []);
          setSegmentRetention(dashboardRes.data.segments || []);
        }

        if (churnRes.data?.atRiskPatients) {
          setAtRiskPatients(
            churnRes.data.atRiskPatients.map((p) => ({
              id: p.id,
              name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
              daysSinceVisit: p.days_since_visit || 0,
              lastVisit: p.last_visit_date,
              totalVisits: p.total_visits || 0,
              riskScore: p.risk_score || 0,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching retention data:', err);
        setError(err.message || 'Failed to load retention data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  // Get color based on retention rate
  const getRetentionColor = (rate) => {
    if (rate >= 80) {
      return 'text-green-600 bg-green-100';
    }
    if (rate >= 60) {
      return 'text-yellow-600 bg-yellow-100';
    }
    return 'text-red-600 bg-red-100';
  };

  // Get risk color
  const getRiskColor = (score) => {
    if (score >= 80) {
      return 'text-red-600 bg-red-100';
    }
    if (score >= 60) {
      return 'text-orange-600 bg-orange-100';
    }
    return 'text-yellow-600 bg-yellow-100';
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Laster retensjonsdata...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Prøv igjen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Retensjonsanalyse</h2>
          <p className="text-gray-600">Forstå og forbedre pasientbevaring</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '7d'
                ? '7 dager'
                : range === '30d'
                  ? '30 dager'
                  : range === '90d'
                    ? '90 dager'
                    : '1 år'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500">Retensjon</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{retentionData.currentRate}%</p>
          <div
            className={`flex items-center gap-1 text-sm ${retentionData.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}
          >
            {retentionData.trend >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {retentionData.trend > 0 ? '+' : ''}
            {retentionData.trend}%
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserMinus className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-500">Churn</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{retentionData.monthlyChurn}%</p>
          <p className="text-sm text-gray-500">månedlig</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-500">Gj.snitt Levetid</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{retentionData.avgLifetime}</p>
          <p className="text-sm text-gray-500">måneder</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Besøk/Pasient</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{retentionData.avgVisitsPerPatient}</p>
          <p className="text-sm text-gray-500">snitt</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500">Nye</span>
          </div>
          <p className="text-2xl font-bold text-green-600">+{patientFlow.newPatients}</p>
          <p className="text-sm text-gray-500">denne perioden</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-5 h-5 text-teal-500" />
            <span className="text-sm text-gray-500">Reaktivert</span>
          </div>
          <p className="text-2xl font-bold text-teal-600">+{patientFlow.reactivated}</p>
          <p className="text-sm text-gray-500">{retentionData.reactivationRate}% rate</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-500">I Fare</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{patientFlow.atRisk}</p>
          <p className="text-sm text-gray-500">pasienter</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cohort Analysis */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4">Kohortanalyse</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Kohort</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">Pasienter</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">M1</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">M2</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">M3</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">M4</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">M5</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">M6</th>
                </tr>
              </thead>
              <tbody>
                {cohortData.map((row) => (
                  <tr key={row.month} className="border-t border-gray-100">
                    <td className="py-2 px-2 font-medium text-gray-900">{row.month}</td>
                    <td className="py-2 px-2 text-center text-gray-600">{row.total}</td>
                    {[row.month1, row.month2, row.month3, row.month4, row.month5, row.month6].map(
                      (val, idx) => (
                        <td key={idx} className="py-2 px-2 text-center">
                          {val !== null ? (
                            <span className={`px-2 py-1 rounded ${getRetentionColor(val)}`}>
                              {val}%
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Retention by Segment */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4">Retensjon per Segment</h3>
          <div className="space-y-4">
            {segmentRetention.map((seg) => (
              <div key={seg.segment}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{seg.segment}</span>
                  <span
                    className={`text-sm font-medium ${
                      seg.retention >= 80
                        ? 'text-green-600'
                        : seg.retention >= 60
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {seg.retention}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        seg.retention >= 80
                          ? 'bg-green-500'
                          : seg.retention >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${seg.retention}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-16">{seg.count} pas.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* At-Risk Patients */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Pasienter i Fare for Churn</h3>
          <button className="text-blue-500 text-sm hover:underline flex items-center gap-1">
            Se alle <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Pasient
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Dager Siden Besøk
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Siste Besøk
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Totalt Besøk
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Risikoscore
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Handling
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {atRiskPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{patient.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-medium ${
                        patient.daysSinceVisit >= 90
                          ? 'text-red-600'
                          : patient.daysSinceVisit >= 45
                            ? 'text-orange-600'
                            : 'text-yellow-600'
                      }`}
                    >
                      {patient.daysSinceVisit} dager
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(patient.lastVisit).toLocaleDateString('nb-NO')}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{patient.totalVisits}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(patient.riskScore)}`}
                    >
                      {patient.riskScore}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200">
                      Kontakt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retention Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h4 className="font-medium text-green-800 flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            Positive Trender
          </h4>
          <ul className="space-y-1 text-sm text-green-700">
            <li>• VIP-retensjon økt til 92%</li>
            <li>• Reaktiveringsrate forbedret 5%</li>
            <li>• Nye pasienter: +24 denne måneden</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h4 className="font-medium text-yellow-800 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5" />
            Observasjoner
          </h4>
          <ul className="space-y-1 text-sm text-yellow-700">
            <li>• 18 pasienter i fare for churn</li>
            <li>• Sporadisk segment trenger fokus</li>
            <li>• Onboarding-drop etter 2. besøk</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-medium text-blue-800 flex items-center gap-2 mb-2">
            <Star className="w-5 h-5" />
            Anbefalinger
          </h4>
          <ul className="space-y-1 text-sm text-blue-700">
            <li>• Start reaktiveringskampanje</li>
            <li>• Forbedre onboarding-sekvens</li>
            <li>• Øk oppfølging etter 30 dager</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RetentionDashboard;
