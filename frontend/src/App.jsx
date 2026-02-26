import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import DashboardLayout from './components/layouts/DashboardLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import PageErrorBoundary from './components/PageErrorBoundary';
import { setOrganizationId, getApiBaseUrl } from './services/api';
import useGlobalKeyboardShortcuts from './hooks/useGlobalKeyboardShortcuts';
import KeyboardShortcutsModal from './components/common/KeyboardShortcutsModal';
import { useTranslation } from './i18n';

// Lazy load all pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Patients = lazy(() => import('./pages/Patients'));
const NewPatient = lazy(() => import('./pages/NewPatient'));
const PatientDetail = lazy(() => import('./pages/PatientDetail'));
const ClinicalEncounter = lazy(() => import('./pages/ClinicalEncounter'));
const EasyAssessment = lazy(() => import('./pages/EasyAssessment'));
const Appointments = lazy(() => import('./pages/Appointments'));
const NewAppointment = lazy(() => import('./pages/NewAppointment'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Communications = lazy(() => import('./pages/Communications'));
const FollowUps = lazy(() => import('./pages/FollowUps'));
const Financial = lazy(() => import('./pages/Financial'));
const KPI = lazy(() => import('./pages/KPI'));
const Import = lazy(() => import('./pages/Import'));
const Training = lazy(() => import('./pages/Training'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Templates = lazy(() => import('./pages/Templates'));
const Settings = lazy(() => import('./pages/Settings'));
const PatientFlow = lazy(() => import('./pages/PatientFlow'));
const CRM = lazy(() => import('./pages/CRM'));
const Macros = lazy(() => import('./pages/Macros'));
const AIPerformance = lazy(() => import('./pages/AIPerformance'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Patient Portal (public, no auth required)
const PatientExercises = lazy(() => import('./pages/portal/PatientExercises'));
const PortalDashboard = lazy(() => import('./pages/portal/PortalDashboard'));
const PortalAppointments = lazy(() => import('./pages/portal/PortalAppointments'));
const PortalOutcomes = lazy(() => import('./pages/portal/PortalOutcomes'));
const PortalProfile = lazy(() => import('./pages/portal/PortalProfile'));
const PatientLogin = lazy(() => import('./pages/portal/PatientLogin'));

// Kiosk (full-screen, no auth)
const Kiosk = lazy(() => import('./pages/Kiosk'));

// Page loader component for Suspense fallback
function PageLoader() {
  const { t } = useTranslation('common');
  return (
    <div
      className="flex items-center justify-center min-h-[400px]"
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"
          aria-hidden="true"
        ></div>
        <p className="mt-4 text-gray-600">{t('loading')}</p>
      </div>
    </div>
  );
}

function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { showHelp, setShowHelp } = useGlobalKeyboardShortcuts();
  const { t } = useTranslation('navigation');

  // Auto-login on startup
  useEffect(() => {
    const DESKTOP_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

    const autoLogin = async () => {
      try {
        // Check if already logged in
        const checkRes = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
          credentials: 'include',
        });
        if (checkRes.ok) {
          const data = await checkRes.json();
          const orgId = data.user?.organization_id || data.user?.organizationId || DESKTOP_ORG_ID;
          setOrganizationId(orgId);
          localStorage.setItem('organizationId', orgId);
          setIsAuthReady(true);
          return;
        }
      } catch (err) {
        // Not logged in via session
      }

      // Desktop mode fallback - set org ID for API calls
      setOrganizationId(DESKTOP_ORG_ID);
      localStorage.setItem('organizationId', DESKTOP_ORG_ID);
      setIsAuthReady(true);
    };
    autoLogin();
  }, []);

  if (!isAuthReady) {
    return <PageLoader />;
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-right" richColors closeButton />
      <KeyboardShortcutsModal open={showHelp} onClose={() => setShowHelp(false)} />
      <Routes>
        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <Suspense fallback={<PageLoader />}>
              <DashboardLayout />
            </Suspense>
          }
        >
          <Route
            index
            element={
              <PageErrorBoundary pageName={t('dashboard')}>
                <Dashboard />
              </PageErrorBoundary>
            }
          />
          <Route
            path="patients"
            element={
              <PageErrorBoundary pageName={t('patients')}>
                <Patients />
              </PageErrorBoundary>
            }
          />
          <Route
            path="patients/new"
            element={
              <PageErrorBoundary pageName={t('newPatient')}>
                <NewPatient />
              </PageErrorBoundary>
            }
          />
          <Route
            path="patients/:id"
            element={
              <PageErrorBoundary pageName={t('patientDetail')}>
                <PatientDetail />
              </PageErrorBoundary>
            }
          />
          <Route
            path="patients/:patientId/encounter"
            element={
              <PageErrorBoundary pageName={t('encounter')}>
                <ClinicalEncounter />
              </PageErrorBoundary>
            }
          />
          <Route
            path="patients/:patientId/encounter/:encounterId"
            element={
              <PageErrorBoundary pageName={t('encounter')}>
                <ClinicalEncounter />
              </PageErrorBoundary>
            }
          />
          <Route
            path="patients/:patientId/easy-assessment"
            element={
              <PageErrorBoundary pageName={t('easyAssessment')}>
                <EasyAssessment />
              </PageErrorBoundary>
            }
          />
          <Route
            path="patients/:patientId/easy-assessment/:encounterId"
            element={
              <PageErrorBoundary pageName={t('easyAssessment')}>
                <EasyAssessment />
              </PageErrorBoundary>
            }
          />
          <Route
            path="appointments"
            element={
              <PageErrorBoundary pageName={t('appointments')}>
                <Appointments />
              </PageErrorBoundary>
            }
          />
          <Route
            path="appointments/new"
            element={
              <PageErrorBoundary pageName={t('newAppointment')}>
                <NewAppointment />
              </PageErrorBoundary>
            }
          />
          <Route
            path="calendar"
            element={
              <PageErrorBoundary pageName={t('calendar')}>
                <Calendar />
              </PageErrorBoundary>
            }
          />
          <Route
            path="patient-flow"
            element={
              <PageErrorBoundary pageName={t('patientFlow')}>
                <PatientFlow />
              </PageErrorBoundary>
            }
          />
          <Route
            path="communications"
            element={
              <PageErrorBoundary pageName={t('communications')}>
                <Communications />
              </PageErrorBoundary>
            }
          />
          <Route
            path="follow-ups"
            element={
              <PageErrorBoundary pageName={t('followUps')}>
                <FollowUps />
              </PageErrorBoundary>
            }
          />
          <Route
            path="financial"
            element={
              <PageErrorBoundary pageName={t('financial')}>
                <Financial />
              </PageErrorBoundary>
            }
          />
          <Route
            path="kpi"
            element={
              <PageErrorBoundary pageName={t('kpi')}>
                <KPI />
              </PageErrorBoundary>
            }
          />
          <Route
            path="import"
            element={
              <PageErrorBoundary pageName={t('import')}>
                <Import />
              </PageErrorBoundary>
            }
          />
          <Route
            path="training"
            element={
              <PageErrorBoundary pageName={t('aiTraining')}>
                <Training />
              </PageErrorBoundary>
            }
          />
          <Route
            path="audit-logs"
            element={
              <PageErrorBoundary pageName={t('auditLogs')}>
                <AuditLogs />
              </PageErrorBoundary>
            }
          />
          <Route
            path="templates"
            element={
              <PageErrorBoundary pageName={t('templates')}>
                <Templates />
              </PageErrorBoundary>
            }
          />
          <Route
            path="settings"
            element={
              <PageErrorBoundary pageName={t('settings')}>
                <Settings />
              </PageErrorBoundary>
            }
          />
          <Route
            path="crm"
            element={
              <PageErrorBoundary pageName={t('crm')}>
                <CRM />
              </PageErrorBoundary>
            }
          />
          <Route
            path="macros"
            element={
              <PageErrorBoundary pageName={t('macros')}>
                <Macros />
              </PageErrorBoundary>
            }
          />
          <Route
            path="ai-performance"
            element={
              <PageErrorBoundary pageName={t('aiPerformance')}>
                <AIPerformance />
              </PageErrorBoundary>
            }
          />
        </Route>

        {/* Patient Portal Routes (public, no authentication required) */}
        <Route
          path="/portal/login"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageErrorBoundary pageName={t('portalLogin')}>
                <PatientLogin />
              </PageErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="/portal"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageErrorBoundary pageName={t('portal')}>
                <PortalDashboard />
              </PageErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="/portal/appointments"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageErrorBoundary pageName={t('myAppointments')}>
                <PortalAppointments />
              </PageErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="/portal/outcomes"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageErrorBoundary pageName={t('forms')}>
                <PortalOutcomes />
              </PageErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="/portal/profile"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageErrorBoundary pageName={t('myProfile')}>
                <PortalProfile />
              </PageErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="/portal/exercises"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageErrorBoundary pageName={t('exercises')}>
                <PatientExercises />
              </PageErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="/portal/exercises/:patientId"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageErrorBoundary pageName={t('exercises')}>
                <PatientExercises />
              </PageErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="/portal/mine-ovelser"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageErrorBoundary pageName={t('exercises')}>
                <PatientExercises />
              </PageErrorBoundary>
            </Suspense>
          }
        />

        {/* Kiosk Route (full-screen, no auth) */}
        <Route
          path="/kiosk"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageErrorBoundary pageName={t('kiosk')}>
                <Kiosk />
              </PageErrorBoundary>
            </Suspense>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
