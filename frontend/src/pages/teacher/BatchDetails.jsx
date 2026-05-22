import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import CopyButton from "../../components/CopyButton.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import SessionCard from "../../components/SessionCard.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { batchApi } from "../../api/batchApi";
import { classSessionApi } from "../../api/classSessionApi";
import { parseApiError } from "../../utils/validators";
import { formatDate } from "../../utils/dateFormatter";

export default function BatchDetails() {
  const { id } = useParams();
  const [batch, setBatch] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [batchRes, sessionRes] = await Promise.all([batchApi.getBatch(id), classSessionApi.getSessions()]);
        setBatch(batchRes.data);
        setSessions((sessionRes.data || []).filter((session) => String(session.classroom) === String(id)));
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <Loader label="Loading classroom details" />;
  if (!batch) return <div className="form-error">{error || "Classroom not found"}</div>;

  return (
    <div className="page-stack">
      <PageHeader title={batch.name} description={batch.description || "Classroom / batch details"} actions={<><Link className="btn btn-secondary" to={`/teacher/batches/${id}/edit`}>Edit classroom</Link><Link className="btn btn-primary" to="/teacher/sessions/create" state={{ classroomId: batch.id }}>Schedule live class</Link></>} />
      <section className="detail-panel">
        <div className="card-topline"><span className="pill">{batch.course_title}</span><StatusBadge status={batch.is_active === false ? "INACTIVE" : "ACTIVE"} /></div>
        <div className="enrollment-code-box wide-code"><span>Enrollment code</span><strong>{batch.enrollment_code || "Not generated"}</strong><CopyButton value={batch.enrollment_code} /></div>
        <div className="meta-grid detail-meta">
          <span><strong>Teacher</strong>{batch.teacher || "—"}</span>
          <span><strong>Max students</strong>{batch.max_students || "—"}</span>
          <span><strong>Self enrollment</strong>{batch.allow_self_enrollment ? "Allowed" : "Disabled"}</span>
          <span><strong>Start</strong>{formatDate(batch.start_date)}</span>
          <span><strong>End</strong>{formatDate(batch.end_date)}</span>
        </div>
      </section>
      <section className="section-card"><div className="section-heading"><h3>Scheduled live classes</h3></div>{sessions.length ? <div className="card-grid compact-grid">{sessions.map((session) => <SessionCard key={session.id} session={session} />)}</div> : <EmptyState title="No live classes scheduled" />}</section>
    </div>
  );
}
