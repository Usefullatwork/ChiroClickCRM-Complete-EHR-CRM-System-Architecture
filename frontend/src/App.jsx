import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import DashboardLayout from './components/layouts/DashboardLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { setOrganizationId, getApiBaseUrl } from './services/api';
import useGlobalKeyboardShortcuts from './hooks/useGlobalKeyboardShortcuts';
import KeyboardShortcutsModal from './components/common/KeyboardShortcutsModal';

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
const NotFound = lazy(() => import('./pages/NotFound'));

// Patient Portal (public, no auth required)
const PatientExercises = lazy(() => import('./pages/portal/PatientExercises'));

// Page loader component for Suspense fallback
function PageLoader() {
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
        <p className="mt-4 text-gray-600">Laster...</p>
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
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="patients"
            element={
              <Suspense fallback={<PageLoader />}>
                <Patients />
              </Suspense>
            }
          />
          <Route
            path="patients/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <NewPatient />
              </Suspense>
            }
          />
          <Route
            path="patients/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <PatientDetail />
              </Suspense>
            }
          />
          <Route
            path="patients/:patientId/encounter"
            element={
              <Suspense fallback={<PageLoader />}>
                <ClinicalEncounter />
              </Suspense>
            }
          />
          <Route
            path="patients/:patientId/encounter/:encounterId"
            element={
              <Suspense fallback={<PageLoader />}>
                <ClinicalEncounter />
              </Suspense>
            }
          />
          <Route
            path="patients/:patientId/easy-assessment"
            element={
              <Suspense fallback={<PageLoader />}>
                <EasyAssessment />
              </Suspense>
            }
          />
          <Route
            path="patients/:patientId/easy-assessment/:encounterId"
            element={
              <Suspense fallback={<PageLoader />}>
                <EasyAssessment />
              </Suspense>
            }
          />
          <Route
            path="appointments"
            element={
              <Suspense fallback={<PageLoader />}>
                <Appointments />
              </Suspense>
            }
          />
          <Route
            path="appointments/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <NewAppointment />
              </Suspense>
            }
          />
          <Route
            path="calendar"
            element={
              <Suspense fallback={<PageLoader />}>
                <Calendar />
              </Suspense>
            }
          />
          <Route
            path="patient-flow"
            element={
              <Suspense fallback={<PageLoader />}>
                <PatientFlow />
              </Suspense>
            }
          />
          <Route
            path="communications"
            element={
              <Suspense fallback={<PageLoader />}>
                <Communications />
              </Suspense>
            }
          />
          <Route
            path="follow-ups"
            element={
              <Suspense fallback={<PageLoader />}>
                <FollowUps />
              </Suspense>
            }
          />
          <Route
            path="financial"
            element={
              <Suspense fallback={<PageLoader />}>
                <Financial />
              </Suspense>
            }
          />
          <Route
            path="kpi"
            element={
              <Suspense fallback={<PageLoader />}>
                <KPI />
              </Suspense>
            }
          />
          <Route
            path="import"
            element={
              <Suspense fallback={<PageLoader />}>
                <Import />
              </Suspense>
            }
          />
          <Route
            path="training"
            element={
              <Suspense fallback={<PageLoader />}>
                <Training />
              </Suspense>
            }
          />
          <Route
            path="audit-logs"
            element={
              <Suspense fallback={<PageLoader />}>
                <AuditLogs />
              </Suspense>
            }
          />
          <Route
            path="templates"
            element={
              <Suspense fallback={<PageLoader />}>
                <Templates />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<PageLoader />}>
                <Settings />
              </Suspense>
            }
          />
          <Route
            path="crm"
            element={
              <Suspense fallback={<PageLoader />}>
                <CRM />
              </Suspense>
            }
          />
          <Route
            path="macros"
            element={
              <Suspense fallback={<PageLoader />}>
                <Macros />
              </Suspense>
            }
          />
        </Route>

        {/* Patient Portal Routes (public, no authentication required) */}
        <Route
          path="/portal/exercises"
          element={
            <Suspense fallback={<PageLoader />}>
              <PatientExercises />
            </Suspense>
          }
        />
        <Route
          path="/portal/exercises/:patientId"
          element={
            <Suspense fallback={<PageLoader />}>
              <PatientExercises />
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
