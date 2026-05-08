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
        <h3 className="text-base font-semibold text-[#172B4D]">Subtasks</h3>
        <span className="text-sm font-medium text-[#5E6C84]">{percent}% Done</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-[#F4F5F7] rounded-full h-1.5 border border-[#DFE1E6] overflow-hidden">
        <div 
          className="bg-[#00875A] h-full transition-all duration-500 ease-in-out" 
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Subtask List */}
      {subtasks && subtasks.length > 0 && (
        <div className="flex flex-col gap-0.5 border border-[#DFE1E6] rounded-lg p-1 bg-[#FFFFFF]">
          {subtasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-[#EBECF0] rounded group transition-colors">
              <button 
                onClick={() => onUpdateStatus(task.id, task.status === "Done" ? "To Do" : "Done")}
                className="text-[#5E6C84] hover:text-[#172B4D] transition-colors"
              >
                {task.status === "Done" ? (
                  <CheckCircle2 className="w-5 h-5 text-[#00875A]" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
              <span className={`text-sm flex-1 font-medium ${task.status === "Done" ? "text-[#5E6C84] line-through" : "text-[#172B4D]"}`}>
                {task.title}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  task.status === "Done" ? "bg-[#E3FCEF] text-[#00875A] border-[#00875A]/30" : 
                  task.status === "In Progress" ? "bg-[#DEEBFF] text-[#0052CC] border-[#0052CC]/30" :
                  "bg-[#F4F5F7] text-[#5E6C84] border-[#DFE1E6]"
              }`}>
                {task.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Create */}
      <div className="flex items-center gap-2 p-2 rounded bg-[#F4F5F7] border border-[#DFE1E6] focus-within:border-[#0052CC] transition-colors">
        <Plus className="w-4 h-4 text-[#5E6C84]" />
        <input 
          value={newTitle} 
          onChange={e => setNewTitle(e.target.value)} 
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done? (Press Enter)" 
          className="w-full bg-transparent border-none outline-none text-[#172B4D] placeholder:text-[#5E6C84] text-sm"
        />
      </div>
    </div>
  );
}
