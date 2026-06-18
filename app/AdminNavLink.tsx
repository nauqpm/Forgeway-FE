"use client";

import { Shield } from "lucide-react";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { ADMIN_URL, IS_SUPER_ADMIN } from "@/lib/admin-url";

export default function AdminNavLink() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading || !isAuthenticated) return null;
  if (!IS_SUPER_ADMIN(user?.role)) return null;

  return (
    <a
      href={ADMIN_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#2563EB]/30 dark:border-indigo-500/30 bg-[#2563EB]/[0.07] dark:bg-indigo-500/10 px-3 py-1.5 text-sm font-medium text-[#2563EB] dark:text-indigo-300 transition hover:bg-[#2563EB]/15 dark:hover:bg-indigo-500/20 hover:border-[#2563EB]/50 dark:hover:border-indigo-500/50"
    >
      <Shield className="h-4 w-4" />
      Trang quản trị
      <span className="text-[10px] leading-none">↗</span>
    </a>
  );
}
