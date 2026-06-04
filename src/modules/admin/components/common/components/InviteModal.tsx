import React, { useState, useEffect } from "react";
import {
  X,
  Link as LinkIcon,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { inviteService } from "@/modules/client/workspaces/services/inviteService";

const ROLES = [
  { value: "workspace_admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

const EMAIL_SPLIT_REGEX = /[\s,;]+/;

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export default function InviteModal({
  isOpen,
  onClose,
  projectId,
}: InviteModalProps) {
  const [emailInput, setEmailInput] = useState("");
  const [role, setRole] = useState("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Reset state when modal opens/closes
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

  const buildInviteLink = (invite: any) => {
    const rawLink = invite?.inviteLink ?? invite?.link ?? invite?.url;
    if (rawLink) {
      return rawLink.startsWith("http")
        ? rawLink
        : `${window.location.origin}${rawLink.startsWith("/") ? "" : "/"}${rawLink}`;
    }

    if (invite?.token) {
      return `${window.location.origin}/invites/accept/${invite.token}`;
    }

    return "";
  };

  const handleCopyLink = async () => {
    setIsGeneratingLink(true);
    try {
      const { inviteUrl } = await inviteService.createInviteLink(projectId, role);
      await navigator.clipboard.writeText(inviteUrl);
      setIsCopied(true);
      toast.success("Invite link copied.");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Could not generate invite link.",
      );
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
          const msg = (r as PromiseRejectedResult).reason?.response?.data
            ?.message;
          return msg ? `${email} (${msg})` : email;
        });
        toast.error(`Some invitations failed: ${failedEmails.join(", ")}`);
      } else {
        const firstMsg = (failed[0].r as PromiseRejectedResult).reason?.response
          ?.data?.message;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add people to this Workspace
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* Input & Role Selector Group */}
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Emails <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={emailInput}
                  onChange={(event) => {
                    setEmailInput(event.target.value);
                    if (isCopied) setIsCopied(false);
                  }}
                  rows={3}
                  placeholder="maria@company.com, alex@company.com"
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div className="w-full sm:w-32">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Role
                </label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 h-[44px]"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                        fillRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-950/70 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start gap-4">
            <button
              onClick={handleCopyLink}
              disabled={isGeneratingLink || isSubmitting}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {isGeneratingLink ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isCopied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <LinkIcon className="w-4 h-4" />
              )}
              {isGeneratingLink ? (
                "Generating..."
              ) : isCopied ? (
                <span className="text-green-600">Copied</span>
              ) : (
                "Copy link"
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              disabled={isSubmitting || isGeneratingLink}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 bg-gray-100 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Sending..." : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
