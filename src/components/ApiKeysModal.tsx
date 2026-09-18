import { useEffect } from 'react';
import { Key, ShieldAlert, X, Server, CheckCircle } from 'lucide-react';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeysModal({ isOpen, onClose }: ApiKeysModalProps) {
  useEffect(() => {
    // Remove legacy browser-stored provider credentials. Provider secrets now
    // belong on the server only so XSS/client-bundle access cannot expose them.
    localStorage.removeItem('openrouter_api_key');
    localStorage.removeItem('wonderland_custom_providers');
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-[#141414] border border-[#2a2a2a] max-w-xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#555] hover:text-[#E4E3E0] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-[#E4E3E0] mb-2">
          <Key className="w-5 h-5 text-[#b8ff57]" />
          <h3 className="font-serif italic text-sm uppercase tracking-wider">Provider Credentials</h3>
        </div>
        <p className="text-[10px] text-[#777] font-mono uppercase tracking-widest mb-6 pr-8">
          Secrets are managed on the server and are never stored in the browser.
        </p>

        <div className="bg-[#0a0a0a] border border-[#1f2235] p-4 rounded-sm mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Server className="w-4 h-4 text-[#5b5eff]" />
            <span className="text-[9px] font-mono text-[#E4E3E0] uppercase tracking-widest font-bold">Server-only configuration</span>
          </div>
          <div className="space-y-2 text-[9px] text-[#808eb5] font-mono leading-relaxed">
            <p className="flex gap-2"><CheckCircle className="w-3.5 h-3.5 text-[#b8ff57] shrink-0" /> OPENROUTER_API_KEY routes supported models through OpenRouter.</p>
            <p className="flex gap-2"><CheckCircle className="w-3.5 h-3.5 text-[#b8ff57] shrink-0" /> MEM0AI_API_KEY enables persistent memory retrieval and storage.</p>
            <p className="flex gap-2"><CheckCircle className="w-3.5 h-3.5 text-[#b8ff57] shrink-0" /> Direct-provider keys can be configured as server environment variables.</p>
          </div>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-sm">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[9px] text-[#9a9a9a] font-mono leading-relaxed">
              Legacy OpenRouter and custom-provider keys previously stored in localStorage are removed automatically when this component loads. Any key that was ever committed to Git history should still be rotated at its provider.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
