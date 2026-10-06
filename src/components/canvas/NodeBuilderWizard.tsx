import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import type { WorkflowNode } from '../../types';
import { getNodeSchema } from '../../data/nodeSchemas';
import { SchemaFields } from '../nodes/SchemaField';
import { listCredentials, type CredentialSummary } from '../../lib/agentVaultClient';
import { hasUnsafeCredentials, sanitizeWorkflowNodes } from './sanitizeWorkflow';

type Props = {
  draft: WorkflowNode;
  step: 2 | 3;
  onChange: (node: WorkflowNode) => void;
  onBack: () => void;
  onNext: () => void;
  onAdd: () => void;
  onCancel: () => void;
};

const input = 'w-full rounded border border-[#303650] bg-[#101522] px-3 py-2 text-sm text-white focus:border-violet-400 focus:outline-none';
const button = 'rounded border border-[#444b68] px-4 py-2 text-sm text-white hover:border-violet-400';
const aiExecutorTypes = new Set(['agent', 'openai_chat_model', 'anthropic_chat_model', 'gemini_chat_model']);

export function NodeBuilderWizard({ draft, step, onChange, onBack, onNext, onAdd, onCancel }: Props) {
  const [credentials, setCredentials] = useState<CredentialSummary[]>([]);
  const [credentialError, setCredentialError] = useState('');
  const schema = getNodeSchema(draft);
  const supportsModelExecution = aiExecutorTypes.has(draft.type);
  const unsafe = hasUnsafeCredentials(draft.config as Record<string, unknown>);
  const safeConfig = sanitizeWorkflowNodes([draft])[0].config;
  const title = (draft.config.title || draft.label).trim();

  useEffect(() => {
    if (!supportsModelExecution) return;
    let active = true;
    listCredentials().then(items => { if (active) setCredentials(items); })
      .catch(error => { if (active) setCredentialError(error instanceof Error ? error.message : 'Vault unavailable'); });
    return () => { active = false; };
  }, [supportsModelExecution]);

  const patch = (config: Record<string, unknown>) => onChange({
    ...draft, label: typeof config.title === 'string' ? config.title : draft.label,
    config: { ...draft.config, ...config } as WorkflowNode['config'],
  });
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-[#03050b]/95 p-3 text-slate-100" role="dialog" aria-modal="true" aria-label="Node builder">
      <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[#333b56] bg-[#0d1220] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#303650] p-5">
          <div><p className="text-xs uppercase tracking-widest text-violet-300">Workflow node builder</p><h2 className="mt-1 text-xl font-bold">{draft.label || draft.type}</h2></div>
          <button className="rounded p-2 hover:bg-white/10" onClick={onCancel} aria-label="Close node builder"><X size={20} /></button>
        </header>
        <ol className="grid grid-cols-3 gap-2 border-b border-[#303650] p-4 text-center text-xs sm:text-sm">
          {['1. Choose node', '2. Configure', '3. Review & add'].map((name, i) => <li key={name} className={`rounded border px-2 py-2 ${i + 1 === step ? 'border-violet-400 bg-violet-900/20 text-white' : i + 1 < step ? 'border-emerald-700 text-emerald-300' : 'border-slate-700 text-slate-400'}`}>{name}</li>)}
        </ol>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          {step === 2 ? <>
            <label className="block text-sm">Node name<input className={`${input} mt-2`} maxLength={100} value={draft.config.title || ''} onChange={event => patch({ title: event.target.value })} /></label>
            <label className="block text-sm">Description<textarea className={`${input} mt-2`} rows={3} value={draft.config.description || ''} onChange={event => patch({ description: event.target.value })} /></label>
            {schema?.fields.length ? <SchemaFields schema={{ ...schema, fields: schema.fields.filter(field => field.type !== 'credential') }} config={draft.config} onChange={patch} /> : <p className="rounded border border-amber-800/50 p-3 text-xs text-amber-200">This node has no configuration schema. You can add it to the canvas, but it may need an executor before it can run.</p>}
            {supportsModelExecution && <section className="space-y-2 rounded border border-[#303650] p-4"><label className="block text-sm">Server-stored model credential<select className={`${input} mt-2`} value={draft.config.credentialId || ''} onChange={event => patch({ credentialId: event.target.value })}><option value="">Choose a credential</option>{credentials.map(item => <option key={item.id} value={item.id}>{item.label} ({item.provider})</option>)}</select></label>{credentialError && <p role="alert" className="text-xs text-red-300">{credentialError}</p>}<a className="text-xs text-violet-300 underline" href="/agents">Manage credentials in Agent Library</a><p className="text-xs text-slate-400">Only a credential ID is saved in the node. No raw API key is stored in a workflow.</p></section>}
            {unsafe && <p role="alert" className="rounded border border-red-700 p-3 text-sm text-red-300">Remove legacy plaintext secrets or token-bearing URLs before adding this node.</p>}
          </> : <>
            <div className="rounded border border-[#303650] p-4"><p className="text-xs uppercase tracking-wide text-violet-300">Selected node</p><h3 className="mt-1 text-lg font-semibold">{title}</h3><p className="mt-1 text-sm text-slate-400">{draft.type} · {draft.category}</p><p className="mt-3 text-sm text-slate-300">{draft.config.description || 'No description'}</p></div>
            <div className="rounded border border-[#303650] p-4"><p className="mb-2 text-xs uppercase tracking-wide text-violet-300">Safe configuration preview</p><pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all text-xs text-slate-300">{JSON.stringify(safeConfig, null, 2)}</pre></div>
            {supportsModelExecution && !draft.config.credentialId && <p className="text-sm text-amber-300">No credential selected. This AI node will not run until you assign a server-stored credential.</p>}
            <p className="text-sm text-slate-400">Adding a node changes the canvas only. It does not execute it, run a provider test, publish an agent, or start a background worker. Use the existing node test or Run action to see a real execution result.</p>
            {unsafe && <p role="alert" className="text-sm text-red-300">This node contains unsafe credential fields and cannot be added.</p>}
          </>}
        </div>
        <footer className="flex items-center justify-between gap-3 border-t border-[#303650] p-4">
          <button className={button} onClick={onBack}><ArrowLeft size={15} className="mr-1 inline" /> Back</button>
          {step === 2 ? <button className="rounded bg-violet-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40" disabled={!title || unsafe} onClick={onNext}>Review <ArrowRight size={15} className="ml-1 inline" /></button> : <button className="rounded bg-violet-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40" disabled={!title || unsafe} onClick={onAdd}><Check size={15} className="mr-1 inline" /> Add to canvas</button>}
        </footer>
      </div>
    </div>
  );
}
