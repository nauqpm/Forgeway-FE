/**
 * Interface mô tả một danh mục bài viết cơ bản dùng trong frontend.
 */
export interface CategoryPost {
    _id: string;
    name: string;
    slug: string;
    level?: number;
    parent?: string | null;
    children?: string[];
    path?: string;
    sortOrder?: number;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
  }
  
  /**
   * Cây danh mục đệ quy dùng khi lấy dữ liệu từ API getOne(slug).
   */
  export interface CategoryPostTree {
    _id: string;
    name: string;
    slug: string;
    level: number;
    parent: string | null;
    children: CategoryPostTree[];
    path: string;
    sortOrder: number;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  /**
   * DTO: Tạo mới danh mục bài viết.
   * Gửi lên từ form tạo mới → backend.
   */
  export interface CreateCategoryPostDto {
    name: string;
    slug?: string;
    level?: number;
    parent?: string;
    children?: string[];
    path?: string;
    sortOrder?: number;
    isDeleted?: boolean;
  }
  
  /**
   * DTO: Cập nhật danh mục bài viết.
   * Kế thừa từ CreateCategoryPostDto với tất cả field đều optional.
   */
  export type UpdateCategoryPostDto = Partial<CreateCategoryPostDto>;
  