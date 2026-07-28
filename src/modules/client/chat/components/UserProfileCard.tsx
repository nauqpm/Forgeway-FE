import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, UserPen } from 'lucide-react';
import { useCreateDM } from '@/modules/client/chat/hooks/useChatQueries';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface UserProfileCardProps {
  user: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
  };
  position: { x: number, y: number };
  onClose: () => void;
  isCurrentUser?: boolean;
}

export default function UserProfileCard({ user, position, onClose, isCurrentUser }: UserProfileCardProps) {
  const createDMMutation = useCreateDM();
  const cardRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleMessageUser = async () => {
    try {
      await createDMMutation.mutateAsync([user._id]);
      toast.success('Create DM successfully');
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create DM');
    }
  };

  const handleEditProfile = () => {
    router.push('/profile');
    onClose();
  };

  const initialLetter = (user.fullName || user.email || 'U').charAt(0).toUpperCase();

  // Adjust position to avoid clipping on screen edges
  const safePosition = {
    top: Math.min(position.y + 10, typeof window !== 'undefined' ? window.innerHeight - 150 : position.y),
    left: Math.min(position.x + 10, typeof window !== 'undefined' ? window.innerWidth - 350 : position.x)
  };

  if (!mounted) return null;

  return createPortal(
    <div 
      ref={cardRef}
      className="fixed z-[9999] w-[340px] bg-white dark:bg-[#252525] rounded-xl shadow-2xl border border-[#EAEAEA] dark:border-white/[0.06] p-4 flex gap-4 animate-in fade-in zoom-in-95 duration-200"
      style={{ top: safePosition.top, left: safePosition.left }}
    >
      <div className="w-20 h-20 rounded-[14px] bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-3xl font-bold shrink-0 overflow-hidden shadow-inner ring-1 ring-black/5 dark:ring-white/10">
        {user.avatar ? (
          <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
        ) : (
          initialLetter
        )}
      </div>
      
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate text-lg leading-tight">{user.fullName}</h3>
        </div>
        <p className="text-[13px] text-blue-500 dark:text-blue-400 truncate hover:underline cursor-pointer mb-2 leading-tight">{user.email}</p>
        <p className="text-[12px] text-gray-500 dark:text-[#9B9A97] leading-tight">Local time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
      
      <div className="flex flex-col gap-2 shrink-0 justify-center">
        {isCurrentUser ? (
          <button 
            onClick={handleEditProfile}
            className="w-10 h-10 rounded-[10px] bg-white dark:bg-[#2C2C2C] hover:bg-gray-50 dark:hover:bg-[#353535] flex items-center justify-center border border-gray-200 dark:border-white/10 transition-colors shadow-sm"
            title="Edit Profile"
          >
            <UserPen className="w-5 h-5 text-gray-600 dark:text-[#9B9A97]" />
          </button>
        ) : (
          <button 
            onClick={handleMessageUser}
            disabled={createDMMutation.isPending}
            className="w-10 h-10 rounded-[10px] bg-white dark:bg-[#2C2C2C] hover:bg-gray-50 dark:hover:bg-[#353535] flex items-center justify-center border border-gray-200 dark:border-white/10 transition-colors disabled:opacity-50 shadow-sm"
            title="Message"
          >
            {createDMMutation.isPending ? (
              <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <MessageSquare className="w-5 h-5 text-gray-600 dark:text-[#9B9A97]" />
            )}
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
