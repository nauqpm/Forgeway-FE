/**
 * Remove Vietnamese diacritics and convert a string into a slug-friendly URL form
 * @param str String to process
 * @returns Normalized string with diacritics removed
 */
export function removeVietnameseTones(str: string): string {
    return str
        .normalize('NFD')                          // Separate diacritics from characters (VD: "á" → "a + ´")
        .replace(/[\u0300-\u036f]/g, '')           // Remove tone marks
        .replace(/[đĐ]/g, 'd')                     // Convert đ and Đ to d
        .replace(/[^a-zA-Z0-9\s-]/g, '')           // Remove special characters except letters, numbers, spaces, and hyphens
        .trim()                                    // Trim leading and trailing spaces
        .replace(/\s+/g, '-')                      // Replace spaces between words with hyphens
        .toLowerCase();                            // Convert the whole string to lowercase
}
