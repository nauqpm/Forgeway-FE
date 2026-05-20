"use client";

import { useEffect, useRef } from 'react';
import { Draggable } from '@fullcalendar/interaction';
import { X } from 'lucide-react';
import { Issue } from '@/modules/client/workspaces/types/issue.type';

interface UnscheduledSidebarProps {
  tasks: Issue[];
  isOpen: boolean;
  onClose: () => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  Critical: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  High:     'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  Medium:   'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  Low:      'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
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
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="w-72 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Unscheduled work
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} — drag to schedule
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center">
          <span className="text-2xl">🎉</span>
          <p className="text-sm text-gray-500 dark:text-gray-400">
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
                'px-3 py-2.5 rounded-lg border text-sm select-none',
                'transition-shadow hover:shadow-md',
                PRIORITY_STYLES[task.priority] ??
                  'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
              ].join(' ')}
              data-id={task.id}
              data-title={task.title}
            >
              <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                {task.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {task.type} · {task.priority}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
