"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Search, Bell, Settings, LogOut, User } from "lucide-react";
import NotificationPanel from "./NotificationPanel";
import { notificationService } from "@/common/services/notification.service";

export default function TopBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificationService
      .unreadCount()
      .then(setUnreadNotificationCount)
      .catch(() => setUnreadNotificationCount(0));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#ABABAB] dark:text-[#6B6B6B]" />
          <input
            type="text"
            placeholder="Search tasks, pages, projects..."
            className="w-[clamp(220px,20vw,320px)] pl-9 pr-8 h-8 bg-[#F9F9F8] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/10 rounded-[6px] text-[13px] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B] focus:bg-white dark:focus:bg-[#2A2A2A] focus:border-[#111111] dark:focus:border-white/30 outline-none transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#ABABAB] dark:text-[#6B6B6B] bg-[#EAEAEA] dark:bg-white/10 px-1.5 py-0.5 rounded-[4px] font-mono">/</kbd>
        </div>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] relative transition-colors"
          >
            <Bell className="w-[18px] h-[18px] text-[#787774] dark:text-[#9B9A97]" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[9px] leading-4 rounded-full text-center font-semibold">
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <NotificationPanel
              onClose={() => setShowNotifications(false)}
              onUnreadCountChange={setUnreadNotificationCount}
            />
          )}
        </div>

        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center p-1 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white text-xs font-semibold">
            {user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
          </div>
        </button>
      </div>

      {showUserMenu && (
        <div
          className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/8 py-1 z-50"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <div className="px-3 py-2.5 border-b border-[#EAEAEA] dark:border-white/8">
            <p className="text-[13px] font-semibold text-[#111111] dark:text-[#E8E8E7]">{user?.fullName || "User"}</p>
            <p className="text-[11px] text-[#787774] dark:text-[#9B9A97]">{user?.email}</p>
          </div>
          <button
            onClick={() => { router.push("/profile"); setShowUserMenu(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors"
          >
            <User className="w-3.5 h-3.5 text-[#ABABAB] dark:text-[#6B6B6B]" />
            Profile
          </button>
          <button
            onClick={() => { router.push("/settings"); setShowUserMenu(false); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-[#ABABAB] dark:text-[#6B6B6B]" />
            Settings
          </button>
          <div className="border-t border-[#EAEAEA] dark:border-white/8 my-1" />
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#9F2F2D] hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.15)] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
