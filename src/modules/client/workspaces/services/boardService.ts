import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { Board, BoardColumn, CreateColumnDto, UpdateColumnDto, MoveColumnDto, DeleteColumnDto } from "../types/board.type";

const normalizeResponseData = <T>(payload: any): T => {
    return payload?.data?.data ?? payload?.data ?? payload;
};

export const boardService = {
    async getBoardByWorkspace(workspaceKey: string): Promise<{ boardId: string; columns: BoardColumn[] }> {
        const response = await api.get(apiRoutes.WORKSPACES.BOARD(workspaceKey));
        const data = normalizeResponseData<any>(response);
        const board = Array.isArray(data) ? data[0] : data;

        if (!board) {
            throw new Error("Board not found for this workspace");
        }

        return {
            boardId: board._id,
            columns: board.columns || [],
        };
    },

    async createColumn(workspaceKey: string, input: CreateColumnDto): Promise<Board> {
        const response = await api.post(apiRoutes.WORKSPACES.BOARD_COLUMNS(workspaceKey), input);
        return normalizeResponseData<Board>(response);
    },

    async renameColumn(workspaceKey: string, columnId: string, input: UpdateColumnDto): Promise<BoardColumn> {
        const response = await api.patch(apiRoutes.WORKSPACES.BOARD_COLUMN(workspaceKey, columnId), input);
        return normalizeResponseData<BoardColumn>(response);
    },

    async deleteColumn(workspaceKey: string, columnId: string, input?: DeleteColumnDto): Promise<void> {
        await api.delete(apiRoutes.WORKSPACES.BOARD_COLUMN(workspaceKey, columnId), { data: input });
    },

    async moveColumn(workspaceKey: string, columnId: string, input: MoveColumnDto): Promise<void> {
        await api.patch(apiRoutes.WORKSPACES.BOARD_COLUMN_MOVE(workspaceKey, columnId), input);
    },
};
