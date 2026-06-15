import api from '@/lib/axiosIns';
import { apiRoutes } from '@/config/apiRoutes';
import { Issue } from '../types/issue.type';

export interface CalendarTasksResponse {
  tasks: Issue[];
}

function normalizePayload<T>(payload: unknown): T {
  const p = payload as any;
  return (p?.data?.data ?? p?.data ?? p) as T;
}

export const calendarService = {
  /**
   * Fetch tasks visible on the calendar for the given month.
   * The backend returns tasks whose startDate or dueDate falls within
   * [firstDayOfMonth − 7d, lastDayOfMonth + 7d].
   */
  async getCalendarTasks(workspaceId: string, year: number, month: number): Promise<CalendarTasksResponse> {
    const response = await api.get(apiRoutes.TASKS.CALENDAR(workspaceId), {
      params: { year, month },
    });
    return normalizePayload<CalendarTasksResponse>(response);
  },

  /**
   * Quick-create a task on a specific date.
   * Delegates to the standard board task creation endpoint.
   */
  async quickCreateTask(workspaceId: string, title: string, startDate: string, dueDate?: string): Promise<Issue> {
    const response = await api.post(apiRoutes.TASKS.BOARD(workspaceId), {
      title,
      type: 'task',
      priority: 'medium',
      status: 'todo',
      startDate,
      dueDate: dueDate ?? startDate,
    });
    return normalizePayload<Issue>(response);
  },
};
