"use client";

import { useState } from "react";
import { Shield, Check } from "lucide-react";

const permissions = [
  { group: "Workspace", items: ["workspace:read", "workspace:write", "workspace:admin"] },
  { group: "Project", items: ["project:read", "project:write", "project:delete"] },
  { group: "Tasks", items: ["task:read", "task:write", "task:delete", "task:assign"] },
  { group: "Knowledge base", items: ["space:read", "space:write", "space:delete", "page:write", "page:delete"] },
  { group: "Users", items: ["user:read", "user:manage"] },
];

export interface PermissionsProps {
  className?: string;
}

export default function Permissions({ className = "" }: PermissionsProps) {
  const [saved, setSaved] = useState(false);

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Role & Permissions</h1>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" /> System Roles
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "Administrator", desc: "Full access" },
            { name: "Member", desc: "Create and edit tasks" },
            { name: "Viewer", desc: "View only, no editing" },
            { name: "Guest", desc: "Limited permissions" },
          ].map((role) => (
            <div key={role.name} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-700 cursor-pointer transition-colors bg-white dark:bg-gray-800">
              <p className="font-medium text-gray-900 dark:text-white text-sm">{role.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{role.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Permission Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Permission</th>
                <th className="text-center py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Admin</th>
                <th className="text-center py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Member</th>
                <th className="text-center py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Viewer</th>
              </tr>
            </thead>
            <tbody>
              {permissions.flatMap(g => g.items.map(item => (
                <tr key={item} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{item}</td>
                  {[1, 1, 0].map((val, i) => (
                    <td key={i} className="py-2 px-3 text-center">
                      {val ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                  ))}
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
