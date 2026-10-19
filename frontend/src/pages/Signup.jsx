import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HeartPulse,
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CalendarDays,
  Stethoscope,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../api";
import "./Auth.css";

const Signup = () => {
  const navigate = useNavigate();
  const { registerPatient } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    dob: "",
    gender: "Male",
    address: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (key, value) => setForm((x) => ({ ...x, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    // Validate phone number
    if (!/^\d{10}$/.test(form.phone)) {
      return setError("Phone number must contain exactly 10 digits.");
    }

    // Validate password strength
    if (!passwordRegex.test(form.password)) {
      return setError(
        "Password must meet all the following requirements:\n" +
        "• At least 8 characters\n" +
        "• One uppercase letter\n" +
        "• One lowercase letter\n" +
        "• One number\n" +
        "• One special character (@$!%*?&)"
      );
    }

    // Validate confirm password
    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match.");
    }

    // Validate profile details
    if (!form.dob || !form.gender || !form.address.trim()) {
      return setError("Please complete your profile details.");
    }

    setBusy(true);

    try {
      await registerPatient({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone,
        dob: form.dob,
        gender: form.gender,
        address: form.address.trim(),
      });

      navigate("/patient/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
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
                <h2>
                  Medi<span>Care</span>
                </h2>
                <p>Your Health, Our Priority</p>
              </div>
            </div>
            <div className="form-heading">
              <h1>Create Your Account</h1>
              <p>Join MediCare and manage your appointments easily.</p>
            </div>

            <form className="auth-form" onSubmit={submit}>
              <div className="input-group">
                <User size={19} />
                <input
                  required
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => change("name", e.target.value)}
                />
              </div>
              <div className="input-group">
                <Phone size={19} />
                <input
                  required
                  type="tel"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={(e) => change("phone", e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="input-group">
                <Mail size={19} />
                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(e) => change("email", e.target.value)}
                />
              </div>
              <div className="input-group">
                <CalendarDays size={19} />
                <input
                  required
                  type="date"
                  value={form.dob}
                  onChange={(e) => change("dob", e.target.value)}
                />
              </div>
              <div className="input-group">
                <User size={19} />
                <select
                  value={form.gender}
                  onChange={(e) => change("gender", e.target.value)}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="input-group">
                <Mail size={19} />
                <input
                  required
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) => change("address", e.target.value)}
                />
              </div>

              <div className="input-group password-group">
                <Lock size={19} />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => change("password", e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
              <div className="input-group password-group">
                <Lock size={19} />
                <input
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={(e) => change("confirmPassword", e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              <br />
              {error && (
                <p style={{
                  color: "#ff3333",
                  margin: "8px 0",
                  whiteSpace: "pre-line",
                  lineHeight: "1.6",
                }}>{error}</p>
              )}
              <button type="submit" className="primary-btn" disabled={busy}>
                {busy ? "Creating..." : "Create Account"}
              </button>
              <div className="google-login-divider">
                <span>or sign up with</span>
              </div>
              <button
                type="button"
                className="google-login-btn"
                onClick={() => {
                  window.location.href = `${API_URL}/auth/google`;
                }}
              >
                <span className="google-g" aria-hidden="true">
                  G
                </span>
                Sign up with Google
              </button>
              <p className="bottom-text">
                Already have an account? <a href="/login">Login</a>
              </p>
            </form>
          </div>
        </div>

        <div className="auth-visual-section signup-visual-section">
          <div className="medical-glow"></div>
          <div className="signup-medical-content">
            <div className="shield-circle">
              <ShieldCheck size={80} />
            </div>
            <h1>
              Your Health Journey
              <br />
              Starts Here
            </h1>
            <p>
              Create your account and get access to doctors, appointments and
              health services.
            </p>
            <div className="signup-feature-list">
              <div className="signup-feature">
                <div className="feature-icon">
                  <CalendarDays size={23} />
                </div>
                <div>
                  <h4>Book Anytime</h4>
                  <p>24/7 appointment booking</p>
                </div>
              </div>
              <div className="signup-feature">
                <div className="feature-icon">
                  <Stethoscope size={23} />
                </div>
                <div>
                  <h4>Top Specialists</h4>
                  <p>Find the right doctor for you</p>
                </div>
              </div>
              <div className="signup-feature">
                <div className="feature-icon">
                  <ShieldCheck size={23} />
                </div>
                <div>
                  <h4>Safe & Secure</h4>
                  <p>Your data is protected</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
