// =============================================================================
// PERMISSION SERVICE - RBAC API calls
// =============================================================================

import api from "@/lib/axiosIns";
import type { Permission } from "../../shared/types/auth.types";

export const getMyPermissionsAPI = async (): Promise<{
  permissions: Permission[];
}> => {
  const response = await api.get<{ permissions: Permission[] }>("/auth/my-permissions", { withCredentials: true });
  return response.data;
};
