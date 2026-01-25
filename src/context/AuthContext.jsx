import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(() => {
    // Lazy initialization from localStorage
    try {
      const saved = localStorage.getItem("user_profile");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse user profile", e);
      return null;
    }
  });
  const navigate = useNavigate();

  const login = (profile) => {
    setUserProfile(profile);
    localStorage.setItem("user_profile", JSON.stringify(profile));

    // Navigate based on role
    if (profile.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/judge");
    }
  };

  const logout = () => {
    setUserProfile(null);
    localStorage.removeItem("user_profile");
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ userProfile, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
