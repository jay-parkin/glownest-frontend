import React, { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import isTokenExpired from "../utils/authUtils";

import ErrorMessage from "./ErrorMessage";
import AnimatedLoader from "./Loaders/AnimatedLoader";

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("jwt");

  const { user, userLoaded } = useUser();

  // Function to fetch protected data
  const fetchProtectedData = async (redirectOnSuccess = false) => {
    const token = localStorage.getItem("jwt");

    if (!token) {
      setError("No token found. Please sign in.");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/protectedRoute`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        // success: clear error, stop loading, and optionally redirect
        setError(null);
        setLoading(false);
        if (redirectOnSuccess) navigate("/", { replace: true });
        return;
      }

      // If the response is not ok, handle the error
      setError("Token is invalid or expired. Please sign in again.");
      localStorage.removeItem("jwt");
      navigate("/login");
    } catch (error) {
      setError("Error fetching protected data. Please try again later.");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem("jwt");
      setError("Session expired. Please sign in again.");
      navigate("/login");
      setLoading(false);
      return;
    }

    fetchProtectedData(); // Token is valid and not expired
  }, [token, navigate]);

  if (loading) {
    // Show a loading state while fetching data
    return <AnimatedLoader />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchProtectedData} />;
  }

  // If everything is valid, render the children (protected content)
  return children;
}
