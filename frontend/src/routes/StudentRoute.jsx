import { Navigate, Outlet } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { isStudent } from "../utils/roleHelpers";

export default function StudentRoute() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <Loader fullScreen label="Loading student dashboard" />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!isStudent(user)) {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  return <Outlet />;
}