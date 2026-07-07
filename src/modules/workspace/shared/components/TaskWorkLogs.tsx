"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";

interface WorkspaceMember {
  id?: string;
  _id?: string;
  userId?: string | { _id?: string; id?: string; fullName?: string; name?: string; email?: string; avatarUrl?: string; avatar?: string; image?: string };
  user?: string | { _id?: string; id?: string; fullName?: string; name?: string; email?: string; avatarUrl?: string; avatar?: string; image?: string };
  fullName?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  avatar?: string;
  image?: string;
}

interface WorkLogDto {
  id: string;
  workspaceId: string;
  taskId: string;
  loggedBy: string; // The user ID
  hoursSpent: number;
  description?: string;
  loggedAt: string;
  createdAt: string;
}

import TimeTrackingModal from "@/modules/workspace/tasks/detail/TimeTrackingModal";
import DeleteWorkLogModal from "./DeleteWorkLogModal";
import { TaskDetailResponse } from "@/modules/workspace/shared/types/task-detail.type";

interface TaskWorkLogsProps {
  workspaceId: string;
  taskId: string;
  workspaceMembers?: WorkspaceMember[];
  issue?: TaskDetailResponse;
  onUpdateIssue?: (updatedIssue: TaskDetailResponse) => void;
  /** Whether the current user has TASK_EDIT permission in this workspace */
  canEdit?: boolean;
}

// Helper to get display name from member list
const getMemberDetails = (members: WorkspaceMember[] = [], userId: string) => {
  if (!userId) return { name: "Unknown User", avatar: null };

  const member = members.find((m) => {
    if (m.id === userId || m._id === userId) return true;
    if (typeof m.userId === "string" && m.userId === userId) return true;
    if (typeof m.user === "string" && m.user === userId) return true;
    if (m.userId && typeof m.userId === "object" && (m.userId.id === userId || m.userId._id === userId)) return true;
    if (m.user && typeof m.user === "object" && (m.user.id === userId || m.user._id === userId)) return true;
    return false;
  });

  if (!member) return { name: "Unknown User", avatar: null };

  let name = member.fullName || member.name || member.email || "Unknown User";
  let avatar = member.avatarUrl || member.avatar || member.image || null;

  if (member.user && typeof member.user === "object") {
    name = member.user.fullName || member.user.name || member.user.email || name;
    avatar = member.user.avatarUrl || member.user.avatar || member.user.image || avatar;
  }
  if (member.userId && typeof member.userId === "object") {
    name = member.userId.fullName || member.userId.name || member.userId.email || name;
    avatar = member.userId.avatarUrl || member.userId.avatar || member.userId.image || avatar;
  }

  return { name, avatar };
};

const formatTimeSpent = (hours: number) => {
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins}m`;
  }
  
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const timeAgo = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  return d.toLocaleDateString();
};

const formatFullDate = (dateString: string) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  const datePart = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${datePart} at ${timePart}`;
};

const getAvatarUrl = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const baseUrl = (process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5512").replace(/\/$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${path}`;
};

export default function TaskWorkLogs({ workspaceId, taskId, workspaceMembers = [], issue, onUpdateIssue, canEdit = true }: TaskWorkLogsProps) {
  // Derive read-only state: archived tasks, deleted tasks, or lack of edit permission
  const isReadOnly = !canEdit || !!issue?.isArchived || !!issue?.isDeleted;
  const [logs, setLogs] = useState<WorkLogDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [editingLog, setEditingLog] = useState<WorkLogDto | null>(null);

  // Delete states
  const [deletingLog, setDeletingLog] = useState<WorkLogDto | null>(null);
  
  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(apiRoutes.TASKS.BOARD_TASK_WORK_LOGS(workspaceId, taskId));
      
      if (response.data && response.data.workLogs) {
        setLogs(response.data.workLogs);
      } else if (Array.isArray(response.data)) {
        setLogs(response.data);
      } else {
        setLogs([]);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to load work logs");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, taskId]);

  useEffect(() => {
    if (workspaceId && taskId) {
      fetchLogs();
    }
  }, [workspaceId, taskId, fetchLogs]);

  const handleConfirmDelete = async (adjustTimeRemaining: boolean, newTimeEstimatedHours: number) => {
    if (!deletingLog) return;
    
    try {
      let url = apiRoutes.TASKS.BOARD_TASK_WORK_LOG_DELETE(workspaceId, taskId, deletingLog.id);
      url += `?adjustTimeRemaining=${adjustTimeRemaining}`;
      if (adjustTimeRemaining) {
        url += `&newTimeEstimated=${encodeURIComponent(newTimeEstimatedHours)}`;
      }

      await api.delete(url);
      setLogs((prev) => prev.filter((l) => l.id !== deletingLog.id));
      
      if (onUpdateIssue && issue) {
        // Optimistic update of the parent issue (use numeric hours consistently)
        onUpdateIssue({
          ...issue,
          timeLogged: (issue.timeLogged || 0) - deletingLog.hoursSpent,
          timeEstimated: adjustTimeRemaining ? newTimeEstimatedHours : issue.timeEstimated,
        });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to delete work log");
    } finally {
      setDeletingLog(null);
    }
  };

  const handleEditClick = (log: WorkLogDto) => {
    setEditingLog(log);
  };

  const handleUpdateIssueFromEdit = (updatedIssue: TaskDetailResponse) => {
    if (onUpdateIssue) {
      onUpdateIssue(updatedIssue);
    }
    // Re-fetch logs to show the updated log
    fetchLogs();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-[0.8125rem] text-[#DE350B] bg-[#FFEBE6] dark:bg-[#421F1C] dark:text-[#FF8F73] rounded-[6px]">
        {error}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-8 text-center text-[#787774] dark:text-[#9B9A97] text-[0.8125rem]">
        <div className="flex flex-col items-center justify-center gap-2">
          <Clock className="w-8 h-8 text-[#EAEAEA] dark:text-white/10" />
          <p>No work logs found for this task.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => {
        const { name, avatar } = getMemberDetails(workspaceMembers, log.loggedBy);
        
        return (
          <div key={log.id} className="flex gap-3 p-3 rounded-[6px] bg-[#F7F6F3] dark:bg-white/[0.02] border border-[#EAEAEA] dark:border-white/5">
            <div className="flex-shrink-0 mt-1">
              {avatar ? (
                <img src={getAvatarUrl(avatar)} alt={name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-[0.8125rem] font-semibold">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-semibold text-[0.875rem] text-[#111111] dark:text-[#E8E8E7]">
                  {name}
                </span>
                <span className="text-[#5E6C84] dark:text-[#9B9A97] text-[0.8125rem]">
                  logged <span className="font-semibold text-[#172B4D] dark:text-[#E8E8E7]">{formatTimeSpent(log.hoursSpent)}</span>
                </span>
              </div>
              
              <div 
                className="text-[0.75rem] text-[#787774] dark:text-[#9B9A97] mt-0.5 mb-2 cursor-pointer w-max"
                title={formatFullDate(log.loggedAt || log.createdAt)}
              >
                {timeAgo(log.loggedAt || log.createdAt)}
              </div>
              
              {log.description && (
                <div className="text-[0.875rem] text-[#111111] dark:text-[#E8E8E7] mb-2 whitespace-pre-wrap">
                  {log.description}
                </div>
              )}
              
              {!isReadOnly && (
                <div className="flex items-center gap-3 text-[0.75rem] text-[#5E6C84] dark:text-[#9B9A97]">
                  <button onClick={() => handleEditClick(log)} className="hover:text-[#172B4D] dark:hover:text-[#E8E8E7] transition-colors font-medium">
                    Edit
                  </button>
                  <span>&middot;</span>
                  <button onClick={() => setDeletingLog(log)} className="hover:text-[#DE350B] transition-colors font-medium">
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <DeleteWorkLogModal
        isOpen={!!deletingLog}
        onClose={() => setDeletingLog(null)}
        onConfirm={handleConfirmDelete}
        initialTimeRemainingHours={typeof issue?.timeEstimated === "number" ? issue.timeEstimated : parseFloat(String(issue?.timeEstimated || "0")) || 0}
        deletedHours={deletingLog?.hoursSpent ?? 0}
      />

      {issue && (
        <TimeTrackingModal
          isOpen={!!editingLog}
          onClose={() => setEditingLog(null)}
          issue={issue}
          onUpdateIssue={handleUpdateIssueFromEdit}
          editWorkLog={editingLog || undefined}
        />
      )}
    </div>
  );
}
