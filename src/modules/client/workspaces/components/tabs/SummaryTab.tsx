"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  SlidersHorizontal,
  CheckCircle2,
  PencilLine,
  CalendarClock,
  FileText,
} from "lucide-react";
import { Issue } from "../../types/issue.type";
import WorkspaceMembersPanel from "../WorkspaceMembersPanel";

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
};

export default function SummaryTab({ issues, workspaceId }: SummaryTabProps) {
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
        ? issue.endDate &&
          new Date(issue.endDate) >= now &&
          new Date(issue.endDate) <= sevenDaysLater
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
          className={`inline-flex items-center gap-2 border px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isSummaryFilterOpen
              ? "border-blue-600 text-blue-700 bg-blue-50"
              : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
          {selectedSummaryFields.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[11px]">
              {selectedSummaryFields.length}
            </span>
          )}
        </button>

        {isSummaryFilterOpen && (
          <div className="absolute top-12 left-0 w-[min(calc(100vw-48px),460px)] bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl z-30 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <input
                autoFocus
                value={summaryFilterSearch}
                onChange={(e) => setSummaryFilterSearch(e.target.value)}
                placeholder="Search more filters"
                className="w-full px-3 py-2 rounded-md border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <div className="max-h-80 overflow-y-auto py-1">
              {visibleSummaryFilterFields.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No filters found</p>
              ) : (
                visibleSummaryFilterFields.map((field) => {
                  const checked = selectedSummaryFields.includes(field.id);
                  return (
                    <label
                      key={field.id}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer border-l-2 ${
                        checked
                          ? "bg-gray-100 dark:bg-gray-800 border-blue-600 text-gray-900 dark:text-white"
                          : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-300"
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
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{field.label}</span>
                    </label>
                  );
                })
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 text-right text-sm text-gray-500 dark:text-gray-400 font-medium">
              {visibleSummaryFilterFields.length} of {SUMMARY_FILTER_FIELDS.length}
            </div>
          </div>
        )}
      </div>

      {selectedSummaryFields.length > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
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
            iconTone: "text-emerald-600",
          },
          {
            label: "updated",
            value: dashboardData.keyMetrics.updated,
            subtitle: "in the last 7 days",
            icon: PencilLine,
            iconTone: "text-gray-600",
          },
          {
            label: "created",
            value: dashboardData.keyMetrics.created,
            subtitle: "in the last 7 days",
            icon: FileText,
            iconTone: "text-gray-600",
          },
          {
            label: "due soon",
            value: dashboardData.keyMetrics.dueSoon,
            subtitle: "in the next 7 days",
            icon: CalendarClock,
            iconTone: "text-amber-600",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <item.icon className={`w-5 h-5 ${item.iconTone}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{item.value}</p>
              <p className="text-base text-gray-900 dark:text-white font-semibold leading-tight capitalize">
                {item.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Status overview</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get a snapshot of the status of your work items.{" "}
              <button className="text-blue-700 hover:underline font-medium">
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
                <div className="absolute inset-6 bg-white dark:bg-gray-900 rounded-full flex flex-col items-center justify-center text-center">
                  <p className="text-4xl font-bold text-gray-900 dark:text-white leading-none">
                    {dashboardData.totalVisibleItems}
                  </p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2">
                    Total work items
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {dashboardData.statusDistribution.map((status) => (
                <div key={status.name} className="flex items-center gap-3 text-sm">
                  <span
                    className="w-4 h-4 rounded-sm"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    {status.name}: {status.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No status data available.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Priority breakdown</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Get a holistic view of how work is being prioritized.{" "}
            <button className="text-blue-700 hover:underline font-medium">
              How to manage priorities for Workspaces
            </button>
          </p>
          <div className="h-60 border-l border-b border-gray-300 dark:border-gray-700 px-3 pb-2">
            <div className="h-full flex items-end justify-between gap-1.5">
              {dashboardData.priorities.map((priority) => (
                <div
                  key={priority.level}
                  className="flex-1 flex flex-col items-center justify-end gap-2"
                >
                  <div
                    className="w-full max-w-12 bg-gray-400 rounded-sm"
                    style={{
                      height: `${Math.max(
                        Math.round(
                          (priority.count / dashboardData.maxPriorityCount) * 100
                        ),
                        priority.count > 0 ? 12 : 0
                      )}%`,
                    }}
                  />
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-full">
                    {priority.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Types of work</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Get a breakdown of work items by their types.{" "}
            <button className="text-blue-700 hover:underline font-medium">
              View all items
            </button>
          </p>
          <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
            {dashboardData.typeBreakdown.map((item) => (
              <div key={item.type} className="grid grid-cols-[1fr_2fr] items-center gap-4">
                <span className="text-sm text-gray-700 dark:text-gray-300">{item.type}</span>
                <div className="h-7 rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full bg-gray-500 text-white text-sm font-semibold px-3 flex items-center"
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
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Team workload</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Monitor the capacity of your team.{" "}
            <button className="text-blue-700 hover:underline font-medium">
              Reassign work items to get the right balance
            </button>
          </p>
          <div className="space-y-3">
            {dashboardData.teamWorkload.map((item) => (
              <div
                key={item.assignee}
                className="grid grid-cols-[1fr_2fr] items-center gap-4"
              >
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span
                    className={`w-7 h-7 rounded-full ${item.color} text-white text-[10px] font-bold flex items-center justify-center`}
                  >
                    {item.assignee === "Unassigned" ? "U" : item.assignee}
                  </span>
                  {item.assignee}
                </div>
                <div className="h-7 rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full bg-gray-500 text-white text-sm font-semibold px-3 flex items-center"
                    style={{ width: `${item.percent}%` }}
                  >
                    {item.percent > 10 ? `${item.percent}%` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Epic progress</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            See how your epics are progressing at a glance.{" "}
            <button className="text-blue-700 hover:underline font-medium">
              View all epics
            </button>
          </p>
          <div className="flex items-center gap-5 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 bg-green-600 rounded-sm" />
              Done
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-sm" />
              In progress
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 bg-gray-500 rounded-sm" />
              To do
            </span>
          </div>
          {dashboardData.epicProgress.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-300 dark:border-gray-700 p-5 text-sm text-gray-500 dark:text-gray-400">
              No epics yet.
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData.epicProgress.map((epic) => (
                <div key={epic.epic}>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{epic.epic}</p>
                  <div className="h-7 rounded bg-gray-200 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full bg-gray-500 text-white text-sm font-semibold px-3 flex items-center"
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

      <WorkspaceMembersPanel workspaceId={workspaceId} />
    </div>
  );
}
