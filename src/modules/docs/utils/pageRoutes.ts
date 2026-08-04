import type { Document } from "../types/docs.type";

type PageRouteDocument = Pick<Document, "id" | "slug">;

const PAGE_ID_SUFFIX_PATTERN =
  /-(?:[a-f0-9]{24}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}|temp-\d+)$/i;

export function buildWorkspacePagesHref(workspaceKey: string) {
  return `/workspaces/${encodeURIComponent(workspaceKey)}/pages`;
}

export function buildWorkspacePageSlugParam(doc: PageRouteDocument) {
  const slugOrId = doc.slug || doc.id;
  const suffix = `-${doc.id}`;
  return slugOrId === doc.id || slugOrId.endsWith(suffix) ? slugOrId : `${slugOrId}${suffix}`;
}

export function slugParamToPageSlug(slugParam: string) {
  return decodeURIComponent(slugParam).replace(PAGE_ID_SUFFIX_PATTERN, "");
}

export function parsePageRouteParam(slugParam: string) {
  const decoded = decodeURIComponent(slugParam);
  const match = decoded.match(PAGE_ID_SUFFIX_PATTERN);
  if (match) {
    const pageId = match[0].slice(1);
    const pageSlug = decoded.replace(PAGE_ID_SUFFIX_PATTERN, "");
    return { pageId, pageSlug };
  }
  return { pageId: null, pageSlug: decoded };
}

export function buildWorkspacePageHref({
  workspaceKey,
  doc,
  mode = "view",
}: {
  workspaceKey: string;
  doc: PageRouteDocument;
  mode?: "view" | "edit";
}) {
  const slugOrId = buildWorkspacePageSlugParam(doc);
  const href = `${buildWorkspacePagesHref(workspaceKey)}/${encodeURIComponent(slugOrId)}`;
  return mode === "edit" ? `${href}/edit` : href;
}
