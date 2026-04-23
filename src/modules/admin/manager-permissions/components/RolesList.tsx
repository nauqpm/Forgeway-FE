import React, { useState, useEffect } from "react";
import { useRoles } from "../hooks/useRoles";
import { Role, RoleWithPermissions } from "../services/role.service";
import { toast } from "react-hot-toast";

interface RolesListProps {
  onSelectRole?: (role: Role) => void;
}

const RolesList: React.FC<RolesListProps> = ({ onSelectRole }) => {
  const {
    rolesWithPermissions,
    loading,
    error,
    fetchRolesWithPermissions,
    deleteRole,
  } = useRoles();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchRolesWithPermissions();
  }, [fetchRolesWithPermissions]);

  const handleDeleteClick = (roleId: string) => {
    setShowDeleteConfirm(roleId);
  };

  const handleConfirmDelete = async (roleId: string) => {
    try {
      const success = await deleteRole(roleId);
      if (success) {
        toast.success("Role deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const renderPermissionsBadge = (role: RoleWithPermissions) => {
    if (!role.permissions.length)
      return <span className="text-gray-400">No permissions</span>;

    const resourceGroups = role.permissions.reduce((acc, permission) => {
      const { resource } = permission;
      if (!acc[resource]) {
        acc[resource] = 0;
      }
      acc[resource]++;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(resourceGroups).map(([resource, count]) => (
          <span
            key={resource}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          >
            {resource}: {count}
          </span>
        ))}
      </div>
    );
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Danh sách vai trò</h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-2"></div>
          <span className="text-base text-gray-600">Đang tải...</span>
        </div>
      ) : rolesWithPermissions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-lg">Không có vai trò nào</div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {rolesWithPermissions.map((role) => (
            <div
              key={role.id}
              className="border rounded-xl shadow-md p-6 bg-white hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-blue-700">{role.name}</h3>
                  {role.description && (
                    <p className="mt-1 text-sm text-gray-500">{role.description}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onSelectRole && onSelectRole(role)}
                    className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteClick(role.id)}
                    className="px-3 py-1 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600 transition"
                  >
                    Xóa
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">
                  Quyền hạn
                </h4>
                {renderPermissionsBadge(role)}
              </div>

              {showDeleteConfirm === role.id && (
                <div className="mt-4 p-4 border rounded-lg bg-red-50">
                  <p className="text-sm text-red-800 font-medium">
                    Bạn có chắc chắn muốn xóa vai trò này không?
                  </p>
                  <div className="mt-3 flex justify-end space-x-2">
                    <button
                      onClick={handleCancelDelete}
                      className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => handleConfirmDelete(role.id)}
                      className="px-3 py-1 text-xs font-medium text-white bg-red-600 border border-transparent rounded hover:bg-red-700"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RolesList;
