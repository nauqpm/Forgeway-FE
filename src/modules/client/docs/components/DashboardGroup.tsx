"use client";

import { motion } from "framer-motion";
import { Document } from "../types/docs.type";
import DashboardRow from "./DashboardRow";

interface DashboardGroupProps {
  name: string;
  docs: Document[];
  idx: number;
  onSelect: (id: string) => void;
  onRename: (id: string, currentTitle: string) => void;
  onDelete: (doc: Document) => void;
}

export default function DashboardGroup({
  name,
  docs,
  idx,
  onSelect,
  onRename,
  onDelete,
}: DashboardGroupProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-1.5 h-4 bg-[#2563EB] dark:bg-[#3B82F6] rounded-full" />
        <h3 className="text-[0.6875rem] font-semibold text-[#787774] dark:text-[#9B9A97] uppercase tracking-[0.1em]">{name}</h3>
        <span className="ml-2 px-2 py-0.5 bg-[#F7F6F3] dark:bg-[#252525] rounded-[4px] text-[0.625rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B]">{docs.length}</span>
      </div>

      <div className="bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.04] rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F9F8] dark:bg-[#252525] border-b border-[#EAEAEA] dark:border-white/[0.04]">
                <th className="px-6 py-4 text-[0.6875rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-wider w-[45%]">Document Title</th>
                <th className="px-6 py-4 text-[0.6875rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-wider">Last Edited By</th>
                <th className="px-6 py-4 text-[0.6875rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-wider">Activity</th>
                <th className="px-6 py-4 text-[0.6875rem] font-semibold text-[#ABABAB] dark:text-[#6B6B6B] uppercase tracking-wider text-right">Options</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(doc => (
                <DashboardRow
                  key={doc.id}
                  doc={doc}
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
