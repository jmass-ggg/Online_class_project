export default function StatCard({ label, value, helper, tone = "primary" }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <span>{label}</span>
      <strong>{value ?? 0}</strong>
      {helper && <small>{helper}</small>}
    </article>
  );
}
