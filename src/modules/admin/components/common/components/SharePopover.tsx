import React, { useState, useEffect, useRef } from 'react';
import { Share2, Link as LinkIcon, Globe, Lock, Search, Check, Users, X } from 'lucide-react';

// Mock data for search
const MOCK_USERS = [
  { id: '1', name: 'Alex Nguyen', email: 'nva@company.com', avatar: 'N' },
  { id: '2', name: 'Taylor Tran', email: 'ttb@company.com', avatar: 'T' },
  { id: '3', name: 'Chris Le', email: 'lvc@company.com', avatar: 'L' },
  { id: '4', name: 'Maria Garcia', email: 'maria@company.com', avatar: 'M' },
  { id: '5', name: 'John Doe', email: 'john@company.com', avatar: 'J' },
];

export default function SharePopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<typeof MOCK_USERS>([]);
  const [selectedUsers, setSelectedUsers] = useState<typeof MOCK_USERS>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [workspaceAccess, setWorkspaceAccess] = useState<'OPEN' | 'PRIVATE'>('OPEN');
  
  // Clipboard
  const [isCopied, setIsCopied] = useState(false);
  
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search logic
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      // Mock API Call
      const results = MOCK_USERS.filter(u => 
        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         u.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
        !selectedUsers.find(su => su.id === u.id)
      );
      setSearchResults(results);
      setIsSearching(false);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, selectedUsers]);

  const handleCopy = async () => {
    try {
      const currentUrl = window.location.href; 
      await navigator.clipboard.writeText(currentUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Could not copy text: ', err);
    }
  };

  const handleSelectUser = (user: typeof MOCK_USERS[0]) => {
    setSelectedUsers(prev => [...prev, user]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleSendInvite = () => {
    // Call API POST /projects/:id/invite
    console.log("Inviting users:", selectedUsers.map(u => u.id));
    alert(`Invitation sent to ${selectedUsers.length} people!`);
    setSelectedUsers([]);
    setIsOpen(false);
  };

  const handleWorkspaceAccessChange = (type: 'OPEN' | 'PRIVATE') => {
    setWorkspaceAccess(type);
    // Call API PATCH /projects/:id/access
    console.log("Updating Workspace Access to:", type);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/8 text-[#787774] dark:text-[#9B9A97] px-4 py-2 rounded-[6px] hover:bg-[#F7F6F3] dark:hover:bg-white/5 font-medium text-sm transition-colors"
      >
        Invite member
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-[min(calc(100vw-48px),var(--app-drawer-w))] bg-white dark:bg-[#202020] rounded-[10px] border border-[#EAEAEA] dark:border-white/8 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
        >
          <div className="p-4 border-b border-[#EAEAEA] dark:border-white/8">
            <h3 className="text-lg font-semibold text-[#111111] dark:text-[#E8E8E7] mb-4">Share</h3>
            
            {/* Search Input Area */}
            <div className="flex items-start gap-2">
              <div className="relative flex-1">
                <div className="min-h-10 border border-[#2563EB] rounded-[6px] p-1.5 flex flex-wrap gap-1.5 items-center bg-white dark:bg-[#252525] focus-within:ring-2 focus-within:ring-[#2563EB]/20 transition-shadow">
                  {selectedUsers.map(u => (
                    <span key={u.id} className="flex items-center gap-1 bg-[#F7F6F3] dark:bg-white/8 text-[#111111] dark:text-[#E8E8E7] text-xs font-medium px-2 py-1 rounded-[4px]">
                      {u.name}
                      <button onClick={() => handleRemoveUser(u.id)} className="hover:text-[#F87171]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder={selectedUsers.length === 0 ? "Names, teams, or emails" : ""}
                    className="flex-1 outline-none text-sm min-w-[7.5rem] px-1 bg-transparent"
                  />
                </div>

                {/* Dropdown Results */}
                {searchTerm && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/8 rounded-[8px] z-10 max-h-48 overflow-y-auto"
                    style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}
                  >
                    {isSearching ? (
                      <div className="p-3 text-sm text-[#787774] dark:text-[#9B9A97] text-center">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(u => (
                        <button
                          key={u.id}
                          onClick={() => handleSelectUser(u)}
                          className="w-full flex items-center gap-3 p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#93C5FD] flex items-center justify-center font-bold text-sm">
                            {u.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#111111] dark:text-[#E8E8E7]">{u.name}</p>
                            <p className="text-xs text-[#787774] dark:text-[#9B9A97]">{u.email}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-[#787774] dark:text-[#9B9A97] text-center">No matches found.</div>
                    )}
                  </div>
                )}
              </div>

              <button 
                onClick={handleSendInvite}
                disabled={selectedUsers.length === 0}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#F7F6F3] dark:disabled:bg-[#252525] disabled:text-[#ABABAB] dark:disabled:text-[#6B6B6B] disabled:cursor-not-allowed text-white text-sm font-medium px-4 h-10 rounded-[6px] transition-colors whitespace-nowrap"
              >
                Invite
              </button>
            </div>
          </div>

          <div className="p-4 bg-[#F9F9F8] dark:bg-[#252525]">
            <h4 className="text-xs font-semibold text-[#787774] dark:text-[#9B9A97] uppercase tracking-wider mb-3">Workspace Access</h4>
            
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="mt-1">
                  {workspaceAccess === 'OPEN' ? (
                    <Globe className="w-5 h-5 text-[#787774] dark:text-[#9B9A97]" />
                  ) : (
                    <Lock className="w-5 h-5 text-[#787774] dark:text-[#9B9A97]" />
                  )}
                </div>
                <div>
                  <select 
                    value={workspaceAccess}
                    onChange={(e) => handleWorkspaceAccessChange(e.target.value as any)}
                    className="text-sm font-medium text-[#111111] dark:text-[#E8E8E7] bg-transparent dark:bg-transparent outline-none cursor-pointer hover:underline mb-0.5"
                  >
                    <option value="OPEN">Open</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                  <p className="text-xs text-[#787774] dark:text-[#9B9A97]">
                    {workspaceAccess === 'OPEN' 
                      ? 'Anyone in this workspace can view and join.' 
                      : 'Only people invited to this Workspace can view and join.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-[#EAEAEA] dark:border-white/8 flex items-center justify-between">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 text-sm font-medium text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-white/5 px-3 py-1.5 rounded-[6px] transition-colors"
            >
              {isCopied ? <Check className="w-4 h-4 text-[#346538] dark:text-[#4ADE80]" /> : <LinkIcon className="w-4 h-4 text-[#787774] dark:text-[#9B9A97]" />}
              {isCopied ? <span className="text-[#346538] dark:text-[#4ADE80]">Copied!</span> : 'Copy link'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
