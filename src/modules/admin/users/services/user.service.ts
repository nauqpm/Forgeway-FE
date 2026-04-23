import { Post } from "@/modules/client/post/models/post.model";
import { User, UserAddress, UserSettings } from "../models/user.model";

const BASE_API = process.env.NEXT_PUBLIC_API_URL!;
const USER_API = `${BASE_API}/users`;
const AUTH_API = `${BASE_API}/auth`;
const IMAGE_UPLOAD_API = `${BASE_API}/images/upload`;
const POST_API = `${BASE_API}/postapi`;

// 🔄 Hàm helper xử lý phản hồi từ API
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Lỗi khi xử lý yêu cầu");
  }
  return response.json();
};

// 🔄 Hàm helper tạo các options cho fetch
const fetchOptions = (method: string, data?: any) => {
  // 📌 Lấy token từ localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  return {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  };
};

// 📦 Service xử lý các thao tác với API người dùng
export const UserService = {
  // 📌 Lấy thông tin người dùng hiện tại
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await fetch(`${AUTH_API}/me`, fetchOptions('GET'));
      return handleResponse(response);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      throw error;
    }
  },

  // 📌 Cập nhật thông tin người dùng
  updateUserInfo: async (userData: Partial<User>): Promise<User> => {
    try {
      const response = await fetch(`${AUTH_API}/update`, fetchOptions('PUT', userData));

      // Xử lý trường hợp lỗi từ API
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Lỗi khi cập nhật thông tin người dùng");
      }

      return handleResponse(response);
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin người dùng:", error);
      throw error;
    }
  },

  // 📌 Thay đổi mật khẩu
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    try {
      const response = await fetch(
        `${AUTH_API}/change-password`,
        fetchOptions('POST', { currentPassword, newPassword })
      );

      // Xử lý trường hợp lỗi từ API
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Lỗi khi thay đổi mật khẩu");
      }

      return handleResponse(response);
    } catch (error) {
      console.error("Lỗi khi thay đổi mật khẩu:", error);
      throw error;
    }
  },

  // 📌 Upload avatar
  uploadAvatar: async (file: File): Promise<{ url: string }> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      // 📌 Lấy token từ localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const response = await fetch(IMAGE_UPLOAD_API, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const result = await handleResponse(response);
      if (!result.imageUrl) throw new Error("Không tìm thấy URL ảnh");

      return { url: result.imageUrl };
    } catch (error) {
      console.error("Lỗi khi upload avatar:", error);
      throw error;
    }
  },

  // 📌 Lấy danh sách địa chỉ của người dùng
  // getUserAddresses: async (): Promise<UserAddress[]> => {
  //   try {
  //     const response = await fetch(`${USER_API}/addresses`, fetchOptions('GET'));
  //     return handleResponse(response);
  //   } catch (error) {
  //     console.error("Lỗi khi lấy danh sách địa chỉ:", error);
  //     throw error;
  //   }
  // },

  // 📌 Thêm địa chỉ mới
  // addAddress: async (address: Omit<UserAddress, 'id'>): Promise<UserAddress> => {
  //   try {
  //     const response = await fetch(`${USER_API}/addresses`, fetchOptions('POST', address));
  //     return handleResponse(response);
  //   } catch (error) {
  //     console.error("Lỗi khi thêm địa chỉ mới:", error);
  //     throw error;
  //   }
  // },

  // 📌 Cập nhật địa chỉ
  // updateAddress: async (id: string, address: Partial<UserAddress>): Promise<UserAddress> => {
  //   try {
  //     const response = await fetch(
  //       `${USER_API}/addresses/${id}`,
  //       fetchOptions('PUT', address)
  //     );
  //     return handleResponse(response);
  //   } catch (error) {
  //     console.error(`Lỗi khi cập nhật địa chỉ ${id}:`, error);
  //     throw error;
  //   }
  // },

  // 📌 Xóa địa chỉ
  // deleteAddress: async (id: string): Promise<void> => {
  //   try {
  //     const response = await fetch(
  //       `${USER_API}/addresses/${id}`,
  //       fetchOptions('DELETE')
  //     );
  //     await handleResponse(response);
  //   } catch (error) {
  //     console.error(`Lỗi khi xóa địa chỉ ${id}:`, error);
  //     throw error;
  //   }
  // },

  // 📌 Đặt địa chỉ mặc định
  // setDefaultAddress: async (id: string): Promise<UserAddress> => {
  //   try {
  //     const response = await fetch(
  //       `${USER_API}/addresses/${id}/default`,
  //       fetchOptions('PUT')
  //     );
  //     return handleResponse(response);
  //   } catch (error) {
  //     console.error(`Lỗi khi đặt địa chỉ ${id} làm mặc định:`, error);
  //     throw error;
  //   }
  // },

  // 📌 Lấy cài đặt người dùng
  getUserSettings: async (): Promise<UserSettings> => {
    try {
      // Lấy dữ liệu từ localStorage thay vì gọi API
      const storedSettings = localStorage.getItem('user-settings');

      // Nếu đã có dữ liệu, trả về dữ liệu đó
      if (storedSettings) {
        return JSON.parse(storedSettings);
      }

      // Nếu chưa có, tạo cài đặt mặc định
      const defaultSettings: UserSettings = {
        id: 'local-settings',
        userId: typeof window !== 'undefined' && localStorage.getItem('userId') || 'guest',
        theme: 'light',
        language: 'vi',
        notifications: {
          email: true,
          push: true,
          orderUpdates: true,
          marketing: false,
        },
        subscriptions: {
          newsletter: true,
          promotions: false,
          specialOffers: true,
          birthdaySpecial: true,
        }
      };

      // Lưu cài đặt mặc định vào localStorage
      localStorage.setItem('user-settings', JSON.stringify(defaultSettings));

      return defaultSettings;
    } catch (error) {
      console.error("Lỗi khi lấy cài đặt người dùng:", error);
      throw error;
    }
  },

  // 📌 Cập nhật cài đặt người dùng
  updateUserSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    try {
      // Lấy cài đặt hiện tại từ localStorage
      const storedSettings = localStorage.getItem('user-settings');
      let currentSettings: UserSettings;

      if (storedSettings) {
        currentSettings = JSON.parse(storedSettings);
      } else {
        // Nếu chưa có, khởi tạo mặc định
        currentSettings = await UserService.getUserSettings();
      }

      // Cập nhật cài đặt
      const updatedSettings: UserSettings = {
        ...currentSettings,
        ...settings,
        notifications: {
          ...currentSettings.notifications,
          ...(settings.notifications || {})
        },
        subscriptions: {
          ...currentSettings.subscriptions,
          ...(settings.subscriptions || {})
        }
      };

      // Lưu cài đặt mới vào localStorage
      localStorage.setItem('user-settings', JSON.stringify(updatedSettings));

      return updatedSettings;
    } catch (error) {
      console.error("Lỗi khi cập nhật cài đặt người dùng:", error);
      throw error;
    }
  },

  // 📌 Xóa người dùng
  deleteUser: async (userId: string): Promise<void> => {
    try {
      const response = await fetch(
        `${USER_API}/${userId}`,
        fetchOptions('DELETE')
      );
      await handleResponse(response);
    } catch (error) {
      console.error(`Lỗi khi xóa người dùng ${userId}:`, error);
      throw error;
    }
  },

  // 📌 Lấy danh sách bài viết của người dùng
  getMyPosts: async (
    page = 1,
    limit = 10,
    userId: string
  ): Promise<{ data: Post[]; total: number }> => {
    const response = await fetch(
      `${POST_API}/my-posts?page=${page}&limit=${limit}&userId=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    return handleResponse(response);
  },

  // 📌 Chuyển tất cả bài viết từ một user sang user khác
  transferAllPosts: async (fromUserId: string, toUserId: string): Promise<any> => {
    try {
      const response = await fetch(
        `${POST_API}/transfer-all`,
        fetchOptions('POST', { fromUserId, toUserId })
      );
      return handleResponse(response);
    } catch (error) {
      console.error("Lỗi khi chuyển tất cả bài viết:", error);
      throw error;
    }
  },

  // 📌 Chuyển các bài viết được chọn từ một user sang user khác
  transferSelectedPosts: async (fromUserId: string, toUserId: string, postIds: string[]): Promise<any> => {
    try {
      const response = await fetch(
        `${POST_API}/transfer-selected`,
        fetchOptions('POST', { fromUserId, toUserId, postIds })
      );
      return handleResponse(response);
    } catch (error) {
      console.error("Lỗi khi chuyển bài viết đã chọn:", error);
      throw error;
    }
  },

  // 📌 Lấy danh sách tất cả người dùng
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await fetch(`${USER_API}`, fetchOptions('GET'));
      return handleResponse(response);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
      throw error;
    }
  },
};