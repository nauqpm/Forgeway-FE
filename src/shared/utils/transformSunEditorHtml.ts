// lib/utils.ts
export function transformSunEditorHtml(
  html: string,
  apiUrl: string = process.env.NEXT_PUBLIC_API_URL || ""
): string {
  if (!html) return "";
  return html.replace(/src="\/(uploads\/[^"]+)"/g, `src="${apiUrl}/$1"`);
}
