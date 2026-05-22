import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import Loader from "../../components/Loader.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import BatchCard from "../../components/BatchCard.jsx";
import SessionCard from "../../components/SessionCard.jsx";
import { batchApi } from "../../api/batchApi";
import { classSessionApi } from "../../api/classSessionApi";
import { classSessionApi as sessionsApi } from "../../api/classSessionApi";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError } from "../../utils/validators";
import { saveLiveKitSession } from "../../utils/livekitHelpers";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const [data, setData] = useState({ batches: [], sessions: [] });
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [batches, sessions] = await Promise.all([batchApi.getBatches(), classSessionApi.getSessions()]);
        setData({ batches: batches.data || [], sessions: sessions.data || [] });
      } catch (err) {
        showToast(parseApiError(err), "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  const joinSession = async (session) => {
    try {
      const response = await sessionsApi.joinSession(session.id);
      saveLiveKitSession(session.id, response.data);
      navigate(`/live/session/${session.id}`);
    } catch (err) {
      showToast(parseApiError(err, "Live class has not started yet"), "error");
    }
  };

  if (loading) return <Loader label="Loading student dashboard" />;

  const liveSessions = data.sessions.filter((session) => session.status === "LIVE");
  const upcomingSessions = data.sessions.filter((session) => session.status === "UPCOMING");
  const completedSessions = data.sessions.filter((session) => session.status === "COMPLETED");

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Student dashboard" title="Welcome back to class" description="Join classrooms with a code, watch for live classes, and review your courses." actions={<Link className="btn btn-primary" to="/student/join-classroom">Join classroom with code</Link>} />
      <section className="stats-grid">
        <StatCard label="Joined classrooms" value={data.batches.length} helper="Backend can later filter to enrolled only" />
        <StatCard label="Upcoming live classes" value={upcomingSessions.length} tone="warning" />
        <StatCard label="Live now" value={liveSessions.length} tone="success" />
        <StatCard label="Completed classes" value={completedSessions.length} tone="muted" />
      </section>
      <section className="section-card live-highlight">
        <div className="section-heading"><h3>Live classes</h3><Link to="/student/sessions">View all</Link></div>
        {liveSessions.length ? <div className="card-grid compact-grid">{liveSessions.map((session) => <SessionCard key={session.id} session={session} role="student" onJoin={joinSession} />)}</div> : <EmptyState title="No class is live right now" />}
      </section>
      <section className="section-card">
        <div className="section-heading"><h3>Recent classrooms</h3><Link to="/student/batches">View classrooms</Link></div>
        {data.batches.length ? <div className="card-grid compact-grid">{data.batches.slice(0, 3).map((batch) => <BatchCard key={batch.id} batch={batch} role="student" />)}</div> : <EmptyState title="You have not joined any classroom yet" action={<Link className="btn btn-primary" to="/student/join-classroom">Join Classroom</Link>} />}
      </section>
    </div>
  );
}
