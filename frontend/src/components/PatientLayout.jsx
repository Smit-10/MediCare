import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  HeartPulse,
  LayoutDashboard,
  Stethoscope,
  CalendarDays,
  FileText,
  CreditCard,
  UserRound,
  LockKeyhole,
  LogOut,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import "../patient.css";
import { useAuth } from "../context/AuthContext";

export default function PatientLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const links = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["doctors", "Find Doctors", Stethoscope],
    ["appointments", "Appointments", CalendarDays],
    // ["prescriptions", "Prescriptions", FileText],
    ["payment", "Payments", CreditCard],
    ["profile", "Profile", UserRound],
    ["change-password", "Change Password", LockKeyhole],
  ];

  return (
    <div className="patient-shell">
      <aside className={`patient-sidebar ${open ? "open" : ""}`}>
        <div className="side-brand">
          <div className="brand-icon">
            <HeartPulse size={27} />
          </div>
          <div>
            <b>
              Medi<span>Care</span>
            </b>
            <small>Your Health, Our Priority</small>
          </div>
        </div>
        <nav>
          {links.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={`/patient/${to}`}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                isActive ? "side-link active" : "side-link"
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          className="side-logout"
          onClick={async () => {
            await logout();
            navigate("/login", { replace: true });
          }}
        >
          <LogOut size={19} /> Logout
        </button>
      </aside>
      {open && <div className="side-overlay" onClick={() => setOpen(false)} />}
      <main className="patient-main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
          <div>
            <h2>Patient Portal</h2>
            <p>Manage your healthcare in one place</p>
          </div>
          <div className="top-actions">
            <button className="icon-btn">
              <Bell size={20} />
              <i />
            </button>
            <div className="mini-profile">
              <div>
                {(user?.username || "Patient")
                  .split(" ")
                  .map((x) => x[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <span>
                {user?.username || "Patient"}
                <small>Patient</small>
              </span>
            </div>
          </div>
        </header>
        <section className="page-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
