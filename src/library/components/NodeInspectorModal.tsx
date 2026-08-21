import React, { useState, useEffect } from 'react';
import { 
  X, 
  Code2, 
  Settings, 
  Key, 
  Copy, 
  Check, 
  Layers, 
  Info, 
  ExternalLink,
  Sliders,
  Sparkles
} from 'lucide-react';
import { N8nNode } from '../types';
import { getNodeMeta } from '../data/n8nNodesCatalog';

interface NodeInspectorModalProps {
  node: N8nNode | null;
  onClose: () => void;
  onUpdateParameters?: (nodeId: string, parameters: Record<string, any>) => void;
}

export const NodeInspectorModal: React.FC<NodeInspectorModalProps> = ({
  node,
  onClose,
  onUpdateParameters
}) => {
  const [activeTab, setActiveTab] = useState<'parameters' | 'json' | 'credentials'>('parameters');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (node) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [node, onClose]);

  if (!node) return null;

  const meta = getNodeMeta(node.type);

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(node, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-slate-900 rounded-3xl border border-white/15 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md font-bold text-sm"
              style={{ backgroundColor: meta.color }}
            >
              {meta.displayName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">
                  {node.name}
                </h3>
                {node.typeVersion && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    v{node.typeVersion}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {node.type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJSON}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Copy Node JSON"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-5 bg-slate-900 gap-4">
          <button
            onClick={() => setActiveTab('parameters')}
            className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'parameters'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Parameters & Config</span>
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Raw Node JSON</span>
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Auth / Credentials</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-950/40">
          {/* Tab 1: Parameters */}
          {activeTab === 'parameters' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Node Overview</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {meta.description}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Configured Node Parameters
                </label>
                {node.parameters && Object.keys(node.parameters).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(node.parameters).map(([key, value]) => (
                      <div
                        key={key}
                        className="p-3 rounded-2xl bg-slate-900 border border-white/10 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-pink-300">
                            {key}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {typeof value}
                          </span>
                        </div>
                        <pre className="text-xs text-slate-200 bg-slate-950/80 p-2 rounded-xl font-mono overflow-x-auto whitespace-pre-wrap">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No custom parameters defined for this node (default configuration).
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Raw JSON */}
          {activeTab === 'json' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Node Object Specification</span>
                <button
                  onClick={handleCopyJSON}
                  className="text-pink-400 hover:text-pink-300 font-semibold cursor-pointer"
                >
                  {copied ? 'Copied to clipboard' : 'Copy JSON'}
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-white/10 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed max-h-96">
                {JSON.stringify(node, null, 2)}
              </pre>
            </div>
          )}

          {/* Tab 3: Credentials */}
          {activeTab === 'credentials' && (
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                Required Security & API Credentials
              </label>

              {node.credentials && Object.keys(node.credentials).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(node.credentials).map(([credType, credObj]) => {
                    return (
                      <div
                        key={credType}
                        className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <Key className="w-4 h-4 text-amber-400" />
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-200 block">
                              {credType}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Account: {(credObj as { name?: string })?.name || 'Default Account'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                          Configured
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs space-y-2">
                  <Key className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                  <p>No special credentials required for this node.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Position: [{node.position[0]}, {node.position[1]}]</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-tiedye-gradient text-white font-bold cursor-pointer hover:brightness-110 shadow-md shadow-pink-500/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
