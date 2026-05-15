"use client";

import { motion } from "framer-motion";
import { Document } from "../types/docs.type";
import DashboardRow from "./DashboardRow";

interface DashboardGroupProps {
  name: string;
  docs: Document[];
  idx: number;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, currentTitle: string) => void;
  onDelete: (id: string) => void;
}

export default function DashboardGroup({
  name,
  docs,
  idx,
  onSelect,
  onDuplicate,
  onRename,
  onDelete,
}: DashboardGroupProps) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
    >
      <div className="flex items-center gap-2 mb-5 px-1">
        <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
        <h3 className="text-[12px] font-bold text-[#42526E] dark:text-gray-300 uppercase tracking-[0.1em]">{name}</h3>
        <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-bold text-gray-500 dark:text-gray-400">{docs.length}</span>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/40 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B778C] dark:text-gray-400 uppercase tracking-wider w-[45%]">Document Title</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B778C] dark:text-gray-400 uppercase tracking-wider">Contributor</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B778C] dark:text-gray-400 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B778C] dark:text-gray-400 uppercase tracking-wider text-right">Options</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(doc => (
                <DashboardRow 
                  key={doc.id}
                  doc={doc}
                  onSelect={onSelect}
                  onDuplicate={onDuplicate}
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
