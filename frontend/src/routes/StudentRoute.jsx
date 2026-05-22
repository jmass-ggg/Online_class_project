import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { isStudent } from "../utils/roleHelpers";

export default function StudentRoute() {
  const { user } = useAuth();
  if (!isStudent(user)) return <Navigate to="/teacher/dashboard" replace />;
  return <Outlet />;
}
