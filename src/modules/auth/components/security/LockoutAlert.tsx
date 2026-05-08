'use client';

import React, { useEffect, useState } from 'react';
import type { LockoutInfo } from '../../types/auth.types';
import { ShieldAlert } from 'lucide-react';

interface LockoutAlertProps {
  lockoutInfo: LockoutInfo;
  className?: string;
}

const LockoutAlert: React.FC<LockoutAlertProps> = ({ lockoutInfo, className = '' }) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!lockoutInfo.isLocked || !lockoutInfo.lockedUntil) {
      setRemainingSeconds(null);
      return;
    }

    const calculateRemaining = () => {
      const until = new Date(lockoutInfo.lockedUntil!).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((until - now) / 1000));
      setRemainingSeconds(diff);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [lockoutInfo.isLocked, lockoutInfo.lockedUntil]);

  if (!lockoutInfo.isLocked && lockoutInfo.remainingAttempts >= lockoutInfo.maxAttempts) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`rounded-xl border p-4 ${
        lockoutInfo.isLocked
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-amber-50 border-amber-200 text-amber-700'
      } ${className}`}
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          {lockoutInfo.isLocked ? (
            <>
              <p className="font-semibold">Tài khoản đã bị tạm khóa</p>
              {remainingSeconds !== null && remainingSeconds > 0 ? (
                <p className="mt-1">
                  Vui lòng thử lại sau{' '}
                  <span className="font-mono font-bold">
                    {formatTime(remainingSeconds)}
                  </span>
                </p>
              ) : (
                <p className="mt-1">
                  Vui lòng thử lại hoặc sử dụng chức năng quên mật khẩu.
                </p>
              )}
            </>
          ) : (
            <p>
              Cảnh báo: còn{' '}
              <span className="font-bold">{lockoutInfo.remainingAttempts}</span> lần
              thử trước khi tài khoản bị tạm khóa.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LockoutAlert;