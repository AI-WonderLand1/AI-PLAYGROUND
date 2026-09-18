import type { WorkflowNode } from '../../types';

// The workflow may retain a credential ID, never a credential value.
const secretFields = /^(?:apiKey|n8nApiKey|providerApiKey|secret|password|token|accessToken|refreshToken|authorization|authHeader|clientSecret|privateKey|webhookUrl|n8nWebhookUrl|httpHeaders)$/i;
const sensitiveUrlParam = /(?:^|[?&])(?:api_?key|access_?key|token|secret|password|auth|signature|client_secret)=/i;
const credentialInText = /(?:bearer\s+[a-z0-9._-]{12,}|(?:api[_-]?key|access[_-]?token|password|client[_-]?secret)\s*[=:]\s*[^\s,;]{8,})/i;

function isUnsafeValue(key: string, value: unknown): boolean {
  if (typeof value === 'string') {
    if (secretFields.test(key) && value.trim()) return true;
    if (/^https?:\/\//i.test(value) && sensitiveUrlParam.test(value)) return true;
    if (/^(?:httpBody|query|promptTemplate|systemPrompt)$/i.test(key) && credentialInText.test(value)) return true;
  }
  // Do not let a nested object hide credentials from the same scan.
  if (value && typeof value === 'object') {
    return Object.entries(value).some(([nestedKey, nestedValue]) => isUnsafeValue(nestedKey, nestedValue));
  }
  return false;
}

export function hasUnsafeCredentials(config: Record<string, unknown>): boolean {
  return Object.entries(config).some(([key, value]) => isUnsafeValue(key, value));
}

export function sanitizeWorkflowNodes(nodes: WorkflowNode[]): WorkflowNode[] {
  return nodes.map(node => ({
    ...node,
    config: Object.fromEntries(Object.entries(node.config || {}).filter(([key, value]) => !isUnsafeValue(key, value))) as WorkflowNode['config'],
  }));
}
