"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  LayoutDashboard,
  Loader2,
  LogOut,
  Monitor,
  Moon,
  Repeat,
  Settings,
  Shield,
  Sun,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { useTheme } from "@/shared/hooks/useTheme";
import NotificationPanel from "@/modules/notifications/components/NotificationPanel";
import { notificationService } from "@/modules/notifications/services/notification.service";
import { useNotificationRealtime } from "@/lib/realtime/hooks/use-notification-realtime";
import { ADMIN_URL, IS_SUPER_ADMIN } from "@/lib/admin-url";
import { useAccountSwitcherStore } from "@/stores/account-switcher.store";
import AccountSwitcher from "@/shared/components/layout/account-switcher/AccountSwitcher";

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();

  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label = theme === "light" ? "Switch to dark" : theme === "dark" ? "Switch to system" : "Switch to light";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      className="rounded-lg p-2 text-[#64748b] dark:text-gray-300 transition hover:bg-[#DBEAFE] dark:hover:bg-white/10 hover:text-[#111111] dark:hover:text-white"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

export function NavAuthActions() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const switchableCount = useAccountSwitcherStore((state) =>
    state.accounts.reduce(
      (count, account) => count + (account.isCurrent ? 0 : 1),
      0,
    ),
  );

  const refreshUnreadNotificationCount = useCallback(() => {
    if (!isAuthenticated) return;

    notificationService
      .unreadCount()
      .then(setUnreadNotificationCount)
      .catch(() => setUnreadNotificationCount(0));
  }, [isAuthenticated]);

  useNotificationRealtime({
    enabled: isAuthenticated,
    onCreated: refreshUnreadNotificationCount,
    onRead: refreshUnreadNotificationCount,
    onReadAll: refreshUnreadNotificationCount,
  });

  useEffect(() => {
    refreshUnreadNotificationCount();
  }, [refreshUnreadNotificationCount]);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return <Loader2 className="h-5 w-5 animate-spin text-gray-400" />;
  }

  if (isAuthenticated) {
    return (
      <div className="relative flex items-center gap-2" ref={dropdownRef}>
        <ThemeToggleButton />
        <button
          type="button"
          onClick={() => setShowNotifications((open) => !open)}
          className="relative rounded-lg p-2 text-[#64748b] dark:text-gray-300 transition hover:bg-[#DBEAFE] dark:hover:bg-white/10 hover:text-[#111111] dark:hover:text-white"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[0.625rem] font-bold leading-none text-white">
              {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setDropdownOpen((open) => !open)}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[#444444] dark:text-gray-200 transition hover:bg-[#DBEAFE] dark:hover:bg-white/10"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 overflow-hidden text-sm font-semibold text-white">
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              user?.fullName?.charAt(0)?.toUpperCase() ??
              user?.email?.charAt(0)?.toUpperCase() ??
              "U"
            )}
          </div>
          <span className="hidden max-w-36 truncate text-sm font-medium sm:block">
            {user?.fullName ?? user?.email}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {showNotifications && (
          <NotificationPanel
            onClose={() => setShowNotifications(false)}
            onUnreadCountChange={setUnreadNotificationCount}
          />
        )}
        {dropdownOpen && (
          <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-[#EAEAEA] dark:border-white/[0.08] bg-white dark:bg-[#202020] py-2 shadow-xl shadow-black/10 dark:shadow-black/40">
            <div className="flex items-start gap-2 border-b border-[#EAEAEA] dark:border-white/[0.06] px-4 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">
                  {user?.fullName ?? "User"}
                </p>
                <p className="truncate text-xs text-[#787774] dark:text-[#9B9A97]">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSwitcher((v) => !v)}
                title="Chuyển account"
                aria-label="Chuyển account"
                aria-expanded={showSwitcher}
                className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-md transition ${showSwitcher
                    ? "bg-[#EFF6FF] text-[#2563EB] dark:bg-orange-500/15 dark:text-orange-300"
                    : "text-[#2563EB] hover:bg-[#EFF6FF] dark:text-orange-300 dark:hover:bg-orange-500/10"
                  }`}
              >
                {showSwitcher ? <X className="h-3.5 w-3.5" /> : <Repeat className="h-4 w-4" />}
                {switchableCount > 0 && !showSwitcher && (
                  <span className="absolute -right-0.5 -top-0.5 min-w-[14px] rounded-full bg-[#2563EB] px-1 text-[9px] font-semibold leading-[14px] text-white dark:bg-orange-500">
                    {switchableCount}
                  </span>
                )}
              </button>
            </div>

            {showSwitcher && (
              <div className="border-b border-[#EAEAEA] dark:border-white/[0.06]">
                <AccountSwitcher
                  open={showSwitcher}
                  hasFetched={hasFetched}
                  setHasFetched={setHasFetched}
                  onCloseMenu={() => setDropdownOpen(false)}
                />
              </div>
            )}

            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#111111] dark:text-[#E8E8E7] transition hover:bg-[#F7F6F3] dark:hover:bg-[#252525]"
              onClick={() => setDropdownOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4 text-orange-500" />
              Dashboard
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#111111] dark:text-[#E8E8E7] transition hover:bg-[#F7F6F3] dark:hover:bg-[#252525]"
              onClick={() => setDropdownOpen(false)}
            >
              <User className="h-4 w-4 text-[#787774] dark:text-[#9B9A97]" />
              Profile
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#111111] dark:text-[#E8E8E7] transition hover:bg-[#F7F6F3] dark:hover:bg-[#252525]"
              onClick={() => setDropdownOpen(false)}
            >
              <Settings className="h-4 w-4 text-[#787774] dark:text-[#9B9A97]" />
              Settings
            </Link>

            {IS_SUPER_ADMIN(user?.role) && (
              <>
                <div className="mt-2 border-t border-[#EAEAEA] dark:border-white/[0.06] pt-2">
                  <a
                    href={ADMIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setDropdownOpen(false)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-orange-600 dark:text-orange-300 transition hover:bg-orange-50 dark:hover:bg-orange-500/10"
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-[#9B9A97] dark:text-[#6B6B6B]">↗</span>
                  </a>
                </div>
              </>
            )}

            <div className="mt-2 border-t border-[#EAEAEA] dark:border-white/[0.06] pt-2">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  void logout();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-500 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <ThemeToggleButton />
      <Link
        href="/login"
        className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[#64748b] dark:text-gray-300 transition hover:text-orange-500 dark:hover:text-orange-400 sm:inline-flex"
      >
        Login
      </Link>
      <Link
        href="/register"
        className="relative inline-flex items-center justify-center gap-2 rounded-full bg-[#F5F3EF] dark:bg-white px-5 py-2 text-xs font-black uppercase tracking-wider text-[#2A1810] shadow-[0_0_20px_rgba(249,115,22,0.6),0_0_8px_rgba(239,68,68,0.35)] transition-all duration-300 hover:shadow-[0_0_28px_rgba(249,115,22,0.85),0_0_12px_rgba(239,68,68,0.5)] hover:scale-[1.03] active:scale-[0.98]"
      >
        Get Started <ArrowRight className="h-3.5 w-3.5 text-orange-600" />
      </Link>
    </div>
  );
}

export function HeroAuthActions() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-[#CBD5E1] dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-3 text-sm font-semibold text-[#64748b] dark:text-gray-300">
        <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
        Checking workspace
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <Link
        href="/dashboard"
        className="relative inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#F5F3EF] dark:bg-white px-8 py-3.5 text-sm font-extrabold uppercase tracking-wider text-[#2A1810] shadow-[0_0_25px_rgba(249,115,22,0.65),0_0_10px_rgba(239,68,68,0.4)] transition-all duration-300 hover:shadow-[0_0_35px_rgba(249,115,22,0.85),0_0_15px_rgba(239,68,68,0.6)] hover:scale-[1.03] active:scale-[0.98] sm:w-auto"
      >
        Go to Dashboard <LayoutDashboard className="h-4 w-4 text-orange-600" />
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/register"
        className="relative inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#F5F3EF] dark:bg-white px-8 py-3.5 text-sm font-extrabold uppercase tracking-wider text-[#2A1810] shadow-[0_0_25px_rgba(249,115,22,0.65),0_0_10px_rgba(239,68,68,0.4)] transition-all duration-300 hover:shadow-[0_0_35px_rgba(249,115,22,0.85),0_0_15px_rgba(239,68,68,0.6)] hover:scale-[1.03] active:scale-[0.98] sm:w-auto"
      >
        Get Started Free <ArrowRight className="h-4 w-4 text-orange-600" />
      </Link>
      <Link
        href="/login"
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.05] px-7 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 backdrop-blur-sm hover:border-orange-500/40 hover:bg-white dark:hover:bg-white/10 transition-all duration-200 sm:w-auto"
      >
        View Demo Workspace <ArrowUpRight className="h-4 w-4 text-orange-500" />
      </Link>
    </>
  );
}
