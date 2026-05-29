export const isGlobalAdminRole = (role?: string | null): boolean =>
  role === "super_admin" || role === "admin";
