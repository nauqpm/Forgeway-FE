'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../shared/stores/authStore';
import { AUTH_ROUTES } from '../shared/constants/auth-routes';
import { Loader2 } from 'lucide-react';

interface GuestGuardProps {
  children: React.ReactNode;
}

/**
 * GuestGuard — Component bảo vệ các route DÀNH RIÊNG cho khách (chưa đăng nhập).
 * 
 * Mục đích:
 * - Được sử dụng trên các trang như /login, /register, /forgot-password.
 * - Nếu người dùng ĐÃ đăng nhập mà cố tình vào lại các trang này, hệ thống sẽ tự động 
 *   chuyển hướng họ vào trang Dashboard chính để tránh lỗi logic.
 * 
 * Các bước hoạt động:
 * 1. Lấy trạng thái đăng nhập từ `useAuthStore`.
 * 2. Dùng `useEffect` kiểm tra: Nếu đã khởi tạo xong và người dùng CÓ trạng thái isAuthenticated = true,
 *    thì lập tức đẩy vào trang DASHBOARD.
 * 3. Nếu ứng dụng chưa khởi tạo xong, hiển thị Spinner.
 * 4. Nếu đã đăng nhập thì trả về null (không render nội dung trang đăng nhập).
 * 5. Nếu thực sự là Guest (chưa đăng nhập), cho phép render `children`.
 */
const GuestGuard: React.FC<GuestGuardProps> = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthStore();

  // Bước 2: Kiểm tra và chuyển hướng nếu ĐÃ đăng nhập
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace(AUTH_ROUTES.DASHBOARD);
    }
  }, [isInitialized, isAuthenticated, router]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default GuestGuard;
