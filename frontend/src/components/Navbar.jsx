import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      <button className="icon-button menu-button" type="button" onClick={onMenuClick} aria-label="Open menu">☰</button>
      <div>
        <p className="topbar-kicker">Classroom Live</p>
        <h1>{user?.role === "TEACHER" ? "Teacher workspace" : "Student workspace"}</h1>
      </div>
      <div className="topbar-user">
        <div className="avatar" aria-hidden="true">{user?.full_name?.charAt(0)?.toUpperCase() || "U"}</div>
        <div className="topbar-user-meta">
          <strong>{user?.full_name || "User"}</strong>
          <span>{user?.email}</span>
        </div>
        <button className="btn btn-secondary" type="button" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}
