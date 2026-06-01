import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
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

function getResults(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function getSessionStatus(session) {
  return String(session?.status || "").toUpperCase();
}

export default function TeacherDashboard() {
  const [data, setData] = useState({
    courses: [],
    batches: [],
    sessions: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const [coursesResponse, batchesResponse, sessionsResponse] =
          await Promise.all([
            courseApi.getCourses(),
            batchApi.getBatches(),
            classSessionApi.getSessions(),
          ]);

        setData({
          courses: getResults(coursesResponse.data),
          batches: getResults(batchesResponse.data),
          sessions: getResults(sessionsResponse.data),
        });
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const liveSessions = useMemo(() => {
    return data.sessions.filter((session) => getSessionStatus(session) === "LIVE");
  }, [data.sessions]);

  const upcomingSessions = useMemo(() => {
    return data.sessions.filter(
      (session) => getSessionStatus(session) === "UPCOMING"
    );
  }, [data.sessions]);

  const completedSessions = useMemo(() => {
    return data.sessions.filter(
      (session) => getSessionStatus(session) === "COMPLETED"
    );
  }, [data.sessions]);

  const activeBatches = useMemo(() => {
    return data.batches.filter((batch) => batch.is_active !== false);
  }, [data.batches]);

  if (loading) {
    return <Loader label="Loading teacher dashboard" />;
  }

  return (
    <div className="page-stack teacher-dashboard-page">
      <PageHeader
        eyebrow="Teacher dashboard"
        title="Manage your online classroom"
        description="Create courses, open classrooms, start LiveKit sessions, and review attendance."
        actions={
          <>
            <Link className="btn btn-primary" to="/teacher/courses/create">
              <span aria-hidden="true">+</span>
              Create Course
            </Link>

            <Link className="btn btn-secondary" to="/teacher/batches/create">
              <span aria-hidden="true">♧</span>
              Create Classroom
            </Link>

            <Link className="btn btn-secondary" to="/teacher/sessions/create">
              <span aria-hidden="true">▻</span>
              Create Live Class
            </Link>
          </>
        }
      />

      {error && <div className="form-error">{error}</div>}

      <section className="stats-grid teacher-dashboard-stats">
        <StatCard
          label="Courses"
          value={data.courses.length}
          helper="Teacher-created courses"
        />

        <StatCard
          label="Classrooms"
          value={activeBatches.length}
          helper="Active and inactive batches"
          tone="info"
        />

        <StatCard
          label="Total sessions"
          value={data.sessions.length}
          helper="All scheduled live classes"
          tone="warning"
        />

        <StatCard
          label="Live now"
          value={liveSessions.length}
          helper="Sessions currently running"
          tone="success"
        />

        <StatCard
          label="Upcoming"
          value={upcomingSessions.length}
          helper="Sessions ready to start"
          tone="primary"
        />

        <StatCard
          label="Completed"
          value={completedSessions.length}
          helper="Finished classes"
          tone="muted"
        />
      </section>

      <section className="dashboard-workspace-card">
        <div className="dashboard-section">
          <div className="section-heading">
            <h3>
              <span className="section-dot" />
              Live now
            </h3>

            <Link to="/teacher/sessions">Manage sessions →</Link>
          </div>

          {liveSessions.length ? (
            <div className="card-grid compact-grid">
              {liveSessions.slice(0, 2).map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No class is live right now"
              message="Start an upcoming class when you are ready."
              action={
                <Link className="btn btn-primary btn-small" to="/teacher/sessions">
                  Start a class
                </Link>
              }
            />
          )}
        </div>

        <div className="dashboard-section">
          <div className="section-heading">
            <h3>Recent courses</h3>
            <Link to="/teacher/courses">View all →</Link>
          </div>

          {data.courses.length ? (
            <div className="card-grid compact-grid dashboard-course-grid">
              {data.courses.slice(0, 3).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Create your first course"
              action={
                <Link className="btn btn-primary" to="/teacher/courses/create">
                  Create Course
                </Link>
              }
            />
          )}
        </div>

        <div className="dashboard-section">
          <div className="section-heading">
            <h3>Recent classrooms</h3>
            <Link to="/teacher/batches">View all →</Link>
          </div>

          {data.batches.length ? (
            <div className="card-grid compact-grid">
              {data.batches.slice(0, 2).map((batch) => (
                <BatchCard key={batch.id} batch={batch} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Create your first classroom"
              action={
                <Link className="btn btn-primary" to="/teacher/batches/create">
                  Create Classroom
                </Link>
              }
            />
          )}
        </div>
      </section>
    </div>
  );
}