# Masari deployment

The repository builds a static React client and a separate Express API. Nothing is deployed by `npm run build`.

## Runtime and install

Use Node.js 22.12 or newer, with the same major version in development and hosting.
From the repository root, run `npm ci`, `npm ci --prefix client`, and `npm ci --prefix server`.
Run `npm run check` before releasing. Database concurrency tests need an isolated database through `TEST_DATABASE_URL`; never use the shared production database.

## Frontend host

- Project/root directory: `client`.
- Install: `npm ci`.
- Build: `npm run build`.
- Output directory: `dist`.
- Configure `VITE_API_URL=https://YOUR_API_HOST/api`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY` before building.
- Use HTTPS URLs in production. These values are public and embedded at build time; do not put server credentials here.
- Configure SPA fallback: unknown application paths such as `/chat`, `/grades`, and `/progress` must serve `index.html`. Existing static assets must be served normally.
- Revalidate `index.html` on each deployment. Hashed assets may be cached immutably. Retain old hashed assets briefly if the host supports it so existing tabs can load lazy pages.

The old `VITE_USE_MOCK_LEARNING` switch has been removed; frontend screens always use the API.

## API host

- Project/root directory: `server`.
- Install: `npm ci --omit=dev`.
- Start: `npm start`.
- Configure the host-provided `PORT`, `NODE_ENV=production`, `CLIENT_URL=https://YOUR_FRONTEND_HOST` (exact origin without trailing slash), and the Supabase URL, publishable key, and server secret key.
- Set `LLM_PROVIDER=gemini`, `LLM_MODEL` to a model available to your account, `LLM_API_KEY`, `AI_TIMEOUT_MS=30000`, and `AI_MAX_CONCURRENT=2` initially.
- If the legacy `CHAT_DEMO_ENABLED` variable exists, keep it `false`. The demo reply route has been removed.
- Health path: `/api/health`. This is liveness only, not proof that Supabase or Gemini is available.
- The host must allow outbound HTTPS to Supabase and Gemini and permit requests lasting longer than `AI_TIMEOUT_MS`.
- Graceful shutdown allows active requests to finish, up to 55 seconds; configure a suitable host termination grace period.

Chat rate limits and AI concurrency are per process. Begin with one API instance. Shared limits and cross-instance AI deduplication are needed before horizontal scaling. Ten simultaneous users are not a guarantee of ten simultaneous AI generations.

## Supabase

Set the production Site URL and allowed Auth redirect URLs. Preserve Row Level Security and the migration history.
Review `npx supabase migration list` and `npx supabase db push --dry-run --include-all` before applying pending migrations. Do not reset a shared database or mark migrations applied without verifying their effects.

## Final production acceptance

After deployment, check registration/login, profile editing, assessment, plan creation, practice/progress, chat retries, task suggestions, and grade editing through the public URL. Check direct navigation to protected routes and two-account ownership boundaries. Verify provider quota and realistic concurrent use. Local builds and offline tests do not replace these checks.

## Troubleshooting local review environments

If a restricted Windows process runner blocks child processes with `spawn EPERM`, use `npm test --prefix server -- --pool=threads` and `npm run build --prefix client -- --configLoader native`. These are runner options, not changes to application behavior.
