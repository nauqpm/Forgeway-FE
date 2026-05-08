export interface IUser {
  id?: string;
  email: string;
  fullName?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  role?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUserUpdate {
  fullName?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
} 