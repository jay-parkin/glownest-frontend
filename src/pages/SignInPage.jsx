import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import bg from "../assets/img/back.webp";

import { useUser } from "../contexts/UserContext";

// Styles
import "../styles/AuthPage.css";

// Components
import SocialContainer from "../components/SocialContainer";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { refreshUserFromToken } = useUser();

  // These can be used to show messages or loading indicators
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login"; // Set page title
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();

    // set loading animation
    setIsLoading(true);

    setStatus("");

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store JWT token in localStorage
        localStorage.setItem("jwt", data.jwt);

        refreshUserFromToken();

        // Redirect to the profile page after sign-in
        navigate("/profile");
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
        {/* Logo moved to top */}
        <div className="auth-logo-container">
          <h1 className="glow-nest-logo">
            <span style={{ color: "#000" }}>Glow</span>
            <span style={{ color: "#FF6B6B" }}>Nest</span>
          </h1>
        </div>

        {/* Optional heading */}
        <h2 className="auth-heading">Login</h2>

        <form onSubmit={handleSignIn} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            // required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            // required
          />

          <button
            type="submit"
            className="auth-submit-button"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>

          {status && (
            <div className="auth-status-container">
              <p className="auth-status">{status}</p>
            </div>
          )}

          <div className="auth-forgot-container">
            <Link to="/forgot-password" className="auth-link">
              Forgot your password?
            </Link>
            <SocialContainer />
          </div>

          <p className="auth-already-account-text">
            Don’t have an account?{" "}
            <Link to="/register" className="auth-link">
              Register now
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
