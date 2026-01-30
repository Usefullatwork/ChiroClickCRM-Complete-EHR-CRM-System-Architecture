import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn as ClerkSignedIn, SignedOut as ClerkSignedOut, RedirectToSignIn as ClerkRedirectToSignIn } from '@clerk/clerk-react'
import { Toaster } from 'sonner'

// Check if we're in development mode with placeholder key
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const isDevMode = !clerkPubKey ||
  clerkPubKey === 'pk_test_your_key_here' ||
  clerkPubKey.includes('placeholder')

// In dev mode, always show signed-in content
const SignedIn = isDevMode
  ? ({ children }) => <>{children}</>
  : ClerkSignedIn

// In dev mode, never show signed-out content
const SignedOut = isDevMode
  ? ({ children }) => null
  : ClerkSignedOut

// In dev mode, don't redirect to sign in
const RedirectToSignIn = isDevMode
  ? () => null
  : ClerkRedirectToSignIn
import DashboardLayout from './components/layouts/DashboardLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { authAPI } from './services/api'

// Lazy load all pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Patients = lazy(() => import('./pages/Patients'))
const NewPatient = lazy(() => import('./pages/NewPatient'))
const PatientDetail = lazy(() => import('./pages/PatientDetail'))
const ClinicalEncounter = lazy(() => import('./pages/ClinicalEncounter'))
const EasyAssessment = lazy(() => import('./pages/EasyAssessment'))
const Appointments = lazy(() => import('./pages/Appointments'))
const NewAppointment = lazy(() => import('./pages/NewAppointment'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Communications = lazy(() => import('./pages/Communications'))
const FollowUps = lazy(() => import('./pages/FollowUps'))
const Financial = lazy(() => import('./pages/Financial'))
const KPI = lazy(() => import('./pages/KPI'))
const Import = lazy(() => import('./pages/Import'))
const Training = lazy(() => import('./pages/Training'))
const AuditLogs = lazy(() => import('./pages/AuditLogs'))
const Templates = lazy(() => import('./pages/Templates'))
const Settings = lazy(() => import('./pages/Settings'))
const PatientFlow = lazy(() => import('./pages/PatientFlow'))
const CRM = lazy(() => import('./pages/CRM'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Patient Portal (public, no auth required)
const PatientExercises = lazy(() => import('./pages/portal/PatientExercises'))

// Page loader component for Suspense fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Laster...</p>
      </div>
    </div>
  )
}

function App({ devMode = false }) {
  const [isAuthReady, setIsAuthReady] = useState(!devMode)

  // Auto-login in dev mode
  useEffect(() => {
    if (devMode) {
      const autoLogin = async () => {
        try {
          // Check if already logged in
          const checkRes = await fetch('/api/v1/auth/me', { credentials: 'include' })
          if (checkRes.ok) {
            setIsAuthReady(true)
            return
          }
          // Login with dev credentials
          await authAPI.login({ email: 'mads@chiroclick.no', password: 'admin123' })
          console.log('Dev mode: Auto-logged in as mads@chiroclick.no')
        } catch (err) {
          console.warn('Dev auto-login failed:', err.message)
        }
        setIsAuthReady(true)
      }
      autoLogin()
    }
  }, [devMode])

  if (!isAuthReady) {
    return <PageLoader />
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
      {/* Protected Routes */}
      <Route
        path="/"
        element={
          devMode ? (
            <Suspense fallback={<PageLoader />}>
              <DashboardLayout />
            </Suspense>
          ) : (
            <>
              <SignedIn>
                <Suspense fallback={<PageLoader />}>
                  <DashboardLayout />
                </Suspense>
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          )
        }
      >
        <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
        <Route path="patients" element={<Suspense fallback={<PageLoader />}><Patients /></Suspense>} />
        <Route path="patients/new" element={<Suspense fallback={<PageLoader />}><NewPatient /></Suspense>} />
        <Route path="patients/:id" element={<Suspense fallback={<PageLoader />}><PatientDetail /></Suspense>} />
        <Route path="patients/:patientId/encounter" element={<Suspense fallback={<PageLoader />}><ClinicalEncounter /></Suspense>} />
        <Route path="patients/:patientId/encounter/:encounterId" element={<Suspense fallback={<PageLoader />}><ClinicalEncounter /></Suspense>} />
        <Route path="patients/:patientId/easy-assessment" element={<Suspense fallback={<PageLoader />}><EasyAssessment /></Suspense>} />
        <Route path="patients/:patientId/easy-assessment/:encounterId" element={<Suspense fallback={<PageLoader />}><EasyAssessment /></Suspense>} />
        <Route path="appointments" element={<Suspense fallback={<PageLoader />}><Appointments /></Suspense>} />
        <Route path="appointments/new" element={<Suspense fallback={<PageLoader />}><NewAppointment /></Suspense>} />
        <Route path="calendar" element={<Suspense fallback={<PageLoader />}><Calendar /></Suspense>} />
        <Route path="patient-flow" element={<Suspense fallback={<PageLoader />}><PatientFlow /></Suspense>} />
        <Route path="communications" element={<Suspense fallback={<PageLoader />}><Communications /></Suspense>} />
        <Route path="follow-ups" element={<Suspense fallback={<PageLoader />}><FollowUps /></Suspense>} />
        <Route path="financial" element={<Suspense fallback={<PageLoader />}><Financial /></Suspense>} />
        <Route path="kpi" element={<Suspense fallback={<PageLoader />}><KPI /></Suspense>} />
        <Route path="import" element={<Suspense fallback={<PageLoader />}><Import /></Suspense>} />
        <Route path="training" element={<Suspense fallback={<PageLoader />}><Training /></Suspense>} />
        <Route path="audit-logs" element={<Suspense fallback={<PageLoader />}><AuditLogs /></Suspense>} />
        <Route path="templates" element={<Suspense fallback={<PageLoader />}><Templates /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
        <Route path="crm" element={<Suspense fallback={<PageLoader />}><CRM /></Suspense>} />
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
  )
}

export default App
