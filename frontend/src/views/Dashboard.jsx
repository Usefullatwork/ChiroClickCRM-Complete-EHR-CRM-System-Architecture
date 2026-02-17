import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Clock, AlertTriangle, Plus, CheckCircle, TrendingUp } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { KPIDashboard } from '../components/analytics/KPIDashboard';
import { useDashboardSummary } from '../hooks/useAnalytics';
import { useAuth } from '../hooks/useAuth';

/**
 * Main Dashboard View
 *
 * Displays:
 * - Today's appointments
 * - Quick actions
 * - Recent alerts
 * - KPI dashboard (analytics)
 */
export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { data: summary, isLoading } = useDashboardSummary();
  const [showKPIs, setShowKPIs] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const todayAppointments = summary?.todayAppointments || [];
  const _upcomingAppointments = todayAppointments.filter((a) => new Date(a.startTime) > new Date());
  const recentAlerts = summary?.recentAlerts || [];
  const quickStats = summary?.quickStats || {};

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Welcome back, {user?.firstName || 'Doctor'}!
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {new Date().toLocaleDateString('nb-NO', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant={showKPIs ? 'outline' : 'primary'}
                onClick={() => setShowKPIs(!showKPIs)}
                icon={TrendingUp}
              >
                {showKPIs ? 'Overview' : 'Analytics'}
              </Button>
              <Button variant="primary" onClick={() => navigate('/patients/new')} icon={Plus}>
                New Patient
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {showKPIs ? (
          /* Analytics Dashboard */
          <KPIDashboard />
        ) : (
          /* Overview Dashboard */
          <>
            {/* Alerts */}
            {recentAlerts.length > 0 && (
              <div className="mb-6 space-y-3">
                {recentAlerts.map((alert, index) => (
                  <Alert key={index} variant={alert.severity || 'warning'}>
                    <AlertTriangle size={18} />
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm mt-1">{alert.message}</p>
                    </div>
                  </Alert>
                ))}
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <Card.Body>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Today's Appointments</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">
                        {todayAppointments.length}
                      </p>
                    </div>
                    <div className="p-3 bg-teal-100 rounded-lg">
                      <Calendar size={24} className="text-teal-600" />
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Body>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Active Patients</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">
                        {quickStats.activePatients || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users size={24} className="text-blue-600" />
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Body>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">This Week</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">
                        {quickStats.thisWeekVisits || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <CheckCircle size={24} className="text-green-600" />
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Body>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Pending Tasks</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">
                        {quickStats.pendingTasks || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Clock size={24} className="text-purple-600" />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>

            {/* Today's Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <Card.Header>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Today's Appointments</h3>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/appointments')}>
                      View All
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  {todayAppointments.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Calendar size={48} className="mx-auto mb-3 text-slate-300" />
                      <p>No appointments scheduled for today</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todayAppointments.map((appointment) => {
                        const startTime = new Date(appointment.startTime);
                        const isPast = startTime < new Date();

                        return (
                          <div
                            key={appointment.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              isPast ? 'bg-slate-50 border-slate-200' : 'bg-teal-50 border-teal-200'
                            } cursor-pointer hover:shadow-md transition-shadow`}
                            onClick={() => navigate(`/patients/${appointment.patientId}`)}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded ${isPast ? 'bg-slate-200' : 'bg-teal-200'}`}
                              >
                                <Clock
                                  size={18}
                                  className={isPast ? 'text-slate-600' : 'text-teal-700'}
                                />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {appointment.patientName}
                                </p>
                                <p className="text-sm text-slate-600">
                                  {startTime.toLocaleTimeString('nb-NO', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                  {' - '}
                                  {appointment.type}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                appointment.status === 'CONFIRMED'
                                  ? 'success'
                                  : appointment.status === 'PENDING'
                                    ? 'warning'
                                    : appointment.status === 'CANCELLED'
                                      ? 'danger'
                                      : 'info'
                              }
                            >
                              {appointment.status}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Quick Actions */}
              <Card>
                <Card.Header>
                  <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate('/patients/new')}
                      icon={Plus}
                    >
                      Register New Patient
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate('/appointments/new')}
                      icon={Calendar}
                    >
                      Schedule Appointment
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate('/patients')}
                      icon={Users}
                    >
                      Search Patients
                    </Button>

                    {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                      <>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => setShowKPIs(true)}
                          icon={TrendingUp}
                        >
                          View Analytics & KPIs
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => navigate('/settings')}
                          icon={AlertTriangle}
                        >
                          Clinic Settings
                        </Button>
                      </>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </div>

            {/* Recent Activity (if available) */}
            {summary?.recentActivity && summary.recentActivity.length > 0 && (
              <Card className="mt-6">
                <Card.Header>
                  <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-4">
                    {summary.recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 pb-4 border-b border-slate-200 last:border-0 last:pb-0"
                      >
                        <div className="p-2 bg-slate-100 rounded">
                          {activity.type === 'APPOINTMENT' && (
                            <Calendar size={16} className="text-slate-600" />
                          )}
                          {activity.type === 'PATIENT' && (
                            <Users size={16} className="text-slate-600" />
                          )}
                          {activity.type === 'NOTE' && (
                            <CheckCircle size={16} className="text-slate-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                          <p className="text-xs text-slate-600 mt-1">{activity.description}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(activity.timestamp).toLocaleString('nb-NO')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};
