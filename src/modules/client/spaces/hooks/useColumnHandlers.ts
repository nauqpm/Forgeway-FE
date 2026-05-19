import { RefObject } from "react";

interface UseColumnHandlersProps {
  columns: string[];

  newColumnName: string;

  setColumns: React.Dispatch<
    React.SetStateAction<string[]>
  >;

  setNewColumnName: React.Dispatch<
    React.SetStateAction<string>
  >;

  setShowCreateColumn: React.Dispatch<
    React.SetStateAction<boolean>
  >;

  columnsEndRef: RefObject<HTMLDivElement | null>;
}

export const useColumnHandlers = ({
  columns,
  newColumnName,
  setColumns,
  setNewColumnName,
  setShowCreateColumn,
  columnsEndRef,
}: UseColumnHandlersProps) => {
  const handleAddColumn = () => {
    if (!newColumnName.trim()) {
      setShowCreateColumn(false);

      return;
    }

    setColumns([
      ...columns,
      newColumnName.trim(),
    ]);

    setNewColumnName("");

    setShowCreateColumn(false);

    setTimeout(() => {
      columnsEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "end",
      });
    }, 100);
  };

  return {
    handleAddColumn,
  };
};