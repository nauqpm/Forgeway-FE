"use client";

import { useEffect, useRef } from 'react';
import { Draggable } from '@fullcalendar/interaction';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { Issue } from '@/modules/workspace/shared/types/issue.type';
import { useEscapeStack } from '@/shared/hooks/useEscapeStack';

interface UnscheduledSidebarProps {
  tasks: Issue[];
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  Critical: 'bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] border-[#FDEBEC] dark:border-[rgba(159,47,45,0.24)]',
  High:     'bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] border-[#FDEBEC] dark:border-[rgba(159,47,45,0.24)]',
  Medium:   'bg-[#FBF3DB] dark:bg-[rgba(149,100,0,0.12)] border-[#FBF3DB] dark:border-[rgba(149,100,0,0.24)]',
  Low:      'bg-[#EDF3EC] dark:bg-[rgba(52,101,56,0.12)] border-[#EDF3EC] dark:border-[rgba(52,101,56,0.24)]',
};

export default function UnscheduledSidebar({ tasks, isOpen, onClose, onOpen }: UnscheduledSidebarProps) {
  useEscapeStack(onClose, isOpen);
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

  if (!isOpen) {
    return (
      <button
        onClick={onOpen}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-1.5 bg-[#2563EB] dark:bg-[#3B82F6] text-white text-xs font-semibold px-2.5 py-2 rounded-l-lg shadow-lg hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] active:scale-95 transition-all duration-200 cursor-pointer group"
        title="Open Unscheduled work"
        aria-label="Open Unscheduled work"
      >
        <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Unscheduled</span>
        {tasks.length > 0 && (
          <span className="bg-white/20 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0">
            {tasks.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <>
      {/* Backdrop overlay on mobile */}
      <div
        className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-xs md:hidden animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Slide-over panel on mobile (< md), Inline sidebar on desktop (>= md) */}
      <div
        className="fixed inset-y-0 right-0 z-[1000] w-[280px] max-w-[85vw] bg-white dark:bg-[#202020] border-l border-[#EAEAEA] dark:border-white/[0.06] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 md:static md:z-auto md:w-[var(--workspace-list-sidebar-w)] md:max-w-none md:flex-shrink-0 md:border md:rounded-[8px] md:shadow-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAEAEA] dark:border-white/[0.06] shrink-0">
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
            className="text-[#ABABAB] hover:text-[#787774] dark:text-[#6B6B6B] dark:hover:text-[#9B9A97] transition-colors p-1.5 rounded-[6px] hover:bg-[#F7F6F3] dark:hover:bg-white/5 cursor-pointer"
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
    </>
  );
}
