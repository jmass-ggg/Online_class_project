export default function EmptyState({ title, message, action }) {
  return (
    <section className="empty-state">
      <div className="empty-icon">◇</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </section>
  );
}
