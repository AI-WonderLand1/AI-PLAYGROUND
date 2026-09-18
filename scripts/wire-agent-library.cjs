// One-time exact-match patch: connect saved agents to the server vault instead of browser keys.
const fs = require('node:fs');
function patch(path, changes) {
  let src = fs.readFileSync(path, 'utf8');
  for (const [before, after, name] of changes) {
    const i = src.indexOf(before);
    if (i < 0 || src.indexOf(before, i + before.length) >= 0) throw new Error(`Expected one occurrence of ${name} in ${path}`);
    src = src.slice(0, i) + after + src.slice(i + before.length);
  }
  fs.writeFileSync(path, src);
}
patch('src/components/Playground.tsx', [
  ["import { logUsage } from '../lib/usageTracker';", "import { logUsage } from '../lib/usageTracker';\nimport { supabase, getSession } from '../lib/supabase';\nimport { testAgent } from '../lib/agentVaultClient';", 'vault imports'],
  ["      const isImgModel = config.model.includes('image')", `      // Saved agents run through their own owner-scoped, server-decrypted credential.\n      // Never fall back to a different user's key or a browser-stored provider key.\n      const session = await getSession();\n      if (session?.user && supabase) {\n        const { data: agent, error: lookupError } = await supabase.from('agents')\n          .select('credential_id').eq('id', module.id).eq('user_id', session.user.id).maybeSingle();\n        if (lookupError) throw new Error('Could not verify your agent credential.');\n        if (agent) {\n          if (!agent.credential_id) throw new Error('This agent needs a credential. Open Agent Library to configure it.');\n          const transcript = [...messages.slice(-6).map(m => \\`\\${m.role}: \\${m.content}\\`), \\`user: \\${prompt}\\`].join('\\\\n');\n          const output = await testAgent({\n            credentialId: agent.credential_id, model: config.model,\n            systemInstruction: config.systemInstruction || '', prompt: transcript.slice(-4000),\n          });\n          if (!output.trim()) throw new Error('The provider returned an empty response.');\n          setMessages(prev => [...prev, { role: 'assistant', content: output, timestamp: Date.now() }]);\n          return;\n        }\n      }\n\n      const isImgModel = config.model.includes('image')`, 'secure saved-agent routing'],
]);
patch('src/App.tsx', [
  ['        {/* Far Right: Master Key Badge + Org Badge */}\n        <div className="flex items-center gap-3">', '        {/* Agent library is a separate page, always discoverable even on narrow screens. */}\n        <div className="flex items-center gap-3">\n          <a href="/agents" className="rounded border border-violet-500/50 px-2.5 py-1 text-[10px] font-bold uppercase text-violet-200 hover:bg-violet-950/50">Agent library</a>', 'library navigation'],
]);
console.log('Connected published agents to vault-backed chat and made agent library discoverable.');
