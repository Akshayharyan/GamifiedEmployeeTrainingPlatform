import { Navigate } from "react-router-dom";

export default function GuestRoute({ children }) {
  const accessToken = localStorage.getItem("accessToken") || localStorage.getItem("token");

  // If logged in, redirect away from guest-only pages
  if (accessToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
