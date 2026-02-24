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
              <PageErrorBoundary pageName="Dashboard">
                <Dashboard />
              </PageErrorBoundary>
            }
          />
          <Route
            path="patients"
            element={
              <PageErrorBoundary pageName="Pasienter">
                <Patients />
              </PageErrorBoundary>
            }
          />
          <Route
            path="patients/new"
            element={
              <PageErrorBoundary pageName="Ny pasient">
                <NewPatient />
              </PageErrorBoundary>
            }
          />
          <Route
            path="patients/:id"
            element={
              <PageErrorBoundary pageName="Pasientdetaljer">
                <PatientDetail />
              </PageErrorBoundary>
            }
          />
          <Route
            path="patients/:patientId/encounter"
            element={
              <PageErrorBoundary pageName="Konsultasjon">
                <ClinicalEncounter />
              </PageErrorBoundary>
            }
          />
          <Route
            path="patients/:patientId/encounter/:encounterId"
            element={
              <PageErrorBoundary pageName="Konsultasjon">
                <ClinicalEncounter />
              </PageErrorBoundary>
            }
          />
          <Route
            path="patients/:patientId/easy-assessment"
            element={
              <PageErrorBoundary pageName="Hurtigvurdering">
                <EasyAssessment />
              </PageErrorBoundary>
            }
          />
          <Route
            path="patients/:patientId/easy-assessment/:encounterId"
            element={
              <PageErrorBoundary pageName="Hurtigvurdering">
                <EasyAssessment />
              </PageErrorBoundary>
            }
          />
          <Route
            path="appointments"
            element={
              <PageErrorBoundary pageName="Timer">
                <Appointments />
              </PageErrorBoundary>
            }
          />
          <Route
            path="appointments/new"
            element={
              <PageErrorBoundary pageName="Ny time">
                <NewAppointment />
              </PageErrorBoundary>
            }
          />
          <Route
            path="calendar"
            element={
              <PageErrorBoundary pageName="Kalender">
                <Calendar />
              </PageErrorBoundary>
            }
          />
          <Route
            path="patient-flow"
            element={
              <PageErrorBoundary pageName="Pasientflyt">
                <PatientFlow />
              </PageErrorBoundary>
            }
          />
          <Route
            path="communications"
            element={
              <PageErrorBoundary pageName="Kommunikasjon">
                <Communications />
              </PageErrorBoundary>
            }
          />
          <Route
            path="follow-ups"
            element={
              <PageErrorBoundary pageName="Oppfølginger">
                <FollowUps />
              </PageErrorBoundary>
            }
          />
          <Route
            path="financial"
            element={
              <PageErrorBoundary pageName="Økonomi">
                <Financial />
              </PageErrorBoundary>
            }
          />
          <Route
            path="kpi"
            element={
              <PageErrorBoundary pageName="KPI">
                <KPI />
              </PageErrorBoundary>
            }
          />
          <Route
            path="import"
            element={
              <PageErrorBoundary pageName="Import">
                <Import />
              </PageErrorBoundary>
            }
          />
          <Route
            path="training"
            element={
              <PageErrorBoundary pageName="AI-trening">
                <Training />
              </PageErrorBoundary>
            }
          />
          <Route
            path="audit-logs"
            element={
              <PageErrorBoundary pageName="Revisjonslogg">
                <AuditLogs />
              </PageErrorBoundary>
            }
          />
          <Route
            path="templates"
            element={
              <PageErrorBoundary pageName="Maler">
                <Templates />
              </PageErrorBoundary>
            }
          />
          <Route
            path="settings"
            element={
              <PageErrorBoundary pageName="Innstillinger">
                <Settings />
              </PageErrorBoundary>
            }
          />
          <Route
            path="crm"
            element={
              <PageErrorBoundary pageName="CRM">
                <CRM />
              </PageErrorBoundary>
            }
          />
          <Route
            path="macros"
            element={
              <PageErrorBoundary pageName="Makroer">
                <Macros />
              </PageErrorBoundary>
            }
          />
          <Route
            path="ai-performance"
            element={
              <PageErrorBoundary pageName="AI-ytelse">
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
              <PageErrorBoundary pageName="Portal Innlogging">
                <PatientLogin />
              </PageErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="/portal"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageErrorBoundary pageName="Portal">
                <PortalDashboard />
              </PageErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="/portal/appointments"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageErrorBoundary pageName="Mine timer">
                <PortalAppointments />
              </PageErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="/portal/outcomes"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageErrorBoundary pageName="Skjemaer">
                <PortalOutcomes />
              </PageErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="/portal/profile"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageErrorBoundary pageName="Min profil">
                <PortalProfile />
              </PageErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="/portal/exercises"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageErrorBoundary pageName="Øvelser">
                <PatientExercises />
              </PageErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="/portal/exercises/:patientId"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageErrorBoundary pageName="Øvelser">
                <PatientExercises />
              </PageErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="/portal/mine-ovelser"
          element={
            <Suspense fallback={<PageLoader />}>
              <PageErrorBoundary pageName="Øvelser">
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
              <PageErrorBoundary pageName="Kiosk">
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
