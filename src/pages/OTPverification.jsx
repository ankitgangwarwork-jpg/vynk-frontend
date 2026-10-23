import { useState } from "react";
import "./OTPverification.css";
import { api } from "../api";

function OTPVerification({ email, onVerify }) {
  const [otp, setOtp] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      alert("Please enter a 6-digit OTP");
      return;
    }

    try {
      const { token, user } = await api.verifyOtp(email, otp);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      onVerify(user);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value;

    // Sirf numbers allow karega
    if (/^\d*$/.test(value) && value.length <= 6) {
      setOtp(value);
    }
  };

  return (
    <div className="otp-page">
      <div className="otp-card">

        <h1>Verify OTP</h1>

        <p className="otp-subtitle">
          Enter the 6-digit OTP sent to your email
        </p>

        <form onSubmit={handleVerify}>

          <label>OTP Code</label>

          <input
            type="text"
            inputMode="numeric"
            maxLength="6"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={handleOtpChange}
          />

          <button type="submit" className="verify-button">
            Verify OTP
          </button>

        </form>

        <p className="resend-text">
          Didn't receive the OTP?
                  <button
            type="button"
            className="resend-button"
            onClick={async () => {
              try {
                await api.resendOtp(email);
                alert("New OTP sent");
              } catch (err) {
                alert(err.message);
              }
            }}
          >
            Resend OTP
          </button>
        </p>

      </div>
    </div>
  );
}

export default OTPVerification;
