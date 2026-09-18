const fs = require('node:fs');
function edit(path, changes) {
  let source = fs.readFileSync(path, 'utf8');
  for (const [oldText, newText, label] of changes) {
    const pos = source.indexOf(oldText);
    if (pos < 0 || source.indexOf(oldText, pos + oldText.length) >= 0) throw new Error(`Expected exactly one ${label} match in ${path}`);
    source = source.slice(0, pos) + newText + source.slice(pos + oldText.length);
  }
  fs.writeFileSync(path, source);
}
function replaceSection(sourcePath, begin, end, replacement) {
  let source = fs.readFileSync(sourcePath, 'utf8');
  const a = source.indexOf(begin);
  const b = source.indexOf(end, a + begin.length);
  if (a < 0 || b < 0 || source.indexOf(begin, a + begin.length) >= 0) throw new Error('Expected unique credential sidebar boundaries');
  source = source.slice(0, a) + replacement + source.slice(b);
  fs.writeFileSync(sourcePath, source);
}
edit('src/components/AIWonderCanvas.tsx', [
  ["import { AgentCompiler } from './AgentCompiler';", "import { AgentCompiler } from './AgentCompiler';\nimport { CredentialPanel } from './canvas/CredentialPanel';", 'credential panel import'],
  ["  // Legacy keys are never loaded into React state. Only the user's explicit action clears them.\n  const [hasLegacyKeys, setHasLegacyKeys] = useState(() => Boolean(localStorage.getItem('aiwonder_credentials')));\n\n", '', 'legacy state extraction'],
  ["            const responseText = await res.text();\n            const output = JSON.stringify({", "            const responseText = await res.text();\n            if (!res.ok) throw new Error(`HTTP request failed (${res.status})`);\n            const output = JSON.stringify({", 'HTTP failure propagation'],
  ["              if (!webhookUrl) {\n                setNodeOutputs(prev => ({", "              if (!webhookUrl) {\n                throw new Error('No n8n webhook URL configured');\n              } else {\n                try {\n                  const headers: Record<string, string> = { 'Content-Type': 'application/json' };\n                  if (cfg.n8nApiKey) headers['Authorization'] = `Bearer ${cfg.n8nApiKey}`;\n                  const resp = await fetch(webhookUrl, { method: 'POST', headers, body: input });\n                  if (!resp.ok) throw new Error(`n8n returned HTTP ${resp.status}`);\n                  const text = await resp.text();\n                setNodeOutputs(prev => ({", 'n8n missing URL failure'],
]);
// Remove the old n8n branch remainder. Its success/error state was not propagated to the runner.
replaceSection('src/components/AIWonderCanvas.tsx',
  "                  const text = await resp.text();\n                setNodeOutputs(prev => ({",
  "            } else if (node.type === 'calculator' ||",
  "                  const text = await resp.text();\n                  setNodeOutputs(prev => ({ ...prev, [nodeId]: { status: 'success', output: text, timestamp: Date.now(), duration: Date.now() - nodeStart } }));\n                  setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ ${node.label} — n8n HTTP ${resp.status} (${Date.now() - nodeStart}ms)`]);\n                } catch (error) {\n                  throw error;\n                }\n              }\n",
);
replaceSection('src/components/AIWonderCanvas.tsx',
  "          {/* Credentials are managed by the authenticated vault, never in browser storage. */}",
  "          {/* Executions panel */}",
  "          {/* Secure credential UI is isolated from the workflow canvas engine. */}\n          {activeSidebarTab === 'credentials' && <CredentialPanel onNotice={showNotification} />}\n",
);
edit('server/agent-vault.ts', [
  ["      output = typeof result === 'string' ? result : JSON.stringify(result);", "      output = typeof result.content === 'string' ? result.content : '';", 'Wonderland provider content'],
]);
console.log('Extracted credential sidebar and fixed direct HTTP/n8n failure status and Wonderland output.');
