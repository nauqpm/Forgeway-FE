import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { getWorkspaceTemplate, Workspace, WorkspaceTab } from "@/modules/workspace/shared/types/workspace.type";

interface TabProps {
  workspace: Workspace;
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
}

const TAB_CLS = (active: boolean) =>
  `whitespace-nowrap px-3 py-2 text-[0.8125rem] font-medium transition-all sm:px-5 rounded-[6px] ${
    active
      ? "bg-white dark:bg-[#202020] text-[#111111] dark:text-[#E8E8E7]"
      : "text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
  }`;

const Tabs = ({ workspace, activeTab, setActiveTab }: TabProps) => {
  const template = getWorkspaceTemplate(workspace);

  const tabs = [
    { key: "board", label: "Board" },
    ...(template === "scrum" ? [{ key: "backlog", label: "Backlog" }] : []),
    { key: "timeline", label: "Timeline" },
    { key: "calendar", label: "Calendar" },
    { key: "list", label: "List" },
    { key: "archive", label: "Archive" },
    { key: "pages", label: "Docs" },
    { key: "members", label: "Members" },
  ];

  const [visibleCount, setVisibleCount] = useState(tabs.length);
  const [showMore, setShowMore] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 180 });

  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTabs = () => {
      if (window.innerWidth < 768) {
        setVisibleCount(2);
      } else if (window.innerWidth < 1280) {
        setVisibleCount(4);
      } else {
        setVisibleCount(tabs.length);
      }
    };

    updateTabs();
    window.addEventListener("resize", updateTabs);
    return () => window.removeEventListener("resize", updateTabs);
  }, [tabs.length]);

  const updateMoreMenuPosition = () => {
    const rect = moreBtnRef.current?.getBoundingClientRect();
    if (!rect) return;

    const menuWidth = Math.min(220, window.innerWidth - 16);
    setPosition({
      top: rect.bottom + 6,
      left: Math.min(Math.max(8, rect.left), window.innerWidth - menuWidth - 8),
      width: menuWidth,
    });
  };

  const visibleTabs = tabs.slice(0, visibleCount);
  const hiddenTabs = tabs.slice(visibleCount);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      const clickedMoreBtn = moreBtnRef.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);

      if (!clickedMoreBtn && !clickedDropdown) {
        setShowMore(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showMore) return;

    updateMoreMenuPosition();
    window.addEventListener("resize", updateMoreMenuPosition);
    window.addEventListener("scroll", updateMoreMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMoreMenuPosition);
      window.removeEventListener("scroll", updateMoreMenuPosition, true);
    };
  }, [showMore]);

  return (
    <div className="mb-2 w-full overflow-x-auto pb-1">
      <div className="flex items-center gap-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as WorkspaceTab)}
            className={TAB_CLS(activeTab === tab.key)}
          >
            {tab.label}
          </button>
        ))}

        {hiddenTabs.length > 0 && (
          <div className="relative">
            <button
              className="whitespace-nowrap px-3 py-2 text-[0.8125rem] font-medium transition-all sm:px-5 rounded-[6px] text-[#787774] dark:text-[#9B9A97] hover:text-[#111111] dark:hover:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
              ref={moreBtnRef}
              onClick={() => {
                updateMoreMenuPosition();
                setShowMore((prev) => !prev);
              }}
            >
              More ({hiddenTabs.length})
            </button>

            {showMore &&
              createPortal(
                <>
                  {/* overlay */}

                  {/* dropdown */}
                  <div
                    ref={dropdownRef}
                    style={{
                      position: "fixed",
                      top: position.top,
                      left: position.left,
                      width: position.width,
                    }}
                    className="pointer-events-auto z-[100000] overflow-hidden rounded-lg border border-[#E5E5E5] bg-white shadow-lg dark:border-[#333] dark:bg-[#202020]"
                  >
                    {hiddenTabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => {
                          setActiveTab(tab.key as WorkspaceTab);
                          setShowMore(false);
                        }}
                        className={`block w-full px-4 py-2 text-left text-sm transition-colors ${
                          activeTab === tab.key
                            ? "bg-[#F7F6F3] text-[#111111] dark:bg-[#2E2E2E] dark:text-white"
                            : "text-[#787774] hover:bg-[#F7F6F3] dark:text-[#9B9A97] dark:hover:bg-[#2E2E2E]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </>,
                document.body
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tabs;
