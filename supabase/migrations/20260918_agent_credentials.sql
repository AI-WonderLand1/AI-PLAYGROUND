-- Run this migration in the AI-PLAYGROUND Supabase project before enabling the new vault.
-- Ciphertext and AES-GCM metadata only: never store plaintext API keys here.
create table if not exists public.agent_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('openrouter', 'openai', 'anthropic', 'wonderland')),
  label text not null check (length(label) between 1 and 80),
  ciphertext text not null,
  iv text not null,
  auth_tag text not null,
  key_version integer not null default 1,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index if not exists agent_credentials_user_id_idx on public.agent_credentials(user_id);
alter table public.agent_credentials enable row level security;
-- The vault is accessed ONLY by the authenticated Express server using service_role.
-- A browser's anon/authenticated credentials must not directly read ciphertext.
revoke all on public.agent_credentials from anon, authenticated;
comment on table public.agent_credentials is 'Server-only AES-256-GCM ciphertext. Never expose ciphertext or keys via client API.';

-- Save only a credential reference with the agent, never the provider key.
alter table public.agents add column if not exists credential_id uuid;
alter table public.agents add constraint agents_credential_same_owner
  foreign key (credential_id, user_id) references public.agent_credentials (id, user_id)
  on delete set null (credential_id);
