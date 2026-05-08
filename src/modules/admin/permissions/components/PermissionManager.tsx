import React, { useState, useEffect, useMemo } from "react";
import { usePermissions } from "../hooks/usePermissions";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { PermissionService, Permission } from "../services/permission.service";
import UserRoleForm from "../../manager-permissions/components/UserRoleForm";

interface PermissionManagerProps {
  userId: string;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  userId,
}) => {
  const {
    loading,
    error,
    permissions,
    groupedPermissions,
    userPermissions,
    updateUserPermissions,
    fetchUserPermissions,
  } = usePermissions(userId);

  const { user } = useAuth();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAssigningAll, setIsAssigningAll] = useState(false);

  // Handle role assignment success
  const handleRoleAssignSuccess = () => {
    // Refresh permissions after role change
    fetchUserPermissions(userId);
  };

  // Memoize the grouped permissions to prevent unnecessary recalculations
  const grouped = useMemo(() => {
    if (!permissions.length) return {};
    // Create a map to deduplicate permissions
    const permissionMap = new Map<string, Permission[]>();
    const groupedPerms = groupedPermissions();

    // Deduplicate permissions within each resource group
    Object.entries(groupedPerms).forEach(([resource, perms]) => {
      const uniquePerms = (perms as Permission[]).reduce((acc, curr) => {
        const key = `${curr.resource}-${curr.action}`;
        if (!acc.has(key)) {
          acc.set(key, curr);
        }
        return acc;
      }, new Map<string, Permission>());
      permissionMap.set(resource, Array.from(uniquePerms.values()));
    });

    return Object.fromEntries(permissionMap);
  }, [permissions, groupedPermissions]);

  // Update selected permissions when userPermissions changes
  useEffect(() => {
    if (userPermissions.length > 0) {
      // Defensive: support both { permissionId: { id } } and { id }
      const permissionIds = userPermissions
        .map((up) => {
          if (up && typeof up === "object") {
            if (
              "permissionId" in up &&
              up.permissionId &&
              typeof up.permissionId === "object" &&
              "id" in up.permissionId
            ) {
              return up.permissionId.id;
            }
            if ("id" in up) {
              return up.id;
            }
          }
          return undefined;
        })
        .filter((id): id is string => typeof id === "string" && !!id);
      setSelectedPermissions([...new Set(permissionIds)]);
    } else {
      setSelectedPermissions([]);
    }
  }, [userPermissions]);

  const handlePermissionChange =
    (permissionId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        setSelectedPermissions((prev) => [...new Set([...prev, permissionId])]);
      } else {
        setSelectedPermissions((prev) =>
          prev.filter((id) => id !== permissionId)
        );
      }
    };

  const handleResourceCheckAll =
    (resource: string, permissions: Permission[]) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const permissionIds = permissions.map((p) => p.id);
      if (e.target.checked) {
        setSelectedPermissions((prev) => [
          ...new Set([...prev, ...permissionIds]),
        ]);
      } else {
        setSelectedPermissions((prev) =>
          prev.filter((id) => !permissionIds.includes(id))
        );
      }
    };

  const isResourceFullySelected = (permissions: Permission[]): boolean => {
    return permissions.every((p) => selectedPermissions.includes(p.id));
  };

  const isResourcePartiallySelected = (permissions: Permission[]): boolean => {
    return (
      permissions.some((p) => selectedPermissions.includes(p.id)) &&
      !permissions.every((p) => selectedPermissions.includes(p.id))
    );
  };

  const formatResourceName = (resource: string): string => {
    return resource
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error("Please select a user first");
      return;
    }
    try {
      setIsSaving(true);
      const success = await updateUserPermissions(userId, [
        ...new Set(selectedPermissions),
      ]);
      if (success) {
        toast.success("Permissions updated successfully");
      }
    } catch (err) {
      toast.error("Failed to update permissions");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignAllPermissions = async () => {
    if (!userId) {
      toast.error("Vui lòng chọn người dùng trước");
      return;
    }
    try {
      setIsAssigningAll(true);
      const permissionService = PermissionService.getInstance();
      await permissionService.assignAllPermissionsToUser(userId);
      await fetchUserPermissions(userId);
      toast.success("Tất cả quyền hạn đã được gán thành công");
    } catch (err) {
      console.error("Error assigning all permissions:", err);
      toast.error("Gán quyền hạn thất bại");
    } finally {
      setIsAssigningAll(false);
    }
  };

  const isAdmin = user?.role === "admin";

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          Vui lòng chọn người dùng để quản lý quyền hạn
        </div>
      </div>
    );
  }

  if (!permissions?.length && !loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          Không có quyền hạn nào
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Management Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <UserRoleForm
          userId={userId}
          onAssignSuccess={handleRoleAssignSuccess}
        />
      </div>

      {/* Permissions Management Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Quản lý quyền hạn người dùng</h2>
          <div className="flex space-x-2">
            {isAdmin && (
              <button
                onClick={handleAssignAllPermissions}
                disabled={isAssigningAll || loading}
                className={`${
                  isAssigningAll || loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-purple-500 hover:bg-purple-600"
                } text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-colors`}
              >
                {isAssigningAll ? "Đang gán..." : "Gán tất cả"}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || loading}
              className={`${
                isSaving || loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors`}
            >
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(grouped).map(([resource, permissions]) => (
            <div key={resource} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  {formatResourceName(resource)}
                </h3>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isResourceFullySelected(
                      permissions as Permission[]
                    )}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = isResourcePartiallySelected(
                          permissions as Permission[]
                        );
                      }
                    }}
                    onChange={handleResourceCheckAll(
                      resource,
                      permissions as Permission[]
                    )}
                    disabled={loading || isSaving}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Chọn tất cả
                  </span>
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(permissions as Permission[]).map((permission) => (
                  <label
                    key={permission.id}
                    className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={handlePermissionChange(permission.id)}
                      disabled={loading || isSaving}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {permission.action}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
