import { useState, useRef, useEffect } from "react";
import WorklogReportTab from "./WorklogReportTab";
import SprintVelocityChartTab from "./SprintVelocityChartTab";
import CumulativeFlowChartTab from "./CumulativeFlowChartTab";
import { BarChart3, Clock, ChevronDown, TrendingUp } from "lucide-react";

interface ReportsTabProps {
  workspaceId: string;
  workspaceKey: string;
  onSelectTask?: (task: { id: string; key: string; title: string; type: string }) => void;
  currentUserId?: string;
  workspaceType: string;
}

export default function ReportsTab(props: ReportsTabProps) {
  const { workspaceType } = props;
  const [activeSubTab, setActiveSubTab] = useState<"worklogs" | "velocity" | "cfd">("worklogs");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isScrum = workspaceType === "scrum";

  useEffect(() => {
    // If not scrum and activeSubTab is velocity (e.g. workspace changed), fallback to worklogs
    if (!isScrum && activeSubTab === "velocity") {
      setActiveSubTab("worklogs");
    }
  }, [isScrum, activeSubTab]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  let currentOption = { name: "Worklogs", icon: <Clock className="w-4 h-4" /> };
  if (activeSubTab === "velocity") {
    currentOption = { name: "Sprint Velocity", icon: <BarChart3 className="w-4 h-4" /> };
  } else if (activeSubTab === "cfd") {
    currentOption = { name: "Cumulative Flow", icon: <TrendingUp className="w-4 h-4" /> };
  }

  return (
    <div className="w-full space-y-6">
      {/* Dropdown Selection */}
      <div className="flex justify-start">
        <div ref={dropdownRef} className="relative z-30">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-2 border border-[#EAEAEA] dark:border-white/[0.06] bg-[#F4F4F3] dark:bg-[#202020] text-[#111111] dark:text-[#E8E8E7] px-3.5 py-1.5 rounded-[6px] text-[0.8125rem] font-semibold hover:bg-[#EAEAEA] dark:hover:bg-[#2E2E2E] transition-colors shadow-sm cursor-pointer"
          >
            {currentOption.icon}
            <span>{currentOption.name}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#787774] dark:text-[#9B9A97] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <div className="absolute left-0 mt-1.5 w-[190px] bg-white dark:bg-[#1E1E1E] border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] shadow-lg py-1 text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] animate-in fade-in duration-100">
              <button
                onClick={() => {
                  setActiveSubTab("worklogs");
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] transition-colors ${
                  activeSubTab === "worklogs" ? "font-bold text-[#2563EB] dark:text-[#3B82F6]" : ""
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                Worklogs
              </button>

              {isScrum && (
                <button
                  onClick={() => {
                    setActiveSubTab("velocity");
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] transition-colors ${
                    activeSubTab === "velocity" ? "font-bold text-[#2563EB] dark:text-[#3B82F6]" : ""
                  }`}
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  Sprint Velocity
                </button>
              )}

              <button
                onClick={() => {
                  setActiveSubTab("cfd");
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] transition-colors ${
                  activeSubTab === "cfd" ? "font-bold text-[#2563EB] dark:text-[#3B82F6]" : ""
                }`}
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                Cumulative Flow
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        {activeSubTab === "worklogs" && <WorklogReportTab {...props} />}
        {activeSubTab === "velocity" && <SprintVelocityChartTab {...props} />}
        {activeSubTab === "cfd" && <CumulativeFlowChartTab workspaceId={props.workspaceId} />}
      </div>
    </div>
  );
}
