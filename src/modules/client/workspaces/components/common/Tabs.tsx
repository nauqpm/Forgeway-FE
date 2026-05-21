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

const Tabs = ({ workspace, activeTab, setActiveTab }: TabProps) => {
  const template = getWorkspaceTemplate(workspace);

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl w-fit mb-6">
      <button
        onClick={() => setActiveTab("summary")}
        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "summary" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
      >
        Summary
      </button>
      <button
        onClick={() => setActiveTab("board")}
        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "board" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
      >
        Board
      </button>
      {template === "scrum" && (
        <>
          <button
            onClick={() => setActiveTab("backlog")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "backlog" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            Backlog
          </button>
        </>
      )}
      <button
        onClick={() => setActiveTab("timeline")}
        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "timeline" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
      >
        Timeline
      </button>
      <button
        onClick={() => setActiveTab("calendar")}
        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "calendar" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
      >
        Calendar
      </button>
      <button
        onClick={() => setActiveTab("list")}
        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "list" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
      >
        List
      </button>
      <button
        onClick={() => setActiveTab("pages")}
        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "pages" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
      >
        Docs
      </button>
    </div>
  );
};

export default Tabs;
