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
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#202020]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <main
        data-sidebar={sidebarCollapsed ? "collapsed" : "expanded"}
        className="app-shell-offset transition-all duration-200"
      >
        <div className="app-main">{children}</div>
      </main>
    </div>
  );
}
