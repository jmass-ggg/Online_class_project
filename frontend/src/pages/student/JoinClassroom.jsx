import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Loader from "../../components/Loader.jsx";
import { enrollmentApi } from "../../api/enrollmentApi";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError, required } from "../../utils/validators";
import { enrollmentToBatch } from "../../utils/enrollmentHelpers";

function getResults(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function getBatchName(batch) {
  return (
    batch?.name ||
    batch?.batch_name ||
    batch?.classroom_name ||
    `Classroom ${batch?.id || ""}`
  );
}

function getCourseTitle(batch) {
  if (typeof batch?.course === "object") {
    return batch.course?.title || batch.course?.name || "Course";
  }

  return batch?.course_title || batch?.course_name || "Course";
}

export default function JoinClassroom() {
  const [code, setCode] = useState("");
  const [recentClassrooms, setRecentClassrooms] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentLoading, setRecentLoading] = useState(true);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadRecentClassrooms = async () => {
    try {
      setRecentLoading(true);

      const response = await enrollmentApi.getMyClassrooms();
      const rows = getResults(response.data).map(enrollmentToBatch);

      setRecentClassrooms(rows);
    } catch {
      setRecentClassrooms([]);
    } finally {
      setRecentLoading(false);
    }
  };

  useEffect(() => {
    loadRecentClassrooms();
  }, []);

  const submit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const joinCode = code.trim().toUpperCase();

    if (!required(joinCode)) {
      return setError("Enrollment code is required");
    }

    try {
      setLoading(true);

      const response = await enrollmentApi.joinClassroom(joinCode);
      const batchName =
        response.data?.data?.batch_name ||
        response.data?.batch_name ||
        "classroom";

      setMessage(`Successfully joined ${batchName}`);
      showToast(`Successfully joined ${batchName}`, "success");

      await loadRecentClassrooms();

      window.setTimeout(() => {
        navigate("/student/batches");
      }, 900);
    } catch (err) {
      setError(
        parseApiError(
          err,
          "Invalid code, already enrolled, classroom inactive, or login required"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="student-page student-join-page">
      <PageHeader
        title="Join Classroom"
        description="Enter the enrollment code shared by your teacher."
      />

      <form className="student-join-card" onSubmit={submit}>
        <label>
          Class code

          <input
            className="student-code-input"
            value={code}
            maxLength={12}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="ENTER CLASS CODE, E.G. ELDCKV"
          />
        </label>

        <p className="student-code-help">
          <span aria-hidden="true">⌘</span>
          Codes are usually 6 characters, e.g. ELDCKV
        </p>

        {error && <div className="form-error">{error}</div>}
        {message && <div className="form-success">{message}</div>}

        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? "Joining..." : "Join Classroom"}
        </button>
      </form>

      <section className="student-recent-panel">
        <h3>Recently joined classrooms</h3>

        {recentLoading ? (
          <Loader label="Loading classrooms" />
        ) : recentClassrooms.length ? (
          <div className="student-recent-classrooms">
            {recentClassrooms.slice(0, 3).map((batch) => (
              <article key={batch.id} className="student-recent-classroom-card">
                <div>
                  <span>{getCourseTitle(batch)}</span>
                  <strong>{getBatchName(batch)}</strong>
                </div>

                <em aria-hidden="true">AC</em>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No classrooms joined yet"
            message="Enter a class code above to get started."
          />
        )}
      </section>
    </section>
  );
}