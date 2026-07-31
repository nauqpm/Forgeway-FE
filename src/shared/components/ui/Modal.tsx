"use client";

import { useEffect, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  hideCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
}

const sizeClasses: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "w-full max-w-sm",
  md: "w-full max-w-md",
  lg: "w-full max-w-lg",
  xl: "w-full max-w-2xl",
};

function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  hideCloseButton = false,
  closeOnBackdrop = true,
  className = "",
}: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const content = (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/25"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Container */}
      <div
        ref={containerRef}
        className={[
          "relative z-10 flex flex-col",
          "bg-white dark:bg-[#202020]",
          "border border-[#EAEAEA] dark:border-white/[0.06]",
          "rounded-[10px]",
          "shadow-float",
          "max-h-[90vh]",
          sizeClasses[size],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)" }}
      >
        {/* Header */}
        {(title || !hideCloseButton) && (
          <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#EAEAEA] dark:border-white/[0.06] flex-shrink-0">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-[#111111] dark:text-[#E8E8E7]"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-0.5 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
                  {description}
                </p>
              )}
            </div>
            {!hideCloseButton && (
              <button
                onClick={onClose}
                className="flex-shrink-0 -mt-0.5 -mr-1 flex items-center justify-center w-7 h-7 rounded-[6px] text-[#ABABAB] hover:text-[#111111] hover:bg-[#F7F6F3] dark:text-[#6B6B6B] dark:hover:text-[#E8E8E7] dark:hover:bg-white/5 transition-colors duration-150"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#EAEAEA] dark:border-white/[0.06] flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

// ── Convenience sub-components for footer patterns ───────────────────────────
interface ModalFooterProps {
  onCancel?: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
  children?: ReactNode;
}

function ModalFooter({
  onCancel,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  loading = false,
  children,
}: ModalFooterProps) {
  if (children) return <>{children}</>;

  const confirmBase =
    "inline-flex items-center justify-center h-8 px-3 text-[0.8125rem] font-medium rounded-[6px] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed";

  const confirmStyles =
    confirmVariant === "danger"
      ? "bg-[#FDEBEC] text-[#9F2F2D] border border-[#F5C6C7] hover:bg-[#FADDDE] dark:bg-[rgba(159,47,45,0.15)] dark:text-[#E07B79] dark:border-[rgba(159,47,45,0.3)]"
      : "bg-[#111111] text-white hover:bg-[#2F2F2F] dark:bg-[#E8E8E7] dark:text-[#111111] dark:hover:bg-[#D0D0CE]";

  return (
    <>
      {onCancel && (
        <button
          onClick={onCancel}
          className="inline-flex items-center justify-center h-8 px-3 text-[0.8125rem] font-medium rounded-[6px] bg-[#F9F9F8] text-[#111111] border border-[#EAEAEA] hover:bg-[#F0F0EE] dark:bg-[#252525] dark:text-[#E8E8E7] dark:border-white/10 dark:hover:bg-[#2E2E2E] transition-all duration-150"
        >
          {cancelLabel}
        </button>
      )}
      {onConfirm && (
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`${confirmBase} ${confirmStyles}`}
        >
          {loading ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            confirmLabel
          )}
        </button>
      )}
    </>
  );
}

export { Modal, ModalFooter };
export type { ModalProps, ModalFooterProps };
