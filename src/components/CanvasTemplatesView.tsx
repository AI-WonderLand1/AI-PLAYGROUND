import { useState } from 'react';
import { WORKFLOW_TEMPLATES } from '../data/workflowTemplates';
import { cn } from '../utils';
import { Search, Layers, ArrowRight, Zap } from 'lucide-react';

interface CanvasTemplatesViewProps {
  onLoadToCanvas?: (templateId: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  trigger: '#ffc147',
  app: '#5b5eff',
  core: '#00f5d4',
  ai: '#ff3d6b',
  dream_maker: '#b8ff57',
  storage: '#9d6bff',
  ai_models: '#ff8c42',
  output_parsers: '#4dd0e1',
  ai_tools: '#f06292',
};

export function CanvasTemplatesView({ onLoadToCanvas }: CanvasTemplatesViewProps) {
  const [query, setQuery] = useState('');

  const filtered = WORKFLOW_TEMPLATES.filter(tpl => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      tpl.name.toLowerCase().includes(q) ||
      tpl.description.toLowerCase().includes(q) ||
      tpl.nodes.some(n => n.label.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-6 scrollbar-thin">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] text-[#b8ff57] bg-[#b8ff57]/10 px-2 py-0.5 rounded w-max uppercase tracking-widest font-mono mb-2">
              CANVAS TEMPLATES
            </div>
            <h2 className="text-sm font-bold font-mono text-[#E4E3E0] uppercase tracking-widest">
              Pre-built Workflows
            </h2>
            <p className="text-[10px] font-mono text-[#5e6686] mt-1">
              {WORKFLOW_TEMPLATES.length} canvas-native templates &middot; load one onto the AI-Wonder grid and wire it up
            </p>
          </div>
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#555]" />
            <input
              type="text"
              placeholder="Search templates..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#141414]/90 border border-[#2a2a2a] text-[10px] pl-8 pr-3 py-2 rounded-sm focus:outline-none focus:border-[#b8ff57] font-mono text-[#E4E3E0] transition-all placeholder-[#555]"
            />
          </div>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(tpl => {
              const chain = tpl.connections
                .slice(0, 6)
                .map(c => {
                  const from = tpl.nodes.find(n => n.id === c.fromId);
                  const to = tpl.nodes.find(n => n.id === c.toId);
                  if (!from || !to) return null;
                  return { from, to };
                })
                .filter(Boolean) as { from: typeof tpl.nodes[number]; to: typeof tpl.nodes[number] }[];
              const firstNode = tpl.nodes[0];

              return (
                <div
                  key={tpl.id}
                  className="bg-[#0c0d12] border border-[#1f2235] rounded p-4 hover:border-[#b8ff57]/40 transition-colors group flex flex-col"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-xs font-mono font-bold text-[#E4E3E0] group-hover:text-[#b8ff57] transition-colors leading-snug">
                      {tpl.name}
                    </h4>
                    <span className="shrink-0 flex items-center gap-1 text-[8px] font-mono text-[#5e6686] border border-[#1f2235] px-1.5 py-0.5 rounded">
                      <Layers className="w-2.5 h-2.5" />
                      {tpl.nodeCount} nodes
                    </span>
                  </div>

                  <p className="text-[10px] font-mono text-[#888] leading-relaxed mb-3">
                    {tpl.description}
                  </p>

                  {/* Node chain preview */}
                  {chain.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mb-3">
                      {(() => {
                        const labels: { label: string; category: string }[] = [];
                        const seen = new Set<string>();
                        if (firstNode) {
                          labels.push({ label: firstNode.label, category: firstNode.category });
                          seen.add(firstNode.id);
                        }
                        chain.forEach(({ to }) => {
                          if (!seen.has(to.id)) {
                            labels.push({ label: to.label, category: to.category });
                            seen.add(to.id);
                          }
                        });
                        const shown = labels.slice(0, 4);
                        return shown.map((n, i) => (
                          <span key={i} className="flex items-center gap-1">
                            {i > 0 && <ArrowRight className="w-2.5 h-2.5 text-[#444]" />}
                            <span
                              className="text-[8px] font-mono px-1.5 py-0.5 rounded border"
                              style={{
                                borderColor: (CATEGORY_COLORS[n.category] || '#555') + '55',
                                color: CATEGORY_COLORS[n.category] || '#999',
                                background: (CATEGORY_COLORS[n.category] || '#555') + '11',
                              }}
                            >
                              {n.label}
                            </span>
                          </span>
                        ));
                      })()}
                      {tpl.nodeCount > 4 && (
                        <span className="text-[8px] font-mono text-[#555]">+{tpl.nodeCount - 4}</span>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => onLoadToCanvas?.(tpl.id)}
                    disabled={!onLoadToCanvas}
                    className={cn(
                      'mt-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition-all',
                      onLoadToCanvas
                        ? 'bg-[#b8ff57] text-black hover:bg-[#a5e64e] cursor-pointer'
                        : 'bg-[#141414] text-[#555] border border-[#2a2a2a] cursor-not-allowed'
                    )}
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    Load to Canvas
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#0c0d12] border border-[#1f2235] rounded space-y-2">
            <Search className="w-8 h-8 mx-auto text-[#444]" />
            <h3 className="text-xs font-mono font-bold text-[#E4E3E0] uppercase tracking-wider">No templates match</h3>
            <p className="text-[10px] font-mono text-[#555]">Try a different search query.</p>
          </div>
        )}

      </div>
    </div>
  );
}
