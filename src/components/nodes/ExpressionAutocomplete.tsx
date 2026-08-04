import React, { useEffect, useRef, useState } from 'react';

export interface NodeOutputInfo {
  output?: string;
}

export interface AutocompleteState {
  open: boolean;
  options: string[];
  active: number;
  exprStart: number;
  caret: number;
}

const BASE_TOKENS = ['$node', '$json', '$items', '$index', '$now', '$today'];

export function buildAutocompleteOptions(
  full: string,
  caret: number,
  nodeNames: string[],
  nodeOutputs: Record<string, NodeOutputInfo>,
): { options: string[]; exprStart: number } | null {
  const openIdx = full.lastIndexOf('{{', caret - 1);
  if (openIdx === -1) return null;
  const closeBefore = full.indexOf('}}', openIdx + 2);
  if (closeBefore !== -1 && closeBefore < caret) return null;
  const partial = full.slice(openIdx + 2, caret);

  let options: string[] = [];
  if (partial.trim() === '') {
    options = BASE_TOKENS;
  } else if (/^\$node\["[\w\s-]*"?$/.test(partial)) {
    const q = (partial.match(/\$node\["([^"]*)$/) || [])[1] || '';
    options = nodeNames
      .filter(n => n.toLowerCase().includes(q.toLowerCase()))
      .map(n => `$node["${n}"]`);
  } else if (partial.startsWith('$node')) {
    options = nodeNames.map(n => `$node["${n}"]`);
  } else if (/^\$node\["[^"]+"\]\.data$/.test(partial)) {
    options = ['.output'];
  } else if (/^\$node\["[^"]+"\]\.data\./.test(partial)) {
    const m = partial.match(/^\$node\["([^"]+)"\]\.data\.([\w$]*)$/);
    if (m) {
      const label = m[1];
      const rest = m[2] || '';
      const out = nodeOutputs[label]?.output;
      let keys: string[] = ['output'];
      if (out) {
        try {
          const obj = JSON.parse(out);
          keys = Array.from(new Set(['output', ...Object.keys(obj)]));
        } catch {
          /* keep default keys */
        }
      }
      options = keys.filter(k => k.startsWith(rest)).map(k => `.${k}`);
    }
  } else {
    options = BASE_TOKENS.filter(o => o.startsWith(partial));
  }

  if (options.length === 0) return null;
  return { options, exprStart: openIdx };
}

export function useExpressionAutocomplete(
  value: string,
  onChange: (next: string) => void,
  nodeNames: string[],
  nodeOutputs: Record<string, NodeOutputInfo>,
) {
  const fieldRef = useRef<any>(null);
  const [state, setState] = useState<AutocompleteState>({
    open: false,
    options: [],
    active: 0,
    exprStart: 0,
    caret: 0,
  });

  const compute = (full: string, caret: number) => {
    const res = buildAutocompleteOptions(full, caret, nodeNames, nodeOutputs);
    setState(res
      ? { open: true, options: res.options, active: 0, exprStart: res.exprStart, caret }
      : { open: false, options: [], active: 0, exprStart: 0, caret });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const el = e.target;
    const caret = el.selectionStart ?? el.value.length;
    compute(el.value, caret);
    onChange(el.value);
  };

  const close = () => setState(prev => ({ ...prev, open: false }));

  const select = (option: string) => {
    const closeBrace = value.slice(state.caret).startsWith('}}') ? '' : '}}';
    const next = value.slice(0, state.exprStart) + '{{' + option + closeBrace + value.slice(state.caret);
    onChange(next);
    close();
    requestAnimationFrame(() => {
      const el = fieldRef.current;
      if (el) {
        const pos = state.exprStart + 2 + option.length + closeBrace.length;
        el.setSelectionRange(pos, pos);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!state.open || state.options.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setState(prev => ({ ...prev, active: (prev.active + 1) % prev.options.length }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setState(prev => ({ ...prev, active: (prev.active - 1 + prev.options.length) % prev.options.length }));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (state.options[state.active]) {
        e.preventDefault();
        select(state.options[state.active]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  useEffect(() => {
    const el = fieldRef.current;
    if (el && state.open) {
      const caret = el.selectionStart ?? el.value.length;
      compute(el.value, caret);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return { fieldRef, state, handleChange, handleKeyDown, select, close };
}

export function ExpressionDropdown({ state }: { state: AutocompleteState }) {
  if (!state.open || state.options.length === 0) return null;
  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-40 overflow-y-auto rounded border border-[#2a2f4a] bg-[#0d0e1b] shadow-xl">
      {state.options.map((opt, i) => (
        <div
          key={opt}
          className={`px-3 py-1.5 text-[10px] font-mono cursor-pointer ${
            i === state.active ? 'bg-[#5b5eff] text-white' : 'text-[#b8ff57]'
          }`}
        >
          {opt}
        </div>
      ))}
    </div>
  );
}
