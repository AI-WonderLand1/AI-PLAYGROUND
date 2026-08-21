export type ConnectionType = 
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
  0: number; // x
  1: number; // y
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

export interface N8nWorkflowMeta {
  templateId?: string;
  instanceId?: string;
  templateCredsSetupCompleted?: boolean;
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
  meta?: N8nWorkflowMeta;
  nodeGroups?: any[];
  tags?: string[];
  active?: boolean;
}

export type TemplateCategory =
  | 'All'
  | 'AI Agents & LLMs'
  | 'Social Media & Video'
  | 'Customer Support & Sales'
  | 'DevOps & APIs'
  | 'RAG & Knowledge Base'
  | 'Productivity & Office'
  | 'Tutorials & Essentials';

export type TemplateComplexity = 'Beginner' | 'Intermediate' | 'Advanced';

export interface WorkflowTemplate {
  id: string;
  name: string;
  slug: string;
  category: Exclude<TemplateCategory, 'All'>;
  complexity: TemplateComplexity;
  description: string;
  longDescription?: string;
  author: {
    name: string;
    role?: string;
    avatar?: string;
    url?: string;
  };
  tags: string[];
  nodeCount: number;
  stars: number;
  downloads: number;
  featured?: boolean;
  useCases: string[];
  setupSteps: string[];
  requiredCredentials: string[];
  workflow: N8nWorkflow;
  documentationMarkdown: string;
  estimatedSetupMinutes: number;
}
