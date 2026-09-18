import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { NodeField, FieldOption, DEFAULT_BASE_URL } from '../../data/nodeSchemas';
import { listCredentials, type CredentialSummary } from '../../lib/agentVaultClient';
import { useExpressionAutocomplete, ExpressionDropdown, NodeOutputInfo } from './ExpressionAutocomplete';

export type ConfigPatch = Record<string, any>;

interface SchemaFieldsProps {
  schema: { fields: NodeField[]; docsUrl?: string };
  config: Record<string, any>;
  onChange: (patch: ConfigPatch) => void;
  nodeNames?: string[];
  nodeOutputs?: Record<string, NodeOutputInfo>;
}

const inputCls =
  'w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white focus:outline-none focus:border-[#5b5eff]';
const labelCls = 'text-[9px] text-slate-400 uppercase font-bold';
const helpCls = 'text-[8px] text-[#4a5068] mt-1 leading-relaxed';

function CredentialField({ config, onChange }: { config: Record<string, any>; onChange: (p: ConfigPatch) => void }) {
  const [saved, setSaved] = useState<CredentialSummary[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    listCredentials().then(items => { if (active) setSaved(items); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Vault unavailable'); });
    return () => { active = false; };
  }, []);
  return <div className="space-y-2">
    <label className={labelCls}>Encrypted server credential</label>
    <select className={inputCls} value={config.credentialId || ''} onChange={event => onChange({ credentialId: event.target.value })}>
      <option value="">Choose a credential</option>
      {saved.map(item => <option key={item.id} value={item.id}>{item.label} ({item.provider})</option>)}
    </select>
    {error && <p role="alert" className="text-red-300 text-xs">{error}</p>}
    <a href="/agents" className="block text-violet-300 text-xs underline">Manage keys in Agent Library</a>
    <p className={helpCls}>Only the credential ID is kept in the workflow. Keys are decrypted by the authenticated backend.</p>
  </div>;
}

function FieldControl({
  field,
  config,
  onChange,
  nodeNames,
  nodeOutputs,
}: {
  field: NodeField;
  config: Record<string, any>;
  onChange: (p: ConfigPatch) => void;
  nodeNames: string[];
  nodeOutputs: Record<string, NodeOutputInfo>;
}) {
  const value = config[field.key] ?? field.default;
  const set = (v: any) => onChange({ [field.key]: v });
  const expr = useExpressionAutocomplete(
    typeof value === 'string' ? value : '',
    set,
    nodeNames,
    nodeOutputs,
  );

  switch (field.type) {
    case 'credential':
      return <CredentialField config={config} onChange={onChange} />;

    case 'textarea':
      return (
        <div className="relative">
          <textarea
            ref={expr.fieldRef}
            value={typeof value === 'string' ? value : ''}
            onChange={expr.handleChange}
            onKeyDown={expr.handleKeyDown}
            onBlur={expr.close}
            rows={field.rows || 4}
            placeholder={field.placeholder}
            className={`w-full bg-[#141624] border border-[#1f2235] rounded p-3 text-xs text-white focus:outline-none focus:border-[#5b5eff] font-mono`}
          />
          <ExpressionDropdown state={expr.state} />
        </div>
      );

    case 'code':
      return (
        <div className="relative">
          <textarea
            ref={expr.fieldRef}
            value={typeof value === 'string' ? value : ''}
            onChange={expr.handleChange}
            onKeyDown={expr.handleKeyDown}
            onBlur={expr.close}
            rows={field.rows || 8}
            spellCheck={false}
            className="w-full h-48 bg-[#0d0e1b] border border-[#1f2235] rounded p-3 text-xs text-[#00f5d4] focus:outline-none focus:border-[#b8ff57] font-mono"
          />
          <ExpressionDropdown state={expr.state} />
        </div>
      );

    case 'select':
      return (
        <select
          value={(value as string) || ''}
          onChange={(e) => set(e.target.value)}
          className={inputCls}
        >
          {(field.options || []).map((o: FieldOption) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );

    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => set(e.target.checked)}
            className="rounded border-[#1f2235] bg-[#0c0e17] text-[#5b5eff] focus:ring-0 w-3 h-3 cursor-pointer"
          />
          <span className="text-[9px] text-slate-400">{field.label}</span>
        </div>
      );

    case 'slider':
      return (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={field.min ?? 0}
            max={field.max ?? 1}
            step={field.step ?? 0.05}
            value={typeof value === 'number' ? value : 0}
            onChange={(e) => set(parseFloat(e.target.value))}
            className="flex-1 accent-[#b8ff57]"
          />
          <span className="text-[10px] text-[#b8ff57] font-mono w-10 text-right">{typeof value === 'number' ? value.toFixed(2) : value}</span>
        </div>
      );

    case 'number':
      return (
        <input
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={typeof value === 'number' ? value : 0}
          onChange={(e) => set(parseFloat(e.target.value) || field.default || 0)}
          className={inputCls}
        />
      );

    case 'password':
      return <p className={helpCls}>Inline API secrets are disabled. Select an encrypted credential in Agent Library.</p>;

    case 'text':
    default:
      return (
        <div className="relative">
          <input
            ref={expr.fieldRef}
            type="text"
            value={typeof value === 'string' ? value : ''}
            onChange={expr.handleChange}
            onKeyDown={expr.handleKeyDown}
            onBlur={expr.close}
            placeholder={field.placeholder}
            className={inputCls}
          />
          <ExpressionDropdown state={expr.state} />
        </div>
      );
  }
}

export function SchemaFields({ schema, config, onChange, nodeNames = [], nodeOutputs = {} }: SchemaFieldsProps) {
  const fields = schema.fields || [];
  let lastSection: string | null = null;

  return (
    <div className="space-y-4">
      {schema.docsUrl && (
        <a
          href={schema.docsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-[8px] text-[#5b5eff] hover:text-white uppercase tracking-wider"
        >
          <ExternalLink className="w-3 h-3" />
          Node documentation
        </a>
      )}

      {fields.map((field, i) => {
        const section = field.section || null;
        const header = section !== lastSection ? section : null;
        lastSection = section;
        if (/^(?:apiKey|n8nApiKey|providerApiKey|secret|password|token|accessToken|clientSecret|authorization|webhookUrl|n8nWebhookUrl|providerBaseUrl|httpHeaders)$/i.test(field.key)) {
          return <p key={field.key + i} className={helpCls}>Inline secret or webhook fields are disabled. Configure a server-side credential in <a href="/agents" className="underline text-violet-300">Agent Library</a>.</p>;
        }
        return (
          <React.Fragment key={`${field.key}-${i}`}>
            {header && (
              <h6 className="text-[8px] text-[#b8ff57] uppercase tracking-widest font-bold pt-2 border-t border-[#1f2235]/20 first:border-t-0">
                {header}
              </h6>
            )}
            <div className="space-y-1">
              {field.type !== 'checkbox' && (
                <label className={labelCls}>{field.label}</label>
              )}
              <FieldControl
                field={field}
                config={config}
                onChange={onChange}
                nodeNames={nodeNames}
                nodeOutputs={nodeOutputs}
              />
              {field.help && <p className={helpCls}>{field.help}</p>}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
