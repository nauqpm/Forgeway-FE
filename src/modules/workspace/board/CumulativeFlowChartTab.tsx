"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AlertCircle, RefreshCw, TrendingUp } from "lucide-react";
import api from "@/lib/axiosIns";

interface CumulativeFlowChartTabProps {
  workspaceId: string;
}

export default function CumulativeFlowChartTab({ workspaceId }: CumulativeFlowChartTabProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [days, setDays] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

  const fetchCumulativeFlow = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setIsLoading(true);
      setError(null);
      setActiveStatus(null);
      const response = await api.get(`/workspaces/${workspaceId}/reports/cumulative-flow`, {
        params: { days },
      });
      if (response.data) {
        setData(response.data.data || []);
        setStatuses(response.data.statuses || []);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch cumulative flow report:", err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Failed to load cumulative flow report.");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, days]);

  useEffect(() => {
    fetchCumulativeFlow();
  }, [fetchCumulativeFlow]);

  // Color mapping helper matching Jira style
  const getStatusColor = (statusName: string, index: number) => {
    const name = statusName.toLowerCase();
    if (name.includes("done") || name.includes("complete") || name.includes("resolved") || name.includes("đã xong")) {
      return "#10B981"; // emerald-500
    }
    if (name.includes("progress") || name.includes("dev") || name.includes("doing") || name.includes("đang làm")) {
      return "#3B82F6"; // blue-500
    }
    if (name.includes("review") || name.includes("test") || name.includes("verify") || name.includes("kiểm thử")) {
      return "#F59E0B"; // amber-500
    }
    if (name.includes("todo") || name.includes("backlog") || name.includes("chuẩn bị")) {
      return "#9CA3AF"; // gray-400
    }
    // Color list for other statuses
    const colors = ["#818CF8", "#EC4899", "#8B5CF6", "#06B6D4", "#F43F5E", "#10B981", "#3B82F6"];
    return colors[index % colors.length];
  };

  // Custom hover Tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Calculate total tasks on this day
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalTasks = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);

      return (
        <div className="bg-white dark:bg-[#1E1E1E] p-3.5 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[8px] shadow-lg text-[0.8125rem] space-y-2 min-w-[200px]">
          <div className="flex justify-between border-b border-[#EAEAEA] dark:border-white/10 pb-1.5 font-bold">
            <span className="text-[#111111] dark:text-[#E8E8E7]">{label}</span>
            <span className="text-[#5E6C84] dark:text-[#9B9A97]">Total: {totalTasks}</span>
          </div>
          <div className="space-y-1">
            {/* Show in reverse order (Done at top, Todo at bottom) */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {[...payload].reverse().map((entry: any, index: number) => (
              <div key={index} className="flex justify-between gap-6">
                <span className="text-[#5E6C84] dark:text-[#9B9A97] inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLegendClick = (e: any) => {
    if (e && e.dataKey) {
      setActiveStatus((prev) => (prev === e.dataKey ? null : e.dataKey));
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EAEAEA] dark:border-white/[0.06] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#111111] dark:text-[#E8E8E7]">Cumulative Flow Diagram</h2>
          <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] mt-1">
            Monitor the distribution of tasks in each status over time to detect process bottlenecks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Days Selector Dropdown */}
          <div className="flex items-center gap-1.5 text-[0.8125rem]">
            <span className="text-[#5E6C84] dark:text-[#9B9A97]">Timeframe:</span>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] text-[#111111] dark:text-[#E8E8E7] px-3 py-1.5 rounded-[6px] text-[0.8125rem] font-semibold focus:outline-none focus:border-[#2563EB]"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
            </select>
          </div>

          <button
            onClick={fetchCumulativeFlow}
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
            <p className="font-semibold text-[#111111] dark:text-[#E8E8E7]">No workflow data found</p>
            <p className="text-[0.75rem]">Once tasks and status updates are recorded in this workspace, the flow diagram will render.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Chart Card */}
          <div className="p-5 border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] bg-white dark:bg-[#1A1A1A] shadow-sm">
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" className="dark:stroke-white/[0.05]" />
                  <XAxis
                    dataKey="date"
                    stroke="#787774"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#787774"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "0.8125rem", cursor: "pointer" }}
                    onClick={handleLegendClick}
                  />
                  {/* Render statuses as stacked areas (reverse sequence so Todo is at the bottom, Done on top) */}
                  {statuses.map((status, index) => {
                    const color = getStatusColor(status, index);
                    const isVisible = activeStatus === null || activeStatus === status;
                    return (
                      <Area
                        key={status}
                        type="monotone"
                        dataKey={status}
                        stackId="1"
                        stroke={color}
                        fill={color}
                        fillOpacity={0.4}
                        hide={!isVisible}
                      />
                    );
                  })}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick explanations card */}
          <div className="p-4 border border-[#EAEAEA] dark:border-white/[0.06] rounded-[8px] bg-white dark:bg-[#1A1A1A] shadow-sm text-[0.8125rem] space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#111111] dark:text-[#E8E8E7]">
              <AlertCircle className="w-4 h-4 text-[#3B82F6]" />
              How to read this diagram:
            </div>
            <ul className="list-disc pl-5 space-y-1 text-[#5E6C84] dark:text-[#9B9A97] leading-relaxed text-[0.75rem]">
              <li><strong>Horizontal bands:</strong> Each band represents a status column on your board. If a band gets wider over time, tasks are piling up in that status (congested).</li>
              <li><strong>Steep curves:</strong> Indicates high task completion or movement rate.</li>
              <li><strong>Flat curves:</strong> Indicates progress is stalling (possible blockers).</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
