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

function getErrorMessage(error) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    "Something went wrong."
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

function getStudentName(submission) {
  if (submission.student_name) return submission.student_name;

  if (typeof submission.student === "object") {
    return (
      submission.student.full_name ||
      submission.student.name ||
      submission.student.email ||
      `Student ${submission.student.id || ""}`
    );
  }

  return submission.student || "-";
}

function getAssignmentTitle(submission) {
  const assignment = submission.assignment;

  if (typeof assignment === "object") {
    return assignment.title || assignment.name || `Assignment #${assignment.id}`;
  }

  return submission.assignment_title || assignment || "-";
}

function getSubmissionStatus(submission) {
  if (submission.is_late) return "LATE";

  const raw =
    submission.status ||
    submission.review_status ||
    submission.compression_status ||
    submission.submission_status;

  if (raw) return String(raw).toUpperCase();

  if (
    submission.score !== undefined ||
    submission.grade !== undefined ||
    submission.marks !== undefined
  ) {
    return "GRADED";
  }

  return "PENDING_REVIEW";
}

function getSubmissionFile(submission) {
  return (
    submission.submitted_file_url ||
    submission.submitted_file ||
    submission.file_url ||
    submission.file ||
    ""
  );
}

function getScore(submission) {
  const score = submission.score ?? submission.grade ?? submission.marks;
  const max =
    submission.max_score ??
    submission.assignment?.max_score ??
    submission.assignment?.total_marks ??
    100;

  if (score === undefined || score === null || score === "") return "—";

  return `${score}/${max}`;
}

export default function TeacherSubmissions() {
  const [classrooms, setClassrooms] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [classroomId, setClassroomId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  function getSubmissionClassroomId(submission) {
    if (typeof submission.classroom === "object") return submission.classroom?.id;
    if (submission.classroom) return submission.classroom;

    const assignment = submission.assignment;

    if (typeof assignment === "object") {
      if (typeof assignment.classroom === "object") return assignment.classroom?.id;
      return assignment.classroom || assignment.classroom_id;
    }

    return submission.classroom_id || submission.batch;
  }

  function getSubmissionClassroomName(submission) {
    const classroomValue = submission.classroom;

    if (typeof classroomValue === "object") {
      return getClassroomLabel(classroomValue);
    }

    const classroomIdValue = getSubmissionClassroomId(submission);
    const classroom = classroomMap[String(classroomIdValue)];

    return classroom ? getClassroomLabel(classroom) : classroomValue || "-";
  }

  async function handleClassroomChange(event) {
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

  const filteredSubmissions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return submissions.filter((submission) => {
      const status = getSubmissionStatus(submission);
      const submissionClassroomId = getSubmissionClassroomId(submission);

      const matchesClassroom =
        !classroomId || String(submissionClassroomId) === String(classroomId);

      const matchesStatus = !statusFilter || status === statusFilter;

      const searchable = [
        getStudentName(submission),
        getAssignmentTitle(submission),
        getSubmissionClassroomName(submission),
        status,
      ]
        .join(" ")
        .toLowerCase();

      return matchesClassroom && matchesStatus && searchable.includes(query);
    });
  }, [submissions, classroomId, statusFilter, searchTerm, classroomMap]);

  const stats = useMemo(() => {
    const total = submissions.length;
    const graded = submissions.filter(
      (submission) => getSubmissionStatus(submission) === "GRADED"
    ).length;
    const pending = submissions.filter((submission) =>
      getSubmissionStatus(submission).includes("PENDING")
    ).length;
    const late = submissions.filter(
      (submission) => getSubmissionStatus(submission) === "LATE"
    ).length;

    return { total, graded, pending, late };
  }, [submissions]);

  return (
    <section className="page-stack teacher-lms-page">
      <PageHeader
        title="Submissions"
        description="Review, grade, and provide feedback on student assignment submissions."
      />

      <div className="lms-toolbar submissions-toolbar">
        <div className="lms-search-wrap">
          <span>⌕</span>
          <input
            className="lms-search"
            type="search"
            placeholder="Search by student name..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <select className="lms-select" value={classroomId} onChange={handleClassroomChange}>
          <option value="">All Classrooms</option>
          {classrooms.map((classroom) => (
            <option key={classroom.id} value={classroom.id}>
              {getClassroomLabel(classroom)}
            </option>
          ))}
        </select>

        <select
          className="lms-select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">All Status</option>
          <option value="GRADED">Graded</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="PENDING">Pending</option>
          <option value="LATE">Late</option>
        </select>
      </div>

      <div className="lms-stats lms-stats-4">
        <article className="lms-stat-card with-icon">
          <div className="lms-stat-icon">▤</div>
          <div>
            <span>Total Submissions</span>
            <strong>{stats.total}</strong>
          </div>
        </article>

        <article className="lms-stat-card with-icon tone-success">
          <div className="lms-stat-icon">⊙</div>
          <div>
            <span>Graded</span>
            <strong>{stats.graded}</strong>
          </div>
        </article>

        <article className="lms-stat-card with-icon tone-warning">
          <div className="lms-stat-icon">◷</div>
          <div>
            <span>Pending Review</span>
            <strong>{stats.pending}</strong>
          </div>
        </article>

        <article className="lms-stat-card with-icon tone-danger">
          <div className="lms-stat-icon">△</div>
          <div>
            <span>Late Submissions</span>
            <strong>{stats.late}</strong>
          </div>
        </article>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <Loader label="Loading submissions" />
      ) : filteredSubmissions.length === 0 ? (
        <EmptyState
          title="No submissions found"
          message="No students have submitted assignments for this filter yet."
        />
      ) : (
        <div className="table-card submissions-table-card">
          <div className="table-scroll">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Assignment</th>
                  <th>Classroom</th>
                  <th>Submitted At</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSubmissions.map((submission) => {
                  const studentName = getStudentName(submission);
                  const status = getSubmissionStatus(submission);
                  const fileUrl = getSubmissionFile(submission);

                  return (
                    <tr key={submission.id}>
                      <td>
                        <div className="student-cell">
                          <span className="student-avatar">
                            {studentName
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                          <strong>{studentName}</strong>
                        </div>
                      </td>

                      <td>{getAssignmentTitle(submission)}</td>

                      <td>
                        <span className="classroom-chip">
                          {getSubmissionClassroomName(submission)}
                        </span>
                      </td>

                      <td>{formatDateTime(submission.submitted_at || submission.created_at)}</td>

                      <td>
                        <StatusBadge status={status} />
                      </td>

                      <td>
                        <strong>{getScore(submission)}</strong>
                      </td>

                      <td>
                        <div className="table-actions">
                          {fileUrl ? (
                            <a
                              className="btn btn-primary btn-small"
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Review
                            </a>
                          ) : (
                            <button className="btn btn-primary btn-small" type="button" disabled>
                              Review
                            </button>
                          )}

                          <button className="btn btn-secondary btn-small" type="button">
                            Grade
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