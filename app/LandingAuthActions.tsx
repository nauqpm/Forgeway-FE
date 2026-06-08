"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  ChevronDown,
  LayoutDashboard,
  Loader2,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
  User,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import NotificationPanel from "@/common/components/NotificationPanel";
import { notificationService } from "@/common/services/notification.service";
import { useNotificationRealtime } from "@/hooks/realtime/use-notification-realtime";

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
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 overflow-hidden text-sm font-semibold text-white">
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
            <div className="border-b border-[#EAEAEA] dark:border-white/[0.06] px-4 py-2">
              <p className="truncate text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">
                {user?.fullName ?? "User"}
              </p>
              <p className="truncate text-xs text-[#787774] dark:text-[#9B9A97]">{user?.email}</p>
            </div>

            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#111111] dark:text-[#E8E8E7] transition hover:bg-[#F7F6F3] dark:hover:bg-[#252525]"
              onClick={() => setDropdownOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4 text-[#2563EB]" />
              Dashboard
            </Link>

            <Link
              href="/account"
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
        className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[#64748b] dark:text-gray-300 transition hover:text-[#2563EB] dark:hover:text-indigo-300 sm:inline-flex"
      >
        Login
      </Link>
      <Link
        href="/register"
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        Get Started <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function HeroAuthActions() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-3 text-sm font-semibold text-[#64748b] dark:text-gray-300">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking workspace
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <Link
        href="/dashboard"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-700 sm:w-auto"
      >
        Go to Dashboard <LayoutDashboard className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <>
      <Link
        href="/register"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-700 sm:w-auto"
      >
        Get Started Free <ArrowRight className="h-4 w-4" />
      </Link>
      <Link
        href="/login"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#CBD5E1] dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-3 text-sm font-semibold text-[#444444] dark:text-gray-100 transition hover:border-[#2563EB] dark:hover:border-indigo-500 hover:text-[#2563EB] dark:hover:text-indigo-200 sm:w-auto"
      >
        View Demo Workspace <Zap className="h-4 w-4" />
      </Link>
    </>
  );
}
