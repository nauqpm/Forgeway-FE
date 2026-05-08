import React, { useState, useRef, useEffect } from "react";
import { usePermissions } from "../hooks/usePermissions";
import UserRoleForm from "../../manager-permissions/components/UserRoleForm";

interface PermissionsWithRolesProps {
  userId: string;
}

const PermissionsWithRoles: React.FC<PermissionsWithRolesProps> = ({
  userId,
}) => {
  const {
    permissions,
    userPermissions,
    loading,
    updateUserPermissions,
    groupedPermissions,
  } = usePermissions(userId);

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"permissions" | "roles">(
    "permissions"
  );
  const checkboxRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // When component mounts or userPermissions changes, update selectedPermissions
  useEffect(() => {
    if (userPermissions.length > 0) {
      const permissionIds = userPermissions.map((up) => up.permissionId.id);
      setSelectedPermissions(permissionIds);
    } else {
      setSelectedPermissions([]);
    }
  }, [userPermissions]);

  // Set indeterminate state for checkboxes
  useEffect(() => {
    Object.entries(groupedPermissions()).forEach(([resource, perms]) => {
      const checkboxRef = checkboxRefs.current[resource];
      if (checkboxRef) {
        const allSelected = perms.every((p) =>
          selectedPermissions.includes(p.id)
        );
        const someSelected = perms.some((p) =>
          selectedPermissions.includes(p.id)
        );
        checkboxRef.indeterminate = !allSelected && someSelected;
      }
    });
  }, [selectedPermissions, groupedPermissions]);

  const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedPermissions((prev) => [...prev, value]);
    } else {
      setSelectedPermissions((prev) => prev.filter((id) => id !== value));
    }
  };

  const handleSavePermissions = async () => {
    if (!userId) return;

    const success = await updateUserPermissions(userId, selectedPermissions);
    if (success) {
      // Success message is already handled in the hook
    }
  };

  const handleSelectAll = (resource: string, selected: boolean) => {
    const permissionsForResource = groupedPermissions()[resource] || [];
    const permissionIds = permissionsForResource.map((p) => p.id);

    if (selected) {
      // Add all permissions for this resource
      setSelectedPermissions((prev) => {
        const newPermissions = [...prev];
        permissionIds.forEach((id) => {
          if (!newPermissions.includes(id)) {
            newPermissions.push(id);
          }
        });
        return newPermissions;
      });
    } else {
      // Remove all permissions for this resource
      setSelectedPermissions((prev) =>
        prev.filter((id) => !permissionIds.includes(id))
      );
    }
  };

  const setCheckboxRef =
    (resource: string) => (el: HTMLInputElement | null) => {
      checkboxRefs.current[resource] = el;
    };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="border-b">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab("permissions")}
            className={`${
              activeTab === "permissions"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
          >
            Quyền hạn trực tiếp
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`${
              activeTab === "roles"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
          >
            Gán vai trò
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === "permissions" ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Quyền hạn người dùng
              </h2>
              <button
                onClick={handleSavePermissions}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {loading ? "Đang lưu..." : "Lưu quyền hạn"}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-4">Đang tải quyền hạn...</div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedPermissions()).map(
                  ([resource, perms]) => {
                    const allSelected = perms.every((p) =>
                      selectedPermissions.includes(p.id)
                    );

                    return (
                      <div key={resource} className="border rounded-md p-4">
                        <div className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            id={`resource-${resource}`}
                            checked={allSelected}
                            onChange={(e) =>
                              handleSelectAll(resource, e.target.checked)
                            }
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            ref={setCheckboxRef(resource)}
                          />
                          <label
                            htmlFor={`resource-${resource}`}
                            className="ml-2 text-lg font-medium text-gray-900"
                          >
                            {resource}
                          </label>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2 pl-6">
                          {perms.map((permission) => (
                            <div
                              key={permission.id}
                              className="flex items-center"
                            >
                              <input
                                type="checkbox"
                                id={`permission-${permission.id}`}
                                value={permission.id}
                                checked={selectedPermissions.includes(
                                  permission.id
                                )}
                                onChange={handlePermissionChange}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`permission-${permission.id}`}
                                className="ml-2 block text-sm text-gray-900"
                              >
                                {permission.action}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        ) : (
          <UserRoleForm userId={userId} />
        )}
      </div>
    </div>
  );
};

export default PermissionsWithRoles;
