import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeartPulse, Mail, LockKeyhole, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { api } from "../api";
import "./Auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSendOtp = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const result = await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setMessage(result.message || "If an eligible account exists, an OTP will be sent.");
      setStep("reset");
    } catch (err) {
      setError(err.message || "Unable to send OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the six-digit OTP from your email.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const result = await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          otp,
          new_password: newPassword,
        }),
      });
      setMessage(result.message || "Password reset successfully.");
      setStep("success");
    } catch (err) {
      setError(err.message || "Unable to reset password. Check the OTP and try again.");
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
              <div className="brand-icon"><HeartPulse size={32} /></div>
              <div><h2>Medi<span>Care</span></h2><p>Your Health, Our Priority</p></div>
            </div>

            {step === "email" && (
              <>
                <div className="form-heading">
                  <h1>Forgot Password?</h1>
                  <p>Enter your registered email address and we'll send you an OTP.</p>
                </div>
                <form className="auth-form" onSubmit={handleSendOtp}>
                  <div className="input-group">
                    <Mail size={19} />
                    <input type="email" placeholder="Email Address" value={email}
                      onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                  </div>
                  {error && <p className="reset-error" role="alert">{error}</p>}
                  <button type="submit" className="primary-btn" disabled={busy}>
                    {busy ? "Sending OTP..." : "Send OTP"}
                  </button>
                </form>
                <div className="bottom-text"><Link to="/login"><ArrowLeft size={15} /> Back to Login</Link></div>
              </>
            )}

            {step === "reset" && (
              <>
                <div className="form-heading">
                  <h1>Reset Password</h1>
                  <p>Enter the six-digit OTP sent to <strong>{email}</strong> and choose a new password.</p>
                </div>
                {message && <p className="reset-message" role="status">{message}</p>}
                <form className="auth-form" onSubmit={handleResetPassword}>
                  <div className="input-group">
                    <KeyRound size={19} />
                    <input type="text" placeholder="6-digit OTP" value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" />
                  </div>
                  <div className="input-group">
                    <LockKeyhole size={19} />
                    <input type="password" placeholder="New Password (minimum 8 characters)" value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)} minLength={8} required autoComplete="new-password" />
                  </div>
                  <div className="input-group">
                    <LockKeyhole size={19} />
                    <input type="password" placeholder="Confirm New Password" value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required autoComplete="new-password" />
                  </div>
                  {error && <p className="reset-error" role="alert">{error}</p>}
                  <button type="submit" className="primary-btn" disabled={busy}>
                    {busy ? "Resetting Password..." : "Reset Password"}
                  </button>
                </form>
                <div className="bottom-text"><button type="button" className="reset-text-button" onClick={() => { setStep("email"); setOtp(""); setError(""); setMessage(""); }}>Use a different email / resend OTP</button></div>
              </>
            )}

            {step === "success" && (
              <div className="reset-success">
                <CheckCircle2 size={54} />
                <div className="form-heading">
                  <h1>Password Reset!</h1>
                  <p>Your password has been updated successfully. You can now log in with your new password.</p>
                </div>
                <button type="button" className="primary-btn" onClick={() => navigate("/login", { replace: true })}>Back to Login</button>
              </div>
            )}
          </div>
        </div>

        <div className="auth-visual-section">
          <div className="medical-glow"></div>
          <div className="reset-visual-content">
            <div className="reset-lock-circle"><LockKeyhole size={76} strokeWidth={1.4} /></div>
            <h1>Secure Account Recovery</h1>
            <p>We'll help you get back to managing your healthcare appointments securely.</p>
            <div className="feature-card">
              <div className="feature-icon"><Mail size={24} /></div>
              <div><h4>One-time verification</h4><p>Your OTP expires after 5 minutes.</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
