import { useState } from 'react';
import { LockKeyhole, ShieldAlert } from 'lucide-react';

/** Safe, standalone canvas sidebar. Never reads or renders a raw credential value. */
export function CredentialPanel({ onNotice }: { onNotice: (message: string) => void }) {
  const [legacyPresent, setLegacyPresent] = useState(() => localStorage.getItem('aiwonder_credentials') !== null);

  const clearLegacy = () => {
    if (!window.confirm('Have you re-entered all needed keys in the encrypted vault? Deleting this browser copy cannot be undone and may interrupt old workflows.')) return;
    localStorage.removeItem('aiwonder_credentials');
    setLegacyPresent(false);
    onNotice('Legacy browser credentials cleared');
  };

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs text-slate-300">
      <h3 className="flex items-center gap-2 font-bold text-[#b8ff57]"><LockKeyhole size={16} /> Encrypted credential vault</h3>
      <p>Agent credentials are managed in the separate library, not in workflow JSON or the browser's credential editor.</p>
      <a href="/agents" className="block rounded bg-violet-600 px-3 py-2 text-center font-semibold text-white">Open agent library &amp; vault</a>
      {legacyPresent && (
        <div className="space-y-3 rounded border border-amber-500/50 p-3 text-amber-200">
          <p className="flex items-start gap-2"><ShieldAlert size={16} className="shrink-0" /> Old credentials remain unencrypted in this browser. Re-enter them in the vault first. They were not automatically uploaded.</p>
          <button type="button" className="rounded border border-amber-400 px-3 py-2" onClick={clearLegacy}>Clear old browser keys</button>
        </div>
      )}
    </div>
  );
}
