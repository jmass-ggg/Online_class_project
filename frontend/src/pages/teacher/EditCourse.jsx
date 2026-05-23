import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import { courseApi } from "../../api/courseApi";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError, required } from "../../utils/validators";
import {
  COURSE_CATEGORY_OPTIONS,
  COURSE_LEVEL_OPTIONS,
} from "../../utils/constants";

const initialForm = {
  title: "",
  description: "",
  category: "",
  level: "",
  duration_weeks: "",
};

export default function EditCourse() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setPageLoading(true);

        const response = await courseApi.getCourse(id);
        const course = response.data;

        setForm({
          title: course.title || "",
          description: course.description || "",
          category: course.category || "",
          level: course.level || "",
          duration_weeks: course.duration_weeks || "",
        });
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setPageLoading(false);
      }
    };

    loadCourse();
  }, [id]);

  const update = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!required(form.title)) {
      return setError("Title is required");
    }

    if (!required(form.description)) {
      return setError("Description is required");
    }

    if (!required(form.category)) {
      return setError("Category is required");
    }

    if (!required(form.level)) {
      return setError("Level is required");
    }

    if (!required(form.duration_weeks) || Number(form.duration_weeks) <= 0) {
      return setError("Duration must be a positive number");
    }

    try {
      setLoading(true);

      await courseApi.updateCourse(id, {
        title: form.title,
        description: form.description,
        category: form.category,
        level: form.level,
        duration_weeks: Number(form.duration_weeks),
      });

      showToast("Course updated", "success");
      navigate(`/teacher/courses/${id}`);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <Loader />;
  }

  return (
    <div className="page-stack narrow-page">
      <PageHeader
        title="Edit Course"
        description="Update course information."
      />

      <form className="form panel-form" onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}

        <label>
          Title
          <input
            name="title"
            value={form.title}
            onChange={update}
            placeholder="Python Programming"
          />
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={update}
            rows="5"
            placeholder="Learn Python from basic to advanced"
          />
        </label>

        <div className="two-column compact">
          <label>
            Category
            <select name="category" value={form.category} onChange={update}>
              <option value="">Select category</option>

              {COURSE_CATEGORY_OPTIONS.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Level
            <select name="level" value={form.level} onChange={update}>
              <option value="">Select level</option>

              {COURSE_LEVEL_OPTIONS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Duration weeks
            <input
              type="number"
              min="1"
              name="duration_weeks"
              value={form.duration_weeks}
              onChange={update}
              placeholder="8"
            />
          </label>
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Update course"}
        </button>
      </form>
    </div>
  );
}