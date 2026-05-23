import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Check, Mail, Briefcase, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';
import { toast } from 'react-hot-toast';
import { inviteService } from '@/modules/client/workspaces/services/inviteService';

// --- MOCK DATA ---
const EXISTING_USERS = [
  { id: '1', name: 'Nguyễn Văn A', email: 'nva@company.com', avatar: 'N', color: 'bg-indigo-500' },
  { id: '2', name: 'Trần Thị B', email: 'ttb@company.com', avatar: 'T', color: 'bg-emerald-500' },
  { id: '3', name: 'Lê Văn C', email: 'lvc@company.com', avatar: 'L', color: 'bg-blue-500' },
  { id: '4', name: 'Maria Garcia', email: 'maria@company.com', avatar: 'M', color: 'bg-pink-500' },
  { id: '5', name: 'John Doe', email: 'john@company.com', avatar: 'J', color: 'bg-amber-500' },
];

const QUICK_SUGGESTIONS = [
  { id: '6', name: 'DL Do Thanh Loc', email: 'loc@company.com' },
  { id: '7', name: 'HN Hoang Nam', email: 'nam@company.com' },
];

const ROLES = [
  { value: 'workspace_admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' }
];

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export default function InviteModal({ isOpen, onClose, projectId }: InviteModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<any[]>([]);
  const [role, setRole] = useState('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [suggestions, setSuggestions] = useState(QUICK_SUGGESTIONS);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedOptions([]);
      setRole('member');
      setSuggestions(QUICK_SUGGESTIONS);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleQuickAdd = (user: typeof QUICK_SUGGESTIONS[0]) => {
    const newOption = {
      value: user.id,
      label: `${user.name} (${user.email})`,
      isFixed: false,
      user
    };
    if (!selectedOptions.find(o => o.value === user.id)) {
      setSelectedOptions([...selectedOptions, newOption]);
    }
    // Remove from suggestions
    setSuggestions(suggestions.filter(s => s.id !== user.id));
  };

  const handleSubmit = async () => {
    if (selectedOptions.length === 0) return;
    setIsSubmitting(true);

    try {
      const emails = selectedOptions.map(opt => String(opt.value));
      const results = await Promise.allSettled(
        emails.map(email =>
          inviteService.sendInvite(projectId, {
            email,
            role: role as 'workspace_admin' | 'member' | 'viewer',
          })
        )
      );

      const failed = results
        .map((r, i) => ({ r, email: emails[i] }))
        .filter(({ r }) => r.status === 'rejected');

      if (failed.length === 0) {
        toast.success(`Đã gửi lời mời tới ${emails.length} người.`);
        onClose();
      } else if (failed.length < emails.length) {
        const failedEmails = failed.map(({ email, r }) => {
          const msg = (r as PromiseRejectedResult).reason?.response?.data?.message;
          return msg ? `${email} (${msg})` : email;
        });
        toast.error(`Một số lời mời thất bại: ${failedEmails.join(', ')}`);
      } else {
        const firstMsg = (failed[0].r as PromiseRejectedResult).reason?.response?.data?.message;
        toast.error(firstMsg || 'Không thể gửi lời mời.');
      }
    } catch {
      toast.error('Không thể gửi lời mời.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert existing users to react-select options format
  const selectOptions = EXISTING_USERS.map(u => ({
    value: u.email, // using email as ID for simplcity if they are new
    label: `${u.name} (${u.email})`,
    user: u
  }));

  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  const customStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: isDark ? '#111827' : '#ffffff',
      minHeight: '44px',
      borderColor: state.isFocused ? '#6366f1' : isDark ? '#374151' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#6366f1' : isDark ? '#4b5563' : '#9ca3af'
      },
      borderRadius: '0.5rem'
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: isDark ? '#111827' : '#ffffff',
      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      boxShadow: isDark
        ? '0 20px 25px -5px rgb(0 0 0 / 0.45)'
        : '0 20px 25px -5px rgb(0 0 0 / 0.1)',
      zIndex: 60,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused
        ? isDark ? '#1f2937' : '#eef2ff'
        : isDark ? '#111827' : '#ffffff',
      color: isDark ? '#f9fafb' : '#111827',
      ':active': {
        backgroundColor: isDark ? '#374151' : '#e0e7ff',
      },
    }),
    input: (base: any) => ({
      ...base,
      color: isDark ? '#ffffff' : '#111827',
    }),
    placeholder: (base: any) => ({
      ...base,
      color: isDark ? '#9ca3af' : '#6b7280',
    }),
    singleValue: (base: any) => ({
      ...base,
      color: isDark ? '#ffffff' : '#111827',
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: isDark ? '#312e81' : '#f3f4f6',
      borderRadius: '0.375rem',
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: isDark ? '#e0e7ff' : '#374151',
      fontSize: '0.875rem',
      fontWeight: 500,
      padding: '2px 6px',
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: isDark ? '#c7d2fe' : '#6b7280',
      ':hover': {
        backgroundColor: isDark ? '#4338ca' : '#e5e7eb',
        color: isDark ? '#fecaca' : '#ef4444',
      },
    }),
    clearIndicator: (base: any) => ({
      ...base,
      color: isDark ? '#9ca3af' : '#6b7280',
      ':hover': { color: isDark ? '#e5e7eb' : '#374151' },
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: isDark ? '#9ca3af' : '#6b7280',
      ':hover': { color: isDark ? '#e5e7eb' : '#374151' },
    }),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add people to this Workspace</h2>
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
                  Names or emails <span className="text-red-500">*</span>
                </label>
                <CreatableSelect
                  isMulti
                  options={selectOptions}
                  value={selectedOptions}
                  onChange={(val: any) => setSelectedOptions(val || [])}
                  styles={customStyles}
                  placeholder="e.g. maria@company.com"
                  isValidNewOption={(inputValue) => !!validateEmail(inputValue)}
                  formatCreateLabel={(inputValue) => `Invite "${inputValue}"`}
                  noOptionsMessage={() => "Type a valid email to invite"}
                />
              </div>

              <div className="w-full sm:w-32">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 h-[44px]"
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Quick Suggestions</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleQuickAdd(user)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium transition-colors border border-indigo-100 dark:border-indigo-800"
                    >
                      <span className="text-indigo-600 dark:text-indigo-300">+</span> {user.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-950/70 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start gap-4">
            <button 
              onClick={handleCopyLink}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <LinkIcon className="w-4 h-4" />}
              {isCopied ? <span className="text-green-600">Copied</span> : 'Copy link'}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            
            <button 
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 bg-gray-100 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={selectedOptions.length === 0 || isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Sending...' : 'Add'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
