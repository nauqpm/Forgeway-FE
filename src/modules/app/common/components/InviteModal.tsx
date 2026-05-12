import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Check, Mail, Briefcase, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';
import { toast } from 'react-hot-toast';

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
      // Giả lập lấy token reCAPTCHA
      const mockCaptchaToken = 'mock_recaptcha_token_12345';
      
      const payload = {
        users: selectedOptions.map(opt => opt.value),
        roleId: role,
        captchaToken: mockCaptchaToken
      };

      // Mock API Call
      console.log('Sending invitation to API for project:', projectId, 'Payload:', payload);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network latency

      toast.success('Invitations sent successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to send invitations.');
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

  const customStyles = {
    control: (base: any, state: any) => ({
      ...base,
      minHeight: '44px',
      borderColor: state.isFocused ? '#6366f1' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#6366f1' : '#9ca3af'
      },
      borderRadius: '0.5rem'
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: '#f3f4f6',
      borderRadius: '0.375rem',
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: '#374151',
      fontSize: '0.875rem',
      fontWeight: 500,
      padding: '2px 6px',
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: '#6b7280',
      ':hover': {
        backgroundColor: '#e5e7eb',
        color: '#ef4444',
      },
    }),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Add people to this space</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 h-[44px]"
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
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Quick Suggestions</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleQuickAdd(user)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium transition-colors border border-indigo-100"
                    >
                      <span className="text-indigo-600">+</span> {user.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Integrations (UI only as per MVP assumption) */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">Or invite from integrations</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                  <Mail className="w-4 h-4 text-red-500" /> Google
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                  <MessageSquare className="w-4 h-4 text-purple-600" /> Slack
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                  <Briefcase className="w-4 h-4 text-blue-600" /> Microsoft
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start gap-4">
            <button 
              onClick={handleCopyLink}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <LinkIcon className="w-4 h-4" />}
              {isCopied ? <span className="text-green-600">Copied</span> : 'Copy link'}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Protected by reCAPTCHA
            </span>
            <button 
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors"
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
