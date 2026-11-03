import { useState, useEffect } from "react";
import { api } from "../api";
import "./PhoneSettings.css";

// Profile Settings ke andar phone number add / change / remove
function PhoneSettings() {
  const [phone, setPhone] = useState(""); // verified number
  const [step, setStep] = useState("view"); // view | enter | otp
  const [input, setInput] = useState("");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    api
      .me()
      .then((me) => setPhone(me.phone || ""))
      .catch(() => {});
  }, []);

  // Browser mein saved user mein phone update
  const saveLocalPhone = (value) => {
    try {
      const saved = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...saved, phone: value }));
    } catch {
      // ignore
    }
  };

  const sendOtp = async () => {
    if (!input.trim()) {
      alert("Enter a phone number");
      return;
    }

    try {
      const res = await api.addPhone(input.trim());
      setInput(res.phone);
      setOtp("");
      setStep("otp");
    } catch (err) {
      alert(err.message);
    }
  };

  const verify = async () => {
    if (otp.length !== 6) {
      alert("Please enter a 6-digit OTP");
      return;
    }

    try {
      const res = await api.verifyPhone(otp);
      setPhone(res.phone);
      saveLocalPhone(res.phone);
      setStep("view");
    } catch (err) {
      alert(err.message);
    }
  };

  const remove = async () => {
    if (!confirm("Remove phone number?")) return;

    try {
      await api.removePhone();
      setPhone("");
      saveLocalPhone("");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="phone-box">
      <label>Phone Number</label>

      {step === "view" && (
        <div className="phone-row">
          <span className="phone-value">{phone || "Not added"}</span>

          <button
            type="button"
            className="phone-btn"
            onClick={() => {
              setInput("");
              setStep("enter");
            }}
          >
            {phone ? "Change" : "Add"}
          </button>

          {phone && (
            <button type="button" className="phone-btn phone-remove" onClick={remove}>
              Remove
            </button>
          )}
        </div>
      )}

      {step === "enter" && (
        <>
          <input
            type="tel"
            placeholder="e.g. 9876543210"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="phone-row">
            <button type="button" className="phone-btn phone-primary" onClick={sendOtp}>
              Send OTP
            </button>
            <button type="button" className="phone-btn" onClick={() => setStep("view")}>
              Cancel
            </button>
          </div>
        </>
      )}

      {step === "otp" && (
        <>
          <p className="phone-hint">Enter the OTP sent to {input}</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength="6"
            placeholder="6-digit OTP"
            value={otp}
            onChange={(e) => {
              const v = e.target.value;
              if (/^\d*$/.test(v) && v.length <= 6) setOtp(v);
            }}
          />
          <div className="phone-row">
            <button type="button" className="phone-btn phone-primary" onClick={verify}>
              Verify
            </button>
            <button type="button" className="phone-btn" onClick={() => setStep("view")}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default PhoneSettings;