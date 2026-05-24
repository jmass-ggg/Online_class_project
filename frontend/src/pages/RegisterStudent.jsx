import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { authApi } from "../api/authApi";
import { useToast } from "../context/ToastContext.jsx";
import {
  parseApiError,
  required,
  validateEmail,
  validatePasswords,
} from "../utils/validators";

const initialForm = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  phone: "",
  address: "",
  date_of_birth: "",
  guardian_name: "",
};

export default function RegisterStudent() {
  const [form, setForm] = useState(initialForm);
  const [activeTab, setActiveTab] = useState("account");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const update = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const fullName = `${form.first_name} ${form.last_name}`.trim();

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!required(fullName)) {
      return setError("Full name is required");
    }

    if (!validateEmail(form.email)) {
      return setError("A valid email is required");
    }

    const passwordError = validatePasswords(form.password, form.password);

    if (passwordError) {
      return setError(passwordError);
    }

    const payload = {
      full_name: fullName,
      email: form.email.trim().toLowerCase(),
      password: form.password,
      phone: form.phone.trim(),
      address: form.address.trim(),
      date_of_birth: form.date_of_birth || null,
      guardian_name: form.guardian_name.trim(),
    };

    try {
      setLoading(true);

      await authApi.studentRegister(payload);

      showToast("Student account created successfully. Please login.", "success");

      navigate("/login", {
        replace: true,
        state: {
          message: "Student account created successfully. Please login.",
        },
      });
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="split-auth-page">
      <section className="auth-visual auth-visual-student">
  <div className="student-photo-card">
    <img
      src="/studentphoto.webp"
      alt="Student learning online"
      className="auth-side-photo"
    />
  </div>

  <div className="floating-caption">
    <h2>Empowering Student Success</h2>
    <p>
      Join a global community of learners. Access top-tier resources,
      connect with expert educators, and track your progress in real time.
    </p>
  </div>
</section>
      <section className="auth-form-side">
        <div className="auth-panel">
          <div className="small-auth-icon">🎓</div>

          <h1>Create Student Account</h1>
          <p>Fill in your details to join your classroom</p>

          <div className="social-row">
            <button type="button">G&nbsp; Google</button>
            <button type="button">&nbsp; Apple</button>
          </div>

          <div className="auth-divider">
            <span />
            <p>OR REGISTER WITH EMAIL</p>
            <span />
          </div>

          <div className="form-tabs">
            <button
              type="button"
              className={activeTab === "account" ? "active" : ""}
              onClick={() => setActiveTab("account")}
            >
              Account Info
            </button>
            <button
              type="button"
              className={activeTab === "profile" ? "active" : ""}
              onClick={() => setActiveTab("profile")}
            >
              Student Details
            </button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {error && <div className="form-error">{error}</div>}

            {activeTab === "account" && (
              <>
                <div className="two-column compact">
                  <label>
                    First Name
                    <input
                      name="first_name"
                      value={form.first_name}
                      onChange={update}
                      placeholder="Jane"
                    />
                  </label>

                  <label>
                    Last Name
                    <input
                      name="last_name"
                      value={form.last_name}
                      onChange={update}
                      placeholder="Doe"
                    />
                  </label>
                </div>

                <label>
                  Email Address
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={update}
                    placeholder="jane.doe@example.com"
                  />
                </label>

                <label>
                  Password
                  <div className="password-field">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={update}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </label>

                <button
                  className="auth-primary-button"
                  type="button"
                  onClick={() => setActiveTab("profile")}
                >
                  Next →
                </button>
              </>
            )}

            {activeTab === "profile" && (
              <>
                <label>
                  Phone Number
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={update}
                    placeholder="+1 (555) 000-0000"
                  />
                </label>

                <label>
                  Date of Birth
                  <input
                    type="date"
                    name="date_of_birth"
                    value={form.date_of_birth}
                    onChange={update}
                  />
                </label>

                <label>
                  Guardian Name
                  <input
                    name="guardian_name"
                    value={form.guardian_name}
                    onChange={update}
                    placeholder="Guardian name"
                  />
                </label>

                <label>
                  Address
                  <input
                    name="address"
                    value={form.address}
                    onChange={update}
                    placeholder="Address"
                  />
                </label>

                

                <button
                  className="auth-primary-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Account →"}
                </button>
              </>
            )}
          </form>

          <p className="auth-bottom-text">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}