import React, { useState, useEffect, useRef } from 'react';
import { Share2, Link as LinkIcon, Globe, Lock, Search, Check, Users, X } from 'lucide-react';

// Mock data for search
const MOCK_USERS = [
  { id: '1', name: 'Nguyễn Văn A', email: 'nva@company.com', avatar: 'N' },
  { id: '2', name: 'Trần Thị B', email: 'ttb@company.com', avatar: 'T' },
  { id: '3', name: 'Lê Văn C', email: 'lvc@company.com', avatar: 'L' },
  { id: '4', name: 'Maria Garcia', email: 'maria@company.com', avatar: 'M' },
  { id: '5', name: 'John Doe', email: 'john@company.com', avatar: 'J' },
];

export default function SharePopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<typeof MOCK_USERS>([]);
  const [selectedUsers, setSelectedUsers] = useState<typeof MOCK_USERS>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [spaceAccess, setSpaceAccess] = useState<'OPEN' | 'PRIVATE'>('OPEN');
  
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
      console.error('Không thể copy text: ', err);
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
    // Gọi API POST /projects/:id/invite
    console.log("Inviting users:", selectedUsers.map(u => u.id));
    alert(`Đã gửi lời mời tới ${selectedUsers.length} người!`);
    setSelectedUsers([]);
    setIsOpen(false);
  };

  const handleSpaceAccessChange = (type: 'OPEN' | 'PRIVATE') => {
    setSpaceAccess(type);
    // Gọi API PATCH /projects/:id/access
    console.log("Updating Space Access to:", type);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors shadow-sm"
      >
        Mời thành viên
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[420px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Share</h3>
            
            {/* Search Input Area */}
            <div className="flex items-start gap-2">
              <div className="relative flex-1">
                <div className="min-h-[40px] border border-blue-500 rounded-lg p-1.5 flex flex-wrap gap-1.5 items-center bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-200 transition-shadow">
                  {selectedUsers.map(u => (
                    <span key={u.id} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium px-2 py-1 rounded-md">
                      {u.name}
                      <button onClick={() => handleRemoveUser(u.id)} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder={selectedUsers.length === 0 ? "Names, teams, or emails" : ""}
                    className="flex-1 outline-none text-sm min-w-[120px] px-1 bg-transparent"
                  />
                </div>

                {/* Dropdown Results */}
                {searchTerm && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(u => (
                        <button
                          key={u.id}
                          onClick={() => handleSelectUser(u)}
                          className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                            {u.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{u.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">No matches found.</div>
                    )}
                  </div>
                )}
              </div>

              <button 
                onClick={handleSendInvite}
                disabled={selectedUsers.length === 0}
                className="bg-[#0c66e4] hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium px-4 h-[40px] rounded-md transition-colors whitespace-nowrap"
              >
                Invite
              </button>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Space Access</h4>
            
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="mt-1">
                  {spaceAccess === 'OPEN' ? (
                    <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                <div>
                  <select 
                    value={spaceAccess}
                    onChange={(e) => handleSpaceAccessChange(e.target.value as any)}
                    className="text-sm font-medium text-gray-900 dark:text-white bg-transparent dark:bg-transparent outline-none cursor-pointer hover:underline mb-0.5"
                  >
                    <option value="OPEN">Open</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {spaceAccess === 'OPEN' 
                      ? 'Anyone in this workspace can view and join.' 
                      : 'Only people invited to this space can view and join.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded-md transition-colors"
            >
              {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <LinkIcon className="w-4 h-4 text-gray-500" />}
              {isCopied ? <span className="text-green-600">Copied!</span> : 'Copy link'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
