# AI-WONDERLAND Code Review

**Date**: 2025-01-15  
**Reviewer**: AI Assistant  
**Project**: AI-WONDERLAND — Multi-Agent Playground Hub  
**Stack**: React 19, Vite 8, TypeScript, Express 5, Supabase, Tailwind 4, React Three Fiber

---

## Executive Summary

Impressive multi-agent playground with 58 models across 25+ providers, real-time streaming, visual workflow canvas, and Supabase real-time sync. **Critical security issue**: Google Gemini API key exposed in client bundle. Needs production hardening (validation, rate limiting, tests, CI).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vite + React 19)               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ Playground  │ │ ModelsCatalog│ │AIWonderCanvas│ │ Sidebar   │ │
│  │  (8 agents) │ │  (58 models) │ │ (workflow)  │ │ (config)  │ │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬─────┘ │
│         │               │               │               │       │
│         └───────────────┼───────────────┼───────────────┘       │
│                         ▼               ▼                       │
│              ┌──────────────────────────────┐                   │
│              │   useRealtimeSync (Supabase) │                   │
│              │  agents | workflows | memories│                   │
│              └───────────────┬──────────────┘                   │
└──────────────────────────────┼──────────────────────────────────┘
                               │ HTTPS /api/chat, /api/chat/stream
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express 5 + tsx)                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ wonderland  │ │  Provider   │ │  Streaming  │ │  Stripe   │ │
│  │   keys      │ │  Registry   │ │   (SSE)     │ │  Webhook  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE (PostgreSQL)                    │
│  profiles │ agents │ usage_logs │ subscriptions │ memories │    │
│           │ workflows                                                           │
│  RLS on all tables • Realtime on agents/workflows/memories/usage│
└─────────────────────────────────────────────────────────────────┘
```

---

## Strengths

| Area | Details |
|------|---------|
| **Model Coverage** | 58 models: text, image, video, audio, embeddings, transcription, rerank |
| **Provider Abstraction** | 14 providers in unified registry (`server/providers/registry.ts`) with prefix-based routing |
| **Streaming** | Robust SSE with 3-tier fallback: OpenRouter → Direct Provider → Gemini SDK |
| **Multi-Agent UX** | 8 parallel agents, independent configs, per-agent streaming, 3D robot visualization |
| **Real-time Sync** | Supabase realtime on `agents`, `workflows`, `memories`, `usage_logs` |
| **Workflow Canvas** | Full visual editor: drag-drop, connections, undo/redo, auto-layout, versioning |
| **Memory System** | 6 types (decision/bug/pattern/context/file/note) with localStorage + Supabase sync |
| **Analytics** | Token usage, cost tracking, model breakdowns via `useRealtimeUsage` hook |

---

## Critical Issues (Fix Immediately)

### 🔴 1. Client-Side API Key Exposure
**File**: `src/components/Playground.tsx:369`
```typescript
const ai = new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY as any) });
```
- `process.env` is undefined in Vite client bundles
- Key would be bundled into production JS if it worked
- **Fix**: Move all LLM calls to backend proxy; remove `@google/genai` from client deps

### 🔴 2. No Request Validation on Backend
**File**: `server/index.ts:29-53`
- Raw `req.body` used without schema validation
- **Fix**: Add Zod schemas for `/api/chat` and `/api/chat/stream`

### 🔴 3. Supabase Client Created Without Validation
**File**: `src/lib/supabase.ts:3-6`
```typescript
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || ... || '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || ... || '');
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```
- Empty strings passed if env vars missing → silent failures
- **Fix**: Throw early if required vars absent

### 🔴 4. No Rate Limiting on Proxy Endpoints
- `/api/chat` and `/api/chat/stream` exposed without throttling
- **Fix**: Add `express-rate-limit` middleware

---

## High Priority Issues

### 🟡 5. Duplicate Model Route Maps
Defined in two places:
- `src/utils.ts:12` (client-side `MODEL_ROUTES`)
- `server/providers/registry.ts:227` (server-side `MODEL_ROUTES`)

**Fix**: Extract to shared package or generate from single source (`CATALOG_MODELS`)

### 🟡 6. Duplicate Model Lists
- `Sidebar.tsx:16-48` — hardcoded `MODELS` array (48 entries)
- `ModelsCatalog.tsx:33-1037` — `CATALOG_MODELS` (102 entries with full metadata)

**Fix**: Derive Sidebar models from `CATALOG_MODELS` or create minimal subset

### 🟡 7. Wide-Open CORS
**File**: `server/index.ts:15`
```typescript
app.use(cors()); // No origin restrictions
```
**Fix**: Restrict to known frontend origins

### 🟡 8. No Error Boundaries
- Zero React error boundaries in component tree
- Single component crash = full app crash

### 🟡 9. TypeScript Config Oddities
```json
{
  "experimentalDecorators": true,
  "useDefineForClassFields": false
}
```
- Decorators enabled but unused
- `noEmit: true` but build uses Vite (OK)

---

## Medium Priority

### 🟢 10. Monolithic Components
| Component | Lines | Recommendation |
|-----------|-------|----------------|
| `AIWonderCanvas.tsx` | 2000+ | Split into `WorkflowCanvas`, `NodePalette`, `NodeDetailView`, `TelemetryDrawer`, `VersionPanel` |
| `ModelsCatalog.tsx` | 1200+ | Split into `ModelGrid`, `FilterSidebar`, `ModelCard`, `ModalityTabs` |
| `Playground.tsx` | 564 | Extract `MessageList`, `InputArea`, `ModelSelector` |

### 🟢 11. Zero Tests
- No test files found (`*.test.ts`, `*.spec.ts`, `__tests__/`)
- **Add**: Vitest + React Testing Library + MSW for API mocking

### 🟢 12. No Linting/Formatting
- Only `tsc --noEmit` via `npm run lint`
- **Add**: ESLint (flat config), Prettier, `lint-staged` pre-commit

### 🟢 13. Missing CI/CD
- No `.github/workflows/` directory
- **Add**: Typecheck → Lint → Test → Build pipeline

### 🟢 14. Bundle Analysis Missing
- No `vite-plugin-analyzer` or `rollup-plugin-visualizer`
- Large deps: `@google/genai`, `@react-three/*`, `three`, `motion`, `chart` libs

### 🟢 15. Missing `.env.example`
- Referenced in README but not in repo root

---

## Low Priority / Nice-to-Have

### 🔵 16. Inconsistent State Persistence
- Memories: localStorage (500 cap) + Supabase
- Workflows: localStorage versions + Supabase
- Agents: Supabase only (via `useRealtimeSync`)
- **Consider**: Unified persistence strategy

### 🔵 17. Manual Tab Routing
**File**: `App.tsx:78`
```typescript
const [currentTab, setCurrentTab] = useState<'models'|'playground'|...>('models');
```
- 15 tabs managed manually
- **Consider**: React Router for deep linking, browser history

### 🔵 18. Hardcoded Initial Data
**File**: `App.tsx:20-73`
- `INITIAL_MEMORIES` (3 items), `INITIAL_EVENTS` (3 items)
- **Consider**: Seed from Supabase or config file

### 🔵 19. Express `unhandledRejection` Handler
**File**: `server/index.ts:109-111`
```typescript
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
```
- Logs but doesn't exit — process continues in undefined state
- **Fix**: Exit with non-zero code in production

---

## Security Checklist

| Check | Status | Notes |
|-------|--------|-------|
| API keys in client bundle | ❌ **FAIL** | Gemini key in `Playground.tsx` |
| Backend auth on proxy routes | ✅ PASS | Wonderland key validated |
| Supabase RLS enabled | ✅ PASS | All tables have policies |
| Input validation (backend) | ❌ **FAIL** | No schema validation |
| Rate limiting | ❌ **FAIL** | None on `/api/*` |
| CORS configured | ⚠️ WARN | Wide open (`cors()`) |
| Stripe webhook verified | ✅ PASS | Uses `express.raw()` + stripe lib |
| Helmet/CSP headers | ❌ **FAIL** | No security headers |
| Dependency audit | ❓ UNKNOWN | Run `npm audit` |

---

## File-by-File Notable Findings

### `src/App.tsx` (680 lines)
- **God component**: Holds all global state (modules, memories, events, tabs, auth, search)
- 15 `useState` + 7 `useEffect` + inline JSX for 15 tab views
- **Refactor**: Extract tab views to separate components, use context for shared state

### `src/components/Playground.tsx` (564 lines)
- Handles 3-tier streaming fallback logic inline
- Direct `GoogleGenAI` instantiation (security issue)
- Usage tracking mixed with UI logic
- **Refactor**: Move provider logic to custom hook `useModelStream()`

### `src/components/AIWonderCanvas.tsx` (2000+ lines)
- Entire workflow engine in one component
- Canvas transform, drag-drop, connections, versioning, telemetry, memory editor, training compiler, agent creator
- **Refactor**: Split into 8+ focused components

### `src/lib/providers/registry.ts` (142 lines) — Client
- Custom provider CRUD in localStorage
- OpenAI/Anthropic/Cohere request builders duplicated from server

### `server/providers/registry.ts` (487 lines) — Server
- 14 providers with prefix-based routing
- OpenRouter preferred path with fallback chain
- **Well designed** — clean abstraction

### `server/wonderland-keys.ts` (17 lines)
- Simple comma-separated key validation from env
- No key rotation, expiration, or scoping
- **Enhance**: Add key metadata (name, created, last used, rate limit)

### `supabase-schema.sql` (115 lines)
- Clean schema with RLS policies
- Realtime publication on 4 tables
- Missing: indexes on `usage_logs(user_id, created_at)`, `memories(user_id, type)`

---

## Recommended Action Plan

### Phase 1: Critical Security (Day 1)
- [ ] Move all LLM calls to backend proxy
- [ ] Remove `@google/genai` from `package.json` client deps
- [ ] Add Zod validation to `/api/chat` and `/api/chat/stream`
- [ ] Add `express-rate-limit` (e.g., 30 req/min per IP)
- [ ] Restrict CORS to known origins
- [ ] Throw on missing Supabase env vars

### Phase 2: Code Quality (Week 1)
- [ ] Extract shared model registry (`packages/shared/models.ts`)
- [ ] Derive Sidebar models from `CATALOG_MODELS`
- [ ] Add ESLint + Prettier + Vitest
- [ ] Add error boundaries (`react-error-boundary`)
- [ ] Split `AIWonderCanvas.tsx` and `ModelsCatalog.tsx`

### Phase 3: Testing & CI (Week 2)
- [ ] Unit tests for provider registry, expression parser, usage tracker
- [ ] Integration tests for `/api/chat` streaming
- [ ] GitHub Actions: typecheck → lint → test → build
- [ ] Add bundle analysis to CI

### Phase 4: Observability & Ops (Ongoing)
- [ ] Add request logging (pino/winston)
- [ ] Add health check dependencies (Supabase, provider APIs)
- [ ] Structured error responses with codes
- [ ] Wonderland key management UI (admin panel)

---

## Dependency Audit

| Package | Version | Note |
|---------|---------|------|
| `react` | 19.0.0 | Latest major |
| `vite` | 8.1.5 | Latest |
| `tailwindcss` | 4.3.3 | v4 (new engine) |
| `@google/genai` | 2.11.0 | **Remove from client** |
| `@supabase/supabase-js` | 2.108.2 | Current |
| `express` | 5.2.1 | v5 (new) |
| `three` | 0.183.2 | Current |
| `@react-three/fiber` | 9.6.1 | v9 (React 19 compat) |
| `motion` | 12.42.2 | Framer Motion v12 |
| `cron-parser` | 5.6.2 | Used in canvas for scheduling |

**No known vulnerable dependencies** (run `npm audit` to confirm).

---

## Performance Notes

- **Bundle size**: Unknown — add analyzer
- **Canvas rendering**: Three.js scene per agent (up to 8) — consider instancing or shared scene
- **Supabase realtime**: 4 subscriptions per user — monitor connection count
- **localStorage caps**: Memories (500), Events (200) — good bounds
- **Auto-save**: 30s interval on canvas — debounced, good

---

## Conclusion

**AI-WONDERLAND** is a feature-rich, well-architected playground with excellent provider abstraction, real-time sync, and visual workflow editing. The codebase demonstrates solid React/TypeScript patterns and modern tooling choices.

**Blocker**: The client-side Gemini API key exposure must be fixed before any production deployment. Beyond that, the project needs standard production hardening (validation, rate limiting, tests, CI) and component decomposition for maintainability.

**Estimated effort to production-ready**: 2-3 weeks with 1-2 engineers.

---

*Generated by automated code review. Review manually before acting on critical findings.*