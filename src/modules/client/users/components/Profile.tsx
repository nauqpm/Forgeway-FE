"use client";

import React from "react";
import { useProfile } from "../hooks/useProfile";
import Image from "next/image";
import { FaSpinner, FaEdit } from "react-icons/fa";
import Link from "next/link";

const Profile: React.FC = () => {
  const { user, loading } = useProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-primary text-3xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Không tìm thấy thông tin người dùng.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-xl mx-auto">
      <div className="flex items-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt="Avatar"
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-gray-400 bg-gray-200">
                <span>{user.fullName?.charAt(0) || "?"}</span>
              </div>
            )}
          </div>
        </div>
        <div className="ml-6">
          <h2 className="text-2xl font-semibold">{user.fullName || "Chưa cập nhật tên"}</h2>
          <p className="text-gray-500">{user.email}</p>
        </div>
        <div className="ml-auto">
          <Link href="/profile/edit" className="flex items-center gap-2 text-primary hover:underline">
            <FaEdit />
            Chỉnh sửa
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <span className="font-medium">Số điện thoại:</span>{" "}
          <span>{user.phone || "Chưa cập nhật"}</span>
        </div>
        <div>
          <span className="font-medium">Địa chỉ:</span>{" "}
          <span>{user.address || "Chưa cập nhật"}</span>
        </div>
        <div>
          <span className="font-medium">Ngày sinh:</span>{" "}
          <span>{user.birthday || "Chưa cập nhật"}</span>
        </div>
        <div>
          <span className="font-medium">Giới tính:</span>{" "}
          <span>
            {user.gender === "male"
              ? "Nam"
              : user.gender === "female"
              ? "Nữ"
              : "Khác"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Profile;
