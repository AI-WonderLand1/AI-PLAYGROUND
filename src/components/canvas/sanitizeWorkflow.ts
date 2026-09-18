import type { WorkflowNode } from '../../types';

// These legacy fields could previously hold plaintext credentials. Keep the
// identifier (credentialId), never the value, in shared or browser snapshots.
const secretFields = /^(?:apiKey|n8nApiKey|providerApiKey|secret|password|token|accessToken|refreshToken|authorization|authHeader|clientSecret|privateKey|webhookUrl|n8nWebhookUrl|providerBaseUrl|httpHeaders)$/i;
const sensitiveUrlParam = /(?:^|[?&])(?:api_?key|token|secret|password|auth|signature)=/i;

export function hasUnsafeCredentials(config: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(config)) {
    if (secretFields.test(key) && typeof value === 'string' && value.trim().length > 0) return true;
    if (typeof value === 'string' && /^https?:\/\//i.test(value) && sensitiveUrlParam.test(value)) return true;
  }
  return false;
}

export function sanitizeWorkflowNodes(nodes: WorkflowNode[]): WorkflowNode[] {
  return nodes.map(node => ({
    ...node,
    config: Object.fromEntries(Object.entries(node.config || {}).filter(([key, value]) =>
      !secretFields.test(key) && !(typeof value === 'string' && /^https?:\/\//i.test(value) && sensitiveUrlParam.test(value))
    )) as WorkflowNode['config'],
  }));
}
