import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import BatchCard from "../../components/BatchCard.jsx";
import SessionCard from "../../components/SessionCard.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { courseApi } from "../../api/courseApi";
import { classSessionApi } from "../../api/classSessionApi";
import { enrollmentApi } from "../../api/enrollmentApi";
import { parseApiError } from "../../utils/validators";
import {
  enrollmentToBatch,
  getSessionBatchId,
} from "../../utils/enrollmentHelpers";

export default function StudentCourseDetails() {
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [batches, setBatches] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [courseRes, enrollmentsRes, sessionRes] = await Promise.all([
          courseApi.getCourse(id),
          enrollmentApi.getMyClassrooms(),
          classSessionApi.getSessions(),
        ]);

        const myBatches = (enrollmentsRes.data || []).map(enrollmentToBatch);

        const relatedBatches = myBatches.filter(
          (batch) => String(batch.course) === String(id)
        );

        const relatedBatchIds = relatedBatches.map((batch) =>
          String(batch.id)
        );

        const relatedSessions = (sessionRes.data || []).filter((session) =>
          relatedBatchIds.includes(getSessionBatchId(session))
        );

        setCourse(courseRes.data);
        setBatches(relatedBatches);
        setSessions(relatedSessions);
      } catch (err) {
        setError(parseApiError(err, "Could not load course details"));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) return <Loader label="Loading course" />;

  if (!course) {
    return <div className="form-error">{error || "Course not found"}</div>;
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={course.title}
        description={course.description}
        actions={
          <Link className="btn btn-primary" to="/student/sessions">
            View sessions
          </Link>
        }
      />

      <section className="detail-panel">
        <StatusBadge status={course.is_active === false ? "INACTIVE" : "ACTIVE"} />

        <div className="meta-grid detail-meta">
          <span>
            <strong>Category</strong>
            {course.category}
          </span>

          <span>
            <strong>Level</strong>
            {course.level}
          </span>

          <span>
            <strong>Duration</strong>
            {course.duration_weeks} weeks
          </span>

          <span>
            <strong>Teacher</strong>
            {course.created_by || course.teacher || "—"}
          </span>
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <h3>Your classroom for this course</h3>
        </div>

        {batches.length ? (
          <div className="card-grid compact-grid">
            {batches.map((batch) => (
              <BatchCard key={batch.id} batch={batch} role="student" />
            ))}
          </div>
        ) : (
          <EmptyState title="You have not joined a classroom for this course" />
        )}
      </section>

      <section className="section-card">
        <div className="section-heading">
          <h3>Related sessions</h3>
        </div>

        {sessions.length ? (
          <div className="card-grid compact-grid">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} role="student" />
            ))}
          </div>
        ) : (
          <EmptyState title="No live classes scheduled" />
        )}
      </section>
    </div>
  );
}