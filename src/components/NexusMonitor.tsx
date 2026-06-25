import React, { useState, useRef, useEffect } from 'react';
import { Eye, ShieldAlert, Cpu, Trash2, Code, Key, Copy, Check, Terminal, ExternalLink, HelpCircle } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { NexusEvent } from '../types';
import { cn, getOpenRouterModel } from '../utils';

interface NexusMonitorProps {
  events: NexusEvent[];
  onClearEvents: () => void;
  onDismissEvent: (id: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  js_error: 'JS RUNTIME',
  unhandled_promise: 'REJECTION',
  network: 'NETWORK FAIL',
  broken_link: 'BROKEN LINK',
  missing_asset: 'ASSET FAIL',
  html_issue: 'HTML/A11Y',
  css_issue: 'CSS STYLE',
  react_error: 'REACT ERR',
  ts_error: 'TS BUILD',
};

const SEVERITY_COLORS = {
  error: '#ff3d6b',
  warning: '#ffc147',
  info: '#5b5eff',
};

export function NexusMonitor({ events, onClearEvents, onDismissEvent }: NexusMonitorProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [activeChip, setActiveChip] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI analyses states
  const [aiExplanations, setAiExplanations] = useState<Record<string, { explanation: string; fix: string; loading: boolean }>>({});

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Neural canvas background logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Nodes logic
    const nodeCount = Math.floor((width * height) / 25000) || 12;
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      radius: Math.random() * 2 + 1,
      color: '#5b5eff',
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Lines
      nodes.forEach((n, i) => {
        nodes.slice(i + 1).forEach((m) => {
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = `rgba(91, 94, 255, ${Math.max(0, (180 - dist) / 180) * 0.1})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        });
      });

      // Draw Nodes
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(91, 94, 255, 0.25)';
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const handleCopy = (ev: NexusEvent) => {
    navigator.clipboard.writeText(JSON.stringify(ev, null, 2));
    setCopiedId(ev.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFetchAIAnalysis = async (ev: NexusEvent) => {
    if (aiExplanations[ev.id]) return;

    setAiExplanations(prev => ({
      ...prev,
      [ev.id]: { explanation: '', fix: '', loading: true }
    }));

    const callLLM = async (prompt: string) => {
      const openrouterKey = localStorage.getItem('mc_key_openrouter');
      if (openrouterKey) {
        const model = getOpenRouterModel('gemini-3-flash-preview') || 'google/gemini-2.0-flash-001';
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openrouterKey}` },
          body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.3 }),
        });
        if (res.ok) {
          const data = await res.json();
          return data.choices?.[0]?.message?.content || '';
        }
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      return response.text || '';
    };

    try {
      const prompt = `You are an elite DevOps & Site Reliability Engineer. 
Analyze the following runtime client-side event/error logs:
- Message: ${ev.message}
- Severity: ${ev.severity}
- Type: ${ev.type}
- Source: ${ev.source || 'Unknown'}
- Line: ${ev.line || 'Unknown'}
- Stack: ${ev.stack || 'None'}

Please respond with direct actionable feedback. Limit explanation to 2-3 sentences. Format the fix code block beautifully.
Respond ONLY with a JSON parsable string having the fields "explanation" and "fix". No other wrapper text or markdown:
{"explanation": "Cause and impact of error...", "fix": "Code snippet or diagnostic instructions"}`;

      const textResponse = await callLLM(prompt);
      const cleaned = textResponse.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      setAiExplanations(prev => ({
        ...prev,
        [ev.id]: {
          explanation: parsed.explanation || 'Analyzed successfully.',
          fix: parsed.fix || 'Check runtime context.',
          loading: false,
        }
      }));
    } catch (err) {
      console.error('Error analyzing via AI:', err);
      setAiExplanations(prev => ({
        ...prev,
        [ev.id]: {
          explanation: 'Unable to query AI explanation.',
          fix: 'Code: ' + (err instanceof Error ? err.message : 'Analysis error'),
          loading: false,
        }
      }));
    }
  };

  const filteredEvents = events.filter(e => {
    const matchesTab = activeTab === 'all' || e.type === activeTab || (activeTab === 'errors' && e.severity === 'error') || (activeTab === 'warnings' && e.severity === 'warning');
    const matchesChip = activeChip === 'all' || e.severity === activeChip;
    const matchesSearch = e.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (e.source || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesChip && matchesSearch;
  });

  const errorCount = events.filter(e => e.severity === 'error').length;
  const warningCount = events.filter(e => e.severity === 'warning').length;
  const jsCount = events.filter(e => e.type === 'js_error').length;
  const netCount = events.filter(e => e.type === 'network').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#04050a] relative overflow-hidden">
      {/* Background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-30 z-0" />

      {/* Header bar */}
      <div className="h-16 border-b border-[#1e2235] flex items-center justify-between px-8 bg-[#080a12]/90 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-[#00f5d4]" />
          <div>
            <h1 className="font-serif italic text-sm text-[#E4E3E0] uppercase tracking-widest leading-none mb-1">Nexus Site Intelligence</h1>
            <span className="text-[8px] font-mono text-[#5b5eff] uppercase tracking-tighter">Event & Error Monitoring Gateway</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 border border-[#1e2235]">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", errorCount > 0 ? "bg-[#ff3d6b]" : "bg-[#00e5a0]")} />
            <span className="text-[9px] font-mono tracking-widest text-[#888] uppercase">
              {errorCount > 0 ? `${errorCount} Active Alert` : 'Site Secure'}
            </span>
          </div>
          <button
            onClick={onClearEvents}
            className="px-3 py-1.5 border border-[#1e2235] text-[9px] font-mono text-[#888] hover:text-red-500 hover:border-red-500/30 transition-all uppercase"
          >
            Clear Log
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-4 divide-x divide-[#151828] border-b border-[#151828] bg-[#080a12]/50 z-10 shrink-0 font-mono">
        {[
          { label: 'ERRORS', value: errorCount, color: '#ff3d6b' },
          { label: 'WARNINGS', value: warningCount, color: '#ffc147' },
          { label: 'JS RUNTIME', value: jsCount, color: '#00f5d4' },
          { label: 'NETWORK CONNS', value: netCount, color: '#5b5eff' },
        ].map((m, idx) => (
          <div key={idx} className="p-4 flex items-center justify-between">
            <span className="text-[10px] text-[#4a5068] tracking-widest">{m.label}</span>
            <span style={{ color: m.color }} className="text-xl font-bold tracking-tighter">
              {m.value}
            </span>
          </div>
        ))}
      </div>

      {/* Workspace Inner */}
      <div className="flex-1 flex overflow-hidden z-10">
        {/* Navigation Sidebar */}
        <aside className="w-56 border-r border-[#151828] bg-[#080a12]/80 p-4 space-y-4 shrink-0 overflow-y-auto">
          <div className="text-[8px] font-mono text-[#4a5068] tracking-widest uppercase">// Views</div>
          <div className="space-y-1">
            {[
              { id: 'all', label: 'All Events', icon: '▣' },
              { id: 'errors', label: 'Errors', icon: '⬡' },
              { id: 'warnings', label: 'Warnings', icon: '◈' },
            ].map(tabItem => (
              <button
                key={tabItem.id}
                onClick={() => {
                  setActiveTab(tabItem.id);
                  setExpandedCardId(null);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-xs transition-all flex items-center gap-2 font-mono",
                  activeTab === tabItem.id ? "bg-[#1e2235]/50 text-[#00f5d4] border-l-2 border-[#00f5d4] pl-2" : "text-[#4a5068] hover:text-[#e8eaf6]"
                )}
              >
                <span>{tabItem.icon}</span>
                <span>{tabItem.label}</span>
              </button>
            ))}
          </div>

          <div className="text-[8px] font-mono text-[#4a5068] tracking-widest uppercase pt-2">// Categories</div>
          <div className="space-y-1">
            {Object.keys(TYPE_LABELS).map(key => (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key);
                  setExpandedCardId(null);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-xs transition-all flex items-center gap-2 font-mono",
                  activeTab === key ? "bg-[#1e2235]/50 text-[#00f5d4] border-l-2 border-[#00f5d4] pl-2" : "text-[#4a5068] hover:text-[#e8eaf6]"
                )}
              >
                <span>◈</span>
                <span>{TYPE_LABELS[key]}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Content feed area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/20">
          {/* Toolbar */}
          <div className="p-4 border-b border-[#151828] bg-[#080a12]/60 flex items-center gap-3 shrink-0">
            <input
              type="text"
              placeholder="// Search telemetry events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-[#151828]/50 border border-[#1e2235] text-xs font-mono px-3 py-2 text-[#e8eaf6] focus:outline-none focus:border-[#00f5d4]"
            />
            <div className="flex gap-1.5 shrink-0">
              {(['all', 'error', 'warning', 'info'] as const).map(ch => (
                <button
                  key={ch}
                  onClick={() => setActiveChip(ch)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-mono uppercase transition-all border",
                    activeChip === ch
                      ? "bg-[#5b5eff] text-white border-[#5b5eff]"
                      : "bg-transparent border-[#1e2235] text-[#4a5068] hover:text-[#e8eaf6]"
                  )}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Log Feed scroll container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {filteredEvents.map(ev => {
              const isExpanded = expandedCardId === ev.id;
              const sevColor = SEVERITY_COLORS[ev.severity] || '#5b5eff';
              const isCopied = copiedId === ev.id;
              const aiData = aiExplanations[ev.id];

              return (
                <div
                  key={ev.id}
                  className="bg-[#0c0e18] border border-[#151828] hover:border-[#1e2235] transition-all rounded-md overflow-hidden"
                >
                  {/* Top Header details */}
                  <div
                    onClick={() => {
                      setExpandedCardId(isExpanded ? null : ev.id);
                      if (!isExpanded) handleFetchAIAnalysis(ev);
                    }}
                    className="p-4 flex items-start gap-4 cursor-pointer"
                  >
                    <div
                      style={{ background: sevColor, boxShadow: `0 0 8px ${sevColor}` }}
                      className="w-2.5 h-2.5 rounded-full mt-1 shrink-0 animate-pulse"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span
                          style={{ borderColor: sevColor, color: sevColor }}
                          className="px-2 py-0.5 border text-[8px] font-mono font-bold tracking-widest uppercase bg-transparent"
                        >
                          {ev.severity}
                        </span>
                        <span className="text-[9px] font-mono bg-white/5 px-1.5 py-0.5 text-[#4a5068]">
                          {TYPE_LABELS[ev.type] || ev.type.toUpperCase()}
                        </span>
                        <span className="text-[9px] font-mono text-[#4a5068] ml-auto">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-mono text-[#e8eaf6] font-bold leading-relaxed line-clamp-2">
                        {ev.message}
                      </h4>
                      {(ev.source || ev.line) && (
                        <div className="text-[10px] text-[#4a5068] font-mono mt-1.5 flex gap-4">
                          {ev.source && <span className="truncate">Source: {ev.source}</span>}
                          {ev.line && <span>Line: {ev.line}</span>}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => onDismissEvent(ev.id)}
                        className="p-1.5 hover:bg-red-500/10 text-[#4a5068] hover:text-red-500 transition-colors"
                        title="Dismiss Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCopy(ev)}
                        className="p-1.5 hover:bg-[#5b5eff]/10 text-[#4a5068] hover:text-[#00f5d4] transition-colors"
                        title="Copy Telemetry JSON"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded block with Stack Trace and Gemini explanation */}
                  {isExpanded && (
                    <div className="p-4 bg-[#0a0c14] border-t border-[#151828] space-y-4">
                      {ev.stack && (
                        <div className="space-y-1">
                          <span className="block text-[8px] font-mono text-[#4a5068] uppercase tracking-wider">Console Stack Trace</span>
                          <pre className="bg-[#02030a] border border-[#151828] p-3 text-[10px] text-red-400 font-mono overflow-x-auto leading-relaxed max-h-40 overflow-y-auto">
                            {ev.stack}
                          </pre>
                        </div>
                      )}

                      <div className="p-4 border border-[#5b5eff]/15 bg-[#5b5eff]/3 rounded-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#5b5eff] to-transparent" />
                        <div className="flex items-center gap-2 mb-2">
                          <Cpu className="w-3.5 h-3.5 text-[#00f5d4]" />
                          <span className="text-[8px] font-mono text-[#00f5d4] tracking-widest uppercase">NEXUS COGNITIVE RUNTIME ANALYSIS</span>
                        </div>

                        {aiData?.loading ? (
                          <div className="flex items-center gap-1.5 py-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00f5d4]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00f5d4] delay-75" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00f5d4] delay-150" />
                          </div>
                        ) : (
                          <div className="space-y-3 font-mono">
                            <p className="text-xs text-[#8090b0] leading-relaxed">
                              {aiData?.explanation}
                            </p>
                            {aiData?.fix && (
                              <div className="space-y-1 pt-1">
                                <span className="block text-[8px] text-[#4a5068] uppercase tracking-wider">Diagnostic Fix Blueprint</span>
                                <pre className="bg-[#01020a] border border-emerald-500/15 p-3 text-xs text-[#00e5a0] overflow-x-auto leading-relaxed whitespace-pre-wrap">
                                  {aiData.fix}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredEvents.length === 0 && (
              <div className="text-center py-20 font-mono text-[10px] text-[#4a5068] tracking-widest">
                AWAITING SITE TELEMETRY DATA STREAM
              </div>
            )}
          </div>

          {/* Integration setup guideline snippet */}
          <div className="p-4 bg-[#080a12]/90 border-t border-[#1e2235] shrink-0 font-mono text-[10px] text-[#4a5068] leading-relaxed flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#5b5eff]" />
              <span>Integrate Nexus script: <code>{`<script src="nexus-monitor.js"></script>`}</code> to capture telemetry and forward client bugs automatically.</span>
            </div>
            <button className="text-[#00f5d4] hover:underline flex items-center gap-1 shrink-0 ml-4">
              <span>Setup Guide</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
