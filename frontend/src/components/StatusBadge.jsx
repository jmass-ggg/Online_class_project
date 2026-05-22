export default function StatusBadge({ status }) {
  const normalized = String(status ?? "UNKNOWN").toUpperCase();
  return <span className={`status-badge status-${normalized.toLowerCase()}`}>{normalized}</span>;
}
