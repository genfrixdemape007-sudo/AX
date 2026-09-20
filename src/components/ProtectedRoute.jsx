import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from './LoadingStates'

// This guard only controls what the admin UI *renders* — it is a convenience, not the
// security boundary. The real boundary is enforced by Supabase RLS policies, which reject
// writes from any session that isn't listed in admin_users, regardless of what the frontend does.
export default function ProtectedRoute({ children }) {
  const { session, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Spinner label="Checking your session…" />
  }

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="mb-4 text-4xl">🔒</p>
        <h2 className="mb-2 font-heading text-xl font-semibold text-ink">Not authorized</h2>
        <p className="font-body text-sm text-ink-soft">
          This account isn't set up for admin access. Contact the shop owner if you think this is a mistake.
        </p>
      </div>
    )
  }

  return children
}
