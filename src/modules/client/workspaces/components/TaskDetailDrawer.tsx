"use client";

import React, { useState, useEffect } from 'react';
import {
  X,
  MoreHorizontal, Plus, Link as LinkIcon,
  FileText, ChevronDown, Settings,
  Zap, User, Archive, AlertTriangle, ArchiveRestore
} from 'lucide-react';
import Link from 'next/link';
import { TaskDetailResponse } from '../types/task-detail.type';
import IssueSubtasks from "@/modules/admin/components/common/components/IssueSubtasks";
import TimeTrackingSidebar from "@/modules/admin/components/common/components/TimeTrackingSidebar";
import IssueDescription from "@/modules/admin/components/common/components/IssueDescription";
import TaskActivityHistory from "./TaskActivityHistory";
import TaskComments from "./TaskComments";
import TaskAttachmentsPanel from "./attachments/TaskAttachmentsPanel";
import { useAuth } from "@/context/AuthContext";

interface TaskDetailDrawerProps {
  isOpen: boolean;
  issue: TaskDetailResponse | any;
  workspaceId: string;
  onClose: () => void;
  onUpdateIssue?: (updatedIssue: any) => void;
  onArchiveIssue?: (issue: any) => void;
  detailUrl?: string;
  /** Embedded in split list view: no overlay, no fixed positioning */
  embedded?: boolean;
}

const getUserDisplayName = (user: any, fallback?: string | null) => {
  if (typeof user === 'string') return user;
  return user?.fullName || user?.email || fallback || 'Unassigned';
};

const formatDate = (value?: string | null) => {
  if (!value) return 'None';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
  }).format(new Date(value));
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export default function TaskDetailDrawer({
  isOpen,
  issue,
  workspaceId,
  onClose,
  onUpdateIssue,
  onArchiveIssue,
  embedded = false,
}: TaskDetailDrawerProps) {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'comments' | 'history' | 'worklog'>('comments');
  const [localTitle, setLocalTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [timeLogged, setTimeLogged] = useState(0);

  // Resize state
  const [drawerWidth, setDrawerWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      // Drawer is on the right. Width is window width - mouse X position
      let newWidth = window.innerWidth - e.clientX;
      const maxWidth = window.innerWidth * 0.5; // Max 50% of the screen
      
      if (newWidth < 300) newWidth = 300;
      if (newWidth > maxWidth) newWidth = maxWidth;
      
      setDrawerWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Sync state when issue prop changes
  useEffect(() => {
    if (issue) {
      setLocalTitle(issue.title);
      setSubtasks(issue.subtasks || []);
      setTimeLogged(issue.timeLogged || 0);
      setIsEditingTitle(false);
      setShowStatusDropdown(false);
      setShowActionMenu(false);
    }
  }, [issue]);

  if (!issue) return null;

  const issueKey = issue.key;
  const timeEstimated = issue.timeEstimated || "1d 4h"; 
  const assigneeName =
    issue.assigneeDisplayName ||
    getUserDisplayName(issue.assignee, issue.assigneeId);
  const reporterName = getUserDisplayName(issue.reporter, issue.reporterId);
  const dueDateLabel = formatDate(issue.dueDate ?? issue.endDate);
  const sprintLabel = issue.sprint?.name || issue.sprintId || 'None';
  const boardLabel = issue.board?.name || issue.boardId || 'None';
  const storyPointsLabel =
    issue.storyPoints === null || issue.storyPoints === undefined
      ? 'None'
      : String(issue.storyPoints);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (localTitle !== issue.title && onUpdateIssue) {
      onUpdateIssue({ ...issue, title: localTitle });
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setShowStatusDropdown(false);
    if (newStatus !== issue.status && onUpdateIssue) {
      onUpdateIssue({ ...issue, status: newStatus });
    }
  };

  const handleAddSubtask = (title: string) => {
    if (issue.isArchived) return;
    const newSubtask = {
      id: `sub-${Date.now()}`,
      title,
      status: "To Do",
      priority: "Medium"
    };
    const updatedSubtasks = [...subtasks, newSubtask];
    setSubtasks(updatedSubtasks);
    if (onUpdateIssue) {
      onUpdateIssue({ ...issue, subtasks: updatedSubtasks });
    }
  };

  const handleUpdateSubtaskStatus = (id: string, newStatus: string) => {
    if (issue.isArchived) return;
    const updatedSubtasks = subtasks.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setSubtasks(updatedSubtasks);
    if (onUpdateIssue) {
      onUpdateIssue({ ...issue, subtasks: updatedSubtasks });
    }
  };

  const handleLogWork = (minutes: number, description: string) => {
    if (issue.isArchived) return;
    const newLogged = timeLogged + minutes;
    setTimeLogged(newLogged);
    if (onUpdateIssue) {
      onUpdateIssue({ ...issue, timeLogged: newLogged });
    }
  };

  const panelClasses = embedded
    ? "relative z-0 flex flex-col h-full min-h-0 w-full max-w-none bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 shadow-none border-0 rounded-none overflow-hidden"
    : `fixed top-0 right-0 bottom-0 z-[99999] bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 flex flex-col shadow-2xl border-l border-gray-200 dark:border-gray-700 transform ${isResizing ? '' : 'transition-transform duration-300 ease-in-out'} ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`;

  return (
    <>
      {!embedded && (
        <div
          className={`fixed inset-0 z-[99998] bg-transparent transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={onClose}
        />
      )}

      <div className={panelClasses} style={{ width: embedded ? '100%' : `${drawerWidth}px` }}>
        {!embedded && (
          <div 
            className={`absolute top-0 left-0 bottom-0 w-1.5 -ml-[3px] cursor-col-resize z-[100000] hover:bg-[#0052CC]/50 transition-colors ${isResizing ? 'bg-[#0052CC]' : 'bg-transparent'}`}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
          />
        )}
        
        {/* Top Header */}
        <div className="app-header border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0 bg-gray-100 dark:bg-gray-800">
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded cursor-pointer transition-colors">
              <div className="w-5 h-5 bg-[#0052CC] rounded text-white flex items-center justify-center">
                <FileText className="w-3 h-3" />
              </div>
              <span className="text-gray-500 dark:text-gray-400">Add epic</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">/</span>
            <div className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded cursor-pointer transition-colors">
              <div className="w-4 h-4 bg-[#0052CC] text-white flex items-center justify-center rounded-sm">
                <span className="text-[10px]">✓</span>
              </div>
              <span className="text-gray-900 dark:text-white">{issueKey}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowActionMenu((open) => !open)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded transition-colors"
                aria-label="Issue actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showActionMenu && (
                <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                  <button
                    type="button"
                    onClick={() => {
                      setShowActionMenu(false);
                      onArchiveIssue?.(issue);
                    }}
                    disabled={!onArchiveIssue || issue.isArchived}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </button>
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Content Body - Single Vertical Column */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900">
          <div className="p-4 md:p-6 space-y-8">
            
            {/* Archived Banner */}
            {issue.isArchived && (
              <div className="flex items-center justify-between bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-yellow-700 text-sm font-medium">
                    This task was archived by {issue.archivedByUser?.fullName || 'Unknown'} on {issue.archivedAt ? new Date(issue.archivedAt).toLocaleDateString() : 'Unknown Date'}. It is currently read-only.
                  </span>
                </div>
                <button 
                  onClick={() => { console.log("Restore triggered") }}
                  className="flex items-center px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-sm font-semibold rounded transition-colors"
                >
                  <ArchiveRestore className="w-4 h-4 mr-1.5" />
                  Restore
                </button>
              </div>
            )}

            {/* Title */}
            <div>
              {isEditingTitle && !issue.isArchived ? (
                <input
                  autoFocus
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleTitleBlur(); }}
                  className="w-full text-3xl font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 border-2 border-[#0052CC] rounded px-2 py-1 outline-none mb-4"
                />
              ) : (
                <h1
                  onClick={() => { if (!issue.isArchived) setIsEditingTitle(true); }}
                  className={`text-3xl font-semibold text-gray-900 dark:text-white leading-tight mb-4 p-2 -ml-2 rounded transition-colors ${issue.isArchived ? 'opacity-90' : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'}`}
                >
                  {localTitle}
                </h1>
              )}
            </div>

            {/* Top Quick Actions (Status, Settings) */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => { if (!issue.isArchived) setShowStatusDropdown(!showStatusDropdown); }}
                  disabled={issue.isArchived}
                  className={`flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold rounded-md transition-colors ${issue.isArchived ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                  {issue.status} {!issue.isArchived && <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
                {showStatusDropdown && (
                  <div className="absolute top-full mt-1 left-0 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden z-10 py-1">
                    {["To Do", "In Progress", "Done"].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${s === issue.status ? 'bg-gray-100 dark:bg-gray-700 text-[#0052CC] font-medium border-l-2 border-[#0052CC]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md transition-colors border border-gray-200 dark:border-gray-700">
                <Zap className="w-4 h-4" /> Automations
              </button>
              <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md transition-colors border border-gray-200 dark:border-gray-700">
                <Settings className="w-4 h-4" /> Config
              </button>
            </div>

            {/* Details List (Assignee, Reporter, Priority, etc) */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
              <div className="w-full flex items-center justify-between p-3 text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                Details
              </div>
              <div className="p-4 flex flex-col space-y-2">
                {/* Assignee */}
                <div className="flex items-center min-h-[32px]">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32 shrink-0">Assignee</div>
                  <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 p-1 -ml-1 rounded cursor-pointer transition-colors">
                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                    </div>
                    <span className="truncate">{assigneeName}</span>
                  </div>
                </div>

                {/* Reporter */}
                <div className="flex items-center min-h-[32px]">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32 shrink-0">Reporter</div>
                  <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 p-1 -ml-1 rounded cursor-pointer transition-colors">
                    <div className="w-5 h-5 rounded-full bg-orange-200 dark:bg-orange-800 flex items-center justify-center text-orange-700 dark:text-orange-300 font-bold text-[10px]">
                      {reporterName.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate">{reporterName}</span>
                  </div>
                </div>

                {/* Type */}
                <div className="flex items-center min-h-[32px]">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32 shrink-0">Type</div>
                  <div className="flex items-center text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 p-1 -ml-1 rounded cursor-pointer transition-colors">
                    {issue.type}
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-center min-h-[32px]">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32 shrink-0">Priority</div>
                  <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 p-1 -ml-1 rounded cursor-pointer transition-colors">
                    {issue.priority}
                  </div>
                </div>

                {/* Due date */}
                <div className="flex items-center min-h-[32px]">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32 shrink-0">Due date</div>
                  <div className="flex items-center text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 p-1 -ml-1 rounded cursor-pointer transition-colors">
                    {dueDateLabel}
                  </div>
                </div>

                {/* Sprint */}
                <div className="flex items-center min-h-[32px]">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32 shrink-0">Sprint</div>
                  <div className="flex items-center text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 p-1 -ml-1 rounded cursor-pointer transition-colors truncate">
                    {sprintLabel}
                  </div>
                </div>

                {/* Story points */}
                <div className="flex items-center min-h-[32px]">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 w-32 shrink-0">Story points</div>
                  <div className="flex items-center text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 p-1 -ml-1 rounded cursor-pointer transition-colors">
                    {storyPointsLabel}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Description</h3>
              <div className="pl-1">
                <IssueDescription
                  initialContent={issue.description || ''}
                  onSave={(newDesc: string) => {
                    if (onUpdateIssue && !issue.isArchived) {
                      onUpdateIssue({ ...issue, description: newDesc });
                    }
                  }}
                />
              </div>
            </div>

            <TaskAttachmentsPanel
              workspaceId={workspaceId}
              taskId={issue.id}
              isArchived={issue.isArchived ?? false}
              currentUserId={user?.id}
              accessToken={token}
            />

            {/* Subtasks */}
            <div className="pt-2">
              <IssueSubtasks
                subtasks={subtasks}
                onAdd={handleAddSubtask}
                onUpdateStatus={handleUpdateSubtaskStatus}
              />
            </div>

            {/* Time Tracking */}
            <div className="pt-2">
              <TimeTrackingSidebar 
                timeEstimated={timeEstimated} 
                timeLogged={timeLogged} 
                onLogWork={handleLogWork} 
              />
            </div>

            {/* Linked Work Items */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Linked work items</h3>
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">No linked items yet</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/docs/create?issueId=${issue.id}`}
                    className={`inline-flex items-center gap-2 px-3 py-2 bg-[#0052CC] hover:bg-[#357BFF] text-white text-sm font-bold rounded transition-colors ${issue.isArchived ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    <Plus className="w-4 h-4" /> Create Document
                  </Link>
                  <button className="inline-flex items-center gap-2 px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded transition-colors">
                    <LinkIcon className="w-4 h-4" /> Link item
                  </button>
                </div>
              </div>
            </div>

            {/* Activity (Comments, History, Worklog) */}
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Activity</h3>
                <div className="flex items-center gap-1 text-sm bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`px-4 py-1.5 rounded-md font-medium transition-colors ${activeTab === 'comments' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                  >Comments</button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-1.5 rounded-md font-medium transition-colors ${activeTab === 'history' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                  >History</button>
                  <button
                    onClick={() => setActiveTab('worklog')}
                    className={`px-4 py-1.5 rounded-md font-medium transition-colors ${activeTab === 'worklog' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                  >Worklog</button>
                </div>
              </div>

              <div className="pt-2">
                {activeTab === 'comments' && (
                  <TaskComments
                    workspaceId={workspaceId}
                    taskId={issue.id}
                    isArchived={issue.isArchived ?? false}
                    isDeleted={issue.isDeleted ?? false}
                  />
                )}
                {activeTab === 'history' && (
                  <TaskActivityHistory workspaceId={workspaceId} taskId={issue.id} taskKey={issue.key} />
                )}
                {activeTab === 'worklog' && (
                  <div className="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400 text-center">
                    No work log entries yet.
                  </div>
                )}
              </div>
            </div>

            {/* Meta information */}
            <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-4 pt-4 pb-8">
              <span>Created: {formatDateTime(issue.createdAt)}</span>
              <span>•</span>
              <span>Updated: {formatDateTime(issue.updatedAt)}</span>
            </div>

          </div>
        </div>
      </div>
      
      {/* Reusing Timeline custom scrollbar classes for convenience */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #DFE1E6; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #C1C7D0; }
      `}} />
    </>
  );
}
