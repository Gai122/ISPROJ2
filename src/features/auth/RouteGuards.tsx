import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) return <Navigate to={`/login?redirectTo=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return <>{children}</>
}

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) return <Navigate to={`/login?redirectTo=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (!isAdmin) return <Navigate to="/app/dashboard" replace />
  return <>{children}</>
}
