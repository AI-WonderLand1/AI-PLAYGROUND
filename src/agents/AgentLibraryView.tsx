import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, KeyRound, Plus, Trash2 } from 'lucide-react';
import { supabase, getSession } from '../lib/supabase';
import { listCredentials, deleteCredential, type CredentialSummary } from '../lib/agentVaultClient';

type SavedAgent = { id: string; name: string; model: string; credential_id: string | null; system_instruction: string | null };

export function AgentLibraryView() {
  const [agents, setAgents] = useState<SavedAgent[]>([]);
  const [credentials, setCredentials] = useState<CredentialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const session = await getSession();
        if (!session?.user || !supabase) return;
        if (active) setSignedIn(true);
        const [keys, result] = await Promise.all([
          listCredentials(),
          supabase.from('agents').select('id,name,model,system_instruction,credential_id').eq('user_id', session.user.id).order('created_at', { ascending: false }),
        ]);
        if (result.error) throw result.error;
        if (active) { setCredentials(keys); setAgents((result.data || []) as SavedAgent[]); }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Could not load your library.'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);
  const remove = async (id: string) => {
    if (busy || !window.confirm('Delete this credential? Any agent using it will need another key.')) return;
    setBusy(true); setError('');
    try { await deleteCredential(id); setCredentials(previous => previous.filter(item => item.id !== id)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to delete credential.'); }
    finally { setBusy(false); }
  };
  return <main className="min-h-screen bg-[#0b0f19] px-5 py-8 text-slate-100 md:px-10">
    <div className="mx-auto max-w-5xl">
      <a className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white" href="/"><ArrowLeft size={16} /> Back to Playground</a>
      <header className="my-8 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-violet-300">AI Wonderland</p><h1 className="mt-2 text-3xl font-bold">Agent Library</h1><p className="mt-2 text-sm text-slate-400">Browse your saved agents and encrypted credentials. Creation happens in the node builder.</p></div><a href="/node-builder" className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-3 font-semibold hover:bg-violet-500"><Plus size={17} /> Create agent node</a></header>
      {error && <p role="alert" className="mb-5 rounded border border-red-700 p-4 text-sm text-red-300">{error}</p>}
      {loading ? <p>Loading your library…</p> : !signedIn ? <p>Sign in to Playground to access your private library.</p> : <>
        <section className="mb-10"><h2 className="mb-4 text-xl font-semibold">Your saved agents</h2>{agents.length ? <div className="grid gap-4 md:grid-cols-2">{agents.map(agent => <article key={agent.id} className="rounded-xl border border-slate-700 bg-slate-900 p-5"><h3 className="text-lg font-semibold">{agent.name}</h3><p className="mt-2 text-sm text-slate-400">{agent.model} · {agent.credential_id ? 'Credential assigned' : 'Credential required'}</p><div className="mt-4 flex gap-4 text-sm"><a className="inline-flex items-center gap-1 text-violet-300 underline" href={`/node-builder?agent=${encodeURIComponent(agent.id)}`}>Edit in node builder <ArrowRight size={14} /></a><a className="text-violet-300 underline" href="/">Playground</a></div></article>)}</div> : <p className="text-sm text-slate-400">No saved agents yet. Create one in the node builder.</p>}</section>
        <section><h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><KeyRound size={19} /> Your encrypted credentials</h2><p className="mb-4 text-sm text-slate-400">Only labels and providers are shown here, never API-key values.</p>{credentials.length ? <div className="grid gap-3">{credentials.map(key => <div key={key.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900 p-4"><div><strong>{key.label}</strong><p className="text-xs text-slate-400">{key.provider}</p></div><button disabled={busy} onClick={() => void remove(key.id)} className="inline-flex items-center gap-1 text-sm text-red-300 disabled:opacity-50"><Trash2 size={15} /> Delete key</button></div>)}</div> : <p className="text-sm text-slate-400">No credentials stored yet. Add one in the node builder.</p>}</section>
      </>}
    </div>
  </main>;
}
