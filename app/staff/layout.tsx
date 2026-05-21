"use client";

import AdminLayout from "@/modules/admin/components/common/layout/AdminLayout";
import { AdminGuard } from "@/common/components/AdminGuard";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <AdminLayout>{children}</AdminLayout>
    </AdminGuard>
  );
}
