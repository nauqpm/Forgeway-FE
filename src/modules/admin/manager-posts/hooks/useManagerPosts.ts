import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllPosts,
  getPostsByStatus,
  searchPosts,
  updatePostStatus,
  updatePostVisibility,
  getPostBySlug
} from "../services/manager-posts.service";
import { Post, PostStatus } from "../../posts/models/post.model";

/**
 * Hook để lấy danh sách tất cả bài viết có phân trang (bao gồm cả bài ẩn)
 * @param page Trang hiện tại
 * @param limit Số lượng bài viết mỗi trang
 */
export const useAllPosts = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ["manager-posts", "all", page, limit],
    queryFn: () => getAllPosts(page, limit),
  });
};

/**
 * Hook để lấy danh sách bài viết theo trạng thái phê duyệt
 * @param status Trạng thái bài viết (draft, pending, approved, rejected)
 * @param page Trang hiện tại
 * @param limit Số lượng bài viết mỗi trang
 * @param includeHidden Có bao gồm bài viết ẩn hay không
 */
export const usePostsByStatus = (
  status: PostStatus,
  page: number = 1,
  limit: number = 10,
  includeHidden: boolean = true
) => {
  return useQuery({
    queryKey: ["manager-posts", "by-status", status, page, limit, includeHidden],
    queryFn: () => getPostsByStatus(status, page, limit, includeHidden),
  });
};

/**
 * Hook để tìm kiếm bài viết
 * @param searchTerm Từ khóa tìm kiếm
 * @param page Trang hiện tại
 * @param limit Số lượng bài viết mỗi trang
 * @param includeHidden Có bao gồm bài viết ẩn hay không
 */
export const useSearchPosts = (
  searchTerm: string,
  page: number = 1,
  limit: number = 10,
  includeHidden: boolean = true
) => {
  return useQuery({
    queryKey: ["manager-posts", "search", searchTerm, page, limit, includeHidden],
    queryFn: () => searchPosts(searchTerm, page, limit, includeHidden),
    enabled: searchTerm.trim().length > 0,
  });
};

/**
 * Hook để lấy chi tiết bài viết theo slug
 * @param slug Slug của bài viết
 * @param includeHidden Có lấy bài viết ẩn hay không
 */
export const usePostBySlug = (slug: string, includeHidden: boolean = true) => {
  return useQuery({
    queryKey: ["manager-posts", "detail", slug, includeHidden],
    queryFn: () => getPostBySlug(slug, includeHidden),
    enabled: !!slug,
  });
};

/**
 * Hook để cập nhật trạng thái phê duyệt của bài viết
 */
export const useUpdatePostStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, status }: { slug: string; status: PostStatus }) =>
      updatePostStatus(slug, status),
    onSuccess: (updatedPost: Post) => {
      // Cập nhật cache cho chi tiết bài viết
      queryClient.setQueryData(
        ["manager-posts", "detail", updatedPost.slug, true],
        updatedPost
      );

      // Làm mới tất cả các query liên quan đến danh sách bài viết
      queryClient.invalidateQueries({ queryKey: ["manager-posts", "all"] });
      queryClient.invalidateQueries({ queryKey: ["manager-posts", "by-status"] });
      queryClient.invalidateQueries({ queryKey: ["manager-posts", "search"] });
    },
  });
};

/**
 * Hook để cập nhật trạng thái hiển thị của bài viết (ẩn/hiện)
 */
export const useUpdatePostVisibility = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, isVisible }: { slug: string; isVisible: boolean }) =>
      updatePostVisibility(slug, isVisible),
    onSuccess: (updatedPost: Post) => {
      // Cập nhật cache cho chi tiết bài viết
      queryClient.setQueryData(
        ["manager-posts", "detail", updatedPost.slug, true],
        updatedPost
      );

      // Làm mới tất cả các query liên quan đến danh sách bài viết
      queryClient.invalidateQueries({ queryKey: ["manager-posts", "all"] });
      queryClient.invalidateQueries({ queryKey: ["manager-posts", "by-status"] });
      queryClient.invalidateQueries({ queryKey: ["manager-posts", "search"] });
    },
  });
};

/**
 * Hook tổng hợp cho quản lý bài viết
 * Cung cấp tất cả các chức năng cần thiết để quản lý trạng thái bài viết
 */
export const useManagerPosts = () => {
  const updateStatusMutation = useUpdatePostStatus();
  const updateVisibilityMutation = useUpdatePostVisibility();

  return {
    updateStatus: updateStatusMutation.mutate,
    updateVisibility: updateVisibilityMutation.mutate,
    isUpdatingStatus: updateStatusMutation.isPending,
    isUpdatingVisibility: updateVisibilityMutation.isPending,
    statusError: updateStatusMutation.error,
    visibilityError: updateVisibilityMutation.error,
  };
};