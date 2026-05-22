import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import SessionCard from "../../components/SessionCard.jsx";
import { classSessionApi } from "../../api/classSessionApi";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError } from "../../utils/validators";
import { saveLiveKitSession } from "../../utils/livekitHelpers";
import { useNavigate } from "react-router-dom";

const filters = ["ALL", "UPCOMING", "LIVE", "COMPLETED", "CANCELLED"];

export default function StudentSessions() {
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const response = await classSessionApi.getSessions();
        setSessions(response.data || []);
      } catch (err) {
        showToast(parseApiError(err), "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  const filteredSessions = useMemo(() => filter === "ALL" ? sessions : sessions.filter((session) => session.status === filter), [sessions, filter]);

  const joinSession = async (session) => {
    try {
      const response = await classSessionApi.joinSession(session.id);
      saveLiveKitSession(session.id, response.data);
      navigate(`/live/session/${session.id}`);
    } catch (err) {
      showToast(parseApiError(err, "Live class has not started yet"), "error");
    }
  };

  if (loading) return <Loader label="Loading live classes" />;

  return (
    <div className="page-stack">
      <PageHeader title="Live Classes" description="Join live sessions and review class status." />
      <div className="filter-tabs">{filters.map((item) => <button key={item} className={filter === item ? "active" : ""} type="button" onClick={() => setFilter(item)}>{item}</button>)}</div>
      {filteredSessions.length ? <div className="card-grid">{filteredSessions.map((session) => <SessionCard key={session.id} session={session} role="student" onJoin={joinSession} />)}</div> : <EmptyState title="No live classes scheduled" />}
    </div>
  );
}
