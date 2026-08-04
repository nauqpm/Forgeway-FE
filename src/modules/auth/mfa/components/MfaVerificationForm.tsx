'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMfa } from '../hooks/useMfa';
import { KeyRound, Mail, Loader2, RotateCcw } from 'lucide-react';

const MfaVerificationForm: React.FC = () => {
  const { method, loading, error, verifyMfa, requestEmailOtp, clearError } = useMfa();
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [resendCooldown, setResendCooldown] = useState(0);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleCodeChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    clearError();
    const c = [...code]; c[i] = v.slice(-1); setCode(c);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
    const full = c.join('');
    if (full.length === 6) verifyMfa(full);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const c = [...code]; p.split('').forEach((ch, i) => { c[i] = ch; }); setCode(c);
    if (p.length === 6) verifyMfa(p); else inputRefs.current[p.length]?.focus();
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try { await requestEmailOtp(); setResendCooldown(60); setCode(Array(6).fill('')); inputRefs.current[0]?.focus(); } catch {}
  };

  const handleBackupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (backupCode.trim()) verifyMfa(backupCode.trim());
  };

  const isTotp = method === 'totp';

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#1A1A1A] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] rounded-[8px] flex items-center justify-center mx-auto mb-4">
            {isTotp ? <KeyRound className="w-8 h-8 text-[#2563EB] dark:text-[#3B82F6]" /> : <Mail className="w-8 h-8 text-[#2563EB] dark:text-[#3B82F6]" />}
          </div>
          <h1 className="text-2xl font-bold text-[#111111] dark:text-[#E8E8E7]">Two-factor authentication</h1>
          <p className="text-[#787774] dark:text-[#9B9A97] text-[0.8125rem] mt-2">
            {isTotp ? 'Enter the 6-digit code from your authenticator app' : 'Enter the 6-digit code sent to your email'}
          </p>
        </div>
        <div className="bg-white dark:bg-[#202020] rounded-[10px] border border-[#EAEAEA] dark:border-white/[0.06] p-8">
          {!useBackupCode ? (
            <>
              <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                {code.map((d, i) => (
                  <input key={i} ref={(el) => { inputRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={(e) => handleCodeChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} disabled={loading}
                    className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-[6px] outline-none transition-colors dark:bg-[#252525] dark:text-[#E8E8E7] ${d ? 'border-[#2563EB] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.08)]' : 'border-[#EAEAEA] dark:border-white/10'} focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20`} />
                ))}
              </div>
              {error && <p className="text-red-500 text-[0.8125rem] text-center mb-4">{error}</p>}
              {loading && <div className="flex items-center justify-center gap-2 text-[#2563EB] dark:text-[#3B82F6] mb-4"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-[0.8125rem]">Verifying...</span></div>}
              {method === 'email_otp' && (
                <div className="text-center mb-4">
                  <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || loading}
                    className="inline-flex items-center gap-1.5 text-[0.8125rem] text-[#2563EB] dark:text-[#3B82F6] hover:text-[#1D4ED8] disabled:text-[#ABABAB] dark:disabled:text-[#6B6B6B] disabled:cursor-not-allowed">
                    <RotateCcw className="w-3.5 h-3.5" />{resendCooldown > 0 ? `Resend after ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleBackupSubmit} className="space-y-4">
              <div>
                <label className="block text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7] mb-1.5">Backup code</label>
                <input type="text" value={backupCode} onChange={(e) => { setBackupCode(e.target.value); clearError(); }}
                  placeholder="Enter backup code" disabled={loading}
                  className="w-full px-4 py-2.5 border border-[#EAEAEA] dark:border-white/[0.06] rounded-[6px] text-[0.8125rem] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none font-mono" />
              </div>
              {error && <p className="text-red-500 text-[0.8125rem] text-center">{error}</p>}
              <button type="submit" disabled={loading || !backupCode.trim()}
                className="w-full py-2.5 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] font-semibold hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
          )}
          <div className="text-center mt-4 pt-4 border-t border-[#EAEAEA] dark:border-white/[0.06]">
            <button type="button" onClick={() => { setUseBackupCode(!useBackupCode); clearError(); }}
              className="text-xs text-[#787774] dark:text-[#9B9A97] hover:text-[#2563EB] dark:hover:text-[#3B82F6]">{useBackupCode ? '← Back to code entry' : 'Use backup code'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MfaVerificationForm;
