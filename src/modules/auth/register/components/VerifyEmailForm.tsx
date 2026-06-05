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
      toast.error('Could not find the email to verify.');
      return;
    }
    if (otp.length < 6) {
      toast.error('OTP must contain at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmailAPI(email, otp);
      toast.success('Account created successfully');
      router.push(AUTH_ROUTES.LOGIN);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Verification failed. Please check the OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Could not find the email for resending the code.');
      return;
    }
    setIsResending(true);
    try {
      await resendVerifyEmailAPI(email);
      toast.success('Verification code resent. Please check your email.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Could not resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#1A1A1A] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-12 h-12 bg-[#2563EB] dark:bg-[#3B82F6] rounded-[8px] flex items-center justify-center"><Zap className="w-7 h-7 text-white" /></div>
          </Link>
          <h1 className="text-2xl font-bold text-[#111111] dark:text-[#E8E8E7]">Verify Email</h1>
          <p className="text-[#787774] dark:text-[#9B9A97] text-[13px] mt-1">
            Please enter the 6-digit OTP sent to <br />
            <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">{email || 'your email'}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-[#202020] rounded-[10px] border border-[#EAEAEA] dark:border-white/8 p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] rounded-full flex items-center justify-center">
              <MailCheck className="w-8 h-8 text-[#2563EB] dark:text-[#3B82F6]" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[13px] font-medium text-[#111111] dark:text-[#E8E8E7] mb-1.5 text-center">Verification code (OTP)</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} placeholder="Enter 6 digits"
                className="w-full text-center text-2xl px-4 py-3 border border-[#EAEAEA] dark:border-white/8 rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all" />
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] font-semibold hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Verifying...</> : 'Verify account'}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-4">
            <button type="button" onClick={handleResend} disabled={isResending || !email}
              className="text-[13px] font-medium text-[#2563EB] dark:text-[#3B82F6] hover:text-[#1D4ED8] disabled:opacity-50 transition-colors flex items-center gap-1">
              {isResending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Resend verification code
            </button>

            <Link href={AUTH_ROUTES.LOGIN} className="text-[13px] text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
