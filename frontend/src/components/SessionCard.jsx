import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";
import { formatDate, formatTime } from "../utils/dateFormatter";

export default function SessionCard({ session, role = "teacher", onStart, onJoin, onComplete, onCancel, onDelete }) {
  const status = String(session.status || "UPCOMING").toUpperCase();

  return (
    <article className={`card session-card session-${status.toLowerCase()}`}>
      <div className="card-topline">
        <span className="pill">{session.course_title || session.classroom_name || "Live class"}</span>
        <StatusBadge status={status} />
      </div>
      <h3>{session.title}</h3>
      <p>{session.description || "Live classroom session"}</p>
      <div className="meta-grid">
        <span><strong>Classroom</strong>{session.classroom_name || `#${session.classroom}`}</span>
        <span><strong>Teacher</strong>{session.teacher || "—"}</span>
        <span><strong>Date</strong>{formatDate(session.scheduled_date)}</span>
        <span><strong>Time</strong>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
        <span><strong>Room</strong>{session.livekit_room_name || "Created on start"}</span>
      </div>
      <div className="card-actions">
        {role === "teacher" ? (
          <>
            {onStart && status === "UPCOMING" && <button className="btn btn-primary" type="button" onClick={() => onStart(session)}>Start live class</button>}
            {onJoin && status === "LIVE" && <button className="btn btn-success" type="button" onClick={() => onJoin(session)}>Enter room</button>}
            {onComplete && status !== "COMPLETED" && status !== "CANCELLED" && <button className="btn btn-secondary" type="button" onClick={() => onComplete(session)}>Complete</button>}
            {onCancel && status !== "COMPLETED" && status !== "CANCELLED" && <button className="btn btn-ghost" type="button" onClick={() => onCancel(session)}>Cancel</button>}
            <Link className="btn btn-secondary" to={`/teacher/sessions/${session.id}/attendance`}>Attendance</Link>
            {onDelete && <button className="btn btn-danger" type="button" onClick={() => onDelete(session)}>Delete</button>}
          </>
        ) : (
          <>
            {status === "LIVE" && <button className="btn btn-success" type="button" onClick={() => onJoin?.(session)}>Join Live Class</button>}
            {status === "UPCOMING" && <span className="session-note">Not started yet</span>}
            {status === "COMPLETED" && <span className="session-note">Class completed</span>}
            {status === "CANCELLED" && <span className="session-note">Class cancelled</span>}
          </>
        )}
      </div>
    </article>
  );
}
