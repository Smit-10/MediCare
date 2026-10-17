import { useEffect, useMemo, useState } from "react";
import { Search, HeartPulse, Stethoscope, Ear, Microscope, Bone, MapPin, CalendarDays } from "lucide-react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";

const specializations = [
  { name: "Cardiology", subtitle: "Heart", icon: HeartPulse },
  { name: "General Physician", subtitle: "Family Medicine", icon: Stethoscope },
  { name: "ENT", subtitle: "Ear, Nose & Throat", icon: Ear },
  { name: "Pathology", subtitle: "Laboratory", icon: Microscope },
  { name: "Orthopedics", subtitle: "Bones & Joints", icon: Bone },
];

export default function DoctorSearch() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("All");
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setError("");
      try {
        const responses = await Promise.allSettled(
          specializations.map((s) => api(`/doctors/?specialization=${encodeURIComponent(s.name)}`))
        );
        const merged = responses.flatMap((r) => r.status === "fulfilled" ? r.value.doctors || [] : []);
        setDoctors(merged);
      } catch (e) {
        setError(e.message);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => doctors.filter((doctor) => {
    const q = query.toLowerCase();
    return (!q || `${doctor.name} ${doctor.specialization}`.toLowerCase().includes(q)) &&
      (selected === "All" || doctor.specialization === selected);
  }), [doctors, query, selected]);

  const book = (doctor) => {
    sessionStorage.setItem("selectedDoctor", JSON.stringify(doctor));
    navigate("/patient/appointments?book=1");
  };

  return (
    <div className="doctor-search-page">
      <div className="doctor-search-title"><div><h1>Find a Doctor</h1><p>Search doctors by specialization and find the right healthcare specialist.</p></div></div>

      <div className="doctor-specialization-grid">
        {specializations.map((item) => {
          const Icon = item.icon;
          return <button key={item.name} className={selected === item.name ? "doctor-specialization-card active" : "doctor-specialization-card"} onClick={() => setSelected(item.name)}>
            <div><Icon size={24} /></div><strong>{item.name}</strong><span>{item.subtitle}</span>
          </button>;
        })}
      </div>

      <div className="doctor-search-input">
        <Search size={19} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search doctor or specialization..." />
        {selected !== "All" && <button onClick={() => setSelected("All")}>Clear</button>}
      </div>

      {error && <p>{error}</p>}
      <div className="doctor-search-result-head"><h3>{selected === "All" ? "All Specialists" : selected}</h3><span>{filtered.length} doctors found</span></div>

      <div className="doctor-search-grid">
        {filtered.map((doctor) => (
          <div className="doctor-search-card" key={doctor.doctor_id}>
            <div className="doctor-search-card-top"><div className="doctor-search-avatar">{doctor.name.split(" ").map(x => x[0]).join("").slice(0,2)}</div><span className="doctor-available">● Available</span></div>
            <h3>{doctor.name}</h3>
            <p className="doctor-search-specialization">{doctor.specialization}</p>
            <div className="doctor-search-rating"><span>{doctor.experience} Years</span><strong>{doctor.qualification}</strong></div>
            <div className="doctor-search-location"><MapPin size={14} />{doctor.phone}</div>
            <button className="doctor-primary-btn" onClick={() => book(doctor)}><CalendarDays size={16} />Book Appointment</button>
          </div>
        ))}
      </div>
    </div>
  );
}
