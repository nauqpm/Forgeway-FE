/**
 * Task Service - Unified API for task operations
 * 
 * This file re-exports from the modularized task services:
 * - taskTypes.ts: Type definitions
 * - taskNormalizer.ts: Response transformation utilities
 * - taskQueries.ts: Read operations
 * - taskMutations.ts: Write operations
 * 
 * Originally 667 lines, now split into focused modules.
 */

// Re-export types
export type {
  TaskDto,
  TaskUserDto,
  TaskSprintDto,
  TaskBoardDto,
  CreateTaskInput,
  ReorderTaskInput,
  TaskActivity,
  TaskComment,
  PaginatedActivitiesResponse,
  PaginatedTasksResponse,
} from "./taskTypes";

// Re-export normalizer utilities
export {
  normalizeResponseData,
  normalizeValue,
  toArray,
  normalizeArray,
  toColumnId,
  toUiLabel,
  toTaskLabel,
  toTaskLabels,
  requireTaskKey,
  requireTaskId,
  toIssue,
  toTaskDetail,
  formatAssignee,
  toCreatePayload,
  toUpdatePayload,
} from "./taskNormalizer";

// Re-export query functions
export { buildTaskQuery } from "./taskQueries";
export {
  getBoardTasks,
  getBoardTaskDetail,
  getTaskActivities,
  getArchivedTasks,
  getComments,
} from "./taskQueries";

// Re-export mutation functions
export {
  createBoardTask,
  updateBoardTask,
  moveBoardTask,
  reorderBoardTask,
  deleteBoardTask,
  archiveBoardTask,
  restoreBoardTask,
  replaceTaskLabels,
  createComment,
  updateComment,
  deleteComment,
} from "./taskMutations";

// Legacy re-export for backward compatibility
// Components importing from taskService.ts will still work
export * from "./taskQueries";
export * from "./taskMutations";

// Task service object (legacy interface for components using taskService.xxx)
import * as taskQueries from "./taskQueries";
import * as taskMutations from "./taskMutations";

export const taskService = {
  // Board tasks
  getBoardTasks: taskQueries.getBoardTasks,
  listBoardTasks: taskQueries.getBoardTasks,
  getBoardTaskDetail: taskQueries.getBoardTaskDetail,
  createBoardTask: taskMutations.createBoardTask,
  updateBoardTask: taskMutations.updateBoardTask,
  moveBoardTask: taskMutations.moveBoardTask,
  reorderBoardTask: taskMutations.reorderBoardTask,
  deleteBoardTask: taskMutations.deleteBoardTask,
  archiveBoardTask: taskMutations.archiveBoardTask,
  restoreBoardTask: taskMutations.restoreBoardTask,
  
  // Labels
  replaceTaskLabels: taskMutations.replaceTaskLabels,
  
  // Activities
  getTaskActivities: taskQueries.getTaskActivities,
  
  // Archived tasks
  getArchivedTasks: taskQueries.getArchivedTasks,
  
  // Comments
  getComments: taskQueries.getComments,
  createComment: taskMutations.createComment,
  updateComment: taskMutations.updateComment,
  deleteComment: taskMutations.deleteComment,
  
  // Utility
  buildTaskQuery: taskQueries.buildTaskQuery,
};
