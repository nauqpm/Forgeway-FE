import React from "react";
import {
  getWorkspaceTemplate,
  Workspace,
  WorkspaceTab,
} from "../../types/workspace.type";

interface TabProps {
  workspace: Workspace;
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
}

const TAB_CLS = (active: boolean) =>
  `whitespace-nowrap px-3 py-2 text-[13px] font-medium transition-all sm:px-5 rounded-[6px] ${
    active
      ? "bg-white dark:bg-[#202020] text-[#111111] dark:text-[#E8E8E7]"
      : "text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
  }`;

const Tabs = ({ workspace, activeTab, setActiveTab }: TabProps) => {
  const template = getWorkspaceTemplate(workspace);

  return (
    <div className="mb-2 w-full overflow-x-auto pb-1">
      <div className="flex w-max min-w-full items-center gap-1 rounded-[8px] bg-[#F7F6F3] dark:bg-[#252525] p-1 sm:min-w-0 sm:w-fit">
        <button onClick={() => setActiveTab("board")} className={TAB_CLS(activeTab === "board")}>
          Board
        </button>
        {template === "scrum" && (
          <button onClick={() => setActiveTab("backlog")} className={TAB_CLS(activeTab === "backlog")}>
            Backlog
          </button>
        )}
        <button onClick={() => setActiveTab("timeline")} className={TAB_CLS(activeTab === "timeline")}>
          Timeline
        </button>
        <button onClick={() => setActiveTab("calendar")} className={TAB_CLS(activeTab === "calendar")}>
          Calendar
        </button>
        <button onClick={() => setActiveTab("list")} className={TAB_CLS(activeTab === "list")}>
          List
        </button>
        <button onClick={() => setActiveTab("archive")} className={TAB_CLS(activeTab === "archive")}>
          Archive
        </button>
        <button onClick={() => setActiveTab("pages")} className={TAB_CLS(activeTab === "pages")}>
          Docs
        </button>
      </div>
    </div>
  );
};

export default Tabs;
