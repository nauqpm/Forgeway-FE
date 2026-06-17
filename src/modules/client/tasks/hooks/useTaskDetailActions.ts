import { useState } from "react";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import type { TaskDetailItem, TaskDetailComment } from "../types/taskDetail.type";

export interface UseTaskDetailActionsReturn {
  newComment: string;
  setNewComment: React.Dispatch<React.SetStateAction<string>>;
  submitting: boolean;
  editingDesc: boolean;
  setEditingDesc: React.Dispatch<React.SetStateAction<boolean>>;
  descContent: string;
  setDescContent: React.Dispatch<React.SetStateAction<string>>;
  handleAddComment: () => Promise<void>;
  handleStatusChange: (status: string) => Promise<void>;
  handleSaveDescription: () => Promise<void>;
}

export function useTaskDetailActions(
  taskId: string,
  task: TaskDetailItem | null,
  setTask: React.Dispatch<React.SetStateAction<TaskDetailItem | null>>,
  setComments: React.Dispatch<React.SetStateAction<TaskDetailComment[]>>,
  comments: TaskDetailComment[],
): UseTaskDetailActionsReturn {
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descContent, setDescContent] = useState(task?.description ?? "");

  const handleAddComment = async () => {
    if (!newComment.trim() || !task) return;
    setSubmitting(true);
    try {
      const res = await api.post(apiRoutes.COMMENTS.BASE, {
        content: newComment,
        targetType: "task",
        targetId: taskId,
      });
      setComments([...comments, res.data]);
      setNewComment("");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!task) return;
    try {
      await api.put(apiRoutes.TASKS.STATUS(taskId), { status });
      setTask({ ...task, status });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveDescription = async () => {
    if (!task) return;
    try {
      await api.put(apiRoutes.TASKS.BY_ID(taskId), { description: descContent });
      setTask({ ...task, description: descContent });
      setEditingDesc(false);
    } catch (e) {
      console.error(e);
    }
  };

  return {
    newComment,
    setNewComment,
    submitting,
    editingDesc,
    setEditingDesc,
    descContent,
    setDescContent,
    handleAddComment,
    handleStatusChange,
    handleSaveDescription,
  };
}
