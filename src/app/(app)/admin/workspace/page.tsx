"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import { Building2, Users, X, Crown, Shield, User } from "lucide-react";

interface Member { userId: { _id: string; email: string; fullName?: string }; role: string; }

export default function WorkspaceSettingsPage() {
  const { currentWorkspace, setCurrentWorkspace, setWorkspaces } = useWorkspaceStore();
  const [workspace, setWorkspace] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(apiRoutes.WORKSPACES.BASE)
      .then((res) => {
        if (cancelled) return;
        setWorkspaces(res.data);
        const ws = currentWorkspace || (res.data.length > 0 ? res.data[0] : null);
        if (!ws) { setLoading(false); return; }
        return api.get(apiRoutes.WORKSPACES.BY_ID(ws._id));
      })
      .then((res) => {
        if (cancelled || !res) return;
        setWorkspace(res.data);
        setMembers(res.data.members || []);
        setForm({ name: res.data.name, description: res.data.description || "" });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [setWorkspaces]);

  const handleSave = async () => {
    if (!currentWorkspace?._id) return;
    setSaving(true);
    try {
      const res = await api.put(apiRoutes.WORKSPACES.UPDATE(currentWorkspace._id), form);
      setWorkspace(res.data);
      setCurrentWorkspace(res.data);
    } catch {} finally { setSaving(false); }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!currentWorkspace?._id) return;
    try {
      await api.delete(apiRoutes.WORKSPACES.REMOVE_MEMBER(currentWorkspace._id, userId));
      setMembers(members.filter(m => m.userId._id !== userId));
    } catch {}
  };

  const roleIcons: Record<string, any> = { owner: Crown, admin: Shield, member: User, viewer: User };
  const roleColors: Record<string, string> = { owner: "text-amber-500", admin: "text-purple-500", member: "text-blue-500", viewer: "text-gray-400" };
  const roleLabels: Record<string, string> = { owner: "Chủ sở hữu", admin: "Quản trị viên", member: "Thành viên", viewer: "Người xem" };

  if (loading) return <LoadingSpinner />;

  if (!currentWorkspace) return (
    <div className="p-6 text-center text-gray-500">Không tìm thấy workspace. Vui lòng tạo workspace trước.</div>
  );

  if (!workspace) return <div className="p-6 text-center text-gray-500">Không tìm thấy workspace</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cài đặt Workspace</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-500" /> Thông tin Workspace</h2>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Tên</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none" rows={3} /></div>
          <div className="flex justify-end"><button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">{saving ? "Đang lưu..." : "Lưu thay đổi"}</button></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-500" /> Thành viên ({members.length})</h2>
        <div className="space-y-2">
          {members.map((member) => {
            const RoleIcon = roleIcons[member.role] || User;
            return (
              <div key={member.userId._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">{member.userId.fullName?.charAt(0) || member.userId.email.charAt(0).toUpperCase()}</div>
                  <div><p className="text-sm font-medium text-gray-900">{member.userId.fullName || "Người dùng"}</p><p className="text-xs text-gray-400">{member.userId.email}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium capitalize flex items-center gap-1 ${roleColors[member.role]}`}><RoleIcon className="w-3.5 h-3.5" /> {roleLabels[member.role] || member.role}</span>
                  {member.role !== "owner" && (
                    <button onClick={() => handleRemoveMember(member.userId._id)} className="p-1 hover:bg-red-100 rounded text-red-500" title="Xóa khỏi workspace"><X className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
