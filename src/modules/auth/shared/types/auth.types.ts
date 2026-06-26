// =============================================================================
// AUTH MODULE — TYPE DEFINITIONS
// =============================================================================

// ─── User & Roles ────────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'user';

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
  workspaceRoles?: WorkspaceRole[];
  spaceRoles?: WorkspaceRole[];
}

// ─── Login / Register ────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
  // rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  /** True when the backend requires MFA before issuing a session */
  mfaRequired?: boolean;
  /** Temporary token used to verify MFA */
  mfaToken?: string;
  /** MFA method required by the backend */
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
  success: boolean;
  message: string;
  email: string;
  user?: Pick<User, 'id' | 'email' | 'fullName'>;
}

// ─── Token ───────────────────────────────────────────────────────────────────

/** Access and refresh tokens are both set by the backend through httpOnly cookies */
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
  /** Backend sets a new cookie; the response only confirms success */
  expiresAt?: number;
}

// ─── Password ────────────────────────────────────────────────────────────────

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordByGrantRequest {
  resetGrant: string;
  newPassword: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpResponse extends PasswordResetResponse {
  resetGrant: string;
  expiresIn: number;
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

export interface Permission {
  id?: string;
  resource: string;
  action: string;
}

export type WorkspaceRoleName = 'space_admin' | 'member' | 'viewer';

export interface WorkspaceRole {
  workspaceId?: string;
  spaceId?: string;
  workspaceName?: string;
  spaceName?: string;
  role: WorkspaceRoleName;
}

export interface WorkspacePermissions {
  workspaceId?: string;
  spaceId?: string;
  role: WorkspaceRoleName;
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
  locale: string; // e.g. 'en-US'
  dateFormat?: string; // e.g. 'DD/MM/YYYY'
}

// ─── Security / Lockout ──────────────────────────────────────────────────────

export interface LoginRetryDetails {
  retryAfterSeconds: number;
  retryAt: string;
}

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  LOGIN_RETRY_LATER = 'LOGIN_RETRY_LATER',
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
