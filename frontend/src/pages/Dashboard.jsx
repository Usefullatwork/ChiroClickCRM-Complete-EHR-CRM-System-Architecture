import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  CheckCircle2,
  TrendingUp,
  FileText,
  MessageSquare,
  Clock,
  ArrowRight,
  X,
  ChevronDown,
  ChevronUp,
  Bell,
  Brain,
  AlertCircle,
  Mail,
  CreditCard,
  Activity,
  UserPlus,
  Keyboard,
  Search,
} from 'lucide-react';
import { dashboardAPI, appointmentsAPI, followUpsAPI } from '../services/api';
import {
  useTranslation,
  formatDateWithWeekday,
  formatDateShort,
  formatTime as i18nFormatTime,
} from '../i18n';
import toast from '../utils/toast';
import {
  StatsGridSkeleton,
  AppointmentsListSkeleton,
  ListSkeleton,
} from '../components/ui/Skeleton';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import RecallDashboard from '../components/recall/RecallDashboard';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, lang } = useTranslation('dashboard');
  const [showRecall, setShowRecall] = useState(false);
  const [showActivity, setShowActivity] = useState(true);

  // ─── Data queries ──────────────────────────────────────────

  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardAPI.getStats(),
  });

  const {
    data: appointmentsResponse,
    isLoading: appointmentsLoading,
    refetch: refetchAppointments,
  } = useQuery({
    queryKey: ['today-appointments'],
    queryFn: () => dashboardAPI.getTodayAppointments(),
  });

  const { data: followUpPatientsResponse, isLoading: followUpLoading } = useQuery({
    queryKey: ['patients-needing-followup'],
    queryFn: () => followUpsAPI.getPatientsNeedingFollowUp(),
  });

  const stats = statsResponse?.data;
  const appointments = appointmentsResponse?.data?.appointments || [];
  const followUpPatients = followUpPatientsResponse?.data || [];

  // Derived data
  const overdueFollowUps = followUpPatients.filter((p) => new Date(p.follow_up_date) < new Date());
  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? t('goodMorning') || 'God morgen'
      : now.getHours() < 17
        ? t('goodAfternoon') || 'God ettermiddag'
        : t('goodEvening') || 'God kveld';

  // ─── Mutations ─────────────────────────────────────────────

  const handleCancelAppointment = async (appointmentId, patientName) => {
    toast.promise(
      new Promise((resolve, reject) => {
        toast.info(
          `${(t('cancelAppointmentConfirm') || 'Avbestill time for {name}?').replace('{name}', patientName)}`,
          {
            action: {
              label: t('confirm') || 'Bekreft',
              onClick: async () => {
                try {
                  await appointmentsAPI.cancel(appointmentId, 'Cancelled by practitioner');
                  refetchAppointments();
                  resolve();
                } catch (error) {
                  reject(error);
                }
              },
            },
            cancel: {
              label: t('cancel') || 'Avbryt',
              onClick: () => reject(new Error('Cancelled')),
            },
            duration: 10000,
          }
        );
      }),
      {
        loading: t('cancelling') || 'Avbestiller...',
        success: t('appointmentCancelled') || 'Time avbestilt',
        error: (err) => (err.message === 'Cancelled' ? '' : t('cancelFailed')),
      }
    );
  };

  const markContactedMutation = useMutation({
    mutationFn: ({ patientId, method }) => followUpsAPI.markPatientAsContacted(patientId, method),
    onSuccess: () => {
      queryClient.invalidateQueries(['patients-needing-followup']);
      queryClient.invalidateQueries(['dashboard-stats']);
    },
  });

  const handleMarkContacted = (patient, method) => {
    const patientName = `${patient.first_name} ${patient.last_name}`;
    toast.info((t('markContactedConfirm') || 'Kontaktet {name}?').replace('{name}', patientName), {
      action: {
        label: t('confirm') || 'Bekreft',
        onClick: () => markContactedMutation.mutate({ patientId: patient.id, method }),
      },
      cancel: {
        label: t('cancel') || 'Avbryt',
        onClick: () => {},
      },
      duration: 10000,
    });
  };

  // ─── Quick actions with keyboard shortcuts ─────────────────

  const quickActions = [
    {
      name: t('newPatient') || 'Ny pasient',
      icon: UserPlus,
      bgClass: 'bg-blue-50',
      iconClass: 'text-blue-600',
      shortcut: 'Ctrl+N',
      action: () => navigate('/patients/new'),
    },
    {
      name: t('newAppointment') || 'Ny time',
      icon: Calendar,
      bgClass: 'bg-green-50',
      iconClass: 'text-green-600',
      shortcut: 'Ctrl+T',
      action: () => navigate('/appointments/new'),
    },
    {
      name: t('startEncounter') || 'Start konsultasjon',
      icon: FileText,
      bgClass: 'bg-teal-50',
      iconClass: 'text-teal-600',
      shortcut: 'Ctrl+E',
      action: () => navigate('/patients'),
    },
    {
      name: t('sendSMS') || 'Send SMS',
      icon: MessageSquare,
      bgClass: 'bg-purple-50',
      iconClass: 'text-purple-600',
      shortcut: 'Ctrl+M',
      action: () => navigate('/communications'),
    },
  ];

  // ─── Stat cards config ─────────────────────────────────────

  const statCards = [
    {
      label: t('todaysAppointments') || 'Timer i dag',
      value: stats?.todayAppointments || 0,
      icon: Calendar,
      bgClass: 'bg-blue-50',
      iconClass: 'text-blue-600',
      trend: stats?.appointmentsTrend,
      trendLabel: t('vsLastWeek') || 'vs forrige uke',
    },
    {
      label: t('activePatients') || 'Aktive pasienter',
      value: stats?.activePatients || 0,
      icon: Users,
      bgClass: 'bg-green-50',
      iconClass: 'text-green-600',
      trend: stats?.patientsTrend,
      trendLabel: t('vsLastMonth') || 'vs forrige mnd',
    },
    {
      label: t('pendingFollowUps') || 'Oppfølginger',
      value: stats?.pendingFollowUps || 0,
      icon: CheckCircle2,
      bgClass: 'bg-orange-50',
      iconClass: 'text-orange-600',
    },
    {
      label: t('revenueThisMonth') || 'Omsetning mnd',
      value: stats?.monthRevenue ? `${(stats.monthRevenue / 1000).toFixed(0)}k kr` : '0 kr',
      icon: TrendingUp,
      bgClass: 'bg-purple-50',
      iconClass: 'text-purple-600',
      trend: stats?.revenueTrend,
      trendLabel: t('vsLastMonth') || 'vs forrige mnd',
    },
    {
      label: t('aiInsights') || 'AI-innsikt',
      value: stats?.aiRedFlags || 0,
      icon: Brain,
      bgClass: 'bg-teal-50',
      iconClass: 'text-teal-600',
      trend: stats?.aiTrend,
      trendLabel: t('redFlagsToday') || 'røde flagg i dag',
    },
  ];

  // ─── Alerts ────────────────────────────────────────────────

  const alerts = [
    {
      id: 'overdue',
      icon: AlertCircle,
      label: `${overdueFollowUps.length} ${t('overdueFollowUps') || 'forfalte oppfølginger'}`,
      color:
        overdueFollowUps.length > 0
          ? 'text-red-600 dark:text-red-400'
          : 'text-green-600 dark:text-green-400',
      dot: overdueFollowUps.length > 0 ? 'bg-red-500' : 'bg-green-500',
      action: () => navigate('/follow-ups'),
    },
    {
      id: 'messages',
      icon: Mail,
      label: `${stats?.unreadMessages || 0} ${t('unreadMessages') || 'uleste meldinger'}`,
      color:
        (stats?.unreadMessages || 0) > 0
          ? 'text-yellow-600 dark:text-yellow-400'
          : 'text-green-600 dark:text-green-400',
      dot: (stats?.unreadMessages || 0) > 0 ? 'bg-yellow-500' : 'bg-green-500',
      action: () => navigate('/communications'),
    },
    {
      id: 'billing',
      icon: CreditCard,
      label: t('billingOk') || 'Fakturering OK',
      color: 'text-green-600 dark:text-green-400',
      dot: 'bg-green-500',
      action: () => navigate('/billing'),
    },
  ];

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            data-testid="dashboard-title"
            className="text-2xl font-semibold text-gray-900 dark:text-white"
          >
            {greeting}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {formatDateWithWeekday(new Date(), lang)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/search')}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={t('search') || 'Søk (Ctrl+K)'}
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={t('notifications') || 'Varsler'}
          >
            <Bell className="w-5 h-5" />
            {(stats?.unreadMessages || 0) > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* ── Stat Cards (5-column grid) ─────────────────────── */}
      {statsLoading ? (
        <StatsGridSkeleton count={5} className="" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              bgClass={stat.bgClass}
              iconClass={stat.iconClass}
              trend={stat.trend}
              trendLabel={stat.trendLabel}
            />
          ))}
        </div>
      )}

      {/* ── Main content: Schedule + Sidebar ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─ Left: Today's Schedule (2/3 width) ─────────── */}
        <div className="lg:col-span-2 space-y-6">
          <div
            data-testid="dashboard-chart"
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-soft-sm"
          >
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t('todaysSchedule') || 'Dagens timeplan'}
                </h2>
                {appointments.length > 0 && (
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {appointments.length} {t('appointments') || 'timer'}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate('/appointments')}
                className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 font-medium"
              >
                {t('viewAll') || 'Se alle'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {appointmentsLoading ? (
                <AppointmentsListSkeleton items={6} />
              ) : appointments.length > 0 ? (
                appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div
                        className="flex items-center gap-4 flex-1 cursor-pointer min-w-0"
                        onClick={() => navigate(`/patients/${apt.patient_id}`)}
                      >
                        {/* Time */}
                        <div className="text-center w-14 flex-shrink-0">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {i18nFormatTime(apt.start_time, lang)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {apt.duration_minutes || 30} {t('min') || 'min'}
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="h-10 w-px bg-gray-200 dark:bg-gray-600 flex-shrink-0" />

                        {/* Patient info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {apt.patient_name}
                            </p>
                            {apt.is_new_patient && (
                              <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                                {t('new') || 'NY'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {apt.appointment_type || t('appointment') || 'Konsultasjon'}
                          </p>
                        </div>
                      </div>

                      {/* Status + actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {apt.red_flags && (
                          <span className="text-xs bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {t('redFlag') || 'Rødt flagg'}
                          </span>
                        )}
                        <StatusBadge
                          status={apt.status}
                          label={t(apt.status?.toLowerCase(), apt.status)}
                        />
                        {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelAppointment(apt.id, apt.patient_name);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all"
                            title={t('cancelAppointment') || 'Avbestill'}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={Clock}
                  title={t('noAppointmentsToday') || 'Ingen timer i dag'}
                  description={
                    t('noAppointmentsDesc') || 'Nyt en rolig dag, eller book en ny time.'
                  }
                  action={
                    <button
                      onClick={() => navigate('/appointments/new')}
                      className="text-sm font-medium text-teal-600 hover:text-teal-700"
                    >
                      {t('bookAppointment') || '+ Ny time'}
                    </button>
                  }
                />
              )}
            </div>
          </div>

          {/* ─ Recent Activity (collapsible) ─────────────── */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-soft-sm">
            <button
              onClick={() => setShowActivity(!showActivity)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t('recentActivity') || 'Siste aktivitet'}
                </h2>
              </div>
              {showActivity ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {showActivity && (
              <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-3 space-y-3">
                {/* Activity items — will populate from API when available */}
                <ActivityItem
                  icon={FileText}
                  text={t('encounterSigned') || 'Konsultasjon signert'}
                  time="2t"
                  color="text-teal-500"
                />
                <ActivityItem
                  icon={MessageSquare}
                  text={t('smsSent') || 'SMS sendt til pasient'}
                  time="3t"
                  color="text-purple-500"
                />
                <ActivityItem
                  icon={CheckCircle2}
                  text={t('treatmentPlanCompleted') || 'Behandlingsplan fullført'}
                  time="5t"
                  color="text-green-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* ─ Right Sidebar ──────────────────────────────── */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-soft-sm">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('quickActions') || 'Hurtigvalg'}
              </h2>
            </div>
            <div className="p-3 space-y-1.5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.name}
                    onClick={action.action}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left group"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg ${action.bgClass} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`w-4 h-4 ${action.iconClass}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1">
                      {action.name}
                    </span>
                    <kbd className="hidden sm:inline text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {action.shortcut}
                    </kbd>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-soft-sm">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('alerts') || 'Varsler'}
              </h2>
            </div>
            <div className="p-3 space-y-1">
              {alerts.map((alert) => {
                const Icon = alert.icon;
                return (
                  <button
                    key={alert.id}
                    onClick={alert.action}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
                  >
                    <span className={`w-2 h-2 rounded-full ${alert.dot} flex-shrink-0`} />
                    <Icon className={`w-4 h-4 ${alert.color} flex-shrink-0`} />
                    <span className={`text-sm ${alert.color} flex-1`}>{alert.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pending Follow-ups */}
          <div
            data-testid="dashboard-recent-patients"
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-soft-sm"
          >
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('patientsNeedingFollowUp') || 'Oppfølging'}
              </h2>
              <button
                onClick={() => navigate('/follow-ups')}
                className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 font-medium flex items-center gap-0.5"
              >
                {t('viewAll') || 'Se alle'}
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {followUpLoading ? (
                <ListSkeleton items={4} showAvatar={false} />
              ) : followUpPatients.length > 0 ? (
                followUpPatients.slice(0, 5).map((patient) => {
                  const followUpDate = new Date(patient.follow_up_date);
                  const isOverdue = followUpDate < new Date();

                  return (
                    <div
                      key={patient.id}
                      className="px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="flex-1 cursor-pointer min-w-0"
                          onClick={() => navigate(`/patients/${patient.id}`)}
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {patient.main_problem || t('noProblemSpecified') || 'Ikke spesifisert'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-xs font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                              {isOverdue
                                ? `${t('overdue') || 'Forfalt'}: `
                                : `${t('due') || 'Frist'}: `}
                              {formatDateShort(followUpDate, lang)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleMarkContacted(patient, patient.preferred_contact_method || 'SMS')
                          }
                          disabled={markContactedMutation.isPending}
                          className="flex-shrink-0 p-1.5 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title={t('markAsContacted') || 'Merk som kontaktet'}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  icon={CheckCircle2}
                  title={t('noFollowUpsNeeded') || 'Alt oppdatert!'}
                  description={t('allCaughtUp') || 'Ingen oppfølginger venter.'}
                  className="py-8"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recall Dashboard (collapsible) ───────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-soft-sm">
        <button
          onClick={() => setShowRecall(!showRecall)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors rounded-xl"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t('recallDashboard') || 'Recall Dashboard'}
            </h2>
          </div>
          {showRecall ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {showRecall && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <RecallDashboard />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function ActivityItem({ icon: Icon, text, time, color }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
      <span className="text-gray-600 dark:text-gray-300 flex-1">{text}</span>
      <span className="text-xs text-gray-400 flex-shrink-0">{time}</span>
    </div>
  );
}
