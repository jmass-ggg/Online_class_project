import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Loader from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { homeForRole } from "../utils/roleHelpers";
import { parseApiError, required, validateEmail } from "../utils/validators";

export default function Login() {
  const {
    login,
    logout,
    isAuthenticated,
    user,
    loading: authLoading,
  } = useAuth();

  const { showToast } = useToast();

  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRole, setSelectedRole] = useState("STUDENT");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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

    const email = form.email.trim().toLowerCase();

    if (!validateEmail(email)) {
      return setError("A valid email is required");
    }

    if (!required(form.password)) {
      return setError("Password is required");
    }

    try {
      setLoading(true);

      const nextUser = await login({
        email,
        password: form.password,
        role: selectedRole,
        rememberMe,
      });

      if (nextUser?.role !== selectedRole) {
        if (typeof logout === "function") {
          logout();
        }

        return setError("Invalid Credentials");
      }

      showToast("Welcome back", "success");

      const fallback = homeForRole(nextUser.role);
      const from = location.state?.from?.pathname;

      navigate(from && from !== "/login" ? from : fallback, {
        replace: true,
      });
    } catch (err) {
      setError(parseApiError(err, "Invalid Credentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="minimal-login-page">
      <section className="minimal-login-card">
        <div className="minimal-login-brand">
          <span aria-hidden="true">▱</span>
          <strong>TeachNest</strong>
        </div>

        <div className="minimal-login-heading">
          <h1>Welcome to TeachNest LMS</h1>
          <p>Log in to continue to your dashboard.</p>
        </div>

        <div className="minimal-role-toggle">
          <button
            type="button"
            className={selectedRole === "STUDENT" ? "active" : ""}
            onClick={() => setSelectedRole("STUDENT")}
          >
            <span aria-hidden="true">▱</span>
            I'm a Student
          </button>

          <button
            type="button"
            className={selectedRole === "TEACHER" ? "active" : ""}
            onClick={() => setSelectedRole("TEACHER")}
          >
            <span aria-hidden="true">▭</span>
            I'm a Teacher
          </button>
        </div>

        <form className="minimal-auth-form" onSubmit={submit}>
          {error && (
            <div className="minimal-auth-error">
              <span aria-hidden="true">ⓘ</span>

              <div>
                <strong>{error}</strong>
                <small>Please enter a correctly formatted email address.</small>
              </div>
            </div>
          )}

          <label>
            Email Address

            <div className="minimal-input">
              <span aria-hidden="true">✉</span>

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
            <span className="minimal-label-row">
              Password

              <Link to="/login" className="minimal-small-link">
                Forgot password?
              </Link>
            </span>

            <div className="minimal-input">
              <span aria-hidden="true">▢</span>

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={update}
                placeholder="Enter your password"
                autoComplete="current-password"
              />

              <button
                type="button"
                className="minimal-eye"
                onClick={() => setShowPassword((current) => !current)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? "◉" : "⊙"}
              </button>
            </div>
          </label>

          <label className="minimal-check-row">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />

            <span>Keep me signed in</span>
          </label>

          <button
            className="minimal-login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login →"}
          </button>
        </form>

        <div className="minimal-auth-divider">
          <span />
          <p>OR CONTINUE WITH</p>
          <span />
        </div>

        <div className="minimal-social-row">
          <button type="button">Google</button>
          <button type="button"> Apple</button>
        </div>

        <p className="minimal-auth-bottom">
          Don't have an account? <Link to="/">Sign up</Link>
        </p>
      </section>
    </main>
  );
}