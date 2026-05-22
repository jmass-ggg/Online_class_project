import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader fullScreen label="Loading your classroom" />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
