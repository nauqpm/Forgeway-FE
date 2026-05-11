"use client";

import React, { useState, useEffect } from 'react';
import {
  X, Maximize2, Share2, Eye, Lock,
  MoreHorizontal, Plus, Link as LinkIcon,
  FileText, ChevronDown, Paperclip, Settings,
  Zap, User
} from 'lucide-react';
import Link from 'next/link';
import { MentionsInput, Mention } from 'react-mentions';
import IssueSubtasks from './IssueSubtasks';
import TimeTrackingSidebar from './TimeTrackingSidebar';
import IssueDescription from './IssueDescription';

interface TaskDetailDrawerProps {
  isOpen: boolean;
  issue: any;
  spaceKey: string;
  onClose: () => void;
  onUpdateIssue?: (updatedIssue: any) => void;
  /** Embedded in split list view: no overlay, no fixed positioning */
  embedded?: boolean;
}

const spaceMembers = [
  { id: "nam", username: "nam" },
  { id: "admin", username: "admin" },
  { id: "quanp", username: "quanp" }
];

const renderCommentText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\[@[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const match = part.match(/\[@([^\]]+)\]\(([^)]+)\)/);
    if (match) {
      return <a key={i} href={`/profile/${match[2]}`} className="text-[#0052CC] font-medium hover:underline bg-[#E9F2FF] px-1 rounded">@{match[1]}</a>;
    }
    return <span key={i}>{part}</span>;
  });
};

export default function TaskDetailDrawer({
  isOpen,
  issue,
  spaceKey,
  onClose,
  onUpdateIssue,
  embedded = false,
}: TaskDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'comments' | 'history' | 'worklog'>('comments');
  const [localTitle, setLocalTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [timeLogged, setTimeLogged] = useState(0);

  // Sync state when issue prop changes
  useEffect(() => {
    if (issue) {
      setLocalTitle(issue.title);
      setComments(issue.comments || []);
      setSubtasks(issue.subtasks || []);
      setTimeLogged(issue.timeLogged || 0);
      setIsEditingTitle(false);
      setShowStatusDropdown(false);
      setCommentInput('');
    }
  }, [issue]);

  if (!issue) return null;

  const issueKey = `${spaceKey}-${100 + parseInt(issue.id)}`;
  const timeEstimated = issue.timeEstimated || "1d 4h"; 

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (localTitle !== issue.title && onUpdateIssue) {
      onUpdateIssue({ ...issue, title: localTitle });
    }
  };

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    const newComment = { id: Date.now(), text: commentInput, author: 'QP', timestamp: 'Just now' };
    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    setCommentInput('');
    if (onUpdateIssue) {
      onUpdateIssue({ ...issue, comments: updatedComments });
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setShowStatusDropdown(false);
    if (newStatus !== issue.status && onUpdateIssue) {
      onUpdateIssue({ ...issue, status: newStatus });
    }
  };

  const handleAddSubtask = (title: string) => {
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
    const updatedSubtasks = subtasks.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setSubtasks(updatedSubtasks);
    if (onUpdateIssue) {
      onUpdateIssue({ ...issue, subtasks: updatedSubtasks });
    }
  };

  const handleLogWork = (minutes: number, description: string) => {
    const newLogged = timeLogged + minutes;
    setTimeLogged(newLogged);
    if (onUpdateIssue) {
      onUpdateIssue({ ...issue, timeLogged: newLogged });
    }
  };

  const panelClasses = embedded
    ? "relative z-0 flex flex-col h-full min-h-0 w-full max-w-none bg-[#FFFFFF] text-[#42526E] shadow-none border-0 rounded-none overflow-hidden"
    : `fixed top-0 right-0 bottom-0 w-full max-w-4xl z-[99999] bg-[#FFFFFF] text-[#42526E] flex flex-col shadow-2xl border-l border-[#DFE1E6] transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`;

  return (
    <>
      {!embedded && (
        <div
          className={`fixed inset-0 z-[99998] bg-[#091E42]/54 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={onClose}
        />
      )}

      <div className={panelClasses}>
        {/* Top Header */}
        <div className="h-14 border-b border-[#DFE1E6] flex items-center justify-between px-5 shrink-0 bg-[#F4F5F7]">
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className="flex items-center gap-2 hover:bg-[#EBECF0] px-2 py-1 rounded cursor-pointer transition-colors">
              <div className="w-5 h-5 bg-[#0052CC] rounded text-white flex items-center justify-center">
                <FileText className="w-3 h-3" />
              </div>
              <span className="text-[#5E6C84]">Add epic</span>
            </div>
            <span className="text-[#5E6C84]">/</span>
            <div className="flex items-center gap-2 hover:bg-[#EBECF0] px-2 py-1 rounded cursor-pointer transition-colors">
              <div className="w-4 h-4 bg-[#0052CC] text-white flex items-center justify-center rounded-sm">
                <span className="text-[10px]">✓</span>
              </div>
              <span className="text-[#172B4D]">{issueKey}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-[#EBECF0] text-[#5E6C84] hover:text-[#172B4D] rounded transition-colors"><Lock className="w-4 h-4" /></button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#EBECF0] text-[#5E6C84] hover:text-[#172B4D] rounded transition-colors">
              <Eye className="w-4 h-4" /> <span>1</span>
            </button>
            <button className="p-2 hover:bg-[#EBECF0] text-[#5E6C84] hover:text-[#172B4D] rounded transition-colors"><Share2 className="w-4 h-4" /></button>
            <button className="p-2 hover:bg-[#EBECF0] text-[#5E6C84] hover:text-[#172B4D] rounded transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
            <div className="w-px h-5 bg-[#DFE1E6] mx-1" />
            <button className="p-2 hover:bg-[#EBECF0] text-[#5E6C84] hover:text-[#172B4D] rounded transition-colors"><Maximize2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 hover:bg-[#EBECF0] text-[#5E6C84] hover:text-[#172B4D] rounded transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Column (Main) */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 border-r border-[#DFE1E6] space-y-8 custom-scrollbar">

            {/* Title */}
            <div>
              {isEditingTitle ? (
                <input
                  autoFocus
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleTitleBlur(); }}
                  className="w-full text-3xl font-semibold text-[#172B4D] bg-[#F4F5F7] border-2 border-[#0052CC] rounded px-2 py-1 outline-none mb-4"
                />
              ) : (
                <h1
                  onClick={() => setIsEditingTitle(true)}
                  className="text-3xl font-semibold text-[#172B4D] leading-tight mb-4 hover:bg-[#EBECF0] p-2 -ml-2 rounded cursor-pointer transition-colors"
                >
                  {localTitle}
                </h1>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-[#172B4D]">Description</h3>
              <IssueDescription
                initialContent={issue.description || ''}
                onSave={(newDesc) => {
                  if (onUpdateIssue) {
                    onUpdateIssue({ ...issue, description: newDesc });
                  }
                }}
              />
            </div>

            {/* Subtasks */}
            <IssueSubtasks
              subtasks={subtasks}
              onAdd={handleAddSubtask}
              onUpdateStatus={handleUpdateSubtaskStatus}
            />

            {/* Linked Work Items */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-[#172B4D]">Linked work items</h3>
              <div className="p-5 bg-[#F4F5F7] border border-[#DFE1E6] rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-[#5E6C84]">No linked items yet</span>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/docs/create?issueId=${issue.id}`}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-[#0052CC] hover:bg-[#357BFF] text-white text-sm font-bold rounded transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Create new Document
                  </Link>
                  <button className="inline-flex items-center gap-2 px-3 py-2 hover:bg-[#EBECF0] text-[#172B4D] text-sm font-medium rounded transition-colors">
                    <LinkIcon className="w-4 h-4" /> Link existing item
                  </button>
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#172B4D]">Activity</h3>
                <div className="flex items-center gap-2 text-sm text-[#5E6C84]">
                  <span>Show:</span>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`px-3 py-1 rounded font-medium transition-colors ${activeTab === 'comments' ? 'bg-[#EBECF0] text-[#172B4D]' : 'hover:bg-[#EBECF0]'}`}
                  >Comments</button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-3 py-1 rounded transition-colors ${activeTab === 'history' ? 'bg-[#EBECF0] text-[#172B4D]' : 'hover:bg-[#EBECF0]'}`}
                  >History</button>
                  <button
                    onClick={() => setActiveTab('worklog')}
                    className={`px-3 py-1 rounded transition-colors ${activeTab === 'worklog' ? 'bg-[#EBECF0] text-[#172B4D]' : 'hover:bg-[#EBECF0]'}`}
                  >Work log</button>
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <div className="w-8 h-8 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  QP
                </div>
                <div className="flex-1 border border-[#DFE1E6] rounded-lg bg-[#F4F5F7] hover:bg-[#EBECF0] focus-within:bg-[#FFFFFF] focus-within:border-[#0052CC] transition-colors p-4 cursor-text relative">
                  <div className="mb-4 text-sm relative z-50">
                    <style dangerouslySetInnerHTML={{__html: `
                      .mentions__control { min-height: 36px; }
                      .mentions__input { width: 100%; outline: none; border: none; background: transparent; color: #172B4D; font-family: inherit; font-size: inherit; }
                      .mentions__suggestions__list { background-color: #F4F5F7; border: 1px solid #DFE1E6; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; z-index: 100; position: absolute; min-width: 200px; margin-top: 4px; }
                      .mentions__suggestions__item { padding: 8px 12px; cursor: pointer; transition: background-color 0.2s; }
                      .mentions__suggestions__item--focused { background-color: #EBECF0; }
                    `}} />
                    <MentionsInput
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e: any) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                      placeholder="Add a comment... (@ to mention)"
                      className="mentions w-full bg-transparent text-[#172B4D] text-sm"
                      a11ySuggestionsListLabel={"Suggested mentions"}
                    >
                      <Mention
                        trigger="@"
                        data={spaceMembers.map(u => ({ id: u.id, display: u.username }))}
                        markup="[@__display__](__id__)"
                        renderSuggestion={(suggestion, search, highlightedDisplay) => (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {suggestion.display?.toString().charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-[#172B4D]">{highlightedDisplay}</span>
                          </div>
                        )}
                        className="text-[#0052CC] bg-[#E9F2FF] rounded px-1 font-medium"
                      />
                    </MentionsInput>
                  </div>
                  {!commentInput && (
                    <div className="flex items-center gap-2">
                      <span onClick={() => setCommentInput('Who is working on this...?')} className="text-xs text-[#5E6C84] hover:text-[#172B4D] cursor-pointer font-medium bg-[#FFFFFF] px-3 py-1.5 rounded transition-colors">Who is working on this...?</span>
                      <span onClick={() => setCommentInput('Status update...')} className="text-xs text-[#5E6C84] hover:text-[#172B4D] cursor-pointer font-medium bg-[#FFFFFF] px-3 py-1.5 rounded transition-colors">Status update...</span>
                    </div>
                  )}
                  {commentInput && (
                    <div className="flex gap-2">
                      <button onClick={handleAddComment} className="px-3 py-1.5 bg-[#0052CC] hover:bg-[#0065FF] text-white text-xs font-medium rounded transition-colors">Save</button>
                      <button onClick={() => setCommentInput('')} className="px-3 py-1.5 hover:bg-[#EBECF0] text-[#172B4D] text-xs font-medium rounded transition-colors">Cancel</button>
                    </div>
                  )}
                  <div className="mt-5 flex items-center justify-between border-t border-[#DFE1E6] pt-3">
                    <p className="text-[11px] text-[#5E6C84]">Pro tip: press <span className="font-bold bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#DFE1E6]">Enter</span> to comment</p>
                  </div>
                </div>
              </div>

              {/* Render Comments */}
              {comments.length > 0 && (
                <div className="space-y-4 mt-6">
                  {comments.map((comment: any) => (
                     <div key={comment.id} className="flex gap-4">
                       <div className="w-8 h-8 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-xs font-bold shrink-0">
                         {comment.author}
                       </div>
                       <div className="flex-1">
                         <div className="flex items-center gap-2 mb-1">
                           <span className="text-[#172B4D] text-sm font-semibold">{comment.author}</span>
                           <span className="text-[#5E6C84] text-xs">{comment.timestamp}</span>
                         </div>
                         <p className="text-[#172B4D] text-sm whitespace-pre-wrap">{renderCommentText(comment.text)}</p>
                         <div className="flex gap-3 mt-2 text-xs font-medium text-[#5E6C84]">
                           <button className="hover:underline">Edit</button>
                           <button className="hover:underline">Delete</button>
                         </div>
                       </div>
                     </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column (Sidebar) */}
          <div className="w-[340px] bg-[#F4F5F7] p-6 overflow-y-auto custom-scrollbar">

            <div className="flex items-center gap-2 mb-6">
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#EBECF0] hover:bg-[#DFE1E6] text-[#172B4D] text-sm font-semibold rounded transition-colors"
                >
                  {issue.status} <ChevronDown className="w-4 h-4" />
                </button>
                {showStatusDropdown && (
                  <div className="absolute top-full mt-1 left-0 w-40 bg-[#F4F5F7] border border-[#DFE1E6] rounded-lg shadow-xl overflow-hidden z-10 py-1">
                    {["To Do", "In Progress", "Done"].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${s === issue.status ? 'bg-[#EBECF0] text-[#0052CC] font-medium border-l-2 border-[#0052CC]' : 'text-[#42526E] hover:bg-[#EBECF0]'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="p-1.5 hover:bg-[#DFE1E6] text-[#5E6C84] rounded transition-colors"><Zap className="w-4 h-4" /></button>
              <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#DFE1E6] text-[#172B4D] text-sm font-medium rounded transition-colors">
                <Settings className="w-4 h-4" /> Improve Task
              </button>
            </div>

            <div className="space-y-6">
              <div className="border border-[#DFE1E6] rounded-lg bg-white">
                <button className="w-full flex items-center justify-between p-3 text-sm font-semibold text-[#172B4D] hover:bg-[#EBECF0] rounded-t-lg transition-colors">
                  Details <ChevronDown className="w-4 h-4 text-[#5E6C84]" />
                </button>
                <div className="p-4 border-t border-[#DFE1E6] space-y-4">
                  {/* Assignee */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-sm text-[#5E6C84] pt-1">Assignee</div>
                    <div className="col-span-2 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-[#172B4D] hover:bg-[#EBECF0] p-1.5 -ml-1.5 rounded cursor-pointer transition-colors">
                        <div className="w-6 h-6 rounded-full bg-[#FFFFFF] flex items-center justify-center border border-[#DFE1E6]">
                          <User className="w-3 h-3 text-[#5E6C84]" />
                        </div>
                        {issue.assignee === 'U' || issue.assignee === 'A' ? 'Unassigned' : issue.assignee}
                      </div>
                      <a href="#" className="text-sm text-[#0052CC] hover:underline font-medium block">Assign to me</a>
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-sm text-[#5E6C84] pt-1.5">Labels</div>
                    <div className="col-span-2">
                      <div className="text-sm text-[#172B4D] hover:bg-[#EBECF0] p-1.5 -ml-1.5 rounded cursor-pointer transition-colors">None</div>
                    </div>
                  </div>

                  {/* Parent */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-sm text-[#5E6C84] pt-1.5">Parent</div>
                    <div className="col-span-2">
                      <div className="text-sm text-[#172B4D] hover:bg-[#EBECF0] p-1.5 -ml-1.5 rounded cursor-pointer transition-colors">None</div>
                    </div>
                  </div>

                  {/* Due date */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-sm text-[#5E6C84] pt-1.5">Due date</div>
                    <div className="col-span-2">
                      <div className="text-sm text-[#172B4D] hover:bg-[#EBECF0] p-1.5 -ml-1.5 rounded cursor-pointer transition-colors text-indigo-700 font-semibold">{issue.startDate} to {issue.endDate}</div>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-sm text-[#5E6C84] pt-1.5">Priority</div>
                    <div className="col-span-2">
                      <div className="text-sm text-[#172B4D] hover:bg-[#EBECF0] p-1.5 -ml-1.5 rounded cursor-pointer flex items-center gap-2 transition-colors">
                        {issue.priority}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Tracking */}
              <TimeTrackingSidebar 
                timeEstimated={timeEstimated} 
                timeLogged={timeLogged} 
                onLogWork={handleLogWork} 
              />

              {/* Meta information */}
              <div className="text-xs text-[#5E6C84] space-y-1">
                <p>Created just now</p>
                <p>Updated just now</p>
              </div>

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
