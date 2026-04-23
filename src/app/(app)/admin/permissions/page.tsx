"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import { Shield, Users, Plus, Trash2, Edit2, Check } from "lucide-react";

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isDefault: boolean;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export default function AdminPermissionsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<string | null>(null);

  const availablePermissions: Permission[] = [
    { id: "projects:create", name: "Create Projects", description: "Create new projects", category: "Projects" },
    { id: "projects:edit", name: "Edit Projects", description: "Edit project settings", category: "Projects" },
    { id: "projects:delete", name: "Delete Projects", description: "Delete projects", category: "Projects" },
    { id: "tasks:create", name: "Create Tasks", description: "Create new tasks", category: "Tasks" },
    { id: "tasks:edit", name: "Edit Tasks", description: "Edit task details", category: "Tasks" },
    { id: "tasks:delete", name: "Delete Tasks", description: "Delete tasks", category: "Tasks" },
    { id: "tasks:assign", name: "Assign Tasks", description: "Assign tasks to users", category: "Tasks" },
    { id: "spaces:create", name: "Create Spaces", description: "Create new spaces", category: "Spaces" },
    { id: "spaces:edit", name: "Edit Spaces", description: "Edit space settings", category: "Spaces" },
    { id: "pages:create", name: "Create Pages", description: "Create new pages", category: "Pages" },
    { id: "pages:edit", name: "Edit Pages", description: "Edit page content", category: "Pages" },
    { id: "admin:manage", name: "Admin Management", description: "Full admin access", category: "Admin" },
  ];

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/roles');
        setRoles(res.data);
      } catch {
        setRoles([
          { _id: "1", name: "Admin", description: "Full workspace access", permissions: availablePermissions.map(p => p.id), isDefault: false },
          { _id: "2", name: "Member", description: "Standard workspace access", permissions: ["tasks:create", "tasks:edit", "tasks:assign", "pages:create", "pages:edit"], isDefault: true },
          { _id: "3", name: "Viewer", description: "Read-only access", permissions: [], isDefault: true },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  const handleTogglePermission = async (roleId: string, permissionId: string) => {
    const role = roles.find(r => r._id === roleId);
    if (!role) return;

    const newPermissions = role.permissions.includes(permissionId)
      ? role.permissions.filter(p => p !== permissionId)
      : [...role.permissions, permissionId];

    setRoles(roles.map(r =>
      r._id === roleId ? { ...r, permissions: newPermissions } : r
    ));

    try {
      await api.put(`/roles/${roleId}`, { permissions: newPermissions });
    } catch {}
  };

  const categories = [...new Set(availablePermissions.map(p => p.category))];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Permissions</h1>
        <p className="text-gray-500 text-sm">Manage roles and permissions for your workspace</p>
      </div>

      <div className="space-y-6">
        {roles.map((role) => (
          <div key={role._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{role.name}</h3>
                    <p className="text-sm text-gray-500">{role.description}</p>
                  </div>
                </div>
                {role.isDefault && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    Default
                  </span>
                )}
              </div>
            </div>

            <div className="p-6">
              {categories.map((category) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">{category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availablePermissions
                      .filter(p => p.category === category)
                      .map((permission) => {
                        const hasPermission = role.permissions.includes(permission.id);
                        return (
                          <div
                            key={permission.id}
                            onClick={() => !role.isDefault && handleTogglePermission(role._id, permission.id)}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                              hasPermission
                                ? "bg-indigo-50 border-indigo-200"
                                : "bg-gray-50 border-gray-200 hover:border-gray-300"
                            } ${role.isDefault ? "opacity-60 cursor-not-allowed" : ""}`}
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                              <p className="text-xs text-gray-500">{permission.description}</p>
                            </div>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                              hasPermission ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                            }`}>
                              {hasPermission && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
