import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { assignmentApi } from "../../api/assignmentApi";
import { submissionApi } from "../../api/submissionApi";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";

function getResults(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.assignment?.[0] ||
    error?.response?.data?.submitted_file?.[0] ||
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

function getAssignmentTitle(assignment) {
  return (
    assignment?.title ||
    assignment?.course_name ||
    `Assignment ${assignment?.id || ""}`
  );
}

function getAssignmentDescription(assignment) {
  
}

function getAssignmentFiles(assignment) {
  const files =
    assignment?.images ||
    assignment?.uploaded_images ||
    assignment?.files ||
    assignment?.attachments ||
    [];

  return Array.isArray(files) ? files : [];
}

function getFileUrl(file) {
  if (!file) return "";

  if (typeof file === "string") return file;

  return file.file_url || file.file || file.url || file.image || "";
}

function getFileName(file, index) {
  if (!file) return `File ${index + 1}`;

  if (typeof file === "string") {
    return file.split("/").pop() || `File ${index + 1}`;
  }

  const url = getFileUrl(file);

  return (
    file.original_name ||
    file.name ||
    file.filename ||
    url.split("/").pop() ||
    `File ${index + 1}`
  );
}

export default function StudentAssignments() {
  const [classrooms, setClassrooms] = useState([]);
  const [classroomId, setClassroomId] = useState("");
  const [assignments, setAssignments] = useState([]);

  const [selectedFiles, setSelectedFiles] = useState({});
  const [submittingId, setSubmittingId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const classroomMap = useMemo(() => {
    return classrooms.reduce((map, classroom) => {
      map[String(classroom.id)] = classroom;
      return map;
    }, {});
  }, [classrooms]);

  async function loadClassrooms() {
    const response = await axiosClient.get("/Batch/");
    setClassrooms(getResults(response.data));
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
        setSuccess("");

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

  async function handleFilterChange(event) {
    const nextClassroomId = event.target.value;

    setClassroomId(nextClassroomId);

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await loadAssignments(nextClassroomId);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function getAssignmentClassroomName(assignment) {
    if (assignment.classroom_name) {
      return assignment.classroom_name;
    }

    const classroomValue = assignment.classroom;

    if (typeof classroomValue === "object") {
      return getClassroomLabel(classroomValue);
    }

    const classroom =
      classroomMap[String(classroomValue || assignment.classroom_id)];

    return classroom ? getClassroomLabel(classroom) : classroomValue || "-";
  }

  function handleFileChange(assignmentId, file) {
    setSelectedFiles((current) => ({
      ...current,
      [assignmentId]: file || null,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmitAssignment(assignmentId) {
    const file = selectedFiles[assignmentId];

    if (!file) {
      setError("Please choose a file before submitting.");
      return;
    }

    try {
      setSubmittingId(assignmentId);
      setError("");
      setSuccess("");

      await submissionApi.create({
        assignment: assignmentId,
        submitted_file: file,
      });

      setSelectedFiles((current) => ({
        ...current,
        [assignmentId]: null,
      }));

      setSuccess("Assignment submitted successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmittingId("");
    }
  }

  return (
    <section className="page-stack student-page student-assignments-page">
      <PageHeader
        eyebrow="Assignments"
        title="My classroom assignments"
        description="View and submit assignments by classroom or batch."
      />

      <div className="form-card form">
        <label>
          Classroom / Batch
          <select value={classroomId} onChange={handleFilterChange}>
            <option value="">All classrooms</option>

            {classrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {getClassroomLabel(classroom)}
              </option>
            ))}
          </select>
        </label>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}
      </div>

      {loading ? (
        <Loader label="Loading assignments" />
      ) : assignments.length === 0 ? (
        <EmptyState
          title="No assignments found"
          message="No assignments are available for this classroom yet."
        />
      ) : (
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Classroom</th>
                  <th>Uploaded At</th>
                  <th>Files</th>
                  <th>Submit</th>
                </tr>
              </thead>

              <tbody>
                {assignments.map((assignment) => {
                  const assignmentFiles = getAssignmentFiles(assignment);

                  return (
                    <tr key={assignment.id}>
                      <td>
                        <strong>{getAssignmentTitle(assignment)}</strong>

                        {getAssignmentDescription(assignment) && (
                          <small
                            style={{
                              display: "block",
                              marginTop: "6px",
                              color: "#6b7280",
                              lineHeight: "1.4",
                              fontWeight: 600,
                            }}
                          >
                            {getAssignmentDescription(assignment)}
                          </small>
                        )}
                      </td>

                      <td>{getAssignmentClassroomName(assignment)}</td>

                      <td>{formatDate(assignment.upload_at)}</td>

                      <td>
                        {assignmentFiles.length ? (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "8px",
                            }}
                          >
                            {assignmentFiles.map((file, index) => {
                              const fileUrl = getFileUrl(file);
                              const fileName = getFileName(file, index);

                              if (!fileUrl) return null;

                              return (
                                <a
                                  key={file.id || fileUrl || index}
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-secondary"
                                  title={fileName}
                                >
                                  Open file
                                </a>
                              );
                            })}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td>
                        <div className="form" style={{ gap: "10px" }}>
                          <input
                            type="file"
                            onChange={(event) =>
                              handleFileChange(
                                assignment.id,
                                event.target.files?.[0] || null
                              )
                            }
                          />

                          <button
                            className="btn btn-primary"
                            type="button"
                            disabled={submittingId === assignment.id}
                            onClick={() => handleSubmitAssignment(assignment.id)}
                          >
                            {submittingId === assignment.id
                              ? "Submitting..."
                              : "Submit"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}