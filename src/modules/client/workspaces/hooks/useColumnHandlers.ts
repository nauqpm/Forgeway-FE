import { RefObject } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { boardService } from "../services/boardService";
import { BoardColumn } from "../types/board.type";
import { toast } from "react-hot-toast";

interface UseColumnHandlersProps {
  workspaceId: string;
  columns: BoardColumn[];
  newColumnName: string;
  setColumns: React.Dispatch<React.SetStateAction<BoardColumn[]>>;
  setNewColumnName: React.Dispatch<React.SetStateAction<string>>;
  setShowCreateColumn: React.Dispatch<React.SetStateAction<boolean>>;
  columnsEndRef: RefObject<HTMLDivElement | null>;
}

export const useColumnHandlers = ({
  workspaceId,
  columns,
  newColumnName,
  setColumns,
  setNewColumnName,
  setShowCreateColumn,
  columnsEndRef,
}: UseColumnHandlersProps) => {
  const queryClient = useQueryClient();

  const createColumnMutation = useMutation({
    mutationFn: (name: string) => boardService.createColumn(workspaceId, { name }),
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: ["board", workspaceId] });
      const previousColumns = columns;
      
      const newColumn: BoardColumn = {
        id: `temp-${Date.now()}`,
        name,
        order: columns.length,
        mappedStatuses: [name],
      };
      
      setColumns([...columns, newColumn]);
      setNewColumnName("");
      setShowCreateColumn(false);

      setTimeout(() => {
        columnsEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "end",
        });
      }, 100);

      return { previousColumns };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousColumns) {
        setColumns(context.previousColumns);
      }
      toast.error("Lỗi khi tạo cột: " + err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["board", workspaceId] });
    },
    onSuccess: () => {
      toast.success("Đã thêm cột mới");
    }
  });

  const renameColumnMutation = useMutation({
    mutationFn: ({ columnId, name }: { columnId: string; name: string }) =>
      boardService.renameColumn(workspaceId, columnId, { name }),
    onMutate: async ({ columnId, name }) => {
      await queryClient.cancelQueries({ queryKey: ["board", workspaceId] });
      const previousColumns = columns;
      
      setColumns(columns.map(c => c.id === columnId ? { ...c, name } : c));

      return { previousColumns };
    },
    onError: (err, variables, context) => {
      if (context?.previousColumns) {
        setColumns(context.previousColumns);
      }
      toast.error("Lỗi khi đổi tên cột: " + err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["board", workspaceId] });
    },
    onSuccess: () => {
      toast.success("Đã đổi tên cột");
    }
  });

  const deleteColumnMutation = useMutation({
    mutationFn: ({ columnId, migrateTo }: { columnId: string; migrateTo?: string }) =>
      boardService.deleteColumn(workspaceId, columnId, { targetColumnId: migrateTo }),
    onMutate: async ({ columnId }) => {
      await queryClient.cancelQueries({ queryKey: ["board", workspaceId] });
      const previousColumns = columns;
      
      setColumns(columns.filter(c => c.id !== columnId));

      return { previousColumns };
    },
    onError: (err, variables, context) => {
      if (context?.previousColumns) {
        setColumns(context.previousColumns);
      }
      toast.error("Lỗi khi xóa cột: " + err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["board", workspaceId] });
    },
    onSuccess: () => {
      toast.success("Đã xóa cột");
    }
  });

  const moveColumnMutation = useMutation({
    mutationFn: ({ columnId, newOrder }: { columnId: string; newOrder: number }) =>
      boardService.moveColumn(workspaceId, columnId, { targetIndex: newOrder }),
    onMutate: async ({ columnId, newOrder }) => {
      await queryClient.cancelQueries({ queryKey: ["board", workspaceId] });
      const previousColumns = columns;
      
      // Optimistic update for order is complex, we assume the caller (drag end handler) 
      // has already updated the local state. We just return previous in case of rollback.
      return { previousColumns };
    },
    onError: (err, variables, context) => {
      if (context?.previousColumns) {
        setColumns(context.previousColumns);
      }
      toast.error("Lỗi khi di chuyển cột: " + err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["board", workspaceId] });
    }
  });

  const handleAddColumn = () => {
    if (!newColumnName.trim()) {
      setShowCreateColumn(false);
      return;
    }
    createColumnMutation.mutate(newColumnName.trim());
  };

  const handleRenameColumn = (columnId: string, name: string) => {
    renameColumnMutation.mutate({ columnId, name });
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
