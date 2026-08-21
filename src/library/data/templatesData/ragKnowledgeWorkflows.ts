import { WorkflowTemplate } from '../../types';

export const ragKnowledgeTemplates: WorkflowTemplate[] = [
  {
    id: 'tpl-rag-1-google-drive-qdrant',
    name: 'RAG chatbot for company documents using Google Drive & Qdrant',
    slug: 'rag-chatbot-company-documents-google-drive-qdrant',
    category: 'RAG & Knowledge Base',
    complexity: 'Advanced',
    author: {
      name: 'NeuralOps Labs',
      role: 'Enterprise AI Architects',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    description: 'Autonomous Knowledge Engine: watches Google Drive for new PDF & Docx uploads, chunks text, generates embeddings via OpenAI text-embedding-3-small, stores in Qdrant Vector Store, and serves accurate citations via Chatbot.',
    longDescription: 'Create a private, highly accurate internal knowledge base for your company. This two-phase workflow automatically synchronizes Google Drive folders with a high-performance Qdrant vector database. When employees ask questions in the chat widget, the agent performs semantic cosine similarity searches, retrieves the top 5 relevant document snippets, and synthesizes grounded answers with exact source page citations.',
    tags: ['RAG', 'Google Drive', 'Qdrant', 'OpenAI Embeddings', 'Document Loader', 'Recursive Text Splitter', 'Vector Store'],
    nodeCount: 12,
    stars: 2340,
    downloads: 46700,
    featured: true,
    estimatedSetupMinutes: 20,
    useCases: [
      'Answering internal company policy, HR handbook, and onboarding questions',
      'Searching engineering documentation and architecture decision records',
      'Grounded question answering that eliminates hallucinations with strict source citations'
    ],
    setupSteps: [
      'Connect your Google Drive OAuth2 account and select the knowledge folder',
      'Connect Qdrant Vector Store credentials (cloud or self-hosted Docker URL)',
      'Add OpenAI API credentials for embeddings (text-embedding-3-small) and chat (GPT-4o)',
      'Upload a test PDF to Google Drive to trigger auto-indexing'
    ],
    requiredCredentials: ['googleDriveOAuth2', 'qdrantApi', 'openAiApi'],
    documentationMarkdown: `
# RAG Chatbot with Google Drive & Qdrant

End-to-end Retrieval Augmented Generation (RAG) system with automatic document ingestion and vector indexing.

### Architecture:
1. **Ingestion Pipeline**: Google Drive Trigger $\\to$ Default Data Loader $\\to$ Recursive Character Text Splitter (chunkSize: 1000, overlap: 200) $\\to$ OpenAI Embeddings $\\to$ Qdrant Vector Store Upsert.
2. **Retrieval Pipeline**: Chat Trigger $\\to$ LangChain Retrieval Agent $\\to$ Qdrant Vector Store Search $\\to$ Answer with Citations.
`,
    workflow: {
      name: "RAG chatbot for company documents using Google Drive & Qdrant",
      nodes: [
        {
          id: "rag-gd-trigger",
          name: "Google Drive: New File Ingest",
          type: "n8n-nodes-base.googleDriveTrigger",
          position: [200, 200],
          parameters: { event: "fileCreated" },
          typeVersion: 1
        },
        {
          id: "rag-loader",
          name: "Default Document Loader",
          type: "@n8n/n8n-nodes-langchain.documentDefaultDataLoader",
          position: [440, 200],
          typeVersion: 1
        },
        {
          id: "rag-splitter",
          name: "Recursive Text Splitter",
          type: "@n8n/n8n-nodes-langchain.textSplitterRecursiveCharacterTextSplitter",
          position: [440, 360],
          parameters: { chunkSize: 1000, chunkOverlap: 200 },
          typeVersion: 1
        },
        {
          id: "rag-qdrant-upsert",
          name: "Qdrant Vector Store (Insert)",
          type: "@n8n/n8n-nodes-langchain.vectorStoreQdrant",
          position: [680, 200],
          parameters: { mode: "insert", collectionName: "company_knowledge_base" },
          typeVersion: 1
        },
        {
          id: "rag-embeddings-1",
          name: "OpenAI Embeddings",
          type: "@n8n/n8n-nodes-langchain.embeddingsOpenAi",
          position: [680, 360],
          parameters: { model: "text-embedding-3-small" },
          typeVersion: 1
        },
        {
          id: "rag-chat-trigger",
          name: "User Chat Query Trigger",
          type: "@n8n/n8n-nodes-langchain.manualChatTrigger",
          position: [200, 600],
          typeVersion: 1
        },
        {
          id: "rag-retrieval-agent",
          name: "Conversational Retrieval Agent",
          type: "@n8n/n8n-nodes-langchain.agent",
          position: [520, 600],
          parameters: {
            promptType: "define",
            text: "={{ $json.chatInput }}",
            options: {
              systemMessage: "You are the company document assistant. Only answer questions using retrieved context from the Qdrant Vector Store. Cite document names and page numbers."
            }
          },
          typeVersion: 1.7
        },
        {
          id: "rag-chat-model",
          name: "OpenAI GPT-4o Model",
          type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          position: [420, 800],
          parameters: { model: "gpt-4o", options: { temperature: 0.1 } },
          typeVersion: 1.2
        },
        {
          id: "rag-memory",
          name: "Window Buffer Memory",
          type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
          position: [560, 800],
          parameters: { contextWindowLength: 10 },
          typeVersion: 1.3
        },
        {
          id: "rag-qdrant-tool",
          name: "Qdrant Vector Store Tool",
          type: "@n8n/n8n-nodes-langchain.toolVectorStore",
          position: [700, 800],
          parameters: { name: "company_knowledge", description: "Search company policies, SOPs, and technical documents in Qdrant." },
          typeVersion: 1
        }
      ],
      connections: {
        "Google Drive: New File Ingest": { main: [[{ node: "Default Document Loader", type: "main", index: 0 }]] },
        "Recursive Text Splitter": { ai_textSplitter: [[{ node: "Default Document Loader", type: "ai_textSplitter", index: 0 }]] },
        "Default Document Loader": { ai_document: [[{ node: "Qdrant Vector Store (Insert)", type: "ai_document", index: 0 }]] },
        "OpenAI Embeddings": { ai_embedding: [[{ node: "Qdrant Vector Store (Insert)", type: "ai_embedding", index: 0 }]] },
        "User Chat Query Trigger": { main: [[{ node: "Conversational Retrieval Agent", type: "main", index: 0 }]] },
        "OpenAI GPT-4o Model": { ai_languageModel: [[{ node: "Conversational Retrieval Agent", type: "ai_languageModel", index: 0 }]] },
        "Window Buffer Memory": { ai_memory: [[{ node: "Conversational Retrieval Agent", type: "ai_memory", index: 0 }]] },
        "Qdrant Vector Store Tool": { ai_tool: [[{ node: "Conversational Retrieval Agent", type: "ai_tool", index: 0 }]] }
      }
    }
  },
  {
    id: 'tpl-rag-2-pdf-to-markdown-llamacloud',
    name: 'Pdf to markdown converter with LlamaCloud parser',
    slug: 'pdf-to-markdown-converter-llamacloud-parser',
    category: 'RAG & Knowledge Base',
    complexity: 'Intermediate',
    author: {
      name: 'ParserTech',
      role: 'Document AI Specialist',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    description: 'High-Fidelity Document Extraction: parses complex multi-column PDFs, tables, financial charts, and scanned images using LlamaCloud LlamaParse API and outputs clean, structured Markdown.',
    longDescription: 'Standard OCR tools fail on complex multi-column layouts and financial balance sheets. This workflow sends incoming PDF files to LlamaIndex LlamaCloud LlamaParse, extracts tables directly into clean GitHub-flavored Markdown tables, retains image references, and stores output files in Amazon S3 or Google Drive.',
    tags: ['LlamaParse', 'LlamaCloud', 'PDF to Markdown', 'Document AI', 'Table Extraction', 'OCR'],
    nodeCount: 6,
    stars: 1890,
    downloads: 35100,
    featured: true,
    estimatedSetupMinutes: 10,
    useCases: [
      'Converting annual financial reports and SEC filings into clean markdown for LLM ingest',
      'Preserving complex nested table structures from scientific research papers',
      'Batch-processing legal contract archives into structured text'
    ],
    setupSteps: [
      'Create a LlamaCloud API Key at cloud.llamaindex.ai',
      'Connect destination storage (Google Drive or AWS S3)',
      'Upload a test PDF to the Webhook or trigger manually'
    ],
    requiredCredentials: ['httpHeaderAuth', 'googleDriveOAuth2'],
    documentationMarkdown: `
# PDF to Markdown Converter with LlamaCloud Parser

Extract structured tables and clean markdown from complex PDF documents using LlamaParse.
`,
    workflow: {
      name: "Pdf to markdown converter with LlamaCloud parser",
      nodes: [
        {
          id: "llama-webhook",
          name: "PDF Upload Webhook",
          type: "n8n-nodes-base.webhook",
          position: [200, 300],
          parameters: { path: "pdf-to-markdown", httpMethod: "POST" },
          typeVersion: 1.1
        },
        {
          id: "llama-upload",
          name: "Upload to LlamaParse API",
          type: "n8n-nodes-base.httpRequest",
          position: [440, 300],
          parameters: {
            method: "POST",
            url: "https://api.cloud.llamaindex.ai/api/parsing/upload",
            sendBody: true,
            contentType: "multipart-form-data"
          },
          typeVersion: 4.2
        },
        {
          id: "llama-wait",
          name: "Poll Job Completion",
          type: "n8n-nodes-base.wait",
          position: [680, 300],
          parameters: { resume: "afterTimeInterval", waitAmount: 15, waitUnit: "seconds" },
          typeVersion: 1.1
        },
        {
          id: "llama-fetch-md",
          name: "Download Clean Markdown Result",
          type: "n8n-nodes-base.httpRequest",
          position: [920, 300],
          parameters: {
            url: "=https://api.cloud.llamaindex.ai/api/parsing/job/{{ $('Upload to LlamaParse API').item.json.id }}/result/markdown"
          },
          typeVersion: 4.2
        },
        {
          id: "llama-save",
          name: "Save Markdown to Google Drive",
          type: "n8n-nodes-base.googleDrive",
          position: [1160, 300],
          parameters: { operation: "upload", name: "={{ $('PDF Upload Webhook').item.binary.data.fileName }}.md" },
          typeVersion: 1
        }
      ],
      connections: {
        "PDF Upload Webhook": { main: [[{ node: "Upload to LlamaParse API", type: "main", index: 0 }]] },
        "Upload to LlamaParse API": { main: [[{ node: "Poll Job Completion", type: "main", index: 0 }]] },
        "Poll Job Completion": { main: [[{ node: "Download Clean Markdown Result", type: "main", index: 0 }]] },
        "Download Clean Markdown Result": { main: [[{ node: "Save Markdown to Google Drive", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'tpl-rag-3-legal-compliance-reviewer',
    name: 'Intelligent legal document review and compliance automation',
    slug: 'intelligent-legal-document-review-compliance',
    category: 'RAG & Knowledge Base',
    complexity: 'Advanced',
    author: {
      name: 'LexTech Automations',
      role: 'Legal Engineering Lead',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    description: 'Contract Risk Scanner: ingests vendor agreements (NDAs, MSAs, SLAs), verifies indemnification, liability caps, and GDPR clauses against internal playbooks with Gemini 1.5 Pro, and scores compliance risk.',
    longDescription: 'Accelerate legal team turnaround from 4 days to 4 minutes. Ingesting PDF/Docx contracts, this workflow parses clause structures, checks terms against your internal company Legal Playbook, highlights non-standard terms in redline format, calculates an aggregate Risk Score (0-100), and sends a PDF audit report to in-house counsel.',
    tags: ['Legal Tech', 'Contract Review', 'Gemini 1.5 Pro', 'Compliance', 'Risk Scoring', 'PDF Audit'],
    nodeCount: 8,
    stars: 1950,
    downloads: 33400,
    featured: true,
    estimatedSetupMinutes: 15,
    useCases: [
      'Rapid first-pass review of incoming vendor Master Service Agreements (MSAs)',
      'Checking NDAs against standard company acceptable terms',
      'Automated GDPR and SOC2 data processing addendum (DPA) compliance checks'
    ],
    setupSteps: [
      'Configure Google Gemini API Key in the Gemini 1.5 Pro model node',
      'Upload your company legal policy guidelines in the policy reference node',
      'Set destination notification email or Slack legal channel'
    ],
    requiredCredentials: ['googlePalmApi', 'slackApi'],
    documentationMarkdown: `
# Intelligent Legal Document Review & Compliance Automation

Audit contracts and vendor agreements against company policies with Google Gemini 1.5 Pro.
`,
    workflow: {
      name: "Intelligent legal document review and compliance automation",
      nodes: [
        {
          id: "leg-webhook",
          name: "Contract Upload Webhook",
          type: "n8n-nodes-base.webhook",
          position: [200, 300],
          parameters: { path: "legal-contract-review", httpMethod: "POST" },
          typeVersion: 1.1
        },
        {
          id: "leg-extract",
          name: "Extract Text from PDF Document",
          type: "n8n-nodes-base.readPDF",
          position: [440, 300],
          typeVersion: 1
        },
        {
          id: "leg-agent",
          name: "Legal Compliance Audit Agent",
          type: "@n8n/n8n-nodes-langchain.agent",
          position: [680, 300],
          parameters: {
            promptType: "define",
            text: "=Audit this contract against standard enterprise compliance rules. Identify uncapped liability, non-standard IP assignment, and jurisdiction risks:\n\n{{ $json.text }}"
          },
          typeVersion: 1.7
        },
        {
          id: "leg-model",
          name: "Google Gemini 1.5 Pro Model",
          type: "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
          position: [680, 520],
          parameters: { model: "gemini-1.5-pro-latest" },
          typeVersion: 1
        },
        {
          id: "leg-slack",
          name: "Post Legal Risk Report to Slack",
          type: "n8n-nodes-base.slack",
          position: [920, 300],
          parameters: {
            channel: "#legal-review",
            text: "=⚖️ Contract Review Summary:\n\n{{ $json.output }}"
          },
          typeVersion: 2.1
        }
      ],
      connections: {
        "Contract Upload Webhook": { main: [[{ node: "Extract Text from PDF Document", type: "main", index: 0 }]] },
        "Extract Text from PDF Document": { main: [[{ node: "Legal Compliance Audit Agent", type: "main", index: 0 }]] },
        "Google Gemini 1.5 Pro Model": { ai_languageModel: [[{ node: "Legal Compliance Audit Agent", type: "ai_languageModel", index: 0 }]] },
        "Legal Compliance Audit Agent": { main: [[{ node: "Post Legal Risk Report to Slack", type: "main", index: 0 }]] }
      }
    }
  }
];
