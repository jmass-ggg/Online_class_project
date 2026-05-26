import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import CourseCard from "../../components/CourseCard.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
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

export default function TeacherCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [popupMode, setPopupMode] = useState(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);

    try {
      const response = await courseApi.getCourses();
      setCourses(response.data || []);
    } catch (err) {
      showToast(parseApiError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const closePopup = () => {
    setPopupMode(null);
    setPopupLoading(false);
    setSelectedCourse(null);
    setForm(initialForm);
    setFormError("");
  };

  const fillForm = (course) => {
    setForm({
      title: course.title || "",
      description: course.description || "",
      category: course.category || "",
      level: course.level || "",
      duration_weeks: course.duration_weeks || "",
    });
  };

  const openDetails = async (course) => {
    setPopupMode("details");
    setSelectedCourse(null);
    setPopupLoading(true);

    try {
      const response = await courseApi.getCourse(course.id);
      setSelectedCourse(response.data);
    } catch (err) {
      showToast(parseApiError(err), "error");
      closePopup();
    } finally {
      setPopupLoading(false);
    }
  };

  const openEdit = async (course) => {
    setPopupMode("edit");
    setSelectedCourse(null);
    setPopupLoading(true);
    setFormError("");

    try {
      const response = await courseApi.getCourse(course.id);
      setSelectedCourse(response.data);
      fillForm(response.data);
    } catch (err) {
      showToast(parseApiError(err), "error");
      closePopup();
    } finally {
      setPopupLoading(false);
    }
  };

  const updateForm = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!selectedCourse) return;

    if (!required(form.title)) return setFormError("Title is required");
    if (!required(form.description)) return setFormError("Description is required");
    if (!required(form.category)) return setFormError("Category is required");
    if (!required(form.level)) return setFormError("Level is required");

    if (!required(form.duration_weeks) || Number(form.duration_weeks) <= 0) {
      return setFormError("Duration must be a positive number");
    }

    try {
      setSaving(true);

      await courseApi.updateCourse(selectedCourse.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        level: form.level,
        duration_weeks: Number(form.duration_weeks),
      });

      showToast("Course updated", "success");
      closePopup();
      load();
    } catch (err) {
      setFormError(parseApiError(err));
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
      load();
    } catch (err) {
      showToast(parseApiError(err), "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loader label="Loading courses" />;

  return (
    <div className="page-stack">
      <PageHeader
        title="Courses"
        description="Create and manage teacher-owned courses."
        actions={
          <Link className="btn btn-primary" to="/teacher/courses/create">
            Create course
          </Link>
        }
      />

      {courses.length ? (
        <div className="card-grid">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onDelete={setTarget}
              onView={openDetails}
              onEdit={openEdit}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Create your first course"
          action={
            <Link className="btn btn-primary" to="/teacher/courses/create">
              Create Course
            </Link>
          }
        />
      )}

      {popupMode && (
        <div className="drawer-layer">
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
                <h2>{popupMode === "edit" ? "Edit Course" : "Course Details"}</h2>
                <p>
                  {popupMode === "edit"
                    ? "Update course information."
                    : "Single course information from get course by ID API."}
                </p>
              </div>

              <button className="drawer-close" type="button" onClick={closePopup}>
                ×
              </button>
            </div>

            {popupLoading && <div className="popup-loading">Loading...</div>}

            {!popupLoading && popupMode === "details" && selectedCourse && (
              <div className="drawer-body">
                <div className="details-hero">
                  <div className="card-topline">
                    <span className="pill">{selectedCourse.category || "Course"}</span>
                    <StatusBadge
                      status={selectedCourse.is_active === false ? "INACTIVE" : "ACTIVE"}
                    />
                  </div>

                  <h3>{selectedCourse.title}</h3>
                </div>

                <div className="popup-description-box">
                  <strong>Description</strong>
                  <p>{selectedCourse.description || "No description added."}</p>
                </div>

                <div className="meta-grid drawer-meta-grid">
                  <span>
                    <strong>Category</strong>
                    {selectedCourse.category || "—"}
                  </span>

                  <span>
                    <strong>Level</strong>
                    {selectedCourse.level || "—"}
                  </span>

                  <span>
                    <strong>Duration</strong>
                    {selectedCourse.duration_weeks
                      ? `${selectedCourse.duration_weeks} weeks`
                      : "—"}
                  </span>

                  <span>
                    <strong>Teacher</strong>
                    {selectedCourse.created_by || selectedCourse.teacher || "—"}
                  </span>
                </div>
              </div>
            )}

            {!popupLoading && popupMode === "edit" && selectedCourse && (
              <form className="drawer-form" onSubmit={submitEdit}>
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
                      <select name="level" value={form.level} onChange={updateForm}>
                        <option value="">Select level</option>

                        {COURSE_LEVEL_OPTIONS.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label>
                    Duration weeks
                    <input
                      type="number"
                      min="1"
                      name="duration_weeks"
                      value={form.duration_weeks}
                      onChange={updateForm}
                      placeholder="8"
                    />
                  </label>
                </div>

                <div className="drawer-footer">
                  <button className="btn btn-ghost" type="button" onClick={closePopup}>
                    Cancel
                  </button>

                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            )}
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(target)}
        title="Delete course"
        message={`Delete ${target?.title || "this course"}? This cannot be undone.`}
        onClose={() => setTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        confirmLabel="Delete course"
      />
    </div>
  );
}