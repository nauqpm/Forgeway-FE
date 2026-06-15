"use client";

import dynamic from "next/dynamic";
import LoadingSpinner from "@/modules/shared/components/common/components/LoadingSpinner";

const tabLoading = () => <LoadingSpinner />;

const BoardTab = dynamic(() => import("./tabs/BoardTab"), {
  ssr: false,
  loading: tabLoading,
});
const BacklogTab = dynamic(() => import("./tabs/BacklogTab"), {
  ssr: false,
  loading: tabLoading,
});
const TimelineTab = dynamic(() => import("./tabs/TimelineTab"), {
  ssr: false,
  loading: tabLoading,
});
const CalendarTab = dynamic(() => import("./tabs/CalendarTab"), {
  ssr: false,
  loading: tabLoading,
});
const ListTab = dynamic(() => import("./tabs/ListTab"), {
  ssr: false,
  loading: tabLoading,
});
const SummaryTab = dynamic(() => import("./tabs/SummaryTab"), {
  ssr: false,
  loading: tabLoading,
});
const ArchiveTab = dynamic(() => import("./tabs/ArchiveTab"), {
  ssr: false,
  loading: tabLoading,
});
const DocsLayout = dynamic(
  () => import("../../docs").then((module) => module.DocsLayout),
  {
    ssr: false,
    loading: tabLoading,
  },
);
const MembersTab = dynamic(() => import("./tabs/MembersTab"), {
  ssr: false,
  loading: tabLoading,
});

type WorkspaceContentProps = {
  activeTab: string;

  workspace: any;
  workspaceId: string;

  boardProps: {
    data: BoardTabProps["data"];
    ui: BoardTabProps["ui"];
    actions: BoardTabProps["actions"];
    refs: BoardTabProps["refs"];
  };
  backlogProps: {
    data: BacklogTabProps["data"];
    ui: BacklogTabProps["ui"];
    actions: BacklogTabProps["actions"];
    permissions?: BacklogTabProps["permissions"];
  };
  timelineProps: any;
  listProps: any;
  summaryProps: any;
  calendarProps: any;
  archiveProps: any;
  membersProps: {
    workspaceId: string;
    currentUserId?: string;
    isAdmin: boolean;
  };
};

export default function WorkspaceContent({
  activeTab,
  workspace,
  workspaceId,
  boardProps,
  backlogProps,
  timelineProps,
  listProps,
  summaryProps,
  calendarProps,
  archiveProps,
  membersProps,
}: WorkspaceContentProps) {
  return (
    <div
      className={`rounded-[10px] ${
        activeTab === "pages"
          ? ""
          : ""
      }`}
    >
      {activeTab === "pages" && (
        <DocsLayout workspaceId={workspaceId} />
      )}

      {activeTab === "board" && <BoardTab {...boardProps} />}

      {activeTab === "backlog" && <BacklogTab {...backlogProps} />}

      {activeTab === "timeline" && (
        <TimelineTab {...timelineProps} />
      )}

      {activeTab === "calendar" && <CalendarTab {...calendarProps} />}
      
      {activeTab === "list" && <ListTab {...listProps} />}

      {activeTab === "archive" && <ArchiveTab {...archiveProps} />}

      {activeTab === "summary" && <SummaryTab {...summaryProps} />}

      {activeTab === "members" && <MembersTab {...membersProps} />}
    </div>
  );
}
