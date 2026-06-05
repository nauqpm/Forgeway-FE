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
      <h1 className="text-2xl font-bold text-[#111111] dark:text-[#E8E8E7] mb-6">Role & Permissions</h1>

      <div className="bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/8 p-6 mb-6">
        <h2 className="font-semibold text-[#111111] dark:text-[#E8E8E7] mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6]" /> System Roles
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "Administrator", desc: "Full access" },
            { name: "Member", desc: "Create and edit tasks" },
            { name: "Viewer", desc: "View only, no editing" },
            { name: "Guest", desc: "Limited permissions" },
          ].map((role) => (
            <div key={role.name} className="p-4 border border-[#EAEAEA] dark:border-white/8 rounded-[8px] hover:border-[#2563EB]/20 dark:hover:border-[#3B82F6] cursor-pointer transition-colors bg-white dark:bg-[#252525]">
              <p className="font-medium text-[#111111] dark:text-[#E8E8E7] text-sm">{role.name}</p>
              <p className="text-xs text-[#ABABAB] dark:text-[#6B6B6B] mt-1">{role.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/8 p-6">
        <h2 className="font-semibold text-[#111111] dark:text-[#E8E8E7] mb-4">Permission Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EAEAEA] dark:border-white/8">
                <th className="text-left py-2 px-3 font-medium text-[#787774] dark:text-[#9B9A97]">Permission</th>
                <th className="text-center py-2 px-3 font-medium text-[#787774] dark:text-[#9B9A97]">Admin</th>
                <th className="text-center py-2 px-3 font-medium text-[#787774] dark:text-[#9B9A97]">Member</th>
                <th className="text-center py-2 px-3 font-medium text-[#787774] dark:text-[#9B9A97]">Viewer</th>
              </tr>
            </thead>
            <tbody>
              {permissions.flatMap(g => g.items.map(item => (
                <tr key={item} className="border-b border-[#EAEAEA] dark:border-white/8">
                  <td className="py-2 px-3 text-[#787774] dark:text-[#9B9A97]">{item}</td>
                  {[1, 1, 0].map((val, i) => (
                    <td key={i} className="py-2 px-3 text-center">
                      {val ? <Check className="w-4 h-4 text-[#346538] dark:text-[#4ADE80] mx-auto" /> : <span className="text-[#ABABAB] dark:text-[#6B6B6B]">—</span>}
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
