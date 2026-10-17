import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarDays, Clock3, Search, MapPin, Video, CheckCircle2, XCircle, RotateCcw, Download, CreditCard, Smartphone, Landmark, ShieldCheck, UserRound, Stethoscope } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

function Title({ title, sub, action }) {
  return <div className="page-title"><div><h1>{title}</h1><p>{sub}</p></div>{action}</div>;
}
function Stat({ icon, title, value, note }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><div><span>{title}</span><strong>{value}</strong><small>{note}</small></div></div>;
}
function FileIcon() { return <span className="inline-icon"><span>▤</span></span>; }
function formatDate(value) {
  if (!value) return "";
  return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function formatTime(value) {
  if (!value) return "";
  const [h, m] = String(value).slice(0, 5).split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function statusLabel(status) { return status === "Confirmed" ? "Upcoming" : status; }

function AppointmentRow({ a, onCancel, onReschedule }) {
  return <div className="appointment-row">
    <div className="appointment-doc"><div className="doctor-avatar">{a.doctor?.split(" ").map(x => x[0]).join("").slice(0,2)}</div><div><h4>{a.doctor}</h4><p>{a.spec}</p><span><CalendarDays size={14}/>{formatDate(a.date)}&nbsp;<Clock3 size={14}/>{formatTime(a.time)}</span></div></div>
    <div className="appointment-right">
      <span className={`status ${String(statusLabel(a.status)).toLowerCase()}`}>{statusLabel(a.status)}</span>
      <small><Video size={14}/>Consultation</small>
      {["Pending", "Confirmed"].includes(a.status) && <div className="row-actions"><button onClick={onReschedule}><RotateCcw size={14}/>Reschedule</button><button className="danger" onClick={onCancel}><XCircle size={14}/>Cancel</button></div>}
    </div>
  </div>;
}

export function Dashboard() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  useEffect(() => { api("/appointments/").then(r => setAppointments(r.appointments || [])).catch(() => {}); }, []);
  const upcoming = appointments.filter(a => ["Pending","Confirmed"].includes(a.status));
  const completed = appointments.filter(a => a.status === "Completed");
  return <>
    <Title title={`Good Morning, ${user?.username || "Patient"} 👋`} sub="Here’s what’s happening with your healthcare today."/>
    <div className="stats-grid">
      <Stat icon={<CalendarDays/>} title="Upcoming" value={upcoming.length} note="appointments"/>
      <Stat icon={<CheckCircle2/>} title="Completed" value={completed.length} note="appointments"/>
      <Stat icon={<FileIcon/>} title="Prescriptions" value="—" note="available"/>
      <Stat icon={<CreditCard/>} title="Payments" value="—" note="this month"/>
    </div>
    <div className="dashboard-grid">
      <div className="panel"><div className="panel-head"><div><h3>Upcoming Appointment</h3><p>Your next scheduled consultation</p></div><button className="text-btn" onClick={() => nav("/patient/appointments")}>View all</button></div>
        {upcoming[0] ? <AppointmentRow a={{doctor: upcoming[0].doctor_name, spec: upcoming[0].specialization, date: upcoming[0].appointment_date, time: upcoming[0].appointment_time, status: upcoming[0].status}}/> : <p>No upcoming appointments.</p>}
      </div>
      <div className="panel quick"><h3>Quick Actions</h3><button onClick={() => nav("/patient/doctors")}><Stethoscope/>Find a Doctor</button><button onClick={() => nav("/patient/appointments")}><CalendarDays/>Manage Appointments</button><button onClick={() => nav("/patient/prescriptions")}><FileIcon/>View Prescriptions</button></div>
    </div>
  </>;
}

export function Doctors() {
  const [q, setQ] = useState(""); const [spec, setSpec] = useState("All"); const [doctors, setDoctors] = useState([]); const [error, setError] = useState("");
  useEffect(() => {
    const specs = ["Cardiology","General Physician","ENT","Pathology","Orthopedics"];
    Promise.allSettled(specs.map(s => api(`/doctors/?specialization=${encodeURIComponent(s)}`))).then(rs => {
      setDoctors(rs.flatMap(r => r.status === "fulfilled" ? r.value.doctors || [] : []));
    }).catch(e => setError(e.message));
  }, []);
  const filtered = useMemo(() => doctors.filter(d => (!q || `${d.name} ${d.specialization}`.toLowerCase().includes(q.toLowerCase())) && (spec === "All" || d.specialization === spec)), [doctors,q,spec]);
  const book = (doctor) => { sessionStorage.setItem("selectedDoctor", JSON.stringify(doctor)); window.location.href = "/patient/appointments?book=1"; };
  return <>
    <Title title="Find a Doctor" sub="Search and book an appointment with the right specialist."/>
    <div className="search-panel"><div className="search-box"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search doctor or specialization..."/></div><select value={spec} onChange={e=>setSpec(e.target.value)}><option>All</option>{["Cardiology","General Physician","ENT","Pathology","Orthopedics"].map(s=><option key={s}>{s}</option>)}</select></div>
    {error && <p>{error}</p>}
    <div className="doctor-grid">{filtered.map(d => <div className="doctor-card" key={d.doctor_id}><div className="doctor-top"><div className="doctor-avatar-lg">{d.name.split(" ").map(x=>x[0]).join("").slice(0,2)}</div><span className="available-dot">● Available</span></div><h3>{d.name}</h3><p className="spec">{d.specialization}</p><div className="doctor-meta"><span>{d.experience} Years</span><span>{d.qualification}</span></div><div className="doctor-location"><MapPin size={15}/>{d.phone}</div><button className="primary-btn small" onClick={()=>book(d)}>Book Appointment</button></div>)}</div>
  </>;
}

export function Appointments() {
  const [list, setList] = useState([]); const [booking, setBooking] = useState(false); const [selected, setSelected] = useState(null); const [date, setDate] = useState(""); const [time, setTime] = useState("10:00"); const [reason, setReason] = useState(""); const [msg, setMsg] = useState(""); const [error, setError] = useState(""); const [params] = useSearchParams();
  const bookDoctor = JSON.parse(sessionStorage.getItem("selectedDoctor") || "null");

  const load = () => api("/appointments/").then(r => setList(r.appointments || [])).catch(e => setError(e.message));
  useEffect(() => { load(); if (params.get("book") === "1" && bookDoctor) { setSelected(null); setBooking(true); } }, []);
  const cancel = async (id) => { try { await api(`/appointments/${id}/cancel`, {method:"PUT"}); setMsg("Appointment cancelled successfully."); load(); } catch(e){setError(e.message);} };
  const reschedule = (a) => { setSelected(a); setDate(String(a.appointment_date).slice(0,10)); setTime(String(a.appointment_time).slice(0,5)); setBooking(true); };
  const confirm = async () => {
    setError(""); if (!date || !time) return setError("Select date and time.");
    try {
      if (selected) {
        await api(`/appointments/${selected.appointment_id}/reschedule`, {method:"PUT", body:JSON.stringify({appointment_date:date, apppointment_time:time + (time.length===5 ? ":00" : "")})});
        setMsg("Appointment rescheduled successfully.");
      } else if (bookDoctor) {
        await api("/appointments/", {method:"POST", body:JSON.stringify({doctor_id:bookDoctor.doctor_id, appointment_date:date, appointment_time:time + (time.length===5 ? ":00" : ""), reason:reason || "General consultation"})});
        setMsg("Appointment booked successfully."); sessionStorage.removeItem("selectedDoctor");
      }
      setBooking(false); setSelected(null); load();
    } catch(e){setError(e.message);}
  };
  return <>
    <Title title="My Appointments" sub="Manage your upcoming and past consultations."/>
    {msg && <div className="success-message">{msg}</div>}{error && <div className="error-message">{error}</div>}
    <div className="appointment-list">{list.map(a => <AppointmentRow key={a.appointment_id} a={{...a, doctor:a.doctor_name, spec:a.specialization}} onCancel={()=>cancel(a.appointment_id)} onReschedule={()=>reschedule(a)}/>)}</div>
    {booking && <div className="modal-backdrop"><div className="modal"><h2>{selected ? "Reschedule Appointment" : "Book Appointment"}</h2><p>{selected ? selected.doctor_name : bookDoctor?.name}</p><label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Time<input type="time" value={time} onChange={e=>setTime(e.target.value)}/></label>{!selected && <label>Reason<input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason for appointment"/></label>}<div className="modal-actions"><button className="primary-btn" onClick={confirm}>Confirm</button><button type="button" className="secondary-btn" onClick={()=>{setBooking(false);setSelected(null)}}>Cancel</button></div></div></div>}
  </>;
}

export function Prescriptions() {
  return <><Title title="Prescriptions" sub="View your digital prescriptions."/><div className="prescription-grid"><div className="prescription-card"><div><ShieldCheck/><h3>Digital prescriptions</h3><p>Prescription APIs are not currently provided by the backend.</p></div><button className="outline-btn"><Download size={16}/> Download</button></div></div></>;
}
export function Payment() {
  const [method,setMethod]=useState("UPI");
  return <><Title title="Payments" sub="Manage your consultation payments."/><div className="payment-layout"><div className="payment-methods"><button className={method==="UPI"?"active":""} onClick={()=>setMethod("UPI")}><Smartphone/>UPI</button><button className={method==="Card"?"active":""} onClick={()=>setMethod("Card")}><CreditCard/>Card</button><button className={method==="Net Banking"?"active":""} onClick={()=>setMethod("Net Banking")}><Landmark/>Net Banking</button></div><div className="payment-summary"><h3>Payment Gateway</h3><p>{method} selected. Payment endpoints are not provided by the backend.</p></div></div></>;
}

export function Profile() {
  const [profile,setProfile]=useState(null); const [form,setForm]=useState({name:"",phone:"",dob:"",gender:"Male",address:""}); const [msg,setMsg]=useState(""); const [error,setError]=useState("");
  useEffect(()=>{api("/patients/profile").then(p=>{setProfile(p);setForm({name:p.name||"",phone:p.phone||"",dob:String(p.dob||"").slice(0,10),gender:p.gender||"Male",address:p.address||""})}).catch(e=>setError(e.message));},[]);
  const save=async()=>{try{const p=await api("/patients/profile",{method:"PUT",body:JSON.stringify(form)});setProfile(p);setMsg("Profile updated successfully.");}catch(e){setError(e.message);}};
  return <><Title title="My Profile" sub="Manage your personal information."/><div className="profile-card"><div className="profile-avatar"><UserRound size={35}/></div><h3>{profile?.name || "Patient"}</h3>{error&&<p>{error}</p>}{msg&&<p>{msg}</p>}<div className="profile-form"><label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>Date of Birth<input type="date" value={form.dob} onChange={e=>setForm({...form,dob:e.target.value})}/></label><label>Gender<select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option>Male</option><option>Female</option><option>Other</option></select></label><label>Address<input value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label></div><button className="primary-btn" onClick={save}>Save Changes</button></div></>;
}
export function ChangePassword() {
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

    if (form.new_password.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (form.current_password === form.new_password) {
      setError("Your new password must be different from your current password.");
      return;
    }

    setBusy(true);
    try {
      const result = await api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: form.current_password,
          new_password: form.new_password,
        }),
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
    <div className="profile-card password-change-card">
      <h3>Update your password</h3>
      <p>Enter your current password, then choose a new password.</p>
      {error && <div className="error-message" role="alert">{error}</div>}
      {message && <div className="success-message" role="status">{message}</div>}
      <form className="profile-form password-change-form" onSubmit={submit}>
        <label>Current Password<input type={showPasswords ? "text" : "password"} autoComplete="current-password" value={form.current_password} onChange={(e) => update("current_password", e.target.value)} required /></label>
        <label>New Password<input type={showPasswords ? "text" : "password"} autoComplete="new-password" minLength={8} value={form.new_password} onChange={(e) => update("new_password", e.target.value)} required /></label>
        <label>Confirm New Password<input type={showPasswords ? "text" : "password"} autoComplete="new-password" minLength={8} value={form.confirm_password} onChange={(e) => update("confirm_password", e.target.value)} required /></label>
        <label className="password-show-option"><input type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)} /> Show passwords</label>
        <button className="primary-btn" type="submit" disabled={busy}>{busy ? "Changing Password..." : "Change Password"}</button>
      </form>
    </div>
  </>;
}
