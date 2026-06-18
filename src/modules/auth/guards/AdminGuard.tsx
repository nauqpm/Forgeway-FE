"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { isGlobalAdminRole } from "@/modules/auth/shared/utils/admin-role";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!isGlobalAdminRole(user.role)) {
      router.replace("/unauthorized");
      return;
    }

    setChecked(true);
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || !checked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#EAEAEA] dark:border-white/10 border-t-[#2563EB] dark:border-t-[#3B82F6] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
