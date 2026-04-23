"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import Link from "next/link";
import { ArrowLeft, Plus, FileText, ChevronRight, ChevronDown, Home, Globe, Lock, MoreHorizontal } from "lucide-react";

interface Page { _id: string; title: string; slug: string; status: string; parentId?: string; children?: Page[]; }
interface Space { _id: string; name: string; key: string; description?: string; type: string; }

export default function SpaceDetailPage() {
  const params = useParams();
  const spaceId = params.id as string;
  const { currentWorkspace } = useWorkspaceStore();
  const [space, setSpace] = useState<Space | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    try {
      const [spaceRes, pagesRes] = await Promise.all([
        api.get(apiRoutes.SPACES.BY_ID(spaceId)),
        api.get(apiRoutes.PAGES.BY_SPACE(spaceId)),
      ]);
      setSpace(spaceRes.data);
      setPages(pagesRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [spaceId]);

  const rootPages = pages.filter(p => !p.parentId);

  if (loading) return <LoadingSpinner />;
  if (!space) return <div className="p-6 text-center text-gray-500">Space not found</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/spaces" className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{space.name}</h1>
              {space.type === "public" ? <Globe className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-amber-500" />}
            </div>
            {space.description && <p className="text-sm text-gray-500">{space.description}</p>}
          </div>
        </div>
        <Link href={`/spaces/${spaceId}/pages/create`} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm">
          <Plus className="w-4 h-4" /> New Page
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <Link href={`/spaces/${spaceId}/pages/overview`} className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            <Home className="w-4 h-4" /> Overview
          </Link>
        </div>
        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">Pages</h2>
          {rootPages.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No pages yet</p>
              <Link href={`/spaces/${spaceId}/pages/create`} className="text-sm text-indigo-600 hover:underline mt-1 inline-block">Create first page</Link>
            </div>
          ) : (
            <div className="space-y-0">
              {rootPages.map((page) => (
                <div key={page._id}>
                  <Link href={`/spaces/${spaceId}/pages/${page.slug}`} className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                    <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 transition-colors">{page.title}</span>
                    <span className={`px-1.5 py-0.5 text-xs rounded ${page.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{page.status}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
