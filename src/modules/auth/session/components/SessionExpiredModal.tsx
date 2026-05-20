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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95">
        <div className="text-center">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Phiên đã hết hạn</h2>
          <p className="text-sm text-gray-500 mb-6">
            Phiên đăng nhập của bạn đã hết hạn do không hoạt động. Vui lòng đăng nhập lại để tiếp tục.
          </p>
          <button onClick={handleLoginAgain}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
            Đăng nhập lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;