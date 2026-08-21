import { WorkflowTemplate } from '../../types';

export const aiAgentTemplates: WorkflowTemplate[] = [
  {
    id: 'tpl-ai-1-personal-life-manager',
    name: 'Personal life manager with Telegram, Google services & weather',
    slug: 'personal-life-manager-telegram-google-services-weather',
    category: 'AI Agents & LLMs',
    complexity: 'Advanced',
    author: {
      name: 'Elena Rostova',
      role: 'AI Productivity Specialist',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
    },
    description: 'Autonomous AI Life Operating System via Telegram: reads & schedules Google Calendar events, creates Google Tasks, logs expenses into Google Sheets, and checks live OpenWeather forecasts.',
    longDescription: 'An all-in-one personal AI assistant running directly in your Telegram direct messages. Using LangChain function-calling tools, the AI agent interprets natural language requests (e.g., "Schedule a meeting with David tomorrow at 3pm and remind me to bring the contract", "Log $45 lunch expense to my food sheet", "What is the weather in London today?").',
    tags: ['Telegram Bot', 'Google Calendar', 'Google Sheets', 'Google Tasks', 'OpenWeatherMap', 'AI Agent', 'LangChain'],
    nodeCount: 13,
    stars: 2150,
    downloads: 41800,
    featured: true,
    estimatedSetupMinutes: 20,
    useCases: [
      'Managing your entire day, calendar, and task list from Telegram chat',
      'Instant frictionless expense tracking into structured Google Sheets',
      'Weather-aware schedule planning and executive morning briefings'
    ],
    setupSteps: [
      'Create a Telegram Bot via @BotFather and connect telegramApi credentials',
      'Authenticate Google OAuth2 credentials with Calendar, Sheets, and Tasks permissions',
      'Add your OpenWeatherMap API key to the weather HTTP tool node',
      'Set your OpenAI API credentials in the Chat Model node'
    ],
    requiredCredentials: ['telegramApi', 'googleOAuth2', 'openAiApi', 'openWeatherMapApi'],
    documentationMarkdown: `
# Personal Life Manager with Telegram & Google Services

Turn Telegram into your 24/7 personal executive assistant that has full access to your Google Suite and weather tools.

### Autonomous Capabilities:
- **Google Calendar**: Query upcoming events and create new meeting invites with custom reminders.
- **Google Sheets**: Append rows for expense tracking, workout logs, or habit tracking.
- **Google Tasks**: Add and complete actionable to-dos.
- **OpenWeather**: Retrieve real-time forecasts for any city.
`,
    workflow: {
      name: "Personal life manager with Telegram, Google services & weather",
      nodes: [
        {
          id: "tg-pm-trigger",
          name: "Telegram Message Trigger",
          type: "n8n-nodes-base.telegramTrigger",
          position: [240, 320],
          parameters: { updates: ["message"] },
          typeVersion: 1.1
        },
        {
          id: "tg-pm-agent",
          name: "Life Manager AI Agent",
          type: "@n8n/n8n-nodes-langchain.agent",
          position: [560, 320],
          parameters: {
            promptType: "define",
            text: "={{ $json.message.text }}",
            options: {
              systemMessage: "You are the user's executive Life Manager. You have access to tools for Google Calendar, Google Tasks, Google Sheets (for logging expenses), and OpenWeather. Always respond concisely and confirm actions taken."
            }
          },
          typeVersion: 1.7
        },
        {
          id: "tg-pm-model",
          name: "OpenAI GPT-4o Model",
          type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          position: [400, 560],
          parameters: { model: "gpt-4o", options: { temperature: 0.2 } },
          typeVersion: 1.2
        },
        {
          id: "tg-pm-memory",
          name: "Window Buffer Memory",
          type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
          position: [540, 560],
          parameters: { sessionKey: "={{ $json.message.chat.id }}", contextWindowLength: 15 },
          typeVersion: 1.3
        },
        {
          id: "tg-pm-tool-cal",
          name: "Google Calendar Tool",
          type: "@n8n/n8n-nodes-langchain.toolWorkflow",
          position: [680, 560],
          parameters: { name: "google_calendar", description: "Use to check upcoming schedule and create calendar events." },
          typeVersion: 1
        },
        {
          id: "tg-pm-tool-sheets",
          name: "Google Sheets Tool",
          type: "@n8n/n8n-nodes-langchain.toolWorkflow",
          position: [820, 560],
          parameters: { name: "google_sheets_logger", description: "Use to append expense records or habit tracking entries." },
          typeVersion: 1
        },
        {
          id: "tg-pm-tool-weather",
          name: "OpenWeather Tool",
          type: "@n8n/n8n-nodes-langchain.toolHttpRequest",
          position: [960, 560],
          parameters: {
            name: "get_weather",
            description: "Get real-time temperature and weather forecast for a given city.",
            url: "https://api.openweathermap.org/data/2.5/weather?q={city}&units=metric"
          },
          typeVersion: 1.1
        },
        {
          id: "tg-pm-reply",
          name: "Send Telegram Response",
          type: "n8n-nodes-base.telegram",
          position: [880, 320],
          parameters: {
            chatId: "={{ $('Telegram Message Trigger').item.json.message.chat.id }}",
            text: "={{ $json.output }}"
          },
          typeVersion: 1.2
        }
      ],
      connections: {
        "Telegram Message Trigger": { main: [[{ node: "Life Manager AI Agent", type: "main", index: 0 }]] },
        "OpenAI GPT-4o Model": { ai_languageModel: [[{ node: "Life Manager AI Agent", type: "ai_languageModel", index: 0 }]] },
        "Window Buffer Memory": { ai_memory: [[{ node: "Life Manager AI Agent", type: "ai_memory", index: 0 }]] },
        "Google Calendar Tool": { ai_tool: [[{ node: "Life Manager AI Agent", type: "ai_tool", index: 0 }]] },
        "Google Sheets Tool": { ai_tool: [[{ node: "Life Manager AI Agent", type: "ai_tool", index: 0 }]] },
        "OpenWeather Tool": { ai_tool: [[{ node: "Life Manager AI Agent", type: "ai_tool", index: 0 }]] },
        "Life Manager AI Agent": { main: [[{ node: "Send Telegram Response", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'tpl-ai-2-angie-voice-assistant',
    name: 'Angie, personal AI assistant with Telegram voice and text',
    slug: 'angie-personal-ai-assistant-telegram-voice-text',
    category: 'AI Agents & LLMs',
    complexity: 'Advanced',
    author: {
      name: 'Viktor Sterling',
      role: 'Voice AI Architect',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    },
    description: 'Two-way voice & text personal assistant: transcribes incoming Telegram voice memos with Whisper, generates intelligent answers with GPT-4o, synthesizes natural audio with ElevenLabs, and replies in voice.',
    longDescription: 'Experience true hands-free conversational AI on your phone. When you send a voice memo to your Telegram bot, this workflow downloads the audio file, transcribes it using OpenAI Whisper API, feeds the context into a LangChain conversational agent, passes the agent response to ElevenLabs for ultra-realistic voice synthesis, and sends the voice note directly back to your Telegram chat.',
    tags: ['Voice AI', 'ElevenLabs', 'Whisper STT', 'Telegram Bot', 'GPT-4o', 'Audio Processing'],
    nodeCount: 10,
    stars: 1980,
    downloads: 38700,
    featured: true,
    estimatedSetupMinutes: 15,
    useCases: [
      'Hands-free voice brainstorming and meeting preparation while driving or walking',
      'Realistic human-like audio language practice and coaching',
      'Multimodal audio note taking and voice summarization'
    ],
    setupSteps: [
      'Create your Telegram Bot token via @BotFather',
      'Add your OpenAI API Key for Whisper transcription and GPT-4o reasoning',
      'Add your ElevenLabs API Key and choose your preferred Voice ID',
      'Send a voice message to your bot in Telegram to test audio roundtrip'
    ],
    requiredCredentials: ['telegramApi', 'openAiApi', 'elevenLabsApi'],
    documentationMarkdown: `
# Angie - Personal Voice AI Assistant

Angie enables real-time, low-latency audio conversations with an AI assistant over Telegram.

### Pipeline:
1. **Telegram Voice Webhook**: Captures \`.oga\` / voice files from Telegram.
2. **Download File**: Fetches binary audio stream from Telegram servers.
3. **OpenAI Whisper STT**: Transcribes spoken user audio into text.
4. **LangChain Reasoning Agent**: Processes the question with conversation history.
5. **ElevenLabs Text-to-Speech**: Synthesizes lifelike response voice note.
6. **Telegram Send Voice**: Delivers the speech audio note right back to the user.
`,
    workflow: {
      name: "Angie, personal AI assistant with Telegram voice and text",
      nodes: [
        {
          id: "angie-tg-trigger",
          name: "Telegram Message (Voice/Text)",
          type: "n8n-nodes-base.telegramTrigger",
          position: [180, 320],
          parameters: { updates: ["message"] },
          typeVersion: 1.1
        },
        {
          id: "angie-check-type",
          name: "Is Voice Message?",
          type: "n8n-nodes-base.if",
          position: [380, 320],
          parameters: {
            conditions: {
              boolean: [{ value1: "={{ !!$json.message.voice }}", value2: true }]
            }
          },
          typeVersion: 2
        },
        {
          id: "angie-dl-voice",
          name: "Download Telegram Audio File",
          type: "n8n-nodes-base.httpRequest",
          position: [580, 220],
          parameters: {
            url: "=https://api.telegram.org/bot<TOKEN>/getFile?file_id={{ $json.message.voice.file_id }}",
            responseFormat: "file"
          },
          typeVersion: 4.2
        },
        {
          id: "angie-whisper",
          name: "OpenAI Whisper STT",
          type: "@n8n/n8n-nodes-langchain.openAi",
          position: [780, 220],
          parameters: { resource: "audio", operation: "transcribe" },
          typeVersion: 1.1
        },
        {
          id: "angie-agent",
          name: "Angie Conversation Agent",
          type: "@n8n/n8n-nodes-langchain.agent",
          position: [1020, 320],
          parameters: {
            promptType: "define",
            text: "={{ $json.text || $json.message.text }}",
            options: {
              systemMessage: "You are Angie, an articulate and charismatic voice AI assistant. Keep responses engaging and conversational, optimized for spoken audio."
            }
          },
          typeVersion: 1.7
        },
        {
          id: "angie-model",
          name: "OpenAI GPT-4o",
          type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          position: [920, 540],
          parameters: { model: "gpt-4o", options: { temperature: 0.6 } },
          typeVersion: 1.2
        },
        {
          id: "angie-memory",
          name: "Chat Memory Buffer",
          type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
          position: [1080, 540],
          parameters: { sessionKey: "={{ $('Telegram Message (Voice/Text)').item.json.message.chat.id }}", contextWindowLength: 12 },
          typeVersion: 1.3
        },
        {
          id: "angie-tts",
          name: "ElevenLabs Voice Generator",
          type: "n8n-nodes-base.httpRequest",
          position: [1260, 220],
          parameters: {
            method: "POST",
            url: "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
            sendBody: true,
            bodyParameters: {
              parameters: [
                { name: "text", value: "={{ $json.output }}" },
                { name: "model_id", value: "eleven_turbo_v2_5" }
              ]
            },
            responseFormat: "file"
          },
          typeVersion: 4.2
        },
        {
          id: "angie-send-voice",
          name: "Send Telegram Voice Note",
          type: "n8n-nodes-base.telegram",
          position: [1500, 220],
          parameters: {
            operation: "sendAudio",
            chatId: "={{ $('Telegram Message (Voice/Text)').item.json.message.chat.id }}"
          },
          typeVersion: 1.2
        },
        {
          id: "angie-send-text",
          name: "Send Telegram Text Reply",
          type: "n8n-nodes-base.telegram",
          position: [1260, 420],
          parameters: {
            chatId: "={{ $('Telegram Message (Voice/Text)').item.json.message.chat.id }}",
            text: "={{ $json.output }}"
          },
          typeVersion: 1.2
        }
      ],
      connections: {
        "Telegram Message (Voice/Text)": { main: [[{ node: "Is Voice Message?", type: "main", index: 0 }]] },
        "Is Voice Message?": {
          main: [
            [{ node: "Download Telegram Audio File", type: "main", index: 0 }],
            [{ node: "Angie Conversation Agent", type: "main", index: 0 }]
          ]
        },
        "Download Telegram Audio File": { main: [[{ node: "OpenAI Whisper STT", type: "main", index: 0 }]] },
        "OpenAI Whisper STT": { main: [[{ node: "Angie Conversation Agent", type: "main", index: 0 }]] },
        "OpenAI GPT-4o": { ai_languageModel: [[{ node: "Angie Conversation Agent", type: "ai_languageModel", index: 0 }]] },
        "Chat Memory Buffer": { ai_memory: [[{ node: "Angie Conversation Agent", type: "ai_memory", index: 0 }]] },
        "Angie Conversation Agent": {
          main: [
            [{ node: "ElevenLabs Voice Generator", type: "main", index: 0 }],
            [{ node: "Send Telegram Text Reply", type: "main", index: 0 }]
          ]
        },
        "ElevenLabs Voice Generator": { main: [[{ node: "Send Telegram Voice Note", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'tpl-ai-3-talk-to-google-sheets',
    name: 'Talk to your Google Sheets using ChatGPT-5 / GPT-4o',
    slug: 'talk-to-your-google-sheets-chatgpt',
    category: 'AI Agents & LLMs',
    complexity: 'Intermediate',
    author: {
      name: 'DataFlow Solutions',
      role: 'Spreadsheet AI Experts',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    description: 'Natural language spreadsheet analyst: ask questions, perform aggregations, filter records, compute financial metrics, and write updates to Google Sheets with zero SQL or formula knowledge.',
    longDescription: 'Empower anyone on your team to talk directly with company spreadsheets. Connected to your Google Drive and Google Sheets account, this LangChain Agent reads headers, dynamically computes queries across thousands of rows, generates visual markdown tables, and appends new records upon user confirmation.',
    tags: ['Google Sheets', 'ChatGPT', 'Spreadsheet AI', 'Data Analysis', 'LangChain Tool', 'Formulas'],
    nodeCount: 7,
    stars: 1780,
    downloads: 36400,
    featured: true,
    estimatedSetupMinutes: 10,
    useCases: [
      'Answering executive ad-hoc data questions ("What was Q3 revenue for Europe?")',
      'Eliminating complex VLOOKUP and INDEX-MATCH formulas for non-technical teammates',
      'Validating data entries and finding duplicate rows automatically'
    ],
    setupSteps: [
      'Connect your Google Sheets OAuth2 account',
      'Enter the Google Spreadsheet ID in the Sheet Reader and Writer nodes',
      'Add your OpenAI API credentials in the OpenAI Chat Model node',
      'Ask questions in the chat window like "Summarize total sales by product category"'
    ],
    requiredCredentials: ['googleSheetsOAuth2', 'openAiApi'],
    documentationMarkdown: `
# Talk to Your Google Sheets using ChatGPT

Query, filter, summarize, and update any Google Sheet using plain conversational English.
`,
    workflow: {
      name: "Talk to your Google Sheets using ChatGPT",
      nodes: [
        {
          id: "gs-chat-trigger",
          name: "Chat Interface Trigger",
          type: "@n8n/n8n-nodes-langchain.manualChatTrigger",
          position: [260, 300],
          typeVersion: 1
        },
        {
          id: "gs-agent",
          name: "Google Sheets Analyst Agent",
          type: "@n8n/n8n-nodes-langchain.agent",
          position: [520, 300],
          parameters: {
            promptType: "define",
            text: "={{ $json.chatInput }}",
            options: {
              systemMessage: "You are a senior spreadsheet analyst. Use the read_sheet tool to inspect column headers and row values, perform accurate mathematical calculations, and format results as clean markdown tables."
            }
          },
          typeVersion: 1.7
        },
        {
          id: "gs-model",
          name: "OpenAI GPT-4o Model",
          type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          position: [420, 520],
          parameters: { model: "gpt-4o", options: { temperature: 0.1 } },
          typeVersion: 1.2
        },
        {
          id: "gs-memory",
          name: "Window Buffer Memory",
          type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
          position: [560, 520],
          parameters: { contextWindowLength: 10 },
          typeVersion: 1.3
        },
        {
          id: "gs-tool-read",
          name: "Read Google Sheet Tool",
          type: "@n8n/n8n-nodes-langchain.toolWorkflow",
          position: [700, 520],
          parameters: {
            name: "read_sheet",
            description: "Reads all rows and column headers from the connected Google Sheet."
          },
          typeVersion: 1
        },
        {
          id: "gs-tool-write",
          name: "Write Google Sheet Tool",
          type: "@n8n/n8n-nodes-langchain.toolWorkflow",
          position: [840, 520],
          parameters: {
            name: "append_sheet_row",
            description: "Appends a new record row to the Google Sheet after user confirmation."
          },
          typeVersion: 1
        }
      ],
      connections: {
        "Chat Interface Trigger": { main: [[{ node: "Google Sheets Analyst Agent", type: "main", index: 0 }]] },
        "OpenAI GPT-4o Model": { ai_languageModel: [[{ node: "Google Sheets Analyst Agent", type: "ai_languageModel", index: 0 }]] },
        "Window Buffer Memory": { ai_memory: [[{ node: "Google Sheets Analyst Agent", type: "ai_memory", index: 0 }]] },
        "Read Google Sheet Tool": { ai_tool: [[{ node: "Google Sheets Analyst Agent", type: "ai_tool", index: 0 }]] },
        "Write Google Sheet Tool": { ai_tool: [[{ node: "Google Sheets Analyst Agent", type: "ai_tool", index: 0 }]] }
      }
    }
  },
  {
    id: 'tpl-ai-4-chat-with-database',
    name: 'Chat with a database using AI (PostgreSQL / Supabase / MySQL)',
    slug: 'chat-with-a-database-using-ai',
    category: 'AI Agents & LLMs',
    complexity: 'Advanced',
    author: {
      name: 'SQL AI Collective',
      role: 'Database Engineers',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    description: 'Autonomous Text-to-SQL AI Agent: inspects schema tables, constructs optimized SQL queries with guardrails (read-only enforcement), executes queries, and returns human-readable insights.',
    longDescription: 'Turn complex relational databases into conversational knowledge bases. The SQL Agent queries table metadata (information_schema), formulates syntactically valid Postgres/MySQL queries, executes read-only transactions, catches syntax errors with self-correction retries, and returns structured charts or markdown tables.',
    tags: ['PostgreSQL', 'Supabase', 'MySQL', 'Text-to-SQL', 'Database Agent', 'LangChain', 'SQL Safety'],
    nodeCount: 8,
    stars: 1640,
    downloads: 32900,
    featured: true,
    estimatedSetupMinutes: 15,
    useCases: [
      'Allowing business stakeholders to query live production analytics without writing SQL',
      'Automating weekly KPI reporting and database anomaly checks',
      'Rapid prototype exploration of new relational schemas'
    ],
    setupSteps: [
      'Connect PostgreSQL or MySQL credentials in the database tool node (use read-only DB user for safety)',
      'Add OpenAI API key with GPT-4o model',
      'Test queries like "What are the top 5 churned customer accounts this month by MRR?"'
    ],
    requiredCredentials: ['postgres', 'openAiApi'],
    documentationMarkdown: `
# Chat with a Database using AI

Safely query SQL databases (Postgres, Supabase, MySQL) with natural language.

### Safety & Guardrails:
- Read-only transaction enforcement (no \`DROP\`, \`DELETE\`, or \`UPDATE\` queries allowed)
- Automatic table schema extraction so the LLM understands foreign key relationships
- Self-correction loop if a syntax or column name error occurs
`,
    workflow: {
      name: "Chat with a database using AI",
      nodes: [
        {
          id: "sql-chat-trigger",
          name: "Manual Chat Trigger",
          type: "@n8n/n8n-nodes-langchain.manualChatTrigger",
          position: [240, 300],
          typeVersion: 1
        },
        {
          id: "sql-agent",
          name: "SQL Database Agent",
          type: "@n8n/n8n-nodes-langchain.agent",
          position: [500, 300],
          parameters: {
            promptType: "define",
            text: "={{ $json.chatInput }}",
            options: {
              systemMessage: "You are a professional SQL database analyst. First inspect the schema if you do not know the tables, then write SELECT queries to retrieve relevant data. Never perform write or destructive operations."
            }
          },
          typeVersion: 1.7
        },
        {
          id: "sql-model",
          name: "OpenAI Chat Model (GPT-4o)",
          type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          position: [400, 520],
          parameters: { model: "gpt-4o", options: { temperature: 0.1 } },
          typeVersion: 1.2
        },
        {
          id: "sql-memory",
          name: "Window Buffer Memory",
          type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
          position: [540, 520],
          parameters: { contextWindowLength: 10 },
          typeVersion: 1.3
        },
        {
          id: "sql-tool-schema",
          name: "List Database Tables Tool",
          type: "@n8n/n8n-nodes-langchain.toolWorkflow",
          position: [680, 520],
          parameters: { name: "list_tables_and_schema", description: "Returns table names, column types, and foreign key relations." },
          typeVersion: 1
        },
        {
          id: "sql-tool-execute",
          name: "Execute Read-Only SQL Tool",
          type: "@n8n/n8n-nodes-langchain.toolWorkflow",
          position: [820, 520],
          parameters: { name: "execute_sql_query", description: "Executes a SELECT SQL query against PostgreSQL and returns rows as JSON." },
          typeVersion: 1
        }
      ],
      connections: {
        "Manual Chat Trigger": { main: [[{ node: "SQL Database Agent", type: "main", index: 0 }]] },
        "OpenAI Chat Model (GPT-4o)": { ai_languageModel: [[{ node: "SQL Database Agent", type: "ai_languageModel", index: 0 }]] },
        "Window Buffer Memory": { ai_memory: [[{ node: "SQL Database Agent", type: "ai_memory", index: 0 }]] },
        "List Database Tables Tool": { ai_tool: [[{ node: "SQL Database Agent", type: "ai_tool", index: 0 }]] },
        "Execute Read-Only SQL Tool": { ai_tool: [[{ node: "SQL Database Agent", type: "ai_tool", index: 0 }]] }
      }
    }
  },
  {
    id: 'tpl-ai-5-facebook-messenger-chatbot',
    name: 'Create an intelligent Facebook Messenger chatbot with GPT-4o-mini & message memory',
    slug: 'facebook-messenger-chatbot-gpt4o-mini-memory',
    category: 'AI Agents & LLMs',
    complexity: 'Intermediate',
    author: {
      name: 'OmniChannel AI',
      role: 'Customer Engagement Lead',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    description: '24/7 Facebook Page Assistant: receives incoming Messenger DMs via Webhook, maintains session conversation memory per Facebook User ID, answers FAQs, and books support tickets.',
    longDescription: 'Connect Meta Facebook Messenger directly to an intelligent LangChain agent. When Facebook users message your page, this workflow verifies incoming webhook signatures, retrieves per-user conversation memory, generates on-brand answers via GPT-4o-mini, and sends instant Messenger bubble replies with quick reply buttons.',
    tags: ['Facebook Messenger', 'Meta Webhook', 'GPT-4o-mini', 'Customer Chatbot', 'Session Memory'],
    nodeCount: 8,
    stars: 1390,
    downloads: 24600,
    featured: false,
    estimatedSetupMinutes: 15,
    useCases: [
      'Automating instant response times for Facebook Business Pages to win "Very Responsive" badge',
      'Resolving product inquiries, pricing questions, and store hours 24/7',
      'Escalating complex requests to human agents with email notifications'
    ],
    setupSteps: [
      'Create a Meta for Developers App and subscribe to page `messages` webhooks',
      'Enter your Facebook Page Access Token in HTTP Request node',
      'Add OpenAI API credentials',
      'Customize the brand knowledge in the System Prompt'
    ],
    requiredCredentials: ['httpHeaderAuth', 'openAiApi'],
    documentationMarkdown: `
# Intelligent Facebook Messenger Chatbot

Provide instant AI customer support to visitors on your Facebook Business Page.
`,
    workflow: {
      name: "Facebook Messenger chatbot with GPT-4o-mini",
      nodes: [
        {
          id: "fb-webhook",
          name: "Facebook Webhook (messages)",
          type: "n8n-nodes-base.webhook",
          position: [200, 300],
          parameters: { path: "fb-messenger-bot", httpMethod: "POST" },
          typeVersion: 1.1
        },
        {
          id: "fb-verify",
          name: "Verify Webhook Challenge",
          type: "n8n-nodes-base.if",
          position: [420, 300],
          parameters: {
            conditions: {
              string: [{ value1: "={{ $json.query['hub.mode'] }}", value2: "subscribe" }]
            }
          },
          typeVersion: 2
        },
        {
          id: "fb-agent",
          name: "Messenger Support Agent",
          type: "@n8n/n8n-nodes-langchain.agent",
          position: [680, 300],
          parameters: {
            promptType: "define",
            text: "={{ $json.body.entry[0].messaging[0].message.text }}",
            options: {
              systemMessage: "You are the friendly customer support assistant for our Facebook page. Provide helpful, short answers suitable for chat screens."
            }
          },
          typeVersion: 1.7
        },
        {
          id: "fb-model",
          name: "GPT-4o-mini Model",
          type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          position: [580, 520],
          parameters: { model: "gpt-4o-mini", options: { temperature: 0.5 } },
          typeVersion: 1.2
        },
        {
          id: "fb-memory",
          name: "Window Buffer Memory",
          type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
          position: [740, 520],
          parameters: {
            sessionKey: "={{ $('Facebook Webhook (messages)').item.json.body.entry[0].messaging[0].sender.id }}",
            contextWindowLength: 10
          },
          typeVersion: 1.3
        },
        {
          id: "fb-send-reply",
          name: "Send Facebook Messenger Reply",
          type: "n8n-nodes-base.httpRequest",
          position: [940, 300],
          parameters: {
            method: "POST",
            url: "https://graph.facebook.com/v19.0/me/messages",
            authentication: "genericCredentialType",
            sendBody: true,
            bodyParameters: {
              parameters: [
                { name: "recipient.id", value: "={{ $('Facebook Webhook (messages)').item.json.body.entry[0].messaging[0].sender.id }}" },
                { name: "message.text", value: "={{ $json.output }}" }
              ]
            }
          },
          typeVersion: 4.2
        }
      ],
      connections: {
        "Facebook Webhook (messages)": { main: [[{ node: "Verify Webhook Challenge", type: "main", index: 0 }]] },
        "Verify Webhook Challenge": { main: [[], [{ node: "Messenger Support Agent", type: "main", index: 0 }]] },
        "GPT-4o-mini Model": { ai_languageModel: [[{ node: "Messenger Support Agent", type: "ai_languageModel", index: 0 }]] },
        "Window Buffer Memory": { ai_memory: [[{ node: "Messenger Support Agent", type: "ai_memory", index: 0 }]] },
        "Messenger Support Agent": { main: [[{ node: "Send Facebook Messenger Reply", type: "main", index: 0 }]] }
      }
    }
  }
];
