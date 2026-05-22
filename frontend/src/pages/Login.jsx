import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { homeForRole } from "../utils/roleHelpers";
import { parseApiError, required, validateEmail } from "../utils/validators";

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && user?.role) return <Navigate to={homeForRole(user.role)} replace />;

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!validateEmail(form.email)) return setError("A valid email is required");
    if (!required(form.password)) return setError("Password is required");

    try {
      setLoading(true);
      const nextUser = await login(form);
      showToast("Welcome back", "success");
      const fallback = homeForRole(nextUser.role);
      const from = location.state?.from?.pathname;
      navigate(from && from !== "/login" ? from : fallback, { replace: true });
    } catch (err) {
      setError(parseApiError(err, "Invalid email or password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-card">
      <div className="auth-brand"><div className="brand-mark">CL</div><span>Classroom Live</span></div>
      <h1>Login to your classroom</h1>
      <p>Use your teacher or student account to continue.</p>
      <form className="form" onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}
        <label>Email<input type="email" name="email" value={form.email} onChange={update} placeholder="you@example.com" autoComplete="email" /></label>
        <label>Password<input type="password" name="password" value={form.password} onChange={update} placeholder="••••••••" autoComplete="current-password" /></label>
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
      </form>
      <div className="auth-switch">
        <span>New here?</span>
        <Link to="/register/teacher">Teacher register</Link>
        <Link to="/register/student">Student register</Link>
      </div>
    </section>
  );
}
