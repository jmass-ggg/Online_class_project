import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import Loader from "../../components/Loader.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import CourseCard from "../../components/CourseCard.jsx";
import BatchCard from "../../components/BatchCard.jsx";
import SessionCard from "../../components/SessionCard.jsx";
import { courseApi } from "../../api/courseApi";
import { batchApi } from "../../api/batchApi";
import { classSessionApi } from "../../api/classSessionApi";
import { parseApiError } from "../../utils/validators";

export default function TeacherDashboard() {
  const [data, setData] = useState({ courses: [], batches: [], sessions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [courses, batches, sessions] = await Promise.all([
          courseApi.getCourses(), batchApi.getBatches(), classSessionApi.getSessions()
        ]);
        setData({ courses: courses.data || [], batches: batches.data || [], sessions: sessions.data || [] });
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Loader label="Loading teacher dashboard" />;

  const liveSessions = data.sessions.filter((session) => session.status === "LIVE");
  const upcomingSessions = data.sessions.filter((session) => session.status === "UPCOMING");
  const completedSessions = data.sessions.filter((session) => session.status === "COMPLETED");

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Teacher dashboard"
        title="Manage your online classroom"
        description="Create courses, open classrooms, start LiveKit sessions, and review attendance."
        actions={
          <>
            <Link className="btn btn-primary" to="/teacher/courses/create">Create Course</Link>
            <Link className="btn btn-secondary" to="/teacher/batches/create">Create Classroom</Link>
            <Link className="btn btn-secondary" to="/teacher/sessions/create">Create Live Class</Link>
          </>
        }
      />
      {error && <div className="form-error">{error}</div>}
      <section className="stats-grid">
        <StatCard label="Courses" value={data.courses.length} helper="Teacher-created courses" />
        <StatCard label="Classrooms" value={data.batches.length} helper="Active and inactive batches" tone="info" />
        <StatCard label="Total sessions" value={data.sessions.length} helper="All scheduled live classes" tone="warning" />
        <StatCard label="Live now" value={liveSessions.length} helper="Sessions currently running" tone="success" />
        <StatCard label="Upcoming" value={upcomingSessions.length} helper="Sessions ready to start" tone="primary" />
        <StatCard label="Completed" value={completedSessions.length} helper="Finished classes" tone="muted" />
      </section>

      <section className="section-card live-highlight">
        <div className="section-heading"><h3>Live now</h3><Link to="/teacher/sessions">Manage sessions</Link></div>
        {liveSessions.length ? (
          <div className="card-grid compact-grid">{liveSessions.slice(0, 2).map((session) => <SessionCard key={session.id} session={session} />)}</div>
        ) : <EmptyState title="No class is live right now" message="Start an upcoming class when you are ready." />}
      </section>

      <section className="section-card">
        <div className="section-heading"><h3>Recent courses</h3><Link to="/teacher/courses">View all</Link></div>
        {data.courses.length ? <div className="card-grid compact-grid">{data.courses.slice(0, 3).map((course) => <CourseCard key={course.id} course={course} />)}</div> : <EmptyState title="Create your first course" action={<Link className="btn btn-primary" to="/teacher/courses/create">Create Course</Link>} />}
      </section>

      <section className="section-card">
        <div className="section-heading"><h3>Recent classrooms</h3><Link to="/teacher/batches">View all</Link></div>
        {data.batches.length ? <div className="card-grid compact-grid">{data.batches.slice(0, 2).map((batch) => <BatchCard key={batch.id} batch={batch} />)}</div> : <EmptyState title="Create your first classroom" action={<Link className="btn btn-primary" to="/teacher/batches/create">Create Classroom</Link>} />}
      </section>
    </div>
  );
}
