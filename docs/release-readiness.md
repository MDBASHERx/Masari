# Release readiness review — 2026-09-30

Reviewed the merged application at baseline commit `5bc5579` and applied local cleanup. No commit, push, deployment, database migration, or paid AI request was performed during this review. Existing `.env` files and the two untracked earlier evaluation reports were preserved.

## Changes

- Fixed duplicate chat POST registration that allowed requests to bypass rate limiting.
- Removed the development demo-reply endpoint, temporary account-check screen, duplicate health messages, unused service wrappers, and frontend mock data/branches.
- Retained migrations, SQL tests, evaluation history, and the server mock provider used by deterministic tests.
- Added a Masari home navigation screen with sign-out, corrected branding, and localized conversation-mode controls.
- Added lazy route loading, build-time public environment validation, and safer login redirects.
- Cancelled obsolete conversation message loads, reconciled already-saved replies with pending state, and prevented overlapping retries within one conversation.
- Added graceful API shutdown and restricted provider error logging to status information.
- Added focused regression tests for chat rate limits, AI capacity, production configuration, and grade update validation/ownership filters.

## Verified locally

- Frontend ESLint: passed.
- Backend Vitest with `--pool=threads`: 128 passed, 3 skipped.
- Frontend production build with `--configLoader native`: passed after the visual refresh; entry JavaScript approximately 490.80 kB before compression. Pages are separate lazy chunks; no oversized-chunk warning.
- `git diff --check`: passed.
- Browser smoke test: Arabic login page renders with Masari branding and protected home redirects to login when unauthenticated. Authenticated home, grades, progress, learning plan, careers, and chat were reviewed without writing records. The refreshed home and chat fit a 360px viewport without horizontal overflow; the background pause control works.
- Visual refresh: shared navigation, pastel theme, original SVG study illustration, section cards, decorative floating icons/bubbles, and reduced-motion support. No new dependencies.

This Windows execution environment denied subprocess spawning for the default Vitest pool and Vite config loader. The alternate documented options completed successfully. Git branch creation was also denied, so changes remain uncommitted on the existing local branch.

## Still external to local build readiness

- Three SQL concurrency tests require an isolated database (`TEST_DATABASE_URL`); none were run against the shared database.
- Full write-flow acceptance after cleanup, real provider quota/load behavior, and ten-user load capacity are not established by the offline suite. Browser checks in this review were read-only.
- Set real HTTPS production URLs before the final hosted build; the local build uses local frontend environment configuration.
- Apply any pending migrations through the team's reviewed process; no database schema was changed in this cleanup.
- Deploy and perform the public-URL checks in [deployment.md](deployment.md).

## Masari naming

The display name is Masari (مساري). npm package names are `masari`, `masari-client`, and `masari-server`. Existing database migration/function names, browser storage keys, and the local Supabase `project_id` retain their legacy identifiers to preserve data and local development state. Repository rename and pull request publication are tracked separately from local file changes.
