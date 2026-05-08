import { useQuery } from "@tanstack/react-query";
import { getPostBySlug, getPosts } from "../services/post.service";
import type { PaginatedPosts } from "../models/post.model";

/** ✨ Hook lấy chi tiết 1 bài viết theo slug (chỉ lấy bài đã duyệt và hiển thị) */
export const usePostBySlug = (slug: string) =>
  useQuery({
    queryKey: ["post", slug],
    queryFn: () => getPostBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, error) => {
      // Nếu lỗi là do bài viết không được duyệt hoặc không hiển thị, không retry
      if (
        error instanceof Error &&
        error.message.includes("không tồn tại hoặc chưa được phê duyệt")
      ) {
        return false;
      }
      // Các lỗi khác thì retry tối đa 3 lần
      return failureCount < 3;
    },
  });

/**
 * 📦 Hook lấy danh sách bài viết có phân trang (chỉ lấy bài đã duyệt và hiển thị)
 * @param page Số trang
 * @param limit Số bài mỗi trang
 */
export const usePaginatedPosts = (page: number = 1, limit: number = 10) =>
  useQuery<PaginatedPosts, Error>({
    queryKey: ["posts", page, limit],
    queryFn: () => getPosts(page, limit),
    staleTime: 1000 * 60 * 5, // Có thể bỏ luôn nếu muốn mỗi lần gọi là fetch mới
  });

/**
 * 📦 Hook lấy tất cả bài viết đã duyệt và hiển thị
 */
export const useAllPosts = (page: number = 1, limit: number = 12) => {
  const { data, isLoading, error } = usePaginatedPosts(page, limit);

  return {
    data: data?.data || [],
    total: data?.total || 0,
    isLoading,
    error,
  };
};
