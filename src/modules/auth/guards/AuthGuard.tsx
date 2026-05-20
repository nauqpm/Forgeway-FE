'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../shared/stores/authStore';
import { AUTH_ROUTES } from '../shared/constants/auth-routes';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * AuthGuard — Component bảo vệ các route yêu cầu đăng nhập.
 * 
 * Mục đích: 
 * - Đảm bảo chỉ những người dùng đã xác thực (đã đăng nhập) mới có thể truy cập các trang bên trong.
 * - Nếu người dùng chưa đăng nhập, tự động chuyển hướng họ về trang đăng nhập.
 * 
 * Các bước hoạt động:
 * 1. Lấy trạng thái từ `useAuthStore` (isInitialized, isLoading, isAuthenticated).
 * 2. Dùng `useEffect` kiểm tra: Nếu app đã khởi tạo xong, không còn loading, và user KHÔNG có quyền (chưa đăng nhập),
 *    thì dùng `router.replace` đẩy người dùng ra trang LOGIN.
 * 3. Trong lúc chờ xác thực ban đầu (chưa init hoặc đang loading), hiển thị trạng thái tải (spinner hoặc fallback UI).
 * 4. Nếu chưa đăng nhập, trả về `null` để không render UI bên trong.
 * 5. Nếu hợp lệ, render các `children` (nội dung trang).
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, isInitialized } = useAuthStore();

  // Bước 2: Kiểm tra và chuyển hướng nếu chưa đăng nhập
  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      router.replace(AUTH_ROUTES.LOGIN);
    }
  }, [isInitialized, isLoading, isAuthenticated, router]);

  // Still initializing — show loading spinner
  if (!isInitialized || isLoading) {
    return (
      fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm text-gray-500">Đang xác thực...</p>
          </div>
        </div>
      )
    );
  }

  // Not authenticated — redirect to login
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
