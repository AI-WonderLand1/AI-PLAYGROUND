import { useState } from 'react';
import { ArrowRight, KeyRound, ShieldAlert, X } from 'lucide-react';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LEGACY_KEYS = [
  'openrouter_api_key',
  'wonderland_master_key',
  'wonderland_custom_providers',
  'wonderland_user_api_keys',
] as const;

export function ApiKeysModal({ isOpen, onClose }: ApiKeysModalProps) {
  const [legacyPresent, setLegacyPresent] = useState(() => LEGACY_KEYS.some(key => localStorage.getItem(key) !== null));
  if (!isOpen) return null;

  function clearLegacy() {
    if (!window.confirm('Have you re-entered any real API keys in the new vault? Clearing old browser keys can interrupt older chat/provider integrations and cannot be undone.')) return;
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
    setLegacyPresent(false);
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="API key management" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <section className="relative w-full max-w-lg space-y-5 rounded-xl border border-slate-700 bg-[#141824] p-6 text-slate-200 shadow-2xl">
        <button aria-label="Close" onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white"><X size={20} /></button>
        <div className="flex items-center gap-2 text-violet-300"><KeyRound size={20} /><h2 className="text-lg font-semibold">Secure agent credentials</h2></div>
        <p className="text-sm leading-relaxed text-slate-300">The previous API key editor stored secrets in your browser and generated Wonderland tokens that were not issued by the server. That editor is disabled. Save your own provider key or an existing, server-issued Wonderland access key in the authenticated agent vault instead.</p>
        <a href="/agents" className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-500">Open agent library &amp; credential vault <ArrowRight size={16} /></a>
        {legacyPresent && (
          <div className="space-y-3 rounded-lg border border-amber-500/60 bg-amber-950/20 p-4 text-sm text-amber-200">
            <p className="flex items-start gap-2"><ShieldAlert size={18} className="shrink-0" /> Older provider credentials may still be stored in this browser. Re-enter needed keys in the vault before clearing the old copies. Existing chat integrations may need rewiring.</p>
            <button type="button" onClick={clearLegacy} className="rounded-lg border border-amber-400/70 px-3 py-2 hover:bg-amber-950/40">Clear old browser credentials</button>
          </div>
        )}
        <p className="text-xs text-slate-400">New vault credentials are encrypted server-side; the legacy Playground chat is not yet migrated to this vault.</p>
      </section>
    </div>
  );
}
