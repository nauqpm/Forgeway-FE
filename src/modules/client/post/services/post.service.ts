import { Post, PostStatus } from "../models/post.model";

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

// 🛡️ Sinh header tại runtime, client-only
function getAuthHeaders(): Record<string, string> {
  // Nếu chạy trên server, chỉ trả Content-Type
  if (typeof window === "undefined") {
    return {
      "Content-Type": "application/json",
    };
  }
  // Trình duyệt rồi, thoải mái lấy token
  const token = localStorage.getItem("token") || "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// 📚 Kiểu dữ liệu phân trang
export interface PaginatedPosts {
  data: Post[];
  total: number;
}

export const PostService = {
  /**
   * 🔍 Lấy bài viết có phân trang (chỉ lấy bài đã duyệt và hiển thị)
   */
  getPosts: async (
    page: number,
    limit: number = 10
  ): Promise<PaginatedPosts> => {
    // Chỉ lấy bài viết đã duyệt và đang hiển thị (includeHidden=false)
    const url = `${POST_API}?page=${page}&limit=${limit}&includeHidden=false`;
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    const result = await handleResponse(res);

    // Lọc thêm lần nữa để đảm bảo chỉ hiển thị bài đã duyệt
    const filteredData = result.data.filter(
      (post: Post) => post.status === PostStatus.Approved && post.isVisible === true
    );

    return {
      data: filteredData as Post[],
      total: filteredData.length, // Cập nhật lại tổng số sau khi lọc
    };
  },

  /**
   * 🔍 Lấy bài viết theo slug (chỉ lấy bài đã duyệt và hiển thị)
   */
  getPostBySlug: async (slug: string): Promise<Post> => {
    // includeHidden=false để chỉ lấy bài đang hiển thị
    const url = `${POST_API}/${slug}?includeHidden=false`;
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(res);

    // Kiểm tra nếu bài viết không được duyệt hoặc không hiển thị
    if (data.status !== PostStatus.Approved || data.isVisible !== true) {
      throw new Error("Bài viết không tồn tại hoặc chưa được phê duyệt");
    }

    return data as Post;
  },
};

// 👇 Xuất thẳng cho hook dùng
export const getPosts = PostService.getPosts;
export const getPostBySlug = PostService.getPostBySlug;
