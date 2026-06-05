"use client";
import { useState, useEffect, useRef } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { ChevronDown, Plus, Check, Building2 } from "lucide-react";

export default function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, setWorkspaces, setCurrentWorkspace, workspacesLoaded } = useWorkspaceStore();
  const { user } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !user || workspacesLoaded) return;
    loaded.current = true;
    api.get(apiRoutes.WORKSPACES.BASE).then((res) => {
      setWorkspaces(res.data);
    }).catch(() => {});
  }, [user, setWorkspaces, workspacesLoaded]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#F7F6F3] dark:hover:bg-white/8 rounded-[6px] transition-colors"
      >
        <Building2 className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
        <span className="font-medium text-sm text-[#111111] dark:text-[#E8E8E7] max-w-[150px] truncate">
          {currentWorkspace?.name || "Select Workspace"}
        </span>
        <ChevronDown className="w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
      </button>

      {showDropdown && (
        <div
          className="absolute top-full left-0 mt-1 w-[min(calc(100vw-48px),var(--app-popover-w))] bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] py-2 z-50"
          style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}
        >
          <div className="px-3 py-2">
            <p className="text-xs text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-wider font-medium">Workspaces</p>
          </div>
          {workspaces.map((ws) => (
            <button
              key={ws._id}
              onClick={() => {
                setCurrentWorkspace(ws);
                setShowDropdown(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors ${
                currentWorkspace?._id === ws._id ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)]" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[6px] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6] flex items-center justify-center text-xs font-bold">
                  {ws.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-[#111111] dark:text-[#E8E8E7]">{ws.name}</span>
              </div>
              {currentWorkspace?._id === ws._id && <Check className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />}
            </button>
          ))}

          <div className="border-t border-[#EAEAEA] dark:border-white/[0.06] mt-2 pt-2">
            <button
              onClick={() => { setShowDropdown(false); router.push("/workspaces/create"); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#2563EB] dark:text-[#3B82F6] hover:bg-[#EFF6FF] dark:hover:bg-[rgba(37,99,235,0.12)]"
            >
              <Plus className="w-4 h-4" /> Create New Workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
