import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { batchApi } from "../../api/batchApi";
import { classSessionApi } from "../../api/classSessionApi";
import Loader from "../../components/Loader.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError, required } from "../../utils/validators";

const initialForm = {
  classroom: "",
  title: "",
  description: "",
  scheduled_date: "",
  start_time: "",
  end_time: "",
};

export default function CreateSession() {
  const [form, setForm] = useState(initialForm);
  const [batches, setBatches] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const response = await batchApi.getBatches();

        const results = Array.isArray(response.data)
          ? response.data
          : response.data?.results || [];

        setBatches(results);

        const classroomId = location.state?.classroomId;

        if (classroomId) {
          setForm((current) => ({
            ...current,
            classroom: String(classroomId),
          }));
        }
      } catch (err) {
        setError(parseApiError(err, "Could not load classrooms"));
      } finally {
        setPageLoading(false);
      }
    };

    loadBatches();
  }, [location.state]);

  const update = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const normalizeTime = (value) => {
    if (!value) return "";
    return value.length === 5 ? `${value}:00` : value;
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!required(form.classroom)) {
      return setError("Please select a classroom");
    }

    if (!required(form.title)) {
      return setError("Title is required");
    }

    if (!required(form.scheduled_date)) {
      return setError("Scheduled date is required");
    }

    if (!required(form.start_time)) {
      return setError("Start time is required");
    }

    if (!required(form.end_time)) {
      return setError("End time is required");
    }

    const payload = {
      classroom: form.classroom,
      title: form.title.trim(),
      description: form.description.trim(),
      scheduled_date: form.scheduled_date,
      start_time: normalizeTime(form.start_time),
      end_time: normalizeTime(form.end_time),
    };

    try {
      setLoading(true);

      await classSessionApi.createSession(payload);

      showToast("Live class created successfully", "success");
      navigate("/teacher/sessions", { replace: true });
    } catch (err) {
      setError(parseApiError(err, "Could not create live class"));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <Loader label="Loading classrooms" />;
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Classroom Live</p>
          <h1>Create live class</h1>
          <p>Schedule a LiveKit-backed session for a classroom.</p>
        </div>
      </div>

      <div className="form-card">
        {error && <div className="form-error">{error}</div>}

        <form className="form" onSubmit={submit}>
          <label>
            Classroom
            <select
              name="classroom"
              value={form.classroom}
              onChange={update}
            >
              <option value="">Select classroom</option>

              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.course_title || `Course #${batch.course}`} — {batch.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Title
            <input
              name="title"
              value={form.title}
              onChange={update}
              placeholder="Introduction to Python"
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={update}
              placeholder="Describe this live class"
              rows="4"
            />
          </label>

          <div className="form-row">
            <label>
              Scheduled date
              <input
                type="date"
                name="scheduled_date"
                value={form.scheduled_date}
                onChange={update}
              />
            </label>

            <label>
              Start time
              <input
                type="time"
                name="start_time"
                value={form.start_time}
                onChange={update}
              />
            </label>

            <label>
              End time
              <input
                type="time"
                name="end_time"
                value={form.end_time}
                onChange={update}
              />
            </label>
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? "Creating live class..." : "Create live class"}
          </button>
        </form>
      </div>
    </section>
  );
}