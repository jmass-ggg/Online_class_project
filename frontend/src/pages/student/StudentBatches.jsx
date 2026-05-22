import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import BatchCard from "../../components/BatchCard.jsx";
import { batchApi } from "../../api/batchApi";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError } from "../../utils/validators";

export default function StudentBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const response = await batchApi.getBatches();
        setBatches(response.data || []);
      } catch (err) {
        showToast(parseApiError(err), "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  if (loading) return <Loader label="Loading classrooms" />;

  return (
    <div className="page-stack">
      <PageHeader title="My Classrooms" description="Classrooms you can access. The code is ready for backend enrolled-only filtering when available." actions={<Link className="btn btn-primary" to="/student/join-classroom">Join classroom</Link>} />
      {batches.length ? <div className="card-grid">{batches.map((batch) => <BatchCard key={batch.id} batch={batch} role="student" />)}</div> : <EmptyState title="You have not joined any classroom yet" action={<Link className="btn btn-primary" to="/student/join-classroom">Join Classroom</Link>} />}
    </div>
  );
}
