"use client";

import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { useCreateWorkspacePage } from "@/modules/workspace/shared/hooks/useCreateWorkspacePage";
import CreateWorkspaceView from "@/modules/workspace/shared/components/CreateWorkspaceView";

export default function CreateWorkspacePage() {
  usePageTitle("Create Workspace");
  const page = useCreateWorkspacePage();
  return <CreateWorkspaceView {...page} />;
}
