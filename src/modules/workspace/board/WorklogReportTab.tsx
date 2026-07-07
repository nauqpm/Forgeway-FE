"use client";

import { useEffect, useState, useMemo, Fragment, useCallback } from "react";
import {
  Clock,
  Download,
  Calendar,
  FileText,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { exportWorklogReportToExcel } from "../shared/utils/exportExcel";
import CustomDatePicker from "@/shared/components/CustomDatePicker";

interface WorklogReportTabProps {
  workspaceId: string;
  workspaceKey: string;
  onSelectTask?: (task: { id: string; key: string; title: string; type: string }) => void;
  currentUserId?: string;
}

interface ReportTask {
  taskId: string;
  taskKey: string;
  taskTitle: string;
  taskType?: string;
  totalHours: number;
  periodHours: Record<string, number>;
}

interface ReportUser {
  userId: string;
  userName: string;
  avatarUrl?: string;
  totalHours: number;
  tasks: ReportTask[];
}

interface ReportData {
  periods: string[];
  users: ReportUser[];
  grandTotalHours: number;
}

export default function WorklogReportTab({
  workspaceId,
  workspaceKey,
  onSelectTask,
  currentUserId,
}: WorklogReportTabProps) {
  const [groupBy, setGroupBy] = useState<"week" | "month" | "day">("day");

  // Default date range: start of current month to end of current month
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // 1st of month
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [taskKeyFilter, setTaskKeyFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [showAllTasksUsers, setShowAllTasksUsers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (reportData && reportData.users.length > 0) {
      const initialExpanded: Record<string, boolean> = {};
      reportData.users.forEach((u, idx) => {
        if (idx === 0 || u.userId === currentUserId) {
          initialExpanded[u.userId] = true;
        } else {
          initialExpanded[u.userId] = false;
        }
      });
      setExpandedUsers(initialExpanded);
      setShowAllTasksUsers({});
    }
  }, [reportData, currentUserId]);

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const toggleShowAllTasks = (userId: string) => {
    setShowAllTasksUsers((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleExpandAll = () => {
    if (!reportData) return;
    const expanded: Record<string, boolean> = {};
    reportData.users.forEach((u) => {
      expanded[u.userId] = true;
    });
    setExpandedUsers(expanded);
  };

  const handleCollapseAll = () => {
    if (!reportData) return;
    const expanded: Record<string, boolean> = {};
    reportData.users.forEach((u) => {
      expanded[u.userId] = false;
    });
    setExpandedUsers(expanded);
  };

  const fetchReport = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setIsLoading(true);
      setError(null);
      setSelectedPeriod(null);

      const params: Record<string, string | number | boolean> = {
        startDate,
        endDate,
        groupBy,
      };
      if (taskKeyFilter.trim()) {
        params.taskKey = taskKeyFilter.trim();
      }

      const response = await api.get(
        apiRoutes.TASKS.BOARD_TASK_WORK_LOG_REPORT(workspaceId),
        { params }
      );

      if (response.data) {
        setReportData(response.data);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Failed to load worklog report");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, groupBy, startDate, endDate, taskKeyFilter]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = () => {
    if (!reportData) return;
    exportWorklogReportToExcel(
      reportData.periods,
      reportData.users,
      workspaceKey,
      startDate,
      endDate,
      `worklog-report-${workspaceKey}-${groupBy}-${startDate}-to-${endDate}.xlsx`
    );
  };

  // Calculate sum per period column for the grand total row
  const periodTotals = useMemo(() => {
    if (!reportData) return {};
    const totals: Record<string, number> = {};

    reportData.periods.forEach((p) => {
      totals[p] = 0;
    });

    reportData.users.forEach((user) => {
      user.tasks.forEach((task) => {
        reportData.periods.forEach((p) => {
          totals[p] += task.periodHours[p] || 0;
        });
      });
    });

    return totals;
  }, [reportData]);

  const getAvatarUrl = (url?: string | null) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    const baseUrl = (process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5512").replace(/\/$/, "");
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${baseUrl}${path}`;
  };

  return (
    <div className="w-full space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EAEAEA] dark:border-white/[0.06] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#111111] dark:text-[#E8E8E7]">Worklogs Report</h2>
          <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] mt-1">
            Track and group user work logs by weeks or months.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reportData && reportData.users.length > 0 && (
            <>
              <button
                onClick={handleExpandAll}
                className="inline-flex items-center gap-1.5 border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] text-[#111111] dark:text-[#E8E8E7] px-3 py-2 rounded-[6px] text-[0.8125rem] font-semibold hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] transition-colors shadow-sm"
              >
                Expand All
              </button>
              <button
                onClick={handleCollapseAll}
                className="inline-flex items-center gap-1.5 border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] text-[#111111] dark:text-[#E8E8E7] px-3 py-2 rounded-[6px] text-[0.8125rem] font-semibold hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] transition-colors shadow-sm"
              >
                Collapse All
              </button>
            </>
          )}
          <button
            onClick={handleExport}
            disabled={!reportData || reportData.users.length === 0}
            className="inline-flex items-center gap-2 border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] text-[#111111] dark:text-[#E8E8E7] px-3.5 py-2 rounded-[6px] text-[0.8125rem] font-semibold hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-4 bg-[#F7F6F3] dark:bg-white/[0.02] border border-[#EAEAEA] dark:border-white/5 p-4 rounded-[8px]">
        {/* Date Range */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.75rem] font-semibold text-[#5E6C84] dark:text-[#9B9A97] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Date range
          </label>
          <div className="flex items-center gap-2">
            <CustomDatePicker
              value={startDate}
              onChange={(v) => setStartDate(v ?? "")}
              placeholder="Start date"
              popoverPlacement="bottom-start"
            />
            <span className="text-[#ABABAB] dark:text-[#6B6B6B]">&rarr;</span>
            <CustomDatePicker
              value={endDate}
              onChange={(v) => setEndDate(v ?? "")}
              placeholder="End date"
              popoverPlacement="bottom-start"
            />
          </div>
        </div>

        {/* Group By */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.75rem] font-semibold text-[#5E6C84] dark:text-[#9B9A97]">Group by</label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as "week" | "month" | "day")}
            className="px-3 py-1.5 rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] text-[0.8125rem] bg-white dark:bg-[#202020] text-[#111111] dark:text-[#E8E8E7] focus:outline-none focus:border-[#2563EB] pr-8"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>

        {/* Filter Task */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-[0.75rem] font-semibold text-[#5E6C84] dark:text-[#9B9A97]">Filter task</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Task Key or Title..."
              value={taskKeyFilter}
              onChange={(e) => setTaskKeyFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] text-[0.8125rem] bg-white dark:bg-[#202020] text-[#111111] dark:text-[#E8E8E7] placeholder-[#ABABAB] dark:placeholder-[#6B6B6B] focus:outline-none focus:border-[#2563EB]"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
          </div>
        </div>

        {/* Search / Refresh Button */}
        <button
          onClick={fetchReport}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] text-white px-4 py-2 rounded-[6px] text-[0.8125rem] font-semibold transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Reload
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 text-[0.8125rem] text-[#DE350B] bg-[#FFEBE6] dark:bg-[#421F1C] dark:text-[#FF8F73] rounded-[6px]">
          {error}
        </div>
      )}

      {/* Report Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-[#787774] dark:text-[#9B9A97] text-[0.8125rem]">
          <RefreshCw className="w-5 h-5 animate-spin text-[#2563EB]" />
          Loading report data...
        </div>
      ) : !reportData || reportData.users.length === 0 ? (
        <div className="py-20 text-center text-[#787774] dark:text-[#9B9A97] text-[0.8125rem] border border-dashed border-[#EAEAEA] dark:border-white/5 rounded-[8px]">
          <div className="flex flex-col items-center justify-center gap-2">
            <Clock className="w-8 h-8 text-[#EAEAEA] dark:text-white/10" />
            <p>No worklog entries found matching current filters.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[8px] border border-[#EAEAEA] dark:border-white/5 shadow-sm max-w-full">
          <table className="w-full text-left border-collapse text-[0.8125rem]">
            <thead>
              <tr className="bg-[#F7F6F3] dark:bg-white/[0.04] border-b border-[#EAEAEA] dark:border-white/5 text-[#5E6C84] dark:text-[#9B9A97] font-semibold">
                <th className="p-3 sticky left-0 bg-[#F7F6F3] dark:bg-[#202020] min-w-[150px] max-w-[150px] w-[150px] z-20">User</th>
                <th className="p-3 sticky left-[150px] bg-[#F7F6F3] dark:bg-[#202020] min-w-[280px] max-w-[280px] w-[280px] z-20">Issues</th>
                <th className="p-3 sticky left-[430px] bg-[#F7F6F3] dark:bg-[#202020] min-w-[80px] max-w-[80px] w-[80px] z-20 text-center border-r border-[#EAEAEA] dark:border-white/10 font-semibold">Total</th>
                {reportData.periods.map((period) => {
                  const isSelected = selectedPeriod === period;
                  return (
                    <th
                      key={period}
                      onClick={() => setSelectedPeriod(selectedPeriod === period ? null : period)}
                      className={`p-3 text-center font-medium min-w-[100px] cursor-pointer select-none transition-colors ${isSelected
                        ? "bg-[#EFF6FF] text-[#2563EB] dark:bg-[rgba(37,99,235,0.15)] dark:text-[#93C5FD] font-semibold"
                        : "hover:bg-[#F7F6F3] dark:hover:bg-white/[0.08]"
                        }`}
                    >
                      {period}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {reportData.users.map((user) => {
                const initials = user.userName.charAt(0).toUpperCase();
                const isExpanded = !!expandedUsers[user.userId];
                const showAll = !!showAllTasksUsers[user.userId];
                const tasksToShow = showAll ? user.tasks : user.tasks.slice(0, 5);
                const hasMoreTasks = user.tasks.length > 5;

                return (
                  <Fragment key={user.userId}>
                    {/* User header row */}
                    <tr className="border-b border-[#EAEAEA] dark:border-white/5 bg-[#FDFDFD] dark:bg-white/[0.01]">
                      <td 
                        onClick={() => toggleUserExpand(user.userId)}
                        className="p-3 font-semibold text-[#111111] dark:text-[#E8E8E7] sticky left-0 bg-[#FDFDFD] dark:bg-[#1a1a1a] min-w-[150px] max-w-[150px] w-[150px] z-10 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#ABABAB] dark:text-[#6B6B6B] shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </span>
                          {user.avatarUrl ? (
                            <img src={getAvatarUrl(user.avatarUrl)} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-[0.75rem] font-bold shrink-0">
                              {initials}
                            </div>
                          )}
                          <span className="truncate max-w-[100px]" title={user.userName}>{user.userName}</span>
                        </div>
                      </td>
                      <td 
                        onClick={() => toggleUserExpand(user.userId)}
                        className="p-3 text-[#ABABAB] dark:text-[#6B6B6B] italic sticky left-[150px] bg-[#FDFDFD] dark:bg-[#1a1a1a] min-w-[280px] max-w-[280px] w-[280px] z-10 cursor-pointer select-none"
                      >
                        All logs for this user
                      </td>
                      <td className="p-3 font-bold text-center text-[#111111] dark:text-[#E8E8E7] sticky left-[430px] bg-[#FDFDFD] dark:bg-[#1a1a1a] min-w-[80px] max-w-[80px] w-[80px] z-10 border-r border-[#EAEAEA] dark:border-white/10">
                        {user.totalHours}h
                      </td>
                      {reportData.periods.map((p) => {
                        const periodSum = user.tasks.reduce(
                          (sum, t) => sum + (t.periodHours[p] || 0),
                          0
                        );
                        const isSelected = selectedPeriod === p;
                        return (
                          <td
                            key={p}
                            onClick={() => setSelectedPeriod(selectedPeriod === p ? null : p)}
                            className={`p-3 text-center font-bold transition-colors cursor-pointer ${isSelected
                              ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#93C5FD]"
                              : "text-[#111111] dark:text-[#E8E8E7]"
                              }`}
                          >
                            {periodSum > 0 ? `${periodSum}h` : ""}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Task rows (Level 1 expanded tasks) */}
                    {isExpanded && tasksToShow.map((task) => (
                      <tr
                        key={task.taskId}
                        className="group border-b border-[#EAEAEA] dark:border-white/5 hover:bg-[#F7F6F3]/50 dark:hover:bg-[#2A2A2A]/50 transition-colors"
                      >
                        <td className="p-3 sticky left-0 bg-white dark:bg-[#1a1a1a] group-hover:bg-[#F7F6F3]/50 dark:group-hover:bg-[#2A2A2A]/50 border-r border-[#EAEAEA]/40 dark:border-white/5 z-10 min-w-[150px] max-w-[150px] w-[150px] transition-colors">
                          {/* Left column empty under the user block */}
                        </td>
                        <td className="p-3 sticky left-[150px] bg-white dark:bg-[#1a1a1a] group-hover:bg-[#F7F6F3]/50 dark:group-hover:bg-[#2A2A2A]/50 z-10 min-w-[280px] max-w-[280px] w-[280px] transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText
                              className={`h-4 w-4 shrink-0 ${task.taskType?.toLowerCase() === "bug"
                                ? "text-red-500"
                                : task.taskType?.toLowerCase() === "story"
                                  ? "text-emerald-500"
                                  : "text-blue-500"
                                }`}
                            />
                            <button
                              onClick={() =>
                                onSelectTask &&
                                onSelectTask({
                                  id: task.taskId,
                                  key: task.taskKey,
                                  title: task.taskTitle,
                                  type: task.taskType || "task",
                                })
                              }
                              className="font-mono text-[#2563EB] dark:text-[#3B82F6] hover:underline shrink-0"
                            >
                              {task.taskKey}
                            </button>
                            <span className="text-[#111111] dark:text-[#E8E8E7] truncate block" title={task.taskTitle}>
                              {task.taskTitle}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-semibold text-[#5E6C84] dark:text-[#9B9A97] sticky left-[430px] bg-white dark:bg-[#1a1a1a] group-hover:bg-[#F7F6F3]/50 dark:group-hover:bg-[#2A2A2A]/50 z-10 min-w-[80px] max-w-[80px] w-[80px] border-r border-[#EAEAEA] dark:border-white/10 transition-colors">
                          {task.totalHours}h
                        </td>
                        {reportData.periods.map((p) => {
                          const hrs = task.periodHours[p];
                          const isSelected = selectedPeriod === p;
                          return (
                            <td
                              key={p}
                              onClick={() => setSelectedPeriod(selectedPeriod === p ? null : p)}
                              className={`p-3 text-center transition-colors cursor-pointer ${isSelected
                                ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.10)] text-[#2563EB] dark:text-[#93C5FD] font-medium"
                                : "text-[#172B4D] dark:text-[#E8E8E7]"
                                }`}
                            >
                              {hrs ? `${hrs}h` : ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Show more/less button row (Level 2 pagination) */}
                    {isExpanded && hasMoreTasks && (
                      <tr className="border-b border-[#EAEAEA] dark:border-white/5">
                        <td className="p-3 sticky left-0 bg-white dark:bg-[#1a1a1a] border-r border-[#EAEAEA]/40 dark:border-white/5 z-10"></td>
                        <td className="p-3 sticky left-[150px] bg-white dark:bg-[#1a1a1a] z-10">
                          <button
                            onClick={() => toggleShowAllTasks(user.userId)}
                            className="text-[#2563EB] dark:text-[#3B82F6] hover:underline font-semibold text-[0.8125rem]"
                          >
                            {showAll ? "Show less tasks" : `Show ${user.tasks.length - 5} more tasks...`}
                          </button>
                        </td>
                        <td className="p-3 sticky left-[430px] bg-white dark:bg-[#1a1a1a] z-10 border-r border-[#EAEAEA] dark:border-white/10"></td>
                        <td colSpan={reportData.periods.length} className="p-3"></td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {/* Grand Total Row */}
              <tr className="bg-[#F7F6F3] dark:bg-white/[0.04] border-t border-t-[#ABABAB]/40 dark:border-t-white/10 font-bold">
                <td className="p-3 sticky left-0 bg-[#F7F6F3] dark:bg-[#202020] z-10 text-[#111111] dark:text-[#E8E8E7] min-w-[150px] max-w-[150px] w-[150px]">
                  Grand Total
                </td>
                <td className="p-3 sticky left-[150px] bg-[#F7F6F3] dark:bg-[#202020] z-10 min-w-[280px] max-w-[280px] w-[280px]"></td>
                <td className="p-3 text-center text-[#111111] dark:text-[#E8E8E7] sticky left-[430px] bg-[#F7F6F3] dark:bg-[#202020] z-10 min-w-[80px] max-w-[80px] w-[80px] border-r border-[#EAEAEA] dark:border-white/10">
                  {reportData.grandTotalHours}h
                </td>
                {reportData.periods.map((p) => {
                  const total = periodTotals[p] || 0;
                  const isSelected = selectedPeriod === p;
                  return (
                    <td
                      key={p}
                      onClick={() => setSelectedPeriod(selectedPeriod === p ? null : p)}
                      className={`p-3 text-center transition-colors cursor-pointer ${isSelected
                        ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.15)] text-[#2563EB] dark:text-[#93C5FD]"
                        : "text-[#111111] dark:text-[#E8E8E7]"
                        }`}
                    >
                      {total > 0 ? `${total}h` : ""}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
