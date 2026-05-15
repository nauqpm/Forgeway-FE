"use client";

import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";

import PageTreeSidebar from "./PageTreeSidebar";

import BoardTab from "./tabs/BoardTab";
import BacklogTab from "./tabs/BacklogTab";
import TimelineTab from "./tabs/TimelineTab";
import ListTab from "./tabs/ListTab";
import SummaryTab from "./tabs/SummaryTab";

type SpaceContentProps = {
  activeTab: string;

  space: any;
  spaceId: string;

  boardProps: any;
  backlogProps: any;
  timelineProps: any;
  listProps: any;
  summaryProps: any;
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
}: SpaceContentProps) {
  return (
    <div
      className={`rounded-2xl ${
        activeTab === "pages"
          ? "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 min-h-[500px] flex"
          : ""
      }`}
    >
      {activeTab === "pages" && (
        <>
          <PageTreeSidebar
            spaceId={spaceId}
            initialData={[
              {
                id: "getting-started",
                title: "Getting Started",
                children: [
                  { id: "installation", title: "Installation" },
                  { id: "configuration", title: "Configuration" },
                ],
              },
              {
                id: "api-reference",
                title: "API Reference",
                children: [
                  { id: "auth", title: "Authentication" },
                  { id: "endpoints", title: "Endpoints" },
                ],
              },
            ]}
          />

          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-gray-900 rounded-r-2xl">
            <BookOpen className="w-16 h-16 text-indigo-100 dark:text-indigo-900 mx-auto mb-4" />

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Tài liệu dự án
            </h3>

            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-6">
              Quản lý tài liệu theo cấu trúc hình cây. Kéo thả để sắp xếp lại
              các trang. Chọn một trang bên trái để xem nội dung.
            </p>

            <Link
              href={`/spaces/${spaceId}/pages/create`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tạo trang mới
            </Link>
          </div>
        </>
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
