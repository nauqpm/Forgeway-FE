'use client';

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, User, Settings, LogOut, Repeat, X, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { useInvisibleMode } from "@/lib/realtime/hooks/useInvisibleMode";

import { useAccountSwitcherStore } from "@/stores/account-switcher.store";
import AccountSwitcher from "@/shared/components/layout/account-switcher/AccountSwitcher";

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
  const { isInvisible, toggle: handleToggleInvisible } = useInvisibleMode();

  const switchableCount = useAccountSwitcherStore((state) =>
    state.accounts.reduce(
      (count, account) => count + (account.isCurrent ? 0 : 1),
      0,
    ),
  );

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
    { icon: User, label: "Profile", onClick: () => navigate("/settings") },
    { icon: Settings, label: "Settings", onClick: () => navigate("/settings") },
  ];



  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-9 h-9 rounded-full overflow-hidden border border-[#EAEAEA] dark:border-white/[0.06] hover:ring-2 hover:ring-[#2563EB]/25 transition flex items-center justify-center bg-[#2563EB] dark:bg-[#3B82F6] text-white text-sm font-medium"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {user?.avatar ? (
          <img src={user.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
        ) : (
          <span>
            {user?.fullName?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? "U"}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#252525] rounded-[10px] border border-[#EAEAEA] dark:border-white/[0.06] z-[9999] shadow-xl shadow-black/5 dark:shadow-black/40 overflow-hidden">
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
              className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-md transition ${showSwitcher
                  ? "bg-[#EFF6FF] text-[#2563EB] dark:bg-indigo-500/15 dark:text-indigo-300"
                  : "text-[#2563EB] hover:bg-[#EFF6FF] dark:text-indigo-300 dark:hover:bg-indigo-500/10"
                }`}
            >
              {showSwitcher ? <X className="h-3.5 w-3.5" /> : <Repeat className="h-4 w-4" />}
              {switchableCount > 0 && !showSwitcher && (
                <span className="absolute -right-0.5 -top-0.5 min-w-[14px] rounded-full bg-[#2563EB] px-1 text-[9px] font-semibold leading-[14px] text-white dark:bg-indigo-500">
                  {switchableCount}
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

            <div className="border-t border-[#EAEAEA] dark:border-white/[0.06] my-1" />

            <button
              onClick={handleToggleInvisible}
              className="w-full flex items-center justify-between px-4 py-2 text-sm text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors"
            >
              <div className="flex items-center gap-3">
                {isInvisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                Invisible mode
              </div>
              <div className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors ${isInvisible ? 'bg-[#2563EB] dark:bg-[#3B82F6]' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${isInvisible ? 'translate-x-3' : 'translate-x-0'}`} />
              </div>
            </button>

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





