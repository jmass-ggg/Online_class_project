import { Navigate, Outlet } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { isTeacher } from "../utils/roleHelpers";

export default function TeacherRoute() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <Loader fullScreen label="Loading teacher dashboard" />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!isTeacher(user)) {
    return <Navigate to="/student/dashboard" replace />;
  }

  return <Outlet />;
}