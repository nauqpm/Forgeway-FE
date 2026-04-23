/**
 * 🎨 Hàm xử lý đường dẫn ảnh đại diện cho bài viết.
 * - Nếu là URL tuyệt đối thì dùng luôn.
 * - Nếu là đường dẫn bắt đầu bằng `/uploads` thì thêm domain từ biến môi trường.
 * - Nếu không có thì trả về placeholder.
 */
export const getThumbnailPath = (thumbnail?: string | string[]): string => {
  // Nếu không có ảnh thì dùng ảnh mặc định
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
