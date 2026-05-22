import Sidebar from "./Sidebar.jsx";

export default function MobileSidebar({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="mobile-sidebar-layer">
      <button className="mobile-backdrop" type="button" onClick={onClose} aria-label="Close menu" />
      <div className="mobile-sidebar-panel">
        <button className="icon-button close-button" type="button" onClick={onClose} aria-label="Close menu">×</button>
        <Sidebar onNavigate={onClose} />
      </div>
    </div>
  );
}
