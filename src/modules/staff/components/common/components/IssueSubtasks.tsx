import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle2, Circle } from 'lucide-react';

interface Subtask {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface IssueSubtasksProps {
  subtasks: Subtask[];
  onAdd: (title: string) => void;
  onUpdateStatus: (id: string, newStatus: string) => void;
}

export default function IssueSubtasks({ subtasks = [], onAdd, onUpdateStatus }: IssueSubtasksProps) {
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
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Subtasks</h3>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{percent}% Done</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div 
          className="bg-[#00875A] h-full transition-all duration-500 ease-in-out" 
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Subtask List */}
      {subtasks && subtasks.length > 0 && (
        <div className="flex flex-col gap-0.5 border border-[#DFE1E6] dark:border-gray-700 rounded-lg p-1 bg-[#FFFFFF] dark:bg-gray-900">
          {subtasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded group transition-colors">
              <button 
                onClick={() => onUpdateStatus(task.id, task.status === "Done" ? "To Do" : "Done")}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {task.status === "Done" ? (
                  <CheckCircle2 className="w-5 h-5 text-[#00875A]" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
              <span className={`text-sm flex-1 font-medium ${task.status === "Done" ? "text-gray-500 dark:text-gray-400 line-through" : "text-gray-900 dark:text-white"}`}>
                {task.title}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  task.status === "Done" ? "bg-[#E3FCEF] text-[#00875A] border-[#00875A]/30 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700/30" :
                  task.status === "In Progress" ? "bg-[#DEEBFF] text-[#0052CC] border-[#0052CC]/30 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/30" :
                  "bg-[#F4F5F7] text-[#5E6C84] border-[#DFE1E6] dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
              }`}>
                {task.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Create */}
      <div className="flex items-center gap-2 p-2 rounded bg-[#F4F5F7] dark:bg-gray-800 border border-[#DFE1E6] dark:border-gray-700 focus-within:border-[#0052CC] transition-colors">
        <Plus className="w-4 h-4 text-[#5E6C84] dark:text-gray-400" />
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done? (Press Enter)"
          className="w-full bg-transparent border-none outline-none text-[#172B4D] dark:text-white placeholder:text-[#5E6C84] dark:placeholder:text-gray-500 text-sm"
        />
      </div>
    </div>
  );
}
