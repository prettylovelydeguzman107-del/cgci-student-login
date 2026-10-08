import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import { BootScreen } from '../components/layout/BootScreen'
import { ProtectedRoute } from './ProtectedRoute'
import { GuestRoute } from './GuestRoute'

// The login screen is the entry point for most visitors, so it is not lazy.
import { LoginPage } from '../pages/LoginPage'

const ForgotPasswordPage = lazy(() =>
  import('../pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
)
const RegisteredStudentsPage = lazy(() =>
  import('../pages/RegisteredStudentsPage').then((m) => ({ default: m.RegisteredStudentsPage })),
)
const DashboardPage = lazy(() => import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <Suspense fallback={<BootScreen />}>
              <ForgotPasswordPage />
            </Suspense>
          </GuestRoute>
        }
      />

      <Route
        path="/registered-students"
        element={
          <Suspense fallback={<BootScreen />}>
            <RegisteredStudentsPage />
          </Suspense>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Suspense fallback={<BootScreen />}>
              <DashboardPage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Suspense fallback={<BootScreen />}>
              <ProfilePage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <Suspense fallback={<BootScreen />}>
            <NotFoundPage />
          </Suspense>
        }
      />
    </Routes>
  )
}

/** Sends visitors to the screen that matches their current session. */
function RootRedirect() {
  const { status } = useAuth()
  if (status === 'initializing') return <BootScreen />
  return <Navigate to={status === 'authenticated' ? '/dashboard' : '/login'} replace />
}
