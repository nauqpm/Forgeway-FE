"use client";
import { useState, useEffect } from "react";
import type React from "react";

import { login } from "@/modules/auth/common/repositories/authRepository";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  initiateGoogleLogin,
  handleGoogleCallback,
} from "../common/services/authService";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/modules/admin/users/hooks/useUser";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login: authLogin } = useAuth();
  const { fetchUserInfo } = useUser();
  const searchParams = useSearchParams();

  // Xử lý callback từ Google
  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      toast.error("Đăng nhập Google thất bại. Vui lòng thử lại.");
      return;
    }

    if (token) {
      handleGoogleCallback(token)
        .then((response) => {
          authLogin(response.token);
          fetchUserInfo();
          toast.success("Đăng nhập Google thành công!");
        })
        .catch((error) => {
          console.error("Lỗi xử lý callback Google:", error);
          toast.error("Đăng nhập Google thất bại. Vui lòng thử lại.");
        });
    }
  }, [searchParams]);

  /**
   * ✅ Xử lý sự kiện submit form đăng nhập
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoggingIn(true);

    try {
      const response = await login({ email, password });

      // 🛠️ Kiểm tra role của người dùng, nếu không có thì gán mặc định là "user"
      // const userRole = response.role || "user"

      // Lưu token và role vào state thông qua AuthContext
      authLogin(response.token);

      // Lấy thông tin người dùng sau khi đăng nhập
      await fetchUserInfo();

      toast.success("Đăng nhập thành công!");
    } catch (error: any) {
      console.error("❌ Lỗi đăng nhập:", error);

      // Hiển thị thông báo chi tiết khi đăng nhập thất bại
      if (error.response && error.response.data) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Đăng nhập thất bại, vui lòng kiểm tra lại thông tin.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = () => {
    initiateGoogleLogin();
  };

  return (
    <div className="flex justify-center items-center min-h-screen px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex justify-center items-center pt-8">
          <img
            src="/logo-yaviet/LOGO YAVIET 2.png"
            alt="logo"
            className="w-52 h-16"
          />
        </div>
        <div className="p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">
              Chào mừng trở lại
            </h2>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full mb-4 py-3 px-4 flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
            <span>Đăng nhập bằng Google</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Hoặc đăng nhập bằng email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-gray-700 font-semibold mb-2"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-gray-700 font-semibold mb-2"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-between items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-gray-700">Ghi nhớ tôi</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-green-600 hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className={`w-full py-3 rounded-lg text-white font-medium text-lg ${
                isLoggingIn
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 transition-colors"
              }`}
            >
              {isLoggingIn ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            Bạn chưa có tài khoản?{" "}
            <Link
              href="/register"
              className="text-green-600 hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
