/**
 * Function for resolving a post thumbnail path.
 * - Use absolute URLs as-is.
 * - If the path starts with `/uploads`, prepend the domain from environment variables.
 * - Return a placeholder when no image exists.
 */
export const getThumbnailPath = (thumbnail?: string | string[]): string => {
  // Use the default image when no image exists
  if (!thumbnail) return "/placeholder.svg?height=400&width=600";

  const path = Array.isArray(thumbnail) ? thumbnail[0] : thumbnail;

  if (
    typeof path === "string" &&
    (path.startsWith("http://") || path.startsWith("https://"))
  ) {
    return path;
  }

  if (typeof path === "string" && path.startsWith("/uploads")) {
    return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
  }

  return path || "/placeholder.svg?height=400&width=600";
};
