import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import isTokenExpired from "../utils/authUtils";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("jwt");

    if (!token || isTokenExpired(token)) {
      localStorage.removeItem("jwt");
      setUser(null);
    } else {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (err) {
        console.error("JWT decode error:", err);
        localStorage.removeItem("jwt");
        setUser(null);
      }
    }

    setUserLoaded(true);
  }, []);

  const logout = () => {
    localStorage.removeItem("jwt");
    setUser(null);
  };

  const refreshUserFromToken = () => {
    const token = localStorage.getItem("jwt");

    if (!token || isTokenExpired(token)) {
      localStorage.removeItem("jwt");
      setUser(null);
    } else {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch {
        setUser(null);
      }
    }

    setUserLoaded(true);
  };

  return (
    <UserContext.Provider
      value={{ user, userLoaded, logout, refreshUserFromToken, setUser }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
