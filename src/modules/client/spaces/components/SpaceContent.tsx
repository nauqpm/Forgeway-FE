"use client";

import BoardTab from "./tabs/BoardTab";
import BacklogTab from "./tabs/BacklogTab";
import TimelineTab from "./tabs/TimelineTab";
import ListTab from "./tabs/ListTab";
import SummaryTab from "./tabs/SummaryTab";
import { DocsLayout } from "../../docs";

type SpaceContentProps = {
  activeTab: string;

  space: any;
  spaceId: string;

  boardProps: any;
  backlogProps: any;
  timelineProps: any;
  listProps: any;
  summaryProps: any;
  calendarProps: any;
};

export default function SpaceContent({
  activeTab,
  space,
  spaceId,
  boardProps,
  backlogProps,
  timelineProps,
  listProps,
  summaryProps,
  calendarProps,
}: SpaceContentProps) {
  return (
    <div
      className={`rounded-2xl ${
        activeTab === "pages"
          ? ""
          : ""
      }`}
    >
      {activeTab === "pages" && (
        <DocsLayout spaceId={spaceId} />
      )}

      {activeTab === "board" && <BoardTab {...boardProps} />}

      {activeTab === "backlog" && <BacklogTab {...backlogProps} />}

      {activeTab === "timeline" && (
        <TimelineTab {...timelineProps} />
      )}
      
      {activeTab === "list" && <ListTab {...listProps} />}

      {activeTab === "summary" && <SummaryTab {...summaryProps} />}
    </div>
  );
}
