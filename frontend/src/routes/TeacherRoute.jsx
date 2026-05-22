import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { isTeacher } from "../utils/roleHelpers";

export default function TeacherRoute() {
  const { user } = useAuth();
  if (!isTeacher(user)) return <Navigate to="/student/dashboard" replace />;
  return <Outlet />;
}
