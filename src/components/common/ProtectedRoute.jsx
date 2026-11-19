
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function ProtectedRoute({ allowedRole }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Profile not found. Please contact the agency administrator.</p>
      </div>
    )
  }

  if (allowedRole && profile.role !== allowedRole) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
