"use client";

import { use } from "react";
import { useWorkspacePage } from "@/modules/workspace/shared/hooks/useWorkspacePage";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import WorkspacePage from "@/modules/workspace/shared/components/WorkspacePage";

/**
 * Deep-link edit route: /workspaces/:key/pages/:slug-:pageId/edit
 *
 * Renders the full workspace shell (header + tabs) with the Docs tab active.
 * DocsLayout reads the URL pathname to detect "/edit" and open the editor in edit mode.
 */
export default function PageEditRoute({ params }: { params: Promise<{ key: string; slug: string }> }) {
  const { key: workspaceKey } = use(params);
  // Force `tab` to ["pages"] so useWorkspacePage sets activeTab = "pages"
  const page = useWorkspacePage(workspaceKey, ["pages"]);
  usePageTitle(page.pageTitle);
  return <WorkspacePage {...page} />;
}
