import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import SessionCard from "../../components/SessionCard.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import { classSessionApi } from "../../api/classSessionApi";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError } from "../../utils/validators";
import { saveLiveKitSession } from "../../utils/livekitHelpers";

export default function TeacherSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);

    try {
      const response = await classSessionApi.getSessions();
      setSessions(Array.isArray(response.data) ? response.data : response.data?.results || []);
    } catch (err) {
      showToast(parseApiError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const rows = sessions.map((session) => ({
      ...session,
      status: String(session.status || "UPCOMING").toUpperCase(),
    }));

    return {
      live: rows.filter((session) => session.status === "LIVE"),
      upcoming: rows.filter((session) => session.status === "UPCOMING"),
      completed: rows.filter((session) => session.status === "COMPLETED"),
      cancelled: rows.filter((session) => session.status === "CANCELLED"),
      total: rows.length,
    };
  }, [sessions]);

  const startSession = async (session) => {
    try {
      const response = await classSessionApi.startSession(session.id);
      saveLiveKitSession(session.id, response.data);
      showToast("Live class started", "success");
      navigate(`/live/session/${session.id}`);
    } catch (err) {
      showToast(parseApiError(err, "Live class has not started yet"), "error");
    }
  };

  const joinSession = async (session) => {
    try {
      const response = await classSessionApi.joinSession(session.id);
      saveLiveKitSession(session.id, response.data);
      navigate(`/live/session/${session.id}`);
    } catch (err) {
      showToast(parseApiError(err), "error");
    }
  };

  const completeSession = async (session) => {
    try {
      await classSessionApi.completeSession(session.id);
      showToast("Class completed", "success");
      load();
    } catch (err) {
      showToast(parseApiError(err), "error");
    }
  };

  const cancelSession = async (session) => {
    try {
      await classSessionApi.cancelSession(session.id);
      showToast("Class cancelled", "success");
      load();
    } catch (err) {
      showToast(parseApiError(err), "error");
    }
  };

  const confirmDelete = async () => {
    if (!target) return;

    setDeleting(true);

    try {
      await classSessionApi.deleteSession(target.id);
      showToast("Session deleted", "success");
      setTarget(null);
      load();
    } catch (err) {
      showToast(parseApiError(err), "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loader label="Loading live classes" />;

  return (
    <section className="page-stack teacher-sessions-page">
      <PageHeader
        eyebrow="Live Classes"
        title="Start and manage live sessions"
        description="Launch LiveKit sessions, track attendance, and manage upcoming classes."
        actions={
          <Link className="btn btn-primary" to="/teacher/sessions/create">
            ▷ Start a class
          </Link>
        }
      />

      <section className="live-stats-grid">
        <article className="lms-stat-card">
          <span>Live Now</span>
          <em>⌁</em>
          <strong>{grouped.live.length}</strong>
          <small>Sessions currently running</small>
        </article>

        <article className="lms-stat-card">
          <span>Upcoming</span>
          <em>◷</em>
          <strong>{grouped.upcoming.length}</strong>
          <small>Sessions ready to start</small>
        </article>

        <article className="lms-stat-card">
          <span>Completed</span>
          <em>✓</em>
          <strong>{grouped.completed.length}</strong>
          <small>Finished classes</small>
        </article>

        <article className="lms-stat-card">
          <span>Total Sessions</span>
          <em>▣</em>
          <strong>{grouped.total}</strong>
          <small>All scheduled live classes</small>
        </article>
      </section>

      <section className="live-now-panel">
        <div className="live-section-title">
          <strong>● Live now</strong>
          <span>Manage sessions →</span>
        </div>

        {grouped.live.length ? (
          <div className="live-session-list">
            {grouped.live.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                compact
                onJoin={joinSession}
                onComplete={completeSession}
                onCancel={cancelSession}
                onDelete={setTarget}
              />
            ))}
          </div>
        ) : (
          <div className="live-empty">
            <div className="live-empty-icon">⌁</div>
            <h3>No class is live right now</h3>
            <p>Start an upcoming class when you are ready.</p>
            <Link className="btn btn-primary" to="/teacher/sessions/create">
              ▷ Start a class
            </Link>
          </div>
        )}
      </section>

      <section className="sessions-section">
        <p className="section-eyebrow">Upcoming Sessions</p>

        {grouped.upcoming.length ? (
          <div className="live-session-list">
            {grouped.upcoming.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                compact
                onStart={startSession}
                onComplete={completeSession}
                onCancel={cancelSession}
                onDelete={setTarget}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No upcoming sessions" message="Create a live class to schedule one." />
        )}
      </section>

      <ConfirmDialog
        open={Boolean(target)}
        title="Delete session"
        message={`Delete ${target?.title || "this session"}?`}
        onClose={() => setTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        confirmLabel="Delete session"
      />
    </section>
  );
}