/**
 * Hàm xóa dấu tiếng Việt và chuyển chuỗi thành dạng slug-friendly (thân thiện URL)
 * @param str Chuỗi cần xử lý
 * @returns Chuỗi đã loại bỏ dấu và chuẩn hóa
 */
export function removeVietnameseTones(str: string): string {
    return str
        .normalize('NFD')                          // Tách dấu ra khỏi ký tự (VD: "á" → "a + ´")
        .replace(/[\u0300-\u036f]/g, '')           // Xóa các dấu thanh (dấu sắc, huyền, hỏi, ngã, nặng)
        .replace(/[đĐ]/g, 'd')                     // Chuyển đ và Đ thành d
        .replace(/[^a-zA-Z0-9\s-]/g, '')           // Loại bỏ ký tự đặc biệt (ngoài chữ, số, khoảng trắng, "-")
        .trim()                                    // Xóa khoảng trắng đầu và cuối chuỗi
        .replace(/\s+/g, '-')                      // Thay thế khoảng trắng giữa các từ bằng dấu gạch ngang "-"
        .toLowerCase();                            // Chuyển toàn bộ chuỗi về chữ thường
}
