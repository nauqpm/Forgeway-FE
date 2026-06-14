// Centralized URL for the admin app (separate frontend on a different origin).
// Falls back to localhost:5173 in dev, production uses env var or public domain.

const ENV_ADMIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL?.trim() ||
  process.env.NEXT_PUBLIC_ADMIN_BASE_URL?.trim() ||
  "";

const DEV_DEFAULT = "http://localhost:5173";
const PROD_DEFAULT = "https://admin-sdlc-platform.automationland.vn";

export const ADMIN_URL: string =
  ENV_ADMIN_URL ||
  (process.env.NODE_ENV === "production" ? PROD_DEFAULT : DEV_DEFAULT);

export const IS_SUPER_ADMIN = (role: string | null | undefined): boolean =>
  role === "super_admin";
