/**
 * CRM Overview Dashboard
 *
 * Displays key CRM metrics, pipeline preview, recent messages,
 * referrals, campaigns, automation status, and waitlist summary.
 * Extracted from CRM.jsx to keep parent under 500 lines.
 */

import {
  UserPlus,
  Users,
  Bell,
  Star,
  Target,
  MessageSquare,
  Gift,
  Send,
  Zap,
  ListChecks,
} from 'lucide-react';
import { useTranslation } from '../../i18n';

export default function CRMOverview({ overviewStats, setActiveModule }) {
  const { t } = useTranslation('crm');
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={UserPlus}
          label={t('newLeads', 'Nye Leads')}
          value={overviewStats.newLeads}
          color="purple"
          trend="+3 denne uken"
        />
        <StatCard
          icon={Users}
          label={t('activePatients', 'Aktive Pasienter')}
          value={overviewStats.activePatients}
          color="teal"
        />
        <StatCard
          icon={Bell}
          label={t('atRisk', 'I Faresonen')}
          value={overviewStats.atRiskPatients}
          color="red"
          alert
        />
        <StatCard
          icon={Star}
          label={t('npsScore', 'NPS Score')}
          value={overviewStats.avgNPS}
          color="yellow"
          suffix="%"
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Leads Pipeline Preview */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              {t('leadPipeline', 'Lead Pipeline')}
            </h3>
            <button
              onClick={() => setActiveModule('leads')}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              {t('viewAll', 'Se alle')} →
            </button>
          </div>
          <div className="space-y-2">
            <PipelineBar label={t('new', 'Nye')} count={5} total={12} color="blue" />
            <PipelineBar label={t('contacted', 'Kontaktet')} count={4} total={12} color="yellow" />
            <PipelineBar label={t('booked', 'Booket')} count={2} total={12} color="green" />
            <PipelineBar label={t('converted', 'Konvertert')} count={1} total={12} color="teal" />
          </div>
        </div>

        {/* Recent Communications */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-500" />
              {t('recentMessages', 'Siste Meldinger')}
            </h3>
            <button
              onClick={() => setActiveModule('communications')}
              className="text-sm text-green-600 hover:text-green-700"
            >
              {t('viewAll', 'Se alle')} →
            </button>
          </div>
          <div className="space-y-3">
            <MessagePreview
              name="Kari Nordmann"
              message="Takk for påminnelsen! Jeg booker time nå."
              time="10 min"
              type="inbound"
            />
            <MessagePreview
              name="Ole Hansen"
              message="Hei! Det er en stund siden sist..."
              time="2 timer"
              type="outbound"
            />
            <MessagePreview
              name="Anna Berg"
              message="Ja, tirsdag kl 14:00 passer fint!"
              time="3 timer"
              type="inbound"
            />
          </div>
        </div>

        {/* Pending Referrals */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-orange-500" />
              {t('pendingReferrals', 'Ventende Henvisninger')}
            </h3>
            <button
              onClick={() => setActiveModule('referrals')}
              className="text-sm text-orange-600 hover:text-orange-700"
            >
              {t('viewAll', 'Se alle')} →
            </button>
          </div>
          <div className="space-y-3">
            <ReferralPreview
              referrer="Per Olsen"
              referred="Lise Olsen"
              status="PENDING"
              reward="20% rabatt"
            />
            <ReferralPreview
              referrer="Eva Svendsen"
              referred="Martin Berg"
              status="BOOKED"
              reward="200 kr kreditt"
            />
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {overviewStats.pendingReferrals} {t('pendingRewards', 'ventende belønninger')}
            </p>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-pink-500" />
              {t('activeCampaigns', 'Aktive Kampanjer')}
            </h3>
            <button
              onClick={() => setActiveModule('campaigns')}
              className="text-sm text-pink-600 hover:text-pink-700"
            >
              {t('viewAll', 'Se alle')} →
            </button>
          </div>
          <div className="space-y-3">
            <CampaignPreview name="Vi savner deg" type="REACTIVATION" sent={127} responded={23} />
            <CampaignPreview name="Bursdag Januar" type="BIRTHDAY" sent={45} responded={12} />
          </div>
        </div>

        {/* Automation Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500" />
              {t('automation', 'Automatisering')}
            </h3>
            <button
              onClick={() => setActiveModule('workflows')}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              {t('manage', 'Administrer')} →
            </button>
          </div>
          <div className="space-y-3">
            <WorkflowStatus name="Velkomstsekvens" status="active" runsToday={3} />
            <WorkflowStatus name="30-dagers sjekk" status="active" runsToday={7} />
            <WorkflowStatus name="Bursdagshilsen" status="active" runsToday={2} />
          </div>
        </div>

        {/* Waitlist */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-amber-500" />
              {t('waitlist', 'Venteliste')}
            </h3>
            <button
              onClick={() => setActiveModule('waitlist')}
              className="text-sm text-amber-600 hover:text-amber-700"
            >
              {t('viewAll', 'Se alle')} →
            </button>
          </div>
          <div className="text-center py-4">
            <p className="text-3xl font-bold text-amber-600">{overviewStats.waitlistCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('patientsWaiting', 'pasienter venter')}
            </p>
          </div>
          <button className="w-full mt-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100">
            {t('checkAvailableSlots', 'Sjekk ledige tider')}
          </button>
        </div>
      </div>

      {/* At-Risk Patients Alert */}
      {overviewStats.atRiskPatients > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Bell className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">
                {overviewStats.atRiskPatients} {t('patientsAtRisk', 'pasienter i faresonen')}
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {t(
                  'atRiskDescription',
                  'Disse pasientene har ikke vært innom på over 6 uker. Vurder å sende en påminnelse.'
                )}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setActiveModule('lifecycle')}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                >
                  {t('viewPatients', 'Se pasienter')}
                </button>
                <button className="px-3 py-1.5 bg-white text-red-700 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-50">
                  {t('sendCampaign', 'Send kampanje')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components

function StatCard({ icon: Icon, label, value, color, suffix = '', trend, alert }) {
  return (
    <div
      className={`bg-white rounded-xl border ${alert ? 'border-red-200' : 'border-gray-200'} p-4`}
    >
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg bg-${color}-50`}>
          <Icon className={`w-5 h-5 text-${color}-500`} />
        </div>
        {alert && (
          <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">!</span>
        )}
      </div>
      <p className={`text-2xl font-bold mt-3 text-${alert ? 'red' : 'gray'}-900`}>
        {value}
        {suffix}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
    </div>
  );
}

function PipelineBar({ label, count, total, color }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-20">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full bg-${color}-500`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-6">{count}</span>
    </div>
  );
}

function MessagePreview({ name, message, time, type }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-2 h-2 rounded-full mt-2 ${type === 'inbound' ? 'bg-green-500' : 'bg-blue-500'}`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{message}</p>
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-300">{time}</span>
    </div>
  );
}

function ReferralPreview({ referrer, referred, status, reward }) {
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    BOOKED: 'bg-blue-100 text-blue-700',
    CONVERTED: 'bg-green-100 text-green-700',
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900">{referred}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">fra {referrer}</p>
      </div>
      <div className="text-right">
        <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[status]}`}>{status}</span>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{reward}</p>
      </div>
    </div>
  );
}

function CampaignPreview({ name, type, sent, responded }) {
  const responseRate = sent > 0 ? Math.round((responded / sent) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">{name}</p>
        <span className="text-xs text-gray-500 dark:text-gray-400">{type}</span>
      </div>
      <div className="flex items-center gap-4 mt-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">Sendt: {sent}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">Svart: {responded}</span>
        <span className="text-xs text-green-600">{responseRate}% respons</span>
      </div>
    </div>
  );
}

function WorkflowStatus({ name, status, runsToday }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}
        />
        <p className="text-sm text-gray-700">{name}</p>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">{runsToday} i dag</span>
    </div>
  );
}
