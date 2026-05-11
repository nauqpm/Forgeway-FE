export const parseJQL = (query: string) => {
  const filters: Record<string, string> = {};
  const regex = /(assignee|status|priority):("([^"]+)"|([^\s]+))/g;
  let match;
  
  while ((match = regex.exec(query)) !== null) {
    const key = match[1];
    const value = match[3] || match[4]; // Match string có ngoặc kép hoặc không
    filters[key] = value;
  }
  
  // Phần text không match regex sẽ là text search thông thường
  const textSearch = query.replace(regex, '').trim();
  
  return { filters, textSearch };
};
