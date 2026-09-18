import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, LockKeyhole, Plus, Trash2 } from 'lucide-react';
import { supabase, getSession } from '../lib/supabase';
import { createCredential, deleteCredential, listCredentials, testAgent, type CredentialProvider, type CredentialSummary } from '../lib/agentVaultClient';

type AgentForm = { id?: string; name: string; model: string; systemInstruction: string; credentialId: string };
type SavedAgent = {
  id: string;
  name: string;
  model: string;
  system_instruction: string | null;
  credential_id: string | null;
};
const PRESETS: Array<{ title: string; summary: string; model: string; instructions: string }> = [
  { title: 'Support assistant', summary: 'Answer questions using a focused support policy.', model: 'gpt-4o-mini', instructions: 'You are a support assistant. Give helpful, accurate answers. State uncertainty rather than inventing account details.' },
  { title: 'Builder copilot', summary: 'Help a user plan and debug a website.', model: 'gpt-4o-mini', instructions: 'You are a website-building copilot. Ask only for missing implementation details and never claim a code change was made without a verified result.' },
  { title: 'Research assistant', summary: 'Summarize provided material with clear uncertainty.', model: 'gpt-4o-mini', instructions: 'You are a research assistant. Distinguish source facts, assumptions, and suggestions. Do not invent citations.' },
  { title: 'Blank agent', summary: 'Start with your own name, model, and instructions.', model: 'gpt-4o-mini', instructions: '' },
];
const EMPTY_FORM: AgentForm = { name: '', model: 'gpt-4o-mini', systemInstruction: '', credentialId: '' };
const field = 'w-full rounded-lg border border-slate-700 bg-[#151b2c] px-3 py-2.5 text-slate-100 focus:border-violet-500 focus:outline-none';
const primary = 'rounded-lg bg-violet-600 px-5 py-2.5 font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40';
const secondary = 'rounded-lg border border-slate-600 px-4 py-2.5 text-slate-200 hover:bg-slate-800';

export function AgentLibrary() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<SavedAgent[]>([]);
  const [credentials, setCredentials] = useState<CredentialSummary[]>([]);
  const [form, setForm] = useState<AgentForm>(EMPTY_FORM);
  const [provider, setProvider] = useState<CredentialProvider>('openrouter');
  const [keyLabel, setKeyLabel] = useState('');
  const [secret, setSecret] = useState('');
  const [showNewKey, setShowNewKey] = useState(false);
  const [testPrompt, setTestPrompt] = useState('Hello! What can you help me with?');
  const [testOutput, setTestOutput] = useState('');
  const [testedSignature, setTestedSignature] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState('');
  const [published, setPublished] = useState(false);

  const signature = JSON.stringify([form.name, form.model, form.systemInstruction, form.credentialId, testPrompt]);
  const tested = testedSignature === signature && !!testOutput;
  const selectedCredential = credentials.find(item => item.id === form.credentialId);

  async function refresh() {
    const session = await getSession();
    const db = supabase;
    if (!session?.user || !db) { setUserId(null); setLoading(false); return; }
    setUserId(session.user.id);
    try {
      const [vault, agents] = await Promise.all([
        listCredentials(),
        db.from('agents').select('id,name,model,system_instruction,credential_id').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      ]);
      setCredentials(vault);
      if (agents.error) throw agents.error;
      setSaved((agents.data || []) as SavedAgent[]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to load the agent library.');
    } finally { setLoading(false); }
  }

  useEffect(() => { void refresh(); }, []);

  function selectPreset(preset: typeof PRESETS[number]) {
    setForm({ ...EMPTY_FORM, name: preset.title === 'Blank agent' ? '' : preset.title, model: preset.model, systemInstruction: preset.instructions });
    setPublished(false); setTestOutput(''); setTestedSignature(''); setNotice(''); setStep(2);
  }
  function selectSaved(agent: SavedAgent) {
    setForm({ id: agent.id, name: agent.name, model: agent.model, systemInstruction: agent.system_instruction || '', credentialId: agent.credential_id || '' });
    setPublished(false); setTestOutput(''); setTestedSignature(''); setNotice(''); setStep(2);
  }

  async function saveCredential() {
    if (saving || !keyLabel.trim() || !secret.trim()) return;
    setSaving(true); setNotice('');
    try {
      const credential = await createCredential({ provider, label: keyLabel.trim(), key: secret });
      setCredentials(previous => [credential, ...previous]);
      setForm(previous => ({ ...previous, credentialId: credential.id }));
      setSecret(''); setKeyLabel(''); setShowNewKey(false);
      setTestOutput(''); setTestedSignature('');
      setNotice('Credential stored on the server. The secret will not be shown again.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not store key.'); }
    finally { setSaving(false); }
  }

  async function removeCredential(id: string) {
    if (saving || !window.confirm('Delete this credential? Agents using it must be assigned a new key.')) return;
    setSaving(true); setNotice('');
    try {
      await deleteCredential(id);
      setCredentials(previous => previous.filter(item => item.id !== id));
      if (form.credentialId === id) setForm(previous => ({ ...previous, credentialId: '' }));
      setTestOutput(''); setTestedSignature('');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to delete key.'); }
    finally { setSaving(false); }
  }

  async function runTest() {
    if (testing || !form.credentialId) return;
    setTesting(true); setNotice(''); setTestOutput(''); setTestedSignature('');
    const currentSignature = signature;
    try {
      const result = await testAgent({ credentialId: form.credentialId, model: form.model.trim(), systemInstruction: form.systemInstruction, prompt: testPrompt });
      if (!result.trim()) throw new Error('The provider returned an empty response.');
      setTestOutput(result); setTestedSignature(currentSignature);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Agent test failed.'); }
    finally { setTesting(false); }
  }

  async function publish() {
    if (!tested || saving || !userId || !supabase || !form.name.trim()) return;
    setSaving(true); setNotice('');
    try {
      const record = {
        user_id: userId, name: form.name.trim(), model: form.model.trim(),
        system_instruction: form.systemInstruction, credential_id: form.credentialId,
      };
      const query = form.id
        ? supabase.from('agents').update(record).eq('id', form.id).eq('user_id', userId)
        : supabase.from('agents').insert(record);
      const { data, error } = await query.select('id').single();
      if (error || !data) throw error || new Error('Agent was not saved');
      setForm(previous => ({ ...previous, id: data.id }));
      setPublished(true); setNotice('Agent saved to your account and available in Playground. This does not deploy an unattended worker.');
      void refresh();
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to save agent.'); }
    finally { setSaving(false); }
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] px-4 py-8 text-slate-100 md:px-10">
      <div className="mx-auto max-w-5xl">
        <a href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"><ArrowLeft size={17} /> Back to Playground</a>
        <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[.24em] text-violet-400">AI Wonderland</p><h1 className="mt-2 text-3xl font-bold">Agent library</h1><p className="mt-2 text-sm text-slate-400">Choose an agent, configure its capabilities, and test it before saving.</p></div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"><LockKeyhole size={13} className="mr-1 inline" /> Server-side credential vault</span>
        </div>
        <ol className="mb-8 grid grid-cols-3 gap-2 text-center text-xs md:text-sm">
          {['1. Choose agent', '2. Configure', '3. Test & publish'].map((label, index) => (
            <li key={label} className={`rounded-lg border px-2 py-3 ${step === index + 1 ? 'border-violet-400 bg-violet-950/30 text-white' : 'border-slate-800 text-slate-500'}`}>{label}</li>
          ))}
        </ol>
        {notice && <div role="status" className="mb-6 rounded-lg border border-slate-600 bg-slate-900 p-4 text-sm">{notice}</div>}
        {loading ? <p>Loading agent library…</p> : !userId ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-8">Sign in to Playground before creating agents or storing API keys. <a className="underline" href="/">Go to sign in</a>.</div>
        ) : step === 1 ? (
          <div className="space-y-8">
            <section><h2 className="mb-4 text-xl font-semibold">Start from an agent template</h2><div className="grid gap-4 md:grid-cols-2">{PRESETS.map(preset => (
              <button type="button" key={preset.title} onClick={() => selectPreset(preset)} className="rounded-xl border border-slate-700 bg-slate-900 p-5 text-left transition hover:border-violet-500"><span className="text-lg font-semibold">{preset.title}</span><p className="mt-2 text-sm text-slate-400">{preset.summary}</p><span className="mt-5 inline-flex items-center gap-1 text-sm text-violet-300">Configure <ArrowRight size={15} /></span></button>
            ))}</div></section>
            <section><h2 className="mb-4 text-xl font-semibold">Your saved agents</h2>{saved.length ? <div className="grid gap-3 md:grid-cols-2">{saved.map(agent => (
              <button type="button" key={agent.id} onClick={() => selectSaved(agent)} className="rounded-lg border border-slate-700 bg-slate-900 p-4 text-left hover:border-violet-500"><strong>{agent.name}</strong><p className="mt-1 text-xs text-slate-400">Model: {agent.model}{agent.credential_id ? '' : ' · Needs a vault credential'}</p></button>
            ))}</div> : <p className="text-sm text-slate-400">No agents saved yet. Select a template above.</p>}</section>
          </div>
        ) : step === 2 ? (
          <section className="rounded-xl border border-slate-700 bg-slate-900 p-5 md:p-8">
            <h2 className="mb-5 text-xl font-semibold">Configure agent</h2>
            <div className="grid gap-5"><label className="text-sm">Agent name<input className={`${field} mt-2`} maxLength={100} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="My agent" /></label>
              <label className="text-sm">Model ID<input className={`${field} mt-2`} maxLength={120} value={form.model} onChange={event => setForm({ ...form, model: event.target.value })} placeholder="gpt-4o-mini" /><span className="mt-1 block text-xs text-slate-400">Use an ID supported by the provider you choose.</span></label>
              <label className="text-sm">System instructions<textarea className={`${field} mt-2`} rows={6} maxLength={8000} value={form.systemInstruction} onChange={event => setForm({ ...form, systemInstruction: event.target.value })} placeholder="Describe what the agent should do…" /></label>
              <div className="rounded-xl border border-slate-700 bg-[#111727] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-semibold"><KeyRound size={18} /> Agent credentials</h3><button type="button" className={secondary} onClick={() => setShowNewKey(value => !value)}><Plus size={15} className="mr-1 inline" /> Add key</button></div>
                <label className="text-sm">Select your encrypted key<select className={`${field} mt-2`} value={form.credentialId} onChange={event => setForm({ ...form, credentialId: event.target.value })}><option value="">Select a credential</option>{credentials.map(item => <option key={item.id} value={item.id}>{item.label} ({item.provider})</option>)}</select></label>
                {selectedCredential && <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400"><span>Stored on server · {selectedCredential.provider} · Value hidden</span><button type="button" className="inline-flex items-center gap-1 text-red-300" onClick={() => void removeCredential(selectedCredential.id)}><Trash2 size={13} /> Delete</button></div>}
                {showNewKey && <div className="mt-4 grid gap-3 rounded-lg border border-slate-700 p-4"><label className="text-sm">Provider<select className={`${field} mt-1`} value={provider} onChange={event => setProvider(event.target.value as CredentialProvider)}><option value="openrouter">OpenRouter (your key)</option><option value="openai">OpenAI (your key)</option><option value="anthropic">Anthropic (your key)</option><option value="wonderland">Wonderland access key</option></select></label><label className="text-sm">Key label<input className={`${field} mt-1`} value={keyLabel} maxLength={80} onChange={event => setKeyLabel(event.target.value)} placeholder="My private key" /></label><label className="text-sm">API key<input className={`${field} mt-1`} type="password" autoComplete="off" value={secret} onChange={event => setSecret(event.target.value)} placeholder="Paste key once" /></label><button type="button" className={primary} disabled={saving || !keyLabel.trim() || secret.length < 8} onClick={() => void saveCredential()}>{saving ? 'Storing…' : 'Store encrypted key'}</button><p className="text-xs text-slate-400">The server encrypts it with AES-256-GCM and never returns the raw key. Do not paste keys into node prompts or workflow JSON.</p></div>}
              </div>
            </div>
            <div className="mt-7 flex justify-between gap-3"><button className={secondary} onClick={() => setStep(1)}>Back</button><button className={primary} disabled={!form.name.trim() || !form.model.trim() || !form.credentialId} onClick={() => { setTestOutput(''); setTestedSignature(''); setNotice(''); setStep(3); }}>Continue <ArrowRight size={16} className="ml-1 inline" /></button></div>
          </section>
        ) : (
          <section className="rounded-xl border border-slate-700 bg-slate-900 p-5 md:p-8"><h2 className="mb-2 text-xl font-semibold">Test & publish</h2><p className="mb-6 text-sm text-slate-400">A real provider response is required before you can publish this configuration.</p>
            <div className="mb-5 rounded-lg border border-slate-700 p-4"><strong>{form.name}</strong><p className="mt-1 text-sm text-slate-400">{form.model} · {selectedCredential?.provider || 'No key selected'}</p></div>
            <label className="text-sm">Test prompt<textarea className={`${field} mt-2`} rows={3} maxLength={4000} value={testPrompt} onChange={event => setTestPrompt(event.target.value)} /></label>
            <button className={`${primary} mt-4`} disabled={testing || !testPrompt.trim() || !form.credentialId} onClick={() => void runTest()}>{testing ? 'Calling provider…' : 'Run real test'}</button>
            {testOutput && <div className="mt-5 rounded-lg border border-emerald-700 bg-emerald-950/30 p-4"><p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-300"><CheckCircle2 size={16} /> Provider returned a response</p><pre className="whitespace-pre-wrap break-words text-sm">{testOutput}</pre></div>}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3"><button className={secondary} onClick={() => { setTestOutput(''); setTestedSignature(''); setStep(2); }}>Back to configure</button><button className={primary} disabled={!tested || saving || published} onClick={() => void publish()}>{saving ? 'Publishing…' : published ? 'Saved to Playground' : 'Publish to Playground'}</button></div>
            {published && <a className="mt-5 inline-flex items-center gap-1 text-sm text-violet-300 underline" href="/">Open Playground <ArrowRight size={14} /></a>}
          </section>
        )}
      </div>
    </main>
  );
}
