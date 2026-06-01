import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import BatchCard from "../../components/BatchCard.jsx";
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
            placeholder="Python Morning Batch"
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
    <div className="page-stack">
      <PageHeader
        title="Classrooms / Batches"
        description="Share enrollment codes and schedule live classes for each classroom."
        actions={
          <button className="btn btn-primary" type="button" onClick={openCreate}>
            Create classroom
          </button>
        }
      />

      {batches.length ? (
        <div className="card-grid">
          {batches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              onDelete={setTarget}
              onRegenerate={regenerate}
              onView={openDetails}
              onEdit={openEdit}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Create your first classroom"
          action={
            <button className="btn btn-primary" type="button" onClick={openCreate}>
              Create Classroom
            </button>
          }
        />
      )}

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
                      : "Single classroom information from get batch by ID API."}
                </p>
              </div>

              <button className="drawer-close" type="button" onClick={closePopup}>
                ×
              </button>
            </div>

            {popupLoading && <div className="popup-loading">Loading...</div>}

            {!popupLoading && popupMode === "create" &&
              renderBatchForm(submitCreate, "Create classroom")}

            {!popupLoading && popupMode === "details" && selectedBatch && (
              <>
                <div className="drawer-body">
                  <div className="details-hero">
                    <div className="card-topline">
                      <span className="pill">
                        {selectedBatch.course_title || `Course #${selectedBatch.course}`}
                      </span>

                      <StatusBadge
                        status={
                          selectedBatch.is_active === false ? "INACTIVE" : "ACTIVE"
                        }
                      />
                    </div>

                    <h3>{selectedBatch.name}</h3>

                    <div className="enrollment-code-box">
                      <div>
                        <span>Enrollment code</span>
                        <strong>
                          {selectedBatch.enrollment_code || "Not generated"}
                        </strong>
                      </div>

                      <CopyButton value={selectedBatch.enrollment_code} />
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

            {!popupLoading && popupMode === "edit" && selectedBatch &&
              renderBatchForm(submitEdit, "Save")}
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(target)}
        title="Delete classroom"
        message={`Delete ${target?.name || "this classroom"}?`}
        onClose={() => setTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        confirmLabel="Delete classroom"
      />
    </div>
  );
}