import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { classSessionApi } from "../../api/classSessionApi";
import { attendanceDuration, formatDateTime } from "../../utils/dateFormatter";
import { parseApiError } from "../../utils/validators";

export default function Attendance() {
  const { id } = useParams();
  const [attendance, setAttendance] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [attendanceRes, sessionRes] = await Promise.all([classSessionApi.getAttendance(id), classSessionApi.getSession(id)]);
        setAttendance(attendanceRes.data || []);
        setSession(sessionRes.data);
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <Loader label="Loading attendance" />;

  return (
    <div className="page-stack">
      <PageHeader title="Attendance" description={session ? `${session.title} — ${session.classroom_name || "Classroom"}` : "Live class attendance"} actions={<Link className="btn btn-secondary" to="/teacher/sessions">Back to sessions</Link>} />
      {error && <div className="form-error">{error}</div>}
      {attendance.length ? (
        <div className="table-card">
          <table>
            <thead><tr><th>Student name</th><th>Joined at</th><th>Left at</th><th>Duration</th></tr></thead>
            <tbody>{attendance.map((row) => <tr key={row.id}><td>{row.student || "Student"}</td><td>{formatDateTime(row.joined_at)}</td><td>{formatDateTime(row.left_at)}</td><td>{attendanceDuration(row.joined_at, row.left_at)}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <EmptyState title="No students have joined yet" />}
    </div>
  );
}
