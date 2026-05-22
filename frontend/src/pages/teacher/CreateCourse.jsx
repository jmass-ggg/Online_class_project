import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader.jsx";
import { courseApi } from "../../api/courseApi";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError, required } from "../../utils/validators";

const initialForm = { title: "", description: "", category: "", level: "", duration_weeks: "" };

export default function CreateCourse() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!required(form.title)) return setError("Title is required");
    if (!required(form.description)) return setError("Description is required");
    if (!required(form.category)) return setError("Category is required");
    if (!required(form.level)) return setError("Level is required");
    if (!required(form.duration_weeks) || Number(form.duration_weeks) <= 0) return setError("Duration must be a positive number");

    try {
      setLoading(true);
      await courseApi.createCourse({ ...form, duration_weeks: Number(form.duration_weeks) });
      showToast("Course created", "success");
      navigate("/teacher/courses");
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack narrow-page">
      <PageHeader title="Create Course" description="Add a course that classrooms can be created under." />
      <form className="form panel-form" onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}
        <label>Title<input name="title" value={form.title} onChange={update} placeholder="Python Programming" /></label>
        <label>Description<textarea name="description" value={form.description} onChange={update} rows="5" placeholder="Learn Python from basic to advanced" /></label>
        <div className="two-column compact">
          <label>Category<input name="category" value={form.category} onChange={update} placeholder="Programming" /></label>
          <label>Level<input name="level" value={form.level} onChange={update} placeholder="Beginner" /></label>
          <label>Duration weeks<input type="number" min="1" name="duration_weeks" value={form.duration_weeks} onChange={update} placeholder="8" /></label>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Saving..." : "Create course"}</button>
      </form>
    </div>
  );
}
