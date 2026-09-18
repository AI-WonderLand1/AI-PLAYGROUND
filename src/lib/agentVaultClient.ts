import { getSession } from './supabase';

export type CredentialProvider = 'openrouter' | 'openai' | 'anthropic' | 'wonderland';
export interface CredentialSummary {
  id: string;
  provider: CredentialProvider;
  label: string;
  created_at: string;
}

async function vaultRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = await getSession();
  if (!session?.access_token) throw new Error('Sign in before using the credential vault.');
  const response = await fetch(`/api/agent-vault${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers,
    },
    cache: 'no-store',
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (HTTP ${response.status})`);
  return data as T;
}

export async function listCredentials(): Promise<CredentialSummary[]> {
  const data = await vaultRequest<{ credentials: CredentialSummary[] }>('/credentials');
  return data.credentials;
}

export async function createCredential(input: {
  provider: CredentialProvider;
  label: string;
  key: string;
}): Promise<CredentialSummary> {
  const data = await vaultRequest<{ credential: CredentialSummary }>('/credentials', {
    method: 'POST', body: JSON.stringify(input),
  });
  return data.credential;
}

export async function deleteCredential(id: string): Promise<void> {
  await vaultRequest<void>(`/credentials/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function testAgent(input: {
  credentialId: string;
  model: string;
  systemInstruction: string;
  prompt: string;
}): Promise<string> {
  const data = await vaultRequest<{ status: 'success'; output: string }>('/test', {
    method: 'POST', body: JSON.stringify(input),
  });
  return data.output;
}
