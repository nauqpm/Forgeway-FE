"use client";
import React, { useState } from "react";
import { useSubtasks } from "@/modules/workspace/shared/hooks/useSubtasks";
import SubtaskProgressBar from "./SubtaskProgressBar";
import { Layers } from "lucide-react";
import Image from "next/image";
import AssigneePicker, { AssigneePickerUser } from "@/shared/components/AssigneePicker";

interface BoardCardSubtasksProps {
  workspaceId: string;
  taskId: string;
  taskType?: string;
  workspaceMembers?: AssigneePickerUser[];
  canEditTask?: boolean;
  boardColumns?: { id: string; name: string; category?: string }[];
  onSubtaskClick: (key: string) => void;
}

export default function BoardCardSubtasks({ workspaceId, taskId, taskType, workspaceMembers, canEditTask, boardColumns, onSubtaskClick }: BoardCardSubtasksProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { subtasks, isLoading, progress, updateSubtask } = useSubtasks(workspaceId, taskId);

  // Subtask itself cannot have subtasks; skip if not yet loaded
  if (taskType?.toLowerCase() === "subtask") return null;
  // Hide if no subtasks
  if (!progress || progress.total === 0) return null;

  return (
    <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <SubtaskProgressBar
        done={progress.done}
        total={progress.total}
        isExpanded={isExpanded}
        onToggleExpand={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
      />

      {isExpanded && (
        <div className="mt-1.5 space-y-1.5">
          {isLoading ? (
            <div className="text-[10px] text-center text-[#ABABAB] py-2">Loading...</div>
          ) : subtasks.length === 0 ? (
            <div className="text-[10px] text-center text-[#ABABAB] py-2">No subtasks</div>
          ) : (
            subtasks.map((st) => (
              <div
                key={st.id}
                className="flex flex-col gap-1.5 p-2 rounded-[6px] border border-[#DFE1E6] dark:border-white/[0.08] bg-white dark:bg-[#202020] hover:bg-[#F9F9F8] dark:hover:bg-[#2A2A2A] cursor-pointer transition-colors shadow-sm"
                onClick={() => onSubtaskClick(st.key || st.id)}
              >
                <div className="text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7] truncate w-full leading-tight">
                  {st.title}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#5E6C84] dark:text-[#9B9A97]" />
                    <span className="text-[0.75rem] text-[#5E6C84] dark:text-[#9B9A97]">{st.key}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {(() => {
                      const colDef = boardColumns?.find((c) => c.id === st.status);
                      const cat = colDef?.category || "todo";
                      const name = colDef?.name || st.status;

                      return (
                        <span
                          className={`px-1.5 py-0.5 rounded-[4px] text-[0.625rem] font-bold uppercase tracking-wide ${
                            cat === "done"
                              ? "bg-[#E3FCEF] text-[#006644] dark:bg-[rgba(0,102,68,0.2)] dark:text-[#57D9A3]"
                              : cat === "inprogress"
                              ? "bg-[#DEEBFF] text-[#0747A6] dark:bg-[rgba(7,71,166,0.2)] dark:text-[#4C9AFF]"
                              : "bg-[#DFE1E6] text-[#42526E] dark:bg-[rgba(66,82,110,0.2)] dark:text-[#8993A4]"
                          }`}
                        >
                          {name}
                        </span>
                      );
                    })()}

                    <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                      {canEditTask && workspaceMembers ? (
                        <AssigneePicker
                          users={workspaceMembers}
                          value={st.assigneeId || st.assignee?.id || null}
                          onChange={(uid) => {
                            updateSubtask.mutate({
                              subtaskId: st.id,
                              updates: { assigneeId: uid || null }
                            });
                          }}
                          placement="auto"
                          size="sm"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-[#EAEAEA] dark:border-white/[0.1] bg-[#F7F6F3] dark:bg-[#333] flex items-center justify-center shrink-0">
                          {st.assignee?.avatar ? (
                            <Image src={st.assignee.avatar} alt="" width={20} height={20} className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-3.5 h-3.5 text-[#A5ADBA]" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
