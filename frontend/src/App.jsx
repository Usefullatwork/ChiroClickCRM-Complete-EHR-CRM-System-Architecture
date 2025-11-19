import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import DashboardLayout from './components/layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import NewPatient from './pages/NewPatient'
import PatientDetail from './pages/PatientDetail'
import ClinicalEncounter from './pages/ClinicalEncounter'
import Appointments from './pages/Appointments'
import NewAppointment from './pages/NewAppointment'
import Communications from './pages/Communications'
import FollowUps from './pages/FollowUps'
import Financial from './pages/Financial'
import KPI from './pages/KPI'
import Import from './pages/Import'
import Training from './pages/Training'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

function App() {
  return (
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
        <Route path="appointments" element={<Appointments />} />
        <Route path="appointments/new" element={<NewAppointment />} />
        <Route path="communications" element={<Communications />} />
        <Route path="follow-ups" element={<FollowUps />} />
        <Route path="financial" element={<Financial />} />
        <Route path="kpi" element={<KPI />} />
        <Route path="import" element={<Import />} />
        <Route path="training" element={<Training />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
