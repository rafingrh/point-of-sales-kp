import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const user = localStorage.getItem("user");

  // Jika tidak ada user, redirect ke login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Jika ada user, render outlet (route anak)
  return <Outlet />;
}
