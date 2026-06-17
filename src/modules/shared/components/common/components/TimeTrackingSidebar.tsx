import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { parseTimeToMinutes, formatMinutesToTimeString } from '@/common/utils/timeTracking';
import LogWorkModal from './LogWorkModal';

interface TimeTrackingSidebarProps {
  timeEstimated: string; // e.g. "1d 2h"
  timeLogged: number; // in minutes
  onLogWork: (minutes: number, description: string) => void;
}

export default function TimeTrackingSidebar({ timeEstimated, timeLogged, onLogWork }: TimeTrackingSidebarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const estimatedMinutes = parseTimeToMinutes(timeEstimated);
  
  // Progress bar calculation
  let progressPercent = 0;
  if (estimatedMinutes > 0) {
    progressPercent = Math.min((timeLogged / estimatedMinutes) * 100, 100);
  } else if (timeLogged > 0) {
    progressPercent = 100;
  }

  return (
    <div className="space-y-3 pt-4 border-t border-[#EAEAEA] dark:border-white/8 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#787774] dark:text-[#9B9A97]">Time tracking</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-1 hover:bg-[#F7F6F3] dark:hover:bg-white/5 text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] rounded-[6px] transition-colors"
          title="Log work"
        >
          <Clock className="w-4 h-4" />
        </button>
      </div>

      <div 
        className="w-full bg-[#EAEAEA] dark:bg-white/10 rounded-[8px] h-1.5 overflow-hidden cursor-pointer group relative"
        onClick={() => setIsModalOpen(true)}
      >
        <div 
          className="bg-[#2563EB] dark:bg-[#3B82F6] h-full transition-all duration-500 ease-in-out group-hover:opacity-90"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex justify-between text-[0.6875rem] font-medium text-[#787774] dark:text-[#9B9A97]">
        <span>{formatMinutesToTimeString(timeLogged)} logged</span>
        <span>
          {estimatedMinutes > 0 
            ? `${formatMinutesToTimeString(Math.max(0, estimatedMinutes - timeLogged))} remaining` 
            : 'No estimate'}
        </span>
      </div>

      {isModalOpen && (
        <LogWorkModal 
          onClose={() => setIsModalOpen(false)} 
          onSave={(minutes: number, desc: string) => {
            onLogWork(minutes, desc);
            setIsModalOpen(false);
          }} 
        />
      )}
    </div>
  );
}
