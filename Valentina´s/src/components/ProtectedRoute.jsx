import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole = "Admin" }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (
    requiredRole &&
    String(user.rol || "").toLowerCase() !== requiredRole.toLowerCase()
  ) {
    return <Navigate to="/login" replace />;
  }

  return children;
}