export interface BoardColumn {
  id: string;
  name: string;
  order: number;
  wipLimit?: number;
  mappedStatuses: string[];
  isDone?: boolean;
}

export interface Board {
  _id: string;
  workspaceId: string;
  columns: BoardColumn[];
}

export interface CreateColumnDto {
  name: string;
}

export interface UpdateColumnDto {
  name?: string;
  mappedStatuses?: string[];
}

export interface MoveColumnDto {
  targetIndex?: number;
  afterColumnId?: string | null;
}

export interface DeleteColumnDto {
  targetColumnId?: string;
}
