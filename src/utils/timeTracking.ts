export const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  let minutes = 0;
  const regex = /(\d+)([w|d|h|m])/g;
  let match;
  while ((match = regex.exec(timeStr.toLowerCase())) !== null) {
    const val = parseInt(match[1]);
    const unit = match[2];
    if (unit === 'w') minutes += val * 5 * 8 * 60;
    if (unit === 'd') minutes += val * 8 * 60;
    if (unit === 'h') minutes += val * 60;
    if (unit === 'm') minutes += val;
  }
  return minutes;
};

export const formatMinutesToTimeString = (totalMinutes: number): string => {
  if (!totalMinutes || totalMinutes === 0) return '0m';
  const weeks = Math.floor(totalMinutes / (5 * 8 * 60));
  let remainder = totalMinutes % (5 * 8 * 60);
  const days = Math.floor(remainder / (8 * 60));
  remainder = remainder % (8 * 60);
  const hours = Math.floor(remainder / 60);
  const minutes = remainder % 60;
  
  const parts = [];
  if (weeks > 0) parts.push(`${weeks}w`);
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ');
};
