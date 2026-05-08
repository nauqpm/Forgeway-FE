"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MdOutlineDashboard,
  MdOutlineArticle,
  MdOutlineFolderShared,
  MdOutlineShoppingCart,
  MdOutlinePayment,
  MdOutlineInfo,
  MdOutlinePermMedia,
  MdOutlineViewCarousel,
  MdOutlineCode,
  MdOutlineDiscount,
  MdOutlineSpaceDashboard,
  MdOutlineSecurity,
  MdOutlineEmail,
  MdOutlinePerson,
  MdOutlineHome,
} from "react-icons/md";
import { useAuth } from "@/context/AuthContext";

interface AdminSidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

interface MenuItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  group?: string;
  requiredPermission?: {
    resource: string;
    action: string;
  };
}

const AdminSidebar = ({ collapsed, toggleSidebar }: AdminSidebarProps) => {
  const pathname = usePathname();
  const { user, hasPermission, fetchUserPermissions } = useAuth();

  // Fetch permissions if not already loaded
  useEffect(() => {
    if (user && (!user.permissions || user.permissions.length === 0)) {
      console.log("🔄 Loading user permissions for AdminSidebar...");
      fetchUserPermissions();
    }
  }, [user, fetchUserPermissions]);

  const menuItems: MenuItem[] = [
    {
      href: "/admin",
      icon: <MdOutlineDashboard />,
      label: "Tổng quan",
      group: "Tổng quan",
    },
    {
      href: "/admin/permissions",
      icon: <MdOutlineSecurity />,
      label: "Quyền hạn",
      group: "Quản lý",
      requiredPermission: {
        resource: "permissions",
        action: "read",
      },
    },
    {
      href: "/admin/posts",
      icon: <MdOutlineArticle />,
      label: "Bài viết",
      group: "Nội dung",
      requiredPermission: {
        resource: "posts",
        action: "read",
      },
    },
    {
      href: "/admin/categories-posts",
      icon: <MdOutlineFolderShared />,
      label: "Danh mục bài viết",
      group: "Nội dung",
      requiredPermission: {
        resource: "categories-posts",
        action: "read",
      },
    },
    {
      href: "/admin/manager-permissions",
      icon: <MdOutlineSecurity />,
      label: "Quản lý quyền hạn",
      group: "Quản lý",
      requiredPermission: {
        resource: "manager-permissions",
        action: "read",
      },
    },
    {
      href: "/admin/manager-users",
      icon: <MdOutlinePerson />,
      label: "Quản lý người dùng",
      group: "Quản lý",
      requiredPermission: {
        resource: "users",
        action: "read",
      },
    },
    {
      href: "/admin/property-posts",
      icon: <MdOutlineHome />,
      label: "Quản lý bất động sản",
      group: "Bất động sản",
      requiredPermission: {
        resource: "property-posts",
        action: "read",
      },
    },
    {
      href: "/admin/amenities",
      icon: <MdOutlineHome />,
      label: "Quản lý tiện ích",
      group: "Bất động sản",
      requiredPermission: {
        resource: "amenities",
        action: "read",
      },
    },
  ];

  // Filter menu items based on user permissions
  const filteredMenuItems = menuItems.filter((item) => {
    // If no permission is required or user is admin, show the item
    if (!item.requiredPermission || user?.role === "admin") {
      return true;
    }

    // Otherwise, check if user has the required permission
    const { resource, action } = item.requiredPermission;
    return hasPermission(resource, action);
  });

  // Group menu items
  const groupedItems = filteredMenuItems.reduce((acc, item) => {
    const group = item.group || "Other";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="h-full bg-[#231d02] flex flex-col">
      {/* Logo */}
      <div
        className={`p-4 ${
          collapsed ? "items-center" : ""
        } border-b border-gray-100 flex`}
      >
          <div className="flex items-center justify-center ml-1 w-10 h-10 rounded-lg bg-[#fbf5ab] text-[#231d02]">
            <MdOutlineSpaceDashboard className="text-2xl" />
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-[#fbf5ab] focus:outline-none"
              aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
          {!collapsed && (
        <Link href="/admin" className="flex items-center gap-2 no-underline ml-5">
            <span className="font-semibold text-[#fbf5ab] text-lg">
              <img src="/logo-yaviet/logo yaviet nen toi mau sang.png" alt="logo" className="w-full h-10" />
            </span>
        </Link>
          )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-4">
        {Object.entries(groupedItems).map(([group, items]) => (
          <div key={group} className="mb-6">
            {!collapsed && items.length > 0 && (
              <h3 className="px-4 text-xs font-semibold text-[#fbf5ab] uppercase tracking-wider mb-2">
                {group}
              </h3>
            )}
            <ul className="space-y-1 px-2">
              {items.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === item.href ||
                      pathname?.startsWith(`${item.href}/`);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-[#fbf5ab] text-[#231d02]"
                          : "text-[#fbf5ab] hover:bg-[#fbf5ab] hover:text-[#231d02]"
                      } no-underline ${collapsed ? "justify-center" : ""}`}
                      title={collapsed ? item.label : ""}
                    >
                      <span className="text-xl">{item.icon}</span>
                      {!collapsed && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-100">
          <p className="text-center text-xs text-[#fbf5ab]">
            &copy; {new Date().getFullYear()} All Rights Reserved
            <br />
            <a
              href="https://yaviet.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 no-underline"
            >
              Designed by yaviet.com
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminSidebar;
