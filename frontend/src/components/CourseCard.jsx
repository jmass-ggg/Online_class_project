import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";

export default function CourseCard({
  course,
  role = "teacher",
  onDelete,
  onView,
  onEdit,
}) {
  const base = role === "teacher" ? "/teacher/courses" : "/student/courses";
  const teacherName = course.created_by || course.teacher || "—";

  return (
    <article className="card course-card">
      <div className="card-topline">
        <span className="pill">{course.category || "Course"}</span>
        <StatusBadge status={course.is_active === false ? "INACTIVE" : "ACTIVE"} />
      </div>

      <div className="card-heading">
        <h3>{course.title}</h3>
      </div>

      <div className="meta-grid small-meta-grid">
        <span>
          <strong>Level</strong>
          {course.level || "—"}
        </span>

        <span>
          <strong>Duration</strong>
          {course.duration_weeks ? `${course.duration_weeks} weeks` : "—"}
        </span>

        <span className="meta-wide">
          <strong>Teacher</strong>
          {teacherName}
        </span>
      </div>

      <div className="card-actions">
        {role === "teacher" ? (
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => onView?.(course)}
          >
            View details
          </button>
        ) : (
          <Link className="btn btn-secondary" to={`${base}/${course.id}`}>
            View details
          </Link>
        )}

        {role === "teacher" && (
          <>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => onEdit?.(course)}
            >
              Edit
            </button>

            {onDelete && (
              <button
                className="btn btn-danger"
                type="button"
                onClick={() => onDelete(course)}
              >
                Delete
              </button>
            )}
          </>
        )}
      </div>
    </article>
  );
}