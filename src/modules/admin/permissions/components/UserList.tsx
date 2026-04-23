"use client";

import React, { useState, useEffect } from "react";
import api from "@/common/utils/api";
import { useUserRoles } from "../../manager-permissions";

interface User {
  id: string;
  email: string;
  fullName?: string;
  role: string;
}

interface UserListProps {
  onSelectUser: (userId: string) => void;
  selectedUserId?: string;
}

export const UserList: React.FC<UserListProps> = ({
  onSelectUser,
  selectedUserId,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userRole, loading: userRoleLoading, getUserRole } = useUserRoles();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          `${process.env.NEXT_PUBLIC_API_URL}/users`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        // Lọc ra những user không phải admin
        const nonAdminUsers = response.data.filter(
          (user: User) => user.role !== "admin"
        );

        // Fetch role for each user
        const usersWithRoles = await Promise.all(
          nonAdminUsers.map(async (user: User) => {
            try {
              const userRoleData = await getUserRole(user.id);
              return {
                ...user,
                role: userRoleData?.customRole?.name || userRoleData?.standardRole || user.role
              };
            } catch (err) {
              console.error(`Failed to fetch role for user ${user.id}:`, err);
              return user;
            }
          })
        );

        setUsers(usersWithRoles);
        setError(null);
      } catch (err) {
        setError("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [getUserRole]);

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
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Người dùng</h2>
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedUserId === user.id
                  ? "bg-blue-50 border-2 border-blue-500"
                  : "hover:bg-gray-50 border-2 border-transparent"
              }`}
              onClick={() => onSelectUser(user.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user.fullName || "No Name"}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100">
                  {user.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
