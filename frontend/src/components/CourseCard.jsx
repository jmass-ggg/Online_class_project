import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";

export default function CourseCard({ course, role = "teacher", onDelete }) {
  const base = role === "teacher" ? "/teacher/courses" : "/student/courses";
  return (
    <article className="card course-card">
      <div className="card-topline">
        <span className="pill">{course.category || "Course"}</span>
        <StatusBadge status={course.is_active === false ? "INACTIVE" : "ACTIVE"} />
      </div>
      <h3>{course.title}</h3>
      <p>{course.description}</p>
      <div className="meta-grid">
        <span><strong>Level</strong>{course.level || "—"}</span>
        <span><strong>Duration</strong>{course.duration_weeks ? `${course.duration_weeks} weeks` : "—"}</span>
        <span><strong>Teacher</strong>{course.created_by || course.teacher || "—"}</span>
      </div>
      <div className="card-actions">
        <Link className="btn btn-secondary" to={`${base}/${course.id}`}>View details</Link>
        {role === "teacher" && (
          <>
            <Link className="btn btn-ghost" to={`/teacher/courses/${course.id}/edit`}>Edit</Link>
            {onDelete && <button className="btn btn-danger" type="button" onClick={() => onDelete(course)}>Delete</button>}
          </>
        )}
      </div>
    </article>
  );
}
