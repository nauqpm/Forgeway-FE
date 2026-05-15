"use client";

import BoardTab from "./tabs/BoardTab";
import BacklogTab from "./tabs/BacklogTab";
import TimelineTab from "./tabs/TimelineTab";
import { DocsLayout } from "../../docs";

type SpaceContentProps = {
  activeTab: string;

  space: any;
  spaceId: string;

  boardProps: any;
  backlogProps: any;
  timelineProps: any;
};

export default function SpaceContent({
  activeTab,
  space,
  spaceId,
  boardProps,
  backlogProps,
  timelineProps,
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
    </div>
  );
}