import type { WorkflowNode } from '../types';
import { CATALOG_MODELS } from '../components/ModelsCatalog';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'password'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'slider'
  | 'code'
  | 'credential';

export interface FieldOption {
  value: string;
  label: string;
}

export interface NodeField {
  key: string;
  label: string;
  type: FieldType;
  section?: string;
  default?: any;
  placeholder?: string;
  help?: string;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  options?: FieldOption[];
}

export interface NodeSchema {
  type: string;
  docsUrl?: string;
  fields: NodeField[];
}

const textModels = CATALOG_MODELS.filter(m => m.modality === 'Text')
  .map(m => ({ value: m.id, label: m.name }));
const providerTextModels = (provider: string) =>
  CATALOG_MODELS.filter(m => m.modality === 'Text' && m.provider === provider)
    .map(m => ({ value: m.id, label: m.name }));
const embeddingModels = CATALOG_MODELS.filter(m => m.modality === 'Embeddings')
  .map(m => ({ value: m.id, label: m.name }));

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

const modelField = (options: FieldOption[], modelKey = 'model', defaultValue = 'gemini-3-flash-preview'): NodeField => ({
  key: modelKey,
  label: 'Model Engine',
  type: 'select',
  section: 'Model',
  default: defaultValue,
  options,
});

const systemPromptField = (): NodeField => ({
  key: 'systemPrompt',
  label: 'System Message',
  type: 'textarea',
  section: 'Prompt',
  rows: 5,
  placeholder: 'Instructions for the model...',
});

const temperatureField = (): NodeField => ({
  key: 'temperature',
  label: 'Temperature',
  type: 'slider',
  section: 'Parameters',
  default: 0.7,
  min: 0,
  max: 1,
  step: 0.05,
});

const topPField = (): NodeField => ({
  key: 'topP',
  label: 'Top P',
  type: 'number',
  section: 'Parameters',
  default: 0.95,
  min: 0,
  max: 1,
  step: 0.05,
});

const maxTokensField = (): NodeField => ({
  key: 'maxTokens',
  label: 'Max Tokens',
  type: 'number',
  section: 'Parameters',
  default: 2048,
  min: 100,
  max: 8192,
  step: 100,
});

const credentialField = (): NodeField => ({
  key: 'providerApiKey',
  label: 'Credential / API Key',
  type: 'credential',
  section: 'Credentials',
});

const executionModeField = (): NodeField => ({
  key: 'executionMode',
  label: 'Execution Mode',
  type: 'select',
  section: 'Execution',
  default: 'model',
  help: 'Pick explicitly how this node runs — behavior is never inferred from whether a webhook URL is populated.',
  options: [
    { value: 'model', label: 'Model Call' },
    { value: 'model_webhook', label: 'Model Call + Webhook POST' },
    { value: 'webhook', label: 'Webhook Only' },
  ],
});

const webhookUrlField = (): NodeField => ({
  key: 'webhookUrl',
  label: 'Webhook URL',
  type: 'text',
  section: 'Execution',
  placeholder: 'https://your-endpoint.example.com/hook/...',
  help: 'Used when Execution Mode is "Model Call + Webhook POST" or "Webhook Only".',
});

const aiExecutionFields = (): NodeField[] => [
  executionModeField(),
  webhookUrlField(),
  credentialField(),
];

const aiModelNodeSchema = (type: string, name: string, models: FieldOption[]): NodeSchema => ({
  type,
  fields: [
    modelField(models.length > 0 ? models : textModels),
    systemPromptField(),
    temperatureField(),
    maxTokensField(),
    ...aiExecutionFields(),
  ],
});

export const NODE_SCHEMAS: Record<string, NodeSchema> = {
  // ── Migrated from legacy NDV blocks (behavior preserved) ──
  agent: {
    type: 'agent',
    fields: [
      {
        key: 'model',
        label: 'Model Engine',
        type: 'select',
        section: 'Model',
        default: 'gemini-3-flash-preview',
        options: [
          { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
          { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (Heavy reasoning)' },
          { value: 'gpt-4o', label: 'GPT-4o (Frontier)' },
          { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
        ],
      },
      systemPromptField(),
      temperatureField(),
      topPField(),
      ...aiExecutionFields(),
    ],
  },
  rag: {
    type: 'rag',
    fields: [
      {
        key: 'promptTemplate',
        label: 'Search query format',
        type: 'textarea',
        rows: 5,
        placeholder: '{{ $input }}',
      },
      credentialField(),
    ],
  },
  prompt: {
    type: 'prompt',
    fields: [
      {
        key: 'promptTemplate',
        label: 'Prompt Template',
        type: 'textarea',
        section: 'Prompt',
        rows: 6,
        placeholder: '{{ $input }} — use {{ $input }} for upstream input, {{ $now }} for timestamp.',
      },
    ],
  },
  core_brain: {
    type: 'core_brain',
    fields: [
      modelField([
        { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
        { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
        { value: 'fugu-ultra', label: 'Fugu Ultra' },
      ]),
      systemPromptField(),
      temperatureField(),
      maxTokensField(),
      ...aiExecutionFields(),
    ],
  },
  llm_chain: {
    type: 'llm_chain',
    fields: [
      modelField([
        { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
      ]),
      {
        key: 'promptTemplate',
        label: 'Chain Prompt Template',
        type: 'textarea',
        section: 'Prompt',
        rows: 6,
      },
      {
        key: 'retryCount',
        label: 'Chain Steps',
        type: 'number',
        section: 'Parameters',
        default: 1,
        min: 1,
        max: 10,
      },
      ...aiExecutionFields(),
    ],
  },

  // ── AI Model nodes (no legacy block — real fields added here) ──
  openai_chat_model: aiModelNodeSchema('openai_chat_model', 'OpenAI Chat Model', providerTextModels('OpenAI')),
  anthropic_chat_model: aiModelNodeSchema('anthropic_chat_model', 'Anthropic Chat Model', providerTextModels('Anthropic')),
  gemini_chat_model: aiModelNodeSchema('gemini_chat_model', 'Google Gemini Chat Model', providerTextModels('Google')),
  embeddings_openai: {
    type: 'embeddings_openai',
    fields: [
      modelField(embeddingModels.length > 0 ? embeddingModels : textModels, 'model', 'text-embedding-3'),
      credentialField(),
    ],
  },
  embeddings_gemini: {
    type: 'embeddings_gemini',
    fields: [
      modelField(embeddingModels.length > 0 ? embeddingModels : textModels, 'model', 'google-embedding-2'),
      credentialField(),
    ],
  },

  // ── AI category nodes with no legacy NDV block ──
  chat_memory_manager: {
    type: 'chat_memory_manager',
    fields: [
      modelField(textModels),
      {
        key: 'systemPrompt',
        label: 'Memory Manager Instructions',
        type: 'textarea',
        section: 'Prompt',
        rows: 5,
      },
      maxTokensField(),
      ...aiExecutionFields(),
    ],
  },
  info_extractor: aiModelNodeSchema('info_extractor', 'Information Extractor', textModels),
  openai_message_model: aiModelNodeSchema('openai_message_model', 'OpenAI Message Model', textModels),
  qa_chain: aiModelNodeSchema('qa_chain', 'Question and Answer Chain', textModels),
  sentiment_analysis: aiModelNodeSchema('sentiment_analysis', 'Sentiment Analysis', textModels),
  summarization_chain: aiModelNodeSchema('summarization_chain', 'Summarization Chain', textModels),
  text_classifier: aiModelNodeSchema('text_classifier', 'Text Classifier', textModels),
  ai_transform: aiModelNodeSchema('ai_transform', 'AI Transform', textModels),
};

export function getNodeSchema(node: WorkflowNode | null): NodeSchema | undefined {
  if (!node) return undefined;
  return NODE_SCHEMAS[node.type];
}

export { DEFAULT_BASE_URL };
