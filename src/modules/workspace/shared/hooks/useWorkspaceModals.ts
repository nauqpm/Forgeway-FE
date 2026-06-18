"use client";

import { useState, useRef } from "react";
import { Issue } from "@/modules/workspace/shared/types/issue.type";
import { Sprint } from "@/modules/workspace/shared/types/sprint.type";

interface NewIssueForm {
  title: string;
  type: string;
  priority: string;
  status: string;
  sprintId: string | null;
  assigneeId: string;
  columnId?: string | null;
}

const DEFAULT_NEW_ISSUE_FORM: NewIssueForm = {
  title: "",
  type: "Task",
  priority: "Medium",
  status: "To Do",
  sprintId: null,
  assigneeId: "",
  columnId: null,
};

export function useWorkspaceModals(initialTaskKey: string | null) {
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [newIssueForm, setNewIssueForm] = useState<NewIssueForm>(DEFAULT_NEW_ISSUE_FORM);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedTaskKey, setSelectedTaskKey] = useState<string | null>(initialTaskKey);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [listViewMode, setListViewMode] = useState<"grid" | "split">("grid");
  const [listGridDrawerOpen, setListGridDrawerOpen] = useState(false);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [showCreateColumn, setShowCreateColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const columnsEndRef = useRef<HTMLDivElement>(null);
  const [density, setDensity] = useState<"default" | "compact">("default");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return {
    showCreateIssue,
    setShowCreateIssue,
    newIssueForm,
    setNewIssueForm,
    selectedIssue,
    setSelectedIssue,
    selectedTaskKey,
    setSelectedTaskKey,
    selectedTaskIds,
    setSelectedTaskIds,
    listViewMode,
    setListViewMode,
    listGridDrawerOpen,
    setListGridDrawerOpen,
    isSprintModalOpen,
    setIsSprintModalOpen,
    editingSprint,
    setEditingSprint,
    showCreateColumn,
    setShowCreateColumn,
    newColumnName,
    setNewColumnName,
    columnsEndRef,
    density,
    setDensity,
    isFilterOpen,
    setIsFilterOpen,
  };
}
