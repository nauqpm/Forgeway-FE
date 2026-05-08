"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import Link from "next/link";
import { BookOpen, Plus, Globe, Lock, ChevronRight } from "lucide-react";

interface Space { _id: string; name: string; key: string; description?: string; type: string; _count?: { pages: number }; }

export default function SpacesPage() {
  const { currentWorkspace, setWorkspaces } = useWorkspaceStore();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(apiRoutes.WORKSPACES.BASE)
      .then((res) => {
        if (cancelled) return;
        setWorkspaces(res.data);
        const ws = currentWorkspace || (res.data.length > 0 ? res.data[0] : null);
        if (!ws) { setLoading(false); return; }
        return api.get(`${apiRoutes.SPACES.BASE}?workspaceId=${ws._id}`);
      })
      .then((res) => {
        if (cancelled || !res) return;
        setSpaces(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [setWorkspaces]);

  if (loading) return <LoadingSpinner />;

  if (!currentWorkspace) return (
    <div className="p-6 text-center text-gray-500">Không tìm thấy workspace. Vui lòng tạo workspace trước.</div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-500 text-sm">{spaces.length} spaces</p>
        </div>
        <Link href="/spaces/create" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm">
          <Plus className="w-4 h-4" /> New Space
        </Link>
      </div>

      {spaces.length === 0 ? (
        <div className="flex flex-col items-center py-16 bg-white rounded-xl border border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium mb-4">No spaces yet</p>
          <Link href="/spaces/create" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm">
            <Plus className="w-4 h-4" /> Create First Space
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {spaces.map((space) => (
            <Link key={space._id} href={`/spaces/${space._id}`} className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-indigo-200 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  {space.type === "public" ? <Globe className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-amber-500" />}
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">{space.key}</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600">{space.name}</h3>
              {space.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{space.description}</p>}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">{space._count?.pages || 0} pages</span>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
