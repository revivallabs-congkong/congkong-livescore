import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRole }) => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userProfile) {
      navigate("/", { replace: true });
      return;
    }

    if (allowedRole && userProfile.role !== allowedRole) {
      navigate("/", { replace: true });
    }
  }, [userProfile, navigate, allowedRole]);

  if (!userProfile) {
    return null;
  }

  if (allowedRole && userProfile.role !== allowedRole) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
