import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Check, Mail, Briefcase, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';
import { toast } from 'react-hot-toast';

const EXISTING_USERS = [
  { id: '1', name: 'Alex Nguyen', email: 'nva@company.com', avatar: 'N', color: 'bg-[#2563EB]' },
  { id: '2', name: 'Taylor Tran', email: 'ttb@company.com', avatar: 'T', color: 'bg-[#4ADE80]' },
  { id: '3', name: 'Chris Le', email: 'lvc@company.com', avatar: 'L', color: 'bg-[#3B82F6]' },
  { id: '4', name: 'Maria Garcia', email: 'maria@company.com', avatar: 'M', color: 'bg-[#F472B6]' },
  { id: '5', name: 'John Doe', email: 'john@company.com', avatar: 'J', color: 'bg-[#F59E0B]' },
];

const QUICK_SUGGESTIONS = [
  { id: '6', name: 'DL Do Thanh Loc', email: 'loc@company.com' },
  { id: '7', name: 'HN Hoang Nam', email: 'nam@company.com' },
];

const ROLES = [
  { value: 'admin', label: 'Admin' },
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
    const newOption = { value: user.id, label: `${user.name} (${user.email})`, isFixed: false, user };
    if (!selectedOptions.find(o => o.value === user.id)) {
      setSelectedOptions([...selectedOptions, newOption]);
    }
    setSuggestions(suggestions.filter(s => s.id !== user.id));
  };

  const handleSubmit = async () => {
    if (selectedOptions.length === 0) return;
    setIsSubmitting(true);

    try {
      const payload = {
        users: selectedOptions.map(opt => opt.value),
        roleId: role,
        captchaToken: 'mock_recaptcha_token_12345'
      };

      console.log('Sending invitation to API for project:', projectId, 'Payload:', payload);
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Invitations sent successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to send invitations.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectOptions = EXISTING_USERS.map(u => ({
    value: u.email,
    label: `${u.name} (${u.email})`,
    user: u
  }));

  const customStyles = {
    control: (base: any, state: any) => ({
      ...base,
      minHeight: '36px',
      borderColor: state.isFocused ? '#2563EB' : '#EAEAEA',
      boxShadow: 'none',
      backgroundColor: state.isFocused ? '#ffffff' : '#ffffff',
      '&:hover': { borderColor: state.isFocused ? '#2563EB' : '#ABABAB' },
      borderRadius: '6px',
      fontSize: '13px',
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: '#EFF6FF',
      borderRadius: '4px',
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: '#1E40AF',
      fontSize: '11px',
      fontWeight: 500,
      padding: '2px 4px',
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: '#93C5FD',
      ':hover': { backgroundColor: '#DBEAFE', color: '#1E40AF' },
    }),
    placeholder: (base: any) => ({
      ...base,
      color: '#ABABAB',
      fontSize: '13px',
    }),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#202020] rounded-[10px] border border-[#EAEAEA] dark:border-white/8 overflow-hidden flex flex-col max-h-[90vh]"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAEAEA] dark:border-white/8">
          <h2 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Add people to this space</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[#ABABAB] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="flex-1 w-full">
                <label className="block text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] mb-1.5">
                  Names or emails <span className="text-[#9F2F2D]">*</span>
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
                <label className="block text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] mb-1.5">Role</label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full appearance-none px-3 py-2 border border-[#EAEAEA] dark:border-white/10 rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] text-[0.8125rem] outline-none focus:border-[#2563EB] h-9 transition-colors"
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#ABABAB]">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {suggestions.length > 0 && (
              <div>
                <p className="text-[0.6875rem] font-medium text-[#ABABAB] dark:text-[#6B6B6B] mb-2 uppercase tracking-wider">Quick Suggestions</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleQuickAdd(user)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] hover:bg-[#DBEAFE] dark:hover:bg-[rgba(37,99,235,0.2)] text-[#1F6C9F] dark:text-[#93C5FD] rounded-[6px] text-[0.6875rem] font-medium transition-colors border border-[#2563EB]/20"
                    >
                      <span>+</span> {user.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#EAEAEA] dark:border-white/8">
              <p className="text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] mb-3">Or invite from integrations</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button className="flex items-center justify-center gap-2 px-3 py-2 border border-[#EAEAEA] dark:border-white/10 rounded-[6px] text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors">
                  <Mail className="w-3.5 h-3.5 text-[#F87171]" /> Google
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 border border-[#EAEAEA] dark:border-white/10 rounded-[6px] text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5 text-[#A855F7]" /> Slack
                </button>
                <button className="flex items-center justify-center gap-2 px-3 py-2 border border-[#EAEAEA] dark:border-white/10 rounded-[6px] text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors">
                  <Briefcase className="w-3.5 h-3.5 text-[#2563EB]" /> Microsoft
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#EAEAEA] dark:border-white/8 bg-[#F9F9F8] dark:bg-[#252525] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 text-[0.8125rem] font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-[#346538]" /> : <LinkIcon className="w-3.5 h-3.5" />}
              {isCopied ? <span className="text-[#346538]">Copied</span> : 'Copy link'}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-[0.625rem] text-[#ABABAB] dark:text-[#6B6B6B] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> reCAPTCHA protected
            </span>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7] border border-[#EAEAEA] dark:border-white/10 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedOptions.length === 0 || isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-[0.8125rem] font-medium text-white bg-[#2563EB] dark:bg-[#3B82F6] hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] disabled:opacity-40 disabled:cursor-not-allowed rounded-[6px] transition-colors"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isSubmitting ? 'Sending...' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
