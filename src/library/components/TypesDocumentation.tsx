import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  FileCode, 
  Layers, 
  Terminal, 
  ExternalLink,
  BookOpen,
  Sparkles,
  Shield
} from 'lucide-react';

export const TypesDocumentation: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const TYPE_DEFS = `export type ConnectionType = 
  | 'main' 
  | 'ai_tool' 
  | 'ai_languageModel' 
  | 'ai_memory' 
  | 'ai_vectorStore' 
  | 'ai_embedding' 
  | 'ai_outputParser' 
  | 'ai_document' 
  | 'ai_textSplitter';

export interface N8nConnectionItem {
  node: string;
  type: ConnectionType | string;
  index: number;
}

export type N8nConnections = Record<string, Record<string, N8nConnectionItem[][]>>;

export interface N8nNodePosition {
  0: number; // x coordinate on 2D canvas
  1: number; // y coordinate on 2D canvas
}

export interface N8nNodeCredentials {
  [credentialType: string]: {
    id?: string | null;
    name?: string;
    [key: string]: any;
  };
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion?: number;
  position: [number, number];
  parameters?: Record<string, any>;
  credentials?: N8nNodeCredentials;
  disabled?: boolean;
  notes?: string;
  notesInFlow?: boolean;
  webhookId?: string;
  color?: number | string;
}

export interface N8nStickyNote extends N8nNode {
  parameters: {
    content?: string;
    height?: number;
    width?: number;
    color?: number | string;
    [key: string]: any;
  };
}

export interface N8nWorkflowSettings {
  executionOrder?: 'v1' | 'v2';
  binaryMode?: 'separate' | 'combined' | string;
  saveDataErrorExecution?: 'all' | 'none';
  saveDataSuccessExecution?: 'all' | 'none';
  saveManualExecutions?: boolean;
  timezone?: string;
  [key: string]: any;
}

export interface N8nWorkflow {
  id?: string;
  name: string;
  nodes: N8nNode[];
  connections: N8nConnections;
  pinData?: Record<string, any>;
  settings?: N8nWorkflowSettings;
  versionId?: string;
  meta?: Record<string, any>;
  nodeGroups?: any[];
  tags?: string[];
  active?: boolean;
}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-semibold border border-orange-500/30">
            <Code2 className="w-3.5 h-3.5" />
            <span>Developer Reference & Type Definitions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            n8n Workflow TypeScript Definitions & JSON Schema
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Strict TypeScript contracts representing the complete n8n workflow file format. Compatible with n8n v1.0+, LangChain nodes, and community integrations.
          </p>
        </div>
      </div>

      {/* Main Types Code Block */}
      <div className="rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <FileCode className="w-4 h-4 text-orange-500" />
            <span>src/types.ts</span>
          </div>
          <button
            onClick={() => handleCopy(TYPE_DEFS, 'types')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {copiedSection === 'types' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'types' ? 'Copied' : 'Copy TypeScript Code'}</span>
          </button>
        </div>
        <pre className="p-6 text-xs sm:text-sm font-mono text-emerald-400 overflow-x-auto leading-relaxed">
          {TYPE_DEFS}
        </pre>
      </div>

      {/* Schema Deep Dive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-500" />
            <span>Connections Map Architecture</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            In n8n, connections represent an adjacency graph where the key is the source node name. Under each node, pins are categorized into output types:
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 font-mono">
            <li>&bull; <strong className="text-orange-500">main</strong>: Standard JSON data streaming output</li>
            <li>&bull; <strong className="text-emerald-500">ai_languageModel</strong>: Connects Chat LLM to Agent</li>
            <li>&bull; <strong className="text-purple-500">ai_tool</strong>: Exposes callable sub-tools to Agent</li>
            <li>&bull; <strong className="text-amber-500">ai_memory</strong>: Window or MongoDB buffer memory</li>
            <li>&bull; <strong className="text-pink-500">ai_vectorStore</strong>: Qdrant / Pinecone / Supabase RAG</li>
          </ul>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Credentials Decoupling</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Exported n8n templates safely omit raw API secrets. Instead, credentials contain identifier pointers (<code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">microsoftOutlookOAuth2Api</code>, <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">openAiApi</code>). When imported into your local or cloud n8n instance, users match their local secret store.
          </p>
        </div>
      </div>
    </div>
  );
};
