import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
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

const initialCourseForm = {
  title: "",
  description: "",
  category: "PROGRAMMING",
  level: "BEGINNER",
  duration_weeks: "",
};

function getResults(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function getCourseStatus(course) {
  return course?.is_active === false ? "INACTIVE" : "ACTIVE";
}

function getCategoryLabel(value) {
  return (
    COURSE_CATEGORY_OPTIONS.find((category) => category.value === value)?.label ||
    value ||
    "—"
  );
}

function getLevelLabel(value) {
  return (
    COURSE_LEVEL_OPTIONS.find((level) => level.value === value)?.label ||
    value ||
    "—"
  );
}

export default function TeacherCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [popupMode, setPopupMode] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [form, setForm] = useState(initialCourseForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const { showToast } = useToast();

  const loadCourses = async () => {
    setLoading(true);

    try {
      const response = await courseApi.getCourses();
      setCourses(getResults(response.data));
    } catch (err) {
      showToast(parseApiError(err, "Could not load courses"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const courseStats = useMemo(() => {
    return {
      totalCourses: courses.length,
      activeCourses: courses.filter((course) => course.is_active !== false).length,
    };
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch = query
        ? [
            course.title,
            course.description,
            course.category,
            course.level,
            getCategoryLabel(course.category),
            getLevelLabel(course.level),
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)
        : true;

      const matchesLevel =
        levelFilter === "ALL" || course.level === levelFilter;

      const matchesCategory =
        categoryFilter === "ALL" || course.category === categoryFilter;

      return matchesSearch && matchesLevel && matchesCategory;
    });
  }, [courses, searchTerm, levelFilter, categoryFilter]);

  const closePopup = () => {
    setPopupMode(null);
    setSelectedCourse(null);
    setForm(initialCourseForm);
    setFormError("");
    setSaving(false);
  };

  const openCreate = () => {
    setPopupMode("create");
    setSelectedCourse(null);
    setForm(initialCourseForm);
    setFormError("");
  };

  const openDetails = (course) => {
    setPopupMode("details");
    setSelectedCourse(course);
  };

  const openEdit = (course) => {
    setPopupMode("edit");
    setSelectedCourse(course);
    setForm({
      title: course.title || "",
      description: course.description || "",
      category: course.category || "PROGRAMMING",
      level: course.level || "BEGINNER",
      duration_weeks: course.duration_weeks || "",
    });
    setFormError("");
  };

  const updateForm = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const validateCourseForm = () => {
    const durationWeeks = Number(form.duration_weeks);

    if (!required(form.title)) return "Title is required";
    if (!required(form.description)) return "Description is required";
    if (!required(form.category)) return "Category is required";
    if (!required(form.level)) return "Level is required";

    if (
      !required(form.duration_weeks) ||
      !Number.isInteger(durationWeeks) ||
      durationWeeks <= 0 ||
      durationWeeks > MAX_DURATION_WEEKS
    ) {
      return `Duration must be a positive whole number up to ${MAX_DURATION_WEEKS}`;
    }

    return "";
  };

  const getCoursePayload = () => ({
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category,
    level: form.level,
    duration_weeks: Number(form.duration_weeks),
  });

  const submitCreate = async (event) => {
    event.preventDefault();
    setFormError("");

    const validationError = validateCourseForm();

    if (validationError) {
      return setFormError(validationError);
    }

    try {
      setSaving(true);

      await courseApi.createCourse(getCoursePayload());

      showToast("Course created", "success");
      closePopup();
      loadCourses();
    } catch (err) {
      setFormError(parseApiError(err, "Could not create course"));
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!selectedCourse) return;

    const validationError = validateCourseForm();

    if (validationError) {
      return setFormError(validationError);
    }

    try {
      setSaving(true);

      await courseApi.updateCourse(selectedCourse.id, getCoursePayload());

      showToast("Course updated", "success");
      closePopup();
      loadCourses();
    } catch (err) {
      setFormError(parseApiError(err, "Could not update course"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!target) return;

    setDeleting(true);

    try {
      await courseApi.deleteCourse(target.id);

      showToast("Course deleted", "success");
      setTarget(null);
      closePopup();
      loadCourses();
    } catch (err) {
      showToast(parseApiError(err, "Could not delete course"), "error");
    } finally {
      setDeleting(false);
    }
  };

  const renderCourseForm = (onSubmit, submitLabel) => (
    <form className="drawer-form" onSubmit={onSubmit}>
      <div className="drawer-body">
        {formError && <div className="form-error">{formError}</div>}

        <label>
          Title
          <input
            name="title"
            value={form.title}
            onChange={updateForm}
            placeholder="Python Programming"
          />
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={updateForm}
            rows="5"
            placeholder="Learn Python from basic to advanced"
          />
        </label>

        <div className="two-column compact">
          <label>
            Category
            <select name="category" value={form.category} onChange={updateForm}>
              {COURSE_CATEGORY_OPTIONS.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Level
            <select name="level" value={form.level} onChange={updateForm}>
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
              onChange={updateForm}
              placeholder="8"
            />
          </label>
        </div>
      </div>

      <div className="drawer-footer">
        <button className="btn btn-ghost" type="button" onClick={closePopup}>
          Cancel
        </button>

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );

  if (loading) return <Loader label="Loading courses" />;

  return (
    <div className="page-stack teacher-courses-page">
      <PageHeader
        eyebrow="Courses"
        title="Manage your courses"
        description="Create and manage courses for your classrooms."
        actions={
          <button className="btn btn-primary" type="button" onClick={openCreate}>
            + Create Course
          </button>
        }
      />

      <section className="classroom-stats-grid">
        <article className="classroom-stat-card">
          <div>
            <span>Total Courses</span>
            <strong>{courseStats.totalCourses}</strong>
            <small>All created courses</small>
          </div>

          <em aria-hidden="true">◈</em>
        </article>

        <article className="classroom-stat-card">
          <div>
            <span>Active Courses</span>
            <strong>{courseStats.activeCourses}</strong>
            <small>Courses available for classrooms</small>
          </div>

          <em aria-hidden="true">✦</em>
        </article>
      </section>

      <section className="classroom-list-section">
        <div className="classroom-list-toolbar">
          <h3>All Courses</h3>

          <div className="classroom-toolbar-actions">
            <div className="classroom-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="ALL">All categories</option>
              {COURSE_CATEGORY_OPTIONS.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
            >
              <option value="ALL">All levels</option>
              {COURSE_LEVEL_OPTIONS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredCourses.length ? (
          <div className="classroom-card-grid">
            {filteredCourses.map((course) => (
              <article key={course.id || course.title} className="classroom-card">
                <div className="classroom-card-top">
                  <span className="classroom-batch-pill">
                    {getCategoryLabel(course.category)}
                  </span>

                  <StatusBadge status={getCourseStatus(course)} />
                </div>

                <h3>{course.title}</h3>

                <p>{course.description || "No description added."}</p>

                <div className="classroom-card-meta">
                  <div>
                    <small>Level</small>
                    <strong>{getLevelLabel(course.level)}</strong>
                  </div>

                  <div>
                    <small>Duration</small>
                    <strong>{course.duration_weeks} weeks</strong>
                  </div>
                </div>

                <div className="classroom-card-actions">
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => openDetails(course)}
                  >
                    View details
                  </button>

                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => openEdit(course)}
                  >
                    Edit
                  </button>

                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => setTarget(course)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No courses found"
            message="Create a course or adjust your search/filter."
            action={
              <button className="btn btn-primary" type="button" onClick={openCreate}>
                Create Course
              </button>
            }
          />
        )}
      </section>

      {popupMode && (
        <div className="drawer-layer" role="dialog" aria-modal="true">
          <button
            className="drawer-backdrop"
            type="button"
            aria-label="Close popup"
            onClick={closePopup}
          />

          <aside className="drawer-panel">
            <div className="drawer-accent" />

            <div className="drawer-header">
              <div>
                <h2>
                  {popupMode === "create"
                    ? "Create Course"
                    : popupMode === "edit"
                      ? "Edit Course"
                      : "Course Details"}
                </h2>

                <p>
                  {popupMode === "create"
                    ? "Create a course."
                    : popupMode === "edit"
                      ? "Update course information."
                      : "View course information."}
                </p>
              </div>

              <button className="drawer-close" type="button" onClick={closePopup}>
                ×
              </button>
            </div>

            {popupMode === "create" && renderCourseForm(submitCreate, "Create course")}

            {popupMode === "edit" &&
              selectedCourse &&
              renderCourseForm(submitEdit, "Save")}

            {popupMode === "details" && selectedCourse && (
              <>
                <div className="drawer-body">
                  <div className="details-hero">
                    <div className="card-topline">
                      <span className="pill">
                        {getCategoryLabel(selectedCourse.category)}
                      </span>

                      <StatusBadge status={getCourseStatus(selectedCourse)} />
                    </div>

                    <h3>{selectedCourse.title}</h3>
                  </div>

                  <div className="popup-description-box">
                    <strong>Description</strong>
                    <p>
                      {selectedCourse.description ||
                        "No description added for this course."}
                    </p>
                  </div>

                  <div className="meta-grid drawer-meta-grid">
                    <span>
                      <strong>Category</strong>
                      {getCategoryLabel(selectedCourse.category)}
                    </span>

                    <span>
                      <strong>Level</strong>
                      {getLevelLabel(selectedCourse.level)}
                    </span>

                    <span>
                      <strong>Duration</strong>
                      {selectedCourse.duration_weeks} weeks
                    </span>
                  </div>
                </div>

                <div className="drawer-footer">
                  <button className="btn btn-ghost" type="button" onClick={closePopup}>
                    Close
                  </button>

                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => openEdit(selectedCourse)}
                  >
                    Edit course
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(target)}
        title="Delete course"
        message={`Delete ${target?.title || "this course"}?`}
        onClose={() => setTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        confirmLabel="Delete course"
      />
    </div>
  );
}