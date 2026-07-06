"use client";

import dynamic from "next/dynamic";
import LoadingSpinner from "@/modules/admin-shared/components/common/components/LoadingSpinner";

const tabLoading = () => <LoadingSpinner />;

const BoardTab = dynamic(() => import("@/modules/workspace/board/BoardTab"), {
  ssr: false,
  loading: tabLoading,
});
const BacklogTab = dynamic(() => import("@/modules/workspace/board/BacklogTab"), {
  ssr: false,
  loading: tabLoading,
});
const TimelineTab = dynamic(() => import("@/modules/workspace/board/TimelineTab"), {
  ssr: false,
  loading: tabLoading,
});
const CalendarTab = dynamic(() => import("@/modules/workspace/board/CalendarTab"), {
  ssr: false,
  loading: tabLoading,
});
const ListTab = dynamic(() => import("@/modules/workspace/board/ListTab"), {
  ssr: false,
  loading: tabLoading,
});
const SummaryTab = dynamic(() => import("@/modules/workspace/board/SummaryTab"), {
  ssr: false,
  loading: tabLoading,
});
const ArchiveTab = dynamic(() => import("@/modules/workspace/board/ArchiveTab"), {
  ssr: false,
  loading: tabLoading,
});
const DocsLayout = dynamic(
  () => import("@/modules/docs").then((module) => module.DocsLayout),
  {
    ssr: false,
    loading: tabLoading,
  },
);
const MembersTab = dynamic(() => import("@/modules/workspace/board/MembersTab"), {
  ssr: false,
  loading: tabLoading,
});
const ReportsTab = dynamic(() => import("@/modules/workspace/board/ReportsTab"), {
  ssr: false,
  loading: tabLoading,
});

type WorkspaceContentProps = {
  activeTab: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workspace: any;
  workspaceId: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  boardProps: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  backlogProps: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timelineProps: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listProps: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  summaryProps: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calendarProps: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  archiveProps: any;
  membersProps: {
    workspaceId: string;
    currentUserId?: string;
    isAdmin: boolean;
  };
  reportsProps: {
    workspaceId: string;
    workspaceKey: string;
    onSelectTask: (task: { id: string; key: string; title: string; type: string }) => void;
    currentUserId?: string;
    workspaceType: string;
  };
};

export default function WorkspaceContent({
  activeTab,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  workspace: _workspace,
  workspaceId,
  boardProps,
  backlogProps,
  timelineProps,
  listProps,
  summaryProps,
  calendarProps,
  archiveProps,
  membersProps,
  reportsProps,
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

      {activeTab === "reports" && <ReportsTab {...reportsProps} />}
    </div>
  );
}
