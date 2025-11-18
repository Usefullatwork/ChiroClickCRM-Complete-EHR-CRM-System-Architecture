/**
 * KPI Dashboard
 * Real-time practice metrics and analytics
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { kpiAPI } from '../services/api'
import { TrendingUp, TrendingDown, Users, Calendar, MapPin, Activity } from 'lucide-react'

export default function KPI() {
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
        <h1 className="text-3xl font-bold mb-6">KPI Dashboard</h1>
        <p className="text-gray-600">Loading metrics...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">KPI Dashboard</h1>
          <p className="text-gray-600">Practice performance metrics and analytics</p>
        </div>

        {/* Date Range Selector */}
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rebooking Rate */}
        <MetricCard
          title="Rebooking Rate"
          value={`${metrics?.overview?.rebooking_rate || 0}%`}
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          subtitle={`${metrics?.overview?.rebooked_patients || 0} of ${metrics?.overview?.total_patients || 0} patients`}
          trend={metrics?.overview?.rebooking_rate >= 75 ? 'up' : 'down'}
        />

        {/* Total Patients */}
        <MetricCard
          title="Total Patients"
          value={metrics?.overview?.total_patients || 0}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          subtitle="In selected period"
        />

        {/* Categories */}
        <MetricCard
          title="Patient Categories"
          value={metrics?.by_category?.length || 0}
          icon={<Activity className="w-6 h-6 text-purple-600" />}
          subtitle="Active categories"
        />

        {/* Geographic Areas */}
        <MetricCard
          title="Geographic Areas"
          value={metrics?.by_geography?.length || 0}
          icon={<MapPin className="w-6 h-6 text-orange-600" />}
          subtitle="Service regions"
        />
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Patient Category Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Patients</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Visits</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Avg Visits</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Rebooking Rate</th>
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
        <h2 className="text-xl font-bold mb-4">Geographic Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics?.by_geography?.map((geo, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{geo.location_type || 'Unknown'}</h3>
                <MapPin className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-1">{geo.patient_count}</p>
              <p className="text-sm text-gray-600">{geo.total_visits} total visits</p>
              <p className="text-sm text-gray-500">
                Avg {parseFloat(geo.avg_visits_per_patient).toFixed(1)} visits/patient
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Treatment Type Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Treatment Type Analysis</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Treatment Type</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Patients</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Treatments</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Avg per Patient</th>
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
          <h2 className="text-xl font-bold mb-4">Follow-up Status</h2>
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
          <h2 className="text-xl font-bold mb-4">Referral Sources</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Source</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Patients</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {metrics.by_referral_source.map((source, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {source.referral_source || 'Direct'}
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
