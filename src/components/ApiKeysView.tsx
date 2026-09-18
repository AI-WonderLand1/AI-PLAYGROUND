import { useEffect, useState } from 'react';
import { ArrowRight, KeyRound, LockKeyhole, ShieldAlert } from 'lucide-react';
import { listCredentials, type CredentialSummary } from '../lib/agentVaultClient';

export function ApiKeysView() {
  const [credentials, setCredentials] = useState<CredentialSummary[]>([]);
  const [message, setMessage] = useState('');
  const [legacy, setLegacy] = useState(() => localStorage.getItem('wonderland_user_api_keys') !== null);

  useEffect(() => {
    let live = true;
    listCredentials().then(values => { if (live) setCredentials(values); }).catch(error => {
      if (live) setMessage(error instanceof Error ? error.message : 'Credential vault unavailable');
    });
    return () => { live = false; };
  }, []);

  function clearLegacy() {
    if (!window.confirm('This permanently removes the old browser-only key list. Copy any needed key to the encrypted vault first.')) return;
    localStorage.removeItem('wonderland_user_api_keys');
    setLegacy(false);
  }

  return (
    <main className="flex-1 space-y-6 overflow-y-auto bg-[#08080c] p-6 text-slate-200 lg:p-8">
      <header className="space-y-2"><div className="flex items-center gap-2 text-violet-300"><LockKeyhole size={20} /><span className="text-xs font-bold uppercase tracking-widest">Authenticated credential vault</span></div><h1 className="text-2xl font-bold">Your API credentials</h1><p className="text-sm text-slate-400">This page displays labels only. Plaintext keys cannot be retrieved from the server.</p></header>
      <a href="/agents" className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500"><KeyRound size={17} /> Add or manage a key in the agent library <ArrowRight size={16} /></a>
      {message && <p role="status" className="rounded-lg border border-slate-700 bg-slate-900 p-4 text-sm">{message}</p>}
      <section className="max-w-3xl space-y-2" aria-label="Saved credential labels">
        {credentials.length ? credentials.map(item => (
          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-4" key={item.id}><strong>{item.label}</strong><span className="text-xs uppercase text-slate-400">{item.provider} · secret hidden</span></div>
        )) : <p className="rounded-lg border border-slate-800 p-4 text-sm text-slate-400">No vault credentials to display.</p>}
      </section>
      {legacy && <div className="max-w-3xl space-y-3 rounded-lg border border-amber-600/60 p-4 text-sm text-amber-200"><p className="flex items-center gap-2"><ShieldAlert size={18} /> An old browser-only API key list was detected. Its generated keys were not issued by the server and may not be valid. Review it before deleting; nothing has been transferred automatically.</p><button onClick={clearLegacy} className="rounded-lg border border-amber-500 px-4 py-2">Delete legacy browser key list</button></div>}
    </main>
  );
}
