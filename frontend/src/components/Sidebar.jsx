import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function teacherLinks() {
  return [
    ["Dashboard", "/teacher/dashboard", "▦"],
    ["Courses", "/teacher/courses", "▣"],
    ["Classrooms", "/teacher/batches", "▤"],
    ["Live Classes", "/teacher/sessions", "◉"],
  ];
}

function studentLinks() {
  return [
    ["Dashboard", "/student/dashboard", "▦"],
    ["Join Classroom", "/student/join-classroom", "+"],
    ["My Classrooms", "/student/batches", "▤"],
    ["Live Classes", "/student/sessions", "◉"],
  ];
}

export default function Sidebar({ onNavigate }) {
  const { user } = useAuth();
  const links = user?.role === "TEACHER" ? teacherLinks() : studentLinks();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">TN</div>
        <div>
          <strong>TeachNest</strong>
          <span>Teacher-first LMS</span>
        </div>
      </div>

      <nav className="side-nav" aria-label="Dashboard navigation">
        {links.map(([label, to, icon]) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) => `side-link${isActive ? " active" : ""}`}
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-note">
        <strong>{user?.role === "TEACHER" ? "Teacher Account" : "Student Account"}</strong>
        <span>
          Manage learning, live classes, enrollment codes, and progress from one
          clean workspace.
        </span>
      </div>
    </aside>
  );
}