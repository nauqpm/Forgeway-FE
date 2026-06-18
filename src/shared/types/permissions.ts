export type Permission = {
  resource: string;  // Resource name (e.g., 'posts', 'users', 'categories')
  actions: string[]; // Allowed actions (e.g., ['read', 'create', 'update', 'delete'])
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

// Define the resources available in the system
export const AVAILABLE_RESOURCES: Resource[] = [
  {
    name: 'posts',
    displayName: 'Posts',
    availableActions: ['read', 'create', 'update', 'delete']
  },
  {
    name: 'users',
    displayName: 'Users',
    availableActions: ['read', 'create', 'update', 'delete']
  },
  {
    name: 'categories',
    displayName: 'Categories',
    availableActions: ['read', 'create', 'update', 'delete']
  },
  {
    name: 'statistical',
    displayName: 'Statistics',
    availableActions: ['read']
  }
];