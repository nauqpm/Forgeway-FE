"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePageTitle } from "@/hooks/usePageTitle";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/shared/components/common/components/LoadingSpinner";
import Link from "next/link";
import { ArrowLeft, Edit3, Clock, Eye } from "lucide-react";

interface Page {
  _id: string;
  title: string;
  content: string;
  slug: string;
  status: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  authorId?: any;
  labels: string[];
  version: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function PageViewPage() {
  const params = useParams();
  const slug = params.slug as string;
  const workspaceKey = params.key as string;
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  usePageTitle(page?.title || "Page");

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await api.get(apiRoutes.PAGES.BY_SLUG(slug));
        setPage(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  if (loading) return <LoadingSpinner />;
  if (!page) return <div className="app-main text-center text-gray-500">Page not found</div>;

  return (
    <div className="app-page-narrow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/workspaces/${workspaceKey}/docs`}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${page.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}
          >
            {page.status}
          </span>
        </div>
        <Link
          href={`/workspaces/${workspaceKey}/pages/${slug}/edit`}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm"
        >
          <Edit3 className="w-4 h-4" /> Edit
        </Link>
      </div>

      <article className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-[var(--workspace-surface-pad)] md:p-[clamp(24px,2vw,32px)]">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{page.title}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
          {page.authorId && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                {page.authorId.fullName?.charAt(0) || "?"}
              </div>
              <span>{page.authorId.fullName || "Unknown"}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{new Date(page.updatedAt).toLocaleDateString("en-US")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            <span>{page.viewCount} views</span>
          </div>
          <span>v{page.version}</span>
        </div>

        {page.labels.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            {page.labels.map((label) => (
              <span key={label} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                {label}
              </span>
            ))}
          </div>
        )}

        <div
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{
            __html: page.content || '<p class="text-gray-400 italic">No content yet. Click Edit to add content.</p>',
          }}
        />
      </article>
    </div>
  );
}
