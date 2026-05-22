import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import MobileSidebar from "../components/MobileSidebar.jsx";

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="dashboard-shell">
      <Sidebar />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="dashboard-main">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <section className="dashboard-content">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
