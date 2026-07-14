"use client";

import { use } from "react";
import { useWorkspacePage } from "@/modules/workspace/shared/hooks/useWorkspacePage";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import WorkspacePage from "@/modules/workspace/shared/components/WorkspacePage";

/**
 * Deep-link view route: /workspaces/:key/pages/:slug-:pageId
 *
 * Renders the full workspace shell (header + tabs) with the Docs tab active.
 * DocsLayout will read the URL to auto-select the correct document into the store.
 */
export default function PageViewRoute({ params }: { params: Promise<{ key: string; slug: string }> }) {
  const { key: workspaceKey } = use(params);
  // Force `tab` to ["pages"] so useWorkspacePage sets activeTab = "pages"
  const page = useWorkspacePage(workspaceKey, ["pages"]);
  usePageTitle(page.pageTitle);
  return <WorkspacePage {...page} />;
}
