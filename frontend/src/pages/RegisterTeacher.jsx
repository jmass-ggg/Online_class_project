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
  full_name: "",
  email: "",
  password: "",
  confirm_password: "",
  phone: "",
  qualification: "",
  experience: "",
  bio: "",
};

export default function RegisterTeacher() {
  const [form, setForm] = useState(initialForm);
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

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!required(form.full_name)) {
      return setError("Full name is required");
    }

    if (!validateEmail(form.email)) {
      return setError("A valid email is required");
    }

    const passwordError = validatePasswords(
      form.password,
      form.confirm_password
    );

    if (passwordError) {
      return setError(passwordError);
    }

    const payload = {
      full_name: form.full_name.trim(),
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
    <section className="auth-card auth-card-wide">
      <div className="auth-brand">
        <div className="brand-mark">CL</div>
        <span>Teacher Registration</span>
      </div>

      <h1>Create your teacher account</h1>
      <p>Start creating courses, classrooms, sessions, and attendance records.</p>

      <form className="form two-column" onSubmit={submit}>
        {error && <div className="form-error span-2">{error}</div>}

        <label>
          Full name
          <input
            name="full_name"
            value={form.full_name}
            onChange={update}
            placeholder="John Teacher"
          />
        </label>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={update}
            placeholder="teacher@example.com"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={update}
          />
        </label>

        <label>
          Confirm password
          <input
            type="password"
            name="confirm_password"
            value={form.confirm_password}
            onChange={update}
          />
        </label>

        <label>
          Phone
          <input
            name="phone"
            value={form.phone}
            onChange={update}
            placeholder="Phone number"
          />
        </label>

        <label>
          Qualification
          <input
            name="qualification"
            value={form.qualification}
            onChange={update}
            placeholder="Qualification"
          />
        </label>

        <label>
          Experience
          <input
            name="experience"
            value={form.experience}
            onChange={update}
            placeholder="Experience"
          />
        </label>

        <label className="span-2">
          Bio
          <textarea
            name="bio"
            value={form.bio}
            onChange={update}
            placeholder="Short bio"
            rows="4"
          />
        </label>

        <button
          className="btn btn-primary btn-block span-2"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Register as teacher"}
        </button>
      </form>

      <div className="auth-switch">
        <span>Already registered?</span>
        <Link to="/login">Login</Link>
      </div>
    </section>
  );
}