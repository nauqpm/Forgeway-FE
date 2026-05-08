import React, { useState } from "react";
import RolesList from "./RolesList";
import RoleForm from "./RoleForm";
import { Role } from "../services/role.service";

const RolesManager: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleCreateClick = () => {
    setSelectedRole(null);
    setShowCreateForm(true);
  };

  const handleEditClick = (role: Role) => {
    setSelectedRole(role);
    setShowCreateForm(true);
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setSelectedRole(null);
  };


  return (
    <div className="space-y-8">
      {showCreateForm ? (
        <div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {selectedRole
                ? `Cập nhật vai trò: ${selectedRole.name}`
                : "Thêm vai trò mới"}
            </h2>

            <RoleForm
              mode={selectedRole ? "edit" : "create"}
              initialRole={selectedRole || undefined}
              onSubmitSuccess={handleFormSuccess}
            />
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Quản lý vai trò
            </h1>
            <button
              onClick={handleCreateClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Thêm vai trò mới
            </button>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <RolesList onSelectRole={handleEditClick} />
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesManager;
