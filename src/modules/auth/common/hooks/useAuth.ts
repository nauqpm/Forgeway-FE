"use client";
import { useState } from "react";
import { loginAPI, registerAPI } from "../services/authService";

// Định nghĩa interface để tránh sử dụng any
interface CustomAxiosError extends Error {
  response?: {
    data?: {
      message?: string;
    };
  };
}

// 🆕 Khai báo type chuẩn cho LoginResponse
interface User {
  id?: string;
  email: string;
  role: string;
  name?: string;
  fullName?: string;
  avatar?: string;
}

interface LoginResponse {
  message: string;
  token: string;
  user?: {
    id?: string;
    email: string;
    role: string;
    name?: string;
    fullName?: string;
    avatar?: string;
  };
}



export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Bắt đầu đăng nhập với email:", email);
      const res: LoginResponse = await loginAPI(email, password);
      console.log("Đăng nhập thành công:", res);

      // Nếu có user thì cập nhật state
      if (res.user) {
        setUser(res.user);
      }

      // Đã loại bỏ việc lưu token vào localStorage
    } catch (err: unknown) {
      const errorObj = err as CustomAxiosError;
      setError(
        errorObj.response?.data?.message ||
        errorObj.message ||
        "Đã có lỗi xảy ra!"
      );
      console.error("Lỗi đăng nhập:", errorObj);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Bắt đầu đăng ký với email:", email);
      await registerAPI(email, password, fullName);
      console.log("Đăng ký thành công");
    } catch (err: unknown) {
      const errorObj = err as CustomAxiosError;
      setError(
        errorObj.response?.data?.message ||
        errorObj.message ||
        "Đã có lỗi xảy ra!"
      );
      console.error("Lỗi đăng ký:", errorObj);
    } finally {
      setLoading(false);
    }
  };

  return { user, login, register, loading, error };
};
