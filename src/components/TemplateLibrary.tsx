import { useState, useEffect, useCallback } from 'react';
import { LibTemplate, loadLocalState, saveLocalState } from '../data/templateLibrary';
import { cn } from '../utils';
import { Globe, Lock, Plus, Trash2, CheckCircle, Circle, Download, Eye } from 'lucide-react';

const API = '/api/templates';

export function TemplateLibrary() {
  const [templates, setTemplates] = useState<LibTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [localState, setLocalState] = useState<Record<string, any>>({});
  const [newTodo, setNewTodo] = useState('');
  const [activeTodoFile, setActiveTodoFile] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ file: string; content: any } | null>(null);

  useEffect(() => { setLocalState(loadLocalState()); }, []);
  useEffect(() => { saveLocalState(localState); }, [localState]);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(API);
      if (res.ok) setTemplates(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const toggleVisibility = async (file: string, current: string) => {
    const next = current === 'public' ? 'private' : 'public';
    setTemplates(prev => prev.map(t => t.file === file ? { ...t, visibility: next as any } : t));
    await fetch(API + '/' + encodeURIComponent(file) + '/meta', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility: next }),
    });
  };

  const addTodo = async (file: string) => {
    if (!newTodo.trim()) return;
    await fetch(API + '/' + encodeURIComponent(file) + '/todo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newTodo.trim() }),
    });
    setNewTodo('');
    fetchTemplates();
  };

  const toggleTodo = async (file: string, idx: number) => {
    await fetch(API + '/' + encodeURIComponent(file) + '/todo/' + idx, { method: 'PATCH' });
    fetchTemplates();
  };

  const deleteTemplate = async (file: string) => {
    await fetch(API + '/' + encodeURIComponent(file), { method: 'DELETE' });
    fetchTemplates();
  };

  const previewTemplate = async (file: string) => {
    const res = await fetch(API + '/' + encodeURIComponent(file));
    if (res.ok) setPreview({ file, content: await res.json() });
  };

  const downloadTemplate = (file: string) => {
    fetch(API + '/' + encodeURIComponent(file))
      .then(r => r.json())
      .then(data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = file; a.click();
        URL.revokeObjectURL(url);
      });
  };

  const publicTemplates = templates.filter(t => t.visibility === 'public');
  const privateTemplates = templates.filter(t => t.visibility !== 'public');

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex items-center gap-3 font-mono text-[#b8ff57] text-xs">
        <div className="w-3 h-3 bg-[#b8ff57] animate-spin rounded-full" />
        Loading templates...
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-6 scrollbar-thin">
      <div className="max-w-6xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold font-mono text-[#E4E3E0] uppercase tracking-widest">
              Template Library
            </h2>
            <p className="text-[10px] font-mono text-[#5e6686] mt-1">
              {templates.length} templates &middot; {publicTemplates.length} public
            </p>
          </div>
          <button onClick={fetchTemplates} className="text-[10px] font-mono text-[#5b5eff] hover:text-[#b8ff57] transition-colors uppercase tracking-wider">
            Refresh
          </button>
        </div>

        <section>
          <h3 className="text-[10px] font-mono text-[#b8ff57] uppercase tracking-widest mb-3 flex items-center gap-2">
            <Globe className="w-3 h-3" /> Public Templates
          </h3>
          {publicTemplates.length === 0 ? (
            <div className="text-[11px] font-mono text-[#555] bg-[#0c0d12] border border-[#1f2235] rounded p-6 text-center">
              No public templates yet. Toggle to public.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {publicTemplates.map(tpl => renderCard(tpl))}
            </div>
          )}
        </section>

        <section>
          <h3 className="text-[10px] font-mono text-[#5e6686] uppercase tracking-widest mb-3 flex items-center gap-2">
            <Lock className="w-3 h-3" /> Private Templates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {privateTemplates.map(tpl => renderCard(tpl))}
          </div>
        </section>

      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6" onClick={() => setPreview(null)}>
          <div className="bg-[#0c0d12] border border-[#1f2235] rounded max-w-3xl w-full max-h-[80vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono text-[#E4E3E0] uppercase tracking-wider">{preview.file}</h3>
              <button onClick={() => setPreview(null)} className="text-[10px] text-[#5e6686] hover:text-white">Close</button>
            </div>
            <pre className="text-[10px] font-mono text-[#888] bg-[#08080c] p-4 rounded border border-[#1f2235] overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(preview.content, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );

  function renderCard(tpl: LibTemplate) {
    const local = localState[tpl.file] || {};
    return (
      <div key={tpl.file} className="bg-[#0c0d12] border border-[#1f2235] rounded p-4 hover:border-[#5b5eff]/40 transition-colors group">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-mono font-bold text-[#E4E3E0] truncate">{tpl.name}</h4>
            <p className="text-[9px] font-mono text-[#5e6686] mt-0.5 truncate">{tpl.file}</p>
          </div>
          <button
            onClick={() => toggleVisibility(tpl.file, tpl.visibility)}
            className={cn(
              'ml-2 p-1 rounded transition-colors',
              tpl.visibility === 'public'
                ? 'text-[#b8ff57] hover:bg-[#b8ff57]/10'
                : 'text-[#5e6686] hover:bg-[#555]/10'
            )}
            title={tpl.visibility === 'public' ? 'Make private' : 'Make public'}
          >
            {tpl.visibility === 'public' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          </button>
        </div>

        {tpl.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {tpl.tags.map(tag => (
              <span key={tag} className="text-[8px] font-mono bg-[#5b5eff]/10 text-[#5b5eff] px-1.5 py-0.5 rounded uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="text-[9px] font-mono text-[#555] flex items-center gap-3 mb-3">
          <span>{(tpl.size / 1024).toFixed(1)} KB</span>
          <span>{new Date(tpl.modified).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => previewTemplate(tpl.file)} className="text-[9px] font-mono text-[#5b5eff] hover:text-white flex items-center gap-1">
            <Eye className="w-2.5 h-2.5" /> Preview
          </button>
          <button onClick={() => downloadTemplate(tpl.file)} className="text-[9px] font-mono text-[#5b5eff] hover:text-white flex items-center gap-1">
            <Download className="w-2.5 h-2.5" /> Download
          </button>
          <button onClick={() => setActiveTodoFile(activeTodoFile === tpl.file ? null : tpl.file)} className="text-[9px] font-mono text-[#5b5eff] hover:text-white flex items-center gap-1">
            <CheckCircle className="w-2.5 h-2.5" /> Todo ({tpl.todo.length})
          </button>
          <button onClick={() => deleteTemplate(tpl.file)} className="text-[9px] font-mono text-[#ff5757]/60 hover:text-[#ff5757] flex items-center gap-1 ml-auto">
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>

        {activeTodoFile === tpl.file && (
          <div className="mt-3 pt-3 border-t border-[#1f2235] space-y-2">
            <div className="flex items-center gap-2">
              <input
                value={newTodo}
                onChange={e => setNewTodo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTodo(tpl.file)}
                placeholder="Add todo..."
                className="flex-1 bg-[#141414] border border-[#2a2a2a] text-[10px] px-2 py-1 rounded text-[#E4E3E0] focus:outline-none focus:border-[#5b5eff]"
              />
              <button onClick={() => addTodo(tpl.file)} className="text-[#b8ff57] hover:text-white">
                <Plus className="w-3 h-3" />
              </button>
            </div>
            {tpl.todo.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[10px] font-mono">
                <button onClick={() => toggleTodo(tpl.file, idx)} className="text-[#5e6686] hover:text-[#b8ff57]">
                  {item.done ? <CheckCircle className="w-3 h-3 text-[#b8ff57]" /> : <Circle className="w-3 h-3" />}
                </button>
                <span className={cn(item.done ? 'line-through text-[#444]' : 'text-[#888]')}>{item.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}
