"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  SlidersHorizontal,
  CheckCircle2,
  PencilLine,
  CalendarClock,
  FileText,
} from "lucide-react";
import { Issue } from "@/modules/workspace/shared/types/issue.type";
import WorkspaceMembersPanel from "@/modules/workspace/shared/components/WorkspaceMembersPanel";

type DashboardMetric = {
  completed: number;
  updated: number;
  created: number;
  dueSoon: number;
};


const SUMMARY_FILTER_FIELDS = [
  { id: "assignee", label: "Assignee" },
  { id: "created", label: "Created" },
  { id: "dueDate", label: "Due date" },
  { id: "parent", label: "Parent" },
  { id: "priority", label: "Priority" },
  { id: "status", label: "Status" },
  { id: "updated", label: "Updated" },
  { id: "workType", label: "Work type" },
];

type SummaryTabProps = {
  issues: Issue[];
  workspaceId: string;
  workspaceMongoId?: string;
};

export default function SummaryTab({ issues, workspaceId, workspaceMongoId }: SummaryTabProps) {
  const [isSummaryFilterOpen, setIsSummaryFilterOpen] = useState(false);
  const [summaryFilterSearch, setSummaryFilterSearch] = useState("");
  const [selectedSummaryFields, setSelectedSummaryFields] = useState<string[]>([]);
  const summaryFilterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        isSummaryFilterOpen &&
        summaryFilterRef.current &&
        !summaryFilterRef.current.contains(event.target as Node)
      ) {
        setIsSummaryFilterOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSummaryFilterOpen(false);
    };
    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSummaryFilterOpen]);

  const visibleSummaryFilterFields = useMemo(
    () =>
      SUMMARY_FILTER_FIELDS.filter((field) =>
        field.label.toLowerCase().includes(summaryFilterSearch.toLowerCase())
      ),
    [summaryFilterSearch]
  );

  const summaryFilteredIssues = useMemo(() => {
    if (selectedSummaryFields.length === 0) return issues;
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(now.getDate() + 7);

    return issues.filter((issue) => {
      const matchesAssignee = selectedSummaryFields.includes("assignee")
        ? issue.assignee && issue.assignee !== "U"
        : true;
      const matchesCreated = selectedSummaryFields.includes("created")
        ? issue.createdAt && new Date(issue.createdAt) >= sevenDaysAgo
        : true;
      const matchesDueDate = selectedSummaryFields.includes("dueDate")
        ? issue.dueDate &&
          new Date(issue.dueDate) >= now &&
          new Date(issue.dueDate) <= sevenDaysLater
        : true;
      const matchesParent = selectedSummaryFields.includes("parent")
        ? Boolean(issue.epic)
        : true;
      const matchesPriority = selectedSummaryFields.includes("priority")
        ? Boolean(issue.priority)
        : true;
      const matchesStatus = selectedSummaryFields.includes("status")
        ? Boolean(issue.status)
        : true;
      const matchesUpdated = selectedSummaryFields.includes("updated")
        ? issue.updatedAt && new Date(issue.updatedAt) >= sevenDaysAgo
        : true;
      const matchesWorkType = selectedSummaryFields.includes("workType")
        ? Boolean(issue.type)
        : true;

      return (
        matchesAssignee &&
        matchesCreated &&
        matchesDueDate &&
        matchesParent &&
        matchesPriority &&
        matchesStatus &&
        matchesUpdated &&
        matchesWorkType
      );
    });
  }, [issues, selectedSummaryFields]);

  const dashboardData = useMemo(() => {
    const keyMetrics: DashboardMetric = { completed: 0, updated: 0, created: 0, dueSoon: 0 };
    const priorities = ["Highest", "High", "Medium", "Low", "Lowest", "None"].map((level) => ({ level, count: 0 }));
    return {
      keyMetrics,
      statusDistribution: [] as { name: string; value: number; color: string }[],
      priorities,
      maxPriorityCount: 1,
      typeBreakdown: [] as { type: string; count: number; percent: number }[],
      teamWorkload: [] as { assignee: string; color: string; count: number; percent: number }[],
      epicProgress: [] as { epic: string; total: number; done: number; percent: number }[],
      totalWorkItems: 0,
      totalVisibleItems: summaryFilteredIssues.length,
    };
  }, [summaryFilteredIssues]);

  return (
    <div className="w-full space-y-5">
      <div className="flex items-center justify-between relative" ref={summaryFilterRef}>
        <button
          onClick={() => setIsSummaryFilterOpen((prev) => !prev)}
          className={`inline-flex items-center gap-2 border px-3 py-2 rounded-[6px] text-[0.8125rem] font-medium transition-colors ${
            isSummaryFilterOpen
              ? "border-[#2563EB] text-[#2563EB] dark:text-[#93C5FD] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)]"
              : "border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
          {selectedSummaryFields.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white text-[0.6875rem]">
              {selectedSummaryFields.length}
            </span>
          )}
        </button>

        {isSummaryFilterOpen && (
          <div
            className="absolute top-12 left-0 w-[min(calc(100vw-48px),460px)] bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] z-30 overflow-hidden"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <div className="p-4 border-b border-[#EAEAEA] dark:border-white/[0.06]">
              <input
                autoFocus
                value={summaryFilterSearch}
                onChange={(e) => setSummaryFilterSearch(e.target.value)}
                placeholder="Search more filters"
                className="w-full px-3 py-2 rounded-[6px] border border-[#2563EB] dark:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-[0.8125rem] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] placeholder-[#ABABAB] dark:placeholder-[#6B6B6B]"
              />
            </div>
            <div className="max-h-80 overflow-y-auto py-1">
              {visibleSummaryFilterFields.length === 0 ? (
                <p className="px-4 py-3 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">No filters found</p>
              ) : (
                visibleSummaryFilterFields.map((field) => {
                  const checked = selectedSummaryFields.includes(field.id);
                  return (
                    <label
                      key={field.id}
                      className={`flex items-center gap-3 px-4 py-2.5 text-[0.8125rem] cursor-pointer border-l-2 ${
                        checked
                          ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.08)] border-[#2563EB] text-[#111111] dark:text-[#E8E8E7]"
                          : "border-transparent hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] text-[#111111] dark:text-[#E8E8E7]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedSummaryFields((prev) =>
                            prev.includes(field.id)
                              ? prev.filter((id) => id !== field.id)
                              : [...prev, field.id]
                          )
                        }
                        className="w-4 h-4 rounded accent-[#2563EB] cursor-pointer"
                      />
                      <span>{field.label}</span>
                    </label>
                  );
                })
              )}
            </div>
            <div className="px-4 py-3 border-t border-[#EAEAEA] dark:border-white/[0.06] text-right text-[0.6875rem] text-[#787774] dark:text-[#9B9A97] font-medium">
              {visibleSummaryFilterFields.length} of {SUMMARY_FILTER_FIELDS.length}
            </div>
          </div>
        )}
      </div>

      {selectedSummaryFields.length > 0 && (
        <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
          Showing{" "}
          <span className="font-semibold">{dashboardData.totalVisibleItems}</span> work
          items after applying{" "}
          <span className="font-semibold">{selectedSummaryFields.length}</span> filter
          field(s).
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            label: "completed",
            value: dashboardData.keyMetrics.completed,
            subtitle: "in the last 7 days",
            icon: CheckCircle2,
            iconTone: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "updated",
            value: dashboardData.keyMetrics.updated,
            subtitle: "in the last 7 days",
            icon: PencilLine,
            iconTone: "text-[#787774] dark:text-[#9B9A97]",
          },
          {
            label: "created",
            value: dashboardData.keyMetrics.created,
            subtitle: "in the last 7 days",
            icon: FileText,
            iconTone: "text-[#787774] dark:text-[#9B9A97]",
          },
          {
            label: "due soon",
            value: dashboardData.keyMetrics.dueSoon,
            subtitle: "in the next 7 days",
            icon: CalendarClock,
            iconTone: "text-amber-600 dark:text-amber-400",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] px-5 py-4 flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-[6px] bg-[#F7F6F3] dark:bg-[#252525] flex items-center justify-center">
              <item.icon className={`w-5 h-5 ${item.iconTone}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111111] dark:text-[#E8E8E7] leading-none">{item.value}</p>
              <p className="text-[0.9375rem] text-[#111111] dark:text-[#E8E8E7] font-semibold leading-tight capitalize">
                {item.label}
              </p>
              <p className="text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B] mt-0.5">{item.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] p-5">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Status overview</h3>
            <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
              Get a snapshot of the status of your work items.{" "}
              <button className="text-[#2563EB] dark:text-[#3B82F6] hover:underline font-medium">
                View all work items
              </button>
            </p>
          </div>
        </div>
        {dashboardData.statusDistribution.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div className="flex justify-center">
              <div
                className="workspace-chart rounded-full relative"
                style={{
                  background: `conic-gradient(${dashboardData.statusDistribution
                    .map((status, index) => {
                      const previous = dashboardData.statusDistribution
                        .slice(0, index)
                        .reduce((sum, item) => sum + item.value, 0);
                      const start = Math.round(
                        (previous / dashboardData.totalWorkItems) * 360
                      );
                      const end = Math.round(
                        ((previous + status.value) / dashboardData.totalWorkItems) * 360
                      );
                      return `${status.color} ${start}deg ${end}deg`;
                    })
                    .join(", ")})`,
                }}
              >
                <div className="absolute inset-6 bg-white dark:bg-[#202020] rounded-full flex flex-col items-center justify-center text-center">
                  <p className="text-4xl font-bold text-[#111111] dark:text-[#E8E8E7] leading-none">
                    {dashboardData.totalVisibleItems}
                  </p>
                  <p className="text-[0.8125rem] font-semibold text-[#787774] dark:text-[#9B9A97] mt-2">
                    Total work items
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {dashboardData.statusDistribution.map((status) => (
                <div key={status.name} className="flex items-center gap-3 text-[0.8125rem]">
                  <span
                    className="w-4 h-4 rounded-[2px]"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-[#787774] dark:text-[#9B9A97]">
                    {status.name}: {status.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">No status data available.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] p-5">
          <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Priority breakdown</h3>
          <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] mb-4">
            Get a holistic view of how work is being prioritized.{" "}
            <button className="text-[#2563EB] dark:text-[#3B82F6] hover:underline font-medium">
              How to manage priorities for Workspaces
            </button>
          </p>
          <div className="h-60 border-l border-b border-[#EAEAEA] dark:border-white/[0.06] px-3 pb-2">
            <div className="h-full flex items-end justify-between gap-1.5">
              {dashboardData.priorities.map((priority) => (
                <div
                  key={priority.level}
                  className="flex-1 flex flex-col items-center justify-end gap-2"
                >
                  <div
                    className="w-full max-w-12 bg-[#2563EB] dark:bg-[#3B82F6] rounded-[4px]"
                    style={{
                      height: `${Math.max(
                        Math.round(
                          (priority.count / dashboardData.maxPriorityCount) * 100
                        ),
                        priority.count > 0 ? 12 : 0
                      )}%`,
                    }}
                  />
                  <span className="text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B] truncate max-w-full">
                    {priority.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] p-5">
          <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Types of work</h3>
          <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] mb-4">
            Get a breakdown of work items by their types.{" "}
            <button className="text-[#2563EB] dark:text-[#3B82F6] hover:underline font-medium">
              View all items
            </button>
          </p>
          <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
            {dashboardData.typeBreakdown.map((item) => (
              <div key={item.type} className="grid grid-cols-[1fr_2fr] items-center gap-4">
                <span className="text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7]">{item.type}</span>
                <div className="h-7 rounded-[4px] bg-[#F7F6F3] dark:bg-[#252525] overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB] dark:bg-[#3B82F6] text-white text-[0.6875rem] font-semibold px-3 flex items-center"
                    style={{ width: `${item.percent}%` }}
                  >
                    {item.percent > 10 ? `${item.percent}%` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] p-5">
          <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Team workload</h3>
          <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] mb-4">
            Monitor the capacity of your team.{" "}
            <button className="text-[#2563EB] dark:text-[#3B82F6] hover:underline font-medium">
              Reassign work items to get the right balance
            </button>
          </p>
          <div className="space-y-3">
            {dashboardData.teamWorkload.map((item) => (
              <div
                key={item.assignee}
                className="grid grid-cols-[1fr_2fr] items-center gap-4"
              >
                <div className="flex items-center gap-2 text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7]">
                  <span
                    className={`w-7 h-7 rounded-full ${item.color} text-white text-[0.625rem] font-bold flex items-center justify-center`}
                  >
                    {item.assignee === "Unassigned" ? "U" : item.assignee}
                  </span>
                  {item.assignee}
                </div>
                <div className="h-7 rounded-[4px] bg-[#F7F6F3] dark:bg-[#252525] overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB] dark:bg-[#3B82F6] text-white text-[0.6875rem] font-semibold px-3 flex items-center"
                    style={{ width: `${item.percent}%` }}
                  >
                    {item.percent > 10 ? `${item.percent}%` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] p-5">
          <h3 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Epic progress</h3>
          <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] mb-4">
            See how your epics are progressing at a glance.{" "}
            <button className="text-[#2563EB] dark:text-[#3B82F6] hover:underline font-medium">
              View all epics
            </button>
          </p>
          <div className="flex items-center gap-5 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] mb-4">
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 bg-green-600 rounded-[2px]" />
              Done
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-[2px]" />
              In progress
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 bg-[#ABABAB] dark:bg-[#6B6B6B] rounded-[2px]" />
              To do
            </span>
          </div>
          {dashboardData.epicProgress.length === 0 ? (
            <div className="rounded-[6px] border border-dashed border-[#EAEAEA] dark:border-white/[0.08] p-5 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
              No epics yet.
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData.epicProgress.map((epic) => (
                <div key={epic.epic}>
                  <p className="text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7] mb-2">{epic.epic}</p>
                  <div className="h-7 rounded-[4px] bg-[#F7F6F3] dark:bg-[#252525] overflow-hidden">
                    <div
                      className="h-full bg-[#2563EB] dark:bg-[#3B82F6] text-white text-[0.6875rem] font-semibold px-3 flex items-center"
                      style={{ width: `${epic.percent}%` }}
                    >
                      {epic.percent}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <WorkspaceMembersPanel workspaceId={workspaceId} workspaceMongoId={workspaceMongoId} />
    </div>
  );
}
