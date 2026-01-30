/**
 * KPI Dashboard
 * Real-time practice metrics and analytics
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { kpiAPI } from '../services/api'
import { TrendingUp, TrendingDown, Users, Calendar, MapPin, Activity } from 'lucide-react'
import { useTranslation } from '../i18n'

export default function KPI() {
  const { t, lang } = useTranslation('financial')
  const [dateRange, setDateRange] = useState('30') // days

  // Calculate date range
  const endDate = new Date().toISOString()
  const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString()

  // Fetch detailed KPI data
  const { data: kpiData, isLoading } = useQuery({
    queryKey: ['kpi-detailed', startDate, endDate],
    queryFn: () => kpiAPI.getDetailedKPIs(startDate, endDate),
  })

  const metrics = kpiData?.data?.data

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">{t('kpiDashboard')}</h1>
        <p className="text-gray-600">{t('loadingMetrics')}</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('kpiDashboard')}</h1>
          <p className="text-gray-600">{t('practiceMetrics')}</p>
        </div>

        {/* Date Range Selector */}
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="7">{t('last7days')}</option>
          <option value="30">{t('last30days')}</option>
          <option value="90">{t('last90days')}</option>
          <option value="365">{t('lastYearPeriod')}</option>
        </select>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rebooking Rate */}
        <MetricCard
          title={t('rebookingRate')}
          value={`${metrics?.overview?.rebooking_rate || 0}%`}
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          subtitle={t('ofPatients').replace('{rebooked}', metrics?.overview?.rebooked_patients || 0).replace('{total}', metrics?.overview?.total_patients || 0)}
          trend={metrics?.overview?.rebooking_rate >= 75 ? 'up' : 'down'}
        />

        {/* Total Patients */}
        <MetricCard
          title={t('totalPatients')}
          value={metrics?.overview?.total_patients || 0}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          subtitle={t('inSelectedPeriod')}
        />

        {/* Categories */}
        <MetricCard
          title={t('patientCategories')}
          value={metrics?.by_category?.length || 0}
          icon={<Activity className="w-6 h-6 text-purple-600" />}
          subtitle={t('activeCategories')}
        />

        {/* Geographic Areas */}
        <MetricCard
          title={t('geographicAreas')}
          value={metrics?.by_geography?.length || 0}
          icon={<MapPin className="w-6 h-6 text-orange-600" />}
          subtitle={t('serviceRegions')}
        />
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">{t('patientCategoryBreakdown')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('category')}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{t('patients')}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{t('visits')}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{t('avgVisits')}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{t('rebookingRate')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics?.by_category?.map((category, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {category.category || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {category.patient_count}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {category.total_visits}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {parseFloat(category.avg_visits_per_patient).toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={`font-semibold ${
                      parseFloat(category.rebooking_rate) >= 75 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {parseFloat(category.rebooking_rate).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">{t('geographicDistribution')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics?.by_geography?.map((geo, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{geo.location_type || 'Unknown'}</h3>
                <MapPin className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-1">{geo.patient_count}</p>
              <p className="text-sm text-gray-600">{t('totalVisits').replace('{count}', geo.total_visits)}</p>
              <p className="text-sm text-gray-500">
                {t('avgVisitsPerPatient').replace('{avg}', parseFloat(geo.avg_visits_per_patient).toFixed(1))}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Treatment Type Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">{t('treatmentTypeAnalysis')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('treatmentType')}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{t('patients')}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{t('treatments')}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{t('avgPerPatient')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics?.by_treatment_type?.map((treatment, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {treatment.treatment_type || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {treatment.patient_count}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {treatment.treatment_count}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">
                    {parseFloat(treatment.avg_treatments_per_patient).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Follow-up Status */}
      {metrics?.follow_up_status && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">{t('followUpStatus')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(metrics.follow_up_status).map(([method, count]) => (
              <div key={method} className="border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">{method}</p>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referral Sources */}
      {metrics?.by_referral_source && metrics.by_referral_source.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">{t('referralSources')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('source')}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{t('patients')}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">{t('percentage')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {metrics.by_referral_source.map((source, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {source.referral_source || t('directSource')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {source.patient_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {((source.patient_count / metrics.overview.total_patients) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Metric Card Component
function MetricCard({ title, value, icon, subtitle, trend }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {trend && (
          trend === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )
        )}
      </div>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  )
}
