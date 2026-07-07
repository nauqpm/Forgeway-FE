"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { AlertTriangle, RefreshCw, TrendingUp } from "lucide-react";
import api from "@/lib/axiosIns";

interface SprintVelocityReportItem {
  sprintId: string;
  sprintName: string;
  committedStoryPoints: number;
  completedStoryPoints: number;
  committedTasksCount: number;
  completedTasksCount: number;
  hasLowStoryPointsCoverage: boolean;
  completedAt: string;
}

interface SprintVelocityChartTabProps {
  workspaceId: string;
}

export default function SprintVelocityChartTab({ workspaceId }: SprintVelocityChartTabProps) {
  const [data, setData] = useState<SprintVelocityReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<"storyPoints" | "tasks">("storyPoints");

  const fetchVelocityReport = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/workspaces/${workspaceId}/reports/sprint-velocity`);
      if (response.data) {
        setData(response.data);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch sprint velocity report:", err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Failed to load velocity report data.");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchVelocityReport();
  }, [fetchVelocityReport]);

  const showStoryPoints = metric === "storyPoints";

  // Calculate Average Velocity
  const averageVelocity = useMemo(() => {
    if (data.length === 0) return 0;
    const total = data.reduce(
      (sum, item) =>
        sum + (showStoryPoints ? item.completedStoryPoints : item.completedTasksCount),
      0
    );
    return total / data.length;
  }, [data, showStoryPoints]);

  // Check if any sprint has low story points coverage
  const hasLowSpCoverageSprints = useMemo(() => {
    return data.some((item) => item.hasLowStoryPointsCoverage);
  }, [data]);

  // Custom tooltips for Recharts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const sprintData = payload[0].payload as SprintVelocityReportItem;
      const unit = showStoryPoints ? "SP" : "tasks";
      return (
        <div className="bg-white dark:bg-[#1E1E1E] p-3.5 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[8px] shadow-lg text-[0.8125rem] space-y-2">
          <p className="font-bold text-[#111111] dark:text-[#E8E8E7]">{label}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-6">
              <span className="text-[#5E6C84] dark:text-[#9B9A97] inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#818CF8]" />
                Commitment:
              </span>
              <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">
                {showStoryPoints ? sprintData.committedStoryPoints : sprintData.committedTasksCount} {unit}
              </span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-[#5E6C84] dark:text-[#9B9A97] inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]" />
                Completion:
              </span>
              <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">
                {showStoryPoints ? sprintData.completedStoryPoints : sprintData.completedTasksCount} {unit}
              </span>
            </div>
          </div>
          {showStoryPoints && sprintData.hasLowStoryPointsCoverage && (
            <p className="text-[0.75rem] text-[#DE350B] dark:text-[#FF8F73] flex items-center gap-1 mt-1 bg-[#FFEBE6] dark:bg-[#421F1C] p-1.5 rounded-[4px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              Low SP coverage
            </p>
          )}
        </div>
      );
    };
    return null;
  };

  return (
    <div className="w-full space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EAEAEA] dark:border-white/[0.06] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#111111] dark:text-[#E8E8E7]">Sprint Velocity</h2>
          <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] mt-1">
            Analyze the story points or tasks committed and completed across past sprints.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Metric Selector Toggle */}
          <div className="flex bg-[#F4F4F3] dark:bg-[#202020] p-1 rounded-[8px] border border-[#EAEAEA]/60 dark:border-white/5">
            <button
              onClick={() => setMetric("storyPoints")}
              className={`px-3.5 py-1.5 rounded-[6px] text-[0.8125rem] font-semibold transition-all ${
                metric === "storyPoints"
                  ? "bg-white dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7] shadow-sm"
                  : "text-[#5E6C84] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7]"
              }`}
            >
              Story Points
            </button>
            <button
              onClick={() => setMetric("tasks")}
              className={`px-3.5 py-1.5 rounded-[6px] text-[0.8125rem] font-semibold transition-all ${
                metric === "tasks"
                  ? "bg-white dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7] shadow-sm"
                  : "text-[#5E6C84] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7]"
              }`}
            >
              Task Count
            </button>
          </div>

          <button
            onClick={fetchVelocityReport}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] text-[#111111] dark:text-[#E8E8E7] px-3.5 py-2 rounded-[6px] text-[0.8125rem] font-semibold hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Reload
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 text-[0.8125rem] text-[#DE350B] bg-[#FFEBE6] dark:bg-[#421F1C] dark:text-[#FF8F73] rounded-[6px]">
          {error}
        </div>
      )}

      {/* Main content area */}
      {isLoading ? (
        <div className="flex items-center justify-center py-32 gap-2 text-[#787774] dark:text-[#9B9A97] text-[0.8125rem]">
          <RefreshCw className="w-5 h-5 animate-spin text-[#2563EB]" />
          Loading report data...
        </div>
      ) : data.length === 0 ? (
        <div className="py-24 text-center text-[#787774] dark:text-[#9B9A97] text-[0.8125rem] border border-dashed border-[#EAEAEA] dark:border-white/5 rounded-[8px]">
          <div className="flex flex-col items-center justify-center gap-2">
            <TrendingUp className="w-8 h-8 text-[#EAEAEA] dark:text-white/10" />
            <p className="font-semibold text-[#111111] dark:text-[#E8E8E7]">No completed sprints</p>
            <p className="text-[0.75rem]">Once you start and complete sprints in this workspace, velocity charts will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Velocity Summary Widget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] bg-white dark:bg-[#1A1A1A] shadow-sm">
              <span className="text-[0.75rem] font-semibold text-[#5E6C84] dark:text-[#9B9A97] block">
                AVERAGE VELOCITY
              </span>
              <span className="text-2xl font-bold text-[#111111] dark:text-[#E8E8E7] mt-1 block">
                {averageVelocity.toFixed(1)} {showStoryPoints ? "SP" : "tasks"}
              </span>
            </div>
            <div className="p-4 border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] bg-white dark:bg-[#1A1A1A] shadow-sm">
              <span className="text-[0.75rem] font-semibold text-[#5E6C84] dark:text-[#9B9A97] block">
                COMPLETED SPRINTS
              </span>
              <span className="text-2xl font-bold text-[#111111] dark:text-[#E8E8E7] mt-1 block">
                {data.length} sprints
              </span>
            </div>
          </div>

          {/* Chart Wrapper */}
          <div className="p-5 border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] bg-white dark:bg-[#1A1A1A] shadow-sm">
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" className="dark:stroke-white/[0.05]" />
                  <XAxis
                    dataKey="sprintName"
                    stroke="#787774"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#787774"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "0.8125rem" }}
                  />
                  <ReferenceLine
                    y={averageVelocity}
                    stroke="#EF4444"
                    strokeDasharray="4 4"
                    label={{
                      value: `Avg: ${averageVelocity.toFixed(1)}`,
                      position: "top",
                      fill: "#EF4444",
                      fontSize: 11,
                      fontWeight: "bold",
                    }}
                  />
                  <Bar
                    name="Commitment"
                    dataKey={showStoryPoints ? "committedStoryPoints" : "committedTasksCount"}
                    fill="#818CF8"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  />
                  <Bar
                    name="Completion"
                    dataKey={showStoryPoints ? "completedStoryPoints" : "completedTasksCount"}
                    fill="#34D399"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Warning banner on low Story Points coverage */}
          {showStoryPoints && hasLowSpCoverageSprints && (
            <div className="p-4 border border-[#DE350B]/20 bg-[#FFEBE6] dark:bg-[#421F1C]/30 text-[#DE350B] dark:text-[#FF8F73] rounded-[8px] text-[0.8125rem] flex gap-3 items-start shadow-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Story Points Coverage Warning</p>
                <p className="mt-1 opacity-90 text-[0.75rem] leading-relaxed">
                  Some completed sprints have more than 50% of tasks without Story Points values set. The total Story Points measurements for these sprints may be inaccurate. We suggest switching to <strong>&quot;Task Count&quot;</strong> to analyze sprint completion velocity more accurately.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
