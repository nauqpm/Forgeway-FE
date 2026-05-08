// 📝 Model người dùng dựa trên schema từ backend

// 🧍 Interface cho thông tin người dùng
export interface User {
  id?: string;
  email: string;
  role: string;
  status: string;
  fullName?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  birthday?: string;
  gender?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 📝 Interface cho danh sách địa chỉ của người dùng
export interface UserAddress {
  id: string;
  name: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  address: string;
  isDefault: boolean;
}

// 📝 Interface cho cài đặt tài khoản
export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: 'vi' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    orderUpdates: boolean;
    marketing: boolean;
  };
  subscriptions: {
    newsletter: boolean;
    promotions: boolean;
    specialOffers: boolean;
    birthdaySpecial: boolean;
  };
} 