import test from 'node:test';
import assert from 'node:assert/strict';
import type { WorkflowNode } from '../src/types';
import { hasUnsafeCredentials, sanitizeWorkflowNodes } from '../src/components/canvas/sanitizeWorkflow';

function makeNode(config: Record<string, unknown>): WorkflowNode {
  return { id: 'node-1', type: 'http', label: 'Request', category: 'app', x: 0, y: 0, config: config as WorkflowNode['config'] };
}

test('retains nonsecret endpoint and credential reference', () => {
  const node = makeNode({ credentialId: 'owner-key-uuid', httpUrl: 'https://example.com/api', providerBaseUrl: 'https://api.example.com/v1' });
  assert.equal(hasUnsafeCredentials(node.config), false);
  assert.deepEqual(sanitizeWorkflowNodes([node])[0].config, node.config);
});

test('removes explicit secrets and auth headers but retains safe endpoint', () => {
  const node = makeNode({ apiKey: 'super-secret', httpHeaders: '{"Authorization":"Bearer secret"}', httpUrl: 'https://example.com/health', credentialId: 'id' });
  assert.equal(hasUnsafeCredentials(node.config), true);
  assert.deepEqual(sanitizeWorkflowNodes([node])[0].config, { httpUrl: 'https://example.com/health', credentialId: 'id' });
});

test('removes URLs with API secrets in query and nested credentials', () => {
  const node = makeNode({ httpUrl: 'https://example.com/?api_key=secret', mockInputs: { nested: { accessToken: 'secret-value' } }, title: 'Clean' });
  assert.equal(hasUnsafeCredentials(node.config), true);
  assert.deepEqual(sanitizeWorkflowNodes([node])[0].config, { title: 'Clean' });
});
