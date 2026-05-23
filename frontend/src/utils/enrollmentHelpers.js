export function enrollmentToBatch(enrollment) {
  return {
    ...(enrollment.batch || {}),
    enrollment_id: enrollment.id,
    enrollment_status: enrollment.status,
    enrolled_at: enrollment.enrolled_at,
    enrollment_updated_at: enrollment.updated_at,
  };
}

export function getSessionBatchId(session) {
  const possibleBatch =
    session.classroom ||
    session.classroom_id ||
    session.batch ||
    session.batch_id;

  if (possibleBatch && typeof possibleBatch === "object") {
    return String(possibleBatch.id || "");
  }

  return String(possibleBatch || "");
}