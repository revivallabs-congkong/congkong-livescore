import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "./DataContext";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { setUserRole, setUserId } = useData();
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

  // Sync state to DataContext on mount/update (persistence backup)
  useEffect(() => {
    if (userProfile) {
      if (userProfile.role) setUserRole(userProfile.role);
      if (userProfile.id) setUserId(userProfile.id);
    }
  }, [userProfile, setUserRole, setUserId]);

  const login = (profile) => {
    setUserProfile(profile);
    setUserRole(profile.role);
    setUserId(profile.id);
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
    setUserRole("guest");
    setUserId(null);
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
