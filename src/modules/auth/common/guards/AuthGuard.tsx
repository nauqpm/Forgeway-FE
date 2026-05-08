import React from "react";
import { useAuth } from "../repositories/authRepository";
import { Navigate } from "react-router-dom";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  // 👈 Đổi JSX.Element thành React.ReactNode
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
};

export default AuthGuard;
