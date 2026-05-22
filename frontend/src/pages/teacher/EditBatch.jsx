import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import { batchApi } from "../../api/batchApi";
import { courseApi } from "../../api/courseApi";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError, required, validateDateRange } from "../../utils/validators";

export default function EditBatch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [batchRes, coursesRes] = await Promise.all([batchApi.getBatch(id), courseApi.getCourses()]);
        setForm(batchRes.data);
        setCourses(coursesRes.data || []);
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

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
      await batchApi.updateBatch(id, { ...form, course: Number(form.course), max_students: Number(form.max_students) });
      showToast("Classroom updated", "success");
      navigate(`/teacher/batches/${id}`);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading classroom" />;
  if (!form) return <div className="form-error">{error || "Classroom not found"}</div>;

  return (
    <div className="page-stack narrow-page">
      <PageHeader title="Edit Classroom / Batch" description="Update classroom details and enrollment settings." />
      <form className="form panel-form" onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}
        <label>Course<select name="course" value={form.course || ""} onChange={update}><option value="">Select course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
        <label>Name<input name="name" value={form.name || ""} onChange={update} /></label>
        <label>Description<textarea name="description" value={form.description || ""} onChange={update} rows="4" /></label>
        <div className="two-column compact">
          <label>Max students<input type="number" min="1" name="max_students" value={form.max_students || ""} onChange={update} /></label>
          <label>Start date<input type="date" name="start_date" value={form.start_date || ""} onChange={update} /></label>
          <label>End date<input type="date" name="end_date" value={form.end_date || ""} onChange={update} /></label>
        </div>
        <label className="checkbox-label"><input type="checkbox" name="allow_self_enrollment" checked={Boolean(form.allow_self_enrollment)} onChange={update} /> Allow self enrollment</label>
        <label className="checkbox-label"><input type="checkbox" name="is_active" checked={Boolean(form.is_active)} onChange={update} /> Classroom is active</label>
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
      </form>
    </div>
  );
}
