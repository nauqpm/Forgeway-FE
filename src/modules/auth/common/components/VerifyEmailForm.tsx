"use client";

import { useState, useEffect, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
// import { verifyEmailAPI, resendVerificationAPI } from "@/modules/auth/services/authService";
import type { AxiosError } from "axios";

function formatTime(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

const VerifyEmailForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);

  // Khi component mount, lấy timer từ localStorage và nếu không hợp lệ (0 hoặc không tồn tại) thì khởi tạo lại 300
  useEffect(() => {
    const storedTime = localStorage.getItem("verificationTimeLeft");
    if (storedTime && parseInt(storedTime, 10) > 0) {
      setTimeLeft(parseInt(storedTime, 10));
    } else {
      setTimeLeft(300);
      localStorage.setItem("verificationTimeLeft", "300");
    }
  }, []);

  // Lấy email từ localStorage khi component mount
  useEffect(() => {
    const storedEmail = localStorage.getItem("verificationEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      router.push("/register");
    }
  }, [router]);

  // Thiết lập timer: chạy một lần khi component mount
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.setItem("verificationTimeLeft", "0");
          return 0;
        }
        const newTime = prev - 1;
        localStorage.setItem("verificationTimeLeft", newTime.toString());
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Xử lý khi người dùng gõ vào ô nhập mã
  const handleChangeCode = (e: ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    // Chỉ giữ chữ số (bỏ mọi ký tự khác)
    raw = raw.replace(/\D/g, "");
    // Giới hạn 6 ký tự
    if (raw.length > 6) {
      raw = raw.slice(0, 6);
    }
    setVerificationCode(raw);
  };

  const handleResendCode = async () => {
    try {
      setLoading(true);
      // await resendVerificationAPI(email);
      setTimeLeft(300);
      localStorage.setItem("verificationTimeLeft", "300");
      setError("");
    } catch (err: unknown) {
      const error = err as AxiosError<{ message: string }>;
      setError(
        error.response?.data?.message ||
        "Không thể gửi lại mã. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("🟢 Bắt đầu xác thực email với mã:", verificationCode);
      // const response = await verifyEmailAPI(email, verificationCode);

      // if (response.success) {
      //   console.log("✅ Xác thực email thành công");
      //   localStorage.removeItem("verificationEmail");
      //   localStorage.removeItem("verificationTimeLeft");
      //   router.push("/login?verified=true");
      // }
    } catch (err: unknown) {
      console.error("❌ Lỗi xác thực email:", err);
      setVerificationCode(""); // Clear the input
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Mã xác thực không chính xác, vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Xác thực Email</h2>
            <p className="text-gray-600 mb-6">
              Vui lòng nhập mã xác thực đã được gửi đến email:
              <br />
              <span className="font-semibold">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-3">
                Mã xác thực <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="_ _ _ _ _ _"
                value={verificationCode}
                onChange={handleChangeCode}
                maxLength={6}
                required
                className={`w-full text-center text-2xl tracking-[1rem] p-3 border ${
                  error ? "border-red-500" : "border-gray-300"
                } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              />
              <div className="mt-2 space-y-2">
                {error && (
                  <div className="text-red-500 text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${timeLeft > 0 ? "text-gray-500" : "text-red-500"}`}>
                    ⏱️ Thời gian còn lại: {formatTime(timeLeft)}
                  </span>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={timeLeft > 0 || loading}
                    className={`text-sm font-medium ${
                      timeLeft > 0
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-green-600 hover:text-green-700"
                    }`}
                  >
                    {timeLeft > 0 ? "⌛ Đợi để gửi lại mã" : "🔄 Gửi lại mã"}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className={`w-full py-3 rounded-lg text-white font-bold text-lg mb-4 ${
                loading || verificationCode.length !== 6
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 transition-colors"
              }`}
            >
              {loading ? "⏳ Đang xử lý..." : "✅ Xác thực"}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
            </div>

            <p className="text-center text-gray-600">
              <Link href="/login" className="text-green-600 hover:underline">
                Quay lại đăng nhập
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailForm;
