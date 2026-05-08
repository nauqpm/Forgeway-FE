import React, { useState, useEffect, useMemo } from "react";
import { useRoles } from "../hooks/useRoles";
import { usePermissions } from "../../permissions/hooks/usePermissions";
import { toast } from "react-hot-toast";
import { Role, CreateRoleDto } from "../services/role.service";

interface Permission {
  id: string;
  resource: string;
  action: string;
}

interface RoleWithPermissions extends Role {
  permissions?: Permission[];
}

interface RoleFormProps {
  initialRole?: RoleWithPermissions;
  onSubmitSuccess?: () => void;
  mode: "create" | "edit";
}

const RoleForm: React.FC<RoleFormProps> = ({
  initialRole,
  onSubmitSuccess,
  mode,
}) => {
  const { createRole, updateRole, loading: roleLoading } = useRoles();
  const {
    loading: permissionLoading,
    error,
    permissions,
    groupedPermissions,
  } = usePermissions();

  const [formData, setFormData] = useState<
    CreateRoleDto & { permissionIds: string[] }
  >({
    name: "",
    description: "",
    permissionIds: [],
  });

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

  useEffect(() => {
    if (initialRole && mode === "edit") {
      setFormData({
        name: initialRole.name,
        description: initialRole.description || "",
        permissionIds: initialRole.permissions?.map((p) => p.id) || [],
      });
    }
  }, [initialRole, mode]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange =
    (permissionId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        setFormData((prev) => ({
          ...prev,
          permissionIds: [...new Set([...prev.permissionIds, permissionId])],
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          permissionIds: prev.permissionIds.filter((id) => id !== permissionId),
        }));
      }
    };

  const handleResourceCheckAll =
    (resource: string, permissions: Permission[]) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const permissionIds = permissions.map((p) => p.id);
      if (e.target.checked) {
        setFormData((prev) => ({
          ...prev,
          permissionIds: [
            ...new Set([...prev.permissionIds, ...permissionIds]),
          ],
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          permissionIds: prev.permissionIds.filter(
            (id) => !permissionIds.includes(id)
          ),
        }));
      }
    };

  const isResourceFullySelected = (permissions: Permission[]): boolean => {
    return permissions.every((p) => formData.permissionIds.includes(p.id));
  };

  const isResourcePartiallySelected = (permissions: Permission[]): boolean => {
    return (
      permissions.some((p) => formData.permissionIds.includes(p.id)) &&
      !permissions.every((p) => formData.permissionIds.includes(p.id))
    );
  };

  const formatResourceName = (resource: string): string => {
    return resource
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("Please enter a role name");
      return;
    }

    try {
      if (mode === "create") {
        await createRole(formData);
        toast.success("Role created successfully");
      } else if (mode === "edit" && initialRole) {
        await updateRole(initialRole.id, formData);
        toast.success("Role updated successfully");
      }

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }

      // Reset form if creating
      if (mode === "create") {
        setFormData({
          name: "",
          description: "",
          permissionIds: [],
        });
      }
    } catch (error) {
      console.error("Error submitting role form:", error);
      toast.error("Failed to save role");
    }
  };

  const loading = roleLoading || permissionLoading;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl shadow-lg max-w-3xl mx-auto">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label
            htmlFor="name"
            className="block text-base font-semibold text-gray-800 mb-1"
          >
            Tên vai trò <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2"
            required
            placeholder="Nhập tên vai trò"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-base font-semibold text-gray-800 mb-1"
          >
            Mô tả
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2"
            placeholder="Nhập mô tả cho vai trò"
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Phân quyền chức năng</h2>
        <div className="space-y-8">
          {Object.entries(grouped).map(([resource, permissions]) => (
            <div key={resource} className="border rounded-xl p-5 bg-gray-50">
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h3 className="text-base font-semibold text-blue-700">
                  {formatResourceName(resource)}
                </h3>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isResourceFullySelected(permissions as Permission[])}
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
                    disabled={loading}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="text-base font-medium text-gray-700">
                    Chọn tất cả
                  </span>
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {(permissions as Permission[]).map((permission) => (
                  <label
                    key={permission.id}
                    className="flex items-center space-x-3 p-2 rounded-lg bg-white hover:bg-blue-50 transition-colors border"
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissionIds.includes(permission.id)}
                      onChange={handlePermissionChange(permission.id)}
                      disabled={loading}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-base text-gray-700 capitalize">
                      {permission.action}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 transition"
        >
          {loading
            ? "Đang xử lý..."
            : mode === "create"
            ? "Tạo vai trò"
            : "Cập nhật vai trò"}
        </button>
      </div>
    </form>
  );
};

export default RoleForm;
