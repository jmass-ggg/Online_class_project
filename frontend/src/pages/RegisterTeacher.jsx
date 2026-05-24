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
  qualification: "",
  experience: "",
  bio: "",
};

export default function RegisterTeacher() {
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
      qualification: form.qualification.trim(),
      experience: form.experience.trim(),
      bio: form.bio.trim(),
    };

    try {
      setLoading(true);

      await authApi.teacherRegister(payload);

      showToast("Teacher account created successfully. Please login.", "success");

      navigate("/login", {
        replace: true,
        state: {
          message: "Teacher account created successfully. Please login.",
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
      <section className="auth-visual auth-visual-teacher">
        <div className="teacher-illustration">
          <img
            src="/teacherphot.webp"
            alt="Teacher teaching students"
            className="auth-side-photo teacher-side-photo"
          />
        </div>

        <div className="visual-caption">
          <h2>Empower the next generation.</h2>
          <p>
            Join our community of passionate educators and reach students globally
            with our intuitive platform.
          </p>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-panel">
          <h1>Create Teacher Account</h1>
          <p>Fill in your details to start teaching</p>

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
              Profile Details
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
                    placeholder="jane@example.com"
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

                <label>
                  Phone Number
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={update}
                    placeholder="+1 (555) 000-0000"
                  />
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
                  Qualification
                  <input
                    name="qualification"
                    value={form.qualification}
                    onChange={update}
                    placeholder="M.Ed, B.Tech, PhD..."
                  />
                </label>

                <label>
                  Experience
                  <input
                    name="experience"
                    value={form.experience}
                    onChange={update}
                    placeholder="5 years"
                  />
                </label>

                <label>
                  Bio
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={update}
                    placeholder="Write a short teaching bio"
                    rows="4"
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