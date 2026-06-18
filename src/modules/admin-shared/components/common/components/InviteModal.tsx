import React, { useState, useEffect } from "react";
import { X, Link as LinkIcon, Check, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import RoleChanger, {
  WorkspaceRoleValue,
} from "@/modules/workspace/shared/components/RoleChanger";
import { inviteService } from "@/modules/workspace/shared/services/inviteService";

const EMAIL_SPLIT_REGEX = /[\s,;]+/;

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const inputCls = "w-full px-3 py-2 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] text-[0.8125rem] outline-none transition-colors focus:border-[#2563EB] dark:focus:border-[#3B82F6]";

export default function InviteModal({ isOpen, onClose, projectId }: InviteModalProps) {
  const [emailInput, setEmailInput] = useState("");
  const [role, setRole] = useState<WorkspaceRoleValue>("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmailInput("");
      setRole("member");
      setIsCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      );
  };

  const parseEmails = () =>
    emailInput
      .split(EMAIL_SPLIT_REGEX)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

  const getInvalidEmails = (emails: string[]) =>
    emails.filter((email) => !validateEmail(email));

  const handleCopyLink = async () => {
    setIsGeneratingLink(true);
    try {
      const { inviteUrl } = await inviteService.createInviteLink(projectId, role);
      await navigator.clipboard.writeText(inviteUrl);
      setIsCopied(true);
      toast.success("Invite link copied.");
      setTimeout(() => setIsCopied(false), 2000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not generate invite link.");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleSubmit = async () => {
    const emails = parseEmails();
    if (emails.length === 0) return;

    const invalidEmails = getInvalidEmails(emails);
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email: ${invalidEmails[0]}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const results = await Promise.allSettled(
        emails.map((email) =>
          inviteService.sendInvite(projectId, {
            email,
            role: role as "workspace_admin" | "member" | "viewer",
          }),
        ),
      );

      const failed = results
        .map((r, i) => ({ r, email: emails[i] }))
        .filter(({ r }) => r.status === "rejected");

      if (failed.length === 0) {
        toast.success(`Invitation sent to ${emails.length} people.`);
        onClose();
      } else if (failed.length < emails.length) {
        const failedEmails = failed.map(({ email, r }) => {
          const msg = (r as PromiseRejectedResult).reason?.response?.data?.message;
          return msg ? `${email} (${msg})` : email;
        });
        toast.error(`Some invitations failed: ${failedEmails.join(", ")}`);
      } else {
        const firstMsg = (failed[0].r as PromiseRejectedResult).reason?.response?.data?.message;
        toast.error(firstMsg || "User is already a member of this workspace.");
      }
    } catch {
      toast.error("User is already a member of this workspace.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const emails = parseEmails();
  const canSubmit = emails.length > 0 && !isSubmitting && !isGeneratingLink;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#202020] rounded-[10px] border border-[#EAEAEA] dark:border-white/[0.06] overflow-hidden flex flex-col max-h-[90vh]"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAEAEA] dark:border-white/[0.06]">
          <h2 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Add people to this Workspace</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[#ABABAB] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <div className="flex-1 w-full">
              <label className="block text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] mb-1.5">
                Emails <span className="text-[#9F2F2D]">*</span>
              </label>
              <textarea
                value={emailInput}
                onChange={(event) => {
                  setEmailInput(event.target.value);
                  if (isCopied) setIsCopied(false);
                }}
                rows={3}
                placeholder="maria@company.com, alex@company.com"
                className={`${inputCls} resize-none placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B]`}
              />
            </div>

            <RoleChanger
              value={role}
              onChange={setRole}
              disabled={isSubmitting || isGeneratingLink}
              compact
              className="w-full sm:w-[9rem]"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#EAEAEA] dark:border-white/[0.06] bg-[#F9F9F8] dark:bg-[#252525] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleCopyLink}
            disabled={isGeneratingLink || isSubmitting}
            className="flex items-center gap-2 text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors disabled:opacity-40"
          >
            {isGeneratingLink ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isCopied ? (
              <Check className="w-3.5 h-3.5 text-[#346538]" />
            ) : (
              <LinkIcon className="w-3.5 h-3.5" />
            )}
            {isGeneratingLink ? "Generating..." : isCopied ? <span className="text-[#346538]">Copied</span> : "Copy link"}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              disabled={isSubmitting || isGeneratingLink}
              className="px-4 py-2 text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7] border border-[#EAEAEA] dark:border-white/[0.08] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex items-center gap-2 px-4 py-2 text-[0.8125rem] font-medium text-white bg-[#2563EB] dark:bg-[#3B82F6] hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] disabled:opacity-40 disabled:cursor-not-allowed rounded-[6px] transition-colors"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isSubmitting ? "Sending..." : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
