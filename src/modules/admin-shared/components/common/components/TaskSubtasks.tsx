import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle2, Circle } from 'lucide-react';

interface Subtask {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface TaskSubtasksProps {
  subtasks: Subtask[];
  onAdd: (title: string) => void;
  onUpdateStatus: (id: string, newStatus: string) => void;
}

export default function TaskSubtasks({ subtasks = [], onAdd, onUpdateStatus }: TaskSubtasksProps) {
  const [newTitle, setNewTitle] = useState("");

  const percent = useMemo(() => {
    if (!subtasks || subtasks.length === 0) return 0;
    const doneCount = subtasks.filter(t => t.status === "Done").length;
    return Math.round((doneCount / subtasks.length) * 100);
  }, [subtasks]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTitle.trim()) {
      onAdd(newTitle.trim());
      setNewTitle("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#111111] dark:text-[#E8E8E7]">Subtasks</h3>
        <span className="text-sm font-medium text-[#787774] dark:text-[#9B9A97]">{percent}% Done</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-[#F7F6F3] dark:bg-[#252525] rounded-[8px] h-1.5 border border-[#EAEAEA] dark:border-white/[0.06] overflow-hidden">
        <div 
          className="bg-[#346538] dark:bg-[#4ADE80] h-full transition-all duration-500 ease-in-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Subtask List */}
      {subtasks && subtasks.length > 0 && (
        <div className="flex flex-col gap-0.5 border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] p-1 bg-white dark:bg-[#202020]">
          {subtasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-[#F7F6F3] dark:hover:bg-white/5 rounded-[6px] group transition-colors">
              <button 
                onClick={() => onUpdateStatus(task.id, task.status === "Done" ? "To Do" : "Done")}
                className="text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] transition-colors"
              >
                {task.status === "Done" ? (
                  <CheckCircle2 className="w-5 h-5 text-[#00875A]" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
              <span className={`text-sm flex-1 font-medium ${task.status === "Done" ? "text-[#787774] dark:text-[#9B9A97] line-through" : "text-[#111111] dark:text-[#E8E8E7]"}`}>
                {task.title}
              </span>
              <span className={`px-2 py-0.5 rounded text-[0.625rem] font-bold border transition-colors ${
                  task.status === "Done" ? "bg-[#EDF3EC] text-[#346538] border-[#346538]/20 dark:bg-[rgba(52,101,56,0.12)] dark:text-[#4ADE80] dark:border-[#4ADE80]/20" :
                  task.status === "In Progress" ? "bg-[#FBF3DB] text-[#956400] border-[#956400]/20 dark:bg-[rgba(149,100,0,0.12)] dark:text-[#F59E0B] dark:border-[#F59E0B]/20" :
                  "bg-[#EFF6FF] text-[#1F6C9F] border-[#2563EB]/20 dark:bg-[rgba(37,99,235,0.12)] dark:text-[#93C5FD] dark:border-[#93C5FD]/20"
              }`}>
                {task.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Create */}
      <div className="flex items-center gap-2 p-2 rounded-[6px] bg-[#F9F9F8] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/10 focus-within:border-[#2563EB] transition-colors">
        <Plus className="w-4 h-4 text-[#787774] dark:text-[#9B9A97]" />
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done? (Press Enter)"
          className="w-full bg-transparent border-none outline-none text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B] text-sm"
        />
      </div>
    </div>
  );
}
