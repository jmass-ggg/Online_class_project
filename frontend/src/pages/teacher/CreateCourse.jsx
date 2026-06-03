import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader.jsx";
import { courseApi } from "../../api/courseApi";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError, required } from "../../utils/validators";

const COURSE_CATEGORY_OPTIONS = [
  { value: "PROGRAMMING", label: "Programming" },
  { value: "DESIGN", label: "Design" },
  { value: "BUSINESS", label: "Business" },
  { value: "MARKETING", label: "Marketing" },
  { value: "DATA_SCIENCE", label: "Data Science" },
  { value: "LANGUAGE", label: "Language" },
  { value: "OTHER", label: "Other" },
];

const COURSE_LEVEL_OPTIONS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const MAX_DURATION_WEEKS = 2147483647;

const initialForm = {
  title: "",
  description: "",
  category: "PROGRAMMING",
  level: "BEGINNER",
  duration_weeks: "",
};

export default function CreateCourse() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();

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

    const durationWeeks = Number(form.duration_weeks);

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

    if (
      !required(form.duration_weeks) ||
      !Number.isInteger(durationWeeks) ||
      durationWeeks <= 0 ||
      durationWeeks > MAX_DURATION_WEEKS
    ) {
      return setError(
        `Duration must be a positive whole number up to ${MAX_DURATION_WEEKS}`
      );
    }

    try {
      setLoading(true);

      await courseApi.createCourse({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        level: form.level,
        duration_weeks: durationWeeks,
      });

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
      <PageHeader
        title="Create Course"
        description="Add a course that classrooms can be created under."
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
              max={MAX_DURATION_WEEKS}
              step="1"
              name="duration_weeks"
              value={form.duration_weeks}
              onChange={update}
              placeholder="8"
            />
          </label>
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Create course"}
        </button>
      </form>
    </div>
  );
}