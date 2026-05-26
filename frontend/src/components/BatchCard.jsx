import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";
import CopyButton from "./CopyButton.jsx";
import { formatDate } from "../utils/dateFormatter";

export default function BatchCard({
  batch,
  role = "teacher",
  onDelete,
  onRegenerate,
  onView,
  onEdit,
}) {
  const activeStatus = batch.is_active === false ? "INACTIVE" : "ACTIVE";
  const selfEnrollment = batch.allow_self_enrollment
    ? "Self enrollment allowed"
    : "Self enrollment disabled";

  const courseTitle = batch.course_title || `Course #${batch.course}`;
  const teacherName = batch.teacher || "—";

  return (
    <article className="card batch-card">
      <div className="card-topline">
        <span className="pill">{courseTitle}</span>
        <StatusBadge status={activeStatus} />
      </div>

      <div className="card-heading">
        <h3>{batch.name}</h3>
      </div>

      <div className="enrollment-code-box">
        <div>
          <span>Enrollment code</span>
          <strong>{batch.enrollment_code || "Not generated"}</strong>
        </div>

        {role === "teacher" && <CopyButton value={batch.enrollment_code} />}
      </div>

      <div className="meta-grid small-meta-grid">
        <span>
          <strong>Teacher</strong>
          {teacherName}
        </span>

        <span>
          <strong>Max students</strong>
          {batch.max_students || "—"}
        </span>

        <span>
          <strong>Start</strong>
          {formatDate(batch.start_date)}
        </span>

        <span>
          <strong>End</strong>
          {formatDate(batch.end_date)}
        </span>

        <span className="meta-wide">
          <strong>Enrollment</strong>
          {selfEnrollment}
        </span>
      </div>

      <div className="card-actions">
        {role === "teacher" ? (
          <>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => onView?.(batch)}
            >
              Details
            </button>

            <Link
              className="btn btn-primary"
              to="/teacher/sessions/create"
              state={{ classroomId: batch.id }}
            >
              Schedule live class
            </Link>

            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => onEdit?.(batch)}
            >
              Edit
            </button>

            {onRegenerate && (
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => onRegenerate(batch)}
              >
                Regenerate code
              </button>
            )}

            {onDelete && (
              <button
                className="btn btn-danger"
                type="button"
                onClick={() => onDelete(batch)}
              >
                Delete
              </button>
            )}
          </>
        ) : (
          <>
            <Link className="btn btn-secondary" to={`/student/courses/${batch.course}`}>
              Course details
            </Link>

            <Link className="btn btn-primary" to="/student/sessions">
              View sessions
            </Link>
          </>
        )}
      </div>
    </article>
  );
}