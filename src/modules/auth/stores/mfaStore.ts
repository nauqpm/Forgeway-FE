import { create } from 'zustand';
import type { MfaMethod, MfaSetupResponse } from '../types/auth.types';

// ─── MFA Store ───────────────────────────────────────────────────────────────
// Holds transient MFA challenge state (between login and MFA verification)
// and setup state (when user is configuring MFA).

interface MfaState {
  /** True when backend responds with mfaRequired after login */
  mfaRequired: boolean;
  /** Temporary token received from login, used to verify MFA */
  mfaToken: string | null;
  /** Method backend requires */
  method: MfaMethod | null;
  /** Setup data when configuring TOTP (QR code, secret, backup codes) */
  setupData: MfaSetupResponse | null;
}

interface MfaActions {
  setMfaChallenge: (mfaToken: string, method: MfaMethod) => void;
  setMfaSetup: (data: MfaSetupResponse) => void;
  clearMfa: () => void;
}

export const useMfaStore = create<MfaState & MfaActions>((set) => ({
  // ── State ──
  mfaRequired: false,
  mfaToken: null,
  method: null,
  setupData: null,

  // ── Actions ──
  setMfaChallenge: (mfaToken, method) =>
    set({ mfaRequired: true, mfaToken, method }),

  setMfaSetup: (setupData) =>
    set({ setupData }),

  clearMfa: () =>
    set({
      mfaRequired: false,
      mfaToken: null,
      method: null,
      setupData: null,
    }),
}));