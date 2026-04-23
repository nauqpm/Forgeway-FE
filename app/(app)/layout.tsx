"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import Sidebar from "@/modules/app/common/components/Sidebar";
import TopBar from "@/modules/app/common/components/TopBar";
import WorkspaceSwitcher from "@/modules/app/common/components/WorkspaceSwitcher";
import NotificationPanel from "@/modules/app/common/components/NotificationPanel";
import { Menu } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { setCurrentWorkspace, currentWorkspace } = useWorkspaceStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !currentWorkspace) {
      const stored = localStorage.getItem('currentWorkspace');
      if (stored) {
        try {
          setCurrentWorkspace(JSON.parse(stored));
        } catch { /* ignore */ }
      }
    }
  }, [isAuthenticated, currentWorkspace, setCurrentWorkspace]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-60"}`}>
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
            <WorkspaceSwitcher />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}

        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
