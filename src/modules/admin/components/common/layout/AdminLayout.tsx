"use client";

import { useState } from "react";
import Sidebar from "@/modules/admin/components/common/components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <main
        className={`transition-all duration-200 ${
          sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-[240px]"
        }`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
