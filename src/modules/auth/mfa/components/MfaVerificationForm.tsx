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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {isTotp ? <KeyRound className="w-8 h-8 text-indigo-600" /> : <Mail className="w-8 h-8 text-indigo-600" />}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Xác thực hai yếu tố</h1>
          <p className="text-gray-500 text-sm mt-2">
            {isTotp ? 'Nhập mã 6 chữ số từ ứng dụng xác thực' : 'Nhập mã 6 chữ số đã gửi đến email'}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {!useBackupCode ? (
            <>
              <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                {code.map((d, i) => (
                  <input key={i} ref={(el) => { inputRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={(e) => handleCodeChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} disabled={loading}
                    className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-colors ${d ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'} focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200`} />
                ))}
              </div>
              {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
              {loading && <div className="flex items-center justify-center gap-2 text-indigo-600 mb-4"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Đang xác thực...</span></div>}
              {method === 'email_otp' && (
                <div className="text-center mb-4">
                  <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || loading}
                    className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed">
                    <RotateCcw className="w-3.5 h-3.5" />{resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : 'Gửi lại mã OTP'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleBackupSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mã dự phòng</label>
                <input type="text" value={backupCode} onChange={(e) => { setBackupCode(e.target.value); clearError(); }}
                  placeholder="Nhập mã dự phòng" disabled={loading}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button type="submit" disabled={loading || !backupCode.trim()}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Đang xác thực...' : 'Xác thực'}
              </button>
            </form>
          )}
          <div className="text-center mt-4 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => { setUseBackupCode(!useBackupCode); clearError(); }}
              className="text-xs text-gray-500 hover:text-indigo-600">{useBackupCode ? '← Quay lại nhập mã' : 'Sử dụng mã dự phòng'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MfaVerificationForm;