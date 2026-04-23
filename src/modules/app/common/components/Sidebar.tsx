"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  ListTodo,
  BookOpen,
  BarChart3,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  Zap,
  Layers,
  X,
  LogOut,
  Shield,
  Search,
  UserCog,
  Building2,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const mainNav = [
  { icon: LayoutDashboard, label: "Bảng điều khiển", href: "/" },
  { icon: FolderKanban, label: "Dự án", href: "/projects", badge: null },
  { icon: ListTodo, label: "Công việc của tôi", href: "/my-tasks", badge: null },
  { icon: CheckSquare, label: "Sprint", href: "/sprints", badge: null },
  { icon: BookOpen, label: "Cơ sở tri thức", href: "/spaces", badge: null },
  { icon: BarChart3, label: "Báo cáo", href: "/reports", badge: "sắp có" },
];

const adminNav = [
  { icon: UserCog, label: "Quản lý Người dùng", href: "/admin/users" },
  { icon: Building2, label: "Cài đặt Workspace", href: "/admin/workspace" },
  { icon: Zap, label: "Quy trình", href: "/admin/workflows" },
  { icon: Shield, label: "Phân quyền", href: "/admin/permissions" },
];

export default function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { currentWorkspace, workspaces } = useWorkspaceStore();
  const { hasAdminAccess } = useAuth();
  const [adminOpen, setAdminOpen] = useState(pathname.startsWith("/admin"));
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const isAdmin = hasAdminAccess();

  const NavItem = ({ item, showBadge }: { item: typeof mainNav[0]; showBadge?: boolean }) => {
    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
    return (
      <Link
        href={item.href}
        onClick={onMobileClose}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group relative ${
          isActive
            ? "bg-indigo-50 text-indigo-700"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`} />
        {!collapsed && (
          <>
            <span className="text-sm font-medium flex-1">{item.label}</span>
            {showBadge && item.badge && (
              <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-medium">{item.badge}</span>
            )}
          </>
        )}
        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-600 rounded-r-full" />}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onMobileClose} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-40 transition-all duration-200 flex flex-col ${
        collapsed ? "w-[68px]" : "w-[240px]"
      } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>

        {/* Logo / Brand */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2.5" onClick={onMobileClose}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            {!collapsed && <span className="font-bold text-slate-900 text-lg tracking-tight">AL-TASK</span>}
          </Link>
          <button onClick={onMobileClose} className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Scrollable nav area */}
        <div className="flex-1 overflow-y-auto py-3">
          {/* Create button */}
          {!collapsed && (
            <div className="px-3 mb-3">
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 px-3 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Tạo mới
              </button>
              {showCreateMenu && (
                <div className="mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                  <Link href="/projects/create" onClick={() => { setShowCreateMenu(false); onMobileClose(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <FolderKanban className="w-4 h-4 text-slate-400" /> Dự án mới
                  </Link>
                  <Link href="/spaces/create" onClick={() => { setShowCreateMenu(false); onMobileClose(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <BookOpen className="w-4 h-4 text-slate-400" /> Không gian mới
                  </Link>
                  <Link href="/projects" onClick={() => { setShowCreateMenu(false); onMobileClose(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <CheckSquare className="w-4 h-4 text-slate-400" /> Công việc mới
                  </Link>
                </div>
              )}
            </div>
          )}
          {collapsed && (
            <div className="px-3 mb-3 flex justify-center">
              <button onClick={() => setShowCreateMenu(!showCreateMenu)} className="w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Main Navigation */}
          <div className="px-2 space-y-0.5">
            {mainNav.map((item) => <NavItem key={item.href} item={item} />)}
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <div className="mt-4 px-2">
              <button
                onClick={() => setAdminOpen(!adminOpen)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
              >
                {!collapsed && (
                  <>
                    {adminOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    <span>Quản trị</span>
                  </>
                )}
                {collapsed && <span className="w-full text-center">Admin</span>}
              </button>
              {adminOpen && !collapsed && (
                <div className="space-y-0.5 mt-1">
                  {adminNav.map((item) => <NavItem key={item.href} item={item} />)}
                </div>
              )}
              {adminOpen && collapsed && (
                <div className="space-y-0.5 mt-1">
                  {adminNav.map((item) => (
                    <Link key={item.href} href={item.href} onClick={onMobileClose}
                      className={`flex justify-center p-2 rounded-lg transition-colors ${pathname.startsWith(item.href) ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}>
                      <item.icon className="w-[18px] h-[18px]" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom: Workspace + Settings */}
        <div className="flex-shrink-0 border-t border-slate-100 p-3 space-y-1">
          {!collapsed && currentWorkspace && (
            <div className="px-3 py-2 bg-slate-50 rounded-lg mb-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Không gian làm việc</p>
              <p className="text-sm font-medium text-slate-800 truncate">{currentWorkspace.name}</p>
            </div>
          )}
          <Link href="/settings" onClick={onMobileClose}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === "/settings" ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
            <Settings className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Cài đặt</span>}
          </Link>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => onCollapse(!collapsed)}
          className="absolute -right-3 top-[52px] w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 hidden lg:flex shadow-sm transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400 rotate-90" />}
        </button>
      </aside>
    </>
  );
}
