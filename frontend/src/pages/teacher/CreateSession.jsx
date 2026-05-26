import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { batchApi } from "../../api/batchApi";
import { classSessionApi } from "../../api/classSessionApi";
import Loader from "../../components/Loader.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError, required } from "../../utils/validators";

const initialForm = {
  classroom: "",
  scheduled_date: "",
  start_time: "",
  end_time: "",
};

const pad = (value) => String(value).padStart(2, "0");

const getTodayDate = () => {
  const now = new Date();

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join("-");
};

const getCurrentTime = () => {
  const now = new Date();

  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const normalizeTime = (value) => {
  if (!value) return "";
  return value.length === 5 ? `${value}:00` : value;
};

const isPastDateTime = (date, time) => {
  if (!date || !time) return false;

  const selectedDateTime = new Date(`${date}T${time}`);
  const now = new Date();

  return selectedDateTime < now;
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

  const today = useMemo(() => getTodayDate(), []);
  const currentTime = getCurrentTime();

  const minStartTime =
    form.scheduled_date === today ? currentTime : undefined;

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

    setForm((current) => {
      const next = {
        ...current,
        [name]: value,
      };

      if (name === "scheduled_date") {
        next.start_time = "";
        next.end_time = "";
      }

      if (name === "start_time") {
        next.end_time = "";
      }

      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!required(form.classroom)) {
      return setError("Please select a classroom");
    }

    if (!required(form.scheduled_date)) {
      return setError("Scheduled date is required");
    }

    if (form.scheduled_date < today) {
      return setError("Scheduled date cannot be before today");
    }

    if (!required(form.start_time)) {
      return setError("Start time is required");
    }

    if (isPastDateTime(form.scheduled_date, form.start_time)) {
      return setError("Start time cannot be before the current time");
    }

    if (!required(form.end_time)) {
      return setError("End time is required");
    }

    if (form.start_time >= form.end_time) {
      return setError("End time must be after start time");
    }

    const payload = {
      classroom: form.classroom,
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

          <div className="form-row">
            <label>
              Scheduled date
              <input
                type="date"
                name="scheduled_date"
                value={form.scheduled_date}
                min={today}
                onChange={update}
              />
            </label>

            <label>
              Start time
              <input
                type="time"
                name="start_time"
                value={form.start_time}
                min={minStartTime}
                onChange={update}
                disabled={!form.scheduled_date}
              />
            </label>

            <label>
              End time
              <input
                type="time"
                name="end_time"
                value={form.end_time}
                min={form.start_time || minStartTime}
                onChange={update}
                disabled={!form.start_time}
              />
            </label>
          </div>

          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating live class..." : "Create live class"}
          </button>
        </form>
      </div>
    </section>
  );
}