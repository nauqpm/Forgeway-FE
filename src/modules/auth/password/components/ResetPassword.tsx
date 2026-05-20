'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePasswordReset } from '../hooks/usePasswordReset';
import PasswordPolicyChecklist, {
  validatePassword,
} from '../security/PasswordPolicyChecklist';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Zap, Loader2, Lock, Mail } from 'lucide-react';

const ResetPassword = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { loading, error, resetPasswordWithOtp } = usePasswordReset();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !otp) {
      toast.error('Vui lòng nhập đầy đủ email và mã OTP');
      return;
    }

    const policy = validatePassword(password);
    if (!policy.isValid) {
      toast.error('Mật khẩu chưa đáp ứng yêu cầu bảo mật');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      await resetPasswordWithOtp(email, otp, password);
      toast.success('Đặt lại mật khẩu thành công!');
      router.push('/login');
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
          <p className="text-gray-500 text-sm mt-1">Nhập email, mã OTP và mật khẩu mới</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ten@company.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mã OTP</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  placeholder="Nhập mã 6 chữ số"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Nhập mật khẩu mới"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <PasswordPolicyChecklist password={password} className="mt-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Nhập lại mật khẩu mới"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Đặt lại mật khẩu'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-800">
              Quay lại trang đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
