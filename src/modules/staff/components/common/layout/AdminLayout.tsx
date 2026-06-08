"use client";

import { useState } from "react";
import Sidebar from "@/modules/staff/components/common/components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#202020]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <main
        className={`transition-all duration-200 ${
          sidebarCollapsed ? "lg:ml-[4.25rem]" : "lg:ml-60"
        }`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
