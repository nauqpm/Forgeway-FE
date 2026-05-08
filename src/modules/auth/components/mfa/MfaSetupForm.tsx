'use client';

import React, { useState } from 'react';
import { useMfa } from '../../hooks/useMfa';
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
    const text = `AL-TASK Backup Codes\n${'='.repeat(30)}\n\n${setupData.backupCodes.join('\n')}\n\nLưu ý: Mỗi mã chỉ dùng được 1 lần.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'al-task-backup-codes.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Thiết lập MFA</h2>
        </div>

        {step === 'init' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">Bảo vệ tài khoản với xác thực hai yếu tố (TOTP).</p>
            <button onClick={handleStart} disabled={loading}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Đang thiết lập...</> : 'Bắt đầu thiết lập'}
            </button>
          </div>
        )}

        {step === 'qr' && setupData && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">Quét mã QR bằng ứng dụng xác thực (Google Authenticator, Authy...)</p>
            <div className="flex justify-center p-4 bg-white border border-gray-100 rounded-xl">
              <img src={setupData.qrCodeUrl} alt="QR Code" className="w-48 h-48" />
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <code className="text-xs flex-1 break-all text-gray-700">{setupData.secret}</code>
              <button onClick={copySecret} className="flex-shrink-0 p-1.5 text-gray-500 hover:text-indigo-600">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button onClick={() => { setStep('verify'); clearError(); }}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">Tiếp tục</button>
          </div>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-gray-600 text-center">Nhập mã 6 chữ số từ ứng dụng xác thực để xác nhận.</p>
            <input type="text" value={verifyCode} onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6)); clearError(); }}
              placeholder="000000" maxLength={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl font-mono tracking-[0.5em] focus:ring-2 focus:ring-indigo-500 outline-none" />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading || verifyCode.length !== 6}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Đang xác thực...' : 'Xác nhận'}
            </button>
          </form>
        )}

        {step === 'backup' && setupData?.backupCodes && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">Lưu mã dự phòng ở nơi an toàn. Mỗi mã chỉ dùng được 1 lần.</p>
            <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-xl">
              {setupData.backupCodes.map((c, i) => (
                <code key={i} className="text-sm font-mono text-gray-700 text-center py-1">{c}</code>
              ))}
            </div>
            <button onClick={downloadBackupCodes}
              className="w-full py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />Tải xuống
            </button>
            <p className="text-xs text-green-600 text-center font-medium">✓ MFA đã được thiết lập thành công!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MfaSetupForm;
