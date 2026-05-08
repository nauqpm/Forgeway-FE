"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { usePasswordReset } from "../common/hooks/usePasswordReset";
import { MdLock } from "react-icons/md";

const ResetPassword = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { loading, error, resetPasswordWithToken, resetPasswordWithOtp } =
    usePasswordReset();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      if (token) {
        // Reset bằng token từ email link
        await resetPasswordWithToken(token, password);
        alert("Đặt lại mật khẩu thành công!");
      } else if (email && otp) {
        // Reset bằng OTP
        await resetPasswordWithOtp(email, otp, password);
        alert("Đặt lại mật khẩu thành công!");
      } else {
        alert("Thiếu thông tin cần thiết để đặt lại mật khẩu");
        return;
      }
      // Chuyển về trang đăng nhập
      window.location.href = "/login";
    } catch (err) {
      // Error đã được xử lý trong hook
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đặt lại mật khẩu
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {token
              ? "Nhập mật khẩu mới của bạn"
              : "Nhập mã OTP và mật khẩu mới của bạn"}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {!token && (
              <div className="flex items-center border border-gray-300 rounded-t-md">
                <span className="inline-flex items-center px-3 py-2 border-r border-gray-300 bg-gray-50 text-gray-500">
                  <MdLock className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Nhập mã OTP"
                  pattern="[0-9]{6}"
                  title="Mã OTP gồm 6 chữ số"
                />
              </div>
            )}
            <div
              className={`flex items-center border border-gray-300 ${
                !token ? "" : "rounded-t-md"
              }`}
            >
              <span className="inline-flex items-center px-3 py-2 border-r border-gray-300 bg-gray-50 text-gray-500">
                <MdLock className="h-5 w-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Mật khẩu mới"
                minLength={6}
              />
            </div>
            <div className="flex items-center border border-gray-300 rounded-b-md">
              <span className="inline-flex items-center px-3 py-2 border-r border-gray-300 bg-gray-50 text-gray-500">
                <MdLock className="h-5 w-5" />
              </span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Xác nhận mật khẩu mới"
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
