import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";

export default function ProtectedRoute({ children }: any) {
  const { token } = useAuth();

  if (!token) return <Navigate to="/login" />;

  return children;
}
