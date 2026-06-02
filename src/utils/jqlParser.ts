export const parseJQL = (query: string) => {
  const filters: Record<string, string> = {};
  const regex = /(assignee|status|priority):("([^"]+)"|([^\s]+))/g;
  let match;
  
  while ((match = regex.exec(query)) !== null) {
    const key = match[1];
    const value = match[3] || match[4]; // Match quoted or unquoted strings
    filters[key] = value;
  }
  
  // Text that does not match the regex is treated as normal search text
  const textSearch = query.replace(regex, '').trim();
  
  return { filters, textSearch };
};
