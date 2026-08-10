"use client";

import React, { useState, useRef } from "react";
import { Modal, ModalFooter } from "@/shared/components/ui/Modal";

interface ConvertSubtaskConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  subtaskTitle: string;
}

export default function ConvertSubtaskConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  subtaskTitle,
}: ConvertSubtaskConfirmModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const isConvertingRef = useRef(false);
  const expectedText = "convert";
  const isValid = confirmText === expectedText;

  if (!isOpen) return null;

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  const handleConfirm = async () => {
    if (isConvertingRef.current) return;
    isConvertingRef.current = true;
    setIsConverting(true);
    try {
      await onConfirm();
    } finally {
      isConvertingRef.current = false;
      setIsConverting(false);
      setConfirmText("");
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Convert to Task"
      footer={
        <ModalFooter
          onCancel={handleClose}
          onConfirm={isValid && !isConverting ? handleConfirm : undefined}
          confirmLabel={isConverting ? "Converting..." : "Convert"}
        />
      }
    >
      <div className="space-y-4">
        <p className="text-[0.875rem] text-[#37352F] dark:text-[#E8E8E7]">
          Are you sure you want to convert the subtask <strong>{subtaskTitle}</strong> into a standalone task? It will be removed from this parent task.
        </p>
        <div>
          <label className="block text-[0.8125rem] font-medium text-[#787774] mb-1.5">
            Please type <span className="font-semibold text-[#111111] dark:text-white">{expectedText}</span> to confirm.
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isValid && !isConverting) {
                e.preventDefault();
                handleConfirm();
              }
            }}
            className="w-full px-3 py-2 text-[0.875rem] border border-[#EAEAEA] dark:border-[#333333] rounded bg-white dark:bg-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-[#111111] dark:text-white"
            placeholder={expectedText}
            autoFocus
          />
        </div>
      </div>
    </Modal>
  );
}
