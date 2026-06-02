import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";
import { formatDate, formatTime } from "../utils/dateFormatter";

export default function SessionCard({
  session,
  role = "teacher",
  compact = false,
  onStart,
  onJoin,
  onComplete,
  onCancel,
  onDelete,
}) {
  const status = String(session.status || "UPCOMING").toUpperCase();

  return (
    <article className={`session-card ${compact ? "session-card-compact" : ""} session-${status.toLowerCase()}`}>
      <div className="session-main">
        <div className="card-topline">
          <span className="pill">{status}</span>
          {!compact && <StatusBadge status={status} />}
        </div>

        <h3>{session.title || session.course_title || "Live class"}</h3>

        <div className="session-meta-row">
          <span>
            <small>Date</small>
            <strong>{formatDate(session.scheduled_date)}</strong>
          </span>

          <span>
            <small>Classroom</small>
            <strong>{session.classroom_name || `Batch ${session.classroom || ""}`}</strong>
          </span>

          {!compact && (
            <span>
              <small>Time</small>
              <strong>
                {formatTime(session.start_time)} - {formatTime(session.end_time)}
              </strong>
            </span>
          )}
        </div>
      </div>

      <div className="session-actions">
        {role === "teacher" ? (
          <>
            {status === "UPCOMING" && onStart && (
              <button className="btn btn-primary" type="button" onClick={() => onStart(session)}>
                ▷ Start
              </button>
            )}

            {status === "LIVE" && onJoin && (
              <button className="btn btn-primary" type="button" onClick={() => onJoin(session)}>
                Enter room
              </button>
            )}

            {onComplete && status !== "COMPLETED" && status !== "CANCELLED" && !compact && (
              <button className="btn btn-ghost" type="button" onClick={() => onComplete(session)}>
                Complete
              </button>
            )}

            {onCancel && status !== "COMPLETED" && status !== "CANCELLED" && !compact && (
              <button className="btn btn-ghost" type="button" onClick={() => onCancel(session)}>
                Cancel
              </button>
            )}

            {!compact && (
              <Link className="btn btn-ghost" to={`/teacher/sessions/${session.id}/attendance`}>
                Attendance
              </Link>
            )}

            {onDelete && !compact && (
              <button className="btn btn-danger" type="button" onClick={() => onDelete(session)}>
                Delete
              </button>
            )}

            {compact && (
              <Link className="btn btn-primary" to={`/teacher/sessions/${session.id}/attendance`}>
                ✎ Edit
              </Link>
            )}
          </>
        ) : (
          <>
            {status === "LIVE" && (
              <button className="btn btn-primary" type="button" onClick={() => onJoin?.(session)}>
                Join Live Class
              </button>
            )}

            {status !== "LIVE" && <span className="session-note">{status.replace("_", " ")}</span>}
          </>
        )}
      </div>
    </article>
  );
}