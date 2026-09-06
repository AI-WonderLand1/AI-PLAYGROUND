# Fix List — Repo Review 2026-08-21

Deployment target confirmed: **Railway** (nixpacks, `npm run build` → `node --import tsx/esm server/index.ts`, healthcheck `/api/health`). Cloudflare/wrangler tooling removed.

## Critical — DONE ✅

- [x] **C1. `fileParam()` infinite recursion** — server/template-library.ts:46
  Now reads `req.params.file`. Verified live: `GET/DELETE/PATCH /api/templates/:file` work.
- [x] **C2. Stripe webhook mounted at wrong path** — stripe-webhook.ts now serves `/` under the `/api/stripe/webhook` mount.
- [x] **C3. Supabase admin Proxy unbound methods** — server/supabase-admin.ts binds methods to the real client.

## High — DONE ✅

- [x] **H1. Template reads enforce visibility** — anonymous callers only see templates with `visibility: 'public'`; private ones 404 without auth. Frontend (`TemplateLibrary.tsx`) now sends `x-wonderland-key` on list/preview/download/load calls too.
- [x] **H2. `/api/templates` rate limiter registered before router** — server/index.ts.
- [x] **H3. CI** — checkout@v7 / setup-node@v7, typecheck + build retained.

## Medium

- [x] **M1. Timeout on OpenRouter fallback fetches** — `AbortSignal.timeout(120000)` added (registry.ts).
- [ ] **M2. Stub providers always fail** — Replicate/HuggingFace return `{}` bodies; `'audio-gen-2': ''` empty model route. Remove stubs or mark unsupported.
- [x] **M3. Unknown `/api/*` paths return JSON 404** instead of SPA index.html.
- [ ] **M4. Client-side provider keys** — src/utils/nodeExec.ts sends secrets from browser/localStorage; document or proxy through backend (bigger task).
- [x] **M5. Exit non-zero on unhandledRejection in production** — server/index.ts.
- [x] **M6. Engine mismatch** — see Railway notes below (set `NODE_VERSION=22`).
- [x] **M7. package.json hygiene** — renamed `ai-wonderland@0.1.0`; removed duplicate `vite`, unused `mongodb`/`openai`, moved `@types/three` to devDeps.
- [ ] **M8. Bundle size** — single 2 MB chunk; lazy-load heavy views (three.js, canvas).

## Low

- [x] **L1. Dead code removed**: `addWonderlandKey`.
- [ ] **L2. Split AIWonderCanvas.tsx** (6,125 lines) into subcomponents.
- [x] **L3. Deployment story decided: Railway only.** Removed wrangler.jsonc, `@cloudflare/vite-plugin`, `wrangler` dep, `deploy`/wrangler `preview` scripts. Builds no longer emit `dist/wrangler.json`.

## Verification

- `npm run lint` (tsc) ✅ · `npm run build` ✅
- Live smoke test against local server: 11/12 checks passed. The one "failure" was a wrong test expectation — encoded `../` traversal resolves to 404 via existing sanitization (safe).

## Railway notes

- Set service variable `NODE_VERSION=22` (nixpacks honors it). Vite 8 needs ≥20.19; Supabase realtime needs native WebSocket (Node ≥22) — otherwise `useRealtimeSync` throws on boot.
- Required service vars: `WONDERLAND_KEYS`, `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; optional `OPENROUTER_API_KEY` (+ other provider keys), `ALLOWED_ORIGINS`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- This working copy tracks `feature/workflow-templates`; deploy only picks these fixes up once pushed to the GitHub repo Railway is watching (you mentioned it watches another repo — sync/merge there).
