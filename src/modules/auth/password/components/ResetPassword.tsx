'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePasswordReset } from '../hooks/usePasswordReset';
import { validateEmail } from '../../shared/utils/emailValidation';
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
      toast.error('Please enter both email and OTP');
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      toast.error(emailError);
      return;
    }

    const policy = validatePassword(password);
    if (!policy.isValid) {
      toast.error('Password does not meet the security requirements');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Password confirmation does not match');
      return;
    }

    try {
      await resetPasswordWithOtp(email, otp, password);
      toast.success('Password reset successfully!');
      router.push('/login');
    } catch {
      // Error handled by hook
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
        <div className="bg-white/30 backdrop-blur-2xl rounded-[12px] border border-white/30 p-8 md:p-10 transition-all duration-300 hover:border-white/55">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
              <div className="w-12 h-12 bg-[#2563EB] rounded-[8px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <Zap className="w-7 h-7 text-white" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-950 tracking-tight">Reset password</h1>
            <p className="text-gray-600 text-[0.8125rem] mt-1.5 font-semibold">Enter your email, OTP, and new password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[0.8125rem] font-semibold text-gray-800 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ten@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/45 border border-gray-200/35 rounded-[6px] text-[0.8125rem] text-gray-900 placeholder:text-gray-500 focus:bg-white/95 focus:ring-2 focus:ring-[#2563EB] outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-[0.8125rem] font-semibold text-gray-800 mb-1.5">OTP</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  placeholder="Enter the 6-digit code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/45 border border-gray-200/35 rounded-[6px] text-[0.8125rem] text-gray-900 placeholder:text-gray-500 focus:bg-white/95 focus:ring-2 focus:ring-[#2563EB] outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-[0.8125rem] font-semibold text-gray-800 mb-1.5">New password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  className="w-full px-4 py-2.5 bg-white/45 border border-gray-200/35 rounded-[6px] text-[0.8125rem] text-gray-900 placeholder:text-gray-500 focus:bg-white/95 focus:ring-2 focus:ring-[#2563EB] outline-none transition-all shadow-inner"
                />
                <PasswordPolicyChecklist password={password} />
              </div>
            </div>

            <div>
              <label className="block text-[0.8125rem] font-semibold text-gray-800 mb-1.5">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter new password"
                className="w-full px-4 py-2.5 bg-white/45 border border-gray-200/35 rounded-[6px] text-[0.8125rem] text-gray-900 placeholder:text-gray-500 focus:bg-white/95 focus:ring-2 focus:ring-[#2563EB] outline-none transition-all shadow-inner"
              />
            </div>

            {error && <p className="text-red-600 text-[0.8125rem] text-center font-medium bg-red-500/10 py-2 rounded-[6px] border border-red-500/20">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2563EB] text-white rounded-[6px] font-bold hover:bg-[#1D4ED8] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Reset password'
              )}
            </button>
          </form>

          <p className="text-center text-[0.8125rem] text-gray-600 mt-6 font-medium">
            <Link href="/login" className="text-[#2563EB] font-bold hover:text-[#1D4ED8] transition-colors">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
