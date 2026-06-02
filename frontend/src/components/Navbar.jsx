import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function getPageTitle(pathname, role) {
  const map = {
    "/teacher/dashboard": "Dashboard",
    "/teacher/courses": "Courses",
    "/teacher/batches": "Classrooms",
    "/teacher/sessions": "Live Classes",
    "/teacher/assignments": "Assignments",
    "/teacher/submissions": "Submissions",
    "/student/dashboard": "Dashboard",
    "/student/batches": "My Classrooms",
    "/student/sessions": "Live Classes",
    "/student/assignments": "Assignments",
    "/student/submissions": "My Submissions",
  };

  return map[pathname] || (role === "TEACHER" ? "Teacher Workspace" : "Student Workspace");
}

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-button menu-button"
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          ☰
        </button>

        <div>
          <p className="topbar-kicker">TeachNest LMS</p>
          <h1>{getPageTitle(location.pathname, user?.role)}</h1>
        </div>
      </div>

      <div className="topbar-user">
        <button className="topbar-icon notification-dot" type="button" aria-label="Notifications">
          ♧
        </button>

        <div className="avatar">{user?.full_name?.charAt(0)?.toUpperCase() || "S"}</div>

        <div className="topbar-user-meta">
          <strong>{user?.full_name || "Sarah Nolan"}</strong>
          <span>{user?.email || "teacher@example.com"}</span>
        </div>

        <button className="btn btn-ghost logout-btn" type="button" onClick={handleLogout}>
          ↪ Logout
        </button>
      </div>
    </header>
  );
}