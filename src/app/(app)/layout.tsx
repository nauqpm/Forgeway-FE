"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import Sidebar from "@/modules/app/common/components/Sidebar";
import NotificationPanel from "@/modules/app/common/components/NotificationPanel";
import { Loader2, Menu, Search, Sun, Moon, Monitor } from "lucide-react";
import { parseJQL } from "@/utils/jqlParser";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { setCurrentWorkspace, currentWorkspace } = useWorkspaceStore();
  const { theme, setTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [jqlQuery, setJqlQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionMode, setSuggestionMode] = useState<"keyword" | "value">("keyword");
  const [suggestionKey, setSuggestionKey] = useState<string | null>(null);
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const [ghostText, setGhostText] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const jqlSuggestions: Record<string, string[]> = {
    status: ["To Do", "In Progress", "Done"],
    priority: ["High", "Medium", "Low"],
    assignee: ["me", "unassigned", "admin", "quanp"]
  };

  const allKeywords = ["status:", "priority:", "assignee:"];

  // Tính danh sách gợi ý hiện tại
  const currentSuggestions: string[] = (() => {
    if (suggestionMode === "value" && suggestionKey) return jqlSuggestions[suggestionKey] ?? [];
    return allKeywords;
  })();

  const handleJqlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setJqlQuery(val);
    setHighlightedIdx(0);

    const lastWord = val.split(" ").pop() || "";

    // Trường hợp 1: gõ xong keyword + ':' → hiện value suggestions
    if (lastWord.endsWith(":")) {
      const key = lastWord.slice(0, -1).toLowerCase();
      if (jqlSuggestions[key]) {
        setSuggestionKey(key);
        setSuggestionMode("value");
        setShowSuggestions(true);
        setGhostText("");
        return;
      }
    }

    // Trường hợp 2: đang gõ giữa keyword → hiện keyword suggestions lọc theo prefix
    if (lastWord && !lastWord.includes(":")) {
      const matchedKws = allKeywords.filter(k => k.startsWith(lastWord.toLowerCase()));
      if (matchedKws.length > 0) {
        // Ghost text cho keyword khớp duy nhất
        setGhostText(matchedKws.length === 1 ? matchedKws[0].slice(lastWord.length) : "");
        setSuggestionMode("keyword");
        setSuggestionKey(null);
        setShowSuggestions(true);
        return;
      }
    }

    // Không khớp gì → ẩn dropdown
    setShowSuggestions(false);
    setGhostText("");
    setSuggestionMode("keyword");
  };

  const handleSuggestionPick = (suggestion: string) => {
    const words = jqlQuery.split(" ");
    words.pop(); // bỏ từ đang gõ

    let newQuery: string;
    if (suggestionMode === "keyword") {
      // Pick keyword (ví dụ: "status:") → chèn vào, chuyển sang gợi ý value
      newQuery = [...words, suggestion].join(" ");
      setJqlQuery(newQuery);
      setGhostText("");
      // Sau khi chèn keyword, tự động chuyển sang value suggestions
      const key = suggestion.replace(":", "").toLowerCase();
      if (jqlSuggestions[key]) {
        setSuggestionKey(key);
        setSuggestionMode("value");
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
      setHighlightedIdx(0);
      setTimeout(() => searchRef.current?.focus(), 0);
      return;
    }

    // Pick value → hoàn chỉnh cặp key:value
    const fmtVal = suggestion.includes(" ") ? `"${suggestion}"` : suggestion;
    newQuery = [...words, `${suggestionKey}:${fmtVal} `].join(" ");
    setJqlQuery(newQuery);
    setShowSuggestions(false);
    setSuggestionKey(null);
    setSuggestionMode("keyword");
    setHighlightedIdx(0);
    setGhostText("");
    console.log("[JQL Parsed]", parseJQL(newQuery));
    setTimeout(() => searchRef.current?.focus(), 0);
  };

  // currentSuggestions đã được tính ở trên nhưng cần lọc theo prefix khi mode=keyword
  const filteredSuggestions: string[] = (() => {
    if (suggestionMode === "value") return currentSuggestions;
    const lastWord = jqlQuery.split(" ").pop() || "";
    return currentSuggestions.filter(k => k.startsWith(lastWord.toLowerCase()));
  })();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const suggestions = filteredSuggestions;

    if (e.key === "Tab") {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        // Tab cycle qua các mục, chưa pick
        setHighlightedIdx(i => (i + 1) % suggestions.length);
      } else if (ghostText) {
        setJqlQuery(prev => prev + ghostText);
        setGhostText("");
      }
      return;
    }

    if (e.key === "Enter") {
      if (showSuggestions && suggestions.length > 0) {
        e.preventDefault();
        handleSuggestionPick(suggestions[highlightedIdx]);
      }
      return;
    }

    if (e.key === "ArrowDown" && showSuggestions) {
      e.preventDefault();
      setHighlightedIdx(i => (i + 1) % suggestions.length);
    }
    if (e.key === "ArrowUp" && showSuggestions) {
      e.preventDefault();
      setHighlightedIdx(i => (i - 1 + suggestions.length) % suggestions.length);
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
      setGhostText("");
    }
  };

  useEffect(() => {
    if (isAuthenticated && !currentWorkspace) {
      const stored = localStorage.getItem("currentWorkspace");
      if (stored) {
        try {
          setCurrentWorkspace(JSON.parse(stored));
        } catch {
          /* ignore */
        }
      }
    }
  }, [isAuthenticated, currentWorkspace, setCurrentWorkspace]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Dang xac thuc...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        className={`transition-all duration-300 ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-60"}`}
      >
        <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sticky top-0 z-20 transition-colors duration-200">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            <div className="w-full max-w-5xl relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
              {/* Ghost text layer */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 text-sm text-gray-400 whitespace-pre select-none"
              >
                <span className="invisible">{jqlQuery}</span>
                <span>{ghostText}</span>
              </div>
              <input
                ref={searchRef}
                type="text"
                id="jql-search"
                value={jqlQuery}
                onChange={handleJqlChange}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => { setShowSuggestions(false); setGhostText(""); }, 150)}
                placeholder='Tìm kiếm... (VD: status:"Done" priority:High)'
                className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white transition relative z-[1]"
                autoComplete="off"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <ul className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg overflow-hidden z-50 py-1">
                  {filteredSuggestions.map((opt, idx) => (
                    <li
                      key={opt}
                      onMouseDown={() => handleSuggestionPick(opt)}
                      className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                        idx === highlightedIdx
                          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {opt}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title={`Theme: ${theme}`}
            >
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              ) : theme === 'system' ? (
                <Monitor className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              ) : (
                <Sun className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </button>

            {/* Notification */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition">
              <img
                src="/logo-yaviet/download.png" 
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {showNotifications && (
          <NotificationPanel onClose={() => setShowNotifications(false)} />
        )}

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
