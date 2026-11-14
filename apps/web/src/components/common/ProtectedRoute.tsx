import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ requiredRole }: { requiredRole?: string }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="state-panel">Checking your session…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" replace />;
  return <Outlet />;
}
