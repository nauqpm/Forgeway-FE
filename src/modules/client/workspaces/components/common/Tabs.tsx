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
    <div className="mb-2 w-full overflow-x-auto pb-1">
      <div className="flex w-max min-w-full items-center gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-900/50 sm:min-w-0 sm:w-fit">
        <button
          onClick={() => setActiveTab("summary")}
          className={`whitespace-nowrap px-3 py-2 text-sm font-medium transition-all sm:px-5 rounded-lg ${activeTab === "summary" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveTab("board")}
          className={`whitespace-nowrap px-3 py-2 text-sm font-medium transition-all sm:px-5 rounded-lg ${activeTab === "board" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          Board
        </button>
        {template === "scrum" && (
          <button
            onClick={() => setActiveTab("backlog")}
            className={`whitespace-nowrap px-3 py-2 text-sm font-medium transition-all sm:px-5 rounded-lg ${activeTab === "backlog" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            Backlog
          </button>
        )}
        <button
          onClick={() => setActiveTab("timeline")}
          className={`whitespace-nowrap px-3 py-2 text-sm font-medium transition-all sm:px-5 rounded-lg ${activeTab === "timeline" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          Timeline
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={`whitespace-nowrap px-3 py-2 text-sm font-medium transition-all sm:px-5 rounded-lg ${activeTab === "calendar" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          Calendar
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={`whitespace-nowrap px-3 py-2 text-sm font-medium transition-all sm:px-5 rounded-lg ${activeTab === "list" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          List
        </button>
        <button
          onClick={() => setActiveTab("archive")}
          className={`whitespace-nowrap px-3 py-2 text-sm font-medium transition-all sm:px-5 rounded-lg ${activeTab === "archive" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          Archive
        </button>
        <button
          onClick={() => setActiveTab("pages")}
          className={`whitespace-nowrap px-3 py-2 text-sm font-medium transition-all sm:px-5 rounded-lg ${activeTab === "pages" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          Docs
        </button>
      </div>
    </div>
  );
};

export default Tabs;
