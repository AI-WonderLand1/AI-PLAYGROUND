import type { Request } from 'express';

export type AccountProviderCatalog = {
  source: 'ai-wonderland-account';
  settingsPath: string;
  activeProvider: string;
  providers: Array<{
    id: string;
    name: string;
    configured: boolean;
    hasApiKey: boolean;
    model: string | null;
    baseUrl: string | null;
    active: boolean;
  }>;
  platformAgents: Array<{ id: string; name: string; capability: string }>;
};

const DEFAULT_CATALOG_URL = 'https://dreammakerhub.website/api/ai-providers/catalog';

export async function getAccountProviderCatalog(req: Request): Promise<AccountProviderCatalog> {
  const auth = req.header('authorization')?.trim();
  if (!auth) throw new Error('Sign in to AI WONDERLAND to load account provider settings.');

  const endpoint = process.env.DREAMMAKERHUB_PROVIDER_CATALOG_URL?.trim() || DEFAULT_CATALOG_URL;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { Authorization: auth, Accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body || body.source !== 'ai-wonderland-account' || !Array.isArray(body.providers)) {
    throw new Error(
      typeof body?.error === 'string'
        ? body.error
        : 'AI WONDERLAND account provider settings are unavailable.',
    );
  }
  return body as AccountProviderCatalog;
}
