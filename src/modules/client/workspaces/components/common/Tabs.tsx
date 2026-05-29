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
  `whitespace-nowrap px-4 py-2 text-sm font-medium transition-all rounded-t-md border-b-2 ${
    active
      ? "border-[#0052CC] text-[#0052CC] dark:text-blue-400 dark:border-blue-400"
      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
  }`;

const Tabs = ({ workspace, activeTab, setActiveTab }: TabProps) => {
  const template = getWorkspaceTemplate(workspace);

  return (
    <div className="mb-4 w-full overflow-x-auto border-b border-gray-200 dark:border-gray-700">
      <div className="flex w-max min-w-full items-end gap-0.5 sm:min-w-0 sm:w-fit">
        <button onClick={() => setActiveTab("summary")} className={TAB_CLS(activeTab === "summary")}>Summary</button>
        <button onClick={() => setActiveTab("board")} className={TAB_CLS(activeTab === "board")}>Board</button>
        {template === "scrum" && (
          <button onClick={() => setActiveTab("backlog")} className={TAB_CLS(activeTab === "backlog")}>Backlog</button>
        )}
        <button onClick={() => setActiveTab("timeline")} className={TAB_CLS(activeTab === "timeline")}>Timeline</button>
        <button onClick={() => setActiveTab("calendar")} className={TAB_CLS(activeTab === "calendar")}>Calendar</button>
        <button onClick={() => setActiveTab("list")} className={TAB_CLS(activeTab === "list")}>List</button>
        <button onClick={() => setActiveTab("archive")} className={TAB_CLS(activeTab === "archive")}>Archive</button>
        <button onClick={() => setActiveTab("pages")} className={TAB_CLS(activeTab === "pages")}>Docs</button>
      </div>
    </div>
  );
};

export default Tabs;
