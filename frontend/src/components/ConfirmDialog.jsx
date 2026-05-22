import Modal from "./Modal.jsx";

export default function ConfirmDialog({ open, title = "Confirm action", message, confirmLabel = "Confirm", onConfirm, onClose, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="modal-message">{message}</p>
      <div className="modal-actions">
        <button className="btn btn-secondary" type="button" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-danger" type="button" onClick={onConfirm} disabled={loading}>{loading ? "Working..." : confirmLabel}</button>
      </div>
    </Modal>
  );
}
