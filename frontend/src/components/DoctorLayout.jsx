// src/components/DoctorLayout.jsx

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  HeartPulse,
  LayoutDashboard,
  CalendarDays,
  Clock3,
  FileText,
  UserRound,
  LockKeyhole,
  LogOut,
  Bell,
  Menu,
  X,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import "../doctor.css";
import { useAuth } from "../context/AuthContext";

export default function DoctorLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const links = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["appointments", "Appointments", CalendarDays],
    ["availability", "Availability", Clock3],
    ["prescriptions", "Prescriptions", FileText],
    ["patients", "Patients", UsersRound],
    ["profile", "Profile", UserRound],
    ["change-password", "Change Password", LockKeyhole],
  ];


  return (
    <div className="doctor-shell">
      <aside className={`doctor-sidebar ${open ? "open" : ""}`}>
        <div className="doctor-side-brand">
          <div className="doctor-brand-icon">
            <HeartPulse size={27} />
          </div>

          <div>
            <b>
              Medi<span>Care</span>
            </b>
            <small>Doctor Portal</small>
          </div>
        </div>

        <nav>
          {links.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={`/doctor/${to}`}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? "doctor-side-link active"
                  : "doctor-side-link"
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="doctor-side-logout" onClick={async () => { await logout(); navigate("/login", { replace: true }); }}>
          <LogOut size={19} />
          Logout
        </button>
      </aside>

      {open && (
        <div
          className="doctor-side-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      <main className="doctor-main">
        <header className="doctor-topbar">
          <button
            className="doctor-mobile-menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>

          <div>
            <h2>Doctor Portal</h2>
            <p>Manage your patients and appointments</p>
          </div>

          <div className="doctor-top-actions">
            <button className="doctor-icon-btn">
              <Bell size={20} />
              <i />
            </button>

            <div className="doctor-mini-profile">
              <div>{(user?.username || "Doctor").split(" ").map(x => x[0]).join("").slice(0,2).toUpperCase()}</div>

              <span>
                Dr. Rahul Sharma
                <small>Cardiologist</small>
              </span>
            </div>
          </div>
        </header>

        <section className="doctor-page-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}