import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  getPosts,
  searchPosts,
  getPostBySlug,
  createPost,
  updatePost,
  softDeletePost,
  hardDeletePost,
  PostService,
  getMyPosts,
  getPostsByStatus,
  updatePostVisibility,
  updatePostStatus,
} from "../services/post.service";
import { useImages } from "@/common/hooks/useImages";

import { Post, UpdatePostDto, CreatePostDto, PostStatus } from "../models/post.model";

/**
 * 🎯 Hook quản lý tất cả thao tác liên quan đến bài viết:
 * - Lấy danh sách bài viết
 * - Tạo mới
 * - Cập nhật
 * - Xóa mềm / Xóa vĩnh viễn
 * - Upload ảnh bài viết
 * - Lấy danh mục bài viết
 * - Cập nhật trạng thái phê duyệt
 * - Cập nhật trạng thái hiển thị
 */

// ✅ Xác định kiểu dữ liệu trả về
type GetPostsResponse = {
  data: Post[];
  total: number;
};

export const usePosts = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [includeHidden, setIncludeHidden] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PostStatus | null>(null);
  const limit = 10;
  const { uploadImage: uploadImageHook, error: uploadError } = useImages();

  // Query lấy danh sách hoặc tìm kiếm hoặc lọc theo trạng thái
  const postsQuery = useQuery({
    queryKey: ["posts", page, limit, searchTerm, includeHidden, statusFilter],
    queryFn: () => {
      if (statusFilter) {
        return getPostsByStatus(statusFilter, page, limit, includeHidden);
      }
      if (searchTerm) {
        return searchPosts(searchTerm, page, limit, includeHidden);
      }
      return getPosts(page, limit, includeHidden);
    },
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
  } as UseQueryOptions<GetPostsResponse, Error, GetPostsResponse, [string, number, number, string, boolean, PostStatus | null]>);

  // ✅ Upload ảnh bài viết với xử lý lỗi tốt hơn
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const result = await uploadImageHook(file);
      if (!result) {
        throw new Error(uploadError || "Không thể upload ảnh");
      }
      return { url: result.imageUrl };
    },
    onError: (error: Error) => {
      console.error("Lỗi upload ảnh:", error);
      throw error;
    }
  });

  // ✅ Tạo bài viết mới
  const createMutation = useMutation({
    mutationFn: (data: CreatePostDto) => createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // ✅ Cập nhật bài viết
  const updateMutation = useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdatePostDto }) =>
      updatePost(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // ✅ Xóa mềm
  const softDeleteMutation = useMutation({
    mutationFn: (slug: string) => softDeletePost(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // ✅ Xóa vĩnh viễn
  const hardDeleteMutation = useMutation({
    mutationFn: (slug: string) => hardDeletePost(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // ✅ Cập nhật trạng thái hiển thị
  const updateVisibilityMutation = useMutation({
    mutationFn: ({ slug, isVisible }: { slug: string; isVisible: boolean }) =>
      updatePostVisibility(slug, isVisible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // ✅ Cập nhật trạng thái phê duyệt
  const updateStatusMutation = useMutation({
    mutationFn: ({ slug, status }: { slug: string; status: PostStatus }) =>
      updatePostStatus(slug, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // ✅ Lấy danh mục bài viết
  const categoriesQuery = useQuery({
    queryKey: ["category-posts"],
    queryFn: PostService.getAllCategories,
  });

  return {
    postsQuery,
    createMutation,
    updateMutation,
    softDeleteMutation,
    hardDeleteMutation,
    uploadImageMutation,
    updateVisibilityMutation,
    updateStatusMutation,
    categoriesQuery,
    page,
    setPage,
    limit,
    searchTerm,
    setSearchTerm,
    includeHidden,
    setIncludeHidden,
    statusFilter,
    setStatusFilter,
  };
};

/**
 * 👤 Hook lấy danh sách bài viết của user đang đăng nhập
 */
export const useMyPosts = (userId: string) => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const myPostsQuery = useQuery({
    queryKey: ["my-posts", page, limit],
    queryFn: () => getMyPosts(page, limit, userId),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // Cache trong 5 phút
  } as UseQueryOptions<GetPostsResponse, Error, GetPostsResponse, [string, number, number]>);

  return {
    myPostsQuery,
    page,
    setPage,
    limit,
  };
};

/**
 * 🔍 Hook lấy chi tiết bài viết theo slug.
 */
export const usePostBySlug = (slug: string, includeHidden = false) =>
  useQuery<Post>({
    queryKey: ["post", slug, includeHidden],
    queryFn: () => getPostBySlug(slug, includeHidden),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });

/**
 * 📊 Hook lấy danh sách bài viết theo trạng thái phê duyệt
 */
export const usePostsByStatus = (status: PostStatus, includeHidden = false) => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const postsByStatusQuery = useQuery({
    queryKey: ["posts-by-status", status, page, limit, includeHidden],
    queryFn: () => getPostsByStatus(status, page, limit, includeHidden),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
  } as UseQueryOptions<GetPostsResponse, Error, GetPostsResponse, [string, PostStatus, number, number, boolean]>);

  return {
    postsByStatusQuery,
    page,
    setPage,
    limit,
  };
};
