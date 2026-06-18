"use client";

import { Plus, ArrowLeft, GripVertical } from "lucide-react";
import Link from "next/link";
import type { ProjectDetail, Board, Task } from "../types/projects.type";
import { PRIORITY_COLORS, TYPE_COLORS } from "../types/projects.type";

interface ProjectDetailViewProps {
  project: ProjectDetail;
  board: Board | null;
  dragOverColumn: string | null;
  handleDragStart: (e: React.DragEvent, task: Task) => void;
  handleDragOver: (e: React.DragEvent, columnId: string) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, columnId: string) => Promise<void>;
  handleCreateTask: (columnId: string) => Promise<void>;
  getTasksByColumn: (columnId: string) => Task[];
}

export default function ProjectDetailView({
  project,
  board,
  dragOverColumn,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleCreateTask,
  getTasksByColumn,
}: ProjectDetailViewProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-var(--app-header-h)-96px)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/projects" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {project.key} · {project.type}
            </p>
          </div>
        </div>
        <button
          onClick={() => handleCreateTask("todo")}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm"
        >
          <Plus className="w-4 h-4" /> Create Task
        </button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 h-full pb-4 min-w-max">
          {board?.columns
            .sort((a, b) => a.order - b.order)
            .map((column) => {
              const columnTasks = getTasksByColumn(column.id);
              return (
                <div
                  key={column.id}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.id)}
                  className={`workspace-column flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-xl flex flex-col ${dragOverColumn === column.id ? "ring-2 ring-indigo-400" : ""}`}
                >
                  <div className="flex items-center justify-between p-3">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                      {column.name}{" "}
                      <span className="ml-1 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                        {columnTasks.length}
                      </span>
                    </h3>
                    <button
                      onClick={() => handleCreateTask(column.id)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-2 space-y-2">
                    {columnTasks.map((task) => (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        className={`group bg-white dark:bg-gray-900 rounded-lg p-3 border-l-4 cursor-grab active:cursor-grabbing hover:shadow-md ${PRIORITY_COLORS[task.priority] || "border-l-gray-300"}`}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                              {task.title}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{task.key}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-1.5 py-0.5 text-xs rounded text-white ${TYPE_COLORS[task.type]}`}>
                            {task.type}
                          </span>
                          {task.labels.slice(0, 2).map((label) => (
                            <span key={label} className="px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded">
                              {label}
                            </span>
                          ))}
                        </div>
                        <Link
                          href={`/tasks/${task._id}`}
                          className="block mt-2 text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          View details
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
