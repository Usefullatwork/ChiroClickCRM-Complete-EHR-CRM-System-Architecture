/**
 * CRM Hub - Central Customer Relationship Management Dashboard
 *
 * Features:
 * - Lead Management & Pipeline
 * - Patient Lifecycle Tracking
 * - Referral Program
 * - NPS/Satisfaction Surveys
 * - Communication History
 * - Campaign Management
 * - Automated Workflows
 * - Retention Analytics
 * - Waitlist Management
 * - Exercise PDF Templates
 */

import { useState, useEffect } from 'react';
import { crmAPI } from '../services/api';
import { useTranslation } from '../i18n';
import {
  Users,
  UserPlus,
  Heart,
  MessageSquare,
  BarChart3,
  Settings,
  Gift,
  Star,
  Clock,
  Mail,
  Workflow,
  TrendingUp,
  Calendar,
  FileText,
  Send,
  Filter,
  Search,
  Plus,
  ChevronRight,
  Bell,
  Target,
  Zap,
  ListChecks,
  Menu,
  X
} from 'lucide-react';

// Import CRM sub-components
import LeadManagement from '../components/crm/LeadManagement';
import PatientLifecycle from '../components/crm/PatientLifecycle';
import ReferralProgram from '../components/crm/ReferralProgram';
import SurveyManager from '../components/crm/SurveyManager';
import CommunicationHistory from '../components/crm/CommunicationHistory';
import CampaignManager from '../components/crm/CampaignManager';
import WorkflowBuilder from '../components/crm/WorkflowBuilder';
import RetentionDashboard from '../components/crm/RetentionDashboard';
import WaitlistManager from '../components/crm/WaitlistManager';
import ExerciseTemplates from '../components/crm/ExerciseTemplates';
import CRMSettings from '../components/crm/CRMSettings';

const CRM_MODULES = [
  { id: 'overview', nameKey: 'overview', icon: BarChart3, color: 'blue', descKey: 'overviewDesc' },
  { id: 'leads', nameKey: 'leads', icon: UserPlus, color: 'purple', descKey: 'leadsDesc' },
  { id: 'lifecycle', nameKey: 'patientLifecycle', icon: Users, color: 'teal', descKey: 'lifecycleDesc' },
  { id: 'referrals', nameKey: 'referrals', icon: Gift, color: 'orange', descKey: 'referralsDesc' },
  { id: 'surveys', nameKey: 'surveys', icon: Star, color: 'yellow', descKey: 'surveysDesc' },
  { id: 'communications', nameKey: 'communications', icon: MessageSquare, color: 'green', descKey: 'communicationsDesc' },
  { id: 'campaigns', nameKey: 'campaigns', icon: Send, color: 'pink', descKey: 'campaignsDesc' },
  { id: 'workflows', nameKey: 'automation', icon: Workflow, color: 'indigo', descKey: 'automationDesc' },
  { id: 'retention', nameKey: 'retention', icon: TrendingUp, color: 'emerald', descKey: 'retentionDesc' },
  { id: 'waitlist', nameKey: 'waitlist', icon: Clock, color: 'amber', descKey: 'waitlistDesc' },
  { id: 'exercises', nameKey: 'exerciseTemplates', icon: FileText, color: 'cyan', descKey: 'exerciseTemplatesDesc' },
  { id: 'settings', nameKey: 'settings', icon: Settings, color: 'gray', descKey: 'settingsDesc' },
];

export default function CRM() {
  const { t, lang } = useTranslation('crm');
  const [activeModule, setActiveModule] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overviewStats, setOverviewStats] = useState({
    newLeads: 0,
    activePatients: 0,
    atRiskPatients: 0,
    pendingReferrals: 0,
    avgNPS: 0,
    reactivationRate: 0,
    openCampaigns: 0,
    waitlistCount: 0
  });

  // Fetch CRM overview data
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const response = await crmAPI.getOverview();
        if (response.data) {
          setOverviewStats({
            newLeads: response.data.newLeads || 0,
            activePatients: response.data.activePatients || 0,
            atRiskPatients: response.data.atRiskPatients || 0,
            pendingReferrals: response.data.pendingReferrals || 0,
            avgNPS: response.data.avgNPS || 0,
            reactivationRate: 0, // Not tracked yet
            openCampaigns: 0, // Not tracked yet
            waitlistCount: response.data.waitlistCount || 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch CRM overview:', error);
        // Keep mock data on error for development
        setOverviewStats({
          newLeads: 12,
          activePatients: 847,
          atRiskPatients: 34,
          pendingReferrals: 8,
          avgNPS: 72,
          reactivationRate: 23,
          openCampaigns: 3,
          waitlistCount: 15
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'leads':
        return <LeadManagement language={lang} />;
      case 'lifecycle':
        return <PatientLifecycle language={lang} />;
      case 'referrals':
        return <ReferralProgram language={lang} />;
      case 'surveys':
        return <SurveyManager language={lang} />;
      case 'communications':
        return <CommunicationHistory language={lang} />;
      case 'campaigns':
        return <CampaignManager language={lang} />;
      case 'workflows':
        return <WorkflowBuilder language={lang} />;
      case 'retention':
        return <RetentionDashboard language={lang} />;
      case 'waitlist':
        return <WaitlistManager language={lang} />;
      case 'exercises':
        return <ExerciseTemplates language={lang} />;
      case 'settings':
        return <CRMSettings language={lang} />;
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={UserPlus}
          label={t('newLeads')}
          value={overviewStats.newLeads}
          color="purple"
          trend={`+3 ${t('thisWeek')}`}
        />
        <StatCard
          icon={Users}
          label={t('activePatients')}
          value={overviewStats.activePatients}
          color="teal"
        />
        <StatCard
          icon={Bell}
          label={t('atRisk')}
          value={overviewStats.atRiskPatients}
          color="red"
          alert
        />
        <StatCard
          icon={Star}
          label={t('npsScore')}
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
              {t('leadPipeline')}
            </h3>
            <button
              onClick={() => setActiveModule('leads')}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              {t('viewAll')} →
            </button>
          </div>
          <div className="space-y-2">
            <PipelineBar label={t('new')} count={5} total={12} color="blue" />
            <PipelineBar label={t('contacted')} count={4} total={12} color="yellow" />
            <PipelineBar label={t('booked')} count={2} total={12} color="green" />
            <PipelineBar label={t('converted')} count={1} total={12} color="teal" />
          </div>
        </div>

        {/* Recent Communications */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-500" />
              {t('recentMessages')}
            </h3>
            <button
              onClick={() => setActiveModule('communications')}
              className="text-sm text-green-600 hover:text-green-700"
            >
              {t('viewAll')} →
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
              {t('pendingReferrals')}
            </h3>
            <button
              onClick={() => setActiveModule('referrals')}
              className="text-sm text-orange-600 hover:text-orange-700"
            >
              {t('viewAll')} →
            </button>
          </div>
          <div className="space-y-3">
            <ReferralPreview
              referrer="Per Olsen"
              referred="Lise Olsen"
              status="PENDING"
              reward="20% rabatt"
              t={t}
            />
            <ReferralPreview
              referrer="Eva Svendsen"
              referred="Martin Berg"
              status="BOOKED"
              reward="200 kr kreditt"
              t={t}
            />
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {overviewStats.pendingReferrals} {t('pendingRewards')}
            </p>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-pink-500" />
              {t('activeCampaigns')}
            </h3>
            <button
              onClick={() => setActiveModule('campaigns')}
              className="text-sm text-pink-600 hover:text-pink-700"
            >
              {t('viewAll')} →
            </button>
          </div>
          <div className="space-y-3">
            <CampaignPreview
              name="Vi savner deg"
              type="REACTIVATION"
              sent={127}
              responded={23}
              t={t}
            />
            <CampaignPreview
              name="Bursdag Januar"
              type="BIRTHDAY"
              sent={45}
              responded={12}
              t={t}
            />
          </div>
        </div>

        {/* Automation Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500" />
              {t('automation')}
            </h3>
            <button
              onClick={() => setActiveModule('workflows')}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              {t('manage')} →
            </button>
          </div>
          <div className="space-y-3">
            <WorkflowStatus
              name="Velkomstsekvens"
              status="active"
              runsToday={3}
              t={t}
            />
            <WorkflowStatus
              name="30-dagers sjekk"
              status="active"
              runsToday={7}
              t={t}
            />
            <WorkflowStatus
              name="Bursdagshilsen"
              status="active"
              runsToday={2}
              t={t}
            />
          </div>
        </div>

        {/* Waitlist */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-amber-500" />
              {t('waitlist')}
            </h3>
            <button
              onClick={() => setActiveModule('waitlist')}
              className="text-sm text-amber-600 hover:text-amber-700"
            >
              {t('viewAll')} →
            </button>
          </div>
          <div className="text-center py-4">
            <p className="text-3xl font-bold text-amber-600">{overviewStats.waitlistCount}</p>
            <p className="text-sm text-gray-500">{t('patientsWaiting')}</p>
          </div>
          <button className="w-full mt-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100">
            {t('checkAvailableSlots')}
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
                {overviewStats.atRiskPatients} {t('patientsAtRisk')}
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {t('atRiskDescription')}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setActiveModule('lifecycle')}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                >
                  {t('viewPatients')}
                </button>
                <button className="px-3 py-1.5 bg-white text-red-700 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-50">
                  {t('sendCampaign')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                {t('customerRelationshipManagement')}
              </h1>
              <p className="text-sm text-gray-500 mt-1 hidden sm:block">
                {t('crmSubtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('newLead')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex relative">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <div className={`
          fixed lg:relative z-30 lg:z-auto
          w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="p-4 space-y-1">
            {CRM_MODULES.map((module) => {
              const Icon = module.icon;
              const isActive = activeModule === module.id;

              return (
                <button
                  key={module.id}
                  onClick={() => {
                    setActiveModule(module.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                    ${isActive
                      ? `bg-${module.color}-50 text-${module.color}-700 border border-${module.color}-200`
                      : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? `text-${module.color}-500` : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">{t(module.nameKey)}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 w-full lg:w-auto">
          {renderModuleContent()}
        </div>
      </div>
    </div>
  );
}

// Helper Components

function StatCard({ icon: Icon, label, value, color, suffix = '', trend, alert }) {
  return (
    <div className={`bg-white rounded-xl border ${alert ? 'border-red-200' : 'border-gray-200'} p-4`}>
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg bg-${color}-50`}>
          <Icon className={`w-5 h-5 text-${color}-500`} />
        </div>
        {alert && <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">!</span>}
      </div>
      <p className={`text-2xl font-bold mt-3 text-${alert ? 'red' : 'gray'}-900`}>
        {value}{suffix}
      </p>
      <p className="text-sm text-gray-500">{label}</p>
      {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
    </div>
  );
}

function PipelineBar({ label, count, total, color }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full bg-${color}-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 w-6">{count}</span>
    </div>
  );
}

function MessagePreview({ name, message, time, type }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-2 h-2 rounded-full mt-2 ${type === 'inbound' ? 'bg-green-500' : 'bg-blue-500'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-500 truncate">{message}</p>
      </div>
      <span className="text-xs text-gray-400">{time}</span>
    </div>
  );
}

function ReferralPreview({ referrer, referred, status, reward, t }) {
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    BOOKED: 'bg-blue-100 text-blue-700',
    CONVERTED: 'bg-green-100 text-green-700'
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900">{referred}</p>
        <p className="text-xs text-gray-500">{t('from')} {referrer}</p>
      </div>
      <div className="text-right">
        <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[status]}`}>
          {status}
        </span>
        <p className="text-xs text-gray-500 mt-1">{reward}</p>
      </div>
    </div>
  );
}

function CampaignPreview({ name, type, sent, responded, t }) {
  const responseRate = sent > 0 ? Math.round((responded / sent) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">{name}</p>
        <span className="text-xs text-gray-500">{type}</span>
      </div>
      <div className="flex items-center gap-4 mt-1">
        <span className="text-xs text-gray-500">{t('sentLabel')}: {sent}</span>
        <span className="text-xs text-gray-500">{t('respondedLabel')}: {responded}</span>
        <span className="text-xs text-green-600">{responseRate}% {t('responseRate')}</span>
      </div>
    </div>
  );
}

function WorkflowStatus({ name, status, runsToday, t }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
        <p className="text-sm text-gray-700">{name}</p>
      </div>
      <span className="text-xs text-gray-500">{runsToday} {t('today')}</span>
    </div>
  );
}
