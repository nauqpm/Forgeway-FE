export interface AppUserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  birthday?: string;
  gender?: "male" | "female" | "other";
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  address?: string;
  birthday?: string;
  gender?: "male" | "female" | "other";
  avatar?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  password: string;
}
