"use client";

import { useState } from "react";
import { Shield, Check } from "lucide-react";

const permissions = [
  { group: "Workspace", items: ["workspace:read", "workspace:write", "workspace:admin"] },
  { group: "Dự án", items: ["project:read", "project:write", "project:delete"] },
  { group: "Công việc", items: ["task:read", "task:write", "task:delete", "task:assign"] },
  { group: "Cơ sở tri thức", items: ["space:read", "space:write", "space:delete", "page:write", "page:delete"] },
  { group: "Người dùng", items: ["user:read", "user:manage"] },
];

export default function PermissionsPage() {
  const [saved, setSaved] = useState(false);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Vai trò & Phân quyền</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-500" /> Vai trò Hệ thống</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "Quản trị viên", desc: "Toàn quyền truy cập" },
            { name: "Thành viên", desc: "Tạo, chỉnh sửa công việc" },
            { name: "Người xem", desc: "Chỉ xem, không chỉnh sửa" },
            { name: "Khách", desc: "Quyền hạn giới hạn" },
          ].map((role) => (
            <div key={role.name} className="p-4 border border-gray-200 rounded-xl hover:border-indigo-200 cursor-pointer transition-colors">
              <p className="font-medium text-gray-900 text-sm">{role.name}</p>
              <p className="text-xs text-gray-400 mt-1">{role.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Ma trận Phân quyền</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-500">Quyền hạn</th>
                <th className="text-center py-2 px-3 font-medium text-gray-500">Quản trị</th>
                <th className="text-center py-2 px-3 font-medium text-gray-500">Thành viên</th>
                <th className="text-center py-2 px-3 font-medium text-gray-500">Người xem</th>
              </tr>
            </thead>
            <tbody>
              {permissions.flatMap(g => g.items.map(item => (
                <tr key={item} className="border-b border-gray-100">
                  <td className="py-2 px-3 text-gray-700">{item}</td>
                  {[1, 1, 0].map((val, i) => (
                    <td key={i} className="py-2 px-3 text-center">
                      {val ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <span className="text-gray-300">—</span>}
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
