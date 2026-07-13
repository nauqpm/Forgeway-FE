export const DOCUMENTS_LIBRARY_HREF = "/documents";

export function buildDocumentHref(documentId: string, mode: "view" | "edit" = "view") {
  const href = `${DOCUMENTS_LIBRARY_HREF}/${encodeURIComponent(documentId)}`;
  return mode === "edit" ? `${href}/edit` : href;
}
