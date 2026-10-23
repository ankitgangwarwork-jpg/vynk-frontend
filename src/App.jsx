import { useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import OTPVerification from "./pages/OTPverification";
import Chat from "./pages/Chat";
import { disconnectSocket } from "./socket";

import "./App.css";

// Refresh par bhi login yaad rakhne ke liye
const getSavedUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user && localStorage.getItem("token") ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

function App() {
  const [page, setPage] = useState("login"); // login | register | otp
  const [email, setEmail] = useState("");
  const [user, setUser] = useState(getSavedUser);

  const handleLogout = () => {
    disconnectSocket();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setPage("login");
  };

  // Login ho chuka hai -> Chat
  if (user) {
    return <Chat user={user} onLogout={handleLogout} />;
  }

  // OTP page
  if (page === "otp") {
    return <OTPVerification email={email} onVerify={(u) => setUser(u)} />;
  }

  // Register page
  if (page === "register") {
    return (
      <Register
        onRegister={(e) => {
          setEmail(e);
          setPage("otp");
        }}
        onLogin={() => setPage("login")}
      />
    );
  }

  // Login page
  return (
    <Login
      onLogin={(e) => {
        setEmail(e);
        setPage("otp");
      }}
      onRegister={() => setPage("register")}
    />
  );
}

export default App;