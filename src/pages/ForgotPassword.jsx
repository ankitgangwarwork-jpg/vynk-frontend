import { useState } from "react";
import { api } from "../api";
import "./ForgotPassword.css";

function ForgotPassword({ onBack }) {
  const [step, setStep] = useState(1); // 1 = email/phone, 2 = OTP + naya password
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 1: OTP bhejo
  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!identifier.trim()) {
      alert("Please enter your email or phone number");
      return;
    }

    try {
      await api.forgotPassword(identifier.trim());
      setStep(2);
    } catch (err) {
      alert(err.message);
    }
  };

  // Step 2: OTP check + naya password
  const handleReset = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      alert("Please enter a 6-digit OTP");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await api.resetPassword(identifier.trim(), otp, password);
      alert("Password changed. Please login with your new password.");
      onBack();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResend = async () => {
    try {
      await api.forgotPassword(identifier.trim());
      alert("New OTP sent");
    } catch (err) {
      alert(err.message);
    }
  };

  // Sirf numbers allow karega
  const handleOtpChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 6) {
      setOtp(value);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        <h1>Forgot Password</h1>

        {step === 1 ? (
          <>
            <p className="forgot-subtitle">
              Enter your email or phone number. We will send you an OTP.
            </p>

            <form onSubmit={handleSendOtp}>
              <label>Email or Phone Number</label>
              <input
                type="text"
                placeholder="Enter email or phone number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />

              <button type="submit" className="forgot-button">
                Send OTP
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="forgot-subtitle">
              Enter the 6-digit OTP sent to {identifier} and set a new password.
            </p>

            <form onSubmit={handleReset}>
              <label>OTP Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength="6"
                className="forgot-otp-input"
                placeholder="000000"
                value={otp}
                onChange={handleOtpChange}
              />

              <label>New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <label>Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button type="submit" className="forgot-button">
                Change Password
              </button>
            </form>

            <p className="forgot-text">
              Didn't receive the OTP?
              <button
                type="button"
                className="forgot-text-link"
                onClick={handleResend}
              >
                Resend OTP
              </button>
            </p>
          </>
        )}

        <p className="forgot-text">
          <button type="button" className="forgot-text-link" onClick={onBack}>
            Back to Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
