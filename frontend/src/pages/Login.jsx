
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  HeartPulse,
  User,
  Lock,
  Eye,
  EyeOff,
  Stethoscope,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import "./Auth.css";
import { API_URL } from "../api";

const getDestination = (user) => {
  if (
    user.role === "patient" &&
    user.profileCompleted === false
  ) {
    return "/complete-profile";
  }

  if (user.role === "doctor") {
    return "/doctor/dashboard";
  }

  if (user.role === "admin") {
    return "/admin/dashboard";
  }

  return "/patient/dashboard";
};

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("patient");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // useEffect(() => {
  //   if (user) {
  //     navigate(getDestination(user), { replace: true });
  //   }
  // }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!emailOrPhone.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setBusy(true);

    try {
      const loggedInUser = await login(
        emailOrPhone.trim(),
        password
      );
      console.log("Logged-in user role:", loggedInUser.role);
      console.log("Selected role:", selectedRole);

      if (loggedInUser.role !== selectedRole) {
        console.log("Role mismatch detected!");
        setError(`This account is registered as a ${loggedInUser.role}.`);
        return;
      }

      navigate(getDestination(loggedInUser), {
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
      <div className="auth-container">
        <div className="auth-form-section">
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
              <h1>Welcome Back!</h1>
              <p>Login to continue to your account</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="role-selection">
                <p className="role-title">Continue as</p>

                <div className="role-options">
                  <button
                    type="button"
                    className={`role-card ${selectedRole === "patient" ? "active-role" : ""}`}
                    onClick={() => setSelectedRole("patient")}
                  >
                    <div className="role-icon">
                      <User size={23} />
                    </div>
                    <div className="role-text"><h4>Patient</h4></div>
                  </button>

                  <button
                    type="button"
                    className={`role-card ${selectedRole === "doctor" ? "active-role" : ""}`}
                    onClick={() => setSelectedRole("doctor")}
                  >
                    <div className="role-icon">
                      <Stethoscope size={23} />
                    </div>
                    <div className="role-text"><h4>Doctor</h4></div>
                  </button>

                  <button
                    type="button"
                    className={`role-card ${selectedRole === "admin" ? "active-role" : ""}`}
                    onClick={() => setSelectedRole("admin")}
                  >
                    <div className="role-icon">
                      <ShieldCheck size={23} />
                    </div>
                    <div className="role-text"><h4>Admin</h4></div>
                  </button>
                </div>
              </div>

              <div className="input-group">
                <User size={19} />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  required
                />
              </div>

              <div className="input-group password-group">
                <Lock size={19} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              <div className="form-options">
                <Link to="/forgot-password">Forgot Password?</Link>
              </div>

              {error && (
                <p style={{ color: "#d33", margin: "8px 0" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="primary-btn"
                disabled={busy}
              >
                {busy
                  ? "Signing in..."
                  : `Login as ${
                      selectedRole === "doctor"
                        ? "Doctor"
                        : selectedRole === "admin"
                        ? "Admin"
                        : "Patient"
                    }`}
              </button>

              <div className="google-login-divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="google-login-btn"
                onClick={() => {
                  window.location.href = `${API_URL}/auth/google`;
                }}
              >
                <span className="google-g" aria-hidden="true">G</span>
                Continue with Google
              </button>
            </form>

            <div className="bottom-text">
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </div>
          </div>

          <div className="heartbeat">
            <svg viewBox="0 0 700 100">
              <polyline points="0,50 100,50 130,50 150,20 170,80 190,50 260,50 280,35 300,65 320,50 700,50" />
            </svg>
          </div>
        </div>

        <div className="auth-visual-section">
          <div className="medical-glow"></div>

          <div className="doctor-illustration">
            <div className="doctor-circle">
              <Stethoscope size={90} strokeWidth={1.3} />
            </div>

            <div className="doctor-info">
              <div className="doctor-avatar">
                <Stethoscope size={34} />
              </div>
              <div>
                <h3>Book Your Appointment</h3>
                <p>Connect with the best doctors anytime.</p>
              </div>
            </div>
          </div>

          <div className="feature-cards">
            <div className="feature-card">
              <div className="feature-icon"><CalendarDays size={24} /></div>
              <div>
                <h4>Easy Appointments</h4>
                <p>Book your slot in a few clicks</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><Stethoscope size={24} /></div>
              <div>
                <h4>Expert Doctors</h4>
                <p>Find your preferred specialist</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><ShieldCheck size={24} /></div>
              <div>
                <h4>Safe & Secure</h4>
                <p>Your information is protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
