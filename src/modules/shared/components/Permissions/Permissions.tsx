"use client";

import { useState } from "react";
import { Shield, Check, X, Users, Save } from "lucide-react";

const roles = [
  { id: "admin", name: "Administrator", desc: "Full system control" },
  { id: "member", name: "Member", desc: "Create and manage tasks and projects" },
  { id: "viewer", name: "Viewer", desc: "View content only" },
  { id: "guest", name: "Guest", desc: "Very limited permissions" },
];

const roleClasses: Record<string, string> = {
  admin: "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6]",
  member: "bg-[#EDF3EC] dark:bg-[rgba(52,101,56,0.12)] text-[#346538] dark:text-[#4ADE80]",
  viewer: "bg-[#FBF3DB] dark:bg-[rgba(149,100,0,0.12)] text-[#956400] dark:text-[#F59E0B]",
  guest: "bg-[#F7F6F3] dark:bg-[#252525] text-[#787774] dark:text-[#9B9A97]",
};

const permissionGroups = [
  {
    group: "Workspace",
    label: "Workspace",
    items: [
      { key: "workspace:read", label: "View workspace" },
      { key: "workspace:write", label: "Edit workspace" },
      { key: "workspace:admin", label: "Administer workspace" },
    ],
  },
  {
    group: "Project",
    label: "Project",
    items: [
      { key: "project:read", label: "View project" },
      { key: "project:write", label: "Create/Edit project" },
      { key: "project:delete", label: "Delete project" },
    ],
  },
  {
    group: "Task",
    label: "Tasks",
    items: [
      { key: "task:read", label: "View tasks" },
      { key: "task:write", label: "Create/Edit tasks" },
      { key: "task:delete", label: "Delete tasks" },
      { key: "task:assign", label: "Assign tasks" },
    ],
  },
  {
    group: "Knowledge",
    label: "Knowledge base",
    items: [
      { key: "space:read", label: "View Space" },
      { key: "space:write", label: "Create/Edit Space" },
      { key: "space:delete", label: "Delete Space" },
      { key: "page:write", label: "Create/Edit pages" },
      { key: "page:delete", label: "Delete pages" },
    ],
  },
  {
    group: "User",
    label: "User",
    items: [
      { key: "user:read", label: "View user list" },
      { key: "user:manage", label: "Manage users" },
    ],
  },
];

export default function Permissions() {
  const [saved, setSaved] = useState(false);
  const [permissionsMatrix, setPermissionsMatrix] = useState({
    admin: ["workspace:read", "workspace:write", "workspace:admin", "project:read", "project:write", "project:delete", "task:read", "task:write", "task:delete", "task:assign", "space:read", "space:write", "space:delete", "page:write", "page:delete", "user:read", "user:manage"],
    member: ["workspace:read", "project:read", "project:write", "task:read", "task:write", "task:assign", "space:read", "page:write"],
    viewer: ["workspace:read", "project:read", "task:read", "space:read"],
    guest: ["workspace:read"],
  });

  const togglePermission = (role: string, perm: string) => {
    setPermissionsMatrix(prev => {
      const current = prev[role as keyof typeof prev] || [];
      const newPerms = current.includes(perm)
        ? current.filter(p => p !== perm)
        : [...current, perm];
      
      return { ...prev, [role]: newPerms };
    });
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="app-page-wide">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#111111] dark:text-[#E8E8E7]">Roles & Permissions</h1>
          <p className="text-[#787774] dark:text-[#9B9A97] mt-1">Manage permissions for each role in the system</p>
        </div>
        
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2.5 rounded-[6px] font-medium transition-all active:scale-95"
        >
          <Save className="w-5 h-5" />
          Save changes
        </button>
      </div>

      {/* System Roles */}
      <div className="workspace-panel bg-white dark:bg-[#202020] rounded-[10px] border border-[#EAEAEA] dark:border-white/8 mb-8">
        <h2 className="font-semibold text-[#111111] dark:text-[#E8E8E7] text-xl mb-5 flex items-center gap-3">
          <Shield className="w-6 h-6 text-[#2563EB] dark:text-[#3B82F6]" />
          System Roles
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
            className="workspace-panel border border-[#EAEAEA] dark:border-white/10 rounded-[10px] hover:border-[#2563EB]/30 dark:hover:border-[#3B82F6] transition-all group"
            >
              <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${roleClasses[role.id]}`}>
                <Users className="w-5 h-5" />
              </div>
              <p className="font-semibold text-lg text-[#111111] dark:text-[#E8E8E7]">{role.name}</p>
              <p className="text-sm text-[#787774] dark:text-[#9B9A97] mt-1">{role.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white dark:bg-[#202020] rounded-[10px] border border-[#EAEAEA] dark:border-white/8 overflow-hidden">
        <div className="workspace-panel border-b border-[#EAEAEA] dark:border-white/8 flex items-center justify-between">
          <h2 className="font-semibold text-xl text-[#111111] dark:text-[#E8E8E7]">Permission Matrix</h2>
          {saved && (
            <div className="flex items-center gap-2 text-[#346538] dark:text-[#4ADE80] text-sm font-medium">
              <Check className="w-4 h-4" />
              Saved successfully
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full app-table-min">
            <thead>
              <tr className="border-b border-[#EAEAEA] dark:border-white/8 bg-[#F9F9F8] dark:bg-[#252525]">
                <th className="text-left py-4 px-6 font-medium text-[#787774] dark:text-[#9B9A97] w-80">Permission</th>
                {roles.map(role => (
                  <th key={role.id} className="text-center py-4 px-4 font-medium text-[#787774] dark:text-[#9B9A97]">
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionGroups.map((group) => (
                <>
                  {/* Group Header */}
                  <tr className="bg-[#F9F9F8] dark:bg-[#252525] border-b border-[#EAEAEA] dark:border-white/8">
                    <td colSpan={5} className="px-6 py-3 font-semibold text-[#787774] dark:text-[#9B9A97]">
                      {group.label}
                    </td>
                  </tr>

                  {/* Permissions */}
                  {group.items.map((perm) => (
                    <tr key={perm.key} className="border-b border-[#EAEAEA] dark:border-white/8 hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-[#787774] dark:text-[#9B9A97] font-medium">
                        {perm.label}
                        <span className="text-xs text-[#ABABAB] dark:text-[#6B6B6B] ml-2 font-mono">({perm.key})</span>
                      </td>
                      
                      {roles.map((role) => {
                        const isChecked = permissionsMatrix[role.id as keyof typeof permissionsMatrix]?.includes(perm.key);
                        return (
                          <td
                            key={role.id}
                            className="text-center py-4 px-4 cursor-pointer hover:bg-[#F7F6F3] dark:hover:bg-white/8 transition-colors"
                            onClick={() => togglePermission(role.id, perm.key)}
                          >
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-[6px] transition-all hover:scale-110">
                              {isChecked ? (
                                <Check className="w-5 h-5 text-[#346538] dark:text-[#4ADE80]" />
                              ) : (
                                <X className="w-5 h-5 text-[#ABABAB] dark:text-[#6B6B6B]" />
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-xs text-[#ABABAB] dark:text-[#6B6B6B] mt-8">
        Click a cell to toggle a permission. Changes apply after clicking &quot;Save changes&quot;
      </p>
    </div>
  );
}
