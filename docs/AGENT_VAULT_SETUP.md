# Agent library and credential vault rollout

**Status: draft PR only. Do not deploy before migration and an end-to-end two-user security test.**

## What this does

`/agents` is a separate three-step agent library: choose a template or saved agent, configure its provider/model/instructions and vault credential, then run a real provider test before saving to Supabase. Saved agents with an assigned credential use the backend vault path in Playground chat. The legacy workflow canvas remains an editor; this does **not** create persistent unattended workers.

Secrets are encrypted server-side with AES-256-GCM using a random 12-byte IV, a 16-byte authentication tag, and user/provider associated data. The database stores ciphertext and metadata, not plaintext. API responses show only credential ID, label, provider, and created date. A logged-in user's session token is verified with Supabase Auth before querying the vault; the lookup is also scoped to their user ID. A key must be decrypted server-side to call its provider. Browser Supabase session tokens are separate from provider credentials.

## Deployment prerequisites

1. Back up your Supabase database and apply `supabase/migrations/20260918_agent_credentials.sql` to the **AI-PLAYGROUND** project only. Confirm the `public.agents` table has a `user_id uuid` column and that the migration runs successfully. The `agent_credentials` table should not have anon/authenticated SELECT permission.
2. Generate a fresh 32-byte encryption key on a trusted machine, e.g. `openssl rand -base64 32`. Put its exact output in the **server-only** `CREDENTIALS_ENCRYPTION_KEY` secret in Infisical, not `VITE_` variables, Git, logs, or browser devtools. Store a secure backup of the encryption key. Losing the key makes previously saved credentials undecryptable. Rotating it requires a re-encryption plan; `key_version` is reserved for later support.
3. Configure server-only `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL` at the server process) and `SUPABASE_SERVICE_ROLE_KEY`, and ensure the Express process receives all three variables. Never add the service role or encryption key to Vite or frontend config. Ensure HTTPS is in use end-to-end for the public origin.
4. Use **two distinct test accounts**. Account A adds a test provider key, confirms list response has no secret, tests an agent, and publishes. Account B must not list, delete, test, or assign account A's credential ID. Unauthenticated requests must receive HTTP 401. An unconfigured vault should fail closed. Check that plaintext keys do not appear in server logs, browser storage, browser bundle, or JSON responses. The older browser-local keys require separate cleanup.
5. Use a low-value test key with a strict spending limit and verify expected provider/network failures show an error. Set up monitoring and usage/billing quotas before opening access to real users.

## Old browser credentials

The old canvas and API key screens stored keys in browser localStorage. New screens do not automatically transfer or delete them. Re-enter only legitimate keys in the vault via `/agents`. The screens provide opt-in cleanup of older copies. Consider rotating any real provider keys that may have been exposed through old browser storage or a committed source file. Old custom providers are not yet fully supported by the new fixed-endpoint vault; do not delete their configs before recording what you need.

## Known limitations / do-not-merge checklist

- [ ] Run database migration and verify in a test environment.
- [ ] Add server-only encryption key and service role in deployed environment.
- [ ] Run integration tests for cross-user access, encryption tampering, key deletion and errors; current GitHub CI only typechecks/builds.
- [ ] Migrate or disable remaining legacy Playground provider paths and any workflow-node config fields that directly store provider or n8n secrets.
- [ ] Split the remaining large canvas component into canvas/editor, runner, inspector, versioning, and sidebar modules without changing behavior.
- [ ] Create a durable backend workflow runner and scheduler. Code/command/while nodes intentionally fail closed until a properly isolated runner is available. Other unsupported nodes must never produce fake success.
- [ ] Audit old client provider integration files and remove all plaintext-key and misleading synthetic-key flows.

An approved build or PR merge alone does not perform database migration or inject server secrets.
