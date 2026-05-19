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
        className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Building2 className="w-4 h-4 text-indigo-600" />
        <span className="font-medium text-sm text-gray-800 dark:text-gray-200 max-w-[150px] truncate">
          {currentWorkspace?.name || "Select Workspace"}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          <div className="px-3 py-2">
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Workspaces</p>
          </div>
          {workspaces.map((ws) => (
            <button
              key={ws._id}
              onClick={() => {
                setCurrentWorkspace(ws);
                setShowDropdown(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                currentWorkspace?._id === ws._id ? "bg-indigo-50 dark:bg-indigo-900/20" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                  {ws.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{ws.name}</span>
              </div>
              {currentWorkspace?._id === ws._id && <Check className="w-4 h-4 text-indigo-600" />}
            </button>
          ))}

          <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
            <button
              onClick={() => { setShowDropdown(false); router.push("/spaces/create"); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
            >
              <Plus className="w-4 h-4" /> Tạo Workspace mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
