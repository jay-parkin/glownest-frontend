import { useState } from "react";
import { Link } from "react-router-dom";
import bg from "../assets/img/bg-01.png";

// Styles
import "../styles/AuthPage.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  // State for status and loading
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setStatus("");

    try {
      // Send a request to the backend to send the reset email
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/request-password-reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setStatus("A reset link has been sent to your email.");
      } else {
        setStatus(data.message);
      }
    } catch (err) {
      setStatus("Error connecting to the server");
    } finally {
      setIsLoading(false);
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
        <h2 className="auth-heading">Forgot Password</h2>

        <form onSubmit={handleReset} className="auth-form">
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            // required
          />

          <button
            type="submit"
            className="auth-submit-button"
            disabled={isLoading}
          >
            {isLoading ? "Sending Link..." : "Send Reset Link"}
          </button>

          {status && (
            <div className="auth-status-container">
              <p className="status">{status}</p>
            </div>
          )}

          <p className="auth-already-account-text">
            Remember your password?{" "}
            <Link to="/login" className="auth-link">
              Back to Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
