import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader.jsx";
import Loader from "../../components/Loader.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import BatchCard from "../../components/BatchCard.jsx";
import { enrollmentApi } from "../../api/enrollmentApi";
import { useToast } from "../../context/ToastContext.jsx";
import { parseApiError } from "../../utils/validators";
import { enrollmentToBatch } from "../../utils/enrollmentHelpers";

export default function StudentBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const response = await enrollmentApi.getMyClassrooms();

        const myBatches = (response.data || []).map(enrollmentToBatch);

        setBatches(myBatches);
      } catch (err) {
        showToast(parseApiError(err, "Could not load your classrooms"), "error");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [showToast]);

  if (loading) return <Loader label="Loading classrooms" />;

  return (
    <div className="page-stack student-page student-batches-page">
      <PageHeader
        title="My Classrooms"
        description="Classrooms you have joined using an enrollment code."
        actions={
          <Link className="btn btn-primary" to="/student/join-classroom">
            Join classroom
          </Link>
        }
      />

      {batches.length ? (
        <div className="card-grid">
          {batches.map((batch) => (
            <BatchCard key={batch.id} batch={batch} role="student" />
          ))}
        </div>
      ) : (
        <EmptyState
          title="You have not joined any classroom yet"
          action={
            <Link className="btn btn-primary" to="/student/join-classroom">
              Join Classroom
            </Link>
          }
        />
      )}
    </div>
  );
}