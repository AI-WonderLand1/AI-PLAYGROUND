import { WorkflowTemplate } from '../../types';

export const opsSalesTemplates: WorkflowTemplate[] = [
  {
    id: 'tpl-ops-1-gmail-auto-labelling',
    name: 'Basic automatic Gmail email labelling with OpenAI and Gmail',
    slug: 'basic-automatic-gmail-email-labelling-openai',
    category: 'Productivity & Office',
    complexity: 'Beginner',
    author: {
      name: 'InboxZero Automation',
      role: 'Productivity Engineer',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
    },
    description: 'Autonomous Email Organization: classifies incoming emails using GPT-4o-mini into custom labels (Urgent, Billing, Lead, Newsletter, Spam) and applies Gmail label tags automatically.',
    longDescription: 'Never let your inbox get out of control again. This trigger-based workflow runs whenever a new email arrives in your Gmail account. It passes the sender, subject, and body snippet into an OpenAI classification node, predicts the exact category, and applies native Gmail labels with colored tags.',
    tags: ['Gmail Trigger', 'OpenAI', 'GPT-4o-mini', 'Email Labelling', 'Inbox Zero', 'Productivity'],
    nodeCount: 5,
    stars: 1840,
    downloads: 37900,
    featured: true,
    estimatedSetupMinutes: 8,
    useCases: [
      'Sorting client inquiries and invoices without touching the inbox manually',
      'Filtering low-priority newsletters into a "Read Later" label',
      'Highlighting urgent customer complaints with immediate priority tags'
    ],
    setupSteps: [
      'Connect Gmail OAuth2 credentials with email read and label modification scopes',
      'Create your desired Gmail labels in Gmail settings (e.g., "Urgent", "Invoices", "VIP Leads")',
      'Add OpenAI API key in the OpenAI Chat Model node'
    ],
    requiredCredentials: ['gmailOAuth2', 'openAiApi'],
    documentationMarkdown: `
# Automatic Gmail Email Labelling with OpenAI

Intelligently classify and label incoming emails as soon as they arrive in your inbox.
`,
    workflow: {
      name: "Basic automatic Gmail email labelling with OpenAI and Gmail",
      nodes: [
        {
          id: "gmail-tr-1",
          name: "Gmail: On New Email Received",
          type: "n8n-nodes-base.gmailTrigger",
          position: [200, 300],
          parameters: { pollTimes: { item: [{ mode: "everyMinute" }] } },
          typeVersion: 1
        },
        {
          id: "gmail-classify-agent",
          name: "Email Classification Agent",
          type: "@n8n/n8n-nodes-langchain.agent",
          position: [460, 300],
          parameters: {
            promptType: "define",
            text: "=Classify this email into ONE of: ['URGENT', 'BILLING', 'SALES_LEAD', 'NEWSLETTER', 'GENERAL']. Return only the label string.\n\nFrom: {{ $json.from }}\nSubject: {{ $json.subject }}\nBody: {{ $json.snippet }}"
          },
          typeVersion: 1.7
        },
        {
          id: "gmail-openai-model",
          name: "OpenAI GPT-4o-mini Model",
          type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          position: [460, 520],
          parameters: { model: "gpt-4o-mini", options: { temperature: 0.1 } },
          typeVersion: 1.2
        },
        {
          id: "gmail-apply-label",
          name: "Add Label to Gmail Message",
          type: "n8n-nodes-base.gmail",
          position: [740, 300],
          parameters: {
            operation: "addLabels",
            messageId: "={{ $('Gmail: On New Email Received').item.json.id }}",
            labelIds: ["={{ $json.output }}"]
          },
          typeVersion: 2.1
        }
      ],
      connections: {
        "Gmail: On New Email Received": { main: [[{ node: "Email Classification Agent", type: "main", index: 0 }]] },
        "OpenAI GPT-4o-mini Model": { ai_languageModel: [[{ node: "Email Classification Agent", type: "ai_languageModel", index: 0 }]] },
        "Email Classification Agent": { main: [[{ node: "Add Label to Gmail Message", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'tpl-ops-2-landing-page-cro-analyzer',
    name: 'Analyze Landing Page with OpenAI and Get Optimization Tips',
    slug: 'analyze-landing-page-openai-cro-optimization',
    category: 'Customer Support & Sales',
    complexity: 'Intermediate',
    author: {
      name: 'GrowthDesign Studio',
      role: 'Conversion Rate Optimization Team',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    },
    description: 'Automated CRO Audit Engine: fetches any landing page URL, strips HTML to extract value propositions, headlines, and call-to-actions, runs a rigorous CRO audit via GPT-4o, and sends an actionable teardown report.',
    longDescription: 'Optimize any website for maximum conversions. Send a URL via webhook, and this workflow uses an HTTP scraper to fetch the raw DOM, converts the page structure to readable text, analyzes hero headlines, above-the-fold clarity, social proof, and CTA friction using GPT-4o, and outputs an audit scorecard directly to Slack or Email.',
    tags: ['CRO Audit', 'Landing Page', 'OpenAI GPT-4o', 'Web Scraping', 'Conversion Optimization', 'Slack Report'],
    nodeCount: 6,
    stars: 1680,
    downloads: 31800,
    featured: true,
    estimatedSetupMinutes: 10,
    useCases: [
      'Instant landing page conversion teardowns for clients and agency pitches',
      'Auditing competitor sales pages for copywriting and structural patterns',
      'Automating lead magnet delivery ("Enter your URL for a free 60-second AI audit")'
    ],
    setupSteps: [
      'Connect Webhook or enter your target landing page URL',
      'Configure OpenAI API credentials in the GPT-4o node',
      'Connect your Slack channel or recipient email address'
    ],
    requiredCredentials: ['openAiApi', 'slackApi'],
    documentationMarkdown: `
# Landing Page CRO Teardown with OpenAI

Analyze any landing page for copywriting flaws, CTA friction, and conversion rate improvements.
`,
    workflow: {
      name: "Analyze Landing Page with OpenAI and Get Optimization Tips",
      nodes: [
        {
          id: "cro-webhook",
          name: "Audit URL Webhook Trigger",
          type: "n8n-nodes-base.webhook",
          position: [200, 300],
          parameters: { path: "audit-landing-page", httpMethod: "POST" },
          typeVersion: 1.1
        },
        {
          id: "cro-fetch",
          name: "Fetch Landing Page HTML",
          type: "n8n-nodes-base.httpRequest",
          position: [440, 300],
          parameters: { url: "={{ $json.body.url }}" },
          typeVersion: 4.2
        },
        {
          id: "cro-agent",
          name: "CRO Audit Specialist Agent",
          type: "@n8n/n8n-nodes-langchain.agent",
          position: [680, 300],
          parameters: {
            promptType: "define",
            text: "=Perform a comprehensive CRO audit of this page content. Grade 1-10 on Hero Clarity, Value Proposition, Social Proof, and CTA Friction. Provide 3 high-impact copy rewrites:\n\n{{ $json.data }}"
          },
          typeVersion: 1.7
        },
        {
          id: "cro-model",
          name: "OpenAI GPT-4o Model",
          type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          position: [680, 520],
          parameters: { model: "gpt-4o" },
          typeVersion: 1.2
        },
        {
          id: "cro-slack",
          name: "Send Audit Report to Slack",
          type: "n8n-nodes-base.slack",
          position: [920, 300],
          parameters: {
            channel: "#cro-audits",
            text: "=🚀 Landing Page Audit Report for {{ $('Audit URL Webhook Trigger').item.json.body.url }}:\n\n{{ $json.output }}"
          },
          typeVersion: 2.1
        }
      ],
      connections: {
        "Audit URL Webhook Trigger": { main: [[{ node: "Fetch Landing Page HTML", type: "main", index: 0 }]] },
        "Fetch Landing Page HTML": { main: [[{ node: "CRO Audit Specialist Agent", type: "main", index: 0 }]] },
        "OpenAI GPT-4o Model": { ai_languageModel: [[{ node: "CRO Audit Specialist Agent", type: "ai_languageModel", index: 0 }]] },
        "CRO Audit Specialist Agent": { main: [[{ node: "Send Audit Report to Slack", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'tpl-ops-3-multichannel-support-rag-zendesk',
    name: 'Answer multi-channel support queries with OpenAI RAG and Zendesk/Intercom',
    slug: 'multichannel-support-rag-zendesk-intercom',
    category: 'Customer Support & Sales',
    complexity: 'Advanced',
    author: {
      name: 'CustomerSuccess AI',
      role: 'Support Engineering Lead',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    description: 'Omnichannel AI Support Copilot: triggers on new tickets in Zendesk/Intercom, performs vector search across knowledge base docs, drafts empathetic human-like resolutions, and auto-responds or creates private notes.',
    longDescription: 'Reduce First Response Time (FRT) to under 30 seconds. When a customer opens a ticket in Zendesk or Intercom, this workflow matches the user query against Pinecone Vector Store documentation, constructs a context-aware resolution draft with GPT-4o, and either sends an immediate reply (for high-confidence queries) or posts a private draft note for support agents.',
    tags: ['Zendesk', 'Intercom', 'Pinecone', 'RAG Support', 'Customer Service', 'Auto-Draft'],
    nodeCount: 8,
    stars: 2100,
    downloads: 39500,
    featured: true,
    estimatedSetupMinutes: 18,
    useCases: [
      'Resolving 60%+ of tier-1 support tickets automatically',
      'Equipping human support agents with ready-to-send accurate answers',
      'Maintaining consistent tone and accurate product information across global shifts'
    ],
    setupSteps: [
      'Connect Zendesk or Intercom OAuth2 credentials',
      'Set up Pinecone or Qdrant vector database with your help center articles',
      'Configure auto-reply confidence threshold (default 85%)'
    ],
    requiredCredentials: ['zendeskOAuth2Api', 'openAiApi', 'pineconeApi'],
    documentationMarkdown: `
# Multi-Channel AI Customer Support with RAG & Zendesk

Connect Zendesk and Intercom to your company knowledge base for instant autonomous support.
`,
    workflow: {
      name: "Answer multi-channel support queries with OpenAI RAG",
      nodes: [
        {
          id: "cs-zendesk-trigger",
          name: "Zendesk: New Ticket Trigger",
          type: "n8n-nodes-base.zendeskTrigger",
          position: [200, 300],
          parameters: { event: "ticketCreated" },
          typeVersion: 1
        },
        {
          id: "cs-agent",
          name: "Support Resolution Copilot",
          type: "@n8n/n8n-nodes-langchain.agent",
          position: [460, 300],
          parameters: {
            promptType: "define",
            text: "={{ $json.ticket.description }}",
            options: {
              systemMessage: "You are a friendly, empathetic customer support specialist. Use your knowledge base tool to find verified solutions. Keep answers clear and step-by-step."
            }
          },
          typeVersion: 1.7
        },
        {
          id: "cs-model",
          name: "OpenAI GPT-4o Model",
          type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          position: [360, 520],
          parameters: { model: "gpt-4o", options: { temperature: 0.3 } },
          typeVersion: 1.2
        },
        {
          id: "cs-pinecone-tool",
          name: "Pinecone Help Center Tool",
          type: "@n8n/n8n-nodes-langchain.toolVectorStore",
          position: [560, 520],
          parameters: { name: "help_center_kb", description: "Search official help center guides, troubleshooting steps, and refund policies." },
          typeVersion: 1
        },
        {
          id: "cs-zendesk-reply",
          name: "Update Zendesk Ticket with Draft",
          type: "n8n-nodes-base.zendesk",
          position: [740, 300],
          parameters: {
            operation: "update",
            ticketId: "={{ $('Zendesk: New Ticket Trigger').item.json.ticket.id }}",
            comment: { public: false, body: "={{ $json.output }}" }
          },
          typeVersion: 1
        }
      ],
      connections: {
        "Zendesk: New Ticket Trigger": { main: [[{ node: "Support Resolution Copilot", type: "main", index: 0 }]] },
        "OpenAI GPT-4o Model": { ai_languageModel: [[{ node: "Support Resolution Copilot", type: "ai_languageModel", index: 0 }]] },
        "Pinecone Help Center Tool": { ai_tool: [[{ node: "Support Resolution Copilot", type: "ai_tool", index: 0 }]] },
        "Support Resolution Copilot": { main: [[{ node: "Update Zendesk Ticket with Draft", type: "main", index: 0 }]] }
      }
    }
  }
];
