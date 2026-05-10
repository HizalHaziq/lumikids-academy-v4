import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading || user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFAF5]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-[#FF8C73] border-t-transparent animate-spin" />
          <p className="text-slate-500 font-body">Loading...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dest =
      user.role === "admin" ? "/admin" :
      user.role === "teacher" ? "/teacher" :
      user.role === "parent" ? "/parent" : "/";
    return <Navigate to={dest} replace />;
  }
  return children;
}
