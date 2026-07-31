"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Search, FileText, Loader2, Link2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/constants/queryKeys";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { Issue } from "@/modules/workspace/shared/types/issue.type";
import { toIssue, TaskDto } from "@/modules/workspace/shared/services/taskService";

interface ConvertToSubtaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  issueKey: string;
  issueId: string;
  onSuccess?: () => void;
}

export default function ConvertToSubtaskModal({
  isOpen,
  onClose,
  workspaceId,
  issueKey,
  issueId,
  onSuccess,
}: ConvertToSubtaskModalProps) {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const [selectedParent, setSelectedParent] = useState<Issue | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  // Get cached workspace tasks if available (instant response)
  const cachedTasks = useMemo(() => queryClient.getQueryData<Issue[]>(["tasks", workspaceId]) || [], [queryClient, workspaceId]);

  const { data: parentTasks = [], isFetching, isLoading } = useQuery({
    queryKey: [...queryKeys.tasks.byWorkspace(workspaceId), "search-parent", search],
    queryFn: async () => {
      if (!search.trim()) return [];
      const res = await api.get(apiRoutes.TASKS.BOARD(workspaceId), {
        params: { search: search.trim(), limit: 50, type: "task,story,bug" },
      });
      const data = res.data?.data || res.data;
      const tasks = Array.isArray(data) ? data : data.tasks || [];
      return tasks
        .map(toIssue)
        .filter((t: Issue) => {
          if (t.id === issueId) return false;
          const typeLower = t.type?.toLowerCase();
          return typeLower !== "subtask" && typeLower !== "epic";
        });
    },
    enabled: isOpen && search.trim().length > 0,
    staleTime: 30_000,
  });

  // Calculate instant in-memory matches from cached workspace tasks while network query is pending
  const displayTasks = useMemo(() => {
    if (!search.trim()) return [];
    if (parentTasks.length > 0) return parentTasks;
    const term = search.trim().toLowerCase();
    return cachedTasks.filter((t: Issue) => {
      if (t.id === issueId) return false;
      const typeLower = t.type?.toLowerCase();
      if (typeLower === "subtask" || typeLower === "epic") return false;
      return (
        t.key?.toLowerCase().includes(term) ||
        t.title?.toLowerCase().includes(term)
      );
    });
  }, [search, parentTasks, cachedTasks, issueId]);

  const handleClose = React.useCallback(() => {
    setSearch("");
    setSelectedParent(null);
    setIsConverting(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setSelectedParent(null);
      setIsConverting(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleConvert = async () => {
    if (!selectedParent) return;
    setIsConverting(true);
    try {
      await api.post(apiRoutes.TASKS.BOARD_TASK_CONVERT_TO_SUBTASK(workspaceId, issueId), {
        parentId: selectedParent.id,
      });
      toast.success(`Successfully converted ${issueKey} to subtask of ${selectedParent.key}`);
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, "subtasks", workspaceId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byWorkspace(workspaceId) });
      onSuccess?.();
      handleClose();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to convert task";
      toast.error(message);
    } finally {
      setIsConverting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-[500px] bg-white dark:bg-[#202020] rounded-[10px] shadow-xl border border-[#EAEAEA] dark:border-white/[0.06] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#EAEAEA] dark:border-white/[0.06]">
          <h2 className="text-[1rem] font-semibold text-[#111111] dark:text-[#E8E8E7] flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#2563EB]" />
            Convert to Subtask
          </h2>
          <button 
            onClick={handleClose}
            className="p-1 hover:bg-[#F0F0EE] dark:hover:bg-[#2E2E2E] rounded-[6px] text-[#787774] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <p className="text-[0.875rem] text-[#787774] dark:text-[#9B9A97]">
            Select a parent issue for <span className="font-medium text-[#111111] dark:text-[#E8E8E7]">{issueKey}</span>. The issue will be moved under the new parent.
          </p>

          <div className="flex flex-col gap-2">
            <label className="text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7]">Parent Issue</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ABABAB]" />
              <input 
                type="text"
                placeholder="Search by issue key or summary"
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setSelectedParent(null);
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (selectedParent && !isConverting) {
                      handleConvert();
                    } else if (displayTasks.length > 0) {
                      setSelectedParent(displayTasks[0]);
                      setSearch("");
                    }
                  }
                }}
                className="w-full pl-9 pr-3 py-2 text-[0.875rem] bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.12] rounded-[6px] focus:outline-none focus:border-[#2563EB] text-[#111111] dark:text-[#E8E8E7]"
                autoFocus
              />
            </div>
            
            {/* Dropdown Results */}
            {search.trim().length > 0 && (
              <div className="mt-1 border border-[#EAEAEA] dark:border-white/[0.06] rounded-[6px] overflow-hidden max-h-[200px] overflow-y-auto shadow-sm">
                {(isFetching || isLoading) && displayTasks.length === 0 ? (
                  <div className="p-4 flex justify-center text-[#ABABAB]">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : displayTasks.length > 0 ? (
                  <div className="flex flex-col divide-y divide-[#EAEAEA] dark:divide-white/[0.06]">
                    {displayTasks.map((task: Issue) => {
                      const isSelected = selectedParent?.id === task.id;
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => {
                            setSelectedParent(task);
                            setSearch("");
                          }}
                          className={`flex items-center gap-3 p-2.5 text-left transition-colors ${
                            isSelected
                              ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.15)] text-[#2563EB]"
                              : "hover:bg-[#F9F9F8] dark:hover:bg-[#2A2A2A]"
                          }`}
                        >
                          <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
                          <span className="text-[0.8125rem] font-mono font-medium text-[#2563EB] shrink-0">{task.key}</span>
                          <span className="text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] truncate flex-1">{task.title}</span>
                          {isSelected && <Check className="w-4 h-4 text-[#2563EB] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-[0.8125rem] text-[#ABABAB] text-center">
                    No matching tasks found
                  </div>
                )}
              </div>
            )}
            
            {/* Selected Parent Display */}
            {selectedParent && (
              <div className="mt-2 flex items-center justify-between p-3 border-2 border-[#2563EB] dark:border-[#3B82F6] rounded-[6px] bg-[#EFF6FF]/60 dark:bg-[rgba(37,99,235,0.12)]">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="text-[0.8125rem] font-mono font-semibold text-[#2563EB] dark:text-[#60A5FA] shrink-0">{selectedParent.key}</span>
                  <span className="text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7] truncate">{selectedParent.title}</span>
                </div>
                <button 
                  onClick={() => {
                    setSelectedParent(null);
                    setSearch("");
                  }}
                  className="text-[0.75rem] font-medium text-[#2563EB] hover:text-[#1D4ED8] dark:text-[#60A5FA] dark:hover:text-[#93C5FD] ml-2 shrink-0 underline"
                >
                  Change
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-[#EAEAEA] dark:border-white/[0.06] flex items-center justify-end gap-2 bg-[#F9F9F8] dark:bg-[#252525]">
          <button 
            onClick={handleClose}
            className="px-4 py-1.5 text-[0.875rem] font-medium text-[#787774] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-[6px] transition-colors"
            disabled={isConverting}
          >
            Cancel
          </button>
          <button 
            onClick={handleConvert}
            disabled={!selectedParent || isConverting}
            className="px-4 py-1.5 text-[0.875rem] font-medium bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-[6px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Convert
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
