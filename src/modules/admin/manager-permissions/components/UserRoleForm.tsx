import React, { useState, useEffect } from "react";
import { useRoles } from "../hooks/useRoles";
import { useUserRoles } from "../hooks/useUserRoles";

interface UserRoleFormProps {
  userId: string;
  onAssignSuccess?: () => void;
}

const UserRoleForm: React.FC<UserRoleFormProps> = ({
  userId,
  onAssignSuccess,
}) => {
  const { roles, loading: rolesLoading, fetchRoles } = useRoles();
  const {
    userRole,
    loading: userRoleLoading,
    getUserRole,
    assignRoleToUser,
    removeRoleFromUser,
  } = useUserRoles();

  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (userId) {
      getUserRole(userId);
    }
  }, [userId, getUserRole]);

  const handleAssignRole = async () => {
    if (!userId || !selectedRoleId) return;

    setAssignLoading(true);
    try {
      await assignRoleToUser({ userId, roleId: selectedRoleId });
      await getUserRole(userId);
      if (onAssignSuccess) {
        onAssignSuccess();
      }
    } catch (error) {
      console.error("Error assigning role:", error);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveRole = async () => {
    if (!userId) return;

    setRemoveLoading(true);
    try {
      await removeRoleFromUser(userId);
      await getUserRole(userId);
      if (onAssignSuccess) {
        onAssignSuccess();
      }
    } catch (error) {
      console.error("Error removing role:", error);
    } finally {
      setRemoveLoading(false);
    }
  };

  const loading = rolesLoading || userRoleLoading;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          Quản lý vai trò người dùng
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Gán vai trò tùy chỉnh cho người dùng hoặc xóa vai trò hiện tại của họ.
        </p>
      </div>

      {userRole && (
        <div className="border rounded-md p-4 bg-gray-50">
          <h4 className="font-medium text-gray-700">Vai trò hiện tại</h4>
          <p className="mt-1 text-sm text-gray-600">
            Vai trò chuẩn:{" "}
            <span className="font-medium">{userRole.standardRole}</span>
          </p>

          {userRole.hasCustomRole && userRole.customRole && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Vai trò tùy chỉnh:{" "}
                <span className="font-medium">{userRole.customRole.name}</span>
              </p>
              {userRole.customRole.description && (
                <p className="mt-1 text-sm text-gray-500">
                  {userRole.customRole.description}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium text-gray-700"
        >
          Chọn vai trò
        </label>
        <select
          id="role"
          name="role"
          value={selectedRoleId}
          onChange={(e) => setSelectedRoleId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          disabled={loading}
        >
          <option value="">Chọn vai trò</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleAssignRole}
          disabled={loading || assignLoading || !selectedRoleId}
          className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {assignLoading ? "Đang xử lý..." : "Gán vai trò"}
        </button>

        {userRole?.hasCustomRole && (
          <button
            type="button"
            onClick={handleRemoveRole}
            disabled={loading || removeLoading}
            className="flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {removeLoading ? "Đang xử lý..." : "Xóa vai trò tùy chỉnh"}
          </button>
        )}
      </div>
    </div>
  );
};

export default UserRoleForm;
