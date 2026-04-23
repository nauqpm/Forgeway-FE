"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ReactNode } from "react";
import { toast } from "react-hot-toast";

interface AdminGuardProps {
  children: ReactNode;
}

const AdminGuard = ({ children }: AdminGuardProps) => {
  const {
    isAuthenticated,
    hasAdminAccess,
    user,
    verifyToken,
    isLoadingPermissions,
  } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [checkAttempts, setCheckAttempts] = useState(0);

  useEffect(() => {
    const ensureAuthenticated = async () => {
      const token = localStorage.getItem("token");
      if (token && !isAuthenticated && checkAttempts < 3) {
        console.log(
          "🔄 Token found but not authenticated, trying to verify token..."
        );
        await verifyToken(token);
        setCheckAttempts((prev) => prev + 1);
      }
    };

    ensureAuthenticated();
  }, [isAuthenticated, verifyToken, checkAttempts]);

  useEffect(() => {
    const checkAccess = () => {
      setIsChecking(true);

      if (isLoadingPermissions) {
        console.log("⏳ Still loading permissions, waiting...");
        return;
      }

      const hasToken = !!localStorage.getItem("token");

      console.log("🔒 AdminGuard checking access with data:", {
        isAuthenticated,
        hasToken,
        hasAdminRole: user?.role === "admin",
        userRole: user?.role,
        pathname,
      });

      if (!isAuthenticated) {
        if (hasToken && checkAttempts < 3) {
          console.log(
            "⚠️ Has token but not authenticated, waiting for auth state to update..."
          );
          return;
        }

        console.log("🚫 User not authenticated");
        router.replace("/login");
        return;
      }

      if (!hasAdminAccess()) {
        console.log("🚫 User has no admin access");
        toast.error("Bạn không có quyền truy cập trang quản trị");
        router.replace("/login");
        return;
      }

      console.log("✅ Access check passed for:", pathname);
      setIsChecking(false);
    };

    checkAccess();
  }, [
    isAuthenticated,
    hasAdminAccess,
    router,
    pathname,
    isLoadingPermissions,
    user,
    checkAttempts,
  ]);

  if (isLoadingPermissions || isChecking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mb-3 mx-auto"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
          {checkAttempts > 0 && (
            <p className="text-gray-500 text-sm mt-2">
              Đang thử lại lần {checkAttempts}/3...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasAdminAccess()) {
    return null;
  }

  return <>{children}</>;
};

export default AdminGuard;
