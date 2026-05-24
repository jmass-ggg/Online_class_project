import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Loader from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { homeForRole } from "../utils/roleHelpers";
import { parseApiError, required, validateEmail } from "../utils/validators";

export default function Login() {
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRole, setSelectedRole] = useState("STUDENT");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return <Loader fullScreen label="Checking login status" />;
  }

  if (isAuthenticated && user?.role) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  const update = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!validateEmail(form.email)) {
      return setError("A valid email is required");
    }

    if (!required(form.password)) {
      return setError("Password is required");
    }

    try {
      setLoading(true);

      const nextUser = await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      showToast("Welcome back", "success");

      const fallback = homeForRole(nextUser.role);
      const from = location.state?.from?.pathname;

      navigate(from && from !== "/login" ? from : fallback, {
        replace: true,
      });
    } catch (err) {
      setError(parseApiError(err, "Invalid email or password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="split-auth-page login-page">
      <section className="auth-visual auth-visual-login">
        <div className="visual-overlay" />
        <div className="visual-content">
          <div className="visual-brand">
            <span>▱</span>
            <strong>TeachNest</strong>
          </div>
          <p>
            Empowering educators and students with a unified, intuitive learning
            ecosystem designed for focused growth.
          </p>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-panel login-panel">
          <h1>Welcome to TeachNest LMS</h1>
          <p>Log in to continue to your dashboard.</p>

          <div className="role-toggle">
            <button
              type="button"
              className={selectedRole === "STUDENT" ? "active" : ""}
              onClick={() => setSelectedRole("STUDENT")}
            >
              I’m a Student
            </button>
            <button
              type="button"
              className={selectedRole === "TEACHER" ? "active" : ""}
              onClick={() => setSelectedRole("TEACHER")}
            >
              I’m a Teacher
            </button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {error && <div className="form-error">{error}</div>}

            <label>
              Email Address
              <div className="input-with-icon">
                <span>✉</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={update}
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              </div>
            </label>

            <label>
              <span className="label-row">
                Password
                <Link to="/login" className="small-link">Forgot password?</Link>
              </span>

              <div className="input-with-icon">
                <span>▣</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={update}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-eye"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </label>

            <button className="auth-primary-button" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login →"}
            </button>
          </form>

          <div className="auth-divider">
            <span />
            <p>OR CONTINUE WITH</p>
            <span />
          </div>

          <div className="social-row">
            <button type="button">G&nbsp; Google</button>
            <button type="button">&nbsp; Apple</button>
          </div>

          <p className="auth-bottom-text">
            Don’t have an account? <Link to="/">Sign up</Link>
          </p>
        </div>
      </section>
    </main>
  );
}