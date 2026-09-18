import { Key, ShieldAlert, CheckCircle, Server } from 'lucide-react';

/**
 * Security note:
 * Provider credentials and Wonderland gateway keys are server-side secrets.
 * This view intentionally never embeds, generates, persists, or reveals real
 * provider keys in the browser bundle or localStorage.
 */
export function ApiKeysView() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#08080c] p-6 lg:p-8 space-y-8 scrollbar-thin">
      <div className="border-b border-[#1f2235]/40 pb-6">
        <div className="text-[10px] text-[#b8ff57] bg-[#b8ff57]/10 px-2 py-0.5 rounded w-max uppercase tracking-widest font-mono font-bold mb-2 border border-[#b8ff57]/20">
          Access Credentials
        </div>
        <h2 className="text-xl font-serif italic font-bold text-[#E4E3E0] tracking-tight">
          API Key Security
        </h2>
        <p className="text-xs font-mono text-[#5e6686] mt-1 max-w-3xl">
          Provider credentials are managed on the server. Real keys are never bundled into the Playground frontend or stored in browser localStorage.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="bg-[#0c0d12]/90 border border-[#1f2235]/60 p-6 rounded shadow-md font-mono">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-[#5b5eff]" />
            <h3 className="text-xs font-bold tracking-wider text-white uppercase">Server-managed secrets</h3>
          </div>
          <div className="space-y-3 text-[10px] text-[#808eb5] leading-relaxed">
            <p className="flex gap-2"><CheckCircle className="w-3.5 h-3.5 text-[#b8ff57] shrink-0 mt-0.5" /> OpenRouter and direct-provider keys are read from server environment variables.</p>
            <p className="flex gap-2"><CheckCircle className="w-3.5 h-3.5 text-[#b8ff57] shrink-0 mt-0.5" /> Mem0 uses the server-only MEM0AI_API_KEY environment variable.</p>
            <p className="flex gap-2"><CheckCircle className="w-3.5 h-3.5 text-[#b8ff57] shrink-0 mt-0.5" /> The repository contains variable names and placeholders only, never credential values.</p>
          </div>
        </section>

        <section className="bg-[#0c0d12]/90 border border-amber-500/20 p-6 rounded shadow-md font-mono">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold tracking-wider text-white uppercase">Credential handling</h3>
          </div>
          <div className="space-y-3 text-[10px] text-[#808eb5] leading-relaxed">
            <p>Configure production secrets in the deployment environment or GitHub Actions secrets, not in source files.</p>
            <p>Do not paste provider keys into screenshots, issues, commits, client-side code, or VITE_* variables.</p>
            <p>Any credential that has ever been committed should be treated as compromised and rotated at the provider.</p>
          </div>
        </section>
      </div>

      <div className="bg-[#0a0a0a] border border-[#1f2235] p-4 rounded-sm font-mono text-[9px] text-[#5e6686]">
        <div className="flex items-center gap-2 text-[#E4E3E0] mb-2">
          <Key className="w-3.5 h-3.5 text-[#b8ff57]" />
          <span className="font-bold uppercase tracking-wider">Expected server secret names</span>
        </div>
        <p>OPENROUTER_API_KEY, MEM0AI_API_KEY, WONDERLAND_KEYS, and any direct-provider API keys enabled by the server provider registry.</p>
      </div>
    </div>
  );
}
