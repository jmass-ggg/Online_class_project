import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { submissionApi } from "../../api/submissionApi";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";

function getResults(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function getAssignmentTitle(submission) {
  const assignment = submission.assignment;

  if (typeof assignment === "object") {
    return assignment.title || assignment.name || `Assignment #${assignment.id}`;
  }

  return submission.assignment_title || assignment || "-";
}

function getSubmissionStatus(submission) {
  const raw =
    submission.status ||
    submission.review_status ||
    submission.compression_status ||
    submission.submission_status;

  return raw ? String(raw).toUpperCase() : "SUBMITTED";
}

function getSubmissionFile(submission) {
  return submission.submitted_file_url || submission.submitted_file || "";
}

export default function StudentSubmissions() {
  const [classrooms, setClassrooms] = useState([]);
  const [classroomId, setClassroomId] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedClassroomName = useMemo(() => {
    if (!classroomId) return "All classrooms";

    const classroom = classrooms.find(
      (item) => String(item.id) === String(classroomId)
    );

    return classroom ? getClassroomLabel(classroom) : classroomId;
  }, [classrooms, classroomId]);

  async function loadClassrooms() {
    const response = await axiosClient.get("/Batch/");
    setClassrooms(getResults(response.data));
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
        await loadSubmissions("");
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
      await loadSubmissions(nextClassroomId);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-stack student-page student-submissions-page">
      <PageHeader
        eyebrow="Submissions"
        title="My submissions"
        description="Check your submitted assignment files by classroom or batch."
      />

      <div className="student-toolbar">
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
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <Loader label="Loading submissions" />
      ) : submissions.length === 0 ? (
        <EmptyState
          title="No submissions found"
          message="You have not submitted any assignment for this classroom yet."
        />
      ) : (
        <div className="student-table-card">
          <div className="student-table-scroll">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Classroom</th>
                  <th>Assignment</th>
                  <th>Submitted At</th>
                  <th>Status</th>
                  <th>File</th>
                </tr>
              </thead>

              <tbody>
                {submissions.map((submission) => {
                  const fileUrl = getSubmissionFile(submission);

                  return (
                    <tr key={submission.id}>
                      <td>{selectedClassroomName}</td>
                      <td>{getAssignmentTitle(submission)}</td>
                      <td>{formatDate(submission.submitted_at)}</td>
                      <td>
                        <StatusBadge status={getSubmissionStatus(submission)} />
                      </td>
                      <td>
                        {fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary"
                          >
                            Open file
                          </a>
                        ) : (
                          "-"
                        )}
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