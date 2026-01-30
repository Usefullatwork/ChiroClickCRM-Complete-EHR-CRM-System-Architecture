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
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import NewPatient from './pages/NewPatient'
import PatientDetail from './pages/PatientDetail'
import ClinicalEncounter from './pages/ClinicalEncounter'
import EasyAssessment from './pages/EasyAssessment'
import Appointments from './pages/Appointments'
import NewAppointment from './pages/NewAppointment'
import Calendar from './pages/Calendar'
import Communications from './pages/Communications'
import FollowUps from './pages/FollowUps'
import Financial from './pages/Financial'
import KPI from './pages/KPI'
import Import from './pages/Import'
import Training from './pages/Training'
import AuditLogs from './pages/AuditLogs'
import Templates from './pages/Templates'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <>
            <SignedIn>
              <DashboardLayout />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="patients/new" element={<NewPatient />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="patients/:patientId/encounter" element={<ClinicalEncounter />} />
        <Route path="patients/:patientId/encounter/:encounterId" element={<ClinicalEncounter />} />
        <Route path="patients/:patientId/easy-assessment" element={<EasyAssessment />} />
        <Route path="patients/:patientId/easy-assessment/:encounterId" element={<EasyAssessment />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="appointments/new" element={<NewAppointment />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="communications" element={<Communications />} />
        <Route path="follow-ups" element={<FollowUps />} />
        <Route path="financial" element={<Financial />} />
        <Route path="kpi" element={<KPI />} />
        <Route path="import" element={<Import />} />
        <Route path="training" element={<Training />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="templates" element={<Templates />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  )
}

export default App
