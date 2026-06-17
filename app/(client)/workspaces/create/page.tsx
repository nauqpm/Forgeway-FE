"use client";

import { usePageTitle } from "@/hooks/usePageTitle";
import { useCreateWorkspacePage } from "@/modules/client/workspaces/hooks/useCreateWorkspacePage";
import CreateWorkspaceView from "@/modules/client/workspaces/components/CreateWorkspaceView";

export default function CreateWorkspacePage() {
  usePageTitle("Create Workspace");
  const page = useCreateWorkspacePage();
  return <CreateWorkspaceView {...page} />;
}
