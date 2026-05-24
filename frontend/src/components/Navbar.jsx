import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const roleLabel = user?.role === "TEACHER" ? "Teacher Workspace" : "Student Workspace";

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
          <h1>{roleLabel}</h1>
        </div>
      </div>

      <div className="topbar-user">
        <button className="topbar-icon" type="button" aria-label="Notifications">
          🔔
        </button>

        <div className="avatar" aria-hidden="true">
          {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
        </div>

        <div className="topbar-user-meta">
          <strong>{user?.full_name || "User"}</strong>
          <span>{user?.email}</span>
        </div>

        <button className="btn btn-secondary" type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}