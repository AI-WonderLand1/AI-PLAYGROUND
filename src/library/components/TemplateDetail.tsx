import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Play, 
  Copy, 
  Check, 
  Layers, 
  Key, 
  CheckCircle2, 
  BookOpen, 
  Code2, 
  Terminal, 
  Share2, 
  ExternalLink,
  Clock,
  Sparkles,
  Shield,
  FileJson,
  Maximize2,
  Zap,
  ArrowRight
} from 'lucide-react';
import { WorkflowTemplate, N8nNode } from '../types';
import { WorkflowCanvas } from './WorkflowCanvas';
import { getNodeMeta } from '../data/n8nNodesCatalog';
import { NodeInspectorModal } from './NodeInspectorModal';

interface TemplateDetailProps {
  template: WorkflowTemplate;
  onBack: () => void;
  onImportToCanvas: (template: WorkflowTemplate) => void;
}

export const TemplateDetail: React.FC<TemplateDetailProps> = ({
  template,
  onBack,
  onImportToCanvas
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'docs' | 'nodes' | 'json'>('preview');
  const [copied, setCopied] = useState(false);
  const [selectedNode, setSelectedNode] = useState<N8nNode | null>(null);

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(template.workflow, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${template.slug}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(template.workflow, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090616] text-slate-100 pb-16">
      {/* Top Banner / Breadcrumb & Actions Bar */}
      <div className="bg-slate-900/90 backdrop-blur-xl border-b border-white/10 shadow-lg sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-white/10 transition-colors cursor-pointer"
              title="Back to Template Library"
            >
              <ArrowLeft className="w-4 h-4 text-pink-400" />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 text-pink-300 border border-pink-500/30">
                  {template.category}
                </span>
                <span className="text-xs text-cyan-300 font-mono bg-cyan-950/40 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                  {template.workflow.nodes.length} nodes
                </span>
                <span className="text-xs text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" /> ~{template.estimatedSetupMinutes}m setup
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight mt-1">
                {template.name}
              </h1>
            </div>
          </div>

          {/* TWO PRIMARY ACTION BUTTONS */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Button 1: Download */}
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold text-slate-200 bg-slate-800/90 hover:bg-slate-700 hover:text-white border border-white/15 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-pink-400" />
              <span>Download JSON</span>
            </button>

            {/* Button 2: Import to Canvas */}
            <button
              onClick={() => onImportToCanvas(template)}
              className="flex items-center gap-2 px-4.5 py-2 rounded-2xl text-xs sm:text-sm font-bold text-white bg-tiedye-gradient hover:brightness-110 shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Import to Canvas</span>
            </button>

            {/* Copy JSON */}
            <button
              onClick={handleCopyJSON}
              title="Copy RAW JSON"
              className="p-2.5 rounded-2xl text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-white/15 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 border-t border-white/10">
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'preview'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Interactive Visual Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'docs'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Documentation & Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('nodes')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'nodes'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Node Hierarchy ({template.workflow.nodes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'json'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Workflow JSON</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Tab 1: Visual Canvas Preview */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 shadow-2xl overflow-hidden bg-slate-950 h-[580px] relative">
              <WorkflowCanvas
                workflow={template.workflow}
                workflowName={template.name}
                onDownloadJSON={handleDownloadJSON}
                isReadOnly={false}
              />
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur-md border border-white/10 space-y-2.5">
                <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-pink-400" />
                  <span>Key Use Cases</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {template.useCases.map((useCase, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0 mt-1.5" />
                      <span>{useCase}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur-md border border-white/10 space-y-2.5">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Required Credentials</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {template.requiredCredentials.length > 0 ? (
                    template.requiredCredentials.map((cred, idx) => (
                      <span
                        key={idx}
                        className="font-mono text-[11px] px-2.5 py-1 rounded-xl bg-slate-800 text-slate-200 border border-white/10"
                      >
                        {cred}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No external credentials required</span>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900/80 backdrop-blur-md border border-white/10 space-y-2.5">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Author & Verification</span>
                </h4>
                <div className="flex items-center gap-3 pt-1">
                  {template.author.avatar ? (
                    <img
                      src={template.author.avatar}
                      alt={template.author.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-2xl object-cover border border-purple-500/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-tiedye-gradient text-white font-bold flex items-center justify-center shadow-sm">
                      {template.author.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-white text-xs block">
                      {template.author.name}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {template.author.role || 'Workflow Community Contributor'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Documentation & Setup Guide */}
        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Overview Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-md border border-white/10 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-pink-400" />
                  <span>Workflow Overview</span>
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {template.longDescription || template.description}
                </p>

                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Step-by-Step Setup Guide
                  </h4>
                  <div className="space-y-2.5">
                    {template.setupSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-white/10"
                      >
                        <div className="w-6 h-6 rounded-full bg-tiedye-gradient text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-medium">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Markdown Documentation Section */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-md border border-white/10 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-purple-400" />
                  <span>Detailed Specifications</span>
                </h3>
                <div className="text-xs text-slate-300 whitespace-pre-wrap font-sans bg-slate-950/80 p-5 rounded-2xl border border-white/10 leading-relaxed">
                  {template.documentationMarkdown}
                </div>
              </div>
            </div>

            {/* Sidebar Details */}
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-slate-900/80 backdrop-blur-md border border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-white">
                  Quick Actions
                </h3>
                <div className="space-y-2.5">
                  <button
                    onClick={() => onImportToCanvas(template)}
                    className="w-full py-3 px-4 rounded-2xl text-xs font-bold text-white bg-tiedye-gradient hover:brightness-110 shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Open in Interactive Canvas</span>
                  </button>

                  <button
                    onClick={handleDownloadJSON}
                    className="w-full py-3 px-4 rounded-2xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-white/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-pink-400" />
                    <span>Download JSON Template</span>
                  </button>

                  <button
                    onClick={handleCopyJSON}
                    className="w-full py-3 px-4 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-white/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>Copy JSON Code</span>
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="p-6 rounded-3xl bg-slate-900/80 backdrop-blur-md border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tags & Taxonomy
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {template.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-medium px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 border border-white/10"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Node Hierarchy */}
        {activeTab === 'nodes' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {template.workflow.nodes.map(node => {
                const meta = getNodeMeta(node.type);
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-pink-500/50 transition-all cursor-pointer flex items-start gap-3.5 group shadow-md hover:shadow-xl"
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 font-bold text-sm shadow-sm"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.displayName.charAt(0)}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-white text-xs truncate group-hover:text-pink-400 transition-colors">
                          {node.name}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                          {meta.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate font-mono mt-0.5">
                        {node.type}
                      </p>
                      <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                        {meta.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Raw JSON Spec */}
        {activeTab === 'json' && (
          <div className="rounded-3xl bg-slate-950 border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-900 border-b border-white/10 flex items-center justify-between">
              <span className="font-mono text-xs text-slate-400">
                {template.slug}.json
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJSON}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer border border-white/10"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownloadJSON}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-tiedye-gradient hover:brightness-110 text-white text-xs font-bold cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
            <pre className="p-6 text-xs font-mono text-cyan-300 overflow-x-auto max-h-[600px] leading-relaxed custom-scrollbar">
              {JSON.stringify(template.workflow, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Node Inspector Modal */}
      <NodeInspectorModal
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
};
