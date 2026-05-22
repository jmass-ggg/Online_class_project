import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { homeForRole } from "../utils/roleHelpers";

export default function Landing() {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user?.role) return <Navigate to={homeForRole(user.role)} replace />;

  return (
    <section className="landing-page">
      <nav className="landing-nav">
        <div className="brand brand-light"><div className="brand-mark">CL</div><strong>Classroom Live</strong></div>
        <div className="landing-actions">
          <Link className="btn btn-secondary" to="/login">Login</Link>
          <Link className="btn btn-primary" to="/register/teacher">Start teaching</Link>
        </div>
      </nav>
      <div className="landing-hero">
        <div className="hero-copy">
          <span className="eyebrow">Online classroom + video meetings</span>
          <h1>Teach, enroll, stream, and track attendance from one professional dashboard.</h1>
          <p>
            A Google Classroom and Zoom inspired frontend for Django REST Framework and LiveKit, built with role-based workflows for teachers and students.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary btn-large" to="/register/teacher">Create teacher account</Link>
            <Link className="btn btn-secondary btn-large" to="/register/student">Create student account</Link>
          </div>
        </div>
        <div className="hero-panel">
          <div className="hero-window-bar"><span /><span /><span /></div>
          <div className="hero-dashboard-preview">
            <div className="preview-sidebar" />
            <div className="preview-content">
              <div className="preview-line wide" />
              <div className="preview-stats"><span /><span /><span /></div>
              <div className="preview-card"><strong>Python Morning Batch</strong><em>LIVE</em></div>
              <div className="preview-card muted"><strong>Enrollment code</strong><em>PYT8X2</em></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
