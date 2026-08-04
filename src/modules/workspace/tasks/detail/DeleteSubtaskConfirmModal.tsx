"use client";

import React, { useState, useRef } from "react";
import { Modal, ModalFooter } from "@/shared/components/ui/Modal";

interface DeleteSubtaskConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  subtaskTitle: string;
}

export default function DeleteSubtaskConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  subtaskTitle,
}: DeleteSubtaskConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const isDeletingRef = useRef(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (isDeletingRef.current) return;
    isDeletingRef.current = true;
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      isDeletingRef.current = false;
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Delete Subtask"
      footer={
        <ModalFooter
          onCancel={onClose}
          onConfirm={!isDeleting ? handleConfirm : undefined}
          confirmLabel={isDeleting ? "Deleting..." : "Delete"}
          confirmVariant="danger"
        />
      }
    >
      <div 
        tabIndex={0} 
        className="outline-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isDeleting) {
            e.preventDefault();
            handleConfirm();
          }
        }}
        autoFocus
      >
        <p className="text-[0.875rem] text-[#37352F] dark:text-[#E8E8E7]">
          Are you sure you want to delete the subtask <strong>{subtaskTitle}</strong>? This cannot be undone.
        </p>
      </div>
    </Modal>
  );
}
