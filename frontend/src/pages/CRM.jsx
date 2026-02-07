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
import { crmAPI, patientsAPI } from '../services/api';
import logger from '../utils/logger';
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
  {
    id: 'overview',
    name: { no: 'Oversikt', en: 'Overview' },
    icon: BarChart3,
    color: 'blue',
    description: { no: 'CRM dashbord og nøkkeltall', en: 'CRM dashboard and key metrics' },
  },
  {
    id: 'leads',
    name: { no: 'Leads', en: 'Leads' },
    icon: UserPlus,
    color: 'purple',
    description: { no: 'Administrer potensielle pasienter', en: 'Manage potential patients' },
  },
  {
    id: 'lifecycle',
    name: { no: 'Pasientlivssyklus', en: 'Patient Lifecycle' },
    icon: Users,
    color: 'teal',
    description: {
      no: 'Spor pasientstatus og engasjement',
      en: 'Track patient status and engagement',
    },
  },
  {
    id: 'referrals',
    name: { no: 'Henvisninger', en: 'Referrals' },
    icon: Gift,
    color: 'orange',
    description: { no: 'Henvisningsprogram og belønninger', en: 'Referral program and rewards' },
  },
  {
    id: 'surveys',
    name: { no: 'Undersøkelser', en: 'Surveys' },
    icon: Star,
    color: 'yellow',
    description: { no: 'NPS og tilfredshetsmålinger', en: 'NPS and satisfaction tracking' },
  },
  {
    id: 'communications',
    name: { no: 'Kommunikasjon', en: 'Communications' },
    icon: MessageSquare,
    color: 'green',
    description: { no: 'Meldingshistorikk og samtaler', en: 'Message history and conversations' },
  },
  {
    id: 'campaigns',
    name: { no: 'Kampanjer', en: 'Campaigns' },
    icon: Send,
    color: 'pink',
    description: { no: 'Markedsføring og tilbakekalling', en: 'Marketing and recall campaigns' },
  },
  {
    id: 'workflows',
    name: { no: 'Automatisering', en: 'Automation' },
    icon: Workflow,
    color: 'indigo',
    description: { no: 'Automatiske arbeidsflyter', en: 'Automated workflows' },
  },
  {
    id: 'retention',
    name: { no: 'Retensjon', en: 'Retention' },
    icon: TrendingUp,
    color: 'emerald',
    description: { no: 'Retensjonsanalyse og churn', en: 'Retention analysis and churn' },
  },
  {
    id: 'waitlist',
    name: { no: 'Venteliste', en: 'Waitlist' },
    icon: Clock,
    color: 'amber',
    description: { no: 'Administrer avbestillingsventeliste', en: 'Manage cancellation waitlist' },
  },
  {
    id: 'exercises',
    name: { no: 'Øvelsesmaler', en: 'Exercise Templates' },
    icon: FileText,
    color: 'cyan',
    description: { no: 'Send øvelsesPDF-er til pasienter', en: 'Send exercise PDFs to patients' },
  },
  {
    id: 'settings',
    name: { no: 'Innstillinger', en: 'Settings' },
    icon: Settings,
    color: 'gray',
    description: { no: 'CRM-innstillinger og frekvenser', en: 'CRM settings and frequencies' },
  },
];

export default function CRM() {
  const [activeModule, setActiveModule] = useState('overview');
  const { lang: language, setLang: setLanguage } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [overviewStats, setOverviewStats] = useState({
    newLeads: 0,
    activePatients: 0,
    atRiskPatients: 0,
    pendingReferrals: 0,
    avgNPS: 0,
    reactivationRate: 0,
    openCampaigns: 0,
    waitlistCount: 0,
  });

  const [waitlistData, setWaitlistData] = useState([]);
  const [patientsList, setPatientsList] = useState([]);

  const t = (obj) => obj[language] || obj.en;

  // Fetch waitlist data when module is active
  useEffect(() => {
    if (activeModule !== 'waitlist') return;
    const fetchWaitlist = async () => {
      try {
        const [wRes, pRes] = await Promise.all([
          crmAPI.getWaitlist(),
          patientsAPI.getAll({ limit: 1000 }),
        ]);
        const entries = wRes.data?.entries || wRes.data || [];
        setWaitlistData(
          entries.map((e) => ({
            id: e.id,
            patientId: e.patient_id,
            priority: (e.priority || 'normal').toLowerCase(),
            timePreferences: e.preferred_days || ['any'],
            dayPreferences: ['any'],
            notes: e.notes || '',
            notifyBySMS: true,
            notifyByEmail: false,
            dateAdded: e.added_at || e.created_at,
            status: (e.status || 'pending').toLowerCase(),
            notificationsSent: e.notification_count || 0,
          }))
        );
        const patients = pRes.data?.patients || pRes.data || [];
        setPatientsList(patients);
      } catch (err) {
        logger.error('Failed to fetch waitlist:', err);
      }
    };
    fetchWaitlist();
  }, [activeModule]);

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
            waitlistCount: response.data.waitlistCount || 0,
          });
        }
      } catch (error) {
        logger.error('Failed to fetch CRM overview:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'leads':
        return <LeadManagement language={language} />;
      case 'lifecycle':
        return <PatientLifecycle language={language} />;
      case 'referrals':
        return <ReferralProgram language={language} />;
      case 'surveys':
        return <SurveyManager language={language} />;
      case 'communications':
        return <CommunicationHistory language={language} />;
      case 'campaigns':
        return <CampaignManager language={language} />;
      case 'workflows':
        return <WorkflowBuilder language={language} />;
      case 'retention':
        return <RetentionDashboard language={language} />;
      case 'waitlist':
        return (
          <WaitlistManager
            language={language}
            waitlist={waitlistData}
            patients={patientsList}
            onAdd={async (entry) => {
              try {
                await crmAPI.addToWaitlist({
                  patient_id: entry.patientId,
                  priority: entry.priority?.toUpperCase() || 'NORMAL',
                  notes: entry.notes,
                  preferred_days: entry.timePreferences,
                });
                const res = await crmAPI.getWaitlist();
                const entries = res.data?.entries || res.data || [];
                setWaitlistData(
                  entries.map((e) => ({
                    id: e.id,
                    patientId: e.patient_id,
                    priority: (e.priority || 'normal').toLowerCase(),
                    timePreferences: e.preferred_days || ['any'],
                    dayPreferences: ['any'],
                    notes: e.notes || '',
                    notifyBySMS: true,
                    notifyByEmail: false,
                    dateAdded: e.added_at || e.created_at,
                    status: (e.status || 'pending').toLowerCase(),
                    notificationsSent: e.notification_count || 0,
                  }))
                );
              } catch (err) {
                logger.error('Failed to add to waitlist:', err);
              }
            }}
            onRemove={async (id) => {
              try {
                await crmAPI.updateWaitlistEntry(id, { status: 'CANCELLED' });
                setWaitlistData((prev) => prev.filter((e) => e.id !== id));
              } catch (err) {
                logger.error('Failed to remove from waitlist:', err);
              }
            }}
            onNotify={async (entry, message) => {
              try {
                await crmAPI.notifyWaitlist({ entryId: entry.id });
                setWaitlistData((prev) =>
                  prev.map((e) =>
                    e.id === entry.id ? { ...e, notificationsSent: e.notificationsSent + 1 } : e
                  )
                );
              } catch (err) {
                logger.error('Failed to notify:', err);
              }
            }}
          />
        );
      case 'exercises':
        return <ExerciseTemplates language={language} />;
      case 'settings':
        return <CRMSettings language={language} />;
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
          label={t({ no: 'Nye Leads', en: 'New Leads' })}
          value={overviewStats.newLeads}
          color="purple"
          trend="+3 denne uken"
        />
        <StatCard
          icon={Users}
          label={t({ no: 'Aktive Pasienter', en: 'Active Patients' })}
          value={overviewStats.activePatients}
          color="teal"
        />
        <StatCard
          icon={Bell}
          label={t({ no: 'I Faresonen', en: 'At Risk' })}
          value={overviewStats.atRiskPatients}
          color="red"
          alert
        />
        <StatCard
          icon={Star}
          label={t({ no: 'NPS Score', en: 'NPS Score' })}
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
              {t({ no: 'Lead Pipeline', en: 'Lead Pipeline' })}
            </h3>
            <button
              onClick={() => setActiveModule('leads')}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              {t({ no: 'Se alle', en: 'View all' })} →
            </button>
          </div>
          <div className="space-y-2">
            <PipelineBar label={t({ no: 'Nye', en: 'New' })} count={5} total={12} color="blue" />
            <PipelineBar
              label={t({ no: 'Kontaktet', en: 'Contacted' })}
              count={4}
              total={12}
              color="yellow"
            />
            <PipelineBar
              label={t({ no: 'Booket', en: 'Booked' })}
              count={2}
              total={12}
              color="green"
            />
            <PipelineBar
              label={t({ no: 'Konvertert', en: 'Converted' })}
              count={1}
              total={12}
              color="teal"
            />
          </div>
        </div>

        {/* Recent Communications */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-500" />
              {t({ no: 'Siste Meldinger', en: 'Recent Messages' })}
            </h3>
            <button
              onClick={() => setActiveModule('communications')}
              className="text-sm text-green-600 hover:text-green-700"
            >
              {t({ no: 'Se alle', en: 'View all' })} →
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
              {t({ no: 'Ventende Henvisninger', en: 'Pending Referrals' })}
            </h3>
            <button
              onClick={() => setActiveModule('referrals')}
              className="text-sm text-orange-600 hover:text-orange-700"
            >
              {t({ no: 'Se alle', en: 'View all' })} →
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
            <p className="text-sm text-gray-500">
              {overviewStats.pendingReferrals}{' '}
              {t({ no: 'ventende belønninger', en: 'pending rewards' })}
            </p>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-pink-500" />
              {t({ no: 'Aktive Kampanjer', en: 'Active Campaigns' })}
            </h3>
            <button
              onClick={() => setActiveModule('campaigns')}
              className="text-sm text-pink-600 hover:text-pink-700"
            >
              {t({ no: 'Se alle', en: 'View all' })} →
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
              {t({ no: 'Automatisering', en: 'Automation' })}
            </h3>
            <button
              onClick={() => setActiveModule('workflows')}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              {t({ no: 'Administrer', en: 'Manage' })} →
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
              {t({ no: 'Venteliste', en: 'Waitlist' })}
            </h3>
            <button
              onClick={() => setActiveModule('waitlist')}
              className="text-sm text-amber-600 hover:text-amber-700"
            >
              {t({ no: 'Se alle', en: 'View all' })} →
            </button>
          </div>
          <div className="text-center py-4">
            <p className="text-3xl font-bold text-amber-600">{overviewStats.waitlistCount}</p>
            <p className="text-sm text-gray-500">
              {t({ no: 'pasienter venter', en: 'patients waiting' })}
            </p>
          </div>
          <button className="w-full mt-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100">
            {t({ no: 'Sjekk ledige tider', en: 'Check available slots' })}
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
                {overviewStats.atRiskPatients}{' '}
                {t({ no: 'pasienter i faresonen', en: 'patients at risk' })}
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {t({
                  no: 'Disse pasientene har ikke vært innom på over 6 uker. Vurder å sende en påminnelse.',
                  en: "These patients haven't visited in over 6 weeks. Consider sending a reminder.",
                })}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setActiveModule('lifecycle')}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                >
                  {t({ no: 'Se pasienter', en: 'View patients' })}
                </button>
                <button className="px-3 py-1.5 bg-white text-red-700 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-50">
                  {t({ no: 'Send kampanje', en: 'Send campaign' })}
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
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t({ no: 'Kunderelasjonshåndtering', en: 'Customer Relationship Management' })}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {t({
                no: 'Administrer pasienter, leads, kampanjer og kommunikasjon',
                en: 'Manage patients, leads, campaigns and communication',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLanguage(language === 'no' ? 'en' : 'no')}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {language === 'no' ? 'EN' : 'NO'}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              {t({ no: 'Ny Lead', en: 'New Lead' })}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-1">
            {CRM_MODULES.map((module) => {
              const Icon = module.icon;
              const isActive = activeModule === module.id;

              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                    ${
                      isActive
                        ? `bg-${module.color}-50 text-${module.color}-700 border border-${module.color}-200`
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? `text-${module.color}-500` : 'text-gray-400'}`}
                  />
                  <span className="text-sm font-medium">{t(module.name)}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">{renderModuleContent()}</div>
      </div>
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
        <p className="text-xs text-gray-500 truncate">{message}</p>
      </div>
      <span className="text-xs text-gray-400">{time}</span>
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
        <p className="text-xs text-gray-500">fra {referrer}</p>
      </div>
      <div className="text-right">
        <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[status]}`}>{status}</span>
        <p className="text-xs text-gray-500 mt-1">{reward}</p>
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
        <span className="text-xs text-gray-500">{type}</span>
      </div>
      <div className="flex items-center gap-4 mt-1">
        <span className="text-xs text-gray-500">Sendt: {sent}</span>
        <span className="text-xs text-gray-500">Svart: {responded}</span>
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
      <span className="text-xs text-gray-500">{runsToday} i dag</span>
    </div>
  );
}
