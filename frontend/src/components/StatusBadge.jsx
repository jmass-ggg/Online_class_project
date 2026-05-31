export default function StatusBadge({ status }) {
  const normalized = String(status ?? "UNKNOWN").toUpperCase();
  const label = normalized.replace(/_/g, " ");
  const slug = normalized.toLowerCase().replace(/[\s_]+/g, "-");

  return <span className={`status-badge status-${slug}`}>{label}</span>;
}