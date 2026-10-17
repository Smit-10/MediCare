
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HeartPulse,
  User,
  Phone,
  CalendarDays,
  MapPin,
} from "lucide-react";

import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [form, setForm] = useState({
    name: user?.username || "",
    phone: "",
    dob: "",
    gender: "Male",
    address: "",
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      await api("/patients/profile", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          dob: form.dob,
          gender: form.gender,
          address: form.address.trim(),
        }),
      });

      const updatedUser = await refreshUser();

      if (!updatedUser?.profileCompleted) {
        throw new Error(
          "Profile saved, but its status could not be verified. Please try again."
        );
      }

      navigate("/patient/dashboard", {
        replace: true,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container signup-container">
        <div className="auth-form-section signup-form-section">
          <div className="auth-form-wrapper">
            <div className="brand">
              <div className="brand-icon">
                <HeartPulse size={32} />
              </div>

              <div>
                <h2>Medi<span>Care</span></h2>
                <p>Your Health, Our Priority</p>
              </div>
            </div>

            <div className="form-heading">
              <h1>Complete Your Profile</h1>
              <p>
                Add your details to start booking appointments.
              </p>
            </div>

            <form className="auth-form" onSubmit={submit}>
              <div className="input-group">
                <User size={19} />
                <input
                  required
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) =>
                    change("name", e.target.value)
                  }
                />
              </div>

              <div className="input-group">
                <Phone size={19} />
                <input
                  required
                  type="tel"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={(e) =>
                    change("phone", e.target.value)
                  }
                />
              </div>

              <div className="input-group">
                <CalendarDays size={19} />
                <input
                  required
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={form.dob}
                  onChange={(e) =>
                    change("dob", e.target.value)
                  }
                />
              </div>

              <div className="input-group">
                <User size={19} />
                <select
                  required
                  value={form.gender}
                  onChange={(e) =>
                    change("gender", e.target.value)
                  }
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="input-group">
                <MapPin size={19} />
                <input
                  required
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) =>
                    change("address", e.target.value)
                  }
                />
              </div>

              {error && (
                <p
                  style={{
                    color: "#ff7777",
                    margin: "8px 0",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="primary-btn"
                disabled={busy}
              >
                {busy ? "Saving Profile..." : "Save Profile"}
              </button>
            </form>
          </div>
        </div>

        <div className="auth-visual-section signup-visual-section">
          <div className="medical-glow"></div>

          <div className="signup-medical-content">
            <div className="shield-circle">
              <HeartPulse size={80} />
            </div>

            <h1>Your Health Journey<br />Starts Here</h1>

            <p>
              Complete your profile once to access your
              appointments and healthcare services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
