// One-time, branch-only migration script. It fails closed if upstream canvas code changes.
// After application, inspect the resulting diff and remove this script before merging.
const fs = require('node:fs');
const filename = 'src/components/AIWonderCanvas.tsx';
let source = fs.readFileSync(filename, 'utf8');

function replaceOnce(before, after, name) {
  const first = source.indexOf(before);
  if (first === -1 || source.indexOf(before, first + before.length) !== -1) {
    throw new Error(`Expected exactly one ${name} match`);
  }
  source = source.slice(0, first) + after + source.slice(first + before.length);
}
function replaceBetween(start, end, replacement, name) {
  const first = source.indexOf(start);
  if (first === -1 || source.indexOf(start, first + start.length) !== -1) {
    throw new Error(`Expected exactly one ${name} start`);
  }
  const last = source.indexOf(end, first + start.length);
  if (last === -1) throw new Error(`Missing ${name} end`);
  source = source.slice(0, first) + replacement + source.slice(last);
}

replaceBetween(
  '  // Credentials state (real CRUD with localStorage persistence)',
  '  // Variables state (real CRUD with localStorage persistence)',
  `  // Legacy keys are never loaded into React state. Only the user's explicit action clears them.\n  const [hasLegacyKeys, setHasLegacyKeys] = useState(() => Boolean(localStorage.getItem('aiwonder_credentials')));\n\n`,
  'legacy credential state',
);
replaceOnce(
  `  // Persist credentials\n  useEffect(() => {\n    localStorage.setItem('aiwonder_credentials', JSON.stringify(credentials));\n  }, [credentials]);\n\n`,
  '',
  'insecure credential persistence',
);
replaceBetween(
  `          {/* Credentials panel */}\n          {activeSidebarTab === 'credentials' && (`,
  `          {/* Executions panel */}`,
  `          {/* Credentials are managed by the authenticated vault, never in browser storage. */}\n          {activeSidebarTab === 'credentials' && (\n            <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs text-slate-300">\n              <h3 className="font-bold text-[#b8ff57]">Encrypted credential vault</h3>\n              <p>Use the agent library to store and select your own API key or Wonderland access key. The browser never receives saved key values.</p>\n              <a href="/agents" className="block rounded bg-violet-600 px-3 py-2 text-center font-semibold text-white">Open agent library & vault</a>\n              {hasLegacyKeys && (\n                <div className="space-y-3 rounded border border-amber-500/50 p-3 text-amber-200">\n                  <p>Old credentials are still stored unencrypted in this browser. Re-enter them in the new server vault, then clear this old copy. They are not automatically uploaded.</p>\n                  <button className="rounded border border-amber-400 px-3 py-2" onClick={() => { localStorage.removeItem('aiwonder_credentials'); setHasLegacyKeys(false); showNotification('Legacy browser keys cleared'); }}>Clear old browser keys</button>\n                </div>\n              )}\n            </div>\n          )}\n`,
  'legacy credential sidebar',
);
replaceBetween(
  `          } else if (node.type === 'code') {`,
  `          } else if (node.type === 'http') {`,
  `          } else if (node.type === 'code') {\n            throw new Error('Code node disabled: execution requires an isolated backend sandbox. Browser JavaScript is not a sandbox.');\n`,
  'browser code node',
);
replaceBetween(
  `          } else if (node.type === 'loop_while') {`,
  `          } else if (node.type === 'merge') {`,
  `          } else if (node.type === 'loop_while') {\n            throw new Error('While node requires a validated loop expression and backend execution; browser evaluation is disabled.');\n`,
  'browser-evaluated while condition',
);
replaceBetween(
  `            } else if (node.type === 'execute_command') {`,
  `            } else if (node.type === 'respond_webhook') {`,
  `            } else if (node.type === 'execute_command') {\n              throw new Error('Command execution requires an isolated backend runner; no browser shell or arbitrary JavaScript is available.');\n`,
  'browser command execution',
);
replaceBetween(
  `            } else if (node.type === 'respond_webhook') {`,
  `            } else if (node.type === 'calculator') {`,
  `            } else if (node.type === 'respond_webhook') {\n              throw new Error('Webhook response requires a real incoming server request. This canvas is not an HTTP listener.');\n`,
  'fake webhook response',
);
replaceBetween(
  `            } else if (node.type === 'vector_qa') {`,
  `            } else if (node.type === 'bitly'`,
  `            } else if (node.type === 'vector_qa') {\n              throw new Error('Vector QA needs a real indexed retrieval result; no demonstration answer will be returned.');\n`,
  'hardcoded vector QA response',
);
replaceBetween(
  `              } else if (cfg.code) {`,
  `              } else {\n                throw new Error(\`Tool \${node.type} requires configuration:`,
  `              } else if (cfg.code) {\n                throw new Error('Tool JavaScript requires an isolated backend sandbox; configure a trusted webhook instead.');\n`,
  'generic browser tool execution',
);
replaceOnce(
  `            // Non-AI/HTTP/code nodes: pass input through as output\n            setNodeOutputs(prev => ({\n              ...prev,\n              [nodeId]: { status: 'success', output: input, timestamp: Date.now(), duration: Date.now() - nodeStart }\n            }));\n            setExecutionLog(prev => [...prev, \`[\${new Date().toLocaleTimeString()}] ✅ \${node.label} — completed (\${Date.now() - nodeStart}ms)\`]);`,
  `            // Unknown nodes are never marked successful just because input passed through.\n            throw new Error(\`No executor registered for node type: \${node.type}\`);`,
  'false-success fallback',
);
if (source.includes('new Function(')) throw new Error('Arbitrary browser evaluation remains after migration');
if (source.includes("localStorage.setItem('aiwonder_credentials'")) throw new Error('Credential persistence remains');
if (source.includes('credFormValue')) throw new Error('Legacy plaintext credential form remains');
fs.writeFileSync(filename, source);
console.log('Canvas hardening transformation complete; review the diff before merging.');
