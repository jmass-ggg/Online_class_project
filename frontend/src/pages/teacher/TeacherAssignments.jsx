import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { assignmentApi } from "../../api/assignmentApi";
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

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
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
    assignment.course_name ||
    assignment.course?.title ||
    assignment.course?.name ||
    assignment.classroom?.course_name ||
    "Course Assignment"
  );
}
function getAssignmentClassroomId(assignment) {
  if (typeof assignment.classroom === "object") {
    return assignment.classroom?.id;
  }

  return assignment.classroom || assignment.classroom_id || assignment.batch;
}

function getAssignmentImages(assignment) {
  const images =
    assignment.images ||
    assignment.uploaded_images ||
    assignment.files ||
    assignment.attachments ||
    [];

  return Array.isArray(images) ? images : [];
}

function getFileUrl(file) {
  if (!file) return "";

  if (typeof file === "string") return file;

  return file.file_url || file.file || file.url || file.image || "";
}

function getFirstFileUrl(assignment) {
  const images = getAssignmentImages(assignment);
  return (
    assignment.file_url ||
    assignment.file ||
    assignment.image_url ||
    getFileUrl(images[0])
  );
}

export default function TeacherAssignments() {
  const navigate = useNavigate();

  const [classrooms, setClassrooms] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [classroomId, setClassroomId] = useState("");
  const [createClassroomId, setCreateClassroomId] = useState("");
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

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        await loadClassrooms();
        await loadAssignments("");
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

    const classroom = classroomMap[String(classroomValue || assignment.classroom_id)];

    return classroom ? getClassroomLabel(classroom) : classroomValue || "-";
  }

  const filteredAssignments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return assignments;

    return assignments.filter((assignment) => {
      const text = [
        getAssignmentTitle(assignment),
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
      return total + getAssignmentImages(assignment).length;
    }, 0);

    return {
      totalAssignments: assignments.length,
      published: assignments.length,
      totalFiles,
    };
  }, [assignments]);

  async function handleClassroomChange(event) {
    const nextClassroomId = event.target.value;

    setClassroomId(nextClassroomId);

    try {
      setLoading(true);
      setError("");
      await loadAssignments(nextClassroomId);
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

    if (!files.length) {
      setError("Please upload at least one photo.");
      return;
    }

    const formData = new FormData();

    formData.append("classroom", createClassroomId);

    Array.from(files).forEach((file) => {
      formData.append("uploaded_images", file);
    });

    try {
      setCreating(true);
      setError("");

      await assignmentApi.create(formData);

      setFiles([]);
      setShowCreate(false);

      await loadAssignments(classroomId);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(assignmentId) {
    const confirmed = window.confirm("Delete this assignment?");

    if (!confirmed) return;

    try {
      setError("");
      await assignmentApi.remove(assignmentId);
      await loadAssignments(classroomId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <section className="page-stack teacher-lms-page">
      <PageHeader
        title="Assignments"
        description="Create and manage assignment photos for your classrooms and batches."
        actions={
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              setError("");
              setShowCreate(true);
            }}
          >
            + Create assignment
          </button>
        }
      />

      <div className="lms-stats lms-stats-3">
        <article className="lms-stat-card">
          <strong>{stats.totalAssignments}</strong>
          <span>Total Assignments</span>
        </article>

        <article className="lms-stat-card tone-success">
          <strong>{stats.published}</strong>
          <span>Published</span>
        </article>

        <article className="lms-stat-card tone-warning">
          <strong>{stats.totalFiles}</strong>
          <span>Uploaded Photos</span>
        </article>
      </div>

      <div className="lms-toolbar">
        <div className="lms-search-wrap">
          <span>⌕</span>
          <input
            className="lms-search"
            type="search"
            placeholder="Search assignments..."
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
        <Loader label="Loading assignments" />
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          title="No assignments found"
          message="Create an assignment by selecting a classroom and uploading photos."
        />
      ) : (
        <div className="assignment-list">
          {filteredAssignments.map((assignment) => {
            const images = getAssignmentImages(assignment);
            const firstFileUrl = getFirstFileUrl(assignment);

            return (
              <article key={assignment.id} className="assignment-card">
                <div className="assignment-card-top">
                  <span className="classroom-chip">
                    {getAssignmentClassroomName(assignment)}
                  </span>

                  <StatusBadge status="PUBLISHED" />
                </div>

                <h3>{getAssignmentTitle(assignment)}</h3>

                

                {images.length > 0 && (
                  <div className="assignment-photo-grid">
                    {images.slice(0, 4).map((file, index) => {
                      const fileUrl = getFileUrl(file);

                      return (
                        <a
                          key={file.id || fileUrl || index}
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="assignment-photo-link"
                        >
                          <img
                            src={fileUrl}
                            alt={`Assignment upload ${index + 1}`}
                            loading="lazy"
                          />
                        </a>
                      );
                    })}
                  </div>
                )}

                <div className="assignment-meta-grid assignment-meta-grid-3">
                 



                  <span>
                    <small>Uploaded At</small>
                    <strong>{formatDateTime(assignment.upload_at)}</strong>
                  </span>

                  <span>
                    <small>Photos</small>
                    <strong>{images.length || (firstFileUrl ? 1 : 0)}</strong>
                  </span>

                  <span>
                    <small>Submissions</small>
                    <button
                      className="submission-link"
                      type="button"
                      onClick={() => navigate("/teacher/submissions")}
                    >
                      View submissions
                    </button>
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
                      className="btn btn-secondary"
                      href={firstFileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Photo
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
            onClick={() => setShowCreate(false)}
          />

          <form className="drawer-panel drawer-form" onSubmit={handleCreate}>
            <div className="drawer-accent" />

            <div className="drawer-header">
              <div>
                <h2>Create assignment</h2>
                <p>Select a classroom and upload assignment photos.</p>
              </div>

              <button
                className="drawer-close"
                type="button"
                onClick={() => setShowCreate(false)}
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
                Upload photo
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => setFiles(event.target.files)}
                />
              </label>

              {files.length > 0 && (
                <div className="selected-file-box">
                  <strong>{files.length}</strong>
                  <span>
                    {files.length === 1 ? "photo selected" : "photos selected"}
                  </span>
                </div>
              )}

              {error && <div className="form-error">{error}</div>}
            </div>

            <div className="drawer-footer">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={creating || !classrooms.length}
              >
                {creating ? "Creating..." : "Create assignment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}