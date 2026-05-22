"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/admin/components/common/components/LoadingSpinner";
import { Search, Plus, MoreHorizontal, Mail, Shield, Trash2, ChevronDown } from "lucide-react";

interface User {
  _id: string;
  email: string;
  fullName?: string;
  avatar?: string;
  role: string;
  status: string;
  createdAt: string;
}

interface WorkspaceMember {
  userId: string;
  email: string;
  fullName?: string;
  avatar?: string;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: string;
  status?: string;
}

export interface AdminUsersProps {
  className?: string;
}

const roleColors: Record<string, string> = {
  owner: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  admin: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300",
  member: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  viewer: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
};

const roleLabels: Record<string, string> = {
  owner: "Chủ sở hữu",
  admin: "Quản trị viên",
  member: "Thành viên",
  viewer: "Người xem",
};

export default function AdminUsers({ className = "" }: AdminUsersProps) {
  const { currentWorkspace, setWorkspaces } = useWorkspaceStore();
  const [users, setUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"workspace" | "all">("workspace");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get(apiRoutes.USERS.BASE),
      api.get(apiRoutes.WORKSPACES.BASE).then((res) => {
        if (!cancelled) setWorkspaces(res.data);
        return res.data;
      }),
    ])
      .then(([usersRes, wsData]) => {
        if (cancelled) return;
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        if (currentWorkspace?.key) {
          return api.get(apiRoutes.WORKSPACES.MEMBERS(currentWorkspace.key));
        }
        const ws = currentWorkspace || (wsData.length > 0 ? wsData[0] : null);
        if (ws) {
          return api.get(apiRoutes.WORKSPACES.MEMBERS(ws.key));
        }
        return null;
      })
      .then((res) => {
        if (!cancelled && res) {
          setMembers(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [setWorkspaces]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentWorkspace?.key) return;
    setInviting(true);
    try {
      await api.post(apiRoutes.WORKSPACES.ADD_MEMBER(currentWorkspace.key), { email: inviteEmail, role: inviteRole });
      const res = await api.get(apiRoutes.WORKSPACES.MEMBERS(currentWorkspace.key));
      setMembers(Array.isArray(res.data) ? res.data : []);
      setInviteEmail("");
      setShowInvite(false);
    } catch {} finally { setInviting(false); }
  };

  const handleChangeRole = async (memberEmail: string, newRole: string) => {
    if (!currentWorkspace?.key) return;
    try {
      await api.put(apiRoutes.WORKSPACES.UPDATE_MEMBER(currentWorkspace.key, memberEmail), { role: newRole });
      setMembers(prev => prev.map(m => m.email === memberEmail ? { ...m, role: newRole as WorkspaceMember["role"] } : m));
      setOpenMenu(null);
    } catch {}
  };

  const handleRemoveMember = async (email: string) => {
    if (!currentWorkspace?.key) return;
    if (!confirm("Xóa thành viên này khỏi workspace?")) return;
    try {
      await api.delete(apiRoutes.WORKSPACES.REMOVE_MEMBER(currentWorkspace.key, email));
      setMembers(prev => prev.filter(m => m.email !== email));
    } catch {}
  };

  const filteredMembers = members.filter(u =>
    (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.fullName || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.fullName || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  const displayItems = tab === "workspace" ? filteredMembers : filteredUsers;

  return (
    <div className={`app-page-wide ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Người dùng</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Quản lý thành viên và quyền truy cập</p>
        </div>
        <button onClick={() => setShowInvite(true)} disabled={!currentWorkspace} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors disabled:opacity-50">
          <Plus className="w-4 h-4" /> Mời Thành viên
        </button>
      </div>

      {showInvite && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-[var(--app-page-pad)]">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-[min(100%,var(--app-popover-w))]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">Mời Thành viên</h3>
              <button onClick={() => setShowInvite(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><MoreHorizontal className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleInvite} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Địa chỉ Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required
                    placeholder="colleague@company.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Vai trò</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none">
                    <option value="viewer">Người xem - Chỉ có thể xem</option>
                    <option value="member">Thành viên - Có thể tạo và chỉnh sửa</option>
                    <option value="admin">Quản trị viên - Toàn quyền truy cập</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setShowInvite(false)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Hủy</button>
                <button type="submit" disabled={inviting} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {inviting ? "Đang gửi..." : "Gửi lời mời"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex w-full flex-wrap items-center gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg sm:w-fit">
        <button onClick={() => setTab("workspace")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "workspace" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
          Thành viên Workspace ({members.length})
        </button>
        <button onClick={() => setTab("all")} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "all" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
          Tất cả Người dùng ({users.length})
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative max-w-[min(100%,28rem)]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Tìm kiếm ${tab === "workspace" ? "thành viên" : "người dùng"}...`}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full app-table-min">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Thành viên</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vai trò</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Trạng thái</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ngày tham gia</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {displayItems.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500 text-sm">Không tìm thấy {tab === "workspace" ? "thành viên" : "người dùng"} nào</td></tr>
            ) : displayItems.map((item: any) => (
              <tr key={item._id || item.email} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {item.avatar ? <img src={item.avatar} className="w-full h-full rounded-full object-cover" alt="" /> : (item.fullName || item.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.fullName || "—"}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  {tab === "workspace" ? (
                    <div className="relative">
                      <button onClick={() => setOpenMenu(openMenu === item.email ? null : item.email)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${roleColors[item.role] || roleColors.member} hover:opacity-80 transition-opacity`}>
                        {roleLabels[item.role] || item.role}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {openMenu === item.email && item.role !== "owner" && (
                        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 py-1 min-w-[160px]">
                          {["admin", "member", "viewer"].map((r) => (
                            <button key={r} onClick={() => handleChangeRole(item.email, r)}
                              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${item.role === r ? "text-indigo-600 dark:text-indigo-400 font-medium" : "text-gray-700 dark:text-gray-300"}`}>
                              {roleLabels[r]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${roleColors[item.role] || roleColors.member}`}>{roleLabels[item.role] || item.role}</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${item.status === "active" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
                    {item.status === "active" ? "Hoạt động" : "Không hoạt động"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">{new Date(item.createdAt || item.joinedAt).toLocaleDateString("vi-VN", { day: "numeric", month: "short", year: "numeric" })}</td>
                <td className="px-5 py-3.5 text-right">
                  {tab === "workspace" && item.role !== "owner" && (
                    <button onClick={() => handleRemoveMember(item.email)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Xóa khỏi workspace">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
