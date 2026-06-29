# AI-PLAYGROUND Provider & Auth Migration

## Phase 1: Report & Design (done)
- [x] Audited all localStorage keys and provider architecture
- [x] Confirmed no existing Supabase client or auth library
- [x] Mapped all 4 hardcoded provider branches (OpenRouter, OpenAI, Anthropic, Groq)
- [x] Designed split architecture: built-in → server proxy, custom → direct client call

## Phase 2: Server-Side Built-In Provider Proxy
- [ ] `server/providers/types.ts` — ProviderConfig interface
- [ ] `server/providers/registry.ts` — built-in provider implementations (14 providers: OpenRouter, OpenAI, Anthropic, Groq, Mistral, Cohere, Together, Fireworks, DeepSeek, Perplexity, xAI, Google Gemini, Replicate, HuggingFace)
- [ ] `server/wonderland-keys.ts` — simple Wonderland key validation
- [ ] `server/index.ts` — Express server w/ `/api/chat`, CORS, key validation

## Phase 3: Client-Side Custom Provider System
- [ ] `src/lib/providers/types.ts` — ProviderConfig for custom providers
- [ ] `src/lib/providers/registry.ts` — custom provider registry + callProvider

## Phase 4: Frontend Integration
- [ ] `Playground.tsx` — route built-in models to `/api/chat`, custom models to direct client call
- [ ] `ApiKeysModal.tsx` — remove built-in key inputs, add Wonderland key display + custom provider add/edit/delete UI
- [ ] `package.json` — add `"server"` script
- [ ] `vite.config.ts` — proxy `/api/` to Express on port 3001
- [ ] `.env.example` — document new server env vars

## Phase 5: Auth Integration (future)
- [ ] Move Wonderland keys to Supabase `wonderland_keys` table
- [ ] Connect to dreammakerhub.website's Supabase project for shared identity
