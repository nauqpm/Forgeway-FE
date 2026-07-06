import React from "react";
import { OverflowTabs } from "@/shared/components/OverflowTabs";
import { getWorkspaceTemplate, Workspace, WorkspaceTab } from "@/modules/workspace/shared/types/workspace.type";

interface TabProps {
  workspace: Workspace;
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
}

const Tabs = ({ workspace, activeTab, setActiveTab }: TabProps) => {
  const template = getWorkspaceTemplate(workspace);

  return (
    <OverflowTabs activeId={activeTab}>
      <OverflowTabs.Item id="board" onSelect={() => setActiveTab("board")}>
        Board
      </OverflowTabs.Item>
      {template === "scrum" && (
        <OverflowTabs.Item id="backlog" onSelect={() => setActiveTab("backlog")}>
          Backlog
        </OverflowTabs.Item>
      )}
      <OverflowTabs.Item id="timeline" onSelect={() => setActiveTab("timeline")}>
        Timeline
      </OverflowTabs.Item>
      <OverflowTabs.Item id="calendar" onSelect={() => setActiveTab("calendar")}>
        Calendar
      </OverflowTabs.Item>
      <OverflowTabs.Item id="list" onSelect={() => setActiveTab("list")}>
        List
      </OverflowTabs.Item>
      <OverflowTabs.Item id="archive" onSelect={() => setActiveTab("archive")}>
        Archive
      </OverflowTabs.Item>
      <OverflowTabs.Item id="pages" onSelect={() => setActiveTab("pages")}>
        Docs
      </OverflowTabs.Item>
      <OverflowTabs.Item id="members" onSelect={() => setActiveTab("members")}>
        Members
      </OverflowTabs.Item>
      <OverflowTabs.Item id="reports" onSelect={() => setActiveTab("reports")}>
        Reports
      </OverflowTabs.Item>
    </OverflowTabs>
  );
};

export default Tabs;
