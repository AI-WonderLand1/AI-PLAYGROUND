export interface NodeMeta {
  displayName: string;
  category: 'trigger' | 'action' | 'ai' | 'transform' | 'output' | 'note';
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
  description: string;
}

export const NODE_CATALOG: Record<string, NodeMeta> = {
  // Triggers
  'n8n-nodes-base.webhook': {
    displayName: 'Webhook Trigger',
    category: 'trigger',
    color: '#0ea5e9',
    bgColor: 'bg-sky-50 dark:bg-sky-950/40',
    borderColor: 'border-sky-500',
    iconName: 'Webhook',
    description: 'Listens for incoming HTTP requests to trigger the workflow'
  },
  'n8n-nodes-base.scheduleTrigger': {
    displayName: 'Schedule Trigger',
    category: 'trigger',
    color: '#3b82f6',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-500',
    iconName: 'Clock',
    description: 'Triggers the workflow periodically using intervals or cron expressions'
  },
  'n8n-nodes-base.manualTrigger': {
    displayName: 'Manual Trigger',
    category: 'trigger',
    color: '#6366f1',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderColor: 'border-indigo-500',
    iconName: 'PlayCircle',
    description: 'Triggers workflow manually during testing and building'
  },
  'n8n-nodes-base.formTrigger': {
    displayName: 'Form Trigger',
    category: 'trigger',
    color: '#8b5cf6',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-500',
    iconName: 'FileText',
    description: 'Displays a custom web form to gather user input'
  },
  '@n8n/n8n-nodes-langchain.chatTrigger': {
    displayName: 'Chat Trigger',
    category: 'trigger',
    color: '#ec4899',
    bgColor: 'bg-pink-50 dark:bg-pink-950/40',
    borderColor: 'border-pink-500',
    iconName: 'MessageSquare',
    description: 'Embeddable chat interface trigger for interactive AI chatbots'
  },
  '@n8n/n8n-nodes-langchain.manualChatTrigger': {
    displayName: 'Manual Chat Trigger',
    category: 'trigger',
    color: '#d946ef',
    bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-950/40',
    borderColor: 'border-fuchsia-500',
    iconName: 'MessagesSquare',
    description: 'Manual test chat session trigger'
  },
  'n8n-nodes-base.executeWorkflowTrigger': {
    displayName: 'Sub-workflow Trigger',
    category: 'trigger',
    color: '#14b8a6',
    bgColor: 'bg-teal-50 dark:bg-teal-950/40',
    borderColor: 'border-teal-500',
    iconName: 'Workflow',
    description: 'Triggers this workflow as a sub-routine from a parent workflow'
  },

  // AI & LangChain
  '@n8n/n8n-nodes-langchain.agent': {
    displayName: 'AI Agent',
    category: 'ai',
    color: '#8b5cf6',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-500',
    iconName: 'Bot',
    description: 'Autonomous reasoning engine equipped with tools, memory, and LLMs'
  },
  '@n8n/n8n-nodes-langchain.lmChatOpenAi': {
    displayName: 'OpenAI Chat Model',
    category: 'ai',
    color: '#10a37f',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-500',
    iconName: 'Sparkles',
    description: 'Connects GPT-4o, GPT-4.1, or custom fine-tuned OpenAI models'
  },
  '@n8n/n8n-nodes-langchain.lmChatGoogleGemini': {
    displayName: 'Google Gemini Model',
    category: 'ai',
    color: '#3b82f6',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-500',
    iconName: 'Cpu',
    description: 'Connects Google Gemini 1.5 Pro/Flash and 2.0 models'
  },
  '@n8n/n8n-nodes-langchain.memoryBufferWindow': {
    displayName: 'Window Buffer Memory',
    category: 'ai',
    color: '#f59e0b',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-500',
    iconName: 'Database',
    description: 'Maintains recent conversation turns in memory for the AI agent'
  },
  '@n8n/n8n-nodes-langchain.memoryMongoDbChat': {
    displayName: 'MongoDB Chat Memory',
    category: 'ai',
    color: '#22c55e',
    bgColor: 'bg-green-50 dark:bg-green-950/40',
    borderColor: 'border-green-500',
    iconName: 'Database',
    description: 'Persists conversational memory across sessions in MongoDB'
  },
  '@n8n/n8n-nodes-langchain.toolHttpRequest': {
    displayName: 'HTTP Request Tool',
    category: 'ai',
    color: '#f97316',
    bgColor: 'bg-orange-50 dark:bg-orange-950/40',
    borderColor: 'border-orange-500',
    iconName: 'Globe',
    description: 'Allows the AI agent to call external HTTP APIs dynamically'
  },
  '@n8n/n8n-nodes-langchain.toolWorkflow': {
    displayName: 'Sub-workflow Tool',
    category: 'ai',
    color: '#06b6d4',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderColor: 'border-cyan-500',
    iconName: 'Network',
    description: 'Exposes an entire n8n sub-workflow as a callable agent tool'
  },
  '@n8n/n8n-nodes-langchain.toolThink': {
    displayName: 'Think Tool',
    category: 'ai',
    color: '#a855f7',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-500',
    iconName: 'Brain',
    description: 'Forces chain-of-thought reflection before generating responses'
  },
  '@n8n/n8n-nodes-langchain.toolCalculator': {
    displayName: 'Calculator Tool',
    category: 'ai',
    color: '#eab308',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/40',
    borderColor: 'border-yellow-500',
    iconName: 'Calculator',
    description: 'Provides exact mathematical calculation capabilities to LLMs'
  },
  '@n8n/n8n-nodes-langchain.toolCode': {
    displayName: 'Code Tool',
    category: 'ai',
    color: '#6366f1',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderColor: 'border-indigo-500',
    iconName: 'Code',
    description: 'Runs isolated JS/Python code execution blocks for agent logic'
  },
  '@n8n/n8n-nodes-langchain.outputParserStructured': {
    displayName: 'Structured Output Parser',
    category: 'ai',
    color: '#06b6d4',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderColor: 'border-cyan-500',
    iconName: 'Code2',
    description: 'Enforces strict JSON schema validation on LLM output'
  },
  '@n8n/n8n-nodes-langchain.guardrails': {
    displayName: 'AI Guardrails',
    category: 'ai',
    color: '#ef4444',
    bgColor: 'bg-red-50 dark:bg-red-950/40',
    borderColor: 'border-red-500',
    iconName: 'ShieldAlert',
    description: 'Detects jailbreaks, toxic prompts, and policy violations'
  },
  '@n8n/n8n-nodes-langchain.vectorStoreQdrant': {
    displayName: 'Qdrant Vector Store',
    category: 'ai',
    color: '#ec4899',
    bgColor: 'bg-pink-50 dark:bg-pink-950/40',
    borderColor: 'border-pink-500',
    iconName: 'Layers',
    description: 'Stores and searches high-dimensional vectors in Qdrant'
  },
  '@n8n/n8n-nodes-langchain.vectorStoreSupabase': {
    displayName: 'Supabase Vector Store',
    category: 'ai',
    color: '#10b981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-500',
    iconName: 'Database',
    description: 'Stores and queries pgvector embeddings in Supabase'
  },
  '@n8n/n8n-nodes-langchain.embeddingsOpenAi': {
    displayName: 'OpenAI Embeddings',
    category: 'ai',
    color: '#10a37f',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-500',
    iconName: 'Sparkle',
    description: 'Generates text embeddings using text-embedding-3 models'
  },
  '@n8n/n8n-nodes-langchain.embeddingsNvidia': {
    displayName: 'NVIDIA Embeddings',
    category: 'ai',
    color: '#76b900',
    bgColor: 'bg-lime-50 dark:bg-lime-950/40',
    borderColor: 'border-lime-500',
    iconName: 'Cpu',
    description: 'Generates embeddings with NVIDIA Nemotron models'
  },
  '@n8n/n8n-nodes-langchain.openAi': {
    displayName: 'OpenAI Audio/Vision',
    category: 'ai',
    color: '#10a37f',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-500',
    iconName: 'Mic',
    description: 'Whisper STT transcription and TTS audio synthesis'
  },
  '@n8n/n8n-nodes-langchain.toolVectorStore': {
    displayName: 'Vector Store RAG Tool',
    category: 'ai',
    color: '#8b5cf6',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-500',
    iconName: 'Search',
    description: 'Enables semantic knowledgebase retrieval for AI agents'
  },
  '@n8n/n8n-nodes-langchain.textSplitterRecursiveCharacterTextSplitter': {
    displayName: 'Text Splitter',
    category: 'ai',
    color: '#64748b',
    bgColor: 'bg-slate-50 dark:bg-slate-950/40',
    borderColor: 'border-slate-500',
    iconName: 'Scissors',
    description: 'Splits raw text documents into chunks with overlap for RAG'
  },
  '@n8n/n8n-nodes-langchain.documentDefaultDataLoader': {
    displayName: 'Document Data Loader',
    category: 'ai',
    color: '#64748b',
    bgColor: 'bg-slate-50 dark:bg-slate-950/40',
    borderColor: 'border-slate-500',
    iconName: 'FileBox',
    description: 'Loads document text and attaches custom metadata'
  },

  // Base Nodes
  'n8n-nodes-base.httpRequest': {
    displayName: 'HTTP Request',
    category: 'action',
    color: '#ff6d5a',
    bgColor: 'bg-rose-50 dark:bg-rose-950/40',
    borderColor: 'border-rose-500',
    iconName: 'Globe2',
    description: 'Makes custom HTTP/REST API calls with headers, auth, and payloads'
  },
  'n8n-nodes-base.code': {
    displayName: 'Code (JS / Python)',
    category: 'transform',
    color: '#f59e0b',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-500',
    iconName: 'Code2',
    description: 'Runs custom JavaScript or Python code transformations'
  },
  'n8n-nodes-base.if': {
    displayName: 'If / Condition',
    category: 'transform',
    color: '#3b82f6',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-500',
    iconName: 'GitBranch',
    description: 'Branches workflow execution based on conditional rules'
  },
  'n8n-nodes-base.switch': {
    displayName: 'Switch',
    category: 'transform',
    color: '#8b5cf6',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-500',
    iconName: 'Shuffle',
    description: 'Routes execution through multiple outputs matching rules'
  },
  'n8n-nodes-base.set': {
    displayName: 'Edit Fields (Set)',
    category: 'transform',
    color: '#10b981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-500',
    iconName: 'Edit3',
    description: 'Sets, transforms, and renames JSON fields on items'
  },
  'n8n-nodes-base.merge': {
    displayName: 'Merge',
    category: 'transform',
    color: '#06b6d4',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderColor: 'border-cyan-500',
    iconName: 'GitMerge',
    description: 'Merges data streams from multiple previous branches'
  },
  'n8n-nodes-base.wait': {
    displayName: 'Wait / Delay',
    category: 'action',
    color: '#64748b',
    bgColor: 'bg-slate-50 dark:bg-slate-950/40',
    borderColor: 'border-slate-500',
    iconName: 'Hourglass',
    description: 'Pauses workflow execution for a duration or until webhook callback'
  },
  'n8n-nodes-base.splitInBatches': {
    displayName: 'Loop Over Items',
    category: 'transform',
    color: '#f97316',
    bgColor: 'bg-orange-50 dark:bg-orange-950/40',
    borderColor: 'border-orange-500',
    iconName: 'Repeat',
    description: 'Splits arrays into batches for iterative processing'
  },
  'n8n-nodes-base.respondToWebhook': {
    displayName: 'Respond to Webhook',
    category: 'output',
    color: '#14b8a6',
    bgColor: 'bg-teal-50 dark:bg-teal-950/40',
    borderColor: 'border-teal-500',
    iconName: 'Send',
    description: 'Sends the HTTP response payload back to the webhook caller'
  },
  'n8n-nodes-base.stickyNote': {
    displayName: 'Sticky Note',
    category: 'note',
    color: '#fbbf24',
    bgColor: 'bg-amber-100 dark:bg-amber-950/60',
    borderColor: 'border-amber-400',
    iconName: 'StickyNote',
    description: 'Canvas documentation note and tutorial block'
  },

  // Integrations
  'n8n-nodes-base.googleSheets': {
    displayName: 'Google Sheets',
    category: 'action',
    color: '#22c55e',
    bgColor: 'bg-green-50 dark:bg-green-950/40',
    borderColor: 'border-green-500',
    iconName: 'Table',
    description: 'Reads, appends, and updates rows in Google Sheets'
  },
  'n8n-nodes-base.googleDrive': {
    displayName: 'Google Drive',
    category: 'action',
    color: '#3b82f6',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-500',
    iconName: 'HardDrive',
    description: 'Searches, downloads, and manages files on Google Drive'
  },
  'n8n-nodes-base.microsoftOutlook': {
    displayName: 'Microsoft Outlook',
    category: 'action',
    color: '#0284c7',
    bgColor: 'bg-sky-50 dark:bg-sky-950/40',
    borderColor: 'border-sky-500',
    iconName: 'Mail',
    description: 'Sends emails and accesses Microsoft Outlook mailbox'
  },
  '@blotato/n8n-nodes-blotato.blotato': {
    displayName: 'Blotato Social',
    category: 'action',
    color: '#8b5cf6',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-500',
    iconName: 'Share2',
    description: 'Multi-platform social media video and post publisher'
  },
  'n8n-nodes-chat-data.chatData': {
    displayName: 'Chat Data',
    category: 'action',
    color: '#6366f1',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderColor: 'border-indigo-500',
    iconName: 'Database',
    description: 'Integrates Chat Data knowledge base API'
  },
  'n8n-nodes-base.markdown': {
    displayName: 'Markdown Converter',
    category: 'transform',
    color: '#64748b',
    bgColor: 'bg-slate-50 dark:bg-slate-950/40',
    borderColor: 'border-slate-500',
    iconName: 'FileCode',
    description: 'Converts HTML to clean Markdown text format'
  },
  'n8n-nodes-base.html': {
    displayName: 'HTML Formatter',
    category: 'transform',
    color: '#f97316',
    bgColor: 'bg-orange-50 dark:bg-orange-950/40',
    borderColor: 'border-orange-500',
    iconName: 'Layout',
    description: 'Extracts and constructs HTML document templates'
  },
  '@n8n/n8n-nodes-langchain.chat': {
    displayName: 'Chat Model Handler',
    category: 'ai',
    color: '#a855f7',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-500',
    iconName: 'MessageCircle',
    description: 'Interactive chat loop handler with wait-and-resume support'
  },
  'n8n-nodes-base.slack': {
    displayName: 'Slack',
    category: 'action',
    color: '#4a154b',
    bgColor: 'bg-pink-50 dark:bg-pink-950/40',
    borderColor: 'border-pink-500',
    iconName: 'MessageSquareText',
    description: 'Sends messages, creates channels, and handles Slack events'
  },
  'n8n-nodes-base.github': {
    displayName: 'GitHub',
    category: 'action',
    color: '#24292e',
    bgColor: 'bg-slate-100 dark:bg-slate-900',
    borderColor: 'border-slate-700',
    iconName: 'GitPullRequest',
    description: 'Creates PR comments, reviews code, and listens to GitHub events'
  },
  'n8n-nodes-base.postgres': {
    displayName: 'PostgreSQL',
    category: 'action',
    color: '#336791',
    bgColor: 'bg-sky-50 dark:bg-sky-950/40',
    borderColor: 'border-sky-600',
    iconName: 'Database',
    description: 'Executes SQL queries and manages data in PostgreSQL'
  },
  'n8n-nodes-base.notion': {
    displayName: 'Notion',
    category: 'action',
    color: '#000000',
    bgColor: 'bg-stone-50 dark:bg-stone-900',
    borderColor: 'border-stone-500',
    iconName: 'BookOpen',
    description: 'Creates and searches Notion database pages and blocks'
  },
  'n8n-nodes-base.stripe': {
    displayName: 'Stripe',
    category: 'action',
    color: '#635bff',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderColor: 'border-indigo-500',
    iconName: 'CreditCard',
    description: 'Handles Stripe payment events, customer records, and invoices'
  },
  'n8n-nodes-base.gmail': {
    displayName: 'Gmail',
    category: 'action',
    color: '#ea4335',
    bgColor: 'bg-red-50 dark:bg-red-950/40',
    borderColor: 'border-red-500',
    iconName: 'Mail',
    description: 'Reads incoming emails, labels threads, and drafts messages'
  },
  'n8n-nodes-base.telegram': {
    displayName: 'Telegram',
    category: 'action',
    color: '#229ed9',
    bgColor: 'bg-sky-50 dark:bg-sky-950/40',
    borderColor: 'border-sky-500',
    iconName: 'Send',
    description: 'Sends messages, audio, and listens to Telegram bot events'
  }
};

export function getNodeMeta(type: string): NodeMeta {
  if (NODE_CATALOG[type]) {
    return NODE_CATALOG[type];
  }
  // Generic fallback
  const nameParts = type.split('.');
  const lastPart = nameParts[nameParts.length - 1] || type;
  const readable = lastPart.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  return {
    displayName: readable,
    category: type.includes('Trigger') ? 'trigger' : type.includes('langchain') ? 'ai' : 'action',
    color: '#f97316',
    bgColor: 'bg-orange-50 dark:bg-orange-950/40',
    borderColor: 'border-orange-500',
    iconName: 'Cpu',
    description: `n8n Node (${type})`
  };
}
