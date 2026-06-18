import { useEffect } from "react";
import { useTaskDetailData } from "./useTaskDetailData";
import { useTaskDetailActions } from "./useTaskDetailActions";

export function useTaskDetailPage(taskId: string) {
  const data = useTaskDetailData(taskId);
  const actions = useTaskDetailActions(
    taskId,
    data.task,
    data.setTask,
    data.setComments,
    data.comments,
  );

  // Sync descContent when task loads
  useEffect(() => {
    if (data.task) {
      actions.setDescContent(data.task.description ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.task?._id]);

  return {
    // data
    task: data.task,
    comments: data.comments,
    loading: data.loading,
    // actions
    newComment: actions.newComment,
    setNewComment: actions.setNewComment,
    submitting: actions.submitting,
    editingDesc: actions.editingDesc,
    setEditingDesc: actions.setEditingDesc,
    descContent: actions.descContent,
    setDescContent: actions.setDescContent,
    handleAddComment: actions.handleAddComment,
    handleStatusChange: actions.handleStatusChange,
    handleSaveDescription: actions.handleSaveDescription,
  };
}

export type TaskDetailPageProps = ReturnType<typeof useTaskDetailPage>;
