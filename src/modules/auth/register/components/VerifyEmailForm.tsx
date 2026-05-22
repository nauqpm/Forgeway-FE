'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyEmailAPI, resendVerifyEmailAPI } from '../../shared/services/authService';
import toast from 'react-hot-toast';
import { Zap, Loader2, MailCheck, ArrowLeft } from 'lucide-react';
import { AUTH_ROUTES } from '../../shared/constants/auth-routes';

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Không tìm thấy email cần xác thực.');
      return;
    }
    if (otp.length < 6) {
      toast.error('Mã OTP phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmailAPI(email, otp);
      toast.success('Tạo tài khoản thành công');
      router.push(AUTH_ROUTES.LOGIN);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Xác thực thất bại, vui lòng kiểm tra lại mã OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Không tìm thấy email để gửi lại mã.');
      return;
    }
    setIsResending(true);
    try {
      await resendVerifyEmailAPI(email);
      toast.success('Đã gửi lại mã xác thực! Vui lòng kiểm tra email.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Gửi lại mã thất bại.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center"><Zap className="w-7 h-7 text-white" /></div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Xác thực Email</h1>
          <p className="text-gray-500 text-sm mt-1">
            Vui lòng nhập mã OTP gồm 6 chữ số đã được gửi tới <br />
            <span className="font-semibold text-gray-900">{email || 'email của bạn'}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
              <MailCheck className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 text-center">Mã xác thực (OTP)</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} placeholder="Nhập 6 số"
                className="w-full text-center text-2xl px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Đang xác thực...</> : 'Xác thực tài khoản'}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-4">
            <button type="button" onClick={handleResend} disabled={isResending || !email}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors flex items-center gap-1">
              {isResending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Gửi lại mã xác thực
            </button>

            <Link href={AUTH_ROUTES.LOGIN} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Quay lại Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
