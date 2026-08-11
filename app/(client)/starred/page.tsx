"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import LoadingSpinner from "@/modules/admin-shared/components/common/components/LoadingSpinner";
import WorkspaceAvatar from "@/modules/workspace/shared/components/WorkspaceAvatar";
import WorkspaceStarButton from "@/modules/workspace/shared/components/WorkspaceStarButton";
import { workspaceService } from "@/modules/workspace/shared/services/workspaceService";
import { queryKeys } from "@/shared/constants/queryKeys";
import { usePageTitle } from "@/shared/hooks/usePageTitle";

export default function StarredWorkspacesPage() {
  usePageTitle("Starred");
  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: queryKeys.workspaces.starred(),
    queryFn: workspaceService.listStarred,
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="app-page-medium app-page-fluid-xl py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#111111] dark:text-[#E8E8E7]">Starred</h1>
          <p className="mt-1 text-sm text-[#787774] dark:text-[#9B9A97]">
            Your personal starred workspaces.
          </p>
        </div>

        {workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-[#EAEAEA] bg-white py-24 text-center dark:border-white/[0.06] dark:bg-[#202020]">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F7F6F3] dark:bg-[#252525]">
              <Star className="h-8 w-8 text-[#ABABAB] dark:text-[#6B6B6B]" />
            </div>
            <h2 className="text-lg font-semibold text-[#111111] dark:text-[#E8E8E7]">
              No starred workspaces yet
            </h2>
            <p className="mt-2 max-w-sm text-sm text-[#787774] dark:text-[#9B9A97]">
              Select the star next to a workspace to keep it here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {workspaces.map(workspace => {
              const routeKey = workspace.key || workspace.slug || workspace._id;
              return (
                <Link
                  key={workspace._id}
                  href={`/workspaces/${routeKey}`}
                  className="flex items-center gap-3 rounded-[8px] border border-[#EAEAEA] bg-white px-4 py-3 transition-colors hover:border-[#2563EB]/30 dark:border-white/[0.06] dark:bg-[#202020] dark:hover:border-[#3B82F6]/40"
                >
                  <WorkspaceAvatar workspace={workspace} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">
                      {workspace.name}
                    </p>
                    <p className="truncate text-xs text-[#787774] dark:text-[#9B9A97]">
                      {workspace.key || workspace.slug}
                    </p>
                  </div>
                  <WorkspaceStarButton workspace={workspace} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
