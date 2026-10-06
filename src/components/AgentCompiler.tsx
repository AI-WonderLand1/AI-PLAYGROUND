import { ArrowRight, LockKeyhole } from 'lucide-react';
import type { ModelName, WorkflowNode } from '../types';

interface AgentCompilerProps {
  creationAgentName: string;
  setCreationAgentName: (val: string) => void;
  creationBaseModel: ModelName;
  setCreationBaseModel: (val: ModelName) => void;
  creationSystemPrompt: string;
  setCreationSystemPrompt: (val: string) => void;
  creationToolWebSearch: boolean;
  setCreationToolWebSearch: (val: boolean) => void;
  creationToolCodeExecution: boolean;
  setCreationToolCodeExecution: (val: boolean) => void;
  creationToolVision: boolean;
  setCreationToolVision: (val: boolean) => void;
  creationToolMemory: boolean;
  setCreationToolMemory: (val: boolean) => void;
  nodes: WorkflowNode[];
  onSpawnAgent: () => void;
}

export function AgentCompiler(_props: AgentCompilerProps) {
  return (
    <div className="flex h-full flex-col justify-center gap-5 bg-[#0d0f19] p-6 text-slate-200">
      <div className="text-xs font-bold uppercase tracking-widest text-violet-400">Agent node builder</div>
      <h2 className="text-xl font-semibold text-white">Build an agent node in three steps.</h2>
      <p className="text-sm leading-relaxed text-slate-400">Choose an agent, configure its server-stored credential, then test and save it. Browse existing agents separately in the library.</p>
      <a href="/node-builder" className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500">Open node builder <ArrowRight size={16} /></a>
      <p className="flex items-center gap-2 text-xs text-slate-500"><LockKeyhole size={14} /> Credentials remain in the authenticated server vault.</p>
    </div>
  );
}
