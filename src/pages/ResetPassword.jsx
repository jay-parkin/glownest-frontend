import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

import bg from "../assets/img/bg-01.png";

// Styles
import "../styles/AuthPage.css";

const ResetPassword = () => {
  // Get the token from the URL
  const { token } = useParams();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {}, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    const response = await fetch(
      `${import.meta.env.VITE_SERVER_URL}/reset-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password: newPassword }),
      }
    );

    if (response.ok) {
      setStatus("Your password has been reset successfully.");
      localStorage.removeItem("jwt");
      navigate("/");
    } else {
      setStatus("Error resetting password.");
    }
  };

  return (
    <div className="auth-container" style={{ backgroundImage: `url(${bg})` }}>
      <div className="auth-inner-container">
        {/* Logo */}
        <div
          className="auth-logo-container"
          style={{ textAlign: "center", marginBottom: "1rem" }}
        >
          <h1 className="glow-nest-logo">
            <span style={{ color: "#000" }}>Glow</span>
            <span style={{ color: "#FF6B6B" }}>Nest</span>
          </h1>
        </div>

        {/* Heading */}
        <h2 className="auth-heading">Reset Password</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="auth-input"
            required
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="auth-input"
            required
          />

          <button type="submit" className="auth-submit-button">
            Reset Password
          </button>

          {status && (
            <div className="auth-status-container">
              <p className="status">{status}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
