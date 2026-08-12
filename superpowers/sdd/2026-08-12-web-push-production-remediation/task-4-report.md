# Task 4 Report: Preserve Push-binding privacy during logout

## Status

DONE

## Commit

`240d554 fix: preserve push privacy during logout`

## TDD evidence

- RED: `npx vitest run src/modules/auth/shared/services/logout-with-push-cleanup.spec.ts` failed as expected because `./logout-with-push-cleanup` did not yet exist.
- GREEN: the same command passed after implementation: 1 file, 4 tests.

## Verification

- `npx vitest run src/modules/auth/shared/services/logout-with-push-cleanup.spec.ts src/modules/notifications/services/browser-push.service.spec.ts src/modules/notifications/services/account-switcher-push-lifecycle.spec.ts` — passed: 3 files, 13 tests.
- `npx eslint src/modules/auth/shared/hooks/useAuth.ts src/modules/auth/shared/services/logout-with-push-cleanup.ts src/modules/auth/shared/services/logout-with-push-cleanup.spec.ts` — passed.
- `npm run build` — passed (Next.js production build). The project build configuration reports that type validation and linting are skipped; the focused ESLint command above was run separately.

## Files changed

- `src/modules/auth/shared/hooks/useAuth.ts`
- `src/modules/auth/shared/services/logout-with-push-cleanup.ts`
- `src/modules/auth/shared/services/logout-with-push-cleanup.spec.ts`
- `superpowers/sdd/2026-08-12-web-push-production-remediation/task-4-report.md`

## Result

- Ordinary logout now requires successful Browser Push Backend deregistration before it invokes `logoutAPI`.
- A deregistration failure preserves local authentication state and route, then shows: `Could not sign out securely because this browser is still registered for notifications. Please try again.`
- Successful logout clears local auth state and redirects to the login route.

## Concerns

None. Existing no-subscription and unsupported-browser behavior remains successful through `deregisterBrowserPushForLogout()`.
