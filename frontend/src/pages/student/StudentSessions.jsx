import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import SessionCard from "../../components/SessionCard.jsx";
import { classSessionApi } from "../../api/classSessionApi";
import { enrollmentApi } from "../../api/enrollmentApi";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError } from "../../utils/validators";
import { saveLiveKitSession } from "../../utils/livekitHelpers";
import {
  enrollmentToBatch,
  getSessionBatchId,
} from "../../utils/enrollmentHelpers";

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
        const [enrollmentsRes, sessionsRes] = await Promise.all([
          enrollmentApi.getMyClassrooms(),
          classSessionApi.getSessions(),
        ]);

        const myBatches = (enrollmentsRes.data || []).map(enrollmentToBatch);
        const myBatchIds = myBatches.map((batch) => String(batch.id));

        const mySessions = (sessionsRes.data || []).filter((session) =>
          myBatchIds.includes(getSessionBatchId(session))
        );

        setSessions(mySessions);
      } catch (err) {
        showToast(parseApiError(err, "Could not load live classes"), "error");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [showToast]);

  const filteredSessions = useMemo(() => {
    const rows = sessions.map((session) => ({
      ...session,
      status: String(session.status || "UPCOMING").toUpperCase(),
    }));

    if (filter === "ALL") return rows;

    return rows.filter((session) => session.status === filter);
  }, [sessions, filter]);

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
    <section className="page-stack student-page student-sessions-page">
      <PageHeader
        title="Live Classes"
        description="Join live sessions from your enrolled classrooms."
      />

      <div className="student-filter-row">
        {filters.map((item) => (
          <button
            key={item}
            className={filter === item ? "active" : ""}
            type="button"
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {filteredSessions.length ? (
        <div className="student-card-grid">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              role="student"
              onJoin={joinSession}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No live classes scheduled"
          message="Live classes from your enrolled classrooms will appear here."
        />
      )}
    </section>
  );
}