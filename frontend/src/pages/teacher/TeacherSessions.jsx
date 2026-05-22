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

const filters = ["ALL", "UPCOMING", "LIVE", "COMPLETED", "CANCELLED"];

export default function TeacherSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const response = await classSessionApi.getSessions();
      setSessions(response.data || []);
    } catch (err) {
      showToast(parseApiError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredSessions = useMemo(() => filter === "ALL" ? sessions : sessions.filter((session) => session.status === filter), [sessions, filter]);

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
    <div className="page-stack">
      <PageHeader title="Live Classes" description="Start, enter, complete, cancel, and review attendance for class sessions." actions={<Link className="btn btn-primary" to="/teacher/sessions/create">Create live class</Link>} />
      <div className="filter-tabs">{filters.map((item) => <button key={item} className={filter === item ? "active" : ""} type="button" onClick={() => setFilter(item)}>{item}</button>)}</div>
      {filteredSessions.length ? <div className="card-grid">{filteredSessions.map((session) => <SessionCard key={session.id} session={session} onStart={startSession} onJoin={joinSession} onComplete={completeSession} onCancel={cancelSession} onDelete={setTarget} />)}</div> : <EmptyState title="No live classes scheduled" action={<Link className="btn btn-primary" to="/teacher/sessions/create">Create Live Class</Link>} />}
      <ConfirmDialog open={Boolean(target)} title="Delete session" message={`Delete ${target?.title || "this session"}?`} onClose={() => setTarget(null)} onConfirm={confirmDelete} loading={deleting} confirmLabel="Delete session" />
    </div>
  );
}
