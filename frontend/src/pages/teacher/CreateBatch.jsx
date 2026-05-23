import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { batchApi } from "../../api/batchApi";
import { courseApi } from "../../api/courseApi";
import Loader from "../../components/Loader.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError, required } from "../../utils/validators";

const initialForm = {
  course: "",
  name: "",
  description: "",
  max_students: 50,
  allow_self_enrollment: true,
  is_active: true,
  start_date: "",
  end_date: "",
};

export default function CreateBatch() {
  const [form, setForm] = useState(initialForm);
  const [courses, setCourses] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await courseApi.getCourses();

        const results = Array.isArray(response.data)
          ? response.data
          : response.data?.results || [];

        setCourses(results);

        const courseId = location.state?.courseId;

        if (courseId) {
          setForm((current) => ({
            ...current,
            course: String(courseId),
          }));
        }
      } catch (err) {
        setError(parseApiError(err, "Could not load courses"));
      } finally {
        setPageLoading(false);
      }
    };

    loadCourses();
  }, [location.state]);

  const update = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!required(form.course)) {
      return setError("Please select a course");
    }

    if (!required(form.name)) {
      return setError("Classroom name is required");
    }

    if (!required(form.start_date)) {
      return setError("Start date is required");
    }

    if (!required(form.end_date)) {
      return setError("End date is required");
    }

    const payload = {
      course: form.course,
      name: form.name.trim(),
      description: form.description.trim(),
      max_students: Number(form.max_students),
      allow_self_enrollment: Boolean(form.allow_self_enrollment),
      is_active: Boolean(form.is_active),
      start_date: form.start_date,
      end_date: form.end_date,
    };

    try {
      setLoading(true);

      await batchApi.createBatch(payload);

      showToast("Classroom created successfully", "success");
      navigate("/teacher/batches", { replace: true });
    } catch (err) {
      setError(parseApiError(err, "Could not create classroom"));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <Loader label="Loading courses" />;
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Classroom Live</p>
          <h1>Create classroom</h1>
          <p>Create a Google Classroom style learning space under a course.</p>
        </div>
      </div>

      <div className="form-card">
        {error && <div className="form-error">{error}</div>}

        <form className="form" onSubmit={submit}>
          <label>
            Course
            <select name="course" value={form.course} onChange={update}>
              <option value="">Select course</option>

              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            Name
            <input
              name="name"
              value={form.name}
              onChange={update}
              placeholder="Python Morning Batch"
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={update}
              placeholder="Describe this classroom"
              rows="4"
            />
          </label>

          <div className="form-row">
            <label>
              Max students
              <input
                type="number"
                name="max_students"
                min="1"
                value={form.max_students}
                onChange={update}
              />
            </label>

            <label>
              Start date
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={update}
              />
            </label>

            <label>
              End date
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={update}
              />
            </label>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              name="allow_self_enrollment"
              checked={form.allow_self_enrollment}
              onChange={update}
            />
            Allow self enrollment
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={update}
            />
            Classroom is active
          </label>

          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating classroom..." : "Create classroom"}
          </button>
        </form>
      </div>
    </section>
  );
}