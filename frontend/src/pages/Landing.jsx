import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { homeForRole } from "../utils/roleHelpers";

export default function Landing() {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user?.role) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return (
    <main className="public-page">
      <header className="public-navbar">
        <Link to="/" className="public-logo">
          <span className="logo-icon">⌂</span>
          <span>Classio</span>
        </Link>

        <nav className="public-links">
          <a href="#about">About Us</a>
          <a href="#faq">FAQ</a>
          <a href="#contact">Contact Us</a>
          <a href="#pricing">Pricing</a>
          <a href="#blog">Blog</a>
        </nav>

        <div className="public-actions">
          <Link className="nav-login" to="/login">Log in</Link>
          <Link className="nav-signup" to="/register/teacher">Sign Up</Link>
        </div>
      </header>

      <section className="role-hero">
        <div className="role-hero-copy">
          <h1>Welcome to Classio</h1>
          <p>
            Select your role to personalize your experience and start connecting
            with your educational community.
          </p>
        </div>

        <div className="role-card-grid">
          <article className="role-card">
            <div className="role-icon">🎓</div>
            <h2>I am a Student</h2>
            <p>Access courses, track your progress, and collaborate with peers.</p>
            <Link className="role-button" to="/register/student">
              Join as Student
            </Link>
          </article>

          <article className="role-card">
            <div className="role-icon">🧑‍🏫</div>
            <h2>I am a Teacher</h2>
            <p>Create classrooms, manage resources, and inspire your students.</p>
            <Link className="role-button" to="/register/teacher">
              Join as Teacher
            </Link>
          </article>
        </div>

        <p className="role-login-text">
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      </section>

      <footer className="public-footer">
        <strong>Classio</strong>
        <span>© 2024 Classio LMS. Empowering educators and students globally.</span>
        <div>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#cookies">Cookie Policy</a>
          <a href="#accessibility">Accessibility</a>
        </div>
      </footer>
    </main>
  );
}