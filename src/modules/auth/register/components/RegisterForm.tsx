'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../shared/hooks/useAuth';
import PasswordPolicyChecklist, { validatePassword } from '../../password/security/PasswordPolicyChecklist';
import { initiateGoogleLogin } from '../../sso/services/ssoService';
import { extractRegisterError } from '../../shared/services/authService';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function RegisterForm() {
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const policy = validatePassword(form.password);
    if (!policy.isValid) { toast.error('Mật khẩu chưa đáp ứng yêu cầu bảo mật'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Mật khẩu không trùng khớp!'); return; }

    try {
      await register({ email: form.email, password: form.password });
      toast.success('Đăng ký tài khoản thành công, vui lòng xác thực email.');
    } catch (err: unknown) {
      const error = extractRegisterError(err);
      toast.error(error.message || 'Đăng ký thất bại.');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0">
        <source src="/videos/mixkit-clouds-and-blue-sky-background-2408-full-hd.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute top-0 left-0 w-full h-full bg-slate-900/10 z-10" />

      <div className="w-full max-w-md relative z-20">
        <div className="bg-white/30 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 p-8 md:p-10 transition-all duration-300 hover:shadow-indigo-500/10 hover:border-white/55">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105">
                <Zap className="w-7 h-7 text-white" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-950 tracking-tight">Tạo tài khoản</h1>
            <p className="text-gray-600 text-sm mt-1.5 font-semibold">Bắt đầu trải nghiệm AL-TASK miễn phí</p>
          </div>

          <button onClick={initiateGoogleLogin} type="button"
            className="w-full mb-6 py-3 px-4 flex items-center justify-center gap-3 bg-white/50 hover:bg-white/80 border border-white/30 rounded-xl hover:border-white transition-all font-medium text-gray-800 shadow-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Đăng ký với Google
          </button>

          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-gray-300/40" />
            <span className="flex-shrink mx-4 text-gray-500 text-xs font-semibold">hoặc đăng ký với email</span>
            <div className="flex-grow border-t border-gray-300/40" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email công việc</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="JaneDoe@gmail.com"
                className="w-full px-4 py-2.5 bg-white/45 border border-gray-200/35 rounded-xl text-sm text-gray-900 placeholder:text-gray-500 focus:bg-white/95 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-inner" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required placeholder="Tối thiểu 8 ký tự"
                  className="w-full px-4 py-2.5 pr-11 bg-white/45 border border-gray-200/35 rounded-xl text-sm text-gray-900 placeholder:text-gray-500 focus:bg-white/95 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-inner" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <PasswordPolicyChecklist password={form.password} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Xác nhận mật khẩu</label>
              <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required placeholder="Nhập lại mật khẩu"
                className="w-full px-4 py-2.5 bg-white/45 border border-gray-200/35 rounded-xl text-sm text-gray-900 placeholder:text-gray-500 focus:bg-white/95 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-inner" />
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-md hover:shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Đang tạo tài khoản...</> : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-800 mt-5">
            Khi tạo tài khoản, bạn đồng ý với{' '}
            <Link href="#" className="text-indigo-600 font-semibold hover:underline">Terms of Service</Link> và{' '}
            <Link href="#" className="text-indigo-600 font-semibold hover:underline">Privacy Policy</Link>.
          </p>
          <p className="text-center text-sm text-gray-600 mt-6 font-medium">
            Đã có tài khoản?{' '}<Link href="/login" className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
