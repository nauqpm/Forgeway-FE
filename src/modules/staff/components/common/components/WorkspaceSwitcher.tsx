"use client";
import { useState, useEffect, useRef } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { ChevronDown, Plus, Check, Building2 } from "lucide-react";

export default function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, setWorkspaces, setCurrentWorkspace } = useWorkspaceStore();
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !user) return;
    loaded.current = true;

    // Mock API
    const fetchWorkspaces = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        let mockWorkspaces = JSON.parse(localStorage.getItem("MOCK_WORKSPACES") || "[]");

        // Create one default workspace if none exists
        if (mockWorkspaces.length === 0) {
          const defaultWs = {
            _id: "ws_default_" + Date.now(),
            name: "Personal workspace",
            slug: "personal-workspace",
            ownerId: "user_1",
            members: [],
          };
          mockWorkspaces = [defaultWs];
          localStorage.setItem("MOCK_WORKSPACES", JSON.stringify(mockWorkspaces));
        }
        setWorkspaces(mockWorkspaces);
      } catch (e) {
        console.error(e);
      }
    };
    fetchWorkspaces();
  }, [user, setWorkspaces]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newWs = {
        _id: "ws_" + Date.now(),
        name: newName,
        slug: newName.toLowerCase().replace(/\s+/g, "-"),
        ownerId: "user_1",
        members: [],
      };

      const mockWorkspaces = JSON.parse(localStorage.getItem("MOCK_WORKSPACES") || "[]");
      localStorage.setItem("MOCK_WORKSPACES", JSON.stringify([...mockWorkspaces, newWs]));

      setWorkspaces([...workspaces, newWs]);
      setCurrentWorkspace(newWs);
      setShowCreate(false);
      setNewName("");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#F7F6F3] dark:hover:bg-white/8 rounded-[6px] transition-colors"
      >
        <Building2 className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
        <span className="font-medium text-sm text-[#111111] dark:text-[#E8E8E7] max-w-[9.375rem] truncate">
          {currentWorkspace?.name || "Select Workspace"}
        </span>
        <ChevronDown className="w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
      </button>

      {showDropdown && (
        <div
          className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] py-2 z-50"
          style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}
        >
          <div className="px-3 py-2">
            <p className="text-xs text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-wider font-medium">
              Workspaces
            </p>
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
            {showCreate ? (
              <div className="px-3 py-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Workspace name"
                  className="w-full px-3 py-2 border border-[#EAEAEA] dark:border-white/[0.06] rounded-[6px] text-sm mb-2 bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] placeholder-[#ABABAB] dark:placeholder-[#6B6B6B] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="flex-1 bg-[#2563EB] text-white text-sm py-1.5 rounded-[6px] hover:bg-[#1D4ED8] disabled:opacity-50"
                  >
                    {loading ? "..." : "Create"}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreate(false);
                      setNewName("");
                    }}
                    className="flex-1 border border-[#EAEAEA] dark:border-white/[0.06] text-[#787774] dark:text-[#9B9A97] text-sm py-1.5 rounded-[6px] hover:bg-[#F7F6F3] dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#2563EB] dark:text-[#3B82F6] hover:bg-[#EFF6FF] dark:hover:bg-[rgba(37,99,235,0.12)]"
              >
                <Plus className="w-4 h-4" /> Create Workspace
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
