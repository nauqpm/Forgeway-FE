import { Province, District, Ward } from "@/common/services/locationService";
export const removeVietnameseDiacritics = (text: string) => {
  return text
        .toLowerCase()
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/[^\w\-]+/g, '') // Remove special characters
        .replace(/\-\-+/g, '-')   // Replace repeated hyphens with one hyphen
        .replace(/^-+/, '')       // Trim leading hyphens
        .replace(/-+$/, '');      // Trim trailing hyphens
};
export const findBestMatch = <T extends { name: string; code: number }>(
  items: T[],
  searchText: string
): T | null => {
  if (!items.length || !searchText) return null;

  // Handle special cases
  // Handle Ho Chi Minh City
  if (searchText.match(/hồ chí minh|ho chi minh|hcm|tp.hcm|tphcm/i)) {
    const hcm = items.find(
      (item) =>
        item.name.toLowerCase().includes("hồ chí minh") ||
        removeVietnameseDiacritics(item.name.toLowerCase()).includes("ho chi minh")
    );
    if (hcm) return hcm;
  }

  // Handle Tan Phu district
  if (searchText.match(/tân phú|tan phu/i)) {
    const tanPhu = items.find(
      (item) =>
        item.name.toLowerCase().includes("tân phú") ||
        removeVietnameseDiacritics(item.name.toLowerCase()).includes("tan phu")
    );
    if (tanPhu) return tanPhu;
  }

  // Handle Tan Thanh ward
  if (searchText.match(/tân thành|tan thanh/i)) {
    const tanThanh = items.find(
      (item) =>
        item.name.toLowerCase().includes("tân thành") ||
        removeVietnameseDiacritics(item.name.toLowerCase()).includes("tan thanh")
    );
    if (tanThanh) return tanThanh;
  }

  // Convert searchText to lowercase without diacritics
  const searchTextNormalized = removeVietnameseDiacritics(searchText.toLowerCase());

  // Try exact search first
  let bestMatch = items.find(
    (item) =>
      removeVietnameseDiacritics(item.name.toLowerCase()) === searchTextNormalized
  );

  // If no exact result is found, try approximate matching
  if (!bestMatch) {
    const itemsWithScores = items.map((item) => {
      const itemName = removeVietnameseDiacritics(item.name.toLowerCase());
      const containsSearch = itemName.includes(searchTextNormalized);
      const searchContainsItem = searchTextNormalized.includes(itemName);

      let score = 0;
      if (containsSearch) score += 3;
      if (searchContainsItem) score += 2;

      const searchWords = searchTextNormalized.split(/\s+/);
      const itemWords = itemName.split(/\s+/);

      for (const searchWord of searchWords) {
        if (searchWord.length < 2) continue;
        for (const itemWord of itemWords) {
          if (itemWord.length < 2) continue;
          if (
            itemWord === searchWord ||
            itemWord.includes(searchWord) ||
            searchWord.includes(itemWord)
          ) {
            score += 1;
          }
        }
      }

      return { item, score };
    });

    itemsWithScores.sort((a, b) => b.score - a.score);

    if (itemsWithScores.length > 0 && itemsWithScores[0].score > 0) {
      bestMatch = itemsWithScores[0].item;
    }
  }

  return bestMatch || null;
};

export const getLocationName = (
  code: string | number,
  items: Array<Province | District | Ward>,
  defaultText: string
): string => {
  if (!code) return defaultText;
  const item = items.find((item) => item.code === code);
  return item ? item.name : defaultText;
};