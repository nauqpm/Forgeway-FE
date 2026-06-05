"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useAuth } from "@/context/AuthContext";
import { isGlobalAdminRole } from "@/modules/auth/shared/utils/admin-role";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  Zap,
  X,
  Shield,
  UserCog,
  Building2,
  Clock7,
  Star,
  ListFilter,
  Search,
  Columns,
  FolderOpen,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const mainNav = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Clock7, label: "Recent", href: "/recent" },
  { icon: Star, label: "Starred", href: "/starred" },
  {
    icon: BookOpen,
    label: "Workspaces",
    href: "/spaces",
    badge: null,
  },
  { icon: ListFilter, label: "Filter", href: "/filter" },
  { icon: FolderOpen, label: "Documents", href: "/documents" },
  { icon: BarChart3, label: "Reports", href: "/reports", badge: "Coming soon" },
];

const adminNav = [
  { icon: UserCog, label: "User Management", href: "/dashboard/users" },
  { icon: Building2, label: "Workspace Settings", href: "/dashboard/workspace" },
  { icon: Zap, label: "Workflows", href: "/dashboard/workflows" },
  { icon: Shield, label: "Permissions", href: "/dashboard/permissions" },
];

const SHOW_RECENT_NAV = false;
const SHOW_STARRED_NAV = false;
const SHOW_ADMIN_NAV = false;

const optionFilter = [
  { title: "My tasks", slug: "my-tasks" },
  { title: "Created by me", slug: "created-by-me" },
  { title: "My incomplete items", slug: "my-incomplete" },
  { title: "Incomplete", slug: "incomplete" },
  { title: "Recently created", slug: "recently-created" },
  { title: "Recently viewed", slug: "recently-viewed" },
  { title: "Recently updated", slug: "recently-updated" },
  { title: "Recently completed", slug: "recently-completed" },
];

const navActiveClass = "bg-[#EFF6FF] text-[#1E40AF] dark:bg-[rgba(37,99,235,0.15)] dark:text-[#93C5FD]";
const navInactiveClass = "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:bg-white/5 dark:hover:text-[#E8E8E7]";
const iconActiveClass = "text-[#2563EB] dark:text-[#93C5FD]";
const iconInactiveClass = "text-[#ABABAB] group-hover:text-[#787774] dark:text-[#6B6B6B] dark:group-hover:text-[#9B9A97]";

const NavItem = ({
  item,
  showBadge,
  pathname,
  onMobileClose,
  collapsed,
}: {
  item: (typeof mainNav)[0];
  showBadge?: boolean;
  pathname: string;
  onMobileClose: () => void;
  collapsed: boolean;
}) => {
  const isActive =
    pathname === item.href ||
    (item.href !== "/" && pathname.startsWith(item.href));
  return (
    <Link
      href={item.href}
      onClick={onMobileClose}
      className={`flex items-center gap-3 px-3 py-2 rounded-[6px] transition-all group relative ${
        isActive ? navActiveClass : navInactiveClass
      }`}
    >
      <item.icon
        className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? iconActiveClass : iconInactiveClass}`}
      />
      {!collapsed && (
        <>
          <span className="text-[13px] font-medium flex-1 text-left">{item.label}</span>
          {showBadge && item.badge && (
            <span className="text-[10px] bg-[#F0F0EE] text-[#787774] dark:bg-white/8 dark:text-[#9B9A97] px-1.5 py-0.5 rounded-[4px] font-medium">
              {item.badge}
            </span>
          )}
        </>
      )}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#2563EB] dark:bg-[#3B82F6] rounded-r-full" />
      )}
    </Link>
  );
};

const PopoverNavItem = ({
  item,
  type,
  activePopover,
  setActivePopover,
  collapsed,
  mounted,
}: {
  item: (typeof mainNav)[0];
  type: "recent" | "starred";
  activePopover: "recent" | "starred" | "more_spaces" | null;
  setActivePopover: (val: "recent" | "starred" | "more_spaces" | null) => void;
  collapsed: boolean;
  mounted: boolean;
}) => {
  const isActive = activePopover === type;
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const handleToggle = () => {
    if (isActive) {
      setActivePopover(null);
    } else {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        const sidebarWidth = collapsed ? 68 : 240;
        setPos({ top: rect.top, left: sidebarWidth + 12 });
      }
      setActivePopover(type);
    }
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-[6px] transition-all group ${
          isActive ? navActiveClass : navInactiveClass
        }`}
      >
        <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? iconActiveClass : iconInactiveClass}`} />
        {!collapsed && (
          <>
            <span className="text-[13px] font-medium flex-1 text-left">{item.label}</span>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        )}
      </button>

      {isActive && mounted && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setActivePopover(null)} />
          <div
            className="fixed bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[10px] z-[9999] flex flex-col w-[320px]"
            style={{
              top: `${pos.top}px`,
              left: `${pos.left}px`,
              boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center justify-between p-3 border-b border-[#EAEAEA] dark:border-white/[0.06]">
              <span className="text-[13px] font-semibold text-[#111111] dark:text-[#E8E8E7]">{item.label}</span>
              <button
                onClick={() => setActivePopover(null)}
                className="p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] text-[#ABABAB] dark:text-[#6B6B6B] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {type === "recent" && (
              <div className="flex flex-col max-h-[60vh]">
                <div className="p-3 border-b border-[#EAEAEA] dark:border-white/[0.06]">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#ABABAB] dark:text-[#6B6B6B] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search recent items"
                      className="w-full pl-9 pr-3 py-2 bg-[#F9F9F8] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[6px] text-[13px] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B] focus:border-[#111111] dark:focus:border-[#3B82F6] outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-4">
                  <div>
                    <h4 className="text-[10px] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] mb-1 px-2 uppercase tracking-[0.06em]">Today</h4>
                    <div className="space-y-0.5">
                      <Link href="/spaces/mock-1" className="flex items-center gap-3 p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded-[6px] bg-[#F0F0EE] dark:bg-white/8 border border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-center text-[#787774] dark:text-[#9B9A97]"><Columns className="w-4 h-4" /></div>
                        <div>
                          <p className="text-[13px] font-medium text-[#111111] dark:text-[#E8E8E7]">QUAN board</p>
                          <p className="text-[11px] text-[#787774] dark:text-[#9B9A97]">6 seconds ago</p>
                        </div>
                      </Link>
                      <Link href="/spaces/mock-2" className="flex items-center gap-3 p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white font-bold text-xs">Q</div>
                        <div>
                          <p className="text-[13px] font-medium text-[#111111] dark:text-[#E8E8E7]">quan</p>
                          <p className="text-[11px] text-[#787774] dark:text-[#9B9A97]">7 seconds ago</p>
                        </div>
                      </Link>
                      <Link href="/filter/my-tasks" className="flex items-center gap-3 p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[#ABABAB] dark:text-[#6B6B6B]"><ListFilter className="w-4 h-4" /></div>
                        <div>
                          <p className="text-[13px] font-medium text-[#111111] dark:text-[#E8E8E7]">Reported by me</p>
                          <p className="text-[11px] text-[#787774] dark:text-[#9B9A97]">14 seconds ago</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] mb-1 px-2 uppercase tracking-[0.06em]">More than 1 month ago</h4>
                    <div className="space-y-0.5">
                      <Link href="/spaces/mock-3" className="flex items-center gap-3 p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded-[6px] bg-[#F0F0EE] dark:bg-white/8 border border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-center text-[#787774] dark:text-[#9B9A97]"><Columns className="w-4 h-4" /></div>
                        <div>
                          <p className="text-[13px] font-medium text-[#111111] dark:text-[#E8E8E7]">SCRUM board</p>
                          <p className="text-[11px] text-[#787774] dark:text-[#9B9A97]">5 days ago</p>
                        </div>
                      </Link>
                      <Link href="/spaces/mock-4" className="flex items-center gap-3 p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white font-bold text-xs"><Zap className="w-3.5 h-3.5" /></div>
                        <div>
                          <p className="text-[13px] font-medium text-[#111111] dark:text-[#E8E8E7]">My Software Team</p>
                          <p className="text-[11px] text-[#787774] dark:text-[#9B9A97]">5 days ago</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="p-2 border-t border-[#EAEAEA] dark:border-white/[0.06]">
                  <button className="w-full text-left p-2 text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors">
                    View all recent items
                  </button>
                </div>
              </div>
            )}

            {type === "starred" && (
              <div className="flex flex-col">
                <div className="p-8 text-center flex flex-col items-center">
                  <div className="w-20 h-20 mb-4 relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#F0F0EE] dark:bg-white/5 rounded-full scale-150 opacity-50" />
                    <Star className="w-10 h-10 text-[#ABABAB] dark:text-[#6B6B6B] relative z-10" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#2563EB] dark:bg-[#3B82F6] rounded-full flex items-center justify-center z-20 text-white dark:text-[#111111] border-2 border-white dark:border-[#1A1A1A]">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h4 className="text-[14px] font-semibold text-[#111111] dark:text-[#E8E8E7] mb-2 mt-4">You have not starred any items.</h4>
                  <p className="text-[13px] text-[#787774] dark:text-[#9B9A97] leading-relaxed">Star important items for quick access. They will appear here.</p>
                </div>
                <div className="p-2 border-t border-[#EAEAEA] dark:border-white/[0.06]">
                  <button className="w-full text-left p-2 text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors">
                    View all starred items
                  </button>
                </div>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default function Sidebar({
  collapsed,
  onCollapse,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { currentWorkspace } = useWorkspaceStore();
  const { user } = useAuth();
  const [adminOpen, setAdminOpen] = useState(pathname.startsWith("/dashboard"));
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [spaceOpen, setSpaceOpen] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sidebarSpaces, setSidebarSpaces] = useState<any[]>([]);
  const [activePopover, setActivePopover] = useState<"recent" | "starred" | "more_spaces" | null>(null);
  const [moreSpacesPos, setMoreSpacesPos] = useState({ top: 0, left: 0 });
  const moreSpacesBtnRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  const handleToggleMoreSpaces = () => {
    if (activePopover === "more_spaces") {
      setActivePopover(null);
    } else {
      if (moreSpacesBtnRef.current) {
        const rect = moreSpacesBtnRef.current.getBoundingClientRect();
        const sidebarWidth = collapsed ? 68 : 240;
        setMoreSpacesPos({ top: rect.top, left: sidebarWidth + 12 });
      }
      setActivePopover("more_spaces");
    }
  };

  useEffect(() => {
    const fetchSpaces = () => {
      if (currentWorkspace) {
        try {
          const raw = localStorage.getItem("MOCK_SPACES");
          const allSpaces = raw && raw !== "undefined" ? JSON.parse(raw) : [];
          setSidebarSpaces(allSpaces.filter((s: any) => s.workspaceId === currentWorkspace._id));
        } catch (e) {
          console.error("Failed to parse MOCK_SPACES", e);
          setSidebarSpaces([]);
        }
      } else {
        setSidebarSpaces([]);
      }
    };

    fetchSpaces();

    window.addEventListener("spaces_updated", fetchSpaces);
    setMounted(true);
    return () => window.removeEventListener("spaces_updated", fetchSpaces);
  }, [currentWorkspace]);

  const isAdmin = isGlobalAdminRole(user?.role);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-[#FBFBFA] dark:bg-[#252525] border-r border-[#EAEAEA] dark:border-white/[0.06] z-40 transition-all duration-200 flex flex-col ${
          collapsed ? "w-[68px]" : "w-[240px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo / Brand */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[#EAEAEA] dark:border-white/[0.06] flex-shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            onClick={onMobileClose}
          >
            <div className="w-8 h-8 bg-[#2563EB] dark:bg-[#3B82F6] rounded-[8px] flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-[#111111] dark:text-[#E8E8E7] text-lg tracking-tight">
                AL-TASK
              </span>
            )}
          </Link>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors"
          >
            <X className="w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
          </button>
        </div>

        {/* Scrollable nav area */}
        <div className="flex-1 overflow-y-auto py-3">
          {/* Create button */}
          {!collapsed && (
            <div className="px-3 mb-3">
              <Link
                href="/spaces/create"
                onClick={() => {
                  setShowCreateMenu(false);
                  onMobileClose();
                }}
                className="w-full flex items-center justify-center gap-2 bg-[#2563EB] dark:bg-[#3B82F6] text-white py-2 px-3 rounded-[6px] hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors text-[13px] font-medium"
              >
                <Plus className="w-4 h-4" />
                Create new workspace
              </Link>
            </div>
          )}
          {collapsed && (
            <div className="px-3 mb-3 flex justify-center">
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="w-9 h-9 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] flex items-center justify-center hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Main Navigation */}
          <div className="px-2 space-y-0.5">
            <div className="px-0 space-y-0.5">
              {/* Dashboard */}
              <NavItem item={mainNav[0]} pathname={pathname} onMobileClose={onMobileClose} collapsed={collapsed} />
              {SHOW_RECENT_NAV && (
                <PopoverNavItem item={mainNav[1]} type="recent" activePopover={activePopover} setActivePopover={setActivePopover} collapsed={collapsed} mounted={mounted} />
              )}
              {SHOW_STARRED_NAV && (
                <PopoverNavItem item={mainNav[2]} type="starred" activePopover={activePopover} setActivePopover={setActivePopover} collapsed={collapsed} mounted={mounted} />
              )}

              {/* Workspaces with subnav */}
              <div>
                <button
                  onClick={() => setSpaceOpen(!spaceOpen)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-[6px] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors"
                >
                  <BookOpen className="w-[18px] h-[18px] text-[#ABABAB] dark:text-[#6B6B6B]" />

                  {!collapsed && (
                    <>
                      <span className="text-[13px] font-medium flex-1 text-left">
                        Workspaces
                      </span>
                      {spaceOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </>
                  )}
                </button>

                {/* SUB NAV */}
                {spaceOpen && !collapsed && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {sidebarSpaces.slice(0, 5).map((space) => (
                      <Link
                        key={space._id}
                        href={`/spaces/${space._id}`}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-[13px] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors"
                      >
                        <div className="w-4 h-4 rounded-[3px] bg-[#2563EB] dark:bg-[#3B82F6] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {space.name?.charAt(0)}
                        </div>
                        <span className="truncate">{space.name}</span>
                      </Link>
                    ))}

                    {/* More */}
                    <button
                      ref={moreSpacesBtnRef}
                      onClick={handleToggleMoreSpaces}
                      className="w-full text-left flex items-center justify-between px-2 py-1.5 text-[13px] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7] rounded-[6px] group transition-colors"
                    >
                      <span>More spaces</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                )}
              </div>
              {/* Filters */}
              <div>
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-[6px] text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors"
                >
                  <ListFilter className="w-[18px] h-[18px] text-[#ABABAB] dark:text-[#6B6B6B]" />

                  {!collapsed && (
                    <>
                      <span className="text-[13px] font-medium flex-1 text-left">
                        Filters
                      </span>
                      {filterOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </>
                  )}
                </button>

                {/* SUB NAV */}
                {filterOpen && !collapsed && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {optionFilter.map((filter) => (
                      <Link
                        key={filter.slug}
                        href={`/filter/${filter.slug}`}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-[6px] text-[13px] transition-colors ${
                          pathname.includes(filter.slug)
                            ? "bg-[#F0F0EE] text-[#111111] dark:bg-white/6 dark:text-[#E8E8E7]"
                            : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7]"
                        }`}
                      >
                        <span className="truncate">{filter.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <NavItem item={mainNav[5]} pathname={pathname} onMobileClose={onMobileClose} collapsed={collapsed} />
              {/* Reports */}
              <NavItem item={mainNav[6]} showBadge pathname={pathname} onMobileClose={onMobileClose} collapsed={collapsed} />
            </div>
          </div>

          {/* Admin Section */}
          {SHOW_ADMIN_NAV && isAdmin && (
            <div className="mt-4 px-2">
              <button
                onClick={() => setAdminOpen(!adminOpen)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-[0.06em] hover:text-[#787774] dark:hover:text-[#9B9A97] transition-colors"
              >
                {!collapsed && (
                  <>
                    {adminOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    <span>Admin</span>
                  </>
                )}
                {collapsed && <span className="w-full text-center">Admin</span>}
              </button>
              {adminOpen && !collapsed && (
                <div className="space-y-0.5 mt-1">
                  {adminNav.map((item) => (
                    <NavItem key={item.href} item={item} pathname={pathname} onMobileClose={onMobileClose} collapsed={collapsed} />
                  ))}
                </div>
              )}
              {adminOpen && collapsed && (
                <div className="space-y-0.5 mt-1">
                  {adminNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      className={`flex justify-center p-2 rounded-[6px] transition-colors ${pathname.startsWith(item.href) ? navActiveClass : navInactiveClass}`}
                    >
                      <item.icon className="w-[18px] h-[18px]" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom: Workspace + Settings */}
        <div className="flex-shrink-0 border-t border-[#EAEAEA] dark:border-white/[0.06] p-3 space-y-1">
          {!collapsed && currentWorkspace && (
            <div className="px-3 py-2 bg-[#F9F9F8] dark:bg-white/5 rounded-[6px] mb-2">
              <p className="text-[10px] text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-[0.06em] font-semibold">
                Workspaces
              </p>
              <p className="text-[13px] font-medium text-[#111111] dark:text-[#E8E8E7] truncate">
                {currentWorkspace.name}
              </p>
            </div>
          )}
          <Link
            href="/settings"
            onClick={onMobileClose}
            className={`flex items-center gap-3 px-3 py-2 rounded-[6px] transition-colors ${pathname === "/settings" ? navActiveClass : navInactiveClass}`}
          >
            <Settings className={`w-[18px] h-[18px] flex-shrink-0 ${pathname === "/settings" ? iconActiveClass : iconInactiveClass}`} />
            {!collapsed && <span className="text-[13px] font-medium">Settings</span>}
          </Link>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => onCollapse(!collapsed)}
          className="absolute -right-3 top-[52px] w-6 h-6 bg-[#FBFBFA] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-full flex items-center justify-center hover:bg-[#F0F0EE] dark:hover:bg-white/8 lg:flex transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-[#ABABAB] dark:text-[#6B6B6B]" />
          ) : (
            <ChevronDown className="w-3 h-3 text-[#ABABAB] dark:text-[#6B6B6B] rotate-90" />
          )}
        </button>
      </aside>

      {/* More Spaces Popover */}
      {activePopover === "more_spaces" && mounted && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setActivePopover(null)} />
          <div
            className="fixed bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[10px] z-[9999] flex flex-col w-[320px]"
            style={{
              top: `${moreSpacesPos.top}px`,
              left: `${moreSpacesPos.left}px`,
              boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center justify-between p-3 border-b border-[#EAEAEA] dark:border-white/[0.06]">
              <span className="text-[13px] font-semibold text-[#111111] dark:text-[#E8E8E7]">Spaces</span>
              <button
                onClick={() => setActivePopover(null)}
                className="p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] text-[#ABABAB] dark:text-[#6B6B6B] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-[#EAEAEA] dark:border-white/[0.06]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#ABABAB] dark:text-[#6B6B6B] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search all spaces"
                  className="w-full pl-9 pr-3 py-2 bg-[#F9F9F8] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[6px] text-[13px] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B] focus:border-[#111111] dark:focus:border-[#3B82F6] outline-none transition-colors"
                />
              </div>
            </div>

            <div className="p-2">
              <Link href="/spaces" onClick={() => setActivePopover(null)} className="w-full flex items-center gap-3 p-2 text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors">
                <ListFilter className="w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
                View all spaces
              </Link>
              <Link href="/spaces/create" onClick={() => setActivePopover(null)} className="w-full flex items-center gap-3 p-2 text-[13px] font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors">
                <Plus className="w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
                Create space
              </Link>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
