"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  User,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function NavAuthActions() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((open) => !open)}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-gray-200 transition hover:bg-white/10"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
            {user?.fullName?.charAt(0)?.toUpperCase() ??
              user?.email?.charAt(0)?.toUpperCase() ??
              "U"}
          </div>
          <span className="hidden max-w-36 truncate text-sm font-medium sm:block">
            {user?.fullName ?? user?.email}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-700 bg-gray-900 py-2 shadow-xl shadow-black/30">
            <div className="border-b border-gray-800 px-4 py-2">
              <p className="truncate text-sm font-semibold text-white">
                {user?.fullName ?? "User"}
              </p>
              <p className="truncate text-xs text-gray-400">{user?.email}</p>
            </div>

            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 transition hover:bg-gray-800"
              onClick={() => setDropdownOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4 text-indigo-400" />
              Dashboard
            </Link>

            <Link
              href="/account"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 transition hover:bg-gray-800"
              onClick={() => setDropdownOpen(false)}
            >
              <User className="h-4 w-4 text-indigo-400" />
              Profile
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 transition hover:bg-gray-800"
              onClick={() => setDropdownOpen(false)}
            >
              <Settings className="h-4 w-4 text-gray-400" />
              Settings
            </Link>

            <div className="mt-2 border-t border-gray-800 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  void logout();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-400 transition hover:bg-red-950/30"
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
      <Link
        href="/login"
        className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition hover:text-indigo-300 sm:inline-flex"
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
      <div className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-6 py-3 text-sm font-semibold text-gray-300">
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
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-6 py-3 text-sm font-semibold text-gray-100 transition hover:border-indigo-500 hover:text-indigo-200 sm:w-auto"
      >
        View Demo Workspace <Zap className="h-4 w-4" />
      </Link>
    </>
  );
}
