import React from "react";
import { OverflowTabs } from "@/shared/components/OverflowTabs";
import { getWorkspaceTemplate, Workspace, WorkspaceTab } from "@/modules/workspace/shared/types/workspace.type";
import { WORKSPACE_PERMISSIONS, type WorkspacePermission } from "@/modules/workspace/shared/constants/workspacePermissions";

interface TabProps {
  workspace: Workspace;
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  permissions: WorkspacePermission[];
}

const Tabs = ({ workspace, activeTab, setActiveTab, permissions }: TabProps) => {
  const template = getWorkspaceTemplate(workspace);
  const canReadStories = permissions.includes(WORKSPACE_PERMISSIONS.STORY_READ);
  const storiesNavEnabled = process.env.NEXT_PUBLIC_STORY_GOVERNANCE_NAV_ENABLED !== "false";

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
      {canReadStories && storiesNavEnabled && (
        <OverflowTabs.Item id="stories" onSelect={() => setActiveTab("stories")}>
          Stories
        </OverflowTabs.Item>
      )}
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
