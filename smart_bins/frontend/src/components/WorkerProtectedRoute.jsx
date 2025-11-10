import React from "react";
import { Navigate } from "react-router-dom";

export default function WorkerProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (!token || role !== "worker") {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
