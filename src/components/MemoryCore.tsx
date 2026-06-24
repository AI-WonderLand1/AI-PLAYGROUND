import React, { useState, useRef, useEffect } from 'react';
import { Network, Search, Plus, Trash2, FileCode, Check, Download, Upload, AlertCircle } from 'lucide-react';
import { MemoryNode } from '../types';
import { cn } from '../utils';

interface MemoryCoreProps {
  memories: MemoryNode[];
  onAddMemory: (node: Omit<MemoryNode, 'id' | 'ts'> & { id?: string }) => void;
  onDeleteMemory: (id: string) => void;
  onImportMemories: (imported: MemoryNode[]) => void;
}

const TYPE_COLORS = {
  decision: '#b8ff57',
  bug: '#ff4560',
  pattern: '#38c8ff',
  context: '#b04cff',
  file: '#ffad33',
  note: '#00e8c6',
};

export function MemoryCore({ memories, onAddMemory, onDeleteMemory, onImportMemories }: MemoryCoreProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // Form State
  const [formType, setFormType] = useState<MemoryNode['type']>('decision');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Sync Form with Selected Node
  useEffect(() => {
    if (selectedNodeId) {
      const selectedNode = memories.find(m => m.id === selectedNodeId);
      if (selectedNode) {
        setFormType(selectedNode.type);
        setFormTitle(selectedNode.title);
        setFormContent(selectedNode.content);
      }
    } else {
      setFormTitle('');
      setFormContent('');
    }
  }, [selectedNodeId, memories]);

  // Graph physics / render logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const parent = canvas.parentElement;
    const width = parent ? parent.getBoundingClientRect().width : 600;
    const height = 220;
    canvas.width = width;
    canvas.height = height;

    interface GraphNode {
      id: string;
      x: number;
      y: number;
      vx: number;
      vy: number;
      type: MemoryNode['type'];
      title: string;
      pulse: number;
    }

    const gNodes: GraphNode[] = memories.map(m => ({
      id: m.id,
      x: 30 + Math.random() * (width - 60),
      y: 30 + Math.random() * (height - 60),
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      type: m.type,
      title: m.title,
      pulse: selectedNodeId === m.id ? 1 : 0,
    }));

    const gEdges: [number, number][] = [];
    gNodes.forEach((n, i) => {
      gNodes.slice(i + 1).forEach((m, j) => {
        if (n.type === m.type || Math.random() < 0.15) {
          gEdges.push([i, i + 1 + j]);
        }
      });
    });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Render Connections
      gEdges.forEach(([a, b]) => {
        const n = gNodes[a];
        const m = gNodes[b];
        if (!n || !m) return;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = 'rgba(184, 255, 87, 0.05)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // Render Nodes
      gNodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 10 || n.x > width - 10) n.vx *= -1;
        if (n.y < 10 || n.y > height - 10) n.vy *= -1;

        const color = TYPE_COLORS[n.type] || '#6b7394';
        const isSelected = selectedNodeId === n.id;
        const radius = isSelected ? 8 : 4.5;

        // Render selected glow/pulse
        if (n.pulse > 0) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + 10 * n.pulse, 0, Math.PI * 2);
          ctx.fillStyle = color + '15';
          ctx.fill();
          n.pulse = Math.max(0, n.pulse - 0.03);
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? color : color + '80';
        ctx.fill();

        if (isSelected) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius + 2.5, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let clickedNodeId: string | null = null;
      gNodes.forEach(n => {
        const dx = n.x - mx;
        const dy = n.y - my;
        if (Math.sqrt(dx * dx + dy * dy) < 14) {
          clickedNodeId = n.id;
        }
      });

      if (clickedNodeId) {
        setSelectedNodeId(clickedNodeId);
        const nodeIndex = gNodes.findIndex(gn => gn.id === clickedNodeId);
        if (nodeIndex > -1) gNodes[nodeIndex].pulse = 1;
      } else {
        setSelectedNodeId(null);
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [memories, selectedNodeId]);

  const handleSaveMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    onAddMemory({
      id: selectedNodeId || undefined,
      title: formTitle.trim(),
      content: formContent.trim(),
      type: formType,
    });

    setFormTitle('');
    setFormContent('');
    setSelectedNodeId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    processFiles(files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = event.target?.result as string;
        try {
          // Check if it's a JSON export of memory core
          const data = JSON.parse(textContent);
          if (data.memories && Array.isArray(data.memories)) {
            onImportMemories(data.memories);
            return;
          }
        } catch {
          // Fallback to plain text import
        }

        const extension = file.name.split('.').pop() || 'txt';
        const type: MemoryNode['type'] = ['js', 'ts', 'tsx', 'jsx', 'py'].includes(extension) ? 'file' : extension === 'md' ? 'note' : 'file';
        
        onAddMemory({
          title: file.name,
          content: `Codebase File: ${file.name}\n\n${textContent}`,
          type,
        });
      };
      reader.readAsText(file);
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ project: 'AI Playground Project', memories, exported: new Date().toISOString() }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memory-core-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredMemories = memories.filter(m => {
    const matchFilter = activeFilter === 'all' || m.type === activeFilter;
    const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        m.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="flex-1 flex bg-[#0a0a0a] h-full overflow-hidden">
      {/* Left panel: search and memories list */}
      <div className="w-80 h-full border-r border-[#2a2a2a] bg-[#141414] flex flex-col overflow-hidden shrink-0">
        <div className="p-4 border-b border-[#2a2a2a] bg-[#0a0a0a]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[#E4E3E0]">
              <Network className="w-4 h-4 text-[#b8ff57]" />
              <span className="font-serif italic text-xs uppercase tracking-widest">// Memory Core</span>
            </div>
            <span className="text-[10px] font-mono text-[#b8ff57]">{memories.length} nodes</span>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#555]" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141414] border border-[#2a2a2a] pl-8 pr-3 py-2 text-[11px] text-[#E4E3E0] font-mono focus:outline-none focus:border-[#b8ff57] placeholder-[#444]"
            />
          </div>

          {/* Types Filters */}
          <div className="flex flex-wrap gap-1.5">
            {['all', 'decision', 'bug', 'pattern', 'context', 'file', 'note'].map(t => (
              <button
                key={t}
                onClick={() => setActiveFilter(t)}
                style={activeFilter === t && t !== 'all' ? { borderColor: TYPE_COLORS[t as MemoryNode['type']], color: '#141414', background: TYPE_COLORS[t as MemoryNode['type']] } : {}}
                className={cn(
                  "px-2 py-0.5 border text-[9px] font-mono transition-all",
                  activeFilter === t && t === 'all'
                    ? "bg-[#E4E3E0] border-[#E4E3E0] text-[#141414]"
                    : "bg-transparent border-[#2a2a2a] text-[#555] hover:border-[#444]"
                )}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic canvas node map visualization */}
        <div className="border-b border-[#2a2a2a] bg-[#0d0d0d] shrink-0 relative">
          <canvas ref={canvasRef} className="block cursor-crosshair w-full" />
          <div className="absolute top-2 right-2 text-[8px] font-mono text-[#555] pointer-events-none uppercase tracking-wider">Interactive Map</div>
        </div>

        {/* Drag and Drop */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileIn')?.click()}
          className={cn(
            "m-3 p-4 border border-dashed text-center rounded-sm cursor-pointer transition-all shrink-0 font-mono text-[10px]",
            dragOver ? "border-[#b8ff57] bg-[#b8ff57]/5 text-[#b8ff57]" : "border-[#2a2a2a] text-[#555] hover:border-[#444]"
          )}
        >
          <Upload className="w-4 h-4 mx-auto mb-1.5" />
          <span>DROP FILE OR CLICK TO IMPORT</span>
          <input
            type="file"
            id="fileIn"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept=".js,.ts,.tsx,.jsx,.py,.md,.txt,.json,.css,.html"
          />
        </div>

        {/* Memory Items list */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
          {filteredMemories.map(m => (
            <div
              key={m.id}
              onClick={() => setSelectedNodeId(m.id)}
              className={cn(
                "p-3 border transition-all cursor-pointer relative",
                selectedNodeId === m.id
                  ? "bg-[#1c1d24] border-[#b8ff57]"
                  : "bg-[#0c0d12] border-[#222] hover:border-[#333]"
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  style={{ color: TYPE_COLORS[m.type] }}
                  className="text-[8px] font-mono font-bold tracking-widest uppercase"
                >
                  {m.type}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteMemory(m.id);
                  }}
                  className="text-[#444] hover:text-red-500 transition-colors p-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <h4 className="text-xs font-semibold text-[#E4E3E0] mb-1 leading-tight truncate">{m.title}</h4>
              <p className="text-[10px] text-[#888] font-mono leading-relaxed truncate">{m.content}</p>
            </div>
          ))}

          {filteredMemories.length === 0 && (
            <div className="text-center py-12 font-mono text-[10px] text-[#444] tracking-widest">
              NO MEMORY NODES FOUND
            </div>
          )}
        </div>
      </div>

      {/* Main Panel - Editor and Info */}
      <div className="flex-1 h-full p-8 overflow-y-auto flex flex-col max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-4">
          <div>
            <h2 className="font-serif italic text-lg text-[#E4E3E0] tracking-wider uppercase">
              {selectedNodeId ? 'Edit Project Node' : 'Initialize Node'}
            </h2>
            <p className="text-[10px] text-[#555] font-mono uppercase tracking-widest">Knowledge Engine Form</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 border border-[#2a2a2a] text-[10px] font-mono text-[#888] hover:text-[#E4E3E0] hover:border-[#E4E3E0] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT KNOWLEDGE GRAPH</span>
          </button>
        </div>

        {/* Node Editor Form */}
        <form onSubmit={handleSaveMemory} className="space-y-4 bg-[#141414] border border-[#2a2a2a] p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[9px] font-mono text-[#555] uppercase tracking-wider">Node Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as MemoryNode['type'])}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-xs text-[#E4E3E0] p-2 focus:outline-none focus:border-[#b8ff57] font-mono cursor-pointer"
              >
                <option value="decision">Decision</option>
                <option value="bug">Bug</option>
                <option value="pattern">Pattern</option>
                <option value="context">Context</option>
                <option value="file">File</option>
                <option value="note">Note</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[9px] font-mono text-[#555] uppercase tracking-wider">Node Name / Title</label>
              <input
                type="text"
                placeholder="e.g. Switched auth from custom to Firebase"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-xs text-[#E4E3E0] p-2 focus:outline-none focus:border-[#b8ff57] font-sans"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[9px] font-mono text-[#555] uppercase tracking-wider">Full Details & Logic Context</label>
            <textarea
              placeholder="Provide a detailed explanation of this file, bug fix, architectural design, decision context, or workflow details..."
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              rows={8}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-xs text-[#E4E3E0] p-3 focus:outline-none focus:border-[#b8ff57] font-sans leading-relaxed resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-[#b8ff57] hover:bg-[#c9ff7a] text-[#141414] text-xs font-mono py-2.5 font-bold transition-all uppercase tracking-wider"
            >
              {selectedNodeId ? 'Update Node Context' : 'Incorporate Node to Graph'}
            </button>
            {selectedNodeId && (
              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                className="border border-[#2a2a2a] hover:border-[#444] text-[#888] hover:text-[#E4E3E0] text-xs font-mono px-4 py-2.5 transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="flex gap-4 p-4 border border-[#2a2a2a] bg-[#0d0d0d] items-start">
          <AlertCircle className="w-5 h-5 text-[#b8ff57] shrink-0 mt-0.5" />
          <div className="space-y-1 font-mono text-[10px] text-[#555] leading-relaxed">
            <p className="text-[#888] font-serif italic text-xs mb-1">// Integration Blueprint & Prompt Grounds</p>
            <p>Every node incorporated into your **Memory Core** automatically maps onto your workspace knowledge graph. These nodes can be queried side-by-side inside your modules playground to construct custom grounding prompts and train your active Gemini AI models.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
