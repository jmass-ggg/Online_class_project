import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import CopyButton from "../../components/CopyButton.jsx";
import { batchApi } from "../../api/batchApi";
import { courseApi } from "../../api/courseApi";
import { useToast } from "../../context/ToastContext.jsx";
import {
  parseApiError,
  required,
  validateDateRange,
} from "../../utils/validators";
import { formatDate } from "../../utils/dateFormatter";

const initialBatchForm = {
  course: "",
  name: "",
  description: "",
  max_students: 20,
  start_date: "",
  end_date: "",
  allow_self_enrollment: true,
  is_active: true,
};

function getResults(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function getBatchName(batch) {
  return (
    batch?.name ||
    batch?.batch_name ||
    batch?.classroom_name ||
    `Classroom ${batch?.id || ""}`
  );
}

function getCourseTitle(batch) {
  if (typeof batch?.course === "object") {
    return batch.course?.title || batch.course?.name || "Course";
  }

  return batch?.course_title || batch?.course_name || "Course";
}

function getStudentsCount(batch) {
  return (
    batch?.students_count ||
    batch?.student_count ||
    batch?.enrolled_students ||
    batch?.enrollment_count ||
    batch?.total_students ||
    0
  );
}

function getEnrollmentCode(batch) {
  return batch?.enrollment_code || batch?.code || "—";
}

function getBatchStatus(batch) {
  return batch?.is_active === false ? "INACTIVE" : "ACTIVE";
}

export default function TeacherBatches() {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [popupMode, setPopupMode] = useState(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const [form, setForm] = useState(initialBatchForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);

    try {
      const response = await batchApi.getBatches();
      setBatches(getResults(response.data));
    } catch (err) {
      showToast(parseApiError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await courseApi.getCourses();
      const results = getResults(response.data);

      setCourses(results);
      return results;
    } catch (err) {
      showToast(parseApiError(err, "Could not load courses"), "error");
      return [];
    }
  };

  useEffect(() => {
    load();
    loadCourses();
  }, []);

  const classroomStats = useMemo(() => {
    const totalStudents = batches.reduce((total, batch) => {
      return total + Number(getStudentsCount(batch) || 0);
    }, 0);

    return {
      totalClassrooms: batches.length,
      totalStudents,
    };
  }, [batches]);

  const filteredBatches = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return batches.filter((batch) => {
      const matchesSearch = query
        ? [
            getBatchName(batch),
            getCourseTitle(batch),
            getEnrollmentCode(batch),
            getBatchStatus(batch),
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)
        : true;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && batch.is_active !== false) ||
        (statusFilter === "INACTIVE" && batch.is_active === false);

      return matchesSearch && matchesStatus;
    });
  }, [batches, searchTerm, statusFilter]);

  const closePopup = () => {
    setPopupMode(null);
    setPopupLoading(false);
    setSelectedBatch(null);
    setForm(initialBatchForm);
    setFormError("");
    setSaving(false);
  };

  const openCreate = async () => {
    setPopupMode("create");
    setPopupLoading(false);
    setSelectedBatch(null);
    setForm(initialBatchForm);
    setFormError("");
    setSaving(false);

    if (!courses.length) {
      await loadCourses();
    }
  };

  const fillForm = (batch) => {
    setForm({
      course: batch.course ? String(batch.course) : "",
      name: batch.name || "",
      description: batch.description || "",
      max_students: batch.max_students || "",
      start_date: batch.start_date || "",
      end_date: batch.end_date || "",
      allow_self_enrollment: Boolean(batch.allow_self_enrollment),
      is_active: batch.is_active === false ? false : true,
    });
  };

  const openDetails = async (batch) => {
    setPopupMode("details");
    setSelectedBatch(null);
    setPopupLoading(true);

    try {
      const response = await batchApi.getBatch(batch.id);
      setSelectedBatch(response.data);
    } catch (err) {
      showToast(parseApiError(err), "error");
      closePopup();
    } finally {
      setPopupLoading(false);
    }
  };

  const openEdit = async (batch) => {
    setPopupMode("edit");
    setSelectedBatch(null);
    setPopupLoading(true);
    setFormError("");

    if (!courses.length) {
      await loadCourses();
    }

    try {
      const response = await batchApi.getBatch(batch.id);
      setSelectedBatch(response.data);
      fillForm(response.data);
    } catch (err) {
      showToast(parseApiError(err), "error");
      closePopup();
    } finally {
      setPopupLoading(false);
    }
  };

  const updateForm = (event) => {
    const { name, type, checked, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateBatchForm = () => {
    if (!required(form.course)) return "Course is required";
    if (!required(form.name)) return "Classroom name is required";

    if (!required(form.max_students) || Number(form.max_students) <= 0) {
      return "Max students must be positive";
    }

    if (!required(form.start_date)) {
      return "Start date is required";
    }

    const dateError = validateDateRange(form.start_date, form.end_date);

    if (dateError) return dateError;

    return "";
  };

  const getBatchPayload = () => ({
    course: Number(form.course),
    name: form.name.trim(),
    description: form.description?.trim() || "",
    max_students: Number(form.max_students),
    start_date: form.start_date || "",
    end_date: form.end_date || "",
    allow_self_enrollment: Boolean(form.allow_self_enrollment),
    is_active: Boolean(form.is_active),
  });

  const submitCreate = async (event) => {
    event.preventDefault();
    setFormError("");

    const validationError = validateBatchForm();

    if (validationError) {
      return setFormError(validationError);
    }

    try {
      setSaving(true);

      await batchApi.createBatch(getBatchPayload());

      showToast("Classroom created", "success");
      closePopup();
      load();
    } catch (err) {
      setFormError(parseApiError(err, "Could not create classroom"));
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!selectedBatch) return;

    const validationError = validateBatchForm();

    if (validationError) {
      return setFormError(validationError);
    }

    try {
      setSaving(true);

      await batchApi.updateBatch(selectedBatch.id, getBatchPayload());

      showToast("Classroom updated", "success");
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
      await batchApi.deleteBatch(target.id);
      showToast("Classroom deleted", "success");
      setTarget(null);
      closePopup();
      load();
    } catch (err) {
      showToast(parseApiError(err), "error");
    } finally {
      setDeleting(false);
    }
  };

  const regenerate = async (batch) => {
    try {
      await batchApi.regenerateEnrollmentCode(batch.id);
      showToast("Enrollment code regenerated", "success");
      load();

      if (selectedBatch?.id === batch.id) {
        const response = await batchApi.getBatch(batch.id);
        setSelectedBatch(response.data);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        showToast("Regenerate code API is not available yet.", "error");
      } else {
        showToast(parseApiError(err), "error");
      }
    }
  };

  const renderBatchForm = (onSubmit, submitLabel) => (
    <form className="drawer-form" onSubmit={onSubmit}>
      <div className="drawer-body">
        {formError && <div className="form-error">{formError}</div>}

        <label>
          Course
          <select name="course" value={form.course || ""} onChange={updateForm}>
            <option value="">Select course</option>

            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          Classroom name
          <input
            name="name"
            value={form.name || ""}
            onChange={updateForm}
            placeholder="Introduction to Programming — Batch A"
          />
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={form.description || ""}
            onChange={updateForm}
            rows="4"
            placeholder="Describe this classroom"
          />
        </label>

        <div className="two-column compact">
          <label>
            Max students
            <input
              type="number"
              min="1"
              name="max_students"
              value={form.max_students || ""}
              onChange={updateForm}
            />
          </label>

          <label>
            Start date
            <input
              type="date"
              name="start_date"
              value={form.start_date || ""}
              onChange={updateForm}
            />
          </label>

          <label>
            End date
            <input
              type="date"
              name="end_date"
              value={form.end_date || ""}
              onChange={updateForm}
            />
          </label>
        </div>

        <label className="checkbox-label">
          <input
            type="checkbox"
            name="allow_self_enrollment"
            checked={Boolean(form.allow_self_enrollment)}
            onChange={updateForm}
          />
          Allow self enrollment
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            name="is_active"
            checked={Boolean(form.is_active)}
            onChange={updateForm}
          />
          Classroom is active
        </label>
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

  if (loading) return <Loader label="Loading classrooms" />;

  return (
    <div className="page-stack teacher-classrooms-page">
      <PageHeader
        eyebrow="Classrooms"
        title="Manage your classrooms"
        description="Organize students into batches and manage enrollment codes."
        actions={
          <button className="btn btn-primary" type="button" onClick={openCreate}>
            + Create Classroom
          </button>
        }
      />

      <section className="classroom-stats-grid">
        <article className="classroom-stat-card">
          <div>
            <span>Total Classrooms</span>
            <strong>{classroomStats.totalClassrooms}</strong>
            <small>Active and inactive batches</small>
          </div>

          <em aria-hidden="true">♧</em>
        </article>

        <article className="classroom-stat-card">
          <div>
            <span>Enrolled Students</span>
            <strong>{classroomStats.totalStudents}</strong>
            <small>Across all classrooms</small>
          </div>

          <em aria-hidden="true">✥</em>
        </article>
      </section>

      <section className="classroom-list-section">
        <div className="classroom-list-toolbar">
          <h3>All Classrooms</h3>

          <div className="classroom-toolbar-actions">
            <div className="classroom-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search classrooms..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <div className="classroom-filter-pills" aria-label="Classroom status filter">
              <button
                type="button"
                className={statusFilter === "ALL" ? "active" : ""}
                onClick={() => setStatusFilter("ALL")}
              >
                All
              </button>

              <button
                type="button"
                className={statusFilter === "ACTIVE" ? "active" : ""}
                onClick={() => setStatusFilter("ACTIVE")}
              >
                Active
              </button>

              <button
                type="button"
                className={statusFilter === "INACTIVE" ? "active" : ""}
                onClick={() => setStatusFilter("INACTIVE")}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>

        {filteredBatches.length ? (
          <div className="classroom-card-grid">
            {filteredBatches.map((batch, index) => {
              const status = getBatchStatus(batch);
              const courseTitle = getCourseTitle(batch);
              const batchName = getBatchName(batch);
              const enrollmentCode = getEnrollmentCode(batch);
              const studentsCount = getStudentsCount(batch);

              return (
                <article key={batch.id} className="classroom-card">
                  <div className="classroom-card-top">
                    <span className="classroom-batch-pill">
                      {index % 2 === 0 ? "Batch A" : "Batch B"}
                    </span>

                    <StatusBadge status={status} />
                  </div>

                  <h3>{batchName}</h3>

                  <div className="classroom-card-meta">
                    <span>
                      <small>Course</small>
                      <strong>{courseTitle}</strong>
                    </span>

                    <span>
                      <small>Students</small>
                      <strong>{studentsCount} enrolled</strong>
                    </span>

                    <span className="classroom-code-meta">
  <small>Enrollment Code</small>

  <div className="classroom-code-box-small">
    <strong>{enrollmentCode}</strong>

    {enrollmentCode && enrollmentCode !== "—" && (
      <CopyButton value={enrollmentCode} />
    )}
  </div>
</span>
                  </div>

                  <div className="classroom-card-actions">
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => openDetails(batch)}
                    >
                      View details
                    </button>

                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => openEdit(batch)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={() => setTarget(batch)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No classrooms found"
            message="Create a classroom or adjust your search/filter."
            action={
              <button className="btn btn-primary" type="button" onClick={openCreate}>
                Create Classroom
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
                    ? "Create Classroom"
                    : popupMode === "edit"
                      ? "Edit Classroom"
                      : "Classroom Details"}
                </h2>

                <p>
                  {popupMode === "create"
                    ? "Create a classroom under a course."
                    : popupMode === "edit"
                      ? "Update classroom information."
                      : "View classroom enrollment and schedule details."}
                </p>
              </div>

              <button className="drawer-close" type="button" onClick={closePopup}>
                ×
              </button>
            </div>

            {popupLoading && <div className="popup-loading">Loading...</div>}

            {!popupLoading &&
              popupMode === "create" &&
              renderBatchForm(submitCreate, "Create classroom")}

            {!popupLoading && popupMode === "details" && selectedBatch && (
              <>
                <div className="drawer-body">
                  <div className="details-hero">
                    <div className="card-topline">
                      <span className="pill">
                        {getCourseTitle(selectedBatch)}
                      </span>

                      <StatusBadge status={getBatchStatus(selectedBatch)} />
                    </div>

                    <h3>{getBatchName(selectedBatch)}</h3>

                    <div className="enrollment-code-box">
                      <div>
                        <span>Enrollment code</span>
                        <strong>{getEnrollmentCode(selectedBatch)}</strong>
                      </div>

                      <CopyButton value={getEnrollmentCode(selectedBatch)} />
                    </div>
                  </div>

                  <div className="popup-description-box">
                    <strong>Description</strong>
                    <p>
                      {selectedBatch.description ||
                        "No description added for this classroom."}
                    </p>
                  </div>

                  <div className="meta-grid drawer-meta-grid">
                    <span>
                      <strong>Teacher</strong>
                      {selectedBatch.teacher || "—"}
                    </span>

                    <span>
                      <strong>Max students</strong>
                      {selectedBatch.max_students || "—"}
                    </span>

                    <span>
                      <strong>Start</strong>
                      {formatDate(selectedBatch.start_date)}
                    </span>

                    <span>
                      <strong>End</strong>
                      {formatDate(selectedBatch.end_date)}
                    </span>

                    <span className="meta-wide">
                      <strong>Self enrollment</strong>
                      {selectedBatch.allow_self_enrollment ? "Allowed" : "Disabled"}
                    </span>
                  </div>
                </div>

                <div className="drawer-footer">
                  <button className="btn btn-ghost" type="button" onClick={closePopup}>
                    Close
                  </button>

                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => openEdit(selectedBatch)}
                  >
                    Edit
                  </button>

                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => regenerate(selectedBatch)}
                  >
                    Regenerate code
                  </button>

                  <Link
                    className="btn btn-primary"
                    to="/teacher/sessions/create"
                    state={{ classroomId: selectedBatch.id }}
                  >
                    Schedule live class
                  </Link>
                </div>
              </>
            )}

            {!popupLoading &&
              popupMode === "edit" &&
              selectedBatch &&
              renderBatchForm(submitEdit, "Save")}
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(target)}
        title="Delete classroom"
        message={`Delete ${getBatchName(target) || "this classroom"}?`}
        onClose={() => setTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        confirmLabel="Delete classroom"
      />
    </div>
  );
}
