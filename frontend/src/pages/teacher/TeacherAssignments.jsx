import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { assignmentApi } from "../../api/assignmentApi";
import { submissionApi } from "../../api/submissionApi";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";

function getResults(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.title?.[0] ||
    error?.response?.data?.description?.[0] ||
    error?.response?.data?.classroom?.[0] ||
    error?.response?.data?.uploaded_images?.[0] ||
    "Something went wrong."
  );
}

function getClassroomLabel(classroom) {
  return (
    classroom?.name ||
    classroom?.title ||
    classroom?.classroom_name ||
    classroom?.batch_name ||
    classroom?.course_name ||
    `Classroom ${classroom?.id || ""}`
  );
}

function formatDateTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAssignmentTitle(assignment) {
  return (
    assignment.title ||
    assignment.course_name ||
    assignment.course?.title ||
    assignment.course?.name ||
    assignment.classroom?.course_name ||
    "Study Material"
  );
}

function getAssignmentDescription(assignment) {
  return assignment.description || "";
}

function getAssignmentFiles(assignment) {
  const files =
    assignment.images ||
    assignment.uploaded_images ||
    assignment.files ||
    assignment.attachments ||
    [];

  if (Array.isArray(files)) return files;
  if (typeof files === "string") return [files];

  return [];
}

function getFileUrl(file) {
  if (!file) return "";

  if (typeof file === "string") return file;

  return file.file_url || file.file || file.url || file.image || "";
}

function getFirstFileUrl(assignment) {
  const files = getAssignmentFiles(assignment);

  return (
    assignment.file_url ||
    assignment.file ||
    assignment.image_url ||
    getFileUrl(files[0])
  );
}

function getSubmissionAssignmentId(submission) {
  const assignment = submission.assignment;

  if (typeof assignment === "object") {
    return assignment?.id;
  }

  return assignment || submission.assignment_id;
}

function getBuiltInSubmissionCount(assignment) {
  const direct =
    assignment.submissions_count ??
    assignment.submission_count ??
    assignment.submitted_count ??
    assignment.submitted_students_count ??
    assignment.total_submissions;

  if (direct !== undefined && direct !== null && direct !== "") {
    return Number(direct) || 0;
  }

  if (Array.isArray(assignment.submissions)) {
    return assignment.submissions.length;
  }

  return null;
}

export default function TeacherAssignments() {
  const navigate = useNavigate();

  const [classrooms, setClassrooms] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [classroomId, setClassroomId] = useState("");
  const [createClassroomId, setCreateClassroomId] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [files, setFiles] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const classroomMap = useMemo(() => {
    return classrooms.reduce((map, classroom) => {
      map[String(classroom.id)] = classroom;
      return map;
    }, {});
  }, [classrooms]);

  const submissionCountMap = useMemo(() => {
    return submissions.reduce((map, submission) => {
      const assignmentId = getSubmissionAssignmentId(submission);

      if (!assignmentId) return map;

      const key = String(assignmentId);
      map[key] = (map[key] || 0) + 1;

      return map;
    }, {});
  }, [submissions]);

  async function loadClassrooms() {
    const response = await axiosClient.get("/Batch/");
    const rows = getResults(response.data);

    setClassrooms(rows);

    if (rows.length) {
      setCreateClassroomId((current) => current || rows[0].id);
    }
  }

  async function loadAssignments(nextClassroomId = classroomId) {
    const params = {};

    if (nextClassroomId) {
      params.classroom_id = nextClassroomId;
    }

    const response = await assignmentApi.list(params);
    setAssignments(getResults(response.data));
  }

  async function loadSubmissions(nextClassroomId = classroomId) {
    const params = {};

    if (nextClassroomId) {
      params.classroom_id = nextClassroomId;
    }

    const response = await submissionApi.list(params);
    setSubmissions(getResults(response.data));
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        await loadClassrooms();
        await loadAssignments("");
        await loadSubmissions("");
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function getAssignmentClassroomName(assignment) {
    const classroomValue = assignment.classroom;

    if (typeof classroomValue === "object") {
      return getClassroomLabel(classroomValue);
    }

    const classroom =
      classroomMap[String(classroomValue || assignment.classroom_id)];

    return classroom ? getClassroomLabel(classroom) : classroomValue || "-";
  }

  function getSubmittedCount(assignment) {
    const builtInCount = getBuiltInSubmissionCount(assignment);

    if (builtInCount !== null) {
      return builtInCount;
    }

    return submissionCountMap[String(assignment.id)] || 0;
  }

  const filteredAssignments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return assignments;

    return assignments.filter((assignment) => {
      const text = [
        getAssignmentTitle(assignment),
        getAssignmentDescription(assignment),
        getAssignmentClassroomName(assignment),
        assignment.id,
        assignment.upload_at,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });
  }, [assignments, searchTerm, classroomMap]);

  const stats = useMemo(() => {
    const totalFiles = assignments.reduce((total, assignment) => {
      const files = getAssignmentFiles(assignment);
      const firstFileUrl = getFirstFileUrl(assignment);

      return total + (files.length || (firstFileUrl ? 1 : 0));
    }, 0);

    const totalSubmitted = assignments.reduce((total, assignment) => {
      return total + getSubmittedCount(assignment);
    }, 0);

    return {
      totalAssignments: assignments.length,
      published: assignments.length,
      totalFiles,
      totalSubmitted,
    };
  }, [assignments, submissionCountMap]);

  function resetCreateForm() {
    setCreateTitle("");
    setCreateDescription("");
    setFiles([]);
    setError("");
  }

  function closeCreateDrawer() {
    setShowCreate(false);
    resetCreateForm();
  }

  async function handleClassroomChange(event) {
    const nextClassroomId = event.target.value;

    setClassroomId(nextClassroomId);

    try {
      setLoading(true);
      setError("");

      await loadAssignments(nextClassroomId);
      await loadSubmissions(nextClassroomId);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();

    if (!createClassroomId) {
      setError("Please select a classroom.");
      return;
    }

    if (!createTitle.trim()) {
      setError("Please enter a title.");
      return;
    }

    if (!createDescription.trim()) {
      setError("Please enter a description.");
      return;
    }

    if (!files.length) {
      setError("Please upload at least one file.");
      return;
    }

    const formData = new FormData();

    formData.append("classroom", createClassroomId);
    formData.append("title", createTitle.trim());
    formData.append("description", createDescription.trim());

    files.forEach((file) => {
      formData.append("uploaded_images", file);
    });

    try {
      setCreating(true);
      setError("");

      await assignmentApi.create(formData);

      resetCreateForm();
      setShowCreate(false);

      await loadAssignments(classroomId);
      await loadSubmissions(classroomId);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(assignmentId) {
    const confirmed = window.confirm("Delete this study material?");

    if (!confirmed) return;

    try {
      setError("");

      await assignmentApi.remove(assignmentId);
      await loadAssignments(classroomId);
      await loadSubmissions(classroomId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <section className="page-stack teacher-lms-page">
      <PageHeader
        title="Study Materials"
        description="Create and manage study materials for your classrooms and batches."
        actions={
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              setError("");
              setShowCreate(true);
            }}
          >
            + Create material
          </button>
        }
      />

      <div className="lms-stats lms-stats-4">
        <article className="lms-stat-card">
          <strong>{stats.totalAssignments}</strong>
          <span>Total Materials</span>
        </article>

        <article className="lms-stat-card tone-success">
          <strong>{stats.published}</strong>
          <span>Published</span>
        </article>

        <article className="lms-stat-card tone-warning">
          <strong>{stats.totalFiles}</strong>
          <span>Uploaded Files</span>
        </article>

        <article className="lms-stat-card tone-info">
          <strong>{stats.totalSubmitted}</strong>
          <span>Submitted</span>
        </article>
      </div>

      <div className="lms-toolbar">
        <div className="lms-search-wrap">
          <span>⌕</span>
          <input
            className="lms-search"
            type="search"
            placeholder="Search study materials..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <select
          className="lms-select"
          value={classroomId}
          onChange={handleClassroomChange}
        >
          <option value="">All Classrooms</option>
          {classrooms.map((classroom) => (
            <option key={classroom.id} value={classroom.id}>
              {getClassroomLabel(classroom)}
            </option>
          ))}
        </select>

        <select className="lms-select" disabled>
          <option>Published</option>
        </select>
      </div>

      {error && !showCreate && <div className="form-error">{error}</div>}

      {loading ? (
        <Loader label="Loading study materials" />
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          title="No study materials found"
          message="Create a study material by selecting a classroom and uploading files."
        />
      ) : (
        <div className="assignment-list">
          {filteredAssignments.map((assignment) => {
            const assignmentFiles = getAssignmentFiles(assignment);
            const firstFileUrl = getFirstFileUrl(assignment);
            const fileCount = assignmentFiles.length || (firstFileUrl ? 1 : 0);
            const submittedCount = getSubmittedCount(assignment);

            return (
              <article key={assignment.id} className="assignment-card">
                <div className="assignment-card-top">
                  <span className="classroom-chip">
                    {getAssignmentClassroomName(assignment)}
                  </span>

                  <StatusBadge status="PUBLISHED" />
                </div>

                <h3>{getAssignmentTitle(assignment)}</h3>

                {getAssignmentDescription(assignment) && (
                  <p className="assignment-description">
                    {getAssignmentDescription(assignment)}
                  </p>
                )}

                <div className="assignment-meta-grid assignment-meta-grid-4">
                  <span>
                    <small>Uploaded At</small>
                    <strong>{formatDateTime(assignment.upload_at)}</strong>
                  </span>

                  <span>
                    <small>Files</small>
                    <strong>{fileCount}</strong>
                  </span>

                  <span>
                    <small>Submissions</small>
                    <strong>
                      {submittedCount} {submittedCount === 1 ? "student" : "students"}
                    </strong>
                  </span>

                  <span>
                    <small>Status</small>
                    <strong>{submittedCount > 0 ? "Submitted" : "No submissions"}</strong>
                  </span>
                </div>

                <div className="assignment-actions">
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => navigate("/teacher/submissions")}
                  >
                    View Submissions
                  </button>

                  {firstFileUrl && (
                    <a
                      className="btn btn-ghost"
                      href={firstFileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open File
                    </a>
                  )}

                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => handleDelete(assignment.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="drawer-layer" role="dialog" aria-modal="true">
          <button
            className="drawer-backdrop"
            type="button"
            aria-label="Close"
            onClick={closeCreateDrawer}
          />

          <form className="drawer-panel drawer-form" onSubmit={handleCreate}>
            <div className="drawer-accent" />

            <div className="drawer-header">
              <div>
                <h2>Create study material</h2>
                <p>Select a classroom, add title, description, and upload files.</p>
              </div>

              <button
                className="drawer-close"
                type="button"
                onClick={closeCreateDrawer}
              >
                ×
              </button>
            </div>

            <div className="drawer-body">
              <label>
                Classroom / Batch
                <select
                  value={createClassroomId}
                  onChange={(event) => setCreateClassroomId(event.target.value)}
                  disabled={!classrooms.length}
                >
                  {classrooms.length === 0 ? (
                    <option value="">No classrooms found</option>
                  ) : (
                    classrooms.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {getClassroomLabel(classroom)}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label>
                Title
                <input
                  type="text"
                  placeholder="Enter title"
                  value={createTitle}
                  onChange={(event) => setCreateTitle(event.target.value)}
                />
              </label>

              <label>
                Description
                <textarea
                  placeholder="Enter description"
                  value={createDescription}
                  onChange={(event) => setCreateDescription(event.target.value)}
                  rows={4}
                />
              </label>

              <label>
                Upload files
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"
                  multiple
                  onChange={(event) =>
                    setFiles(Array.from(event.target.files || []))
                  }
                />
              </label>

              {files.length > 0 && (
                <div className="selected-file-box">
                  <strong>{files.length}</strong>
                  <span>{files.length === 1 ? "file selected" : "files selected"}</span>
                </div>
              )}

              {error && <div className="form-error">{error}</div>}
            </div>

            <div className="drawer-footer">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={closeCreateDrawer}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={creating || !classrooms.length}
              >
                {creating ? "Creating..." : "Create material"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}