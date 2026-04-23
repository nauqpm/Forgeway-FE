// src/models/categories-post.model.ts

/**
 * 🔹 Giao diện đơn giản cho một danh mục (flat list)
 */
export interface CategoryPost {
  _id: string;
  name: string;
  slug: string;
  parent?: string | null;
  level?: number;
  children?: string[]; // mảng _id các con (nếu API trả về)
}

/**
 * 🌳 Giao diện đệ quy cho cây danh mục
 */
export interface CategoryPostTree {
  _id: string;
  name: string;
  slug: string;
  parent: string | null;
  level: number;
  children: CategoryPostTree[];
}
