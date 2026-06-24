export type ModelName = 
  | 'gemini-3-flash-preview'
  | 'gemini-3.1-pro-preview'
  | 'gemini-2.5-flash-image'
  | 'gemini-3.1-flash-image-preview'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  | 'llama-3.3-70b-versatile'
  | 'fugu-ultra'
  | 'happyhorse-1.1'
  | 'gpt-image-2'
  | 'gpt-image-1-mini'
  | 'gpt-image-1'
  | 'happyhorse-1.0'
  | 'nano-banana-2'
  | 'nano-banana-pro'
  | 'north-mini-code'
  | 'glm-5.2'
  | 'fusion'
  | 'kimi-k2.7-code'
  | 'llama-nemotron-rerank-vl-1b-v2'
  | 'claude-fable-latest'
  | 'claude-fable-5'
  | 'nex-n2-pro'
  | 'riverflow-v2.5-pro'
  | 'riverflow-v2.5-fast'
  | 'nemotron-3.5-content-safety'
  | 'nemotron-3-ultra'
  | 'qwen3.7-plus'
  | 'mai-voice-2';

export interface TrainingExample {
  id: string;
  user: string;
  model: string;
}

export interface AIModule {
  id: string;
  name: string;
  config: PlaygroundConfig;
  training: TrainingExample[];
}

export interface PlaygroundConfig {
  model: ModelName;
  systemInstruction: string;
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens?: number;
  showRobot?: boolean;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface MemoryNode {
  id: string;
  title: string;
  content: string;
  type: 'decision' | 'bug' | 'pattern' | 'context' | 'file' | 'note';
  ts: number;
}

export interface NexusEvent {
  id: string;
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  source?: string;
  line?: number;
  col?: number;
  stack?: string;
  timestamp: number;
}
