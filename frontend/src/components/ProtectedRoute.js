import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allow }) => {
  const { user, accessToken } = useAuth();

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  // Role not allowed
  if (allow && !allow.includes(user.role)) {
    // Redirect user to THEIR home
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "trainer") return <Navigate to="/trainer" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
