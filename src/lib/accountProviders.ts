import { getSession } from './supabase';

export type AccountProvider = {
  id: string;
  name: string;
  configured: boolean;
  hasApiKey: boolean;
  model: string | null;
  baseUrl: string | null;
  active: boolean;
};

export type AccountProviderCatalog = {
  source: 'ai-wonderland-account';
  settingsPath: string;
  activeProvider: string;
  providers: AccountProvider[];
  platformAgents: Array<{ id: string; name: string; capability: string }>;
};

export const ACCOUNT_AGENT_SETTINGS_URL =
  import.meta.env.VITE_ACCOUNT_AGENT_SETTINGS_URL
  || 'https://dreammakerhub.website/dashboard/settings/agents';

export async function loadAccountProviderCatalog(): Promise<AccountProviderCatalog> {
  const session = await getSession();
  if (!session?.access_token) {
    throw new Error('Sign in to AI WONDERLAND to load your account providers.');
  }

  const response = await fetch('/api/account/providers', {
    headers: { Authorization: 'Bearer ' + session.access_token },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) {
    throw new Error(body?.error || 'Account provider settings are unavailable.');
  }
  return body as AccountProviderCatalog;
}
