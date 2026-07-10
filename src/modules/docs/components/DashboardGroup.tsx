"use client";

import { motion } from "framer-motion";
import { Download, Pencil, Trash2 } from "lucide-react";
import { documentService } from "../services/documentService";
import { Document } from "../types/docs.type";
import DashboardRow from "./DashboardRow";

interface DashboardGroupProps {
  docs: Document[];
  idx: number;
  expandedNodes: string[];
  onToggleExpand: (id: string) => void;
  onSelect: (id: string) => void;
  onRename: (id: string, currentTitle: string) => void;
  onDelete: (doc: Document) => void;
}

type DashboardTreeRow = {
  doc: Document;
  level: number;
  childCount: number;
};

function buildTreeRows(docs: Document[], expandedNodes: string[]): DashboardTreeRow[] {
  const ids = new Set(docs.map((doc) => doc.id));
  const childrenByParent = new Map<string, Document[]>();

  docs.forEach((doc) => {
    if (doc.source === "import" || !doc.parentId || !ids.has(doc.parentId)) return;
    childrenByParent.set(doc.parentId, [...(childrenByParent.get(doc.parentId) ?? []), doc]);
  });

  const rows: DashboardTreeRow[] = [];
  const roots = docs.filter((doc) => doc.source === "import" || !doc.parentId || !ids.has(doc.parentId));

  const visit = (doc: Document, level: number, seen: Set<string>) => {
    const children = childrenByParent.get(doc.id) ?? [];
    rows.push({ doc, level, childCount: children.length });
    if (!expandedNodes.includes(doc.id) || seen.has(doc.id)) return;
    children.forEach((child) => visit(child, level + 1, new Set([...seen, doc.id])));
  };

  roots.forEach((doc) => visit(doc, 0, new Set()));
  return rows;
}

export default function DashboardGroup({
  docs,
  idx,
  expandedNodes,
  onToggleExpand,
  onSelect,
  onRename,
  onDelete,
}: DashboardGroupProps) {
  const rows = buildTreeRows(docs, expandedNodes);

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[8px] border border-[#EAEAEA] bg-white dark:border-white/[0.04] dark:bg-[#202020]">
        <div className="divide-y divide-[#EAEAEA] dark:divide-white/[0.06] md:hidden">
          {rows.map(({ doc, level, childCount }) => (
            <div
              key={doc.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(doc.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(doc.id);
                }
              }}
              className="w-full px-4 py-3 text-left transition-colors hover:bg-[#F7F6F3] focus:bg-[#F7F6F3] focus:outline-none dark:hover:bg-white/[0.025] dark:focus:bg-white/[0.025]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0" style={{ paddingLeft: level * 20 }}>
                  <div className="flex items-center gap-2">
                    {childCount > 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleExpand(doc.id);
                        }}
                        className="rounded-[4px] p-0.5 text-[#787774] hover:bg-[#EAEAEA] hover:text-[#111111] dark:text-[#9B9A97] dark:hover:bg-white/10 dark:hover:text-[#E8E8E7]"
                        aria-label={`${expandedNodes.includes(doc.id) ? "Collapse" : "Expand"} ${doc.title}`}
                      >
                        {expandedNodes.includes(doc.id) ? "v" : ">"}
                      </button>
                    ) : (
                      <span className="w-5" />
                    )}
                    <p className="truncate text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">{doc.title}</p>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B]">
                      Created {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {doc.source === "import" ? (
                    <a
                      href={documentService.downloadUrl(doc.id)}
                      className="rounded-[6px] p-2 text-[#ABABAB] transition-colors hover:bg-[#EFF6FF] hover:text-[#2563EB] dark:hover:bg-[rgba(37,99,235,0.12)] dark:hover:text-[#3B82F6]"
                      title="Download"
                      aria-label={`Download ${doc.title}`}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onRename(doc.id, doc.title)}
                      className="rounded-[6px] p-2 text-[#ABABAB] transition-colors hover:bg-[#EFF6FF] hover:text-[#2563EB] dark:hover:bg-[rgba(37,99,235,0.12)] dark:hover:text-[#3B82F6]"
                      title="Rename"
                      aria-label={`Rename ${doc.title}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDelete(doc)}
                    className="rounded-[6px] p-2 text-[#ABABAB] transition-colors hover:bg-[#FDEBEC] hover:text-[#9F2F2D] dark:hover:bg-[rgba(159,47,45,0.12)] dark:hover:text-[#F87171]"
                    title={doc.source === "import" ? "Remove from workspace" : "Delete"}
                    aria-label={`${doc.source === "import" ? "Remove" : "Delete"} ${doc.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden min-h-0 flex-1 overflow-auto md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F9F8] dark:bg-[#252525] border-b border-[#EAEAEA] dark:border-white/[0.04]">
                <th className="w-[45%] min-w-[320px] whitespace-nowrap px-4 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-[#ABABAB] dark:text-[#6B6B6B]">Name</th>
                <th className="w-[132px] min-w-[132px] whitespace-nowrap px-4 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-[#ABABAB] dark:text-[#6B6B6B]">Type</th>
                <th className="min-w-[160px] whitespace-nowrap px-4 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-[#ABABAB] dark:text-[#6B6B6B]">Owner / editor</th>
                <th className="min-w-[128px] whitespace-nowrap px-4 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-[#ABABAB] dark:text-[#6B6B6B]">Last edited</th>
                <th className="w-[104px] whitespace-nowrap px-4 py-2.5 text-right text-[0.6875rem] font-semibold uppercase tracking-wider text-[#ABABAB] dark:text-[#6B6B6B]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ doc, level, childCount }) => (
                <DashboardRow
                  key={doc.id}
                  doc={doc}
                  level={level}
                  hasChildren={childCount > 0}
                  isExpanded={expandedNodes.includes(doc.id)}
                  onToggleExpand={onToggleExpand}
                  onSelect={onSelect}
                  onRename={onRename}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.section>
  );
}
