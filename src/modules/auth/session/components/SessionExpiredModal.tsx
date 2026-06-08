'use client';

import React from 'react';
import { useSessionStore } from '../../shared/stores/authStore';
import { useAuth } from '../../shared/hooks/useAuth';
import { AlertTriangle } from 'lucide-react';

const SessionExpiredModal: React.FC = () => {
  const { showExpiredModal, closeSessionExpiredModal } = useSessionStore();
  const { logout } = useAuth();

  if (!showExpiredModal) return null;

  const handleLoginAgain = () => {
    closeSessionExpiredModal();
    logout();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white dark:bg-[#202020] rounded-[10px] border border-[#EAEAEA] dark:border-white/8 p-8 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="text-center">
          <div className="w-14 h-14 bg-[#FBF3DB] dark:bg-[rgba(149,100,0,0.12)] rounded-[10px] flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-[#956400] dark:text-[#F59E0B]" />
          </div>
          <h2 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7] mb-2">Session expired</h2>
          <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] mb-6">
            Your session has expired due to inactivity. Please sign in again to continue.
          </p>
          <button
            onClick={handleLoginAgain}
            className="w-full py-2.5 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] text-[0.8125rem] font-semibold hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors"
          >
            Sign in again
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
