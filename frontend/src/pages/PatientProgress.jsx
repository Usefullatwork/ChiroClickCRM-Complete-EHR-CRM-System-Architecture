/**
 * Patient Progress Dashboard
 * Dashboard showing patient exercise compliance and therapist monitoring view
 *
 * Dashboard for pasientfremgang
 * Viser pasientens treningsoverholdelse og terapeutens overvakningsvisning
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  Calendar,
  Award,
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
  Clock,
  CheckCircle,
  Target,
  Frown,
  Meh,
  Smile,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { progressAPI } from '../services/api';
import { useTranslation } from '../i18n';
import ProgressChart from '../components/patients/ProgressChart';
import ComplianceCalendar from '../components/patients/ComplianceCalendar';
import PainTracker from '../components/patients/PainTracker';

/**
 * PatientProgress Component
 * Main dashboard for tracking patient exercise progress
 *
 * @returns {JSX.Element} Patient progress dashboard
 */
export default function PatientProgress() {
  const { t } = useTranslation();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [_searchParams, _setSearchParams] = useSearchParams();

  // View mode: 'patient' (single patient) or 'therapist' (all patients)
  const viewMode = patientId ? 'patient' : 'therapist';

  // State
  const [_selectedPatient, _setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [complianceFilter, setComplianceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('compliance_rate');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Fetch patient progress stats (single patient view)
  const { data: patientStatsResponse, isLoading: _statsLoading } = useQuery({
    queryKey: ['patient-progress-stats', patientId],
    queryFn: () => progressAPI.getPatientStats(patientId),
    enabled: !!patientId && viewMode === 'patient',
  });

  // Fetch weekly compliance (single patient view)
  const { data: weeklyResponse, isLoading: weeklyLoading } = useQuery({
    queryKey: ['patient-weekly-compliance', patientId],
    queryFn: () => progressAPI.getWeeklyCompliance(patientId, 12),
    enabled: !!patientId && viewMode === 'patient',
  });

  // Fetch daily progress for calendar (single patient view)
  const { data: dailyResponse, isLoading: dailyLoading } = useQuery({
    queryKey: ['patient-daily-progress', patientId],
    queryFn: () => progressAPI.getDailyProgress(patientId, 3),
    enabled: !!patientId && viewMode === 'patient',
  });

  // Fetch pain history (single patient view)
  const { data: painResponse, isLoading: painLoading } = useQuery({
    queryKey: ['patient-pain-history', patientId],
    queryFn: () => progressAPI.getPainHistory(patientId, 90),
    enabled: !!patientId && viewMode === 'patient',
  });

  // Fetch all patients compliance (therapist view)
  const { data: complianceResponse, isLoading: complianceLoading } = useQuery({
    queryKey: ['all-patients-compliance', sortBy, sortOrder, complianceFilter],
    queryFn: () =>
      progressAPI.getAllPatientsCompliance({
        limit: 50,
        offset: 0,
        sortBy,
        order: sortOrder,
      }),
    enabled: viewMode === 'therapist',
  });

  // Fetch clinic overview (therapist view)
  const { data: overviewResponse, isLoading: _overviewLoading } = useQuery({
    queryKey: ['clinic-compliance-overview'],
    queryFn: () => progressAPI.getClinicOverview(),
    enabled: viewMode === 'therapist',
  });

  const patientStats = patientStatsResponse?.data;
  const weeklyData = weeklyResponse?.data || [];
  const dailyData = dailyResponse?.data || [];
  const painData = painResponse?.data;
  const allPatients = complianceResponse?.data?.patients || [];
  const clinicOverview = overviewResponse?.data;

  // Filter patients by search and compliance
  const filteredPatients = allPatients.filter((patient) => {
    const matchesSearch = patient.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      complianceFilter === 'all' ||
      (complianceFilter === 'excellent' && patient.complianceRate >= 80) ||
      (complianceFilter === 'good' &&
        patient.complianceRate >= 60 &&
        patient.complianceRate < 80) ||
      (complianceFilter === 'needs_attention' && patient.complianceRate < 60);
    return matchesSearch && matchesFilter;
  });

  /**
   * Get compliance status color
   */
  const getComplianceColor = (rate) => {
    if (rate >= 80) {
      return 'text-green-600 bg-green-100';
    }
    if (rate >= 60) {
      return 'text-blue-600 bg-blue-100';
    }
    if (rate >= 40) {
      return 'text-yellow-600 bg-yellow-100';
    }
    return 'text-red-600 bg-red-100';
  };

  /**
   * Get pain emoji
   */
  const getPainEmoji = (level) => {
    if (level <= 2) {
      return <Smile className="w-5 h-5 text-green-500" />;
    }
    if (level <= 5) {
      return <Meh className="w-5 h-5 text-yellow-500" />;
    }
    return <Frown className="w-5 h-5 text-red-500" />;
  };

  /**
   * Handle patient selection in therapist view
   */
  const handlePatientSelect = (patient) => {
    navigate(`/progress/${patient.patientId}`);
  };

  // Render therapist view (all patients)
  if (viewMode === 'therapist') {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('patients.trainingSummaryTitle', 'Treningsfremgang')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t(
              'patients.trainingSummarySubtitle',
              'Oversikt over pasientenes overholdelse av treningsprogram'
            )}
          </p>
        </div>

        {/* Clinic Overview Stats */}
        {clinicOverview && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t('patients.activePatients', 'Aktive pasienter')}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {clinicOverview.overview?.activePatients || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t('patients.activeThisWeek', 'Aktive denne uken')}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {clinicOverview.overview?.activeThisWeek || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t('exercises.totalExercisesCompleted', 'Totale øvelser utført')}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {clinicOverview.overview?.totalCompletions || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t('patients.avgPain30d', 'Gj.snitt smerte (30d)')}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-semibold text-gray-900">
                      {clinicOverview.overview?.avgPain30d || '-'}
                    </p>
                    {clinicOverview.overview?.avgPain30d &&
                      getPainEmoji(parseFloat(clinicOverview.overview.avgPain30d))}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Distribution */}
        {clinicOverview?.distribution && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('patients.complianceDistribution', 'Overholdelsesfordeling')}
            </h3>
            <div className="flex gap-4">
              <div className="flex-1 text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  {clinicOverview.distribution.excellent || 0}
                </p>
                <p className="text-sm text-green-700 mt-1">{t('patients.excellent', 'Utmerket')}</p>
                <p className="text-xs text-green-600">80%+</p>
              </div>
              <div className="flex-1 text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">
                  {clinicOverview.distribution.good || 0}
                </p>
                <p className="text-sm text-blue-700 mt-1">{t('patients.good', 'Bra')}</p>
                <p className="text-xs text-blue-600">60-79%</p>
              </div>
              <div className="flex-1 text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-3xl font-bold text-yellow-600">
                  {clinicOverview.distribution.fair || 0}
                </p>
                <p className="text-sm text-yellow-700 mt-1">{t('patients.fair', 'Middels')}</p>
                <p className="text-xs text-yellow-600">40-59%</p>
              </div>
              <div className="flex-1 text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-3xl font-bold text-orange-600">
                  {clinicOverview.distribution.low || 0}
                </p>
                <p className="text-sm text-orange-700 mt-1">{t('patients.low', 'Lav')}</p>
                <p className="text-xs text-orange-600">20-39%</p>
              </div>
              <div className="flex-1 text-center p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-600">
                  {clinicOverview.distribution.inactive || 0}
                </p>
                <p className="text-sm text-red-700 mt-1">{t('patients.inactive', 'Inaktiv')}</p>
                <p className="text-xs text-red-600">Under 20%</p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t('patients.searchPatient', 'Søk etter pasient...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <select
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('patients.allLevels', 'Alle nivåer')}</option>
              <option value="excellent">{t('patients.excellentFilter', 'Utmerket (80%+)')}</option>
              <option value="good">{t('patients.goodFilter', 'Bra (60-79%)')}</option>
              <option value="needs_attention">
                {t('patients.needsAttentionFilter', 'Trenger oppfølging (Under 60%)')}
              </option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="compliance_rate">
                {t('patients.complianceSort', 'Overholdelse')}
              </option>
              <option value="last_activity">{t('patients.lastActivity', 'Siste aktivitet')}</option>
              <option value="patient_name">{t('patients.name', 'Navn')}</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'DESC' ? (
                <ArrowDownRight className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Patients List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('patients.patientsWithProgram', 'Pasienter med treningsprogram')}
            </h3>
          </div>

          {complianceLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                {t('patients.loadingPatients', 'Laster pasienter...')}
              </p>
            </div>
          ) : filteredPatients.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.patientId}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handlePatientSelect(patient)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${getComplianceColor(patient.complianceRate)}`}
                      >
                        <span className="text-lg font-semibold">{patient.complianceRate}%</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{patient.patientName}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {patient.activeDaysThisWeek}/7{' '}
                            {t('patients.daysThisWeek', 'dager denne uken')}
                          </span>
                          {patient.recentAvgPain && (
                            <span className="flex items-center gap-1">
                              {getPainEmoji(parseFloat(patient.recentAvgPain))}
                              {t('patients.painLabel', 'Smerte:')} {patient.recentAvgPain}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t('patients.lastActive', 'Sist aktiv:')}{' '}
                            {patient.lastActivity
                              ? new Date(patient.lastActivity).toLocaleDateString('no-NO')
                              : t('patients.never', 'Aldri')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full ${getComplianceColor(patient.complianceRate)}`}
                      >
                        {patient.status?.label || 'Ukjent'}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-300" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {t('patients.noPatients', 'Ingen pasienter funnet')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('patients.noPatientsMatchSearch', 'Ingen pasienter matcher søkekriteriene')}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render patient view (single patient)
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/progress')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {t('patients.progressTitle', 'Pasientfremgang')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('patients.progressSubtitle', 'Detaljert oversikt over treningsoverholdelse')}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      {patientStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('exercises.totalExercises', 'Totale øvelser')}
                </p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {patientStats.summary?.totalCompletions || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('patients.activeDays', 'Aktive dager')}
                </p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {patientStats.summary?.activeDays || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('patients.currentStreak', 'Nåværende rekke')}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-semibold text-gray-900">
                    {patientStats.summary?.currentStreak || 0}
                  </p>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t('patients.days', 'dager')}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('patients.avgPain', 'Gj.snitt smerte')}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-semibold text-gray-900">
                    {patientStats.summary?.avgPain || '-'}
                  </p>
                  {patientStats.summary?.avgPain &&
                    getPainEmoji(parseFloat(patientStats.summary.avgPain))}
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Weekly Progress Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('exercises.weeklyProgress', 'Ukentlig fremgang')}
          </h3>
          {weeklyLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ProgressChart
              data={weeklyData.map((w) => ({
                date: w.weekStart,
                label: w.weekLabel,
                value: w.complianceRate,
                completed: w.activeDays >= 5,
              }))}
              metric="completion"
              period="week"
            />
          )}
        </div>

        {/* Pain Tracker */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('patients.painLevelOverTime', 'Smertenivå over tid')}
          </h3>
          {painLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : painData ? (
            <PainTracker
              data={painData.data}
              trend={painData.trend}
              currentAvg={painData.currentAvg}
            />
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('patients.noPainData', 'Ingen smertedata tilgjengelig')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Compliance Calendar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('patients.trainingCalendar', 'Treningskalender')}
        </h3>
        {dailyLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <ComplianceCalendar data={dailyData} />
        )}
      </div>

      {/* Prescriptions */}
      {patientStats?.prescriptions && patientStats.prescriptions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('patients.trainingPrescriptions', 'Treningsforskrivninger')}
          </h3>
          <div className="space-y-4">
            {patientStats.prescriptions.map((prescription) => (
              <div
                key={prescription.prescriptionId}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${
                        prescription.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {prescription.status === 'active'
                        ? t('patients.active', 'Aktiv')
                        : prescription.status}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {prescription.totalPrescribed} {t('patients.exercisesUnit', 'øvelser')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('patients.from', 'Fra')}{' '}
                    {new Date(prescription.startDate).toLocaleDateString('no-NO')}
                    {prescription.endDate &&
                      ` ${t('patients.to', 'til')} ${new Date(prescription.endDate).toLocaleDateString('no-NO')}`}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-semibold ${getComplianceColor(prescription.complianceRate).split(' ')[0]}`}
                  >
                    {prescription.complianceRate}%
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('patients.complianceLabel', 'overholdelse')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
