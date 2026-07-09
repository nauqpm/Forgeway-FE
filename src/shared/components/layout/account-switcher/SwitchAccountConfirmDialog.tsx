'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SwitchAccountConfirmDialogProps {
  open: boolean;
  accountName: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function SwitchAccountConfirmDialog({
  open,
  accountName,
  isSubmitting,
  onCancel,
  onConfirm,
}: SwitchAccountConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSubmitting, onCancel, open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="switch-account-dialog-title"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className="absolute inset-0 bg-black/35"
        onClick={isSubmitting ? undefined : onCancel}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl dark:bg-[#202020]">
        <h3
          id="switch-account-dialog-title"
          className="text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]"
        >
          Switch account
        </h3>
        <p className="mt-2 text-sm text-[#787774] dark:text-[#9B9A97]">
          Continue as{' '}
          <span className="font-medium text-[#111111] dark:text-[#E8E8E7]">
            {accountName}
          </span>
          ?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-md border border-[#EAEAEA] bg-[#F9F9F8] px-3 py-2 text-sm text-[#111111] transition-colors hover:bg-[#F0F0EE] disabled:opacity-60 dark:border-white/10 dark:bg-[#252525] dark:text-[#E8E8E7] dark:hover:bg-[#2E2E2E]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="rounded-md bg-[#2563EB] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Switching...' : 'Switch'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
