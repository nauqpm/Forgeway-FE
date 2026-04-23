"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import { Building2, Users, Plus, X, Crown, Shield, User as UserIcon } from "lucide-react";

interface Member { userId: { _id: string; email: string; fullName?: string }; role: string; }

export default function WorkspaceSettingsPage() {
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const [workspace, setWorkspace] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentWorkspace?._id) return;
    const fetch = async () => {
      try {
        const res = await api.get(apiRoutes.WORKSPACES.BY_ID(currentWorkspace._id));
        setWorkspace(res.data);
        setMembers(res.data.members || []);
        setForm({ name: res.data.name, description: res.data.description || "" });
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, [currentWorkspace?._id]);

  const handleSave = async () => {
    if (!currentWorkspace?._id) return;
    setSaving(true);
    try {
      const res = await api.put(apiRoutes.WORKSPACES.BY_ID(currentWorkspace._id), form);
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

  const roleIcons: Record<string, any> = { owner: Crown, admin: Shield, member: UserIcon, viewer: UserIcon };
  const roleColors: Record<string, string> = { owner: "text-amber-500", admin: "text-purple-500", member: "text-blue-500", viewer: "text-gray-400" };

  if (loading) return <LoadingSpinner />;
  if (!workspace) return <div className="p-6 text-center text-gray-500">Workspace not found</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Workspace Settings</h1>

      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-500" /> Workspace Info</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none" rows={3} />
          </div>
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-500" /> Members ({members.length})</h2>
        </div>
        <div className="space-y-2">
          {members.map((member) => {
            const RoleIcon = roleIcons[member.role] || UserIcon;
            return (
              <div key={member.userId._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                    {member.userId.fullName?.charAt(0) || member.userId.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.userId.fullName || "User"}</p>
                    <p className="text-xs text-gray-400">{member.userId.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium capitalize flex items-center gap-1 ${roleColors[member.role]}`}>
                    <RoleIcon className="w-3.5 h-3.5" /> {member.role}
                  </span>
                  {member.role !== "owner" && (
                    <button onClick={() => handleRemoveMember(member.userId._id)} className="p-1 hover:bg-red-100 rounded text-red-500">
                      <X className="w-4 h-4" />
                    </button>
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
