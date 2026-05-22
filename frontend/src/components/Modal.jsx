export default function Modal({ title, children, open, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="Close dialog" />
      <section className="modal-card">
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}
