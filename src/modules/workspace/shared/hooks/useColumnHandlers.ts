import { RefObject } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/constants/queryKeys";
import { boardService } from "../services/boardService";
import { BoardColumn } from "../types/board.type";
import { toast } from "react-hot-toast";
import { extractApiError, extractApiErrorCode } from "@/shared/utils/apiError";
import { COLUMN_NAME_MESSAGES, hasDuplicateColumnName, normalizeColumnDisplayName } from "../utils/columnName";

const getColumnErrorMessage = (error: unknown, fallback: string): string => {
  const code = extractApiErrorCode(error, "");

  if (code === "INVALID_COLUMN_NAME") return COLUMN_NAME_MESSAGES.INVALID;
  if (code === "DUPLICATE_COLUMN_NAME") return COLUMN_NAME_MESSAGES.DUPLICATE;

  return extractApiError(error, fallback);
};

interface UseColumnHandlersProps {
  workspaceId: string;
  newColumnName: string;
  setNewColumnName: React.Dispatch<React.SetStateAction<string>>;
  setShowCreateColumn: React.Dispatch<React.SetStateAction<boolean>>;
  columnsEndRef: RefObject<HTMLDivElement | null>;
}

export const useColumnHandlers = ({
  workspaceId,
  newColumnName,
  setNewColumnName,
  setShowCreateColumn,
  columnsEndRef,
}: UseColumnHandlersProps) => {
  const queryClient = useQueryClient();
  const boardQueryKey = queryKeys.board.byWorkspace(workspaceId);

  const createColumnMutation = useMutation({
    mutationFn: (name: string) => boardService.createColumn(workspaceId, { name }),
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: boardQueryKey });
      const previousBoard = queryClient.getQueryData<{ boardId: string; columns: BoardColumn[] }>(boardQueryKey);
      const currentColumns = previousBoard?.columns || [];

      const newColumn: BoardColumn = {
        id: `temp-${Date.now()}`,
        name,
        order: currentColumns.length,
        mappedStatuses: [name],
      };

      if (previousBoard) {
        queryClient.setQueryData(boardQueryKey, {
          ...previousBoard,
          columns: [...currentColumns, newColumn],
        });
      }

      setNewColumnName("");
      setShowCreateColumn(false);

      setTimeout(() => {
        columnsEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "end",
        });
      }, 100);

      return { previousBoard };
    },
    onError: (err, name, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(boardQueryKey, context.previousBoard);
      }
      setNewColumnName(name);
      setShowCreateColumn(true);
      toast.error(getColumnErrorMessage(err, "Could not create column."));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: boardQueryKey });
    },
    onSuccess: () => {
      toast.success("Column added");
    },
  });

  const renameColumnMutation = useMutation({
    mutationFn: ({ columnId, name }: { columnId: string; name: string }) =>
      boardService.renameColumn(workspaceId, columnId, { name }),
    onMutate: async ({ columnId, name }) => {
      await queryClient.cancelQueries({ queryKey: boardQueryKey });
      const previousBoard = queryClient.getQueryData<{ boardId: string; columns: BoardColumn[] }>(boardQueryKey);

      if (previousBoard) {
        queryClient.setQueryData(boardQueryKey, {
          ...previousBoard,
          columns: previousBoard.columns.map((c) => (c.id === columnId ? { ...c, name } : c)),
        });
      }

      return { previousBoard };
    },
    onError: (err, variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(boardQueryKey, context.previousBoard);
      }
      toast.error(getColumnErrorMessage(err, "Could not rename column."));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: boardQueryKey });
    },
    onSuccess: () => {
      toast.success("Column renamed");
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: ({ columnId, migrateTo }: { columnId: string; migrateTo?: string }) =>
      boardService.deleteColumn(workspaceId, columnId, { targetColumnId: migrateTo }),
    onMutate: async ({ columnId }) => {
      await queryClient.cancelQueries({ queryKey: boardQueryKey });
      const previousBoard = queryClient.getQueryData<{ boardId: string; columns: BoardColumn[] }>(boardQueryKey);

      if (previousBoard) {
        queryClient.setQueryData(boardQueryKey, {
          ...previousBoard,
          columns: previousBoard.columns.filter((c) => c.id !== columnId),
        });
      }

      return { previousBoard };
    },
    onError: (err, variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(boardQueryKey, context.previousBoard);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const serverMessage = (err as any)?.response?.data?.message;
      toast.error(serverMessage || "Failed to delete column");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: boardQueryKey });
    },
    onSuccess: () => {
      toast.success("Column deleted");
    },
  });

  const moveColumnMutation = useMutation({
    mutationFn: ({ columnId, newOrder }: { columnId: string; newOrder: number }) =>
      boardService.moveColumn(workspaceId, columnId, { targetIndex: newOrder }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: boardQueryKey });
      const previousBoard = queryClient.getQueryData<{ boardId: string; columns: BoardColumn[] }>(boardQueryKey);
      return { previousBoard };
    },
    onError: (err, variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(boardQueryKey, context.previousBoard);
      }
      toast.error("Error moving column: " + err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: boardQueryKey });
    },
  });

  const handleAddColumn = () => {
    const normalizedName = normalizeColumnDisplayName(newColumnName);
    if (!normalizedName) {
      toast.error(COLUMN_NAME_MESSAGES.INVALID);
      return;
    }

    const board = queryClient.getQueryData<{ columns: BoardColumn[] }>(boardQueryKey);
    if (hasDuplicateColumnName(board?.columns ?? [], normalizedName)) {
      toast.error(COLUMN_NAME_MESSAGES.DUPLICATE);
      return;
    }

    createColumnMutation.mutate(normalizedName);
  };

  const handleRenameColumn = (columnId: string, name: string) => {
    const normalizedName = normalizeColumnDisplayName(name);
    if (!normalizedName) {
      toast.error(COLUMN_NAME_MESSAGES.INVALID);
      return;
    }

    const board = queryClient.getQueryData<{ columns: BoardColumn[] }>(boardQueryKey);
    if (hasDuplicateColumnName(board?.columns ?? [], normalizedName, columnId)) {
      toast.error(COLUMN_NAME_MESSAGES.DUPLICATE);
      return;
    }

    renameColumnMutation.mutate({ columnId, name: normalizedName });
  };

  const handleDeleteColumn = (columnId: string, migrateTo?: string) => {
    deleteColumnMutation.mutate({ columnId, migrateTo });
  };

  const handleMoveColumn = (columnId: string, newOrder: number) => {
    moveColumnMutation.mutate({ columnId, newOrder });
  };

  return {
    handleAddColumn,
    handleRenameColumn,
    handleDeleteColumn,
    handleMoveColumn,
    isCreating: createColumnMutation.isPending,
  };
};
