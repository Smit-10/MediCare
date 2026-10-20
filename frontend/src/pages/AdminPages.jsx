import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Stethoscope,
  UserRound,
  UsersRound,
  ShieldCheck,
  Search,
  RefreshCw,
  Plus,
  Eye,
} from "lucide-react";
import { api } from "../api";

const Title = ({ title, sub, action }) => (
  <div className="admin-page-title">
    <div>
      <h1>{title}</h1>
      <p>{sub}</p>
    </div>
    {action}
  </div>
);

const Stat = ({ icon, title, value, note }) => (
  <div className="admin-stat-card">
    <div className="admin-stat-icon">{icon}</div>
    <div>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  </div>
);

const Err = ({ children }) =>
  children ? <div className="admin-error">{children}</div> : null;

const Note = ({ children }) =>
  children ? <div className="admin-notice">{children}</div> : null;

function Table({ headers, children }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function RefreshButton({ onClick, loading = false }) {
  return (
    <button
      type="button"
      className="admin-btn"
      onClick={onClick}
      disabled={loading}
    >
      <RefreshCw size={15} />
      {loading ? "Loading..." : "Refresh"}
    </button>
  );
}

function Status({ value }) {
  const active = String(value || "Active").toLowerCase() === "active";

  return (
    <span className={`admin-status ${active ? "active" : "inactive"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function useAdminList(url) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api(url);
      setItems(response.doctors || response.patients || []);
    } catch (e) {
      setError(e.message || "Unable to load records.");
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { items, setItems, loading, error, setError, load };
}

// ADMIN DASHBOARD
export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setData(await api("/admin/dashboard"));
    } catch (e) {
      setError(e.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Title
        title="Admin Dashboard"
        sub="Monitor users, doctors and appointments across MediCare."
        action={<RefreshButton onClick={load} loading={loading} />}
      />

      <Err>{error}</Err>

      <div className="admin-stats-grid">
        <Stat icon={<UsersRound />} title="Total Users"
          value={data?.["total_users"] ?? "—"} note="registered accounts" />
        <Stat icon={<UserRound />} title="Patients"
          value={data?.["total_patients"] ?? "—"} note="patient profiles" />
        <Stat icon={<Stethoscope />} title="Doctors"
          value={data?.["total_doctors"] ?? "—"} note="doctor profiles" />
        <Stat icon={<CalendarDays />} title="Appointments"
          value={data?.["total_appointments"] ?? "—"} note="all appointments" />
      </div>

      <div className="admin-grid">
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h3>System Overview</h3>
              <p>Current MediCare activity</p>
            </div>
            <ShieldCheck size={24} />
          </div>

          {[
            ["Pending appointments", "pending_appointments"],
            ["Confirmed appointments", "confirmed_appointments"],
            ["Completed appointments", "completed_appointments"],
            ["Cancelled / rejected", "cancelled_or_rejected_appointments"],
          ].map(([label, key]) => (
            <div className="admin-overview-row" key={key}>
              <span>{label}</span>
              <b>{data?.[key] ?? "—"}</b>
            </div>
          ))}
        </div>

        <div className="admin-panel admin-security-panel">
          <CheckCircle2 size={30} />
          <h3>Administrator Access</h3>
          <p>
            This area is available only to accounts whose database role
            is set to <b>admin</b>.
          </p>
        </div>
      </div>
    </>
  );
}

// MANAGE DOCTORS
export function AdminDoctors() {
  const empty = {
    name: "",
    email: "",
    password: "",
    phone: "",
    specialization_id: "",
    qualification: "",
    experience: "",
    bio: "",
    availability: "",
  };

  const {
    items: doctors,
    setItems: setDoctors,
    loading,
    error,
    setError,
    load,
  } = useAdminList("/admin/doctors");

  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
    
  useEffect(() => {
    load();
  }, [load]);

  function update(e) {
    e.target.name == "phone" ? setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value.replace(/\D/g, ""),
    })): 
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
    
  }

  async function add(e) {
    e.preventDefault();
    setError("");
    setNotice("");

    // Validate phone number
    if (!/^\d{10}$/.test(form.phone)) {
      return setError("Phone number must contain exactly 10 digits.");
    }
    setBusy(true);
    try {
      await api("/admin/doctors", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          specialization_id: Number(form.specialization_id),
          experience: Number(form.experience),
        }),
      });

      setForm(empty);
      setNotice("Doctor added successfully.");
      await load();
    } catch (e) {
      setError(e.message || "Unable to add doctor.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(doctor) {
    if (updatingId !== null) return;

    const active =
      String(doctor.status || "Active").toLowerCase() === "active";
    const nextStatus = active ? "Inactive" : "Active";

    setUpdatingId(doctor.doctor_id);
    setError("");
    setNotice("");

    try {
      const query = new URLSearchParams({ status: nextStatus });

      await api(
        `/admin/doctors/${doctor.doctor_id}/status?${query}`,
        { method: "PUT" }
      );

      setDoctors((previous) =>
        previous.map((item) =>
          item.doctor_id === doctor.doctor_id
            ? { ...item, status: nextStatus }
            : item
        )
      );

      setNotice(`Doctor status changed to ${nextStatus}.`);
    } catch (e) {
      setError(e.message || "Unable to update doctor status.");
    } finally {
      setUpdatingId(null);
    }
  }

  const shown = doctors.filter((doctor) =>
    [
      doctor.name,
      doctor.email,
      doctor.phone,
      doctor.qualification,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  return (
    <>
      <Title
        title="Manage Doctors"
        sub="Register doctors, view records and manage account status."
        action={<RefreshButton onClick={load} loading={loading} />}
      />

      <Err>{error}</Err>
      <Note>{notice}</Note>

      <div className="admin-panel admin-form-panel">
        <div className="admin-panel-head">
          <div>
            <h3><Plus size={17} /> Register a doctor</h3>
            <p>Enter a valid specialization ID from the specializations table.</p>
          </div>
        </div>

        <form className="admin-form-grid" onSubmit={add}>
          {[
            ["name", "Full name", "text"],
            ["email", "Email address", "email"],
            ["password", "Temporary password", "password"],
            ["phone", "Phone", "tel"],
            ["specialization_id", "Specialization ID", "number"],
            ["qualification", "Qualification", "text"],
            ["experience", "Experience (years)", "number"],
            ["availability", "Availability", "text"],
          ].map(([name, label, type]) => (
            <label key={name}>
              {label}
              <input
                required
                name={name}
                type={type}
                min={type === "number" ? "1" : undefined}
                value={form[name]}
                onChange={update}
              />
            </label>
          ))}

          <label className="admin-form-wide">
            Short bio
            <textarea name="bio" value={form.bio}
              onChange={update} rows="2" />
          </label>

          <div className="admin-form-wide">
            <button type="submit" className="admin-btn primary" disabled={busy}>
              {busy ? "Adding..." : "Add Doctor"}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h3>Doctor directory</h3>
            <p>{shown.length} doctor record(s)</p>
          </div>

          <label className="admin-search">
            <Search size={16} />
            <input value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctors" />
          </label>
        </div>

        <Table headers={[
          "ID", "Name", "Phone", "Qualification", "Experience",
          "Availability", "Status", "Action",
        ]}>
          {shown.map((doctor) => {
            const active =
              String(doctor.status || "Active").toLowerCase() === "active";

            return (
              <tr key={doctor.doctor_id}>
                <td>{doctor.doctor_id}</td>
                <td>{doctor.name || "—"}</td>
                <td>{doctor.phone || "—"}</td>
                <td>{doctor.qualification || "—"}</td>
                <td>{doctor.experience ?? "—"}</td>
                <td>{doctor.availability || "—"}</td>
                <td><span className={`admin-status ${active ? "active" : "inactive"}`}>{doctor.status || "—"}</span></td>
                <td>
                  <button
                    type="button"
                    className="admin-btn small"
                    disabled={updatingId !== null}
                    onClick={() => toggle(doctor)}
                  >
                    {updatingId === doctor.doctor_id
                      ? "Updating..."
                      : active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            );
          })}

          {!shown.length && (
            <tr>
              <td colSpan="8" className="admin-empty">
                {loading ? "Loading doctors..." : "No doctors found."}
              </td>
            </tr>
          )}
        </Table>
      </div>
    </>
  );
}

// MANAGE PATIENTS
export function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams();
      if (search.trim()) query.set("search", search.trim());

      const response = await api(
        `/admin/patients${query.size ? `?${query}` : ""}`
      );

      setPatients(response.patients || []);
    } catch (e) {
      setError(e.message || "Unable to load patients.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  async function toggle(patient) {
    if (updatingId !== null) return;

    const active =
      String(patient.status || "Active").toLowerCase() === "active";
    const nextStatus = active ? "Inactive" : "Active";

    setUpdatingId(patient.patient_id);
    setError("");
    setNotice("");

    try {
      const query = new URLSearchParams({ status: nextStatus });

      await api(
        `/admin/patients/${patient.patient_id}/status?${query}`,
        { method: "PUT" }
      );

      setPatients((previous) =>
        previous.map((item) =>
          item.patient_id === patient.patient_id
            ? { ...item, status: nextStatus }
            : item
        )
      );

      setSelected((previous) =>
        previous?.patient?.patient_id === patient.patient_id
          ? {
              ...previous,
              patient: { ...previous.patient, status: nextStatus },
            }
          : previous
      );

      setNotice(`Patient status changed to ${nextStatus}.`);
    } catch (e) {
      setError(e.message || "Unable to update patient status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function view(patient) {
    setViewingId(patient.patient_id);
    setError("");
    setSelected(null);

    try {
      setSelected(await api(`/admin/patients/${patient.patient_id}`));
    } catch (e) {
      setError(e.message || "Unable to load patient details.");
    } finally {
      setViewingId(null);
    }
  }

  return (
    <>
      <Title
        title="Manage Patients"
        sub="Search patient profiles, inspect appointment history and manage status."
        action={<RefreshButton onClick={load} loading={loading} />}
      />

      <Err>{error}</Err>
      <Note>{notice}</Note>

      <div className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h3>Patient directory</h3>
            <p>{patients.length} patient record(s)</p>
          </div>

          <label className="admin-search">
            <Search size={16} />
            <input value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email or phone" />
          </label>
        </div>

        <Table headers={[
          "ID", "Name", "Email", "Phone", "Gender", "Status", "Actions",
        ]}>
          {patients.map((patient) => {
            const active =
              String(patient.status || "Active").toLowerCase() === "active";

            return (
              <tr key={patient.patient_id}>
                <td>{patient.patient_id}</td>
                <td>{patient.name || "—"}</td>
                <td>{patient.email || "—"}</td>
                <td>{patient.phone || "—"}</td>
                <td>{patient.gender || "—"}</td>
                <td><span className={`admin-status ${active ? "active" : "inactive"}`}>{patient.status || "—"}</span></td>
                <td className="admin-actions">
                  <button
                    type="button"
                    className="admin-btn small"
                    disabled={viewingId !== null}
                    onClick={() => view(patient)}
                  >
                    <Eye size={14} />
                    {viewingId === patient.patient_id ? "Loading..." : "View"}
                  </button>

                  <button
                    type="button"
                    className="admin-btn small"
                    disabled={updatingId !== null}
                    onClick={() => toggle(patient)}
                  >
                    {updatingId === patient.patient_id
                      ? "Updating..."
                      : active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            );
          })}

          {!patients.length && (
            <tr>
              <td colSpan="7" className="admin-empty">
                {loading ? "Loading patients..." : "No patients found."}
              </td>
            </tr>
          )}
        </Table>
      </div>

      {selected && (
        <div className="admin-panel admin-detail">
          <div className="admin-panel-head">
            <div>
              <h3>Patient details: {selected.patient?.name || "Patient"}</h3>
              <p>Profile and appointment history</p>
            </div>

            <button className="admin-btn small"
              onClick={() => setSelected(null)}>
              Close
            </button>
          </div>

          <div className="admin-detail-grid">
            {Object.entries(selected.patient || {})
              .filter(([key]) => key !== "user_id")
              .map(([key, value]) => (
                <div key={key}>
                  <small>{key.replaceAll("_", " ")}</small>
                  <b>
                    {value == null || value === "" ? "—" : String(value)}
                  </b>
                </div>
              ))}
          </div>

          <h4>Appointments</h4>

          <Table headers={[
            "ID", "Doctor", "Date", "Time", "Status", "Reason",
          ]}>
            {(selected.appointments || []).map((appointment) => (
              <tr key={appointment.appointment_id}>
                <td>{appointment.appointment_id}</td>
                <td>{appointment.doctor_name || appointment.doctor_id || "—"}</td>
                <td>{String(appointment.appointment_date || "").slice(0, 10) || "—"}</td>
                <td>{String(appointment.appointment_time || "").slice(0, 5) || "—"}</td>
                <td>{appointment.status || "—"}</td>
                <td>{appointment.reason || "—"}</td>
              </tr>
            ))}

            {!selected.appointments?.length && (
              <tr>
                <td colSpan="6" className="admin-empty">
                  No appointments for this patient.
                </td>
              </tr>
            )}
          </Table>
        </div>
      )}
    </>
  );
}

// MANAGE APPOINTMENTS
export function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams();

      if (status) query.set("status", status);

      if (date) {
        const [year, month, day] = date.split("-");
        query.set("appointment_date", `${day}/${month}/${year}`);
      }

      const response = await api(
        `/admin/appointments${query.size ? `?${query}` : ""}`
      );

      setAppointments(response.appointments || []);
    } catch (e) {
      setError(e.message || "Unable to load appointments.");
    } finally {
      setLoading(false);
    }
  }, [status, date]);

  useEffect(() => {
    load();
  }, [load]);

  async function change(appointment, nextStatus) {
    if (updatingId !== null) return;

    setUpdatingId(appointment.appointment_id);
    setError("");
    setNotice("");

    try {
      const query = new URLSearchParams({ status: nextStatus });

      await api(
        `/admin/appointments/${appointment.appointment_id}/status?${query}`,
        { method: "PUT" }
      );

      setAppointments((previous) =>
        previous.map((item) =>
          item.appointment_id === appointment.appointment_id
            ? { ...item, status: nextStatus }
            : item
        )
      );

      setNotice(
        `Appointment #${appointment.appointment_id} updated to ${nextStatus}.`
      );

      await load();
    } catch (e) {
      setError(e.message || "Unable to update appointment.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <Title
        title="Manage Appointments"
        sub="Review appointments, filter records and update their status."
        action={<RefreshButton onClick={load} loading={loading} />}
      />

      <Err>{error}</Err>
      <Note>{notice}</Note>

      <div className="admin-panel">
        <div className="admin-filter-row">
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {["Pending", "Confirmed", "Rejected", "Completed", "Cancelled"].map(
                (item) => <option key={item} value={item}>{item}</option>
              )}
            </select>
          </label>

          <label>
            Date
            <input type="date" value={date}
              onChange={(e) => setDate(e.target.value)} />
          </label>

          <button type="button" className="admin-btn"
            onClick={() => { setStatus(""); setDate(""); }}>
            Clear filters
          </button>
        </div>

        <Table headers={[
          "ID", "Patient", "Doctor", "Specialization", "Date",
          "Time", "Reason", "Status", "Update status",
        ]}>
          {appointments.map((appointment) => (
            <tr key={appointment.appointment_id}>
              <td>{appointment.appointment_id}</td>
              <td>{appointment.patient || "—"}</td>
              <td>{appointment.doctor || "—"}</td>
              <td>{appointment.specialization || "—"}</td>
              <td>{appointment.date || "—"}</td>
              <td>{String(appointment.time || "").slice(0, 5)}</td>
              <td className="admin-reason">{appointment.reason || "—"}</td>
              <td><span className={`admin-status ${(appointment.status || "").toLowerCase()}`}>{appointment.status || "—"}</span></td>
              <td>
                <select
                  aria-label={`Update appointment ${appointment.appointment_id}`}
                  value={appointment.status || "Pending"}
                  disabled={updatingId !== null}
                  onChange={(e) => change(appointment, e.target.value)}
                >
                  {["Pending", "Confirmed", "Rejected", "Completed", "Cancelled"].map(
                    (item) => <option key={item} value={item}>{item}</option>
                  )}
                </select>
              </td>
            </tr>
          ))}

          {!appointments.length && (
            <tr>
              <td colSpan="9" className="admin-empty">
                {loading ? "Loading appointments..." : "No appointments match these filters."}
              </td>
            </tr>
          )}
        </Table>
      </div>
    </>
  );
}
