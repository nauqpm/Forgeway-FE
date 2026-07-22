import React, { useState, useEffect } from "react";
import { X, Link as LinkIcon, Check, Loader2, Search, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import RoleChanger, {
  WorkspaceRoleValue,
} from "@/modules/workspace/shared/components/RoleChanger";
import { inviteService } from "@/modules/workspace/shared/services/inviteService";

interface SearchUserResult {
  _id?: string;
  id?: string;
  email: string;
  fullName?: string;
  avatar?: string;
  isGuest?: boolean;
}

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const inputCls = "w-full px-3 py-2 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] text-[0.8125rem] outline-none transition-colors focus:border-[#2563EB] dark:focus:border-[#3B82F6]";

export default function InviteModal({ isOpen, onClose, projectId }: InviteModalProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<SearchUserResult[]>([]);
  const [role, setRole] = useState<WorkspaceRoleValue>("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: users = [], isFetching: loading } = useQuery({
    queryKey: ['workspace', 'invite', 'searchUsers', debouncedSearch],
    queryFn: () => inviteService.searchSystemUsers(debouncedSearch),
  });

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setDebouncedSearch("");
      setSelectedUsers([]);
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

  const toggleUserSelection = (user: SearchUserResult) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.email === user.email);
      if (exists) {
        return prev.filter((u) => u.email !== user.email);
      }
      return [...prev, user];
    });
  };

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
    const emails = selectedUsers.map(u => u.email);
    if (emails.length === 0) return;

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

  const emails = selectedUsers.map(u => u.email);
  const canSubmit = emails.length > 0 && !isSubmitting && !isGeneratingLink;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#202020] rounded-[10px] border border-[#EAEAEA] dark:border-white/[0.06] overflow-hidden flex flex-col max-h-[90vh]"
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
            <div className="flex-1 w-full flex flex-col min-h-0 h-[300px]">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97]">
                  Select members <span className="text-[#9F2F2D]">*</span>
                </label>
                {selectedUsers.length > 0 && (
                  <span className="text-xs text-[#2563EB] dark:text-[#3B82F6] font-medium bg-[#EFF6FF] dark:bg-[#1E3A8A] px-2 py-0.5 rounded-full">
                    {selectedUsers.length} selected
                  </span>
                )}
              </div>
              <div className="relative mb-3 flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ABABAB]" />
                <input 
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`${inputCls} pl-9 h-10`}
                />
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] p-2 bg-[#FBFBFA] dark:bg-[#202020]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-[#787774]">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <p className="text-xs">Loading...</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {validateEmail(search.trim()) && !users.some((u: SearchUserResult) => u.email === search.trim()) && (
                      <button
                        disabled={isSubmitting}
                        onClick={() => toggleUserSelection({ email: search.trim(), fullName: search.trim(), isGuest: true })}
                        className="w-full flex items-center gap-3 p-2 rounded-[6px] hover:bg-[#EFF6FF] dark:hover:bg-[#1E3A8A]/30 border border-[#2563EB]/30 transition-colors group text-left disabled:opacity-50"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A] flex items-center justify-center text-[#2563EB] dark:text-[#60A5FA] flex-shrink-0">
                          <LinkIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[0.875rem] text-[#2563EB] dark:text-[#60A5FA] truncate">Invite &quot;{search.trim()}&quot;</p>
                          <p className="text-[0.75rem] text-[#787774] dark:text-[#9B9A97] truncate">Send an email invitation</p>
                        </div>
                      </button>
                    )}
                    
                    {users.length === 0 && !validateEmail(search.trim()) && (
                      <div className="py-10 text-center text-[#787774]">
                        <p className="text-sm italic">
                          {search ? `No users found matching "${search}"` : 'No users available'}
                        </p>
                      </div>
                    )}

                    {users.map((user: SearchUserResult, idx: number) => {
                      const isSelected = selectedUsers.some(u => u.email === user.email);
                      return (
                        <button
                          key={user._id || user.id || `u-${idx}`}
                          disabled={isSubmitting}
                          onClick={() => toggleUserSelection(user)}
                          className="w-full flex items-center justify-between p-2 rounded-[6px] hover:bg-white dark:hover:bg-[#2A2A2A] border border-transparent hover:border-[#EAEAEA] dark:hover:border-white/[0.08] transition-colors group text-left disabled:opacity-50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center text-white text-xs font-bold shadow-sm overflow-hidden flex-shrink-0">
                              {user.avatar ? (
                                <img 
                                  src={user.avatar} 
                                  alt={user.fullName} 
                                  className="w-full h-full object-cover" 
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const parent = (e.target as HTMLImageElement).parentElement;
                                    if (parent && !parent.querySelector('span')) {
                                      const span = document.createElement('span');
                                      span.innerText = user.fullName?.charAt(0).toUpperCase() || 'U';
                                      parent.appendChild(span);
                                    }
                                  }}
                                />
                              ) : (
                                <User className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[0.875rem] text-[#111111] dark:text-[#E8E8E7] truncate">{user.fullName || user.email || 'User'}</p>
                              <p className="text-[0.75rem] text-[#787774] dark:text-[#9B9A97] truncate">{user.email}</p>
                            </div>
                          </div>
                          
                          <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                            isSelected 
                              ? 'bg-[#2563EB] dark:bg-[#3B82F6] border-[#2563EB] dark:border-[#3B82F6]' 
                              : 'border-[#ABABAB] dark:border-[#6B6B6B]'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <RoleChanger
              value={role}
              onChange={setRole}
              disabled={isSubmitting || isGeneratingLink}
              compact
              className="w-full sm:w-[11rem] flex-shrink-0 mt-6 sm:mt-0"
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
