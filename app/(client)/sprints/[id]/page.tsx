"use client";

import { use } from "react";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { useSprintDetailPage } from "@/modules/client/sprints/hooks/useSprintDetailPage";
import SprintDetailView from "@/modules/client/sprints/components/SprintDetailView";
import LoadingSpinner from "@/modules/admin-shared/components/common/components/LoadingSpinner";

export default function SprintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const page = useSprintDetailPage(id);
  usePageTitle(page.sprint?.name ?? "Sprint");

  if (page.loading) return <LoadingSpinner />;

  return (
    <SprintDetailView
      sprint={page.sprint}
      stats={page.stats}
      actionLoading={page.actionLoading}
      handleStartSprint={page.handleStartSprint}
      handleCompleteSprint={page.handleCompleteSprint}
    />
  );
}
