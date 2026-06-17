import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import {
  Board,
  BoardColumn,
  CreateColumnDto,
  UpdateColumnDto,
  MoveColumnDto,
  DeleteColumnDto,
} from "../types/board.type";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeResponseData = <T>(payload: any): T => {
  return payload?.data?.data ?? payload?.data ?? payload;
};

export const boardService = {
  async getBoardByWorkspace(workspaceId: string): Promise<{ boardId: string; columns: BoardColumn[] }> {
    const response = await api.get(apiRoutes.WORKSPACES.BOARD(workspaceId));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = normalizeResponseData<any>(response);
    const board = Array.isArray(data) ? data[0] : data;

    if (!board) {
      throw new Error("Board not found for this workspace");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const columns = (board.columns || []).map((col: any) => ({
      ...col,
      id: col._id ?? col.id,
    }));

    return {
      boardId: board._id,
      columns,
    };
  },

  async createColumn(workspaceId: string, input: CreateColumnDto): Promise<Board> {
    const response = await api.post(apiRoutes.WORKSPACES.BOARD_COLUMNS(workspaceId), input);
    return normalizeResponseData<Board>(response);
  },

  async renameColumn(workspaceId: string, columnId: string, input: UpdateColumnDto): Promise<BoardColumn> {
    const response = await api.patch(apiRoutes.WORKSPACES.BOARD_COLUMN(workspaceId, columnId), input);
    return normalizeResponseData<BoardColumn>(response);
  },

  async deleteColumn(workspaceId: string, columnId: string, input?: DeleteColumnDto): Promise<void> {
    await api.delete(apiRoutes.WORKSPACES.BOARD_COLUMN(workspaceId, columnId), { data: input });
  },

  async moveColumn(workspaceId: string, columnId: string, input: MoveColumnDto): Promise<void> {
    await api.patch(apiRoutes.WORKSPACES.BOARD_COLUMN_MOVE(workspaceId, columnId), input);
  },
};
