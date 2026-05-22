import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import { batchApi } from "../../api/batchApi";
import { courseApi } from "../../api/courseApi";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError, required, validateDateRange } from "../../utils/validators";

const initialForm = { course: "", name: "", description: "", max_students: 50, allow_self_enrollment: true, is_active: true, start_date: "", end_date: "" };

export default function CreateBatch() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ ...initialForm, course: location.state?.courseId || "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await courseApi.getCourses();
        setCourses(response.data || []);
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const update = (event) => {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!required(form.course)) return setError("Course is required");
    if (!required(form.name)) return setError("Classroom name is required");
    if (!required(form.max_students) || Number(form.max_students) <= 0) return setError("Max students must be positive");
    const dateError = validateDateRange(form.start_date, form.end_date);
    if (dateError) return setError(dateError);

    try {
      setSaving(true);
      await batchApi.createBatch({ ...form, course: Number(form.course), max_students: Number(form.max_students) });
      showToast("Classroom created", "success");
      navigate("/teacher/batches");
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading courses" />;

  return (
    <div className="page-stack narrow-page">
      <PageHeader title="Create Classroom / Batch" description="Create a Google Classroom style learning space under a course." />
      <form className="form panel-form" onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}
        <label>Course<select name="course" value={form.course} onChange={update}><option value="">Select course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
        <label>Name<input name="name" value={form.name} onChange={update} placeholder="Python Morning Batch" /></label>
        <label>Description<textarea name="description" value={form.description} onChange={update} rows="4" placeholder="Morning classroom" /></label>
        <div className="two-column compact">
          <label>Max students<input type="number" min="1" name="max_students" value={form.max_students} onChange={update} /></label>
          <label>Start date<input type="date" name="start_date" value={form.start_date} onChange={update} /></label>
          <label>End date<input type="date" name="end_date" value={form.end_date} onChange={update} /></label>
        </div>
        <label className="checkbox-label"><input type="checkbox" name="allow_self_enrollment" checked={form.allow_self_enrollment} onChange={update} /> Allow self enrollment</label>
        <label className="checkbox-label"><input type="checkbox" name="is_active" checked={form.is_active} onChange={update} /> Classroom is active</label>
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Create classroom"}</button>
      </form>
    </div>
  );
}
