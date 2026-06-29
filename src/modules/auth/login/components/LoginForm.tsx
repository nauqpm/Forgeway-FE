'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../shared/hooks/useAuth';
import { initiateGoogleLogin } from '../../sso/services/ssoService';
import { extractLoginRetryDetails } from '../../shared/services/authService';
import { AuthErrorCode } from '../../shared/types/auth.types';
import { validateEmail } from '../../shared/utils/emailValidation';
import { extractApiErrorCode } from '@/shared/utils/apiError';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react';
import Image from 'next/image';
import logoIcon from '../../../../../app/icon.png';

const LEGACY_LOGIN_RETRY_STORAGE_KEY = 'sdlc-platform-login-retry';
const LOGIN_RETRY_STORAGE_KEY = 'sdlc-platform-login-retry-v2';

type StoredLoginRetry = {
  email: string;
  retryAt: string;
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const CREDENTIAL_ERROR_CODES = new Set<string>([
  AuthErrorCode.INVALID_CREDENTIALS,
  AuthErrorCode.ACCOUNT_LOCKED,
  AuthErrorCode.USER_SUSPENDED,
  AuthErrorCode.USER_DEACTIVATED,
]);

const getRetrySeconds = (retryAt: string | null, now: number): number => {
  if (!retryAt) return 0;
  const timestamp = Date.parse(retryAt);
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, Math.ceil((timestamp - now) / 1000));
};

const readStoredLoginRetry = (): StoredLoginRetry | null => {
  if (typeof window === 'undefined') return null;

  try {
    window.sessionStorage.removeItem(LEGACY_LOGIN_RETRY_STORAGE_KEY);
    const raw = window.sessionStorage.getItem(LOGIN_RETRY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredLoginRetry>;
    if (!parsed.retryAt || Date.parse(parsed.retryAt) <= Date.now()) {
      window.sessionStorage.removeItem(LOGIN_RETRY_STORAGE_KEY);
      return null;
    }
    return {
      email: normalizeEmail(parsed.email ?? ''),
      retryAt: parsed.retryAt,
    };
  } catch {
    window.sessionStorage.removeItem(LOGIN_RETRY_STORAGE_KEY);
    return null;
  }
};

const writeStoredLoginRetry = (value: StoredLoginRetry) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(LOGIN_RETRY_STORAGE_KEY, JSON.stringify(value));
};

const clearStoredLoginRetry = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(LOGIN_RETRY_STORAGE_KEY);
};

function LoginFormInner() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [retryEmail, setRetryEmail] = useState('');
  const [retryAt, setRetryAt] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const { login, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const normalizedEmail = normalizeEmail(email);
  const retrySeconds = retryEmail === normalizedEmail ? getRetrySeconds(retryAt, now) : 0;
  const isCoolingDown = retrySeconds > 0;

  useEffect(() => {
    const storedRetry = readStoredLoginRetry();
    if (!storedRetry) return;
    setRetryEmail(storedRetry.email);
    setRetryAt(storedRetry.retryAt);
    setNow(Date.now());
  }, []);

  useEffect(() => {
    if (!retryAt) return;

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [retryAt]);

  useEffect(() => {
    if (!retryAt) return;
    if (getRetrySeconds(retryAt, now) > 0) return;

    setRetryAt(null);
    setRetryEmail('');
    clearStoredLoginRetry();
  }, [now, retryAt]);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'google_auth_failed') {
      toast.error('Google sign-in failed. Please try again.');
    }
  }, [searchParams]);

  const applyLoginRetry = (nextRetryAt: string) => {
    const nextRetry = {
      email: normalizedEmail,
      retryAt: nextRetryAt,
    };
    setRetryEmail(nextRetry.email);
    setRetryAt(nextRetry.retryAt);
    setNow(Date.now());
    writeStoredLoginRetry(nextRetry);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isCoolingDown) return;
    setEmailError(null);
    setCredentialError(null);

    const nextEmailError = validateEmail(email);
    if (nextEmailError) {
      setEmailError(nextEmailError);
      return;
    }

    try {
      await login({ email, password });
      clearStoredLoginRetry();
      toast.success('Welcome back!');
    } catch (error) {
      const retryDetails = extractLoginRetryDetails(error);
      if (retryDetails) {
        applyLoginRetry(retryDetails.retryAt);
      } else {
        setRetryAt(null);
        setRetryEmail('');
        clearStoredLoginRetry();
      }
      if (CREDENTIAL_ERROR_CODES.has(extractApiErrorCode(error, ''))) {
        setCredentialError('Email or password is incorrect.');
      }
      // Non-credential error toasts are handled in useAuth.login.
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
              <div className="w-12 h-12 rounded-[8px] flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <Image src={logoIcon} width={48} height={48} alt="Logo" className="w-12 h-12 object-contain" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-950 tracking-tight">Welcome back</h1>
            <p className="text-gray-600 text-[0.8125rem] mt-1.5 font-semibold">Sign in to your SDLC platform account</p>
          </div>

          <button onClick={initiateGoogleLogin} type="button"
            className="w-full mb-6 py-3 px-4 flex items-center justify-center gap-3 bg-white/50 hover:bg-white/80 border border-white/30 rounded-[6px] hover:border-white transition-all font-medium text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-gray-300/40" />
            <span className="flex-shrink mx-4 text-gray-500 text-xs font-semibold">or continue with email</span>
            <div className="flex-grow border-t border-gray-300/40" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[0.8125rem] font-semibold text-gray-800 mb-1.5">Email</label>
              <input type="text" inputMode="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(null); setCredentialError(null); }} required placeholder="JaneDoe@gmail.com"
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'login-email-error' : undefined}
                className={`w-full px-4 py-2.5 bg-white/45 border rounded-[6px] text-[0.8125rem] text-gray-900 placeholder:text-gray-500 focus:bg-white/95 focus:ring-2 outline-none transition-all shadow-inner disabled:opacity-50 ${emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200/35 focus:border-[#2563EB] focus:ring-[#2563EB]'}`} />
              {emailError && (
                <p id="login-email-error" role="alert" className="mt-1.5 text-xs font-medium text-red-700">
                  {emailError}
                </p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[0.8125rem] font-semibold text-gray-800">Password</label>
                <Link href="/forgot-password" className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold">Forgot password?</Link>
              </div>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setCredentialError(null); }} required
                  placeholder="Enter your password"
                  aria-invalid={Boolean(credentialError)}
                  aria-describedby={credentialError ? 'login-credential-error' : undefined}
                  className={`w-full px-4 py-2.5 pr-11 bg-white/45 border rounded-[6px] text-[0.8125rem] text-gray-900 placeholder:text-gray-500 focus:bg-white/95 focus:ring-2 outline-none transition-all shadow-inner disabled:opacity-50 ${credentialError ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200/35 focus:border-[#2563EB] focus:ring-[#2563EB]'}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {credentialError && (
                <p id="login-credential-error" role="alert" className="mt-1.5 text-xs font-medium text-red-700">
                  {credentialError}
                </p>
              )}
            </div>

            {isCoolingDown && (
              <div className="flex items-start gap-2 rounded-[6px] border border-amber-300/80 bg-amber-50/85 px-3 py-2 text-[0.8125rem] font-semibold text-amber-800">
                <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>Please wait {retrySeconds}s before trying again.</span>
              </div>
            )}

            <button type="submit" disabled={isLoading || isCoolingDown}
              className="w-full py-3 bg-[#2563EB] text-white rounded-[6px] font-bold hover:bg-[#1D4ED8] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : isCoolingDown ? `Try again in ${retrySeconds}s` : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[0.8125rem] text-gray-600 mt-6 font-medium">
            Do not have an account?{' '}
            <Link href="/register" className="text-[#2563EB] font-bold hover:text-[#1D4ED8] transition-colors">Sign up for free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FBFBFA] dark:bg-[#1A1A1A] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" /></div>}>
      <LoginFormInner />
    </Suspense>
  );
}
