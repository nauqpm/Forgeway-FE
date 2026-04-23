"use client";
import { useState, useEffect, useRef } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useAuth } from "@/context/AuthContext";
import api from "@/common/services/api.service";
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
    api.get(apiRoutes.WORKSPACES.BASE).then((res) => {
      setWorkspaces(res.data);
    }).catch(() => {});
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
      const res = await api.post(apiRoutes.WORKSPACES.BASE, { name: newName });
      const newWs = res.data;
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
        className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Building2 className="w-4 h-4 text-indigo-600" />
        <span className="font-medium text-sm text-gray-800 max-w-[150px] truncate">
          {currentWorkspace?.name || "Select Workspace"}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-3 py-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Workspaces</p>
          </div>
          {workspaces.map((ws) => (
            <button
              key={ws._id}
              onClick={() => {
                setCurrentWorkspace(ws);
                setShowDropdown(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors ${
                currentWorkspace?._id === ws._id ? "bg-indigo-50" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                  {ws.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-800">{ws.name}</span>
              </div>
              {currentWorkspace?._id === ws._id && <Check className="w-4 h-4 text-indigo-600" />}
            </button>
          ))}

          <div className="border-t border-gray-100 mt-2 pt-2">
            {showCreate ? (
              <div className="px-3 py-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Workspace name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                <div className="flex gap-2">
                  <button onClick={handleCreate} disabled={loading} className="flex-1 bg-indigo-600 text-white text-sm py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    {loading ? "..." : "Create"}
                  </button>
                  <button onClick={() => { setShowCreate(false); setNewName(""); }} className="flex-1 border border-gray-300 text-gray-700 text-sm py-1.5 rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowCreate(true)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50">
                <Plus className="w-4 h-4" /> Create Workspace
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
