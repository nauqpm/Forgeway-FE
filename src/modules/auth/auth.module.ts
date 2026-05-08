// =============================================================================
// AUTH MODULE — Barrel exports
// =============================================================================
// Central export point for the entire auth module.

// ── Guards ────────────────────────────────────────────────────────────────────
export { default as AuthGuard } from './guards/AuthGuard';
export { default as GuestGuard } from './guards/GuestGuard';
export { default as PermissionGuard } from './guards/PermissionGuard';
export { default as SpacePermissionGuard } from './guards/SpacePermissionGuard';

// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useAuth } from './hooks/useAuth';
export { useMfa } from './hooks/useMfa';
export { usePermission } from './hooks/usePermission';
export { useSessionTimeout } from './hooks/useSessionTimeout';
export { useTimezone } from './hooks/useTimezone';
export { usePasswordReset } from './hooks/usePasswordReset';

// ── Stores ────────────────────────────────────────────────────────────────────
export { useAuthStore } from './stores/authStore';
export { useMfaStore } from './stores/mfaStore';
export { usePermissionStore } from './stores/permissionStore';
export { useSessionStore } from './stores/sessionStore';
export { useSecurityStore } from './stores/securityStore';
export { useTimezoneStore } from './stores/timezoneStore';

// ── Components ────────────────────────────────────────────────────────────────
export { default as LoginForm } from './components/forms/LoginForm';
export { default as RegisterForm } from './components/forms/RegisterForm';
export { default as ForgotPassword } from './components/forms/ForgotPassword';
export { default as ResetPassword } from './components/forms/ResetPassword';
export { default as MfaVerificationForm } from './components/mfa/MfaVerificationForm';
export { default as MfaSetupForm } from './components/mfa/MfaSetupForm';
export { default as PasswordPolicyChecklist } from './components/security/PasswordPolicyChecklist';
export { default as LockoutAlert } from './components/security/LockoutAlert';
export { default as SessionExpiredModal } from './components/session/SessionExpiredModal';
export { default as SessionList } from './components/session/SessionList';
export { default as TimezoneSetting } from './components/settings/TimezoneSetting';

// ── Services ──────────────────────────────────────────────────────────────────
export { setupAuthInterceptors } from './services/axiosAuthInterceptor';
export { initiateGoogleLogin } from './services/ssoService';

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  User,
  AuthUser,
  UserRole,
  LoginRequest,
  LoginResponse,
  Permission,
  SpacePermissions,
  SpaceRoleName,
  MfaMethod,
  Session,
  LockoutInfo,
  TimezonePreference,
  PasswordPolicyResult,
} from './types/auth.types';
export { AuthErrorCode } from './types/auth.types';

// ── Constants ─────────────────────────────────────────────────────────────────
export { AUTH_ROUTES } from './constants/auth-routes';
export { AUTH_ERROR_CODES } from './constants/auth-error-codes';
export { PASSWORD_POLICY } from './constants/password-policy';
