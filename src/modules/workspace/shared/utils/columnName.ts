import { BoardColumn } from "../types/board.type";

export const COLUMN_NAME_MESSAGES = {
  INVALID: "Column name must not be empty.",
  DUPLICATE: "A column with this name already exists.",
} as const;

export const normalizeColumnDisplayName = (name: string): string => name.normalize("NFKC").trim().replace(/\s+/g, " ");

const getColumnNameKey = (name: string): string => normalizeColumnDisplayName(name).toLocaleLowerCase("en-US");

export const hasDuplicateColumnName = (
  columns: readonly BoardColumn[],
  candidateName: string,
  excludedColumnId?: string
): boolean => {
  const candidateKey = getColumnNameKey(candidateName);

  return columns.some((column) => column.id !== excludedColumnId && getColumnNameKey(column.name) === candidateKey);
};
