import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import { courseApi } from "../../api/courseApi";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError, required } from "../../utils/validators";

export default function EditCourse() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const response = await courseApi.getCourse(id);
        setForm(response.data);
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!required(form.title) || !required(form.description) || !required(form.category) || !required(form.level)) return setError("All course fields are required");
    if (!required(form.duration_weeks) || Number(form.duration_weeks) <= 0) return setError("Duration must be a positive number");

    try {
      setSaving(true);
      await courseApi.updateCourse(id, { ...form, duration_weeks: Number(form.duration_weeks) });
      showToast("Course updated", "success");
      navigate(`/teacher/courses/${id}`);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading course" />;
  if (!form) return <div className="form-error">{error || "Course not found"}</div>;

  return (
    <div className="page-stack narrow-page">
      <PageHeader title="Edit Course" description="Update the course details shown to students." />
      <form className="form panel-form" onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}
        <label>Title<input name="title" value={form.title || ""} onChange={update} /></label>
        <label>Description<textarea name="description" value={form.description || ""} onChange={update} rows="5" /></label>
        <div className="two-column compact">
          <label>Category<input name="category" value={form.category || ""} onChange={update} /></label>
          <label>Level<input name="level" value={form.level || ""} onChange={update} /></label>
          <label>Duration weeks<input type="number" min="1" name="duration_weeks" value={form.duration_weeks || ""} onChange={update} /></label>
        </div>
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
      </form>
    </div>
  );
}
