import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, founderOnly = false }) {
  const { token, user } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (founderOnly && user?.role !== 'founder') {
    return <Navigate to="/tasks" replace />;
  }

  return children;
}
