"use client";

import { useState } from "react";
import { Shield, Check, X, Users, Save, Edit3 } from "lucide-react";

const roles = [
  { id: "admin", name: "Administrator", desc: "Full system control", color: "indigo" },
  { id: "member", name: "Member", desc: "Create and manage tasks and projects", color: "emerald" },
  { id: "viewer", name: "Viewer", desc: "View content only", color: "amber" },
  { id: "guest", name: "Guest", desc: "Very limited permissions", color: "gray" },
];

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
          <h1 className="text-3xl font-bold text-white dark:text-white">Roles & Permissions</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage permissions for each role in the system</p>
        </div>
        
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all active:scale-95"
        >
          <Save className="w-5 h-5" />
          Save changes
        </button>
      </div>

      {/* System Roles */}
      <div className="workspace-panel bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 mb-8">
        <h2 className="font-semibold text-white text-xl mb-5 flex items-center gap-3">
          <Shield className="w-6 h-6 text-white" />
          System Roles
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
            className="workspace-panel border border-gray-200 dark:border-gray-700 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl bg-${role.color}-100 dark:bg-${role.color}-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Users className={`w-5 h-5 text-${role.color}-600 dark:text-${role.color}-400`} />
              </div>
              <p className="font-semibold text-lg text-gray-900 dark:text-white">{role.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{role.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="workspace-panel border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-xl text-white">Permission Matrix</h2>
          {saved && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              <Check className="w-4 h-4" />
              Saved successfully
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full app-table-min">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                <th className="text-left py-4 px-6 font-medium text-gray-500 dark:text-gray-400 w-80">Permission</th>
                {roles.map(role => (
                  <th key={role.id} className="text-center py-4 px-4 font-medium text-gray-700 dark:text-gray-300">
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionGroups.map((group) => (
                <>
                  {/* Group Header */}
                  <tr className="bg-gray-50 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800">
                    <td colSpan={5} className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300">
                      {group.label}
                    </td>
                  </tr>

                  {/* Permissions */}
                  {group.items.map((perm) => (
                    <tr key={perm.key} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium">
                        {perm.label}
                        <span className="text-xs text-gray-400 ml-2 font-mono">({perm.key})</span>
                      </td>
                      
                      {roles.map((role) => {
                        const isChecked = permissionsMatrix[role.id as keyof typeof permissionsMatrix]?.includes(perm.key);
                        return (
                          <td
                            key={role.id}
                            className="text-center py-4 px-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            onClick={() => togglePermission(role.id, perm.key)}
                          >
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:scale-110">
                              {isChecked ? (
                                <Check className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <X className="w-5 h-5 text-gray-300 dark:text-gray-600" />
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

      <p className="text-center text-xs text-gray-400 mt-8">
        Click a cell to toggle a permission. Changes apply after clicking "Save changes"
      </p>
    </div>
  );
}
