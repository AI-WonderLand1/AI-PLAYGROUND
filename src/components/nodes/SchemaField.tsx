import React from 'react';
import { Key, ExternalLink } from 'lucide-react';
import { NodeField, FieldOption, DEFAULT_BASE_URL } from '../../data/nodeSchemas';
import { loadCustomProviders } from '../../lib/providers/registry';

export type ConfigPatch = Record<string, any>;

interface SchemaFieldsProps {
  schema: { fields: NodeField[]; docsUrl?: string };
  config: Record<string, any>;
  onChange: (patch: ConfigPatch) => void;
}

const inputCls =
  'w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white focus:outline-none focus:border-[#5b5eff]';
const labelCls = 'text-[9px] text-slate-400 uppercase font-bold';
const helpCls = 'text-[8px] text-[#4a5068] mt-1 leading-relaxed';

function CredentialField({ config, onChange }: { config: Record<string, any>; onChange: (p: ConfigPatch) => void }) {
  const saved = loadCustomProviders();
  const source = (config.providerId as string) || 'custom';
  const authStyle = (config.providerAuthStyle as string) || 'bearer';
  const baseUrl = (config.providerBaseUrl as string) || DEFAULT_BASE_URL;

  const set = (patch: ConfigPatch) => onChange(patch);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <label className={labelCls}>Credential Source</label>
        <select
          value={source}
          onChange={(e) => set({ providerId: e.target.value })}
          className={inputCls}
        >
          <option value="custom">Custom on this node</option>
          <option value="global">Global BYOK (OpenRouter)</option>
          {saved.map(p => (
            <option key={p.id} value={`provider:${p.id}`}>Saved: {p.name}</option>
          ))}
        </select>
      </div>

      {source === 'custom' && (
        <>
          <div className="space-y-1">
            <label className={labelCls}>Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => set({ providerBaseUrl: e.target.value })}
              placeholder={DEFAULT_BASE_URL}
              className={`${inputCls} font-mono`}
            />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>API Key</label>
            <input
              type="password"
              value={(config.providerApiKey as string) || ''}
              onChange={(e) => set({ providerApiKey: e.target.value })}
              placeholder="sk-..."
              className={`${inputCls} font-mono`}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Auth Style</label>
            <select
              value={authStyle}
              onChange={(e) => set({ providerAuthStyle: e.target.value })}
              className={inputCls}
            >
              <option value="bearer">Bearer Token</option>
              <option value="x-api-key">X-API-Key Header</option>
            </select>
          </div>
        </>
      )}

      {source === 'global' && (
        <p className={helpCls}>
          Uses the global OpenRouter key (<span className="text-[#5b5eff] font-mono">mc_key_openrouter</span>) saved in
          your keys. No key is entered here. The AI Wonder Assistant tab uses its own server-side key — separate from
          this selector.
        </p>
      )}

      {source.startsWith('provider:') && (
        <p className={helpCls}>
          Uses the base URL and key stored for{' '}
          <span className="text-[#5b5eff] font-mono">
            {saved.find(p => p.id === source.slice('provider:'.length))?.name || 'this provider'}
          </span>
          . Edit it in API Keys.
        </p>
      )}
    </div>
  );
}

function FieldControl({ field, config, onChange }: { field: NodeField; config: Record<string, any>; onChange: (p: ConfigPatch) => void }) {
  const value = config[field.key] ?? field.default;
  const set = (v: any) => onChange({ [field.key]: v });

  switch (field.type) {
    case 'credential':
      return <CredentialField config={config} onChange={onChange} />;

    case 'textarea':
      return (
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => set(e.target.value)}
          rows={field.rows || 4}
          placeholder={field.placeholder}
          className={`w-full bg-[#141624] border border-[#1f2235] rounded p-3 text-xs text-white focus:outline-none focus:border-[#5b5eff] font-mono`}
        />
      );

    case 'code':
      return (
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => set(e.target.value)}
          rows={field.rows || 8}
          spellCheck={false}
          className="w-full h-48 bg-[#0d0e1b] border border-[#1f2235] rounded p-3 text-xs text-[#00f5d4] focus:outline-none focus:border-[#b8ff57] font-mono"
        />
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
      return (
        <input
          type="password"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => set(e.target.value)}
          placeholder={field.placeholder}
          autoComplete="off"
          className={`${inputCls} font-mono`}
        />
      );

    case 'text':
    default:
      return (
        <input
          type="text"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => set(e.target.value)}
          placeholder={field.placeholder}
          className={inputCls}
        />
      );
  }
}

export function SchemaFields({ schema, config, onChange }: SchemaFieldsProps) {
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
              <FieldControl field={field} config={config} onChange={onChange} />
              {field.help && <p className={helpCls}>{field.help}</p>}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
