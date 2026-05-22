import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader.jsx";
import { enrollmentApi } from "../../api/enrollmentApi";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError, required } from "../../utils/validators";

export default function JoinClassroom() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const joinCode = code.trim().toUpperCase();
    if (!required(joinCode)) return setError("Enrollment code is required");

    try {
      setLoading(true);
      const response = await enrollmentApi.joinClassroom(joinCode);
      const batchName = response.data?.data?.batch_name || response.data?.batch_name || "classroom";
      setMessage(`Successfully joined ${batchName}`);
      showToast(`Successfully joined ${batchName}`, "success");
      window.setTimeout(() => navigate("/student/dashboard"), 900);
    } catch (err) {
      setError(parseApiError(err, "Invalid code, already enrolled, classroom inactive, or login required"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack narrow-page">
      <PageHeader title="Join Classroom" description="Enter the enrollment code shared by your teacher." />
      <form className="join-code-card" onSubmit={submit}>
        <label>Class code<input className="code-input" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Enter class code, e.g. PYT8X2" /></label>
        {error && <div className="form-error">{error}</div>}
        {message && <div className="form-success">{message}</div>}
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>{loading ? "Joining..." : "Join Classroom"}</button>
      </form>
    </div>
  );
}
