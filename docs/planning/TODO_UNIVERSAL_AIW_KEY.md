# TODO — AI WONDERLAND Universal AI Key Gateway

## Goal

Give every AI WONDERLAND app one user-facing credential (`aiw_...`) while still supporting many AI providers and BYOK behind the gateway.

The user should be able to connect a provider once, save its key securely, then use that provider and its models from AI-PLAYGROUND, NPC-AI-SIM, WonderBuild, the IDE assistant, and future AI WONDERLAND products without pasting raw provider keys into every app.

## Product contract

- One AI WONDERLAND key per user/workspace is the credential apps use.
- Keep provider choice open: OpenRouter, OpenAI, Anthropic, Groq, Mistral, Cohere, Together AI, Fireworks, DeepSeek, Perplexity, xAI, Google Gemini, and future providers.
- Provider selection controls the model dropdown.
- BYOK keys are stored as encrypted secrets and referenced by ID; raw keys are never stored in project/NPC JSON.
- OpenRouter remains a useful one-key provider option, but must not be the only architecture.
- A user can connect multiple providers simultaneously.
- If a provider key is already connected in one AI WONDERLAND app, other AI WONDERLAND apps should show it as connected without asking for the key again.

## Phase 1 — Replace prototype Wonderland key storage

- [ ] Replace comma-separated `WONDERLAND_KEYS` env validation with per-user/workspace gateway credentials.
- [ ] Generate strong `aiw_...` credentials server-side.
- [ ] Store only a cryptographic hash of each gateway key.
- [ ] Add key metadata: id, owner/workspace, name, createdAt, lastUsedAt, revokedAt, scopes.
- [ ] Support create, revoke, rotate, and list operations without ever returning stored raw keys after creation.
- [ ] Move `/api/chat` authentication to the `x-wonderland-key` header; keep temporary body compatibility only during migration.
- [ ] Add rate limiting and audit records keyed by gateway-key ID/user/workspace.

## Phase 2 — Secure provider BYOK vault

- [ ] Add per-user provider secret records: provider ID, encrypted key material, createdAt, updatedAt, validation status.
- [ ] Never place raw provider keys in localStorage, project JSON, NPC files, logs, analytics, or browser bundles.
- [ ] Encrypt provider secrets at rest with envelope encryption/KMS-compatible design.
- [ ] Add provider connection UI: Provider -> API key -> Validate -> Save.
- [ ] Once connected, show `Connected` and hide the raw key field unless rotating/replacing it.
- [ ] Add disconnect/revoke behavior.

## Phase 3 — Shared provider + model registry

- [ ] Extract the existing provider registry/model routes into a shared package or service contract reusable by all AI WONDERLAND apps.
- [ ] Provider dropdown dynamically filters its model dropdown.
- [ ] Add model capability metadata: text, vision, audio, image, video, tool calling, reasoning, embeddings, TTS/STT.
- [ ] Let applications request capabilities instead of hard-coding a provider/model.
- [ ] Keep OpenRouter available as a broad model catalog and routing provider.
- [ ] Add provider/model refresh strategy so model catalogs do not become stale.

## Phase 4 — Universal gateway routing

- [ ] Request contract should contain model/provider choice plus the AIW gateway key, never the provider key.
- [ ] Resolve the user's selected provider secret server-side.
- [ ] Route the request through the existing provider adapter layer.
- [ ] Support streaming and non-streaming through the same gateway contract.
- [ ] Add fallback policy support without exposing provider credentials.
- [ ] Add clear errors for missing provider connection, invalid/revoked secret, unsupported model, quota/rate limit, and upstream failure.

## Phase 5 — Ecosystem integration

- [ ] AI-PLAYGROUND uses the universal gateway by default.
- [ ] NPC-AI-SIM uses the same connected providers/models for NPC brains and AI creation commands.
- [ ] WonderBuild uses the same gateway for builder AI.
- [ ] IDE assistant uses the same gateway.
- [ ] A single connected-provider screen is shared or backed by one common API.
- [ ] Project records store `{ providerId, modelId, secretRef }`, never raw credentials.

## Phase 6 — Usage, billing, and hosted credits

- [ ] Track usage by user/workspace, gateway key, app, provider, and model.
- [ ] Distinguish BYOK usage from AI WONDERLAND-funded usage.
- [ ] BYOK remains the default low-cost path.
- [ ] Later: optional AI WONDERLAND hosted credits/subscriptions with quotas and spend controls.
- [ ] Add per-key/app spending caps and usage dashboards before enabling platform-funded provider keys for general users.

## Current code to migrate

- `server/wonderland-keys.ts` — prototype static key validation.
- `server/index.ts` — `/api/chat` and `/api/chat/stream` gateway entry points.
- `server/providers/registry.ts` — current multi-provider adapter/model routing foundation.

## Definition of done

A user connects one or more provider keys once, receives/uses one `aiw_...` credential across AI WONDERLAND apps, chooses a provider and then a model from a filtered menu, and no application-specific project file ever contains a raw provider credential.
