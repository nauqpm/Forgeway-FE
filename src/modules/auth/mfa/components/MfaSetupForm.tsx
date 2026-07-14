'use client';

import React, { useState } from 'react';
import { useMfa } from '../hooks/useMfa';
import { Shield, Copy, Download, Check, Loader2 } from 'lucide-react';

const MfaSetupForm: React.FC = () => {
  const { setupData, loading, error, setupTotp, confirmTotp, clearError } = useMfa();
  const [step, setStep] = useState<'init' | 'qr' | 'verify' | 'backup'>('init');
  const [verifyCode, setVerifyCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleStart = async () => {
    try { await setupTotp(); setStep('qr'); } catch {}
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await confirmTotp(verifyCode); setStep('backup'); } catch {}
  };

  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;
    const text = `AL-TASK Backup Codes\n${'='.repeat(30)}\n\n${setupData.backupCodes.join('\n')}\n\nNote: Each code can only be used once.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'al-task-backup-codes.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-[#202020] rounded-[10px] border border-[#EAEAEA] dark:border-white/[0.06] p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] rounded-[8px] flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-[#2563EB] dark:text-[#3B82F6]" />
          </div>
          <h2 className="text-[0.9375rem] font-bold text-[#111111] dark:text-[#E8E8E7]">Set up MFA</h2>
        </div>

        {step === 'init' && (
          <div className="space-y-4">
            <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] text-center">Protect your account with two-factor authentication (TOTP).</p>
            <button onClick={handleStart} disabled={loading}
              className="w-full py-2.5 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] font-semibold hover:bg-[#1D4ED8] disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Setting up...</> : 'Start setup'}
            </button>
          </div>
        )}

        {step === 'qr' && setupData && (
          <div className="space-y-4">
            <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] text-center">Scan the QR code with an authenticator app such as Google Authenticator or Authy.</p>
            <div className="flex justify-center p-4 bg-white dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px]">
              <img src={setupData.qrCodeUrl} alt="QR Code" className="w-48 h-48" />
            </div>
            <div className="flex items-center gap-2 p-3 bg-[#F9F9F8] dark:bg-[#252525] rounded-[6px]">
              <code className="text-xs flex-1 break-all text-[#111111] dark:text-[#E8E8E7]">{setupData.secret}</code>
              <button onClick={copySecret} className="flex-shrink-0 p-1.5 text-[#787774] dark:text-[#9B9A97] hover:text-[#2563EB] dark:hover:text-[#3B82F6]">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button onClick={() => { setStep('verify'); clearError(); }}
              className="w-full py-2.5 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] font-semibold hover:bg-[#1D4ED8]">Continue</button>
          </div>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] text-center">Enter the 6-digit code from your authenticator app to confirm.</p>
            <input type="text" value={verifyCode} onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6)); clearError(); }}
              placeholder="000000" maxLength={6}
              className="w-full px-4 py-3 border border-[#EAEAEA] dark:border-white/[0.06] rounded-[6px] text-center text-2xl font-mono tracking-[0.5em] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none" />
            {error && <p className="text-red-500 text-[0.8125rem] text-center">{error}</p>}
            <button type="submit" disabled={loading || verifyCode.length !== 6}
              className="w-full py-2.5 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] font-semibold hover:bg-[#1D4ED8] disabled:opacity-50">
              {loading ? 'Verifying...' : 'Confirm'}
            </button>
          </form>
        )}

        {step === 'backup' && setupData?.backupCodes && (
          <div className="space-y-4">
            <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] text-center">Store backup codes in a safe place. Each code can only be used once.</p>
            <div className="grid grid-cols-2 gap-2 p-4 bg-[#F9F9F8] dark:bg-[#252525] rounded-[8px]">
              {setupData.backupCodes.map((c, i) => (
                <code key={i} className="text-[0.8125rem] font-mono text-[#111111] dark:text-[#E8E8E7] text-center py-1">{c}</code>
              ))}
            </div>
            <button onClick={downloadBackupCodes}
              className="w-full py-2.5 border border-[#EAEAEA] dark:border-white/10 rounded-[6px] font-medium text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />Download
            </button>
            <p className="text-xs text-green-600 dark:text-green-400 text-center font-medium">MFA has been set up successfully!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MfaSetupForm;
