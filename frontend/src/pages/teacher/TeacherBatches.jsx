import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import BatchCard from "../../components/BatchCard.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import { batchApi } from "../../api/batchApi";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError } from "../../utils/validators";

export default function TeacherBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const response = await batchApi.getBatches();
      setBatches(response.data || []);
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
      await batchApi.deleteBatch(target.id);
      showToast("Classroom deleted", "success");
      setTarget(null);
      load();
    } catch (err) {
      showToast(parseApiError(err), "error");
    } finally {
      setDeleting(false);
    }
  };

  const regenerate = async (batch) => {
    try {
      await batchApi.regenerateEnrollmentCode(batch.id);
      showToast("Enrollment code regenerated", "success");
      load();
    } catch (err) {
      if (err.response?.status === 404) showToast("Regenerate code API is not available yet.", "error");
      else showToast(parseApiError(err), "error");
    }
  };

  if (loading) return <Loader label="Loading classrooms" />;

  return (
    <div className="page-stack">
      <PageHeader title="Classrooms / Batches" description="Share enrollment codes and schedule live classes for each classroom." actions={<Link className="btn btn-primary" to="/teacher/batches/create">Create classroom</Link>} />
      {batches.length ? <div className="card-grid">{batches.map((batch) => <BatchCard key={batch.id} batch={batch} onDelete={setTarget} onRegenerate={regenerate} />)}</div> : <EmptyState title="Create your first classroom" action={<Link className="btn btn-primary" to="/teacher/batches/create">Create Classroom</Link>} />}
      <ConfirmDialog open={Boolean(target)} title="Delete classroom" message={`Delete ${target?.name || "this classroom"}?`} onClose={() => setTarget(null)} onConfirm={confirmDelete} loading={deleting} confirmLabel="Delete classroom" />
    </div>
  );
}
