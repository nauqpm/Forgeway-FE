import { isToday, isYesterday, format } from 'date-fns';

export function formatLastSeen(isoString: string | null): string {
  if (!isoString) return 'Offline';

  const date = new Date(isoString);
  
  if (isNaN(date.getTime())) {
    return 'Offline';
  }

  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);

  if (diffInMinutes < 1) {
    return 'Active just now';
  }

  if (diffInMinutes < 60) {
    return `Active ${diffInMinutes}m ago`;
  }

  if (isToday(date)) {
    return `Active today at ${format(date, 'HH:mm')}`;
  }

  if (isYesterday(date)) {
    return `Active yesterday at ${format(date, 'HH:mm')}`;
  }

  return `Active ${format(date, 'MMM d, yyyy')}`;
}
