import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  HeartPulse,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Stethoscope,
  UsersRound,
  CalendarDays,
} from "lucide-react";
import "../admin.css";
import { useAuth } from "../context/AuthContext";
export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const links = [
    ["/admin/dashboard", "Dashboard", LayoutDashboard],
    ["/admin/doctors", "Doctors", Stethoscope],
    ["/admin/patients", "Patients", UsersRound],
    ["/admin/appointments", "Appointments", CalendarDays],
  ];
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-side-brand">
          <div className="admin-brand-icon">
            <HeartPulse size={27} />
          </div>
          <div>
            <b>
              Medi<span>Care</span>
            </b>
            <small>Admin Portal</small>
          </div>
        </div>
        <nav>
          {links.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? "admin-side-link active" : "admin-side-link"
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          className="admin-side-logout"
          onClick={async () => {
            await logout();
            navigate("/login", { replace: true });
          }}
        >
          <LogOut size={19} /> Logout
        </button>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h2>Admin Portal</h2>
            <p>Manage MediCare system overview</p>
          </div>
          <div className="admin-top-actions">
            <div className="admin-mini-profile">
              <div>
                <ShieldCheck size={19} />
              </div>
              <span>
                {user?.username || user?.email || "Admin"}
                <small>Administrator</small>
              </span>
            </div>
          </div>
        </header>
        <section className="admin-page-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
