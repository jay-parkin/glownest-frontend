import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import bg from "../assets/img/back.webp";

import { useUser } from "../contexts/UserContext";

// Styles
import "../styles/AuthPage.css";

// Components
import SocialContainer from "../components/SocialContainer";

const SignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  // Refresh user context from token
  const { refreshUserFromToken } = useUser();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("jwt", data.jwt);

        refreshUserFromToken();

        setFirstName("");
        setLastName("");
        setEmail("");
        setPhoneNumber("");
        setPassword("");
        setSuccess("Registration successful!");

        navigate("/");
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ backgroundImage: `url(${bg})` }}>
      {/* Form Container */}
      <div className="auth-inner-container">
        {/* Header */}
        <header className="glow-header">
          <h1>
            <span style={{ color: "#000" }}>Glow</span>
            <span style={{ color: "#FF6B6B" }}>Nest</span>
          </h1>
        </header>
        <h2 className="auth-title">Sign Up</h2>

        <form onSubmit={handleSignUp} className="auth-form">
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="auth-input"
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="auth-input"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            required
          />

          <input
            type="tel"
            placeholder="Phone Number"
            value={phoneNumber}
            onChange={(e) => {
              const val = e.target.value;
              // Allow only digits, max 10
              if (/^\d{0,10}$/.test(val)) {
                setPhoneNumber(val);
                setError(null); // Clear error while typing
              }
            }}
            onBlur={() => {
              if (!/^\d{10}$/.test(phoneNumber)) {
                setError("Phone number must be exactly 10 digits.");
              } else {
                setError(null); // Clear error if valid
              }
            }}
            className="auth-input"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            required
          />

          <button
            type="submit"
            className="auth-submit-button"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>

          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <SocialContainer />

          <p className="auth-already-account-text">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
