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
  address: "",
  date_of_birth: "",
  guardian_name: "",
};

export default function RegisterStudent() {
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
    <section className="auth-card auth-card-wide">
      <div className="auth-brand">
        <div className="brand-mark">CL</div>
        <span>Student Registration</span>
      </div>

      <h1>Create your student account</h1>
      <p>Join classrooms with an enrollment code after logging in.</p>

      <form className="form two-column" onSubmit={submit}>
        {error && <div className="form-error span-2">{error}</div>}

        <label>
          Full name
          <input
            name="full_name"
            value={form.full_name}
            onChange={update}
            placeholder="Ram Student"
          />
        </label>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={update}
            placeholder="student@example.com"
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
          Date of birth
          <input
            type="date"
            name="date_of_birth"
            value={form.date_of_birth}
            onChange={update}
          />
        </label>

        <label>
          Guardian name
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
          className="btn btn-primary btn-block span-2"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Register as student"}
        </button>
      </form>

      <div className="auth-switch">
        <span>Already registered?</span>
        <Link to="/login">Login</Link>
      </div>
    </section>
  );
}