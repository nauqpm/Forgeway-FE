'use client';

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, User, Settings, LogOut, Repeat, Shield, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ADMIN_URL, IS_SUPER_ADMIN } from "@/lib/admin-url";
import { useAccountSwitcherStore } from "@/common/stores/account-switcher.store";
import AccountSwitcher from "@/modules/client/common/account-switcher/AccountSwitcher";

interface UserMenuProps {
  className?: string;
}

export default function UserMenu({ className = "" }: UserMenuProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Account-switcher badge — subscribe to `accounts` count only
  const accountsCount = useAccountSwitcherStore((s) => s.accounts.length);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowSwitcher(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigate = (path: string) => {
    router.push(path);
    setIsOpen(false);
    setShowSwitcher(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    setShowSwitcher(false);
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", onClick: () => navigate("/dashboard") },
    { icon: User, label: "Profile", onClick: () => navigate("/account") },
    { icon: Settings, label: "Settings", onClick: () => navigate("/settings") },
  ];

  const isSuperAdmin = IS_SUPER_ADMIN(user?.role);

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-9 h-9 rounded-full overflow-hidden border border-[#EAEAEA] dark:border-white/[0.06] hover:ring-2 hover:ring-[#2563EB]/25 transition flex items-center justify-center bg-[#2563EB] dark:bg-[#3B82F6] text-white text-sm font-medium"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {user?.avatar ? (
          <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <span>
            {user?.fullName?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? "U"}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#252525] rounded-[10px] border border-[#EAEAEA] dark:border-white/[0.06] z-50 shadow-xl shadow-black/5 dark:shadow-black/40 overflow-hidden">
          {/* Header: name + email on the left, switch-account icon on the right */}
          <div className="flex items-start gap-2 px-4 py-3 border-b border-[#EAEAEA] dark:border-white/[0.06]">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#111111] dark:text-[#E8E8E7] truncate">
                {user?.fullName ?? "User"}
              </p>
              <p className="text-xs text-[#787774] dark:text-[#9B9A97] truncate">
                {user?.email}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSwitcher((v) => !v)}
              title="Chuyển account"
              aria-label="Chuyển account"
              aria-expanded={showSwitcher}
              className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-md transition ${
                showSwitcher
                  ? "bg-[#EFF6FF] text-[#2563EB] dark:bg-indigo-500/15 dark:text-indigo-300"
                  : "text-[#2563EB] hover:bg-[#EFF6FF] dark:text-indigo-300 dark:hover:bg-indigo-500/10"
              }`}
            >
              {showSwitcher ? <X className="h-3.5 w-3.5" /> : <Repeat className="h-4 w-4" />}
              {accountsCount > 0 && !showSwitcher && (
                <span className="absolute -right-0.5 -top-0.5 min-w-[14px] rounded-full bg-[#2563EB] px-1 text-[9px] font-semibold leading-[14px] text-white dark:bg-indigo-500">
                  {accountsCount}
                </span>
              )}
            </button>
          </div>

          {/* Inline switcher list — appears right under the header when toggled */}
          {showSwitcher && (
            <div className="border-b border-[#EAEAEA] dark:border-white/[0.06]">
              <AccountSwitcher
                open={showSwitcher}
                hasFetched={hasFetched}
                setHasFetched={setHasFetched}
                onCloseMenu={() => setIsOpen(false)}
              />
            </div>
          )}

          <div className="py-1">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}

            {isSuperAdmin && (
              <>
                <div className="border-t border-[#EAEAEA] dark:border-white/[0.06] my-1" />
                <a
                  href={ADMIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-[#2563EB] dark:text-indigo-300 hover:bg-[#EFF6FF] dark:hover:bg-indigo-500/10 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Trang quản trị
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-[#9B9A97] dark:text-[#6B6B6B]">↗</span>
                </a>
              </>
            )}

            <div className="border-t border-[#EAEAEA] dark:border-white/[0.06] my-1" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#9F2F2D] dark:text-[#F87171] hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.12)] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


