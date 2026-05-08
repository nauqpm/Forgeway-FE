
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState, useRef, useEffect } from "react";
import { MdNotifications, MdSearch, MdHelp } from "react-icons/md";



const AdminMenu = () => {
  // Sử dụng context xác thực thực tế
  const { user, logout } = useAuth();

  // State cho dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Xử lý click bên ngoài để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Xử lý đăng xuất
  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  return (
    <div className="h-[73px] px-4 flex items-center justify-between bg-[#231d02]">
      {/* Left section */}
      <div className="flex items-center gap-3"></div>

      {/* Right section */}
      <div className="flex items-center gap-4" ref={dropdownRef}>
        {/* Action buttons */}
        <button className="p-2 rounded-lg relative">
          <MdNotifications className="text-xl text-[#fbf5ab]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button className="p-2 rounded-lg">
          <MdHelp className="text-xl text-[#fbf5ab]" />
        </button>

        {/* User profile */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-2 rounded-lg"
          >
            <div className="h-8 w-8 rounded-lg bg-[#fbf5ab] text-[#231d02] flex items-center justify-center font-medium">
              {user?.email?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-[#fbf5ab]">
                {user?.role === "admin" ? "Quản trị viên" : "Người dùng"}
              </p>
              <p className="text-xs text-[#fbf5ab]">
                {user?.email || "admin@example.com"}
              </p>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-100">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMenu;
