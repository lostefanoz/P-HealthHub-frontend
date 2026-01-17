import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { setupTableLabels } from './utils/tableLabels'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { it } from 'date-fns/locale'
import { getMuiTheme } from './theme/muiTheme'
import { ThemeContextProvider } from './theme/ThemeContext'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardLayout = lazy(() => import('./pages/DashboardLayout'))
const AdminRolesPage = lazy(() => import('./pages/AdminRolesPage'))
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage'))
const AdminDoctorSpecialtiesPage = lazy(() => import('./pages/AdminDoctorSpecialtiesPage'))
const AdminAccessLogsPage = lazy(() => import('./pages/AdminAccessLogsPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const DoctorAppointmentsPage = lazy(() => import('./pages/DoctorAppointmentsPage'))
const PlannerPage = lazy(() => import('./pages/PlannerPage'))
const ArchivedReportsPage = lazy(() => import('./pages/ArchivedReportsPage'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const AreaRiservataPage = lazy(() => import('./pages/AreaRiservataPage'))

function AppFallback() {
  return <div className="ds-card ds-card-body">Caricamento...</div>
}

function Protected({ children }: { children: JSX.Element }) {
  const { state } = useAuth()
  if (state.step === 'INIT') return <AppFallback />
  if (state.step !== 'AUTH') return <Navigate to="/area-riservata" replace />
  return children
}

function PatientOnly({ children }: { children: JSX.Element }) {
  const { state } = useAuth()
  if (state.step === 'INIT') return <AppFallback />
  if (state.step !== 'AUTH') return <Navigate to="/area-riservata" replace />
  if (!state.user.roles.includes('Patient')) return <Navigate to="/app" replace />
  return children
}

function SecretaryOnly({ children }: { children: JSX.Element }) {
  const { state } = useAuth()
  if (state.step === 'INIT') return <AppFallback />
  if (state.step !== 'AUTH') return <Navigate to="/area-riservata" replace />
  if (!state.user.roles.includes('Secretary')) return <Navigate to="/app" replace />
  return children
}

function DoctorOnly({ children }: { children: JSX.Element }) {
  const { state } = useAuth()
  if (state.step === 'INIT') return <AppFallback />
  if (state.step !== 'AUTH') return <Navigate to="/area-riservata" replace />
  if (!state.user.roles.includes('Doctor')) return <Navigate to="/app" replace />
  return children
}

function SecretaryOrAdminOnly({ children }: { children: JSX.Element }) {
  const { state } = useAuth()
  if (state.step === 'INIT') return <AppFallback />
  if (state.step !== 'AUTH') return <Navigate to="/area-riservata" replace />
  const roles = state.user.roles
  if (!roles.includes('Secretary') && !roles.includes('Admin')) return <Navigate to="/app" replace />
  return children
}

function AdminOnly({ children }: { children: JSX.Element }) {
  const { state } = useAuth()
  if (state.step === 'INIT') return <AppFallback />
  if (state.step !== 'AUTH') return <Navigate to="/area-riservata" replace />
  if (!state.user.roles.includes('Admin')) return <Navigate to="/app" replace />
  return children
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('theme')
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored)
        return
      }
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    } catch {
      setTheme('light')
    }
  }, [])

  useEffect(() => {
    try {
      const root = document.documentElement
      if (theme === 'dark') {
        root.classList.add('theme-dark')
      } else {
        root.classList.remove('theme-dark')
      }
      window.localStorage.setItem('theme', theme)
    } catch {
      // ignore
    }
  }, [theme])

  useEffect(() => setupTableLabels(), [])

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const muiTheme = useMemo(() => getMuiTheme(theme), [theme])
  const themeContextValue = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return (
    <ThemeContextProvider value={themeContextValue}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
          <AuthProvider>
            <Suspense fallback={<AppFallback />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/chi-siamo" element={<AboutPage />} />
                <Route path="/contatti" element={<ContactPage />} />
                <Route path="/area-riservata" element={<AreaRiservataPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/app"
                  element={
                    <Protected>
                      <DashboardLayout />
                    </Protected>
                  }
                >
                  <Route index element={<HomePage />} />
                  <Route
                    path="admin/roles"
                    element={
                      <AdminOnly>
                        <AdminRolesPage />
                      </AdminOnly>
                    }
                  />
                  <Route
                    path="admin/doctor-specialties"
                    element={
                      <AdminOnly>
                        <AdminDoctorSpecialtiesPage />
                      </AdminOnly>
                    }
                  />
                  <Route
                    path="admin/access-logs"
                    element={
                      <AdminOnly>
                        <AdminAccessLogsPage />
                      </AdminOnly>
                    }
                  />
                  <Route
                    path="prenota-visita"
                    element={
                      <PatientOnly>
                        <AppointmentsPage />
                      </PatientOnly>
                    }
                  />
                  <Route
                    path="planner"
                    element={
                      <SecretaryOnly>
                        <PlannerPage />
                      </SecretaryOnly>
                    }
                  />
                <Route
                  path="archivio-referti"
                  element={
                    <DoctorOnly>
                      <ArchivedReportsPage />
                    </DoctorOnly>
                  }
                />
                  <Route path="doctor/appuntamenti" element={<DoctorAppointmentsPage />} />
                  <Route path="account" element={<AccountPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ThemeContextProvider>
  )
}
