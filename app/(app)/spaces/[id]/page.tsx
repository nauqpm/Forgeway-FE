"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import Link from "next/link";
import {
  BookOpen, Plus, ArrowRight, Search, Lock, Globe, MoreHorizontal,
  FileText, Edit2, Trash2, ChevronRight
} from "lucide-react";

interface Page {
  _id: string;
  title: string;
  slug: string;
  authorId?: { fullName?: string; email?: string };
  status: string;
  labels: string[];
  viewCount: number;
  version: number;
  updatedAt: string;
  parentId?: string;
  children?: Page[];
}

interface Space {
  _id: string;
  name: string;
  key: string;
  description?: string;
  type: "private" | "public";
  pages?: Page[];
  pageCount?: number;
}

export default function SpaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { currentWorkspace } = useWorkspaceStore();
  const [space, setSpace] = useState<Space | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"pages" | "labels">("pages");

  useEffect(() => {
    params.then(p => setSpaceId(p.id));
  }, [params]);

  useEffect(() => {
    if (!spaceId) return;
    const fetchData = async () => {
      try {
        const [spaceRes, pagesRes] = await Promise.all([
          api.get(apiRoutes.SPACES.BY_ID(spaceId)),
          api.get(apiRoutes.PAGES.BY_SPACE(spaceId)),
        ]);
        setSpace(spaceRes.data);
        setPages(Array.isArray(pagesRes.data) ? pagesRes.data : []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [spaceId]);

  const filteredPages = pages.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;
  if (!space) return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-gray-500 mb-4">Space not found</p>
      <Link href="/spaces" className="text-indigo-600 hover:text-indigo-800">Back to Spaces</Link>
    </div>
  );

  const allLabels = [...new Set(pages.flatMap(p => p.labels))];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/spaces" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowRight className="w-5 h-5 text-gray-500 rotate-180" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{space.name}</h1>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                space.type === "private" ? "bg-slate-100 text-slate-600" : "bg-green-50 text-green-700"
              }`}>
                {space.type === "private" ? <><Lock className="w-3 h-3" /> Private</> : <><Globe className="w-3 h-3" /> Public</>}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{space.key} &middot; {pages.length} pages</p>
          </div>
        </div>
        <Link href={`/spaces/${spaceId}/pages/create`}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors">
          <Plus className="w-4 h-4" /> New Page
        </Link>
      </div>

      {/* Description */}
      {space.description && (
        <p className="text-gray-600 text-sm mb-6 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">{space.description}</p>
      )}

      {/* Tabs + Search */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button onClick={() => setActiveTab("pages")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "pages" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            Pages ({pages.length})
          </button>
          <button onClick={() => setActiveTab("labels")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "labels" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            Labels ({allLabels.length})
          </button>
        </div>
        {activeTab === "pages" && (
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pages..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
        )}
      </div>

      {/* Pages Tab */}
      {activeTab === "pages" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filteredPages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium mb-1">No pages yet</p>
              <p className="text-gray-400 text-sm mb-4">Create your first page in this space</p>
              <Link href={`/spaces/${spaceId}/pages/create`}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
                <Plus className="w-4 h-4" /> Create First Page
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredPages.map((page) => (
                <Link key={page._id} href={`/spaces/${spaceId}/pages/${page.slug}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
                  <FileText className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 truncate">{page.title}</p>
                      {page.status === "draft" && (
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-medium">Draft</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400">{page.authorId?.fullName || "Unknown"}</span>
                      <span className="text-xs text-gray-300">&middot;</span>
                      <span className="text-xs text-gray-400">{page.viewCount} views</span>
                      {page.labels.slice(0, 2).map(label => (
                        <span key={label} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{label}</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(page.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Labels Tab */}
      {activeTab === "labels" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          {allLabels.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No labels used yet</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allLabels.map(label => (
                <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
                  {label}
                  <span className="bg-indigo-100 text-indigo-600 text-xs px-1.5 py-0.5 rounded-full">
                    {pages.filter(p => p.labels.includes(label)).length}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
