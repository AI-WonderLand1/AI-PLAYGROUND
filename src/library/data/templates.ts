import { WorkflowTemplate } from '../types';

// Template 1: Create a branded AI-powered website chatbot
const template1: WorkflowTemplate = {
  id: 'template-1-branded-chatbot',
  name: 'Create a branded AI-powered website chatbot',
  slug: 'branded-ai-website-chatbot',
  category: 'AI Agents & LLMs',
  complexity: 'Advanced',
  author: {
    name: 'Wayne Simpson',
    role: 'Founder at nocodecreative.io',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    url: 'https://nocodecreative.io'
  },
  description: 'Intelligent executive PA chatbot for website booking, calendar availability calculation via Outlook Graph API, and client email escalation.',
  longDescription: 'This comprehensive workflow creates an intelligent AI assistant that embeds into your website. It checks live Outlook calendar events for the next 14 days, computes available 30-minute meeting slots dynamically using custom JavaScript, handles appointments without double-booking, and sends HTML summary emails to human founders for specialized inquiries.',
  tags: ['LangChain', 'OpenAI', 'Outlook API', 'Calendar Booking', 'Executive PA', 'Webchat Widget'],
  nodeCount: 14,
  stars: 342,
  downloads: 4890,
  featured: true,
  estimatedSetupMinutes: 15,
  useCases: [
    'Automating consultation bookings on agency or consultancy websites',
    'Filtering high-intent leads and gathering client project requirements',
    'Checking calendar busy/free time slots with timezone conversions',
    'Sending branded customer inquiry alert emails to executives'
  ],
  setupSteps: [
    'Connect your Microsoft Outlook OAuth2 credentials in n8n',
    'Update business hours and time zone (defaults to Europe/London) in the code node',
    'Configure OpenAI API credentials with GPT-4o model access',
    'Embed the chat trigger widget or connect your frontend webhook endpoint',
    'Replace the destination notification email address in the Send Message node'
  ],
  requiredCredentials: ['microsoftOutlookOAuth2Api', 'openAiApi'],
  documentationMarkdown: `
# Branded AI Website Chatbot & Appointment Scheduler

This workflow creates an end-to-end autonomous Executive Assistant chatbot that coordinates calendar bookings, avoids double-booking via real-time Microsoft Graph queries, and falls back to detailed lead intake emails.

### Workflow Architecture:
1. **Chat Trigger / Webhook**: Receives user conversation messages from your web chat widget.
2. **AI Agent (LangChain)**: Orchestrates conversation using OpenAI GPT-4o and Window Buffer Memory.
3. **Availability Engine**: Sub-workflow querying Microsoft Graph \`/me/calendarView\`, calculating exact free slots within business hours (08:00 - 17:30 UTC).
4. **Appointment Maker Tool**: Directly creates calendar event invites via Outlook Graph API with Microsoft Teams meeting links.
5. **Human Escalation**: Generates branded HTML emails to the agency founder when human assistance is requested.
`,
  workflow: {
    name: "Create a branded AI-powered website chatbot",
    nodes: [
      {
        parameters: {
          sessionIdType: "customKey",
          sessionKey: "={{ $json.sessionId }}",
          contextWindowLength: 20
        },
        id: "22c8d63b-ce3c-4aab-b3f6-4bae8c1b9ec5",
        name: "Window Buffer Memory",
        type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
        position: [1216, 528],
        typeVersion: 1.2
      },
      {
        parameters: { options: {} },
        id: "45403d5c-6e85-424f-b40b-c6214b57457b",
        name: "Respond to Webhook",
        type: "n8n-nodes-base.respondToWebhook",
        position: [1632, 224],
        typeVersion: 1.1
      },
      {
        parameters: {
          model: "gpt-4o-2024-08-06",
          options: { temperature: 0.4 }
        },
        id: "1111262a-1743-4bae-abf1-f69d2e1a580c",
        name: "OpenAI Chat Model",
        type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
        position: [1120, 400],
        typeVersion: 1
      },
      {
        parameters: {
          toolDescription: "Call this tool to make the appointment, ensure you send user email, name, company, reason and ISO time.",
          method: "POST",
          url: "https://graph.microsoft.com/v1.0/me/events",
          authentication: "predefinedCredentialType",
          nodeCredentialType: "microsoftOutlookOAuth2Api"
        },
        id: "df891547-c715-4dc6-bfcc-c0ac5cfcaf02",
        name: "Make Appointment",
        type: "@n8n/n8n-nodes-langchain.toolHttpRequest",
        position: [1568, 480],
        typeVersion: 1.1
      },
      {
        parameters: {},
        id: "44141c44-de49-4707-b287-24007c84ca21",
        name: "Execute Workflow Trigger",
        type: "n8n-nodes-base.executeWorkflowTrigger",
        position: [1920, 224],
        typeVersion: 1
      },
      {
        parameters: {
          assignments: {
            assignments: [{ id: "c0b6e779", name: "response", type: "array", value: "={{ $json.freeTimeSlots.toJsonString() }}" }]
          }
        },
        id: "795e1451-57d8-4563-8b86-5a75df2427b6",
        name: "varResponse",
        type: "n8n-nodes-base.set",
        position: [2880, 112],
        typeVersion: 3.4
      },
      {
        parameters: {
          jsCode: "// Free slot calculation\nconst businessHoursStart = '08:00:00Z';\nconst businessHoursEnd = '17:30:00Z';\nconst inputData = items[0].json.value || [];\nconst freeTimeSlots = [];\n// Compute business slots\nreturn [{ json: { freeTimeSlots } }];"
        },
        id: "4283635f-649c-4cc7-84b9-37524ddb6ce0",
        name: "freeTimeSlots",
        type: "n8n-nodes-base.code",
        position: [2656, 112],
        typeVersion: 2
      },
      {
        parameters: {
          url: "https://graph.microsoft.com/v1.0/me/calendarView",
          authentication: "predefinedCredentialType",
          nodeCredentialType: "microsoftOutlookOAuth2Api"
        },
        id: "0786b561-449e-4c8f-bddb-c2bbd95dc197",
        name: "Get Events",
        type: "n8n-nodes-base.httpRequest",
        position: [2432, 112],
        typeVersion: 4.2
      },
      {
        parameters: {
          name: "Get_availability",
          description: "Call this tool to check calendar availability for the next 2 weeks"
        },
        id: "55c4233e-d395-4193-9a1d-1884faed6f1e",
        name: "Get Availability",
        type: "@n8n/n8n-nodes-langchain.toolWorkflow",
        position: [1520, 720],
        typeVersion: 1.2
      },
      {
        parameters: {
          name: "Send_email",
          description: "Call this tool when customer wants to speak with a human or has custom project inquiries"
        },
        id: "096d1962-31e6-4b3b-ba75-7956f70a6a32",
        name: "Send Message",
        type: "@n8n/n8n-nodes-langchain.toolWorkflow",
        position: [1376, 720],
        typeVersion: 1.2
      },
      {
        parameters: {
          public: true,
          mode: "webhook"
        },
        id: "285ddd31-5412-4d1c-ab80-d9960ec902bb",
        name: "Chat Trigger",
        type: "@n8n/n8n-nodes-langchain.chatTrigger",
        position: [368, 240],
        typeVersion: 1
      },
      {
        parameters: {
          rules: {
            values: [
              { conditions: { conditions: [{ leftValue: "={{ $json.route }}", rightValue: "availability" }] }, outputKey: "availability" },
              { conditions: { conditions: [{ leftValue: "={{ $json.route }}", rightValue: "message" }] }, outputKey: "message" }
            ]
          }
        },
        id: "032a26e9-6853-490d-991b-b2af2d845f58",
        name: "Switch",
        type: "n8n-nodes-base.switch",
        position: [2128, 224],
        typeVersion: 3.2
      },
      {
        parameters: {
          promptType: "define",
          text: "={{ $json.chatInput }}",
          options: {
            systemMessage: "You are an intelligent executive assistant for Wayne at nocodecreative.io..."
          }
        },
        id: "5dfda5c9-eeeb-421a-a80d-f42c94602080",
        name: "AI Agent",
        type: "@n8n/n8n-nodes-langchain.agent",
        position: [1216, 224],
        typeVersion: 1.6
      },
      {
        parameters: {
          content: "Ensure placeholders are replaced with your credentials and timezone",
          height: 180,
          width: 300
        },
        id: "5a2636f1-47d3-4421-840b-56553bf14d82",
        name: "Sticky Note",
        type: "n8n-nodes-base.stickyNote",
        position: [1328, 640],
        typeVersion: 1
      }
    ],
    connections: {
      "Chat Trigger": { main: [[{ node: "AI Agent", type: "main", index: 0 }]] },
      "AI Agent": { main: [[{ node: "Respond to Webhook", type: "main", index: 0 }]] },
      "OpenAI Chat Model": { ai_languageModel: [[{ node: "AI Agent", type: "ai_languageModel", index: 0 }]] },
      "Window Buffer Memory": { ai_memory: [[{ node: "AI Agent", type: "ai_memory", index: 0 }]] },
      "Make Appointment": { ai_tool: [[{ node: "AI Agent", type: "ai_tool", index: 0 }]] },
      "Get Availability": { ai_tool: [[{ node: "AI Agent", type: "ai_tool", index: 0 }]] },
      "Send Message": { ai_tool: [[{ node: "AI Agent", type: "ai_tool", index: 0 }]] },
      "Execute Workflow Trigger": { main: [[{ node: "Switch", type: "main", index: 0 }]] },
      "Switch": {
        main: [
          [{ node: "Get Events", type: "main", index: 0 }],
          [{ node: "varResponse", type: "main", index: 0 }]
        ]
      },
      "Get Events": { main: [[{ node: "freeTimeSlots", type: "main", index: 0 }]] },
      "freeTimeSlots": { main: [[{ node: "varResponse", type: "main", index: 0 }]] }
    }
  }
};

// Template 2: Bulk Website Page Generator (AI + Pexels)
const template2: WorkflowTemplate = {
  id: 'template-2-bulk-page-generator',
  name: 'Bulk Website Page Generator (AI + Pexels)',
  slug: 'bulk-website-page-generator-ai-pexels',
  category: 'AI Agents & LLMs',
  complexity: 'Intermediate',
  author: {
    name: 'n8n Community Creator',
    role: 'Automations Architect',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
  },
  description: 'Generate multi-page SEO website copy in semantic HTML with automated Pexels stock photo matching and direct CMS publishing via REST API.',
  longDescription: 'Takes business briefs from web forms or webhooks, prompts Google Gemini / LangChain agent with structured JSON outputs, queries Pexels photo search API for high-resolution matching imagery, merges content in memory, and creates full pages in your CMS.',
  tags: ['Google Gemini', 'Pexels API', 'SEO Copywriting', 'Supabase Vector', 'CMS Publisher'],
  nodeCount: 12,
  stars: 215,
  downloads: 3120,
  featured: false,
  estimatedSetupMinutes: 10,
  useCases: [
    'Rapidly prototyping complete website page suites (Home, About, Services, Contact)',
    'Generating SEO landing pages for multi-location businesses',
    'Auto-fetching curated royalty-free images based on page context',
    'Pushing drafted pages directly into headless CMS or WordPress'
  ],
  setupSteps: [
    'Add your Pexels API Key in HTTP Request Authorization header',
    'Configure your Google Gemini API credential or n8n credits',
    'Set your target CMS endpoint URL and Bearer token in the Create Page node',
    'Optionally connect Supabase Vector store for brand tone guidelines'
  ],
  requiredCredentials: ['googlePalmApi', 'httpHeaderAuth', 'httpBearerAuth'],
  documentationMarkdown: `
# Bulk Website Page Generator (AI + Pexels)

This workflow automates bulk content creation and visual asset acquisition for websites.

### Flow Breakdown:
1. **Site Brief Form**: Captures Business Type, Pages Needed, and Tone.
2. **Generate Pages AI**: Uses Google Gemini to draft semantic HTML without markdown code blocks.
3. **Parse Pages**: Validates structured array JSON output \`[{title, slug, content}]\`.
4. **Search Pexels Image**: Queries Pexels high-res images for each generated page.
5. **Create Page**: POSTs structured content and 2x image URL to your CMS API.
`,
  workflow: {
    name: "Bulk Website Page Generator (AI + Pexels)",
    nodes: [
      {
        parameters: {
          formTitle: "Generate Website Pages",
          formDescription: "Describe the site and list the pages you want.",
          formFields: {
            values: [
              { fieldLabel: "Business Type", requiredField: true },
              { fieldLabel: "Pages Needed", requiredField: true },
              { fieldLabel: "Tone", requiredField: true }
            ]
          }
        },
        id: "737ed564-6b96-4eef-943e-31f362faf1f0",
        name: "Site Brief Form",
        type: "n8n-nodes-base.formTrigger",
        position: [0, 192],
        typeVersion: 2.6
      },
      {
        parameters: {
          promptType: "define",
          text: "=You are an expert web copywriter. Create website pages for: {{ $json['Business Type'] }}",
          hasOutputParser: true
        },
        id: "8f09ec38-8a32-4f35-bf27-105bd1956c57",
        name: "Generate Pages AI",
        type: "@n8n/n8n-nodes-langchain.agent",
        position: [288, 80],
        typeVersion: 3.1
      },
      {
        parameters: { options: {} },
        id: "482a8ad8-f32c-4f18-8db8-0b7628eba297",
        name: "Gemini Model",
        type: "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
        position: [232, 312],
        typeVersion: 1.1
      },
      {
        parameters: {
          jsonSchemaExample: "[{\"title\":\"Home\",\"slug\":\"home\",\"content\":\"<h2>Welcome</h2>\"}]"
        },
        id: "c6906935-af24-4cc7-b335-3ccb1dd6ecdb",
        name: "Parse Pages",
        type: "@n8n/n8n-nodes-langchain.outputParserStructured",
        position: [488, 312],
        typeVersion: 1.3
      },
      {
        parameters: {
          url: "=https://api.pexels.com/v1/search?query={{ encodeURIComponent($json.title) }}&per_page=1",
          authentication: "genericCredentialType"
        },
        id: "b41f5c36-2676-4028-92d3-41f3f05faa64",
        name: "Search Pexels Image",
        type: "n8n-nodes-base.httpRequest",
        position: [752, 720],
        typeVersion: 4.4
      },
      {
        parameters: {
          method: "POST",
          url: "https://your-cms-domain.com/api/pages",
          sendBody: true,
          specifyBody: "json"
        },
        id: "5937119e-3495-409e-95ec-89e5966255c3",
        name: "Create Page",
        type: "n8n-nodes-base.httpRequest",
        position: [1488, 528],
        typeVersion: 4.4
      },
      {
        parameters: { contextWindowLength: 300 },
        id: "4caf2892-d65d-47f9-915a-f9f7722ecb63",
        name: "MongoDB Chat Memory",
        type: "@n8n/n8n-nodes-langchain.memoryMongoDbChat",
        position: [360, 312],
        typeVersion: 1.1
      },
      {
        parameters: {
          numberInputs: 3
        },
        id: "9ff6a02b-7a4b-4711-bb69-5f2c34e6f4d7",
        name: "Merge",
        type: "n8n-nodes-base.merge",
        position: [1040, 512],
        typeVersion: 3.2
      }
    ],
    connections: {
      "Site Brief Form": { main: [[{ node: "Generate Pages AI", type: "main", index: 0 }]] },
      "Gemini Model": { ai_languageModel: [[{ node: "Generate Pages AI", type: "ai_languageModel", index: 0 }]] },
      "Parse Pages": { ai_outputParser: [[{ node: "Generate Pages AI", type: "ai_outputParser", index: 0 }]] },
      "MongoDB Chat Memory": { ai_memory: [[{ node: "Generate Pages AI", type: "ai_memory", index: 0 }]] },
      "Generate Pages AI": { main: [[{ node: "Search Pexels Image", type: "main", index: 0 }]] },
      "Search Pexels Image": { main: [[{ node: "Merge", type: "main", index: 0 }]] },
      "Merge": { main: [[{ node: "Create Page", type: "main", index: 0 }]] }
    }
  }
};

// Template 3: Generate AI viral videos with VEO 3 and upload to TikTok
const template3: WorkflowTemplate = {
  id: 'template-3-veo3-tiktok',
  name: 'Generate AI viral videos with VEO 3 and upload to TikTok',
  slug: 'ai-viral-videos-veo3-tiktok',
  category: 'Social Media & Video',
  complexity: 'Advanced',
  author: {
    name: 'Dr. Firas',
    role: 'AI Automation Consultant',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    url: 'https://youtube.com/@DRFIRASS'
  },
  description: 'Automated daily viral video production pipeline: AI ideation (GPT-5/VEO 3), Google Sheets metadata logging, Kie VEO rendering, and auto-publishing to TikTok via Blotato.',
  longDescription: 'Generates daily before/after viral 9:16 vertical video scripts, logs all prompts and hashtags to Google Sheets, sends render jobs to the Google VEO 3 video synthesis API, waits for rendering to complete, downloads the result, and publishes automatically to TikTok.',
  tags: ['Google VEO 3', 'TikTok', 'Video AI', 'Blotato', 'Google Sheets', 'Daily Automation'],
  nodeCount: 16,
  stars: 580,
  downloads: 8750,
  featured: true,
  estimatedSetupMinutes: 20,
  useCases: [
    'Automating hands-off daily TikTok content creation',
    'Testing viral Before/After transformation video concepts at scale',
    'Integrating Google VEO 3 text-to-video API via webhook queues',
    'Synchronizing video assets across cloud storage and social channels'
  ],
  setupSteps: [
    'Set up OpenAI API Key for GPT-4/5 ideation agent',
    'Connect Google Sheets OAuth2 to log ideas, prompt payloads, and final MP4 URLs',
    'Get your Kie / fal.ai VEO 3 API credentials and set in HTTP Request node',
    'Install Blotato community node in n8n and link your TikTok account'
  ],
  requiredCredentials: ['openAiApi', 'googleSheetsOAuth2Api', 'httpHeaderAuth'],
  documentationMarkdown: `
# Daily AI Viral Video Generation with VEO 3 & TikTok

Automate high-converting short-form video creation with zero manual editing.

### Pipeline Stages:
1. **Schedule Trigger**: Fires daily to start generation batch.
2. **Concept & Prompt Generator**: Formulates high-contrast BEFORE/AFTER visual concepts with exact camera movement, lighting, and sound prompts.
3. **Google Sheets Sync**: Records concept title, environment descriptors, and generation status.
4. **VEO 3 API Dispatch**: Submits rendering job with 9:16 aspect ratio and \`veo3_fast\` model.
5. **Wait & Poll**: Waits 3 minutes, polls task status, and gets final MP4 video link.
6. **Blotato Publisher**: Uploads media and auto-posts to TikTok with trending hashtags.
`,
  workflow: {
    name: "Generate AI viral videos with VEO 3 and upload to TikTok",
    nodes: [
      {
        parameters: { rule: { interval: [{}] } },
        id: "958b1b16-4eb0-436a-ac87-b5d529e414bc",
        name: "Trigger: Start Daily Content Generation",
        type: "n8n-nodes-base.scheduleTrigger",
        position: [992, 432],
        typeVersion: 1.2
      },
      {
        parameters: {
          promptType: "define",
          text: "=Generate a BEFORE/AFTER video concept...",
          hasOutputParser: true
        },
        id: "5017f6ed-03cb-408c-bd47-97008e2d7352",
        name: "Generate Creative Video Idea",
        type: "@n8n/n8n-nodes-langchain.agent",
        position: [1392, 432],
        typeVersion: 1.9
      },
      {
        parameters: { options: {} },
        id: "d167d2b8-320e-4ea8-9f83-fae9840db585",
        name: "LLM: Generate Raw Idea (GPT-5)",
        type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
        position: [1296, 704],
        typeVersion: 1.2
      },
      {
        parameters: {
          operation: "append",
          documentId: { mode: "id", value: "" },
          sheetName: { mode: "id", value: "" }
        },
        id: "4fc884ca-3611-4148-9f22-e6f6543363d0",
        name: "Save Idea & Metadata to Google Sheets",
        type: "n8n-nodes-base.googleSheets",
        position: [1824, 432],
        typeVersion: 4.5
      },
      {
        parameters: {
          method: "POST",
          url: "https://api.kie.ai/api/v1/veo/generate",
          authentication: "genericCredentialType"
        },
        id: "ca35eeb6-ad4a-43a4-932d-982ea8c5b34c",
        name: "Generate Video with VEO3",
        type: "n8n-nodes-base.httpRequest",
        position: [1824, 912],
        typeVersion: 4.2
      },
      {
        parameters: { amount: 3, unit: "minutes" },
        id: "58b989a8-21a0-41a3-b6b0-1962720e0440",
        name: "Wait for VEO3 Rendering",
        type: "n8n-nodes-base.wait",
        position: [1552, 1104],
        typeVersion: 1.1
      },
      {
        parameters: {
          platform: "tiktok",
          postCreateTiktokOptionIsAiGenerated: true
        },
        id: "1825853b-1c3e-479b-acff-4d2804cf10d9",
        name: "TikTok",
        type: "@blotato/n8n-nodes-blotato.blotato",
        position: [1600, 1344],
        typeVersion: 2
      }
    ],
    connections: {
      "Trigger: Start Daily Content Generation": { main: [[{ node: "Generate Creative Video Idea", type: "main", index: 0 }]] },
      "LLM: Generate Raw Idea (GPT-5)": { ai_languageModel: [[{ node: "Generate Creative Video Idea", type: "ai_languageModel", index: 0 }]] },
      "Generate Creative Video Idea": { main: [[{ node: "Save Idea & Metadata to Google Sheets", type: "main", index: 0 }]] },
      "Save Idea & Metadata to Google Sheets": { main: [[{ node: "Generate Video with VEO3", type: "main", index: 0 }]] },
      "Generate Video with VEO3": { main: [[{ node: "Wait for VEO3 Rendering", type: "main", index: 0 }]] },
      "Wait for VEO3 Rendering": { main: [[{ node: "TikTok", type: "main", index: 0 }]] }
    }
  }
};

// Template 4: Voice AI chatbot with OpenAI, RAG (Qdrant) & Guardrails for WordPress
const template4: WorkflowTemplate = {
  id: 'template-4-voice-ai-rag-wordpress',
  name: 'Voice AI chatbot with OpenAI, RAG (Qdrant) & Guardrails for WordPress',
  slug: 'voice-ai-chatbot-rag-qdrant-wordpress',
  category: 'RAG & Knowledge Base',
  complexity: 'Advanced',
  author: {
    name: 'n3witalia',
    role: 'Voice AI Systems Specialist',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  },
  description: 'Bi-directional voice AI bot for WordPress with speech-to-text, prompt jailbreak guardrails, Qdrant vector retrieval on Google Drive docs, and natural TTS voice synthesis.',
  longDescription: 'Processes binary audio stream inputs over webhooks, transcribes speech with Whisper STT, screens for jailbreaks using dedicated AI Guardrails, queries company knowledge stored in Qdrant Vector Store with OpenAI Embeddings, and streams back realistic TTS audio using the Onyx voice model.',
  tags: ['Voice AI', 'Qdrant RAG', 'OpenAI Whisper', 'Guardrails', 'WordPress Plugin', 'Text-to-Speech'],
  nodeCount: 18,
  stars: 492,
  downloads: 6230,
  featured: true,
  estimatedSetupMinutes: 20,
  useCases: [
    'Adding hands-free voice conversational support to WordPress sites',
    'Safely answering company queries using vetted PDF and doc knowledge bases',
    'Preventing prompt injection and malicious jailbreaks in production AI systems',
    'Automating document vectorization directly from Google Drive folders'
  ],
  setupSteps: [
    'Deploy Qdrant vector database (cloud or self-hosted) and create collection',
    'Connect Google Drive to select your source business documents folder',
    'Set up OpenAI API credentials for Whisper STT, GPT-5/4, and TTS Onyx voice',
    'Install the WordPress Voicebot AI Agent plugin and paste the Webhook URL'
  ],
  requiredCredentials: ['openAiApi', 'googleDriveOAuth2Api', 'httpHeaderAuth'],
  documentationMarkdown: `
# Voice AI Chatbot with Document Retrieval & Guardrails for WordPress

An enterprise-grade voicebot pipeline handling voice in, RAG retrieval, and voice out.

### Execution Path:
1. **Audio Ingestion**: Webhook receives raw audio payload from WordPress plugin.
2. **STT Transcription**: OpenAI Whisper converts speech to text.
3. **Safety Guardrails**: Analyzes user intent threshold to eliminate jailbreak exploits.
4. **Vector Retrieval (RAG)**: Retrieves top document fragments from Qdrant vector store.
5. **AI Assistant Reasoning**: Formulates precise, polite response using company facts and real-time clock.
6. **TTS Synthesis**: Synthesizes audio stream in binary format and streams back immediately.
`,
  workflow: {
    name: "Voice AI chatbot with OpenAI, RAG (Qdrant) & Guardrails for WordPress",
    nodes: [
      {
        parameters: { httpMethod: "POST", path: "voice-agent-webhook", responseMode: "responseNode" },
        id: "c0711c84-945c-43a3-a704-6b7a3399a881",
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        position: [656, 1488],
        typeVersion: 2
      },
      {
        parameters: { resource: "audio", operation: "transcribe" },
        id: "e1b57053-a570-47c3-bac6-b9b4fd15d217",
        name: "Generate text (STT)",
        type: "@n8n/n8n-nodes-langchain.openAi",
        position: [880, 1488],
        typeVersion: 1.7
      },
      {
        parameters: { text: "={{ $json.text }}", guardrails: { jailbreak: { value: { threshold: 0.7 } } } },
        id: "d9b56072-ee50-41ff-b5f4-be4694bbee9e",
        name: "Guardrails",
        type: "@n8n/n8n-nodes-langchain.guardrails",
        position: [1120, 1488],
        typeVersion: 1
      },
      {
        parameters: { promptType: "define", text: "={{ $json.guardrailsInput }}" },
        id: "3a86fc93-3718-40c1-bec6-4e557e747f69",
        name: "Voicebot AI Agent",
        type: "@n8n/n8n-nodes-langchain.agent",
        position: [1712, 1168],
        typeVersion: 1.7
      },
      {
        parameters: { name: "company_knowledgebase", description: "Retrieve business data" },
        id: "d33b2c95-2f32-435a-893e-67daff6f3ffe",
        name: "RAG",
        type: "@n8n/n8n-nodes-langchain.toolVectorStore",
        position: [2144, 1376],
        typeVersion: 1
      },
      {
        parameters: { qdrantCollection: { mode: "list", value: "company_docs" } },
        id: "87dec119-9774-407d-9512-bb30ae7614cb",
        name: "Qdrant Vector Store",
        type: "@n8n/n8n-nodes-langchain.vectorStoreQdrant",
        position: [2048, 1568],
        typeVersion: 1
      },
      {
        parameters: { resource: "audio", input: "={{ $json.output }}", voice: "onyx" },
        id: "f9a2730e-3fb1-46fd-a52f-1bbb27dcf57c",
        name: "Generate audio (TTS)",
        type: "@n8n/n8n-nodes-langchain.openAi",
        position: [2048, 1168],
        typeVersion: 1.7
      },
      {
        parameters: { respondWith: "binary" },
        id: "e14baaa6-fa70-408c-bfef-63698b56807a",
        name: "Respond to Webhook",
        type: "n8n-nodes-base.respondToWebhook",
        position: [2256, 1168],
        typeVersion: 1.1
      }
    ],
    connections: {
      "Webhook": { main: [[{ node: "Generate text (STT)", type: "main", index: 0 }]] },
      "Generate text (STT)": { main: [[{ node: "Guardrails", type: "main", index: 0 }]] },
      "Guardrails": { main: [[{ node: "Voicebot AI Agent", type: "main", index: 0 }]] },
      "RAG": { ai_tool: [[{ node: "Voicebot AI Agent", type: "ai_tool", index: 0 }]] },
      "Qdrant Vector Store": { ai_vectorStore: [[{ node: "RAG", type: "ai_vectorStore", index: 0 }]] },
      "Voicebot AI Agent": { main: [[{ node: "Generate audio (TTS)", type: "main", index: 0 }]] },
      "Generate audio (TTS)": { main: [[{ node: "Respond to Webhook", type: "main", index: 0 }]] }
    }
  }
};

// Template 5: Generate & auto-post AI videos to social media with Veo3 and Blotato
const template5: WorkflowTemplate = {
  id: 'template-5-multi-social-veo3',
  name: 'Generate & auto-post AI videos to social media with Veo3 and Blotato',
  slug: 'generate-autopost-ai-videos-social-media-veo3-blotato',
  category: 'Social Media & Video',
  complexity: 'Advanced',
  author: {
    name: 'Automation Studio',
    role: 'Growth Automation Lead',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  description: 'Omnichannel social media syndication: Generates cinematic VEO 3 prompts and simultaneously auto-posts to Instagram, YouTube, TikTok, Facebook, Threads, Twitter, LinkedIn, Bluesky, and Pinterest.',
  longDescription: 'An all-in-one distribution power tool that produces high-end video prompts, renders them using the fal.ai VEO3 queue API, logs results to Google Sheets, and broadcasts the finished video across 9 distinct social media networks via Blotato API in parallel.',
  tags: ['Omnichannel Video', 'Veo3', 'Instagram', 'YouTube Shorts', 'TikTok', 'LinkedIn', 'Twitter/X', 'Blotato'],
  nodeCount: 22,
  stars: 710,
  downloads: 11400,
  featured: true,
  estimatedSetupMinutes: 25,
  useCases: [
    'Broadcasting short-form video to 9 social platforms in 1 click',
    'Scaling organic video marketing across Instagram Reels, Shorts, and TikTok',
    'Centralizing social account IDs and tracking metrics in Google Sheets'
  ],
  setupSteps: [
    'Create your fal.ai account and obtain the VEO 3 API access key',
    'Register your Blotato API key and connect your social profiles',
    'Set up a Google Sheet with columns for Title, Description, and Final URL',
    'Activate the Schedule Trigger to run daily or trigger manually for instant batches'
  ],
  requiredCredentials: ['openAiApi', 'googleSheetsOAuth2Api', 'httpHeaderAuth'],
  documentationMarkdown: `
# Multi-Platform AI Video Auto-Poster (Veo3 & Blotato)

Publish 1 AI video to 9 social media platforms simultaneously with custom metadata formatting.

### Supported Channels:
- **Instagram Reels**
- **YouTube Shorts**
- **TikTok**
- **Facebook Reels & Pages**
- **Threads**
- **Twitter / X**
- **LinkedIn Feed**
- **Bluesky**
- **Pinterest Pins**
`,
  workflow: {
    name: "Generate & auto-post AI videos to social media with Veo3 and Blotato",
    nodes: [
      {
        parameters: { rule: { interval: [{}] } },
        id: "3ac616bc-67bb-494c-bd24-3753fc03e7dc",
        name: "Trigger: Run Daily Script Generator",
        type: "n8n-nodes-base.scheduleTrigger",
        position: [528, 320],
        typeVersion: 1.2
      },
      {
        parameters: { promptType: "define", text: "Give me an immersive concept..." },
        id: "8ae30b31-2ac9-4b62-9094-ce36197d319d",
        name: "AI Agent: Generate Video Concept",
        type: "@n8n/n8n-nodes-langchain.agent",
        position: [688, 320],
        typeVersion: 1.9
      },
      {
        parameters: {
          method: "POST",
          url: "https://queue.fal.run/fal-ai/veo3",
          authentication: "genericCredentialType"
        },
        id: "4f8e53f5-d0a1-46c1-a855-a7067b493d66",
        name: "Call Veo3 API to Generate Video",
        type: "n8n-nodes-base.httpRequest",
        position: [560, 864],
        typeVersion: 4.2
      },
      {
        parameters: {
          method: "POST",
          url: "https://backend.blotato.com/v2/media"
        },
        id: "779818a1-97bd-4bf9-ba17-995c1439df6f",
        name: "Upload Video to Blotato",
        type: "n8n-nodes-base.httpRequest",
        position: [672, 1440],
        typeVersion: 4.2
      },
      {
        parameters: { method: "POST", url: "https://backend.blotato.com/v2/posts" },
        id: "113d635c-bf8f-4ed3-801e-de78b0df9437",
        name: "INSTAGRAM",
        type: "n8n-nodes-base.httpRequest",
        position: [960, 1200],
        typeVersion: 4.2
      },
      {
        parameters: { method: "POST", url: "https://backend.blotato.com/v2/posts" },
        id: "02aa72ee-e5b9-44ee-9cbf-e8ddbc259570",
        name: "YOUTUBE",
        type: "n8n-nodes-base.httpRequest",
        position: [1168, 1200],
        typeVersion: 4.2
      },
      {
        parameters: { method: "POST", url: "https://backend.blotato.com/v2/posts" },
        id: "b9e82889-b753-43e7-b417-213a99763802",
        name: "TIKTOK",
        type: "n8n-nodes-base.httpRequest",
        position: [1376, 1200],
        typeVersion: 4.2
      },
      {
        parameters: { method: "POST", url: "https://backend.blotato.com/v2/posts" },
        id: "edf4cd31-ae48-4996-816e-8a32ac411e75",
        name: "FACEBOOK",
        type: "n8n-nodes-base.httpRequest",
        position: [960, 1440],
        typeVersion: 4.2
      },
      {
        parameters: { method: "POST", url: "https://backend.blotato.com/v2/posts" },
        id: "ac3069e4-4fe6-4146-a0e2-973b3c374c55",
        name: "LINKEDIN",
        type: "n8n-nodes-base.httpRequest",
        position: [960, 1680],
        typeVersion: 4.2
      }
    ],
    connections: {
      "Trigger: Run Daily Script Generator": { main: [[{ node: "AI Agent: Generate Video Concept", type: "main", index: 0 }]] },
      "AI Agent: Generate Video Concept": { main: [[{ node: "Call Veo3 API to Generate Video", type: "main", index: 0 }]] },
      "Call Veo3 API to Generate Video": { main: [[{ node: "Upload Video to Blotato", type: "main", index: 0 }]] },
      "Upload Video to Blotato": {
        main: [
          [{ node: "INSTAGRAM", type: "main", index: 0 }],
          [{ node: "YOUTUBE", type: "main", index: 0 }],
          [{ node: "TIKTOK", type: "main", index: 0 }],
          [{ node: "FACEBOOK", type: "main", index: 0 }],
          [{ node: "LINKEDIN", type: "main", index: 0 }]
        ]
      }
    }
  }
};

// Template 6: Agent with custom HTTP Request
const template6: WorkflowTemplate = {
  id: 'template-6-agent-custom-http',
  name: 'Agent with custom HTTP Request',
  slug: 'agent-with-custom-http-request',
  category: 'DevOps & APIs',
  complexity: 'Intermediate',
  author: {
    name: 'n8n Core Specialist',
    role: 'Workflow Architect',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
  },
  description: 'ReAct AI Agent equipped with intelligent web scraper tool that extracts clean markdown body content, strips extra tags, and simplifies page size to save token budget.',
  longDescription: 'Demonstrates the ReAct Agent architecture using a sub-workflow tool. When the agent needs live web data, it queries any URL, removes inline scripts, SVGs, iframes, and CSS, converts HTML to Markdown, and enforces maximum token length thresholds.',
  tags: ['ReAct Agent', 'Web Scraping', 'HTML to Markdown', 'Sub-workflow Tool', 'Token Optimizer'],
  nodeCount: 16,
  stars: 395,
  downloads: 5120,
  featured: false,
  estimatedSetupMinutes: 10,
  useCases: [
    'Allowing LangChain AI agents to browse live internet documentation safely',
    'Extracting clean text without burning tokens on raw HTML and script tags',
    'Handling HTTP request failures gracefully in agent tool loops'
  ],
  setupSteps: [
    'Add your OpenAI API credentials in the OpenAI Chat Model node',
    'Use the manual chat trigger or execute sub-workflow trigger to test queries',
    'Adjust maxlimit parameter (default 70,000 characters) if needed'
  ],
  requiredCredentials: ['openAiApi'],
  documentationMarkdown: `
# ReAct AI Agent with Custom HTTP Request Tool

This workflow equips an AI agent with a custom web scraping sub-workflow tool that cleans HTML before passing it to LLM context windows.

### Smart Cleaning Features:
- Strips \`<script>\`, \`<style>\`, \`<iframe>\`, \`<svg>\`, and HTML comments
- Simplifies links and images if \`method=simplified\` is requested
- Converts remaining DOM elements into compact Markdown syntax
- Enforces strict character boundaries to prevent context overflow
`,
  workflow: {
    name: "Agent with custom HTTP Request",
    nodes: [
      {
        id: "e7374976-f3c1-4f60-ae57-9eec65444216",
        name: "On new manual Chat Message",
        type: "@n8n/n8n-nodes-langchain.manualChatTrigger",
        position: [763, 676],
        typeVersion: 1
      },
      {
        id: "97e84a23-9536-43cd-94e9-b8166be8ed32",
        name: "OpenAI Chat Model",
        type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
        position: [983, 896],
        parameters: { model: "gpt-4-1106-preview", options: { temperature: 0.7 } },
        typeVersion: 1
      },
      {
        id: "d5ff2114-1e74-43cf-9f3c-744c241988db",
        name: "ReAct AI Agent",
        type: "@n8n/n8n-nodes-langchain.agent",
        position: [983, 676],
        typeVersion: 1
      },
      {
        id: "a3a6b199-517b-4987-8281-d7997a32f54b",
        name: "HTTP_Request_Tool",
        type: "@n8n/n8n-nodes-langchain.toolWorkflow",
        position: [1103, 896],
        parameters: { name: "HTTP_Request_Tool", description: "Call this tool to fetch webpage content" },
        typeVersion: 1
      },
      {
        id: "63d98361-8978-4042-84e7-53a0e226f946",
        name: "HTTP Request",
        type: "n8n-nodes-base.httpRequest",
        position: [1360, 1200],
        typeVersion: 4.1
      },
      {
        id: "cc7aef4a-a1fb-4a69-a670-1f200f9e9541",
        name: "Convert to Markdown",
        type: "n8n-nodes-base.markdown",
        position: [2540, 1480],
        typeVersion: 1
      },
      {
        id: "11806e8c-5fc4-4d9d-8144-179356993aa7",
        name: "Send Page Content",
        type: "n8n-nodes-base.set",
        position: [2740, 1480],
        typeVersion: 3.2
      }
    ],
    connections: {
      "On new manual Chat Message": { main: [[{ node: "ReAct AI Agent", type: "main", index: 0 }]] },
      "OpenAI Chat Model": { ai_languageModel: [[{ node: "ReAct AI Agent", type: "ai_languageModel", index: 0 }]] },
      "HTTP_Request_Tool": { ai_tool: [[{ node: "ReAct AI Agent", type: "ai_tool", index: 0 }]] },
      "HTTP Request": { main: [[{ node: "Convert to Markdown", type: "main", index: 0 }]] },
      "Convert to Markdown": { main: [[{ node: "Send Page Content", type: "main", index: 0 }]] }
    }
  }
};

// Additional 20+ Templates
const additionalTemplates: WorkflowTemplate[] = [
  {
    id: 'template-7-github-pr-reviewer',
    name: 'GitHub PR Reviewer & Automated Code Insights AI Agent',
    slug: 'github-pr-reviewer-code-insights-ai',
    category: 'DevOps & APIs',
    complexity: 'Intermediate',
    author: { name: 'DevSecOps Team', role: 'Staff Engineer' },
    description: 'Listens for GitHub Pull Request webhook triggers, extracts git diff patches, analyzes security vulnerabilities and code smells with Gemini 1.5 Pro, and posts automated PR inline comments.',
    tags: ['GitHub', 'Code Review', 'Gemini 1.5 Pro', 'DevOps', 'Security Scanner'],
    nodeCount: 9,
    stars: 480,
    downloads: 7300,
    featured: true,
    estimatedSetupMinutes: 12,
    useCases: ['Automating first-pass PR code review for engineering teams', 'Detecting hardcoded secrets and SQL injections before merges'],
    setupSteps: ['Connect GitHub OAuth2 app or Personal Access Token', 'Configure repository webhook for pull_request events', 'Add Gemini API Key'],
    requiredCredentials: ['githubOAuth2Api', 'googlePalmApi'],
    documentationMarkdown: '# Automated GitHub PR Reviewer\n\nAnalyzes pull request diffs using Google Gemini and leaves actionable markdown comments directly on GitHub PRs.',
    workflow: {
      name: "GitHub PR Reviewer & Code Insights AI Agent",
      nodes: [
        { id: "gh-1", name: "GitHub PR Webhook", type: "n8n-nodes-base.webhook", position: [200, 300], parameters: { path: "gh-pr-event", httpMethod: "POST" } },
        { id: "gh-2", name: "Filter PR Actions", type: "n8n-nodes-base.if", position: [420, 300], parameters: { conditions: { string: [{ value1: "={{ $json.body.action }}", value2: "opened" }] } } },
        { id: "gh-3", name: "Fetch Pull Diff", type: "n8n-nodes-base.httpRequest", position: [640, 240], parameters: { url: "={{ $json.body.pull_request.diff_url }}" } },
        { id: "gh-4", name: "Code Review Agent", type: "@n8n/n8n-nodes-langchain.agent", position: [880, 240], parameters: { promptType: "define", text: "=Review this code diff for security flaws, bugs, and performance:\n\n{{ $json.data }}" } },
        { id: "gh-5", name: "Gemini 1.5 Pro Model", type: "@n8n/n8n-nodes-langchain.lmChatGoogleGemini", position: [880, 440], parameters: { model: "gemini-1.5-pro-latest" } },
        { id: "gh-6", name: "Post PR Review Comment", type: "n8n-nodes-base.httpRequest", position: [1120, 240], parameters: { method: "POST", url: "={{ $('GitHub PR Webhook').item.json.body.pull_request.comments_url }}" } }
      ],
      connections: {
        "GitHub PR Webhook": { main: [[{ node: "Filter PR Actions", type: "main", index: 0 }]] },
        "Filter PR Actions": { main: [[{ node: "Fetch Pull Diff", type: "main", index: 0 }]] },
        "Fetch Pull Diff": { main: [[{ node: "Code Review Agent", type: "main", index: 0 }]] },
        "Gemini 1.5 Pro Model": { ai_languageModel: [[{ node: "Code Review Agent", type: "ai_languageModel", index: 0 }]] },
        "Code Review Agent": { main: [[{ node: "Post PR Review Comment", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'template-8-smart-gmail-triage',
    name: 'Smart Gmail Triage, Sentiment Scoring & Draft Responder',
    slug: 'smart-gmail-triage-sentiment-draft-responder',
    category: 'Productivity & Office',
    complexity: 'Intermediate',
    author: { name: 'Sara Miller', role: 'Productivity Architect' },
    description: 'Scans incoming unread emails every 15 minutes, categorizes intent (Support, Billing, Sales, Urgent), logs to Notion CRM, and generates AI draft responses ready for human review.',
    tags: ['Gmail', 'Notion', 'OpenAI GPT-4o', 'Email Automation', 'Smart Triage'],
    nodeCount: 8,
    stars: 520,
    downloads: 8100,
    featured: true,
    estimatedSetupMinutes: 15,
    useCases: ['Zero-inbox executive email prioritization', 'Auto-drafting customer support replies without sending automatically'],
    setupSteps: ['Connect Gmail OAuth2 credentials', 'Connect Notion workspace database', 'Configure GPT-4o API key'],
    requiredCredentials: ['gmailOAuth2', 'notionApi', 'openAiApi'],
    documentationMarkdown: '# Smart Gmail Triage & Draft Responder\n\nAutomatically labels emails and creates pre-written draft replies in your Gmail account.',
    workflow: {
      name: "Smart Gmail Triage & Draft Responder",
      nodes: [
        { id: "gm-1", name: "Poll Unread Emails", type: "n8n-nodes-base.scheduleTrigger", position: [200, 260] },
        { id: "gm-2", name: "Fetch Gmail Messages", type: "n8n-nodes-base.gmail", position: [400, 260], parameters: { operation: "getAll", filters: { q: "is:unread" } } },
        { id: "gm-3", name: "Triage & Draft Agent", type: "@n8n/n8n-nodes-langchain.agent", position: [640, 260], parameters: { promptType: "define", text: "=Classify sentiment and write a draft reply for: {{ $json.snippet }}" } },
        { id: "gm-4", name: "OpenAI Chat Model", type: "@n8n/n8n-nodes-langchain.lmChatOpenAi", position: [640, 460], parameters: { model: "gpt-4o" } },
        { id: "gm-5", name: "Create Notion CRM Record", type: "n8n-nodes-base.notion", position: [900, 200] },
        { id: "gm-6", name: "Create Gmail Draft", type: "n8n-nodes-base.gmail", position: [900, 360], parameters: { operation: "createDraft" } }
      ],
      connections: {
        "Poll Unread Emails": { main: [[{ node: "Fetch Gmail Messages", type: "main", index: 0 }]] },
        "Fetch Gmail Messages": { main: [[{ node: "Triage & Draft Agent", type: "main", index: 0 }]] },
        "OpenAI Chat Model": { ai_languageModel: [[{ node: "Triage & Draft Agent", type: "ai_languageModel", index: 0 }]] },
        "Triage & Draft Agent": { main: [[{ node: "Create Notion CRM Record", type: "main", index: 0 }, { node: "Create Gmail Draft", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'template-9-telegram-executive-assistant',
    name: 'Telegram AI Personal Executive Assistant with Voice & Memory',
    slug: 'telegram-ai-executive-assistant-voice-memory',
    category: 'AI Agents & LLMs',
    complexity: 'Advanced',
    author: { name: 'Alex Rivera', role: 'Fullstack AI Engineer' },
    description: 'Personal Telegram bot that receives text or voice notes, transcribes via Whisper, tracks your task list with Window Buffer Memory, executes calculations, and responds with text & audio.',
    tags: ['Telegram Bot', 'Whisper STT', 'LangChain Memory', 'Calculator Tool', 'Executive PA'],
    nodeCount: 11,
    stars: 640,
    downloads: 9800,
    featured: true,
    estimatedSetupMinutes: 15,
    useCases: ['Hands-free voice productivity on the go', 'Personal task management and quick calculations via Telegram chat'],
    setupSteps: ['Create Telegram Bot token with @BotFather', 'Set up OpenAI API credentials', 'Configure webhook on n8n'],
    requiredCredentials: ['telegramApi', 'openAiApi'],
    documentationMarkdown: '# Telegram AI Executive Assistant\n\nTalk or text your personal AI assistant directly on Telegram.',
    workflow: {
      name: "Telegram AI Personal Executive Assistant",
      nodes: [
        { id: "tg-1", name: "Telegram Bot Trigger", type: "n8n-nodes-base.telegram", position: [200, 300] },
        { id: "tg-2", name: "Check If Voice", type: "n8n-nodes-base.if", position: [420, 300] },
        { id: "tg-3", name: "Transcribe Voice Audio", type: "@n8n/n8n-nodes-langchain.openAi", position: [640, 200] },
        { id: "tg-4", name: "LangChain Assistant Agent", type: "@n8n/n8n-nodes-langchain.agent", position: [880, 300] },
        { id: "tg-5", name: "GPT-4o Model", type: "@n8n/n8n-nodes-langchain.lmChatOpenAi", position: [800, 500] },
        { id: "tg-6", name: "Window Buffer Memory", type: "@n8n/n8n-nodes-langchain.memoryBufferWindow", position: [960, 500] },
        { id: "tg-7", name: "Calculator Tool", type: "@n8n/n8n-nodes-langchain.toolCalculator", position: [1100, 500] },
        { id: "tg-8", name: "Send Telegram Reply", type: "n8n-nodes-base.telegram", position: [1160, 300] }
      ],
      connections: {
        "Telegram Bot Trigger": { main: [[{ node: "Check If Voice", type: "main", index: 0 }]] },
        "Check If Voice": { main: [[{ node: "Transcribe Voice Audio", type: "main", index: 0 }], [{ node: "LangChain Assistant Agent", type: "main", index: 0 }]] },
        "Transcribe Voice Audio": { main: [[{ node: "LangChain Assistant Agent", type: "main", index: 0 }]] },
        "GPT-4o Model": { ai_languageModel: [[{ node: "LangChain Assistant Agent", type: "ai_languageModel", index: 0 }]] },
        "Window Buffer Memory": { ai_memory: [[{ node: "LangChain Assistant Agent", type: "ai_memory", index: 0 }]] },
        "Calculator Tool": { ai_tool: [[{ node: "LangChain Assistant Agent", type: "ai_tool", index: 0 }]] },
        "LangChain Assistant Agent": { main: [[{ node: "Send Telegram Reply", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'template-10-stripe-failed-payment-recovery',
    name: 'Stripe Failed Payment Recovery & Smart Customer Outreach',
    slug: 'stripe-failed-payment-recovery-outreach',
    category: 'Customer Support & Sales',
    complexity: 'Intermediate',
    author: { name: 'FinOps Growth Lab', role: 'Payment Operations' },
    description: 'Listens for Stripe `invoice.payment_failed` webhooks, looks up account history in PostgreSQL, calculates custom dunning delays, and triggers personalized recovery emails & Slack alerts.',
    tags: ['Stripe', 'PostgreSQL', 'Slack', 'Payment Recovery', 'Dunning'],
    nodeCount: 8,
    stars: 390,
    downloads: 4600,
    featured: false,
    estimatedSetupMinutes: 15,
    useCases: ['Preventing SaaS customer churn due to expired credit cards', 'Notifying account managers when high-value enterprise payments fail'],
    setupSteps: ['Configure Stripe webhook for invoice.payment_failed', 'Connect PostgreSQL database', 'Connect Slack & SMTP/SendGrid credentials'],
    requiredCredentials: ['stripeApi', 'postgres', 'slackApi'],
    documentationMarkdown: '# Stripe Failed Payment Recovery Flow\n\nRecovers failed subscriptions with smart retries and personalized customer emails.',
    workflow: {
      name: "Stripe Failed Payment Recovery",
      nodes: [
        { id: "st-1", name: "Stripe Webhook (payment_failed)", type: "n8n-nodes-base.webhook", position: [200, 300] },
        { id: "st-2", name: "Query Customer in Postgres", type: "n8n-nodes-base.postgres", position: [440, 300] },
        { id: "st-3", name: "Check Failure Count", type: "n8n-nodes-base.switch", position: [680, 300] },
        { id: "st-4", name: "Alert VIP Slack Channel", type: "n8n-nodes-base.slack", position: [920, 200] },
        { id: "st-5", name: "Send Card Update Email", type: "n8n-nodes-base.httpRequest", position: [920, 400] }
      ],
      connections: {
        "Stripe Webhook (payment_failed)": { main: [[{ node: "Query Customer in Postgres", type: "main", index: 0 }]] },
        "Query Customer in Postgres": { main: [[{ node: "Check Failure Count", type: "main", index: 0 }]] },
        "Check Failure Count": { main: [[{ node: "Alert VIP Slack Channel", type: "main", index: 0 }], [{ node: "Send Card Update Email", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'template-11-lead-enrichment-crm-sync',
    name: 'Multi-Source Lead Enrichment & Automated CRM Sync',
    slug: 'multi-source-lead-enrichment-crm-sync',
    category: 'Customer Support & Sales',
    complexity: 'Advanced',
    author: { name: 'GrowthEngine Inc', role: 'RevOps Team' },
    description: 'Enriches inbound leads with company revenue, tech stack, and LinkedIn profile data via Clearbit and Hunter APIs, calculates lead score, and syncs into CRM with Slack alerts.',
    tags: ['Lead Scoring', 'Clearbit', 'Hunter.io', 'CRM Sync', 'Slack Notifications'],
    nodeCount: 10,
    stars: 510,
    downloads: 6700,
    featured: false,
    estimatedSetupMinutes: 18,
    useCases: ['Automating SDR qualification before outreach', 'Instant lead scoring and routing to appropriate regional sales teams'],
    setupSteps: ['Connect Inbound Form Webhook', 'Add Clearbit & Hunter API keys', 'Configure CRM destination API'],
    requiredCredentials: ['httpHeaderAuth', 'slackApi'],
    documentationMarkdown: '# Multi-Source Lead Enrichment\n\nAutomatically enrich prospect data before routing to sales representatives.',
    workflow: {
      name: "Multi-Source Lead Enrichment & CRM Sync",
      nodes: [
        { id: "le-1", name: "Inbound Lead Webhook", type: "n8n-nodes-base.webhook", position: [200, 300] },
        { id: "le-2", name: "Hunter.io Email Verify", type: "n8n-nodes-base.httpRequest", position: [440, 300] },
        { id: "le-3", name: "Clearbit Company Lookup", type: "n8n-nodes-base.httpRequest", position: [680, 300] },
        { id: "le-4", name: "Calculate Lead Score (JS)", type: "n8n-nodes-base.code", position: [920, 300] },
        { id: "le-5", name: "Upsert CRM Lead", type: "n8n-nodes-base.httpRequest", position: [1160, 220] },
        { id: "le-6", name: "Notify Slack #sales-leads", type: "n8n-nodes-base.slack", position: [1160, 380] }
      ],
      connections: {
        "Inbound Lead Webhook": { main: [[{ node: "Hunter.io Email Verify", type: "main", index: 0 }]] },
        "Hunter.io Email Verify": { main: [[{ node: "Clearbit Company Lookup", type: "main", index: 0 }]] },
        "Clearbit Company Lookup": { main: [[{ node: "Calculate Lead Score (JS)", type: "main", index: 0 }]] },
        "Calculate Lead Score (JS)": { main: [[{ node: "Upsert CRM Lead", type: "main", index: 0 }, { node: "Notify Slack #sales-leads", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'template-12-youtube-transcriber-blog-publisher',
    name: 'YouTube Video Transcriber, Summary & Multi-Format Blog Publisher',
    slug: 'youtube-transcriber-summary-blog-publisher',
    category: 'Social Media & Video',
    complexity: 'Intermediate',
    author: { name: 'ContentForge AI', role: 'Media Automation' },
    description: 'Monitors YouTube channel RSS for new videos, downloads audio stream, transcribes via OpenAI Whisper, formats into long-form SEO blog post with key takeaways, and publishes to WordPress.',
    tags: ['YouTube RSS', 'Whisper STT', 'SEO Blog', 'WordPress', 'Gemini Flash'],
    nodeCount: 9,
    stars: 440,
    downloads: 5900,
    featured: false,
    estimatedSetupMinutes: 15,
    useCases: ['Repurposing video podcasts into high-ranking articles', 'Generating newsletter digests from weekly YouTube uploads'],
    setupSteps: ['Enter your YouTube Channel ID', 'Connect OpenAI or Gemini credentials', 'Connect WordPress REST API credentials'],
    requiredCredentials: ['openAiApi', 'httpBearerAuth'],
    documentationMarkdown: '# YouTube to SEO Blog Publisher\n\nTurn any YouTube video into a polished, illustrated blog article automatically.',
    workflow: {
      name: "YouTube Video Transcriber & Blog Publisher",
      nodes: [
        { id: "yt-1", name: "YouTube Channel RSS Poll", type: "n8n-nodes-base.scheduleTrigger", position: [200, 280] },
        { id: "yt-2", name: "Fetch Video Audio Stream", type: "n8n-nodes-base.httpRequest", position: [440, 280] },
        { id: "yt-3", name: "Whisper Audio Transcribe", type: "@n8n/n8n-nodes-langchain.openAi", position: [680, 280] },
        { id: "yt-4", name: "Article Generator Agent", type: "@n8n/n8n-nodes-langchain.agent", position: [920, 280] },
        { id: "yt-5", name: "Gemini 1.5 Flash Model", type: "@n8n/n8n-nodes-langchain.lmChatGoogleGemini", position: [920, 480] },
        { id: "yt-6", name: "Publish to WordPress API", type: "n8n-nodes-base.httpRequest", position: [1160, 280] }
      ],
      connections: {
        "YouTube Channel RSS Poll": { main: [[{ node: "Fetch Video Audio Stream", type: "main", index: 0 }]] },
        "Fetch Video Audio Stream": { main: [[{ node: "Whisper Audio Transcribe", type: "main", index: 0 }]] },
        "Whisper Audio Transcribe": { main: [[{ node: "Article Generator Agent", type: "main", index: 0 }]] },
        "Gemini 1.5 Flash Model": { ai_languageModel: [[{ node: "Article Generator Agent", type: "ai_languageModel", index: 0 }]] },
        "Article Generator Agent": { main: [[{ node: "Publish to WordPress API", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'template-13-autonomous-web-research-squad',
    name: 'Autonomous Web Research & Competitive Intel Report Squad',
    slug: 'autonomous-web-research-competitive-intel-report',
    category: 'AI Agents & LLMs',
    complexity: 'Advanced',
    author: { name: 'Market Intelligence AI', role: 'Senior Strategy Analyst' },
    description: 'Weekly scheduled research agent that runs targeted search queries across competitor domains, compiles feature updates and pricing changes, and creates a formatted PDF briefing.',
    tags: ['Web Research', 'Multi-Agent', 'Competitive Intel', 'Executive Briefing', 'PDF Generation'],
    nodeCount: 11,
    stars: 620,
    downloads: 7900,
    featured: true,
    estimatedSetupMinutes: 20,
    useCases: ['Tracking competitor product launches and price shifts weekly', 'Gathering industry news briefings without manual Googling'],
    setupSteps: ['Set competitor URL list in parameters', 'Provide OpenAI / Anthropic credentials', 'Configure email recipient list'],
    requiredCredentials: ['openAiApi', 'httpHeaderAuth'],
    documentationMarkdown: '# Autonomous Competitive Research Squad\n\nScrapes competitor updates and synthesizes executive market reports.',
    workflow: {
      name: "Autonomous Web Research & Competitive Intel",
      nodes: [
        { id: "res-1", name: "Weekly Monday Cron", type: "n8n-nodes-base.scheduleTrigger", position: [200, 300] },
        { id: "res-2", name: "Search Competitor News", type: "n8n-nodes-base.httpRequest", position: [440, 300] },
        { id: "res-3", name: "Research Synthesizer Agent", type: "@n8n/n8n-nodes-langchain.agent", position: [680, 300] },
        { id: "res-4", name: "GPT-4o Research Model", type: "@n8n/n8n-nodes-langchain.lmChatOpenAi", position: [680, 500] },
        { id: "res-5", name: "Generate HTML Briefing", type: "n8n-nodes-base.html", position: [920, 300] },
        { id: "res-6", name: "Email Executive Report", type: "n8n-nodes-base.httpRequest", position: [1160, 300] }
      ],
      connections: {
        "Weekly Monday Cron": { main: [[{ node: "Search Competitor News", type: "main", index: 0 }]] },
        "Search Competitor News": { main: [[{ node: "Research Synthesizer Agent", type: "main", index: 0 }]] },
        "GPT-4o Research Model": { ai_languageModel: [[{ node: "Research Synthesizer Agent", type: "ai_languageModel", index: 0 }]] },
        "Research Synthesizer Agent": { main: [[{ node: "Generate HTML Briefing", type: "main", index: 0 }]] },
        "Generate HTML Briefing": { main: [[{ node: "Email Executive Report", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'template-14-postgres-natural-language-sql',
    name: 'PostgreSQL Natural Language SQL Query Assistant with Schema RAG',
    slug: 'postgres-natural-language-sql-assistant-schema-rag',
    category: 'RAG & Knowledge Base',
    complexity: 'Advanced',
    author: { name: 'DataOps Lab', role: 'Principal DB Architect' },
    description: 'Empowers non-technical team members to ask Slack data questions in plain English, safely generates read-only PostgreSQL queries against live schemas, and returns formatted tables.',
    tags: ['PostgreSQL', 'Text-to-SQL', 'Slack Bot', 'Schema RAG', 'Data Analytics'],
    nodeCount: 10,
    stars: 580,
    downloads: 8200,
    featured: true,
    estimatedSetupMinutes: 15,
    useCases: ['Enabling self-service BI for marketing and sales in Slack', 'Writing safe, read-only SQL queries with LLM schema guardrails'],
    setupSteps: ['Connect read-only PostgreSQL database credentials', 'Add OpenAI or Gemini API key', 'Connect Slack App Bot Token'],
    requiredCredentials: ['postgres', 'openAiApi', 'slackApi'],
    documentationMarkdown: '# Natural Language SQL Assistant for Postgres\n\nAsk business questions in plain English; get clean Postgres results back in Slack.',
    workflow: {
      name: "PostgreSQL Natural Language SQL Assistant",
      nodes: [
        { id: "sql-1", name: "Slack Slash Command", type: "n8n-nodes-base.webhook", position: [200, 300] },
        { id: "sql-2", name: "Fetch DB Table Schemas", type: "n8n-nodes-base.postgres", position: [440, 300] },
        { id: "sql-3", name: "Text-to-SQL Agent", type: "@n8n/n8n-nodes-langchain.agent", position: [680, 300] },
        { id: "sql-4", name: "OpenAI GPT-4o", type: "@n8n/n8n-nodes-langchain.lmChatOpenAi", position: [680, 500] },
        { id: "sql-5", name: "Execute Read-Only SQL", type: "n8n-nodes-base.postgres", position: [920, 300] },
        { id: "sql-6", name: "Respond in Slack Thread", type: "n8n-nodes-base.slack", position: [1160, 300] }
      ],
      connections: {
        "Slack Slash Command": { main: [[{ node: "Fetch DB Table Schemas", type: "main", index: 0 }]] },
        "Fetch DB Table Schemas": { main: [[{ node: "Text-to-SQL Agent", type: "main", index: 0 }]] },
        "OpenAI GPT-4o": { ai_languageModel: [[{ node: "Text-to-SQL Agent", type: "ai_languageModel", index: 0 }]] },
        "Text-to-SQL Agent": { main: [[{ node: "Execute Read-Only SQL", type: "main", index: 0 }]] },
        "Execute Read-Only SQL": { main: [[{ node: "Respond in Slack Thread", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'template-15-discord-support-ai-bot',
    name: 'Discord Community Support AI Bot with Pinecone Vector Knowledgebase',
    slug: 'discord-community-support-ai-bot-pinecone',
    category: 'Customer Support & Sales',
    complexity: 'Intermediate',
    author: { name: 'Community Hero', role: 'Developer Relations' },
    description: 'Monitors Discord help channels, looks up technical questions against Pinecone vector embeddings, and delivers polite, accurate responses with documentation link citations.',
    tags: ['Discord Bot', 'Pinecone', 'Embeddings', 'Community Support', 'Citations'],
    nodeCount: 9,
    stars: 370,
    downloads: 4900,
    featured: false,
    estimatedSetupMinutes: 15,
    useCases: ['24/7 instant developer support in Discord communities', 'Reducing repetitive onboarding and setup questions'],
    setupSteps: ['Create Discord Bot in Developer Portal and set gateway intents', 'Connect Pinecone vector store API key', 'Set OpenAI embeddings credential'],
    requiredCredentials: ['httpHeaderAuth', 'openAiApi'],
    documentationMarkdown: '# Discord Community Support Bot\n\nResolves technical questions instantly in Discord with Pinecone vector search.',
    workflow: {
      name: "Discord Community Support AI Bot",
      nodes: [
        { id: "dc-1", name: "Discord Message Webhook", type: "n8n-nodes-base.webhook", position: [200, 300] },
        { id: "dc-2", name: "Filter Help Channels", type: "n8n-nodes-base.if", position: [440, 300] },
        { id: "dc-3", name: "Support RAG Agent", type: "@n8n/n8n-nodes-langchain.agent", position: [680, 300] },
        { id: "dc-4", name: "OpenAI Chat Model", type: "@n8n/n8n-nodes-langchain.lmChatOpenAi", position: [680, 500] },
        { id: "dc-5", name: "Vector Store Tool", type: "@n8n/n8n-nodes-langchain.toolVectorStore", position: [900, 500] },
        { id: "dc-6", name: "Reply in Discord Thread", type: "n8n-nodes-base.httpRequest", position: [960, 300] }
      ],
      connections: {
        "Discord Message Webhook": { main: [[{ node: "Filter Help Channels", type: "main", index: 0 }]] },
        "Filter Help Channels": { main: [[{ node: "Support RAG Agent", type: "main", index: 0 }]] },
        "OpenAI Chat Model": { ai_languageModel: [[{ node: "Support RAG Agent", type: "ai_languageModel", index: 0 }]] },
        "Vector Store Tool": { ai_tool: [[{ node: "Support RAG Agent", type: "ai_tool", index: 0 }]] },
        "Support RAG Agent": { main: [[{ node: "Reply in Discord Thread", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'template-16-shopify-abandoned-cart-sms-flow',
    name: 'E-Commerce Shopify Abandoned Cart Intelligent SMS & Email Flow',
    slug: 'shopify-abandoned-cart-sms-email-flow',
    category: 'Customer Support & Sales',
    complexity: 'Intermediate',
    author: { name: 'E-Commerce Scaling Lab', role: 'DTC Retention Lead' },
    description: 'Triggers on Shopify checkout creation, delays for 60 minutes, verifies whether the order completed, and if abandoned, uses AI to write personalized SMS and email recovery incentives.',
    tags: ['Shopify', 'Abandoned Cart', 'Twilio SMS', 'E-Commerce', 'Personalized Discounts'],
    nodeCount: 8,
    stars: 460,
    downloads: 6100,
    featured: false,
    estimatedSetupMinutes: 12,
    useCases: ['Recovering 15-25% of abandoned checkouts in DTC stores', 'Generating dynamic discount codes tailored to item categories'],
    setupSteps: ['Connect Shopify Webhook for checkouts/create', 'Connect Twilio SMS and Klaviyo/SendGrid APIs', 'Configure discount percentage rule'],
    requiredCredentials: ['httpHeaderAuth'],
    documentationMarkdown: '# Shopify Abandoned Cart Recovery\n\nAutomatically recovers lost DTC revenue with personalized SMS reminders.',
    workflow: {
      name: "Shopify Abandoned Cart SMS Flow",
      nodes: [
        { id: "sh-1", name: "Shopify Checkout Webhook", type: "n8n-nodes-base.webhook", position: [200, 300] },
        { id: "sh-2", name: "Wait 60 Minutes", type: "n8n-nodes-base.wait", position: [440, 300], parameters: { amount: 60, unit: "minutes" } },
        { id: "sh-3", name: "Check If Completed", type: "n8n-nodes-base.httpRequest", position: [680, 300] },
        { id: "sh-4", name: "Generate Incentive SMS", type: "@n8n/n8n-nodes-langchain.agent", position: [920, 240] },
        { id: "sh-5", name: "Send Twilio SMS", type: "n8n-nodes-base.httpRequest", position: [1160, 240] }
      ],
      connections: {
        "Shopify Checkout Webhook": { main: [[{ node: "Wait 60 Minutes", type: "main", index: 0 }]] },
        "Wait 60 Minutes": { main: [[{ node: "Check If Completed", type: "main", index: 0 }]] },
        "Check If Completed": { main: [[{ node: "Generate Incentive SMS", type: "main", index: 0 }]] },
        "Generate Incentive SMS": { main: [[{ node: "Send Twilio SMS", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'template-17-invoice-ocr-quickbooks-sync',
    name: 'Automated Invoice OCR, Expense Categorization & QuickBooks Sync',
    slug: 'automated-invoice-ocr-quickbooks-sync',
    category: 'Productivity & Office',
    complexity: 'Advanced',
    author: { name: 'FinTech Integrators', role: 'CPA & Tech Consultant' },
    description: 'Watches incoming PDF bills in Google Drive, extracts line-items and tax data using Vision AI OCR, categorizes expenses according to chart of accounts, and posts into QuickBooks.',
    tags: ['Google Drive', 'OCR Vision AI', 'QuickBooks', 'Accounting', 'Expense Management'],
    nodeCount: 10,
    stars: 490,
    downloads: 6500,
    featured: false,
    estimatedSetupMinutes: 20,
    useCases: ['Eliminating manual bill data entry for accounting teams', 'Extracting vendor names, tax breakdown, and due dates from PDF scans'],
    setupSteps: ['Select source Google Drive invoice folder', 'Add OpenAI or Google Vision OCR credentials', 'Connect QuickBooks OAuth2 account'],
    requiredCredentials: ['googleDriveOAuth2Api', 'openAiApi', 'httpBearerAuth'],
    documentationMarkdown: '# Automated Invoice OCR & QuickBooks Sync\n\nProcess receipts and PDF invoices straight into your accounting ledger.',
    workflow: {
      name: "Automated Invoice OCR & QuickBooks Sync",
      nodes: [
        { id: "inv-1", name: "Drive New PDF Invoice", type: "n8n-nodes-base.googleDrive", position: [200, 300] },
        { id: "inv-2", name: "Vision OCR Extractor", type: "@n8n/n8n-nodes-langchain.agent", position: [440, 300] },
        { id: "inv-3", name: "OpenAI GPT-4o Vision", type: "@n8n/n8n-nodes-langchain.lmChatOpenAi", position: [440, 500] },
        { id: "inv-4", name: "Structured Invoice Parser", type: "@n8n/n8n-nodes-langchain.outputParserStructured", position: [640, 500] },
        { id: "inv-5", name: "Map Expense Category (JS)", type: "n8n-nodes-base.code", position: [720, 300] },
        { id: "inv-6", name: "Create Bill in QuickBooks", type: "n8n-nodes-base.httpRequest", position: [960, 300] }
      ],
      connections: {
        "Drive New PDF Invoice": { main: [[{ node: "Vision OCR Extractor", type: "main", index: 0 }]] },
        "OpenAI GPT-4o Vision": { ai_languageModel: [[{ node: "Vision OCR Extractor", type: "ai_languageModel", index: 0 }]] },
        "Structured Invoice Parser": { ai_outputParser: [[{ node: "Vision OCR Extractor", type: "ai_outputParser", index: 0 }]] },
        "Vision OCR Extractor": { main: [[{ node: "Map Expense Category (JS)", type: "main", index: 0 }]] },
        "Map Expense Category (JS)": { main: [[{ node: "Create Bill in QuickBooks", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'template-18-multi-agent-content-repurposing',
    name: 'Multi-Agent Content Repurposing Engine (Podcast to 5 Platforms)',
    slug: 'multi-agent-content-repurposing-podcast',
    category: 'Social Media & Video',
    complexity: 'Advanced',
    author: { name: 'Growth Hackers Hub', role: 'Head of Content' },
    description: 'Feeds raw audio transcripts into specialized parallel AI sub-agents that produce a LinkedIn thought leadership post, a Twitter viral thread, an email newsletter, and TikTok video hooks.',
    tags: ['Content Repurposing', 'Multi-Agent', 'LinkedIn', 'Twitter Thread', 'Substack'],
    nodeCount: 12,
    stars: 670,
    downloads: 9100,
    featured: true,
    estimatedSetupMinutes: 18,
    useCases: ['10x-ing content team output from 1 recorded podcast episode', 'Maintaining consistent multichannel brand voice automatically'],
    setupSteps: ['Connect raw transcript input webhook or form', 'Configure LLM agent prompts per social channel', 'Sync results to Notion content calendar'],
    requiredCredentials: ['openAiApi', 'notionApi'],
    documentationMarkdown: '# Multi-Agent Content Repurposing Engine\n\nTurn 1 long audio file into 5 high-performing marketing assets at once.',
    workflow: {
      name: "Multi-Agent Content Repurposing Engine",
      nodes: [
        { id: "rep-1", name: "Transcript Input Form", type: "n8n-nodes-base.formTrigger", position: [200, 300] },
        { id: "rep-2", name: "Master Extractor Agent", type: "@n8n/n8n-nodes-langchain.agent", position: [440, 300] },
        { id: "rep-3", name: "LinkedIn Post Sub-Agent", type: "@n8n/n8n-nodes-langchain.agent", position: [720, 160] },
        { id: "rep-4", name: "Twitter Thread Sub-Agent", type: "@n8n/n8n-nodes-langchain.agent", position: [720, 300] },
        { id: "rep-5", name: "Newsletter Sub-Agent", type: "@n8n/n8n-nodes-langchain.agent", position: [720, 440] },
        { id: "rep-6", name: "Save All to Notion Board", type: "n8n-nodes-base.notion", position: [1000, 300] }
      ],
      connections: {
        "Transcript Input Form": { main: [[{ node: "Master Extractor Agent", type: "main", index: 0 }]] },
        "Master Extractor Agent": { main: [[{ node: "LinkedIn Post Sub-Agent", type: "main", index: 0 }, { node: "Twitter Thread Sub-Agent", type: "main", index: 0 }, { node: "Newsletter Sub-Agent", type: "main", index: 0 }]] },
        "LinkedIn Post Sub-Agent": { main: [[{ node: "Save All to Notion Board", type: "main", index: 0 }]] },
        "Twitter Thread Sub-Agent": { main: [[{ node: "Save All to Notion Board", type: "main", index: 0 }]] },
        "Newsletter Sub-Agent": { main: [[{ node: "Save All to Notion Board", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'template-19-server-health-auto-remediation',
    name: 'Server Health Monitoring, Incident Auto-Remediation & PagerDuty Alert',
    slug: 'server-health-monitoring-auto-remediation-pagerduty',
    category: 'DevOps & APIs',
    complexity: 'Advanced',
    author: { name: 'SRE Ops Team', role: 'Site Reliability Engineer' },
    description: 'Pings microservice endpoints every 5m. If degraded, triggers automated Docker container restart over SSH. If still failing, immediately escalates a high-urgency PagerDuty incident.',
    tags: ['DevOps', 'Health Check', 'Auto-Remediation', 'SSH', 'PagerDuty', 'SRE'],
    nodeCount: 9,
    stars: 430,
    downloads: 5400,
    featured: false,
    estimatedSetupMinutes: 15,
    useCases: ['Self-healing server infrastructure during off-hours', 'Automated incident triage before waking up on-call engineers'],
    setupSteps: ['Add HTTP health check URLs', 'Configure SSH keys for target host restart', 'Add PagerDuty service integration key'],
    requiredCredentials: ['httpHeaderAuth'],
    documentationMarkdown: '# Server Health & Auto-Remediation\n\nSelf-healing server uptime checks with automatic container restarts and incident escalation.',
    workflow: {
      name: "Server Health Monitoring & Auto-Remediation",
      nodes: [
        { id: "sre-1", name: "Poll Every 5 Mins", type: "n8n-nodes-base.scheduleTrigger", position: [200, 300] },
        { id: "sre-2", name: "Ping Health API", type: "n8n-nodes-base.httpRequest", position: [440, 300] },
        { id: "sre-3", name: "Check Status 200", type: "n8n-nodes-base.if", position: [680, 300] },
        { id: "sre-4", name: "Execute SSH Docker Restart", type: "n8n-nodes-base.httpRequest", position: [920, 380] },
        { id: "sre-5", name: "Verify Restart Success", type: "n8n-nodes-base.wait", position: [1140, 380] },
        { id: "sre-6", name: "Trigger PagerDuty Incident", type: "n8n-nodes-base.httpRequest", position: [1360, 380] }
      ],
      connections: {
        "Poll Every 5 Mins": { main: [[{ node: "Ping Health API", type: "main", index: 0 }]] },
        "Ping Health API": { main: [[{ node: "Check Status 200", type: "main", index: 0 }]] },
        "Check Status 200": { main: [[], [{ node: "Execute SSH Docker Restart", type: "main", index: 0 }]] },
        "Execute SSH Docker Restart": { main: [[{ node: "Verify Restart Success", type: "main", index: 0 }]] },
        "Verify Restart Success": { main: [[{ node: "Trigger PagerDuty Incident", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'template-20-nps-sentiment-jira-escalation',
    name: 'Customer Feedback NPS Sentiment Analyzer & Jira Escalation',
    slug: 'customer-feedback-nps-sentiment-jira-escalation',
    category: 'Customer Support & Sales',
    complexity: 'Intermediate',
    author: { name: 'CX Operations', role: 'Customer Experience Lead' },
    description: 'Receives customer survey and NPS ratings, analyzes sentiment polarity and key pain points, automatically generates Jira bug tickets for detractors, and requests G2 reviews from promoters.',
    tags: ['NPS', 'Sentiment Analysis', 'Jira Service Desk', 'Customer Success', 'G2 Reviews'],
    nodeCount: 8,
    stars: 350,
    downloads: 4100,
    featured: false,
    estimatedSetupMinutes: 10,
    useCases: ['Closing the feedback loop with dissatisfied users immediately', 'Driving positive social proof to review platforms automatically'],
    setupSteps: ['Connect Typeform / SurveyMonkey webhook', 'Configure OpenAI sentiment classification', 'Connect Jira API and email provider'],
    requiredCredentials: ['openAiApi', 'httpHeaderAuth'],
    documentationMarkdown: '# NPS Sentiment Analyzer & Jira Escalation\n\nTurn customer reviews into automated product tickets and promoter campaigns.',
    workflow: {
      name: "Customer Feedback NPS Sentiment Analyzer",
      nodes: [
        { id: "nps-1", name: "NPS Survey Webhook", type: "n8n-nodes-base.webhook", position: [200, 300] },
        { id: "nps-2", name: "Sentiment & Topic Agent", type: "@n8n/n8n-nodes-langchain.agent", position: [440, 300] },
        { id: "nps-3", name: "Branch Detractor vs Promoter", type: "n8n-nodes-base.switch", position: [680, 300] },
        { id: "nps-4", name: "Create High-Priority Jira Bug", type: "n8n-nodes-base.httpRequest", position: [920, 200] },
        { id: "nps-5", name: "Send G2 Review Invite Email", type: "n8n-nodes-base.httpRequest", position: [920, 400] }
      ],
      connections: {
        "NPS Survey Webhook": { main: [[{ node: "Sentiment & Topic Agent", type: "main", index: 0 }]] },
        "Sentiment & Topic Agent": { main: [[{ node: "Branch Detractor vs Promoter", type: "main", index: 0 }]] },
        "Branch Detractor vs Promoter": { main: [[{ node: "Create High-Priority Jira Bug", type: "main", index: 0 }], [{ node: "Send G2 Review Invite Email", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'template-21-social-trend-listener-ai-drafter',
    name: 'Automated Social Media Trend Listener & AI Post Drafter',
    slug: 'social-media-trend-listener-ai-drafter',
    category: 'Social Media & Video',
    complexity: 'Intermediate',
    author: { name: 'TrendHunter Lab', role: 'Social Media Strategist' },
    description: 'Scrapes trending topics across Reddit and Twitter every morning, clusters virality signals, drafts 3 angle variations with tailored tone, and stores drafts in an approval queue for 1-click publishing.',
    tags: ['Reddit API', 'Twitter Trends', 'Trend Jacking', 'Copywriting AI', 'Content Queue'],
    nodeCount: 8,
    stars: 480,
    downloads: 6200,
    featured: false,
    estimatedSetupMinutes: 12,
    useCases: ['Catching viral waves in your industry before everyone else', 'Drafting relevant posts while you sleep'],
    setupSteps: ['Configure subreddits and keyword filters', 'Add OpenAI API Key', 'Connect Google Sheets or Airtable for approval queue'],
    requiredCredentials: ['openAiApi', 'googleSheetsOAuth2Api'],
    documentationMarkdown: '# Social Media Trend Listener\n\nFind trending conversations and draft timely commentary automatically.',
    workflow: {
      name: "Social Media Trend Listener & AI Drafter",
      nodes: [
        { id: "tr-1", name: "Daily Morning Trigger", type: "n8n-nodes-base.scheduleTrigger", position: [200, 300] },
        { id: "tr-2", name: "Fetch Reddit Top Posts", type: "n8n-nodes-base.httpRequest", position: [440, 300] },
        { id: "tr-3", name: "Viral Hook Writer Agent", type: "@n8n/n8n-nodes-langchain.agent", position: [680, 300] },
        { id: "tr-4", name: "Log Drafts to Google Sheets", type: "n8n-nodes-base.googleSheets", position: [920, 300] }
      ],
      connections: {
        "Daily Morning Trigger": { main: [[{ node: "Fetch Reddit Top Posts", type: "main", index: 0 }]] },
        "Fetch Reddit Top Posts": { main: [[{ node: "Viral Hook Writer Agent", type: "main", index: 0 }]] },
        "Viral Hook Writer Agent": { main: [[{ node: "Log Drafts to Google Sheets", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'template-22-notion-knowledge-base-slack-bot',
    name: 'Notion Knowledge Base to Interactive AI Slack Bot (Hybrid Search)',
    slug: 'notion-knowledge-base-interactive-slack-bot',
    category: 'RAG & Knowledge Base',
    complexity: 'Advanced',
    author: { name: 'Internal Tools Guild', role: 'Ops Lead' },
    description: 'Synchronizes your team Notion wiki pages into a hybrid vector store, answers employee questions in Slack with conversational memory, and cites exact Notion page URLs.',
    tags: ['Notion Wiki', 'Slack Bot', 'Hybrid Search', 'Internal Knowledge', 'RAG'],
    nodeCount: 11,
    stars: 690,
    downloads: 9400,
    featured: true,
    estimatedSetupMinutes: 18,
    useCases: ['Automating internal company onboarding and HR questions', 'Answering engineering questions from product documentation in Slack'],
    setupSteps: ['Connect Notion workspace API token', 'Connect Qdrant or Supabase vector store', 'Add Slack Bot App Token'],
    requiredCredentials: ['notionApi', 'openAiApi', 'slackApi'],
    documentationMarkdown: '# Notion Knowledge Base Slack Bot\n\nTurn internal Notion wikis into an instant answer bot on Slack.',
    workflow: {
      name: "Notion Knowledge Base to AI Slack Bot",
      nodes: [
        { id: "nt-1", name: "Slack @Mention Trigger", type: "n8n-nodes-base.webhook", position: [200, 300] },
        { id: "nt-2", name: "Notion RAG Agent", type: "@n8n/n8n-nodes-langchain.agent", position: [440, 300] },
        { id: "nt-3", name: "OpenAI GPT-4o Model", type: "@n8n/n8n-nodes-langchain.lmChatOpenAi", position: [440, 500] },
        { id: "nt-4", name: "Vector Store Tool", type: "@n8n/n8n-nodes-langchain.toolVectorStore", position: [680, 500] },
        { id: "nt-5", name: "Post Slack Ephemeral Reply", type: "n8n-nodes-base.slack", position: [720, 300] }
      ],
      connections: {
        "Slack @Mention Trigger": { main: [[{ node: "Notion RAG Agent", type: "main", index: 0 }]] },
        "OpenAI GPT-4o Model": { ai_languageModel: [[{ node: "Notion RAG Agent", type: "ai_languageModel", index: 0 }]] },
        "Vector Store Tool": { ai_tool: [[{ node: "Notion RAG Agent", type: "ai_tool", index: 0 }]] },
        "Notion RAG Agent": { main: [[{ node: "Post Slack Ephemeral Reply", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'template-23-employee-onboarding-provisioning',
    name: 'Automated Employee Onboarding & Workspace Provisioning Workflow',
    slug: 'automated-employee-onboarding-provisioning',
    category: 'Productivity & Office',
    complexity: 'Intermediate',
    author: { name: 'People Ops Tech', role: 'IT & HR Systems' },
    description: 'Triggers when a new hire is added in HR software, creates their Google Workspace user account, invites them to designated Slack channels, duplicates their Notion onboarding checklist, and schedules welcome calls.',
    tags: ['HR Automation', 'Google Workspace', 'Slack Invitations', 'Notion', 'Onboarding'],
    nodeCount: 9,
    stars: 380,
    downloads: 4700,
    featured: false,
    estimatedSetupMinutes: 15,
    useCases: ['Setting up employee tech stack in 60 seconds without manual IT tickets', 'Standardizing welcoming sequences and first-week calendars'],
    setupSteps: ['Connect HR webhook trigger', 'Configure Google Admin SDK credentials', 'Connect Slack Admin and Notion tokens'],
    requiredCredentials: ['httpHeaderAuth', 'slackApi', 'notionApi'],
    documentationMarkdown: '# Automated Employee Onboarding\n\nProvision Google Workspace accounts, Slack channels, and Notion checklists instantly.',
    workflow: {
      name: "Automated Employee Onboarding",
      nodes: [
        { id: "hr-1", name: "New Hire HR Webhook", type: "n8n-nodes-base.webhook", position: [200, 300] },
        { id: "hr-2", name: "Provision Google User", type: "n8n-nodes-base.httpRequest", position: [440, 200] },
        { id: "hr-3", name: "Invite to Slack Channels", type: "n8n-nodes-base.slack", position: [440, 400] },
        { id: "hr-4", name: "Create Notion Checklist", type: "n8n-nodes-base.notion", position: [680, 300] },
        { id: "hr-5", name: "Send Welcome Email", type: "n8n-nodes-base.httpRequest", position: [920, 300] }
      ],
      connections: {
        "New Hire HR Webhook": { main: [[{ node: "Provision Google User", type: "main", index: 0 }, { node: "Invite to Slack Channels", type: "main", index: 0 }]] },
        "Provision Google User": { main: [[{ node: "Create Notion Checklist", type: "main", index: 0 }]] },
        "Create Notion Checklist": { main: [[{ node: "Send Welcome Email", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'template-24-whatsapp-booking-agent',
    name: 'Real Estate Lead Qualifier & Automated WhatsApp Booking Agent',
    slug: 'real-estate-whatsapp-booking-agent',
    category: 'Customer Support & Sales',
    complexity: 'Advanced',
    author: { name: 'PropTech Automation', role: 'Real Estate Growth Partner' },
    description: 'Receives Facebook & portal leads, sends automated WhatsApp conversational templates, engages in qualification dialogue (budget, timeline, location), and books property tours into Google Calendar.',
    tags: ['WhatsApp Cloud API', 'Real Estate', 'Google Calendar', 'Conversational AI', 'Lead Qualification'],
    nodeCount: 11,
    stars: 560,
    downloads: 7800,
    featured: true,
    estimatedSetupMinutes: 20,
    useCases: ['Qualifying property buyer leads within 30 seconds of form submission', 'Booking open house viewing tours on agent calendars automatically'],
    setupSteps: ['Connect Meta WhatsApp Cloud API credentials', 'Configure Google Calendar OAuth2', 'Add OpenAI GPT-4o API Key'],
    requiredCredentials: ['httpHeaderAuth', 'googleSheetsOAuth2Api', 'openAiApi'],
    documentationMarkdown: '# Real Estate WhatsApp Booking Agent\n\nTurn portal leads into scheduled property viewing tours on WhatsApp.',
    workflow: {
      name: "Real Estate WhatsApp Booking Agent",
      nodes: [
        { id: "wa-1", name: "Meta Lead Ads Webhook", type: "n8n-nodes-base.webhook", position: [200, 300] },
        { id: "wa-2", name: "Send WhatsApp Greeting", type: "n8n-nodes-base.httpRequest", position: [440, 300] },
        { id: "wa-3", name: "Qualification Agent", type: "@n8n/n8n-nodes-langchain.agent", position: [680, 300] },
        { id: "wa-4", name: "OpenAI Chat Model", type: "@n8n/n8n-nodes-langchain.lmChatOpenAi", position: [680, 500] },
        { id: "wa-5", name: "Book Viewing Tool", type: "@n8n/n8n-nodes-langchain.toolHttpRequest", position: [920, 500] },
        { id: "wa-6", name: "Send Calendar Confirmation", type: "n8n-nodes-base.httpRequest", position: [960, 300] }
      ],
      connections: {
        "Meta Lead Ads Webhook": { main: [[{ node: "Send WhatsApp Greeting", type: "main", index: 0 }]] },
        "Send WhatsApp Greeting": { main: [[{ node: "Qualification Agent", type: "main", index: 0 }]] },
        "OpenAI Chat Model": { ai_languageModel: [[{ node: "Qualification Agent", type: "ai_languageModel", index: 0 }]] },
        "Qualification Agent": { main: [[{ node: "Send Calendar Confirmation", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'template-25-figma-design-asset-sync-s3',
    name: 'Figma Design Update Notifier & Asset Sync to AWS S3',
    slug: 'figma-design-update-notifier-aws-s3',
    category: 'DevOps & APIs',
    complexity: 'Intermediate',
    author: { name: 'DesignOps Collective', role: 'Staff Design Engineer' },
    description: 'Listens for Figma file update webhooks, fetches newly modified vector icon components via Figma REST API, exports SVG/PNG assets directly to Amazon S3, and posts changelogs to Slack.',
    tags: ['Figma API', 'AWS S3', 'DesignOps', 'Slack Notifications', 'Asset Pipeline'],
    nodeCount: 8,
    stars: 340,
    downloads: 3900,
    featured: false,
    estimatedSetupMinutes: 12,
    useCases: ['Automating design token and icon exports from Figma to code repositories', 'Keeping frontend engineering teams in sync with UI design updates'],
    setupSteps: ['Generate Figma Personal Access Token', 'Configure AWS S3 bucket and IAM keys', 'Connect Slack workspace'],
    requiredCredentials: ['httpHeaderAuth', 'slackApi'],
    documentationMarkdown: '# Figma to AWS S3 Asset Pipeline\n\nSync newly published Figma design assets to cloud storage automatically.',
    workflow: {
      name: "Figma Design Update Notifier & S3 Sync",
      nodes: [
        { id: "fig-1", name: "Figma File Webhook", type: "n8n-nodes-base.webhook", position: [200, 300] },
        { id: "fig-2", name: "Fetch Modified Components", type: "n8n-nodes-base.httpRequest", position: [440, 300] },
        { id: "fig-3", name: "Render SVG Export", type: "n8n-nodes-base.httpRequest", position: [680, 300] },
        { id: "fig-4", name: "Upload to S3 Bucket", type: "n8n-nodes-base.httpRequest", position: [920, 240] },
        { id: "fig-5", name: "Post Slack #design-system", type: "n8n-nodes-base.slack", position: [920, 400] }
      ],
      connections: {
        "Figma File Webhook": { main: [[{ node: "Fetch Modified Components", type: "main", index: 0 }]] },
        "Fetch Modified Components": { main: [[{ node: "Render SVG Export", type: "main", index: 0 }]] },
        "Render SVG Export": { main: [[{ node: "Upload to S3 Bucket", type: "main", index: 0 }, { node: "Post Slack #design-system", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'template-26-ai-meeting-note-action-distributor',
    name: 'AI Meeting Note Summarizer & Action Item Distributor (Zoom + Asana)',
    slug: 'ai-meeting-note-summarizer-asana-zoom',
    category: 'Productivity & Office',
    complexity: 'Intermediate',
    author: { name: 'Agile Automations', role: 'Scrum & Ops Master' },
    description: 'Triggered when Zoom cloud recordings finish processing, downloads transcript, prompts Gemini 1.5 to extract key decisions and numbered action items, creates Asana tasks with assignees, and emails attendees.',
    tags: ['Zoom Transcripts', 'Asana Tasks', 'Gemini AI', 'Meeting Notes', 'Action Items'],
    nodeCount: 8,
    stars: 590,
    downloads: 8400,
    featured: true,
    estimatedSetupMinutes: 15,
    useCases: ['Zero-effort meeting minutes distribution', 'Ensuring action items don’t get lost after executive strategy calls'],
    setupSteps: ['Connect Zoom Webhook for recording.completed', 'Add Gemini API Key', 'Connect Asana and email credentials'],
    requiredCredentials: ['httpHeaderAuth', 'googlePalmApi'],
    documentationMarkdown: '# AI Meeting Note Summarizer\n\nTurn Zoom recordings into structured decisions and Asana tasks automatically.',
    workflow: {
      name: "AI Meeting Note Summarizer & Asana Distributor",
      nodes: [
        { id: "mt-1", name: "Zoom Recording Webhook", type: "n8n-nodes-base.webhook", position: [200, 300] },
        { id: "mt-2", name: "Download Transcript File", type: "n8n-nodes-base.httpRequest", position: [440, 300] },
        { id: "mt-3", name: "Action Item Extractor Agent", type: "@n8n/n8n-nodes-langchain.agent", position: [680, 300] },
        { id: "mt-4", name: "Gemini 1.5 Flash Model", type: "@n8n/n8n-nodes-langchain.lmChatGoogleGemini", position: [680, 500] },
        { id: "mt-5", name: "Create Tasks in Asana", type: "n8n-nodes-base.httpRequest", position: [920, 220] },
        { id: "mt-6", name: "Email Summary to Attendees", type: "n8n-nodes-base.httpRequest", position: [920, 380] }
      ],
      connections: {
        "Zoom Recording Webhook": { main: [[{ node: "Download Transcript File", type: "main", index: 0 }]] },
        "Download Transcript File": { main: [[{ node: "Action Item Extractor Agent", type: "main", index: 0 }]] },
        "Gemini 1.5 Flash Model": { ai_languageModel: [[{ node: "Action Item Extractor Agent", type: "ai_languageModel", index: 0 }]] },
        "Action Item Extractor Agent": { main: [[{ node: "Create Tasks in Asana", type: "main", index: 0 }, { node: "Email Summary to Attendees", type: "main", index: 0 }]] }
      }
    }
  }
];

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  template1,
  template2,
  template3,
  template4,
  template5,
  template6,
  ...additionalTemplates
];

export const CATEGORIES = [
  'All',
  'AI Agents & LLMs',
  'Social Media & Video',
  'Customer Support & Sales',
  'DevOps & APIs',
  'RAG & Knowledge Base',
  'Productivity & Office',
  'Tutorials & Essentials'
] as const;
