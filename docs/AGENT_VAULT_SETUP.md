# Agent library and credential vault rollout

**Status: PR #83 merged and deployed on September 18, 2026. Vault setup and cross-user security validation have NOT been confirmed. Do not onboard real API keys until the checklist below is complete.**

The `/agents` page provides three steps: choose an agent, configure a credential and model, test and publish. Saved agents and AI workflow nodes use the authenticated server vault. The editor is not a durable background workflow runner.

The vault encrypts credentials server-side using AES-256-GCM with a random IV and authentication tag. It returns credential metadata, not saved key values. The key is decrypted only in the backend when contacting a provider. These code properties are not a substitute for production verification.

## Required production setup

1. Identify the Supabase project actually configured for AI-PLAYGROUND. **Do not assume it is the DreamMakerHub or VAULTX project.** Back up that project's database. Apply `supabase/migrations/20260918_agent_credentials.sql` to that verified project and confirm the existing `public.agents` table has a `user_id uuid` column. Verify that anon/authenticated roles cannot SELECT `public.agent_credentials`.
2. Generate a fresh 32-byte key on a trusted machine using `openssl rand -base64 32`, securely back it up, and inject it into the server-only `CREDENTIALS_ENCRYPTION_KEY` (e.g. through Infisical). Do not use `VITE_`, `NEXT_PUBLIC_`, GitHub source, client bundles, or logs for this secret. Losing it makes stored credentials undecryptable; rotation requires re-encryption.
3. Supply server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the Express process. Confirm the process loads the intended Infisical environment. Use HTTPS end-to-end.
4. Test two distinct accounts. User A stores a disposable, spending-limited provider key, lists metadata, runs a real agent, and publishes. User B must receive denials when listing, deleting, testing, or assigning A's credential ID. Unauthenticated requests should return 401. Confirm failed calls fail closed and secret values never appear in responses, workflow snapshots, logs, or frontend bundles.
5. Re-enter only needed legacy browser-stored keys into the vault, then deliberately clear obsolete localStorage copies and rotate any provider keys that might have been exposed. Do not silently migrate or destroy users' credentials. Confirm per-user quotas, rate limits, and monitoring before a public beta.

## Still incomplete

- The original canvas remains large. Its editor, inspector, versioning, execution, and scheduler need incremental separation with tests.
- Browser schedule/cron timers are not durable background jobs. Unsupported Code/Command/While nodes intentionally fail instead of running unsandboxed JavaScript.
- Fixed-endpoint vault providers do not yet support all historic custom providers. Webhooks with embedded secrets and inline authorization headers remain blocked until a server-backed integration exists.
- There is no verified end-to-end cross-account test against the production database or live provider, and no confirmed production vault secret configuration in this repository. GitHub Actions build and health checks cannot establish those properties.
- The legacy server `/api/chat` Wonderland-key route uses configured shared keys; it needs separate per-user issuance, revocation, quota and authentication review before public exposure.

The follow-up credential sanitization changes are in PR #84. Do not interpret a merge or a successful deployment check as proof that all production prerequisites have been completed.
