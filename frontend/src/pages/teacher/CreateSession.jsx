import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import { batchApi } from "../../api/batchApi";
import { classSessionApi } from "../../api/classSessionApi";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError, required, validateTimeRange } from "../../utils/validators";

const initialForm = { classroom: "", title: "", description: "", scheduled_date: "", start_time: "", end_time: "" };

export default function CreateSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState({ ...initialForm, classroom: location.state?.classroomId || "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await batchApi.getBatches();
        setBatches(response.data || []);
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!required(form.classroom)) return setError("Classroom is required");
    if (!required(form.title)) return setError("Title is required");
    if (!required(form.scheduled_date)) return setError("Scheduled date is required");
    const timeError = validateTimeRange(form.start_time, form.end_time);
    if (timeError) return setError(timeError);

    try {
      setSaving(true);
      await classSessionApi.createSession({ ...form, classroom: Number(form.classroom), start_time: `${form.start_time}:00`, end_time: `${form.end_time}:00` });
      showToast("Live class scheduled", "success");
      navigate("/teacher/sessions");
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading classrooms" />;

  return (
    <div className="page-stack narrow-page">
      <PageHeader title="Create Live Class" description="Schedule a LiveKit-backed session for a classroom." />
      <form className="form panel-form" onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}
        <label>Classroom<select name="classroom" value={form.classroom} onChange={update}><option value="">Select classroom</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.course_title} — {batch.name}</option>)}</select></label>
        <label>Title<input name="title" value={form.title} onChange={update} placeholder="Introduction to Python" /></label>
        <label>Description<textarea name="description" value={form.description} onChange={update} rows="4" placeholder="First live class" /></label>
        <div className="two-column compact">
          <label>Scheduled date<input type="date" name="scheduled_date" value={form.scheduled_date} onChange={update} /></label>
          <label>Start time<input type="time" name="start_time" value={form.start_time} onChange={update} /></label>
          <label>End time<input type="time" name="end_time" value={form.end_time} onChange={update} /></label>
        </div>
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Scheduling..." : "Create live class"}</button>
      </form>
    </div>
  );
}
