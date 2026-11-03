import { useState } from "react";
import { api } from "../api";
import "./Login.css";

function Login({ onSuccess, onLogin, onRegister, onForgot }) {
  const [identifier, setIdentifier] = useState(""); // email ya phone
  const [password, setPassword] = useState("");
  const [useOtp, setUseOtp] = useState(false); // true = OTP se login

  const handleLogin = async (e) => {
    e.preventDefault();

    const id = identifier.trim();

    if (!id || (!useOtp && !password)) {
      alert("Please fill all fields");
      return;
    }

    try {
      if (useOtp) {
        await api.otpLogin(id); // email / SMS par OTP jaata hai
        onLogin(id);
        return;
      }

      const data = await api.login(id, password);

      // Email abhi verify nahi hui -> OTP page
      if (data.otpRequired) {
        onLogin(data.email);
        return;
      }

      // Seedha login (OTP nahi)
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onSuccess(data.user);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Welcome Back</h1>

        <p className="login-subtitle">Login to ChatApp</p>

        <form onSubmit={handleLogin}>
          <label>Email or Phone Number</label>
          <input
            type="text"
            placeholder="Enter email or phone number"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />

          {!useOtp && (
            <>
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                className="forgot-link"
                onClick={onForgot}
              >
                Forgot password?
              </button>
            </>
          )}

          <button type="submit" className="login-button">
            {useOtp ? "Send OTP" : "Login"}
          </button>

          <button
            type="button"
            className="mode-switch"
            onClick={() => setUseOtp(!useOtp)}
          >
            {useOtp ? "Login with password" : "Login with OTP"}
          </button>
        </form>

        <p className="register-text">
          Don't have an account?
          <button
            type="button"
            className="register-link"
            onClick={onRegister}
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;