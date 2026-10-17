import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, CheckCircle2, XCircle, FileText, UsersRound, UserRound, Plus, Trash2, Search } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

function Title({ title, sub, action }) { return <div className="doctor-page-title"><div><h1>{title}</h1><p>{sub}</p></div>{action}</div>; }
function Stat({ icon, title, value, note }) { return <div className="doctor-stat-card"><div className="doctor-stat-icon">{icon}</div><div><span>{title}</span><strong>{value}</strong><small>{note}</small></div></div>; }
function formatDate(v){ return v ? new Date(`${String(v).slice(0,10)}T00:00:00`).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : ""; }
function formatTime(v){ if(!v)return ""; const [h,m]=String(v).slice(0,5).split(":").map(Number); return new Date(2000,0,1,h,m).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}); }

function AppointmentCard({ appointment, onAccept, onReject }) {
  const status = appointment.status === "Confirmed" ? "Accepted" : appointment.status;
  return <div className="doctor-appointment-row">
    <div className="doctor-appointment-patient"><div className="doctor-patient-avatar">{appointment.patient_name?.split(" ").map(x=>x[0]).join("").slice(0,2)}</div><div><h4>{appointment.patient_name}</h4><p>{appointment.patient_phone}</p><span><CalendarDays size={14}/>{formatDate(appointment.appointment_date)}<Clock3 size={14}/>{formatTime(appointment.appointment_time)}</span></div></div>
    <div className="doctor-appointment-middle"><span className="doctor-appointment-type">Consultation</span><small>{appointment.reason}</small></div>
    <div className="doctor-appointment-right"><span className={`doctor-status ${String(status).toLowerCase()}`}>{status}</span>{appointment.status==="Pending"&&<div className="doctor-row-actions"><button onClick={()=>onAccept(appointment.appointment_id)}><CheckCircle2 size={14}/>Accept</button><button className="reject" onClick={()=>onReject(appointment.appointment_id)}><XCircle size={14}/>Reject</button></div>}</div>
  </div>;
}

export function DoctorDashboard() {
  const [appointments,setAppointments]=useState([]);
  useEffect(()=>{api("/doctors/appointments").then(r=>setAppointments(r.appointments||[])).catch(()=>{});},[]);
  const pending=appointments.filter(x=>x.status==="Pending");
  return <><Title title="Doctor Dashboard" sub="Manage your patients and appointments."/><div className="doctor-stats-grid"><Stat icon={<CalendarDays/>} title="Appointments" value={appointments.length} note="total appointments"/><Stat icon={<UsersRound/>} title="Patients" value={new Set(appointments.map(x=>x.patient_id)).size} note="unique patients"/><Stat icon={<Clock3/>} title="Pending Requests" value={pending.length} note="need response"/><Stat icon={<FileText/>} title="Prescriptions" value="—" note="not provided by API"/></div><div className="doctor-panel doctor-request-panel"><div className="doctor-panel-head"><div><h3>Appointment Requests</h3><p>Review and respond to patient requests</p></div></div>{pending.length ? pending.map(a=><AppointmentCard key={a.appointment_id} appointment={a} onAccept={()=>{}} onReject={()=>{}}/>) : <p>No pending requests.</p>}</div></>;
}

export function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const r = await api("/doctors/appointments");
      setAppointments(r.appointments || []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (id, status) => {
    try {
      setError("");

      await api(`/doctors/appointments/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });

      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const visible = appointments.filter(
    (a) =>
      filter === "All" ||
      a.status === filter ||
      (filter === "Accepted" && a.status === "Confirmed")
  );

  return (
    <>
      <Title
        title="Appointments"
        sub="Accept, reject and manage patient appointments."
      />

      <div className="doctor-tabs">
        {["All", "Pending", "Accepted", "Completed", "Rejected"].map((x) => (
          <button
            key={x}
            className={filter === x ? "active" : ""}
            onClick={() => setFilter(x)}
          >
            {x}
          </button>
        ))}
      </div>

      {error && <p>{error}</p>}

      <div className="doctor-panel doctor-appointment-list">
        {visible.length > 0 ? (
          visible.map((a) => (
            <AppointmentCard
              key={a.appointment_id}
              appointment={a}
              onAccept={() =>
                update(a.appointment_id, "Confirmed")
              }
              onReject={() =>
                update(a.appointment_id, "Rejected")
              }
            />
          ))
        ) : (
          <p>No appointments found.</p>
        )}
      </div>
    </>
  );
}

export function DoctorAvailability() {
  const [availability,setAvailability]=useState(""); const [saved,setSaved]=useState(""); const [error,setError]=useState("");
  useEffect(()=>{api("/doctors/profile").then(p=>setAvailability(p.availability||"")).catch(e=>setError(e.message));},[]);
  const save=async()=>{try{const r=await api("/doctors/availability",{method:"PUT",body:JSON.stringify({availability})});setSaved(r.availability||"Availability updated.");}catch(e){setError(e.message);}};
  return <><Title title="Availability & Schedule" sub="Manage your consultation hours and availability."/><div className="doctor-panel"><div className="doctor-panel-head"><div><h3>Current Availability</h3><p>Stored using the backend availability field.</p></div></div><textarea className="doctor-field doctor-textarea" value={availability} onChange={e=>setAvailability(e.target.value)} placeholder='Example: Monday-Friday 09:00 AM-05:00 PM'/><button className="doctor-primary-btn" onClick={save}><CheckCircle2 size={17}/>Save Availability</button>{saved&&<p>{saved}</p>}{error&&<p>{error}</p>}</div></>;
}

export function DoctorPrescriptions() {
  return <><Title title="Digital Prescriptions" sub="Create and manage digital prescriptions for your patients."/><div className="doctor-panel"><FileText/><h3>Prescription API not available</h3><p>The supplied backend does not expose prescription endpoints. The existing UI can remain until those endpoints are added.</p></div></>;
}

export function DoctorPatients() {
  const [patients,setPatients]=useState([]); const [search,setSearch]=useState(""); const [selected,setSelected]=useState(null); const [error,setError]=useState("");
  useEffect(()=>{api("/doctors/my-patients").then(r=>setPatients(r.patients||[])).catch(e=>setError(e.message));},[]);
  const filtered=useMemo(()=>patients.filter(p=>`${p.name} ${p.patient_id}`.toLowerCase().includes(search.toLowerCase())),[patients,search]);
  const history=async(id)=>{try{setSelected(await api(`/doctors/my-patients/${id}/medical_history`));}catch(e){setError(e.message);}};
  return <><Title title="Patients" sub="View patient information and medical history."/><div className="doctor-search-box"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patient by name or ID..."/></div>{error&&<p>{error}</p>}<div className="doctor-patients-grid">{filtered.map(p=><div className="doctor-patient-card" key={p.patient_id}><div className="doctor-patient-card-top"><div className="doctor-patient-avatar large">{p.name.split(" ").map(x=>x[0]).join("").slice(0,2)}</div><span>PT-{p.patient_id}</span></div><h3>{p.name}</h3><p>{p.gender} • {formatDate(p.dob)}</p><div className="doctor-patient-info"><span>Phone <b>{p.phone}</b></span></div><button className="doctor-outline-btn full" onClick={()=>history(p.patient_id)}>Medical History</button></div>)}</div>{selected&&<div className="doctor-modal-backdrop"><div className="doctor-modal"><button className="doctor-modal-close" onClick={()=>setSelected(null)}>×</button><h2>{selected.patient.name}</h2><p>{selected.patient.phone} • {selected.patient.address}</p><h3>Appointment History</h3>{selected.appointments.map(a=><div key={a.appointment_id}><b>{formatDate(a.appointment_date)} {formatTime(a.appointment_time)}</b> — {a.status} — {a.reason}</div>)}</div></div>}</>;
}

export function DoctorProfile() {
  const [form,setForm]=useState({name:"",phone:"",qualification:"",experience:0,bio:""}); const [error,setError]=useState(""); const [msg,setMsg]=useState("");
  useEffect(()=>{api("/doctors/profile").then(p=>setForm({name:p.name||"",phone:p.phone||"",qualification:p.qualification||"",experience:p.experience||0,bio:p.bio||""})).catch(e=>setError(e.message));},[]);
  const save=async()=>{try{await api("/doctors/profile",{method:"PUT",body:JSON.stringify({...form,experience:Number(form.experience)})});setMsg("Profile updated successfully.");}catch(e){setError(e.message);}};
  return <><Title title="My Profile" sub="Manage your professional information."/><div className="doctor-panel"><div className="doctor-patient-avatar large"><UserRound/></div><label className="doctor-field">Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label className="doctor-field">Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label className="doctor-field">Qualification<input value={form.qualification} onChange={e=>setForm({...form,qualification:e.target.value})}/></label><label className="doctor-field">Experience<input type="number" value={form.experience} onChange={e=>setForm({...form,experience:e.target.value})}/></label><label className="doctor-field">Bio<textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})}/></label>{error&&<p>{error}</p>}{msg&&<p>{msg}</p>}<button className="doctor-primary-btn" onClick={save}>Save Changes</button></div></>;
}
export function DoctorChangePassword() {
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [showPasswords, setShowPasswords] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (form.new_password.length < 8) return setError("Your new password must contain at least 8 characters.");
    if (form.new_password !== form.confirm_password) return setError("New password and confirmation do not match.");
    if (form.current_password === form.new_password) return setError("Your new password must be different from your current password.");

    setBusy(true);
    try {
      const result = await api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password }),
      });
      setMessage(result.message || "Password changed successfully.");
      setForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (e) {
      setError(e.message || "Unable to change password.");
    } finally {
      setBusy(false);
    }
  };

  return <>
    <Title title="Change Password" sub="Keep your MediCare account secure by updating your password." />
    <div className="doctor-panel doctor-password-panel">
      <h2>Update your password</h2>
      <p>Enter your current password, then choose a new password.</p>
      {error && <p className="doctor-password-error" role="alert">{error}</p>}
      {message && <p className="doctor-password-success" role="status">{message}</p>}
      <form className="doctor-password-form" onSubmit={submit}>
        <label className="doctor-field">Current Password<input type={showPasswords ? "text" : "password"} autoComplete="current-password" value={form.current_password} onChange={(e) => update("current_password", e.target.value)} required /></label>
        <label className="doctor-field">New Password<input type={showPasswords ? "text" : "password"} autoComplete="new-password" minLength={8} value={form.new_password} onChange={(e) => update("new_password", e.target.value)} required /></label>
        <label className="doctor-field">Confirm New Password<input type={showPasswords ? "text" : "password"} autoComplete="new-password" minLength={8} value={form.confirm_password} onChange={(e) => update("confirm_password", e.target.value)} required /></label>
        <label className="doctor-password-show"><input type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)} /> Show passwords</label>
        <button className="doctor-primary-btn" type="submit" disabled={busy}>{busy ? "Changing Password..." : "Change Password"}</button>
      </form>
    </div>
  </>;
}
