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
    isLoading,
    isLoadingPermissions,
  } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isLoading || isLoadingPermissions) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!hasAdminAccess()) {
      toast.error("Ban khong co quyen truy cap trang quan tri");
      router.replace("/login");
      return;
    }

    setIsChecking(false);
  }, [
    isAuthenticated,
    hasAdminAccess,
    router,
    pathname,
    isLoading,
    isLoadingPermissions,
  ]);

  if (isLoading || isLoadingPermissions || isChecking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mb-3 mx-auto"></div>
          <p className="text-gray-600">Dang kiem tra quyen truy cap...</p>
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
