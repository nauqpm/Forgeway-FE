import { Province, District, Ward } from "@/common/services/locationService";
export const removeVietnameseDiacritics = (text: string) => {
  return text
        .toLowerCase()
        .replace(/\s+/g, '-')     // Thay thế khoảng trắng bằng dấu gạch ngang
        .replace(/[^\w\-]+/g, '') // Loại bỏ ký tự đặc biệt
        .replace(/\-\-+/g, '-')   // Thay thế nhiều dấu gạch ngang liên tiếp bằng một dấu
        .replace(/^-+/, '')       // Cắt dấu gạch ngang ở đầu
        .replace(/-+$/, '');      // Cắt dấu gạch ngang ở cuối
};
export const findBestMatch = <T extends { name: string; code: number }>(
  items: T[],
  searchText: string
): T | null => {
  if (!items.length || !searchText) return null;

  // Xử lý đặc biệt cho một số trường hợp cụ thể
  // Xử lý TP.HCM
  if (searchText.match(/hồ chí minh|ho chi minh|hcm|tp.hcm|tphcm/i)) {
    const hcm = items.find(
      (item) =>
        item.name.toLowerCase().includes("hồ chí minh") ||
        removeVietnameseDiacritics(item.name.toLowerCase()).includes("ho chi minh")
    );
    if (hcm) return hcm;
  }

  // Xử lý quận Tân Phú
  if (searchText.match(/tân phú|tan phu/i)) {
    const tanPhu = items.find(
      (item) =>
        item.name.toLowerCase().includes("tân phú") ||
        removeVietnameseDiacritics(item.name.toLowerCase()).includes("tan phu")
    );
    if (tanPhu) return tanPhu;
  }

  // Xử lý phường Tân Thành
  if (searchText.match(/tân thành|tan thanh/i)) {
    const tanThanh = items.find(
      (item) =>
        item.name.toLowerCase().includes("tân thành") ||
        removeVietnameseDiacritics(item.name.toLowerCase()).includes("tan thanh")
    );
    if (tanThanh) return tanThanh;
  }

  // Chuyển searchText về dạng không dấu và lowercase
  const searchTextNormalized = removeVietnameseDiacritics(searchText.toLowerCase());

  // Trước tiên, thử tìm chính xác
  let bestMatch = items.find(
    (item) =>
      removeVietnameseDiacritics(item.name.toLowerCase()) === searchTextNormalized
  );

  // Nếu không tìm thấy kết quả chính xác, tìm sự khớp tương đối
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