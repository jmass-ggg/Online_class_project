export default function Toast({ toast, onClose }) {
  return (
    <div className={`toast toast-${toast.type}`}>
      <span>{toast.message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss notification">×</button>
    </div>
  );
}
