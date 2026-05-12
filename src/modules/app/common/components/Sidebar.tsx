"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const mainNav = [
  { icon: LayoutDashboard, label: "Bảng điều khiển", href: "/admin" },
  { icon: Clock7, label: "Gần đây", href: "/recent" },
  { icon: Star, label: "Đã đánh dấu", href: "/starred" },
  {
    icon: BookOpen,
    label: "Không gian",
    href: "/spaces",
    badge: null,
  },
  { icon: ListFilter, label: "Bộ lọc", href: "/filter" },
  { icon: BarChart3, label: "Báo cáo", href: "/reports", badge: "sắp có" },
];

const adminNav = [
  { icon: UserCog, label: "Quản lý Người dùng", href: "/admin/users" },
  { icon: Building2, label: "Cài đặt Workspace", href: "/admin/workspace" },
  { icon: Zap, label: "Quy trình", href: "/admin/workflows" },
  { icon: Shield, label: "Phân quyền", href: "/admin/permissions" },
];

const optionFilter = [
  { title: "Công việc của tôi", slug: "my-tasks" },
  { title: "Do tôi tạo", slug: "created-by-me" },
  { title: "Chưa hoàn thành của tôi", slug: "my-incomplete" },
  { title: "Chưa hoàn thành", slug: "incomplete" },
  { title: "Được tạo gần đây", slug: "recently-created" },
  { title: "Đã xem gần đây", slug: "recently-viewed" },
  { title: "Đã cập nhật gần đây", slug: "recently-updated" },
  { title: "Đã xong gần đây", slug: "recently-completed" },
];

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
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group relative ${
        isActive
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <item.icon
        className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`}
      />
      {!collapsed && (
        <>
          <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
          {showBadge && item.badge && (
            <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-medium">
              {item.badge}
            </span>
          )}
        </>
      )}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-600 rounded-r-full" />
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
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${
          isActive
            ? "bg-indigo-50 text-indigo-700"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`} />
        {!collapsed && (
          <>
            <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        )}
      </button>

      {isActive && mounted && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setActivePopover(null)} />
          <div
            className="fixed bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] flex flex-col w-[320px]"
            style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-100">
              <span className="font-semibold text-slate-900">{item.label}</span>
              <button onClick={() => setActivePopover(null)} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {type === "recent" && (
              <div className="flex flex-col max-h-[60vh]">
                <div className="p-3 border-b border-slate-100">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      placeholder="Search recent items" 
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 mb-1 px-2 uppercase tracking-wider">Hôm nay</h4>
                    <div className="space-y-0.5">
                      <Link href="/spaces/mock-1" className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:border-slate-300"><Columns className="w-4 h-4" /></div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">QUAN board</p>
                          <p className="text-[11px] text-slate-500">6 giây trước</p>
                        </div>
                      </Link>
                      <Link href="/spaces/mock-2" className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">Q</div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">quan</p>
                          <p className="text-[11px] text-slate-500">7 giây trước</p>
                        </div>
                      </Link>
                      <Link href="/filter/my-tasks" className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded flex items-center justify-center text-slate-400 group-hover:text-slate-600"><ListFilter className="w-4 h-4" /></div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">Reported by me</p>
                          <p className="text-[11px] text-slate-500">14 giây trước</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 mb-1 px-2 uppercase tracking-wider">Hơn 1 tháng trước</h4>
                    <div className="space-y-0.5">
                      <Link href="/spaces/mock-3" className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:border-slate-300"><Columns className="w-4 h-4" /></div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">SCRUM board</p>
                          <p className="text-[11px] text-slate-500">5 ngày trước</p>
                        </div>
                      </Link>
                      <Link href="/spaces/mock-4" className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg group transition-colors" onClick={() => setActivePopover(null)}>
                        <div className="w-7 h-7 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm"><Zap className="w-3.5 h-3.5" /></div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">My Software Team</p>
                          <p className="text-[11px] text-slate-500">5 ngày trước</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="p-2 border-t border-slate-100">
                  <button className="w-full text-left p-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                    Xem tất cả mục gần đây
                  </button>
                </div>
              </div>
            )}

            {type === "starred" && (
              <div className="flex flex-col">
                <div className="p-8 text-center flex flex-col items-center">
                  <div className="w-20 h-20 mb-4 relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-indigo-50 rounded-full scale-150 opacity-50" />
                    <Star className="w-10 h-10 text-indigo-300 relative z-10 fill-indigo-100/50" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center z-20 text-white shadow-sm border-2 border-white">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h4 className="text-[15px] font-bold text-slate-900 mb-2 mt-4">Bạn chưa đánh dấu mục nào.</h4>
                  <p className="text-[13px] text-slate-500 leading-relaxed">Đánh dấu mục quan trọng bằng biểu tượng sao để truy cập nhanh. Bạn sẽ thấy chúng hiển thị ở đây.</p>
                </div>
                <div className="p-2 border-t border-slate-100">
                  <button className="w-full text-left p-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                    Xem tất cả mục đã đánh dấu
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
  const { currentWorkspace, workspaces } = useWorkspaceStore();
  const { hasAdminAccess } = useAuth();
  const [adminOpen, setAdminOpen] = useState(pathname.startsWith("/admin"));
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

  const isAdmin = hasAdminAccess();

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-40 transition-all duration-200 flex flex-col ${
          collapsed ? "w-[68px]" : "w-[240px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo / Brand */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100 flex-shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            onClick={onMobileClose}
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-slate-900 text-lg tracking-tight">
                AL-TASK
              </span>
            )}
          </Link>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
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
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 px-3 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Tạo không gian mới
              </Link>
            </div>
          )}
          {collapsed && (
            <div className="px-3 mb-3 flex justify-center">
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Main Navigation */}
          <div className="px-2 space-y-0.5">
            <div className="px-2 space-y-0.5">
              {/* Bảng điều khiển */}
              <NavItem item={mainNav[0]} pathname={pathname} onMobileClose={onMobileClose} collapsed={collapsed} />
              <PopoverNavItem item={mainNav[1]} type="recent" activePopover={activePopover} setActivePopover={setActivePopover} collapsed={collapsed} mounted={mounted} />
              <PopoverNavItem item={mainNav[2]} type="starred" activePopover={activePopover} setActivePopover={setActivePopover} collapsed={collapsed} mounted={mounted} />

              {/* Không gian làm việc (có subnav) */}
              <div>
                <button
                  onClick={() => setSpaceOpen(!spaceOpen)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  <BookOpen className="w-[18px] h-[18px] text-slate-400" />

                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left">
                        Không gian
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
                  <div className="ml-6 mt-1 space-y-1">
                    {sidebarSpaces.slice(0, 5).map((space) => (
                      <Link
                        key={space._id}
                        href={`/spaces/${space._id}`}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <div className="w-4 h-4 rounded bg-indigo-500 text-white flex items-center justify-center text-[10px]">
                          {space.name?.charAt(0)}
                        </div>
                        <span className="truncate">{space.name}</span>
                      </Link>
                    ))}

                    {/* More */}
                    <button
                      ref={moreSpacesBtnRef}
                      onClick={handleToggleMoreSpaces}
                      className="w-full text-left flex items-center justify-between px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-50 rounded-lg group transition-colors"
                    >
                      <span>More spaces</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                )}
              </div>
              {/* Bộ lọc */}
              <div>
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  <ListFilter className="w-[18px] h-[18px] text-slate-400" />

                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left">
                        Bộ lọc
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
                  <div className="ml-6 mt-1 space-y-1">
                    {optionFilter.map((filter) => (
                      <Link
                        key={filter.slug}
                        href={`/filter/${filter.slug}`}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition ${
                          pathname.includes(filter.slug)
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{filter.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Báo cáo */}
              <NavItem item={mainNav[5]} showBadge pathname={pathname} onMobileClose={onMobileClose} collapsed={collapsed} />
            </div>
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
                    {adminOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    <span>Quản trị</span>
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
                      className={`flex justify-center p-2 rounded-lg transition-colors ${pathname.startsWith(item.href) ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50"}`}
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
        <div className="flex-shrink-0 border-t border-slate-100 p-3 space-y-1">
          {!collapsed && currentWorkspace && (
            <div className="px-3 py-2 bg-slate-50 rounded-lg mb-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Không gian làm việc
              </p>
              <p className="text-sm font-medium text-slate-800 truncate">
                {currentWorkspace.name}
              </p>
            </div>
          )}
          <Link
            href="/settings"
            onClick={onMobileClose}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === "/settings" ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
          >
            <Settings className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Cài đặt</span>}
          </Link>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => onCollapse(!collapsed)}
          className="absolute -right-3 top-[52px] w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 lg:flex shadow-sm transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-slate-400" />
          ) : (
            <ChevronDown className="w-3 h-3 text-slate-400 rotate-90" />
          )}
        </button>
      </aside>

      {/* More Spaces Popover */}
      {activePopover === "more_spaces" && mounted && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setActivePopover(null)} />
          <div
            className="fixed bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] flex flex-col w-[320px]"
            style={{ top: `${moreSpacesPos.top}px`, left: `${moreSpacesPos.left}px` }}
          >
            <div className="flex items-center justify-between p-3 border-b border-slate-100">
              <span className="font-semibold text-slate-900">Spaces</span>
              <button onClick={() => setActivePopover(null)} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Search all spaces" 
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="p-2">
              <Link href="/spaces" onClick={() => setActivePopover(null)} className="w-full flex items-center gap-3 p-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                <ListFilter className="w-4 h-4 text-slate-400" />
                View all spaces
              </Link>
              <Link href="/spaces/create" onClick={() => setActivePopover(null)} className="w-full flex items-center gap-3 p-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">
                <Plus className="w-4 h-4 text-slate-400" />
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
