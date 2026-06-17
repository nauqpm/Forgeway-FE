'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { verifyEmailAPI, resendVerifyEmailAPI } from '../../shared/services/authService';
import { validateEmail } from '../../shared/utils/emailValidation';
import toast from 'react-hot-toast';
import { Loader2, MailCheck, ArrowLeft } from 'lucide-react';
import { AUTH_ROUTES } from '../../shared/constants/auth-routes';
import logoIcon from '../../../../../app/icon.png';

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const verifyEmailMutation = useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) => verifyEmailAPI(email, otp),
    onSuccess: () => {
      toast.success('Account created successfully');
      router.push(AUTH_ROUTES.LOGIN);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Verification failed. Please check the OTP code.');
    },
  });

  const resendVerifyEmailMutation = useMutation({
    mutationFn: resendVerifyEmailAPI,
    onSuccess: () => {
      toast.success('Verification code resent. Please check your email.');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Could not resend verification code.');
    },
  });

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
    const emailError = validateEmail(email);
    if (emailError) {
      toast.error(emailError);
      return;
    }
    if (otp.length < 6) {
      toast.error('OTP must contain at least 6 characters.');
      return;
    }

    verifyEmailMutation.mutate({ email, otp });
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Could not find the email for resending the code.');
      return;
    }
    const emailError = validateEmail(email);
    if (emailError) {
      toast.error(emailError);
      return;
    }
    resendVerifyEmailMutation.mutate(email);
  };

  const isLoading = verifyEmailMutation.isPending;
  const isResending = resendVerifyEmailMutation.isPending;

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
              <div className="w-12 h-12 rounded-[8px] flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <Image src={logoIcon} width={48} height={48} alt="Logo" className="w-12 h-12 object-contain" priority />
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-950 tracking-tight">Verify Email</h1>
            <p className="text-gray-600 text-[0.8125rem] mt-1.5 font-semibold">
              Please enter the 6-digit OTP sent to <br />
              <span className="font-bold text-gray-950">{email || 'your email'}</span>
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white/50 border border-white/30 rounded-full flex items-center justify-center">
              <MailCheck className="w-8 h-8 text-[#2563EB]" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[0.8125rem] font-semibold text-gray-800 mb-1.5 text-center">Verification code (OTP)</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} placeholder="Enter 6 digits"
                className="w-full text-center px-4 py-3 bg-white/45 border border-gray-200/35 rounded-[6px] font-sans text-[0.8125rem] font-medium text-gray-900 placeholder:text-gray-500 focus:bg-white/95 focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-all shadow-inner" />
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-3 bg-[#2563EB] text-white rounded-[6px] font-bold hover:bg-[#1D4ED8] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Verifying...</> : 'Verify account'}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-4">
            <button type="button" onClick={handleResend} disabled={isResending || !email}
              className="text-[0.8125rem] font-semibold text-[#2563EB] hover:text-[#1D4ED8] disabled:opacity-50 transition-colors flex items-center gap-1">
              {isResending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Resend verification code
            </button>

            <Link href={AUTH_ROUTES.LOGIN} className="text-[0.8125rem] text-gray-600 hover:text-gray-950 font-medium flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
