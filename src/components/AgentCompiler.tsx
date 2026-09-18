import { ArrowRight, LockKeyhole } from 'lucide-react';
import type { ModelName, WorkflowNode } from '../types';

// Keep the existing canvas-facing interface until the monolithic canvas is safely split.
// No key, model, or training-source configuration belongs in this legacy drawer.
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
      <div className="text-xs font-bold uppercase tracking-widest text-violet-400">Agent creation moved</div>
      <h2 className="text-xl font-semibold text-white">Your agents have their own library.</h2>
      <p className="text-sm leading-relaxed text-slate-400">
        Choose an agent template, configure a server-stored key, then test and publish.
        The workflow canvas remains for wiring and running workflows.
      </p>
      <a href="/agents" className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500">
        Open agent library <ArrowRight size={16} />
      </a>
      <p className="flex items-center gap-2 text-xs text-slate-500"><LockKeyhole size={14} /> Keys are not entered or displayed in the canvas.</p>
    </div>
  );
}
