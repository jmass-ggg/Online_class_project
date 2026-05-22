import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";
import CopyButton from "./CopyButton.jsx";
import { formatDate } from "../utils/dateFormatter";

export default function BatchCard({ batch, role = "teacher", onDelete, onRegenerate }) {
  const activeStatus = batch.is_active === false ? "INACTIVE" : "ACTIVE";
  const selfEnrollment = batch.allow_self_enrollment ? "Self enrollment allowed" : "Self enrollment disabled";

  return (
    <article className="card batch-card">
      <div className="card-topline">
        <span className="pill">{batch.course_title || `Course #${batch.course}`}</span>
        <StatusBadge status={activeStatus} />
      </div>
      <h3>{batch.name}</h3>
      <p>{batch.description || "Classroom for live learning, enrollment, and attendance tracking."}</p>
      <div className="enrollment-code-box">
        <span>Enrollment code</span>
        <strong>{batch.enrollment_code || "Not generated"}</strong>
        {role === "teacher" && <CopyButton value={batch.enrollment_code} />}
      </div>
      <div className="meta-grid">
        <span><strong>Teacher</strong>{batch.teacher || "—"}</span>
        <span><strong>Max students</strong>{batch.max_students || "—"}</span>
        <span><strong>Start</strong>{formatDate(batch.start_date)}</span>
        <span><strong>End</strong>{formatDate(batch.end_date)}</span>
        <span><strong>Enrollment</strong>{selfEnrollment}</span>
      </div>
      <div className="card-actions">
        {role === "teacher" ? (
          <>
            <Link className="btn btn-secondary" to={`/teacher/batches/${batch.id}`}>Details</Link>
            <Link className="btn btn-primary" to="/teacher/sessions/create" state={{ classroomId: batch.id }}>Schedule live class</Link>
            <Link className="btn btn-ghost" to={`/teacher/batches/${batch.id}/edit`}>Edit</Link>
            {onRegenerate && <button className="btn btn-ghost" type="button" title="Backend endpoint not available yet" onClick={() => onRegenerate(batch)}>Regenerate code</button>}
            {onDelete && <button className="btn btn-danger" type="button" onClick={() => onDelete(batch)}>Delete</button>}
          </>
        ) : (
          <>
            <Link className="btn btn-secondary" to={`/student/courses/${batch.course}`}>Course details</Link>
            <Link className="btn btn-primary" to="/student/sessions">View sessions</Link>
          </>
        )}
      </div>
    </article>
  );
}
