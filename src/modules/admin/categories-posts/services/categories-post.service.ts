import {
    CategoryPost,
    CategoryPostTree,
    CreateCategoryPostDto,
    UpdateCategoryPostDto,
} from "../models/categories-post.model";

const BASE_API = process.env.NEXT_PUBLIC_API_URL!;
const CATEGORY_POST_API = `${BASE_API}/categories-postapi`;

const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Lỗi từ máy chủ");
    }
    return response.json();
};

const fetchOptions = (method: string, data?: unknown): RequestInit => ({
    method,
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: data ? JSON.stringify(data) : undefined,
});

export const CategoryPostService = {
    create: async (dto: CreateCategoryPostDto): Promise<{ message: string; data: CategoryPost }> => {
        const res = await fetch(CATEGORY_POST_API, fetchOptions("POST", dto));
        return handleResponse(res);
    },

    update: async (slug: string, dto: UpdateCategoryPostDto): Promise<{ message: string; data: CategoryPost }> => {
        const res = await fetch(`${CATEGORY_POST_API}/${slug}`, fetchOptions("PATCH", dto));
        return handleResponse(res);
    },

    getOne: async (slug: string): Promise<{ message: string; data: CategoryPostTree }> => {
        const res = await fetch(`${CATEGORY_POST_API}/${slug}`);
        return handleResponse(res);
    },

    findAll: async (page = 1, limit = 10): Promise<{ message: string; data: CategoryPost[] }> => {
        const res = await fetch(`${CATEGORY_POST_API}?page=${page}&limit=${limit}`);
        return handleResponse(res);
    },

    softDelete: async (slug: string): Promise<{ message: string }> => {
        const res = await fetch(`${CATEGORY_POST_API}/${slug}/soft-delete`, fetchOptions("PATCH"));
        return handleResponse(res);
    },

    hardDelete: async (slug: string): Promise<{ message: string }> => {
        const res = await fetch(`${CATEGORY_POST_API}/${slug}`, fetchOptions("DELETE"));
        return handleResponse(res);
    },
};

export default CategoryPostService;
