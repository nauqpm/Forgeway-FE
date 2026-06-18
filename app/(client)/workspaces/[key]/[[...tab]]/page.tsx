"use client";

import { use } from "react";
import { useWorkspacePage } from "@/modules/workspace/shared/hooks/useWorkspacePage";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import WorkspacePage from "@/modules/workspace/shared/components/WorkspacePage";

export default function WorkspaceDetailPage({ params }: { params: Promise<{ key: string; tab?: string[] }> }) {
  const { key: workspaceKey, tab } = use(params);
  const page = useWorkspacePage(workspaceKey, tab);
  usePageTitle(page.pageTitle);
  return <WorkspacePage {...page} />;
}
