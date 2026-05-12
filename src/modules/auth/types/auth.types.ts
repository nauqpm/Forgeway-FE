// =============================================================================
// AUTH MODULE — TYPE DEFINITIONS
// =============================================================================

// ─── User & Roles ────────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'space_admin' | 'member' | 'viewer';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatar?: string;
  role: UserRole;
  timezone?: string;
  locale?: string;
  mfaEnabled?: boolean;
  ssoProvider?: SsoProvider | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthUser extends User {
  permissions: Permission[];
  spaceRoles: SpaceRole[];
}

// ─── Login / Register ────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
  // rememberMe?: boolean;
}

export interface LoginResponse {
  message: string;
  user?: AuthUser;
  /** True khi backend yêu cầu MFA trước khi cấp session */
  mfaRequired?: boolean;
  /** Temporary token dùng để verify MFA */
  mfaToken?: string;
  /** MFA method mà backend yêu cầu */
  mfaMethod?: MfaMethod;
}

export interface RegisterRequest {
  email: string;
  password: string;
  // fullName: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
  phoneNumber?: string;
}

export interface RegisterResponse {
  message: string;
  user?: Pick<User, 'id' | 'email' | 'fullName'>;
}

// ─── Token ───────────────────────────────────────────────────────────────────

/** Access token + refresh token đều được backend set qua httpOnly cookie */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp (seconds)
}

export interface DecodedToken {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
  iat: number;
}

export interface RefreshTokenResponse {
  message: string;
  /** Backend set cookie mới, response chỉ confirm success */
  expiresAt?: number;
}

// ─── Password ────────────────────────────────────────────────────────────────

export interface ForgotPasswordRequest {
  email: string;
  resetMethod: 'link' | 'otp';
}

export interface ResetPasswordByTokenRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordByOtpRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface PasswordPolicyResult {
  minLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  isValid: boolean;
}

// ─── MFA ─────────────────────────────────────────────────────────────────────

export type MfaMethod = 'totp' | 'email_otp';

export interface MfaSetupResponse {
  qrCodeUrl: string;
  secret: string;
  backupCodes: string[];
}

export interface MfaVerifyRequest {
  mfaToken: string;
  code: string;
  method: MfaMethod;
}

export interface MfaVerifyResponse {
  message: string;
  user: AuthUser;
}

// ─── SSO ─────────────────────────────────────────────────────────────────────

export type SsoProvider = 'google';

export interface SsoCallbackParams {
  code: string;
  state: string;
  provider: SsoProvider;
}

export interface SsoAuthUrlResponse {
  authUrl: string;
  state: string;
}

// ─── RBAC / Permissions ──────────────────────────────────────────────────────

export type SpaceRoleName = 'space_admin' | 'member' | 'viewer';

export interface SpaceRole {
  spaceId: string;
  spaceName?: string;
  role: SpaceRoleName;
}

export interface Permission {
  id?: string;
  resource: string;
  action: string;
}

export interface SpacePermissions {
  spaceId: string;
  role: SpaceRoleName;
  permissions: Permission[];
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  deviceInfo: string;
  browser?: string;
  os?: string;
  ipAddress: string;
  lastActiveAt: string; // ISO UTC string
  createdAt: string;
  isCurrent: boolean;
}

// ─── Timezone ────────────────────────────────────────────────────────────────

export interface TimezonePreference {
  timezone: string; // IANA timezone e.g. 'Asia/Ho_Chi_Minh'
  locale: string; // e.g. 'vi-VN'
  dateFormat?: string; // e.g. 'DD/MM/YYYY'
}

// ─── Security / Lockout ──────────────────────────────────────────────────────

export interface LockoutInfo {
  isLocked: boolean;
  lockedUntil?: string; // ISO UTC string
  remainingAttempts: number;
  maxAttempts: number;
}

// ─── Auth Error Codes ────────────────────────────────────────────────────────

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  MFA_REQUIRED = 'MFA_REQUIRED',
  MFA_INVALID_CODE = 'MFA_INVALID_CODE',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  PASSWORD_TOO_WEAK = 'PASSWORD_TOO_WEAK',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  SSO_ACCOUNT_NOT_LINKED = 'SSO_ACCOUNT_NOT_LINKED',
  RATE_LIMITED = 'RATE_LIMITED',
}

// ─── API Error ───────────────────────────────────────────────────────────────

export interface AuthApiError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, unknown>;
}