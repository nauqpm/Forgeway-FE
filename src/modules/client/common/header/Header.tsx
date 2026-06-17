"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  ChevronDown,
  LayoutDashboard,
  Loader2,
  LogOut,
  Repeat,
  Settings,
  Shield,
  User,
  X,
} from "lucide-react";
import { ADMIN_URL } from "@/lib/admin-url";
import { useAccountSwitcherStore } from "@/stores/account-switcher.store";
import AccountSwitcher from "@/modules/client/common/account-switcher/AccountSwitcher";

export default function Header() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Account-switcher badge count
  const accountsCount = useAccountSwitcherStore((s) => s.accounts.length);

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
    return (
      <header className="border-b border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#252525] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center">
              <span className="text-white font-bold text-sm">AL</span>
            </div>
            <span className="font-bold text-lg text-[#111111] dark:text-[#E8E8E7]">AL-TASK</span>
          </Link>
          <Loader2 className="w-5 h-5 animate-spin text-[#ABABAB] dark:text-[#6B6B6B]" />
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#252525] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center">
              <span className="text-white font-bold text-sm">AL</span>
            </div>
            <span className="font-bold text-lg text-[#111111] dark:text-[#E8E8E7]">AL-TASK</span>
          </Link>
          <Link
            href="/aboutUs"
            className="text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
          >
            About us
          </Link>
        </div>

        {isAuthenticated ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white text-sm font-semibold">
                {user?.fullName?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <span className="text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7] hidden sm:block">
                {user?.fullName ?? user?.email}
              </span>
              <ChevronDown className="w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] py-2 z-50"
                style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)" }}
              >
                <div className="flex items-start gap-2 px-4 py-2 border-b border-[#EAEAEA] dark:border-white/[0.06]">
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7] truncate">
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
                    {showSwitcher ? <X className="h-3.5 w-3.5" /> : <Repeat className="w-4 h-4" />}
                    {accountsCount > 0 && !showSwitcher && (
                      <span className="absolute -right-0.5 -top-0.5 min-w-[14px] rounded-full bg-[#2563EB] px-1 text-[9px] font-semibold leading-[14px] text-white dark:bg-indigo-500">
                        {accountsCount}
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
                  className="flex items-center gap-3 px-4 py-2.5 text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
                  Dashboard
                </Link>

                <Link
                  href="/account"
                  className="flex items-center gap-3 px-4 py-2.5 text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
                  Profile
                </Link>

                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings className="w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
                  Settings
                </Link>

                {user?.role === "super_admin" && (
                  <>
                    <div className="border-t border-[#EAEAEA] dark:border-white/[0.06] mt-2 pt-2" />
                    <a
                      href={ADMIN_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[0.8125rem] font-medium text-[#2563EB] dark:text-indigo-300 hover:bg-[#EFF6FF] dark:hover:bg-indigo-500/10 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      Trang quản trị
                      <span className="ml-auto text-[10px] uppercase tracking-wider text-[#9B9A97] dark:text-[#6B6B6B]">↗</span>
                    </a>
                  </>
                )}

                <div className="border-t border-[#EAEAEA] dark:border-white/[0.06] mt-2 pt-2">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-[0.8125rem] text-red-600 dark:text-red-400 hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.12)] transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-[0.8125rem] font-medium bg-[#2563EB] dark:bg-[#3B82F6] text-white px-4 py-2 rounded-[6px] hover:bg-[#1D4ED8] transition-colors"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
