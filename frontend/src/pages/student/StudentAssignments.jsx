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
  return new Date(value).toLocaleString();
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
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
    const classroomValue = assignment.classroom;
    const classroom =
      typeof classroomValue === "object"
        ? classroomValue
        : classroomMap[String(classroomValue)];

    return classroom ? getClassroomLabel(classroom) : classroomValue || "-";
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
    <section className="page-section">
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
                {assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>{assignment.id}</td>
                    <td>{getAssignmentClassroomName(assignment)}</td>
                    <td>{formatDate(assignment.upload_at)}</td>
                    <td>
                      {assignment.images?.length ? (
                        assignment.images.map((file) => (
                          <a
                            key={file.id}
                            href={file.file_url || file.file}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary"
                          >
                            Open file
                          </a>
                        ))
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <div className="form" style={{ gap: "10px" }}>
                        <input
                          type="file"
                          onChange={(event) =>
                            setSelectedFiles((current) => ({
                              ...current,
                              [assignment.id]: event.target.files?.[0] || null,
                            }))
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}