import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import CourseCard from "../../components/CourseCard.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import { courseApi } from "../../api/courseApi";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError } from "../../utils/validators";

export default function TeacherCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const response = await courseApi.getCourses();
      setCourses(response.data || []);
    } catch (err) {
      showToast(parseApiError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const confirmDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await courseApi.deleteCourse(target.id);
      showToast("Course deleted", "success");
      setTarget(null);
      load();
    } catch (err) {
      showToast(parseApiError(err), "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loader label="Loading courses" />;

  return (
    <div className="page-stack">
      <PageHeader title="Courses" description="Create and manage teacher-owned courses." actions={<Link className="btn btn-primary" to="/teacher/courses/create">Create course</Link>} />
      {courses.length ? <div className="card-grid">{courses.map((course) => <CourseCard key={course.id} course={course} onDelete={setTarget} />)}</div> : <EmptyState title="Create your first course" action={<Link className="btn btn-primary" to="/teacher/courses/create">Create Course</Link>} />}
      <ConfirmDialog open={Boolean(target)} title="Delete course" message={`Delete ${target?.title || "this course"}? This cannot be undone.`} onClose={() => setTarget(null)} onConfirm={confirmDelete} loading={deleting} confirmLabel="Delete course" />
    </div>
  );
}
