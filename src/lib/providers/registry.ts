import type { ProviderConfig, ChatMessage, ChatConfig } from './types';

// The historical wonderland_custom_providers localStorage record may contain
// plaintext API keys. Never deserialize or execute those credentials in the app.
// Users must re-enter provider keys into the owner-scoped server vault.
export function loadCustomProviders(): ProviderConfig[] { return []; }

export function saveCustomProviders(_providers: ProviderConfig[]): void {
  throw new Error('Browser-stored provider keys are disabled. Use Agent Library > Add key.');
}

export function addCustomProvider(_provider: ProviderConfig): void {
  throw new Error('Use the server-side credential vault in Agent Library.');
}

export function updateCustomProvider(_id: string, _updates: Partial<ProviderConfig>): void {
  throw new Error('Use the server-side credential vault in Agent Library.');
}

export function removeCustomProvider(_id: string): void {
  throw new Error('Use the server-side credential vault in Agent Library.');
}

export function isCustomModel(_modelId: string): boolean { return false; }
export function getCustomProviderForModel(_modelId: string): ProviderConfig | undefined { return undefined; }

export async function callCustomProvider(
  _provider: ProviderConfig,
  _messages: ChatMessage[],
  _config: ChatConfig,
): Promise<{ content: string; tokens?: number }> {
  throw new Error('Direct browser provider requests are disabled. Configure a saved agent with an encrypted server-side credential.');
}
