// ✅ Interface cho danh mục bài viết
export interface Category {
  _id: string;
  name: string;
  slug: string; // slug danh mục bài viết
  parent: string | null; // danh mục cha
  level: number;
}

// ✅ Interface cho thông tin danh mục trong bài viết
export interface CategoryInfo {
  main: string[];
  sub: string[];
}

// ✅ Enum cho trạng thái phê duyệt bài viết
export enum PostStatus {
  Draft = 'draft',
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export interface Post {
  id: string;
  slug: string; // slug bài viết
  name: string;
  excerpt: string;
  postData: string;
  author: string;
  thumbnail: string[];
  publishedDate: string;
  category?: CategoryInfo;
  status: PostStatus; // trạng thái phê duyệt
  isVisible: boolean; // trạng thái hiển thị
  approvedBy?: string; // người phê duyệt
  approvedDate?: string; // ngày phê duyệt
}

// ✅ Định nghĩa DTO tạo bài viết
export interface CreatePostDto {
  id: string;
  name: string;
  excerpt: string;
  postData: string;
  author: string;
  thumbnail: string[];
  publishedDate: string;
  category?: CategoryInfo;
  slug: string;
  status?: PostStatus;
  isVisible?: boolean;
}

// ✅ Định nghĩa DTO cập nhật bài viết
export interface UpdatePostDto extends CreatePostDto {
  id: string;
}

// ✅ Định nghĩa DTO cập nhật trạng thái phê duyệt
export interface UpdateStatusDto {
  status: PostStatus;
}

// ✅ Định nghĩa DTO cập nhật trạng thái hiển thị
export interface UpdateVisibilityDto {
  isVisible: boolean;
}
