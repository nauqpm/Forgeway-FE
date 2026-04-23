import { CategoryPost } from "../models/categories-post.model";

const BASE_API = process.env.NEXT_PUBLIC_API_URL!;
const CATEGORY_POST_API = `${BASE_API}/categories-postapi`;

// 🔧 Xử lý response từ server
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Lỗi từ máy chủ");
  }
  return response.json();
};

// 🔧 Options chung cho GET
const fetchOptionsGet: RequestInit = {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
};

// 📚 Kiểu dữ liệu phân trang cho categories
export interface PaginatedCategories {
  data: CategoryPost[];
  total: number;
}

export const CategoryPostService = {
  /**
   * 🔍 Lấy danh sách categories có phân trang
   * @param page Trang muốn lấy (bắt đầu từ 1)
   * @param limit Số bản ghi/trang (mặc định 10)
   * @returns { data, total }
   */
  getCategories: async (
    page: number,
    limit: number = 10
  ): Promise<PaginatedCategories> => {
    const url = `${CATEGORY_POST_API}?page=${page}&limit=${limit}`;
    const res = await fetch(url, fetchOptionsGet);
    const result = await handleResponse<{
      data: CategoryPost[];
      total: number;
    }>(res);
    return {
      data: result.data,
      total: result.total,
    };
  },

  /**
   * ✨ Lấy tất cả categories bằng cách lặp phân trang
   * @returns Mảng đầy đủ CategoryPost
   */
  getAllCategories: async (): Promise<CategoryPost[]> => {
    const all: CategoryPost[] = [];
    let page = 1;
    const limit = 10;

    while (true) {
      const { data } = await CategoryPostService.getCategories(page, limit);
      all.push(...data);
      if (data.length < limit) break; // hết trang
      page++;
    }

    return all;
  },
};

// 👇 Xuất thẳng cho hook dùng
export const getCategories = CategoryPostService.getCategories;
export const getAllCategories = CategoryPostService.getAllCategories;
