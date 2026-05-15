import React from "react";

import { Space } from "../../types/space.type";

interface TabProps {
  space: Space;
  activeTab: string;
  setActiveTab: any;
}

const Tabs = ({ space, activeTab, setActiveTab }: TabProps) => {
  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
      {space.template === "kanban" && (
        <button
          onClick={() => setActiveTab("board")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "board" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Kanban Board
        </button>
      )}
      {space.template === "scrum" && (
        <>
          <button
            onClick={() => setActiveTab("backlog")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "backlog" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Backlog
          </button>
          <button
            onClick={() => setActiveTab("board")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "board" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Active Sprint
          </button>
        </>
      )}
      <button
        onClick={() => setActiveTab("timeline")}
        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "timeline" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
      >
        Timeline
      </button>
      <button
        onClick={() => setActiveTab("list")}
        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
      >
        List
      </button>
      <button
        onClick={() => setActiveTab("docs")}
        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "docs" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
      >
        Docs
      </button>
    </div>
  );
};

export default Tabs;
