import { useState, useEffect } from "react";
import { AVAILABLE_RESOURCES, Permission } from "@/common/types/permissions";

interface UserPermissionsProps {
  userId: string;
  initialPermissions?: Permission[];
  onPermissionsChange: (permissions: Permission[]) => void;
}

export const UserPermissions = ({
  userId,
  initialPermissions = [],
  onPermissionsChange,
}: UserPermissionsProps) => {
  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions);

  useEffect(() => {
    setPermissions(initialPermissions);
  }, [initialPermissions]);

  const handlePermissionChange = (
    resource: string,
    action: string,
    checked: boolean
  ) => {
    let newPermissions = [...permissions];
    const resourcePermission = newPermissions.find(
      (p) => p.resource === resource
    );

    if (checked) {
      if (resourcePermission) {
        if (!resourcePermission.actions.includes(action)) {
          resourcePermission.actions.push(action);
        }
      } else {
        newPermissions.push({
          resource,
          actions: [action],
        });
      }
    } else {
      if (resourcePermission) {
        resourcePermission.actions = resourcePermission.actions.filter(
          (a) => a !== action
        );
        if (resourcePermission.actions.length === 0) {
          newPermissions = newPermissions.filter(
            (p) => p.resource !== resource
          );
        }
      }
    }

    setPermissions(newPermissions);
    onPermissionsChange(newPermissions);
  };

  const hasPermission = (resource: string, action: string): boolean => {
    const resourcePermission = permissions.find((p) => p.resource === resource);
    return resourcePermission
      ? resourcePermission.actions.includes(action)
      : false;
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Phân quyền người dùng</h2>
      {AVAILABLE_RESOURCES.map((resource) => (
        <div key={resource.name} className="mb-4">
          <h3 className="text-lg font-medium mb-2">{resource.displayName}</h3>
          <div className="space-y-2">
            {resource.availableActions.map((action) => (
              <label key={`${resource.name}-${action}`} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={hasPermission(resource.name, action)}
                  onChange={(e) =>
                    handlePermissionChange(
                      resource.name,
                      action,
                      e.target.checked
                    )
                  }
                  className="w-4 h-4"
                />
                <span>{getActionLabel(action)}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    read: "Xem",
    create: "Tạo mới",
    update: "Cập nhật",
    delete: "Xóa",
  };
  return labels[action] || action;
}
