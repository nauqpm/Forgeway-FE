"use client";

import {
  DndContext,
  closestCorners,
  pointerWithin,
  rectIntersection,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  priority?: "low" | "medium" | "high";
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

export interface KanbanBoardProps {
  className?: string;
}

export default function KanbanBoard({ className = "" }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const [columns, setColumns] = useState<Column[]>([
    {
      id: "todo",
      title: "To Do",
      tasks: [
        { id: "1", title: "Design dashboard UI", priority: "high" },
        { id: "2", title: "Create login API", priority: "medium" },
      ],
    },
    {
      id: "inprogress",
      title: "In Progress",
      tasks: [{ id: "3", title: "Build sidebar", priority: "low" }],
    },
    {
      id: "done",
      title: "Done",
      tasks: [{ id: "4", title: "Setup project", priority: "low" }],
    },
  ]);

  const findTask = (id: string) => {
    for (const col of columns) {
      const task = col.tasks.find((t) => t.id === id);
      if (task) return task;
    }
    return null;
  };

  const findColumn = (id: string) => {
    return columns.find(
      (col) => col.id === id || col.tasks.find((t) => t.id === id),
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = findTask(event.active.id as string);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceCol = findColumn(activeId);
    const targetCol = findColumn(overId);

    if (!sourceCol || !targetCol) return;

    if (sourceCol.id === targetCol.id) {
      const oldIndex = sourceCol.tasks.findIndex((t) => t.id === activeId);
      const newIndex = sourceCol.tasks.findIndex((t) => t.id === overId);

      const newTasks = arrayMove(sourceCol.tasks, oldIndex, newIndex);

      setColumns((prev) =>
        prev.map((col) =>
          col.id === sourceCol.id ? { ...col, tasks: newTasks } : col,
        ),
      );
    } else {
      const task = sourceCol.tasks.find((t) => t.id === activeId);
      if (!task) return;

      setColumns((prev) =>
        prev.map((col) => {
          if (col.id === sourceCol.id) {
            return {
              ...col,
              tasks: col.tasks.filter((t) => t.id !== activeId),
            };
          }

          if (col.id === targetCol.id) {
            return {
              ...col,
              tasks: [...col.tasks, task],
            };
          }

          return col;
        }),
      );
    }

    setActiveTask(null);
  };

  return (
    <div className={`p-6 ${className}`}>
      <h1 className="text-xl font-bold mb-6">Kanban Board</h1>

      <DndContext
        collisionDetection={(args) => {
          const pointer = pointerWithin(args);
          return pointer.length > 0 ? pointer : rectIntersection(args);
        }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 gap-4">
          {columns.map((col) => (
            <ColumnComponent key={col.id} column={col} />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} isOverlay />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function ColumnComponent({ column }: { column: Column }) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className="bg-gray-100 rounded-xl p-3 flex flex-col min-h-[500px]"
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {column.title}
        </h2>

        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
          {column.tasks.length}
        </span>
      </div>

      <SortableContext
        items={column.tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 flex-1">
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>

      <button className="mt-3 flex items-center gap-2 text-sm text-gray-500 hover:bg-gray-200 rounded-lg px-2 py-1 transition">
        + Create
      </button>
    </div>
  );
}

function TaskCard({ task, isOverlay }: { task: Task; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = () => {
    if (task.priority === "high") return "text-red-600 border-red-300";
    if (task.priority === "medium") return "text-orange-600 border-orange-300";
    return "text-green-600 border-green-300";
  };

  return (
    <div
      ref={setNodeRef}
      style={!isOverlay ? style : undefined}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition ${
        isOverlay
          ? "opacity-90 scale-105"
          : "cursor-grab active:cursor-grabbing"
      }`}
    >
      <p className="text-sm font-medium text-gray-900 mb-2">{task.title}</p>

      <div
        className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded mb-2 ${getPriorityColor()}`}
      >
        May 3, 2026
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{task.id}</span>

        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-[10px] font-medium">
          TN
        </div>
      </div>
    </div>
  );
}
