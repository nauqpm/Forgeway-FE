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
        <h3 className="text-base font-semibold text-[#DCDFE4]">Subtasks</h3>
        <span className="text-sm font-medium text-[#8C9BAB]">{percent}% Done</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-[#22272B] rounded-full h-1.5 border border-[#38414A] overflow-hidden">
        <div 
          className="bg-[#22A06B] h-full transition-all duration-500 ease-in-out" 
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Subtask List */}
      {subtasks && subtasks.length > 0 && (
        <div className="flex flex-col gap-0.5 border border-[#38414A] rounded-lg p-1 bg-[#1D2125]">
          {subtasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-[#2C333A] rounded group transition-colors">
              <button 
                onClick={() => onUpdateStatus(task.id, task.status === "Done" ? "To Do" : "Done")}
                className="text-[#8C9BAB] hover:text-[#DCDFE4] transition-colors"
              >
                {task.status === "Done" ? (
                  <CheckCircle2 className="w-5 h-5 text-[#22A06B]" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
              <span className={`text-sm flex-1 font-medium ${task.status === "Done" ? "text-[#8C9BAB] line-through" : "text-[#DCDFE4]"}`}>
                {task.title}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  task.status === "Done" ? "bg-[#1E3A2F] text-[#22A06B] border-[#22A06B]/30" : 
                  task.status === "In Progress" ? "bg-[#1C2B41] text-[#4C9AFF] border-[#4C9AFF]/30" :
                  "bg-[#22272B] text-[#8C9BAB] border-[#38414A]"
              }`}>
                {task.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Create */}
      <div className="flex items-center gap-2 p-2 rounded bg-[#22272B] border border-[#38414A] focus-within:border-[#4C9AFF] transition-colors">
        <Plus className="w-4 h-4 text-[#8C9BAB]" />
        <input 
          value={newTitle} 
          onChange={e => setNewTitle(e.target.value)} 
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done? (Press Enter)" 
          className="w-full bg-transparent border-none outline-none text-[#DCDFE4] placeholder:text-[#8C9BAB] text-sm"
        />
      </div>
    </div>
  );
}
