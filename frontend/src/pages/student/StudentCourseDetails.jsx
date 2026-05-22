import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import BatchCard from "../../components/BatchCard.jsx";
import SessionCard from "../../components/SessionCard.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { courseApi } from "../../api/courseApi";
import { batchApi } from "../../api/batchApi";
import { classSessionApi } from "../../api/classSessionApi";
import { parseApiError } from "../../utils/validators";

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
        const [courseRes, batchRes, sessionRes] = await Promise.all([courseApi.getCourse(id), batchApi.getBatches(), classSessionApi.getSessions()]);
        const relatedBatches = (batchRes.data || []).filter((batch) => String(batch.course) === String(id));
        const relatedBatchIds = relatedBatches.map((batch) => String(batch.id));
        setCourse(courseRes.data);
        setBatches(relatedBatches);
        setSessions((sessionRes.data || []).filter((session) => relatedBatchIds.includes(String(session.classroom))));
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <Loader label="Loading course" />;
  if (!course) return <div className="form-error">{error || "Course not found"}</div>;

  return (
    <div className="page-stack">
      <PageHeader title={course.title} description={course.description} actions={<Link className="btn btn-primary" to="/student/sessions">View sessions</Link>} />
      <section className="detail-panel">
        <StatusBadge status={course.is_active === false ? "INACTIVE" : "ACTIVE"} />
        <div className="meta-grid detail-meta">
          <span><strong>Category</strong>{course.category}</span>
          <span><strong>Level</strong>{course.level}</span>
          <span><strong>Duration</strong>{course.duration_weeks} weeks</span>
          <span><strong>Teacher</strong>{course.created_by || course.teacher || "—"}</span>
        </div>
      </section>
      <section className="section-card"><div className="section-heading"><h3>Related classroom information</h3></div>{batches.length ? <div className="card-grid compact-grid">{batches.map((batch) => <BatchCard key={batch.id} batch={batch} role="student" />)}</div> : <EmptyState title="No related classrooms found" />}</section>
      <section className="section-card"><div className="section-heading"><h3>Related sessions</h3></div>{sessions.length ? <div className="card-grid compact-grid">{sessions.map((session) => <SessionCard key={session.id} session={session} role="student" />)}</div> : <EmptyState title="No live classes scheduled" />}</section>
    </div>
  );
}
