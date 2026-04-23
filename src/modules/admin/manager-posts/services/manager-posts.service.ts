import { Post, PostStatus, UpdateStatusDto, UpdateVisibilityDto } from "../../posts/models/post.model";

const BASE_API = process.env.NEXT_PUBLIC_API_URL;
const POST_API = `${BASE_API}/postapi`;

// 🔧 Xử lý response từ server
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.message || "Lỗi từ máy chủ");
  }
  return response.json();
};

// 🔧 Tạo options fetch chung cho các phương thức
const fetchOptions = (method: string, body?: any) => ({
  method,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
  body: body ? JSON.stringify(body) : undefined,
});

// 📚 Kiểu dữ liệu phân trang
export interface PaginatedPosts {
  data: Post[];
  total: number;
}

export const ManagerPostsService = {
  /**
   * 🔍 Lấy tất cả bài viết có phân trang (bao gồm cả bài ẩn)
   * @param page Trang muốn lấy (bắt đầu từ 1)
   * @param limit Số bản ghi/trang (mặc định 10)
   */
  getAllPosts: async (
    page: number,
    limit: number = 10
  ): Promise<PaginatedPosts> => {
    const url = `${POST_API}?page=${page}&limit=${limit}&includeHidden=true`;
    const res = await fetch(url, fetchOptions("GET"));
    return handleResponse(res);
  },

  /**
   * 🔍 Lấy bài viết theo trạng thái phê duyệt
   * @param status Trạng thái bài viết (draft, pending, approved, rejected)
   * @param page Trang muốn lấy (bắt đầu từ 1)
   * @param limit Số bản ghi/trang (mặc định 10)
   * @param includeHidden Có bao gồm bài viết ẩn hay không
   */
  getPostsByStatus: async (
    status: PostStatus,
    page: number = 1,
    limit: number = 10,
    includeHidden: boolean = true
  ): Promise<PaginatedPosts> => {
    const url = `${POST_API}/by-status/${status}?page=${page}&limit=${limit}&includeHidden=${includeHidden}`;
    const res = await fetch(url, fetchOptions("GET"));
    return handleResponse(res);
  },

  /**
   * 🔍 Tìm kiếm bài viết
   * @param searchTerm Từ khóa tìm kiếm
   * @param page Trang muốn lấy (bắt đầu từ 1)
   * @param limit Số bản ghi/trang (mặc định 10)
   * @param includeHidden Có bao gồm bài viết ẩn hay không
   */
  searchPosts: async (
    searchTerm: string,
    page: number = 1,
    limit: number = 10,
    includeHidden: boolean = true
  ): Promise<PaginatedPosts> => {
    const url = `${POST_API}?search=${encodeURIComponent(searchTerm)}&page=${page}&limit=${limit}&includeHidden=${includeHidden}`;
    const res = await fetch(url, fetchOptions("GET"));
    return handleResponse(res);
  },

  /**
   * 📝 Cập nhật trạng thái phê duyệt của bài viết
   * @param slug Slug của bài viết
   * @param status Trạng thái mới (draft, pending, approved, rejected)
   */
  updatePostStatus: async (slug: string, status: PostStatus): Promise<Post> => {
    const url = `${POST_API}/${slug}/status`;
    const data: UpdateStatusDto = { status };
    const res = await fetch(url, fetchOptions("PATCH", data));
    return handleResponse(res);
  },

  /**
   * 📝 Cập nhật trạng thái hiển thị của bài viết (ẩn/hiện)
   * @param slug Slug của bài viết
   * @param isVisible Trạng thái hiển thị mới (true: hiển thị, false: ẩn)
   */
  updatePostVisibility: async (slug: string, isVisible: boolean): Promise<Post> => {
    const url = `${POST_API}/${slug}/visibility`;
    const data: UpdateVisibilityDto = { isVisible };
    const res = await fetch(url, fetchOptions("PATCH", data));
    return handleResponse(res);
  },

  /**
   * 🔍 Lấy chi tiết bài viết theo slug
   * @param slug Slug của bài viết
   * @param includeHidden Có lấy bài viết ẩn hay không
   */
  getPostBySlug: async (slug: string, includeHidden: boolean = true): Promise<Post> => {
    const url = `${POST_API}/${slug}?includeHidden=${includeHidden}`;
    const res = await fetch(url, fetchOptions("GET"));
    return handleResponse(res);
  },
};

// 👇 Xuất thẳng các hàm cho hook dùng
export const getAllPosts = ManagerPostsService.getAllPosts;
export const getPostsByStatus = ManagerPostsService.getPostsByStatus;
export const searchPosts = ManagerPostsService.searchPosts;
export const updatePostStatus = ManagerPostsService.updatePostStatus;
export const updatePostVisibility = ManagerPostsService.updatePostVisibility;
export const getPostBySlug = ManagerPostsService.getPostBySlug;