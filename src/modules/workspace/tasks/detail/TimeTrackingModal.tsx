import React, { useState, useEffect } from "react";
import { X, Calendar, Sparkles, ChevronDown, Link, Undo, Redo, History, Info, Paperclip } from "lucide-react";
import { TaskDetailResponse } from "@/modules/workspace/shared/types/task-detail.type";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { toast } from "react-hot-toast";

interface TimeTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: TaskDetailResponse;
  workspaceId?: string;
  onUpdateIssue?: (updatedIssue: TaskDetailResponse) => void;
  editWorkLog?: {
    id: string;
    hoursSpent: number;
    description?: string;
    loggedAt: string;
  };
}

export default function TimeTrackingModal({
  isOpen,
  onClose,
  issue,
  workspaceId,
  onUpdateIssue,
  editWorkLog,
}: TimeTrackingModalProps) {
  const [timeSpent, setTimeSpent] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("");
  const [dateStarted, setDateStarted] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  });
  const [timeStarted, setTimeStarted] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  });
  const [description, setDescription] = useState("");
  const [prevLogged, setPrevLogged] = useState(0);

  // Initialize for edit
  useEffect(() => {
    if (isOpen && editWorkLog) {
      // timeSpent could be numeric hours, convert back to a string like '4h' or just '4'
      setTimeSpent(editWorkLog.hoursSpent.toString() + "h");
      setDescription(editWorkLog.description || "");
      if (editWorkLog.loggedAt) {
        const d = new Date(editWorkLog.loggedAt);
        setDateStarted(d.toISOString().split("T")[0]);
        setTimeStarted(d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
      }
    } else if (isOpen) {
      // Reset for create
      setTimeSpent("");
      setDescription("");
      const d = new Date();
      setDateStarted(d.toISOString().split("T")[0]);
      setTimeStarted(d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    }
  }, [isOpen, editWorkLog]);

  const [historyStack, setHistoryStack] = useState<string[]>([""]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Popup overlay states
  const [isLinkPopupOpen, setIsLinkPopupOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [isHistoryPopupOpen, setIsHistoryPopupOpen] = useState(false);

  const pushToHistory = (newVal: string) => {
    const updatedStack = historyStack.slice(0, historyIndex + 1);
    updatedStack.push(newVal);
    setHistoryStack(updatedStack);
    setHistoryIndex(updatedStack.length - 1);
  };

  const handleDescriptionBlur = () => {
    if (description !== historyStack[historyIndex]) {
      pushToHistory(description);
    }
  };

  const handleAiClick = () => {
    const aiSnippets = [
      "Fixed bug in data synchronizer.",
      "Refactored workspace detail views.",
      "Designed modern time tracking UI elements.",
      "Optimized database indexing and queries.",
    ];
    const randomSnippet = aiSnippets[Math.floor(Math.random() * aiSnippets.length)];
    const newVal = description ? `${description}\n- ${randomSnippet}` : `- ${randomSnippet}`;
    setDescription(newVal);
    pushToHistory(newVal);
  };

  const handleTtClick = () => {
    const textarea = document.getElementById("work-desc-textarea") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = selected ? `**${selected}**` : `**Bold text**`;
    const newVal = text.substring(0, start) + replacement + text.substring(end);
    setDescription(newVal);
    pushToHistory(newVal);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2 + (selected ? selected.length : 9));
    }, 0);
  };

  const handleInsertClick = () => {
    const newVal = description ? `${description}\n- ` : `- `;
    setDescription(newVal);
    pushToHistory(newVal);
    const textarea = document.getElementById("work-desc-textarea") as HTMLTextAreaElement;
    if (textarea) {
      setTimeout(() => {
        textarea.focus();
      }, 0);
    }
  };

  const handleLinkClick = () => {
    const textarea = document.getElementById("work-desc-textarea") as HTMLTextAreaElement;
    if (textarea) {
      const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      setLinkText(selected);
    }
    setIsLinkPopupOpen((prev) => !prev);
    setIsHistoryPopupOpen(false);
  };

  const handleInsertLink = () => {
    if (!linkUrl) return;
    const textarea = document.getElementById("work-desc-textarea") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const label = linkText || selected || "Link label";
    const replacement = `[${label}](${linkUrl})`;
    const newVal = text.substring(0, start) + replacement + text.substring(end);
    setDescription(newVal);
    pushToHistory(newVal);
    setIsLinkPopupOpen(false);
    setLinkUrl("");
    setLinkText("");
  };

  const handleUploadClick = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.onchange = (e: Event) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (file) {
        const attachmentText = description ? `\n[Attachment: ${file.name}]` : `[Attachment: ${file.name}]`;
        const newVal = description + attachmentText;
        setDescription(newVal);
        pushToHistory(newVal);
      }
    };
    fileInput.click();
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setDescription(historyStack[prevIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setDescription(historyStack[nextIdx]);
    }
  };

  const handleHistoryClick = () => {
    setIsHistoryPopupOpen((prev) => !prev);
    setIsLinkPopupOpen(false);
  };

  const handleRestoreHistory = (idx: number) => {
    setHistoryIndex(idx);
    setDescription(historyStack[idx]);
    setIsHistoryPopupOpen(false);
  };

  // Load previously logged work from localStorage for persistence
  useEffect(() => {
    if (isOpen && issue.id) {
      // Fetch latest total hours from backend to ensure accuracy
      const fetchTotal = async () => {
        try {
          const wId = issue.workspaceId || workspaceId || "";
          const res = await api.get(apiRoutes.TASKS.BOARD_TASK_WORK_LOGS(wId, issue.id));
          const total = res.data?.totalHours || 0;
          setPrevLogged(total);
        } catch (err) {
          console.error("Failed to fetch total logged hours", err);
          // Fallback to issue.timeLogged
          const loggedHrs = issue.timeLogged ? issue.timeLogged : 0;
          setPrevLogged(loggedHrs);
        }
      };
      fetchTotal();

      if (issue.timeEstimated !== undefined && issue.timeEstimated !== null) {
        setTimeRemaining(String(issue.timeEstimated));
      } else {
        setTimeRemaining("");
      }
    } else if (!isOpen) {
      // Reset form states when closed
      setTimeSpent("");
      setTimeRemaining("");
      setDescription("");
      const d = new Date();
      setDateStarted(d.toISOString().split("T")[0]);
      setTimeStarted(d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
      setHistoryStack([""]);
      setHistoryIndex(0);
      setIsLinkPopupOpen(false);
      setLinkUrl("");
      setLinkText("");
      setIsHistoryPopupOpen(false);
    }
  }, [isOpen, issue, workspaceId]);

  if (!isOpen) return null;

  // Validation: Accept single unit hours e.g., 4 or 4h or 4.5 or 4.5h
  const parseHoursInput = (val: string | number): number | null => {
    if (typeof val === 'number') return val > 0 ? val : 0;
    if (!val) return null;
    const cleaned = String(val).trim().toLowerCase();
    if (!cleaned) return null;
    const num = parseFloat(cleaned.replace("h", ""));
    if (isNaN(num) || num <= 0) return null;
    return num;
  };

  const parsedSpent = parseHoursInput(timeSpent);
  const parsedRemaining = timeRemaining ? parseHoursInput(timeRemaining) : 0;
  const isSaveDisabled = parsedSpent === null;

  const handleSave = async () => {
    if (parsedSpent === null) return;

    try {
      // Call the dedicated Work Logs API
      // safely parse loggedAt
      let parsedLoggedAt = new Date().toISOString();
      try {
        const combinedStr = `${dateStarted} ${timeStarted}`;
        const d = new Date(combinedStr);
        if (!isNaN(d.getTime())) {
          parsedLoggedAt = d.toISOString();
        } else {
          // Fallback if parsing fails (e.g. invalid time string)
          const fallbackD = new Date(dateStarted);
          if (!isNaN(fallbackD.getTime())) {
            parsedLoggedAt = fallbackD.toISOString();
          }
        }
      } catch {
        // fallback to now
      }

      const payload = {
        hoursSpent: parsedSpent,
        timeEstimated: parsedRemaining || undefined,
        description: description,
        loggedAt: parsedLoggedAt,
      };

      const wId = issue.workspaceId || workspaceId || "";

      if (editWorkLog) {
        // Edit mode: PATCH to update the existing work log
        await api.patch(
          apiRoutes.TASKS.BOARD_TASK_WORK_LOG_UPDATE(wId, issue.id, editWorkLog.id),
          payload
        );
      } else {
        // Create mode: POST a new work log
        await api.post(
          apiRoutes.TASKS.BOARD_TASK_WORK_LOGS(wId, issue.id),
          payload
        );
      }

      // Recalculate optimistic display value
      // Edit: replace old hours with new hours; Create: add new hours on top
      const newLogged = editWorkLog
        ? Math.max(0, prevLogged - editWorkLog.hoursSpent) + parsedSpent
        : prevLogged + parsedSpent;

      // Call update callback if provided
      if (onUpdateIssue) {
        onUpdateIssue({
          ...issue,
          timeLogged: newLogged, // numeric hours
          timeEstimated: parsedRemaining ?? undefined, // numeric hours, not raw string
        });
      }

      toast.success(editWorkLog ? `Updated work log for Task ${issue.key}` : `Logged time to Task ${issue.key}`);
      onClose();
    } catch (error) {
      console.error("Failed to log work:", error);
      toast.error("Failed to log work");
    }
  };

  const liveSpent = parsedSpent || 0;
  
  // If editing, baseLogged is total task logged minus the old hours of this log
  const baseLogged = editWorkLog ? Math.max(0, prevLogged - editWorkLog.hoursSpent) : prevLogged;
  const displayLogged = baseLogged + liveSpent;
  
  const displayRemaining = parsedRemaining || 0;
  const totalForBar = displayLogged + displayRemaining;
  const progressPercent = totalForBar > 0 ? (displayLogged / totalForBar) * 100 : 0;

  const formatTime = (hours: number) => {
    if (hours < 1) {
      const mins = Math.round(hours * 60);
      return `${mins}m`;
    }
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <div 
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/55 p-4 transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] bg-white dark:bg-[#1E1E1E] text-[#172B4D] dark:text-[#E8E8E7] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] shadow-xl overflow-hidden"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 className="text-[1.125rem] font-semibold text-[#172B4D] dark:text-[#F4F5F7]">Time tracking</h2>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-[#F4F5F7] dark:hover:bg-white/5 rounded-[4px] text-[#5E6C84] dark:text-[#9B9A97] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar (Visible if task has logged hours or user is typing) */}
        {(displayLogged > 0 || displayRemaining > 0) && (
          <div className="px-5 pt-3 pb-1">
            <div className="w-full bg-[#DFE1E6] dark:bg-[#2A2A2A] h-2 rounded-[4px] overflow-hidden">
              <div 
                className="bg-[#5B8A1C] h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[0.8125rem] text-[#5E6C84] dark:text-[#9B9A97] mt-1 font-medium">
              {formatTime(displayLogged)} logged
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-5 pt-2 space-y-4 text-[0.875rem]">
          {/* Spent and Remaining inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[0.8125rem] font-semibold text-[#5E6C84] dark:text-[#9B9A97]">Time spent</label>
              <input
                type="text"
                value={timeSpent}
                onChange={(e) => setTimeSpent(e.target.value)}
                placeholder="e.g. 4h"
                className="w-full px-3 py-1.5 border-2 border-[#DFE1E6] dark:border-[#2A2A2A] focus:border-[#4C9AFF] dark:focus:border-[#3B82F6] bg-white dark:bg-[#252525] rounded-[3px] text-[0.875rem] outline-none transition-colors"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <label className="block text-[0.8125rem] font-semibold text-[#5E6C84] dark:text-[#9B9A97]">Time remaining</label>
                <span title="If time remaining isn't what you expect, manually update it here." className="cursor-pointer"><Info className="w-3.5 h-3.5 text-[#5E6C84] dark:text-[#9B9A97]" /></span>
              </div>
              <input
                type="text"
                value={timeRemaining}
                onChange={(e) => setTimeRemaining(e.target.value)}
                placeholder="e.g. 2h"
                className="w-full px-3 py-1.5 border-2 border-[#DFE1E6] dark:border-[#2A2A2A] focus:border-[#4C9AFF] dark:focus:border-[#3B82F6] bg-white dark:bg-[#252525] rounded-[3px] text-[0.875rem] outline-none transition-colors"
              />
            </div>
          </div>

          {/* Help Format */}
          <div className="text-[0.8125rem] text-[#5E6C84] dark:text-[#9B9A97] space-y-1">
            <p>Use the format: e.g., 4 or 4h</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[0.75rem]">
              <li>h = hours (e.g. 1.5h or 2)</li>
            </ul>
          </div>

          {timeSpent.trim() !== "" && (
            <>
              {/* Date Started */}
              <div className="space-y-1.5">
                <label className="block text-[0.8125rem] font-semibold text-[#5E6C84] dark:text-[#9B9A97]">
                  Date started <span className="text-[#DE350B]">*</span>
                </label>
                <div className="flex items-center gap-2 w-full px-3 py-1.5 border-2 border-[#DFE1E6] dark:border-[#2A2A2A] bg-white dark:bg-[#252525] rounded-[3px]">
                  <Calendar className="w-4 h-4 text-[#5E6C84] dark:text-[#9B9A97]" />
                  <input
                    type="date"
                    value={dateStarted}
                    onChange={(e) => setDateStarted(e.target.value)}
                    className="bg-transparent text-[0.875rem] outline-none text-[#172B4D] dark:text-[#E8E8E7] cursor-pointer"
                  />
                  <span className="text-[#DFE1E6] dark:text-[#2A2A2A]">|</span>
                  <input
                    type="text"
                    value={timeStarted}
                    onChange={(e) => setTimeStarted(e.target.value)}
                    className="bg-transparent text-[0.875rem] outline-none text-[#172B4D] dark:text-[#E8E8E7] w-20"
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      setTimeSpent("");
                      setTimeRemaining("");
                      setDescription("");
                    }}
                    className="ml-auto text-[#5E6C84] dark:text-[#9B9A97] hover:text-[#DE350B] text-[0.75rem]"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Work Description with Toolbar */}
              <div className="space-y-1.5">
                <label className="block text-[0.8125rem] font-semibold text-[#5E6C84] dark:text-[#9B9A97]">Work description</label>
                <div className="relative border-2 border-[#DFE1E6] dark:border-[#2A2A2A] rounded-[3px] overflow-hidden">
                  {/* Toolbar */}
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-[#F4F5F7] dark:bg-[#2A2A2A] border-b border-[#DFE1E6] dark:border-[#2A2A2A]">
                    <button type="button" onClick={handleAiClick} tabIndex={-1} className="p-1 hover:bg-[#EBECF0] dark:hover:bg-white/5 rounded text-[#5E6C84] dark:text-[#9B9A97]" title="AI Assistant">
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={handleAiClick} tabIndex={-1} className="p-0.5 hover:bg-[#EBECF0] dark:hover:bg-white/5 rounded text-[#5E6C84] dark:text-[#9B9A97]">
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <span className="text-[#DFE1E6] dark:text-[#2A2A2A]">|</span>
                    <button type="button" onClick={handleTtClick} tabIndex={-1} className="px-1 py-0.5 hover:bg-[#EBECF0] dark:hover:bg-white/5 rounded text-[0.75rem] font-semibold text-[#5E6C84] dark:text-[#9B9A97]" title="Format text (bold)">
                      Tt
                    </button>
                    <button type="button" onClick={handleInsertClick} tabIndex={-1} className="px-1 py-0.5 hover:bg-[#EBECF0] dark:hover:bg-white/5 rounded text-[0.75rem] font-bold text-[#5E6C84] dark:text-[#9B9A97]" title="Insert item">
                      +
                    </button>
                    <button type="button" onClick={handleLinkClick} tabIndex={-1} className={`p-1 rounded transition-colors ${isLinkPopupOpen ? "bg-[#DEEBFF] text-[#0747A6] dark:bg-[#0747A6]/30 dark:text-[#4C9AFF]" : "text-[#5E6C84] dark:text-[#9B9A97] hover:bg-[#EBECF0] dark:hover:bg-white/5"}`} title="Insert link">
                      <Link className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={handleUploadClick} tabIndex={-1} className="p-1 hover:bg-[#EBECF0] dark:hover:bg-white/5 rounded text-[#5E6C84] dark:text-[#9B9A97]" title="Upload file">
                      <Paperclip className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[#DFE1E6] dark:text-[#2A2A2A]">|</span>
                    <button type="button" onClick={handleUndo} tabIndex={-1} className="p-1 hover:bg-[#EBECF0] dark:hover:bg-white/5 rounded text-[#5E6C84] dark:text-[#9B9A97]" title="Undo">
                      <Undo className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={handleRedo} tabIndex={-1} className="p-1 hover:bg-[#EBECF0] dark:hover:bg-white/5 rounded text-[#5E6C84] dark:text-[#9B9A97]" title="Redo">
                      <Redo className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={handleHistoryClick} tabIndex={-1} className={`p-1 rounded transition-colors ${isHistoryPopupOpen ? "bg-[#DEEBFF] text-[#0747A6] dark:bg-[#0747A6]/30 dark:text-[#4C9AFF]" : "text-[#5E6C84] dark:text-[#9B9A97] hover:bg-[#EBECF0] dark:hover:bg-white/5"}`} title="History logs">
                      <History className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Textarea */}
                  <textarea
                    id="work-desc-textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleDescriptionBlur}
                    placeholder="Type /ai to Ask Rovo or @ to mention and notify someone."
                    className="w-full p-3 bg-white dark:bg-[#252525] text-[#172B4D] dark:text-[#E8E8E7] text-[0.875rem] min-h-[90px] outline-none resize-y text-left"
                  />

                  {/* Link Popup Overlay */}
                  {isLinkPopupOpen && (
                    <div className="absolute left-2 top-8 z-50 w-72 p-3 bg-white dark:bg-[#202020] rounded-[4px] border border-[#DFE1E6] dark:border-white/10 shadow-lg text-[0.8125rem] text-[#172B4D] dark:text-[#E8E8E7] space-y-3">
                      <div className="space-y-1">
                        <label className="block font-medium text-[#5E6C84] dark:text-[#9B9A97]">Paste or search for link</label>
                        <input
                          type="text"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-2.5 py-1.5 border border-[#DFE1E6] dark:border-[#444] bg-white dark:bg-[#1E1E1E] rounded-[3px] outline-none"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-medium text-[#5E6C84] dark:text-[#9B9A97]">Display text (optional)</label>
                        <input
                          type="text"
                          value={linkText}
                          onChange={(e) => setLinkText(e.target.value)}
                          placeholder="Text to display"
                          className="w-full px-2.5 py-1.5 border border-[#DFE1E6] dark:border-[#444] bg-white dark:bg-[#1E1E1E] rounded-[3px] outline-none"
                        />
                      </div>
                      <div className="flex justify-end gap-1.5 pt-1.5 border-t border-[#DFE1E6] dark:border-white/10">
                        <button
                          type="button"
                          onClick={handleInsertLink}
                          disabled={!linkUrl}
                          className="px-3 py-1 bg-[#0052CC] hover:bg-[#0065FF] text-white rounded-[3px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Insert
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsLinkPopupOpen(false);
                            setLinkUrl("");
                            setLinkText("");
                          }}
                          className="px-3 py-1 text-[#5E6C84] dark:text-[#9B9A97] hover:bg-[#EBECF0] dark:hover:bg-white/5 rounded-[3px] font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* History Popup Overlay */}
                  {isHistoryPopupOpen && (
                    <div className="absolute right-2 top-8 z-50 w-64 p-3 bg-white dark:bg-[#202020] rounded-[4px] border border-[#DFE1E6] dark:border-white/10 shadow-lg text-[0.8125rem] text-[#172B4D] dark:text-[#E8E8E7]">
                      <h4 className="font-semibold mb-2 text-[#5E6C84] dark:text-[#9B9A97]">Revisions History</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                        {historyStack.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleRestoreHistory(idx)}
                            className={`w-full text-left p-1.5 rounded transition-colors block truncate hover:bg-[#EBECF0] dark:hover:bg-white/5 ${
                              idx === historyIndex ? "bg-[#EBECF0]/60 dark:bg-white/10 font-semibold text-[#0052CC] dark:text-[#3B82F6]" : ""
                            }`}
                          >
                            {idx === 0 ? "Initial Draft" : `Rev ${idx}: ${item.replace(/\n/g, " ") || "[empty]"}`}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-end pt-2 mt-2 border-t border-[#DFE1E6] dark:border-white/10">
                        <button
                          type="button"
                          onClick={() => setIsHistoryPopupOpen(false)}
                          className="px-2.5 py-1 text-[#5E6C84] dark:text-[#9B9A97] hover:bg-[#EBECF0] dark:hover:bg-white/5 rounded-[3px] font-medium transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 bg-[#F4F5F7] dark:bg-[#252525] border-t border-[#EAEAEA] dark:border-white/[0.06]">
          {isSaveDisabled ? (
            <button
              disabled
              className="px-4 py-2 bg-[#F4F5F7] dark:bg-[#2D2D2D] text-[#A5ADBA] dark:text-white/20 rounded-[3px] text-[0.875rem] font-medium cursor-not-allowed border border-[#DFE1E6] dark:border-transparent"
            >
              Save
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#0052CC] hover:bg-[#0065FF] text-white rounded-[3px] text-[0.875rem] font-medium transition-colors"
            >
              Save
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#5E6C84] dark:text-[#9B9A97] hover:bg-[#EBECF0] dark:hover:bg-white/5 rounded-[3px] text-[0.875rem] font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
