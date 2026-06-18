"use client";

import { useEffect, useRef } from 'react';
import { Draggable } from '@fullcalendar/interaction';
import { X } from 'lucide-react';
import { Issue } from '@/modules/workspace/shared/types/issue.type';

interface UnscheduledSidebarProps {
  tasks: Issue[];
  isOpen: boolean;
  onClose: () => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  Critical: 'bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] border-[#FDEBEC] dark:border-[rgba(159,47,45,0.24)]',
  High:     'bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] border-[#FDEBEC] dark:border-[rgba(159,47,45,0.24)]',
  Medium:   'bg-[#FBF3DB] dark:bg-[rgba(149,100,0,0.12)] border-[#FBF3DB] dark:border-[rgba(149,100,0,0.24)]',
  Low:      'bg-[#EDF3EC] dark:bg-[rgba(52,101,56,0.12)] border-[#EDF3EC] dark:border-[rgba(52,101,56,0.24)]',
};

export default function UnscheduledSidebar({ tasks, isOpen, onClose }: UnscheduledSidebarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !isOpen) return;

    const draggable = new Draggable(containerRef.current, {
      itemSelector: '.draggable-task',
      eventData: (el: HTMLElement) => ({
        id: el.dataset.id!,
        title: el.dataset.title!,
        create: true,
      }),
    });

    return () => draggable.destroy();
  }, [isOpen, tasks]);

  if (!isOpen) return null;

  return (
    <div
      className="w-[var(--workspace-list-sidebar-w)] flex-shrink-0 border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] bg-white dark:bg-[#202020] flex flex-col overflow-hidden"
      style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAEAEA] dark:border-white/[0.06]">
        <div>
          <h3 className="text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">
            Unscheduled work
          </h3>
          <p className="text-xs text-[#787774] dark:text-[#9B9A97] mt-0.5">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} — drag to schedule
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-[#ABABAB] hover:text-[#787774] dark:text-[#6B6B6B] dark:hover:text-[#9B9A97] transition-colors p-1 rounded-[6px]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center">
          <span className="text-2xl">🎉</span>
          <p className="text-sm text-[#787774] dark:text-[#9B9A97]">
            All tasks are scheduled
          </p>
        </div>
      ) : (
        <div ref={containerRef} className="flex-1 overflow-y-auto p-3 space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={[
                'draggable-task cursor-grab active:cursor-grabbing',
                'px-3 py-2.5 rounded-[8px] border text-sm select-none',
                'transition-colors',
                PRIORITY_STYLES[task.priority] ??
                  'bg-[#F9F9F8] dark:bg-[#252525] border-[#EAEAEA] dark:border-white/[0.06]',
              ].join(' ')}
              data-id={task.id}
              data-title={task.title}
            >
              <p className="font-medium text-[#111111] dark:text-[#E8E8E7] truncate">
                {task.title}
              </p>
              <p className="text-xs text-[#787774] dark:text-[#9B9A97] mt-0.5">
                {task.type} · {task.priority}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
