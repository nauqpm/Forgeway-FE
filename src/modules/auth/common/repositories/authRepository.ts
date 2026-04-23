"use client";

import { useState, useEffect } from "react";
import axios, { AxiosResponse } from "axios";

// Định nghĩa interface để tránh sử dụng any
interface CustomAxiosError extends Error {
  response?: {
    data?: {
      message?: string;
    };
  };
}

// 🌐 Lấy API_URL từ biến môi trường .env hoặc sử dụng giá trị mặc định
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// 🆕 Định nghĩa kiểu dữ liệu cho tham số đăng nhập
interface LoginParams {
  email: string;
  password: string;
}

// 🆕 Định nghĩa các giá trị hợp lệ cho role người dùng
export type UserRole = "user" | "admin" | "staff" | "manager" | "technical";

// 🆕 Định nghĩa kiểu dữ liệu trả về từ API đăng nhập
export interface LoginResponse {
  message: string;
  token: string;
  role: UserRole; // Role bắt buộc, không còn tùy chọn undefined
}

// 🆕 Định nghĩa kiểu dữ liệu User trong ứng dụng
type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

// 📥 Hàm xử lý đăng nhập
export const login = async ({
  email,
  password,
}: LoginParams): Promise<LoginResponse> => {
  try {
    const response: AxiosResponse<LoginResponse> = await axios.post(
      `${API_URL}/auth/login`,
      {
        email,
        password,
      }
    );

    // Đã loại bỏ lưu token vào localStorage
    return response.data;
  } catch (error: unknown) {
    const err = error as CustomAxiosError;
    console.error(
      "❌ Lỗi khi gọi API đăng nhập:",
      err.response?.data || err.message
    );

    if (err.response && err.response.data) {
      alert(`Lỗi đăng nhập: ${err.response.data.message}`);
    } else {
      alert("Đăng nhập thất bại, vui lòng kiểm tra lại thông tin.");
    }

    throw error;
  }
};

// 📥 Hàm xử lý đăng ký người dùng
export const register = async (
  email: string,
  password: string,
  role: UserRole = "user"
) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      email,
      password,
      role,
    });
    return response.data;
  } catch (error: unknown) {
    const err = error as CustomAxiosError;
    console.error("❌ Lỗi khi đăng ký:", err.response?.data || err.message);

    if (err.response && err.response.data) {
      alert(`Lỗi đăng ký: ${err.response.data.message}`);
    } else {
      alert("Đăng ký thất bại, vui lòng kiểm tra lại thông tin.");
    }

    throw error;
  }
};

// 🆕 Hàm xử lý đăng xuất người dùng
export const logout = () => {
  // Đã loại bỏ thao tác liên quan đến token và user trong localStorage
  window.location.href = "/"; // Chuyển hướng người dùng về trang đăng nhập
};

// 🆕 Tích hợp useAuth dưới dạng Hook React
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Đã loại bỏ việc lấy thông tin user từ localStorage
  }, []);

  // Đảm bảo login cập nhật đúng user vào state
  const handleLogin = async ({
    email,
    password,
  }: LoginParams): Promise<LoginResponse> => {
    const response = await login({ email, password });
    if (response && response.token) {
      const userData: User = {
        id: "1", // Ví dụ tạm, có thể thay bằng response.id nếu có
        name: "John Doe", // Hoặc response.name
        email: email,
        role: response.role,
      };
      setUser(userData);
      // Đã loại bỏ lưu user vào localStorage
    }
    return response;
  };

  return {
    user,
    login: handleLogin,
    register,
    logout,
  };
};
