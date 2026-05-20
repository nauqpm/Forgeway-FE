export type CalendarViewType = 'dayGridMonth' | 'dayGridWeek';

export interface CalendarFilters {
  search: string;
  assignees: string[];
  types: string[];
  statuses: string[];
}
