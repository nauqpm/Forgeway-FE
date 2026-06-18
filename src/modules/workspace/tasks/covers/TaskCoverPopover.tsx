"use client";

import { useState } from "react";
import { Check, ChevronRight, X } from "lucide-react";
import type { TaskCover } from "@/modules/workspace/shared/types/task-cover.type";
import { isImageCover } from "@/modules/workspace/shared/types/task-cover.type";

type CoverTab = "colors" | "images";

type TaskCoverPopoverProps = {
  cover?: TaskCover | null;
  disabled?: boolean;
  saving?: boolean;
  onApplyCover: (cover: TaskCover) => Promise<void> | void;
  onRemoveCover: () => Promise<void> | void;
  onRequestClose: () => void;
};

const SOLID_COLORS = [
  "#172B4D", "#0747A6", "#0052CC", "#0065FF", "#00B8D9", "#00875A", "#36B37E", "#FFAB00", "#FF8B00", "#DE350B", "#BF2600",
  "#253858", "#403294", "#5243AA", "#6554C0", "#8777D9", "#00A3BF", "#57D9A3", "#FFC400", "#FF991F", "#FF7452", "#C9372C",
  "#091E42", "#1D474C", "#216E4E", "#4C6B1F", "#7A5D00", "#974F0C", "#AE2E24", "#5E4DB2", "#206A83", "#0C66E4", "#626F86",
  "#44546F", "#0C4A6E", "#0F766E", "#15803D", "#65A30D", "#CA8A04", "#EA580C", "#DC2626", "#9333EA", "#2563EB", "#111827",
];

const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1433832597046-4f10e10ac764?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",

  // --- 2. URBAN, ARCHITECTURE & STREETS (URBAN & ARCHITECTURE) ---
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1504297050568-910d24c426d3?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1464938050520-ef2270bb8ce8?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?auto=format&fit=crop&w=800&q=80", 

  // --- 3. WORKSPACES & MINIMAL BACKGROUNDS (WORKSPACES & MINIMALIST) ---
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1531973576160-7125cd663d86?auto=format&fit=crop&w=800&q=80", 
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=80",  
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1531973576160-7125cd663d86?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1507207611509-ec012433ff52?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1491975474562-1f4e30bc9468?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=80",
];

const COVER_IMAGES_PER_PAGE = 6;

export default function TaskCoverPopover({
  cover,
  disabled,
  saving,
  onApplyCover,
  onRemoveCover,
  onRequestClose,
}: TaskCoverPopoverProps) {
  const [activeTab, setActiveTab] = useState<CoverTab>("colors");
  const [imagePage, setImagePage] = useState(1);

  const activeImageUrl = isImageCover(cover) ? cover.imageUrl : "";
  const tabs: CoverTab[] = ["colors", "images"];
  const imagePageCount = Math.ceil(COVER_IMAGES.length / COVER_IMAGES_PER_PAGE);
  const pageImages = COVER_IMAGES.slice(
    (imagePage - 1) * COVER_IMAGES_PER_PAGE,
    imagePage * COVER_IMAGES_PER_PAGE,
  );
  const getTabLabel = (tab: CoverTab) => {
    if (tab === "images") return "Images";
    return tab.charAt(0).toUpperCase() + tab.slice(1);
  };

  return (
    <div className="w-[21rem] overflow-hidden rounded-[10px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020]" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between border-b border-[#EAEAEA] dark:border-white/[0.06] px-3 py-2">
        <h3 className="text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Select a cover</h3>
        <button
          type="button"
          onClick={onRequestClose}
          className="rounded-[4px] p-1 text-[#787774] dark:text-[#9B9A97] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] hover:text-[#111111] dark:hover:text-[#E8E8E7]"
          aria-label="Close cover picker"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex border-b border-[#EAEAEA] dark:border-white/[0.06] px-2 pt-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
            }}
            className={`h-9 flex-1 rounded-t-[6px] text-[0.8125rem] font-medium transition-colors ${
              activeTab === tab
                ? "bg-[#F7F6F3] dark:bg-[#2A2A2A] text-[#111111] dark:text-[#E8E8E7]"
                : "text-[#787774] dark:text-[#9B9A97] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
            }`}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      <div className="max-h-[22.5rem] overflow-y-auto p-3">
        {activeTab === "colors" && (
          <div>
            <div className="grid grid-cols-11 gap-1.5 rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] bg-[#F9F9F8] dark:bg-[#252525] p-2">
              {SOLID_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  disabled={disabled || saving}
                  onClick={() => onApplyCover({ type: "color", color, source: "system" })}
                  className="relative h-6 w-6 rounded-[4px] border border-white/10 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: color }}
                  aria-label={`Set cover ${color}`}
                >
                  {cover?.type === "color" && cover.color === color && (
                    <Check className="absolute left-1 top-1 h-4 w-4 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "images" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {pageImages.map((imageUrl) => (
                <button
                  key={imageUrl}
                  type="button"
                  disabled={disabled || saving}
                  onClick={() => onApplyCover({ type: "image", imageUrl, source: "unsplash" })}
                  className={`relative h-16 overflow-hidden rounded-[6px] border transition ${
                    activeImageUrl === imageUrl ? "border-[#2563EB] ring-2 ring-[#2563EB]/30" : "border-[#EAEAEA] dark:border-white/[0.08] hover:border-[#2563EB]/40"
                  }`}
                  aria-label="Set image cover"
                >
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                  {activeImageUrl === imageUrl && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Check className="h-4 w-4 text-white" />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-[#EAEAEA] dark:border-white/[0.06] pt-3">
              <button
                type="button"
                disabled={imagePage === 1}
                onClick={() => setImagePage((page) => Math.max(1, page - 1))}
                className="h-8 rounded-[6px] px-2.5 text-[0.6875rem] font-medium text-[#111111] dark:text-[#E8E8E7] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Previous
              </button>
              <span className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
                Page {imagePage} of {imagePageCount}
              </span>
              <button
                type="button"
                disabled={imagePage === imagePageCount}
                onClick={() => setImagePage((page) => Math.min(imagePageCount, page + 1))}
                className="h-8 rounded-[6px] px-2.5 text-[0.6875rem] font-medium text-[#111111] dark:text-[#E8E8E7] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>

      <div className="sticky bottom-0 border-t border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] p-3 text-center">
        <button
          type="button"
          disabled={disabled || saving || !cover}
          onClick={onRemoveCover}
          className="inline-flex h-8 items-center justify-center rounded-[6px] px-3 text-[0.8125rem] font-medium text-[#9F2F2D] dark:text-[#F87171] transition-colors hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Remove cover
        </button>
      </div>
    </div>
  );
}

export function TaskCoverMenuRow({
  onMouseEnter,
}: {
  onMouseEnter: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[0.8125rem] text-[#111111] dark:text-[#E8E8E7] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
    >
      <span>Select cover</span>
      <ChevronRight className="h-4 w-4 text-[#ABABAB] dark:text-[#6B6B6B]" />
    </button>
  );
}
