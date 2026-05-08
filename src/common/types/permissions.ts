export type Permission = {
  resource: string;  // Tên resource (e.g., 'posts', 'users', 'categories')
  actions: string[]; // Các hành động được phép (e.g., ['read', 'create', 'update', 'delete'])
};

export type UserPermissions = {
  userId: string;
  permissions: Permission[];
};

export type Resource = {
  name: string;
  displayName: string;
  availableActions: string[];
};

// Định nghĩa các resource có trong hệ thống
export const AVAILABLE_RESOURCES: Resource[] = [
  {
    name: 'posts',
    displayName: 'Bài viết',
    availableActions: ['read', 'create', 'update', 'delete']
  },
  {
    name: 'users',
    displayName: 'Người dùng',
    availableActions: ['read', 'create', 'update', 'delete']
  },
  {
    name: 'categories',
    displayName: 'Danh mục',
    availableActions: ['read', 'create', 'update', 'delete']
  },
  {
    name: 'statistical',
    displayName: 'Thống kê',
    availableActions: ['read']
  }
];