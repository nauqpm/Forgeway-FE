"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/admin/components/common/components/LoadingSpinner";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Globe, Lock, Columns, Repeat, Users, ShieldAlert, Settings, Mail, Send, Clock, X, Loader2 } from "lucide-react";
import toast from 'react-hot-toast';
import { inviteService, PendingInvite } from '@/modules/client/workspaces/services/inviteService';

export default function SpaceSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = use(params);
  const router = useRouter();
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "members">("general");

  const [form, setForm] = useState({
    name: "",
    description: "",
    visibility: "public",
  });

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'workspace_admin' | 'member' | 'viewer'>('member');
  const [inviting, setInviting] = useState(false);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    api.get(apiRoutes.WORKSPACES.BY_KEY(workspaceId))
      .then((res) => {
        setWorkspace(res.data);
        setForm({
          name: res.data.name || "",
          description: res.data.description || "",
          visibility: res.data.visibility || "public",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    if (activeTab !== 'members' || !workspaceId) return;
    setLoadingInvites(true);
    inviteService.listInvites(workspaceId)
      .then(setInvites)
      .catch(() => toast.error('Không thể tải danh sách lời mời.'))
      .finally(() => setLoadingInvites(false));
  }, [activeTab, workspaceId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(apiRoutes.WORKSPACES.BY_KEY(workspaceId), form);
      router.push(`/workspaces/${workspaceId}`);
    } catch (e) {
      console.error("Save failed", e);
      toast.error('Không thể lưu cài đặt.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Bạn có chắc chắn muốn xóa không gian này không? Hành động này không thể hoàn tác.")) {
      try {
        await api.delete(apiRoutes.WORKSPACES.BY_KEY(workspaceId));
        router.push("/workspaces");
      } catch (e) {
        console.error("Delete failed", e);
        toast.error('Không thể xóa workspace. Bạn có thể không có quyền thực hiện thao tác này.');
      }
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await inviteService.sendInvite(workspaceId, { email: inviteEmail.trim(), role: inviteRole });
      toast.success(`Đã gửi lời mời tới ${inviteEmail.trim()}`);
      setInviteEmail('');
      const updated = await inviteService.listInvites(workspaceId);
      setInvites(updated);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Không thể gửi lời mời.');
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setCancellingId(inviteId);
    try {
      await inviteService.cancelInvite(workspaceId, inviteId);
      setInvites(prev => prev.filter(i => i._id !== inviteId));
      toast.success('Đã hủy lời mời.');
    } catch {
      toast.error('Không thể hủy lời mời.');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!workspace) return <div className="p-10 text-center">Không tìm thấy không gian này.</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/workspaces/${workspaceId}`} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cài đặt Không gian</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {workspace.name} <span className="text-gray-400 dark:text-gray-500 mx-1">&middot;</span> {workspace.key}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Sidebar Settings */}
        <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-800 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 p-4">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("general")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "general" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
            >
              <Settings className="w-4 h-4" /> Cài đặt chung
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "members" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
            >
              <Users className="w-4 h-4" /> Thành viên
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-6 md:p-8">
          {activeTab === "general" && (
            <form onSubmit={handleSave} className="space-y-8 max-w-xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Thông tin cơ bản</h2>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tên Workspace</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mô tả</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mã Workspace (Key)</label>
                    <input
                      type="text"
                      value={workspace.key}
                      disabled
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 font-mono cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Key không thể thay đổi sau khi tạo.</p>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quyền truy cập</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { value: "public", label: "Public", icon: Globe },
                    { value: "private", label: "Private", icon: Lock },
                  ].map((opt) => (
                    <label key={opt.value} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${form.visibility === opt.value ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                      <input 
                        type="radio" 
                        name="visibility" 
                        value={opt.value} 
                        checked={form.visibility === opt.value}
                        onChange={() => setForm({ ...form, visibility: opt.value as "public" | "private" })}
                        className="text-indigo-600 focus:ring-indigo-500" 
                      />
                      <div className="flex items-center gap-2">
                        <opt.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : <><Save className="w-4 h-4" /> Lưu thay đổi</>}
                </button>
              </div>

              <div className="mt-12 p-5 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-5 h-5" /> Danger Zone
                </h3>
                <p className="text-sm text-red-600 mb-4">Xóa Workspace này sẽ xóa toàn bộ Board, Backlog và Tài liệu bên trong. Không thể khôi phục.</p>
                <button 
                  type="button" 
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Xóa Workspace
                </button>
              </div>
            </form>
          )}

          {activeTab === "members" && (
            <div className="space-y-8">
              {/* Invite Form */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-600" /> Mời thành viên
                </h2>
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as typeof inviteRole)}
                    className="px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="workspace_admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {inviting ? 'Đang gửi...' : 'Gửi lời mời'}
                  </button>
                </form>
              </div>

              {/* Pending Invites */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Lời mời đang chờ
                </h3>

                {loadingInvites ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
                  </div>
                ) : invites.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 py-4">Không có lời mời nào đang chờ.</p>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3 w-28">Vai trò</th>
                          <th className="px-4 py-3 w-36">Hết hạn</th>
                          <th className="px-4 py-3 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {invites.map(inv => (
                          <tr key={inv._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{inv.invitedEmail}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-semibold">
                                {inv.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                              {new Date(inv.expiresAt).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleCancelInvite(inv._id)}
                                disabled={cancellingId === inv._id}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                                title="Hủy lời mời"
                              >
                                {cancellingId === inv._id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <X className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
