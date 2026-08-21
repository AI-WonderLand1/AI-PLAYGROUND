import { WorkflowTemplate } from '../../types';

export const starterTutorialTemplates: WorkflowTemplate[] = [
  {
    id: 'tpl-starter-1-first-ai-agent',
    name: 'Build your first AI agent',
    slug: 'build-your-first-ai-agent',
    category: 'Tutorials & Essentials',
    complexity: 'Beginner',
    author: {
      name: 'Automation Academy Team',
      role: 'Official Starter Template',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    description: 'The definitive beginner starter workflow: connects a Manual Chat Trigger with a LangChain AI Agent, OpenAI Chat Model, Window Buffer Memory, and a Calculator Tool.',
    longDescription: 'This essential introductory template guides you through building a real autonomous AI Agent. You will see how LangChain agents orchestrate between the language model (GPT-4o mini), conversational memory (retaining context across chat turns), and external tools (a mathematical calculator).',
    tags: ['First AI Agent', 'LangChain', 'OpenAI', 'Chat Trigger', 'Memory', 'Calculator', 'Beginner'],
    nodeCount: 5,
    stars: 1820,
    downloads: 34200,
    featured: true,
    estimatedSetupMinutes: 5,
    useCases: [
      'Learning the fundamental architecture of LangChain AI Agents',
      'Testing prompt engineering and conversational context memory',
      'Experimenting with attaching custom tools to AI reasoning loops'
    ],
    setupSteps: [
      'Double-click the OpenAI Chat Model node and select or create your OpenAI API credentials',
      'Click the "Chat" button at the bottom of the canvas or run "Test step"',
      'Type questions like "What is 482 multiplied by 19?" and "What did I just ask you?" to test memory & tool usage'
    ],
    requiredCredentials: ['openAiApi'],
    documentationMarkdown: `
# Build Your First AI Agent

This starter template introduces the foundational architecture of autonomous AI Agents.

### Node Layout:
1. **When chat message received**: Listens for interactive user chat input directly inside the UI or via embedded chat.
2. **AI Agent**: The orchestrator brain that determines whether to answer directly or call a connected tool.
3. **OpenAI Chat Model (GPT-4o-mini)**: Connected via the \`ai_languageModel\` pin to power generation.
4. **Window Buffer Memory**: Connected via \`ai_memory\` to store the last 10 conversational turns.
5. **Calculator Tool**: Connected via \`ai_tool\` to perform precise mathematical calculations.
`,
    workflow: {
      name: "Build your first AI agent",
      nodes: [
        {
          id: "node-chat-trigger-1",
          name: "When chat message received",
          type: "@n8n/n8n-nodes-langchain.manualChatTrigger",
          position: [380, 300],
          typeVersion: 1
        },
        {
          id: "node-agent-1",
          name: "AI Agent",
          type: "@n8n/n8n-nodes-langchain.agent",
          position: [620, 300],
          parameters: {
            promptType: "define",
            text: "={{ $json.chatInput }}",
            options: {
              systemMessage: "You are a helpful and polite AI Assistant. Answer questions clearly and use your calculator tool whenever math or calculations are requested."
            }
          },
          typeVersion: 1.7
        },
        {
          id: "node-openai-model-1",
          name: "OpenAI Chat Model",
          type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          position: [520, 520],
          parameters: {
            model: "gpt-4o-mini",
            options: { temperature: 0.7 }
          },
          typeVersion: 1.2
        },
        {
          id: "node-memory-1",
          name: "Window Buffer Memory",
          type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
          position: [660, 520],
          parameters: {
            contextWindowLength: 10
          },
          typeVersion: 1.3
        },
        {
          id: "node-calculator-1",
          name: "Calculator",
          type: "@n8n/n8n-nodes-langchain.toolCalculator",
          position: [800, 520],
          parameters: {},
          typeVersion: 1
        }
      ],
      connections: {
        "When chat message received": {
          main: [[{ node: "AI Agent", type: "main", index: 0 }]]
        },
        "OpenAI Chat Model": {
          ai_languageModel: [[{ node: "AI Agent", type: "ai_languageModel", index: 0 }]]
        },
        "Window Buffer Memory": {
          ai_memory: [[{ node: "AI Agent", type: "ai_memory", index: 0 }]]
        },
        "Calculator": {
          ai_tool: [[{ node: "AI Agent", type: "ai_tool", index: 0 }]]
        }
      }
    }
  },
  {
    id: 'tpl-starter-2-learn-automation-basics',
    name: 'Learn Automation basics in 3 easy steps ✨',
    slug: 'learn-automation-basics-in-3-easy-steps',
    category: 'Tutorials & Essentials',
    complexity: 'Beginner',
    author: {
      name: 'Jon O\'Keefe',
      role: 'Automation Developer Advocate',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    description: 'Learn the core concepts of triggers, data transformation with JavaScript Code nodes, and sending formatted outbound notifications.',
    longDescription: 'The perfect workflow for newcomers to automation. Embedded with visual sticky notes, this workflow demonstrates how items flow through nodes as JSON arrays, how expressions reference previous node data, and how to branch outputs.',
    tags: ['Tutorial', 'Workflow Basics', 'Sticky Notes', 'Code Node', 'Expressions', 'Slack Notification'],
    nodeCount: 6,
    stars: 1450,
    downloads: 28900,
    featured: true,
    estimatedSetupMinutes: 5,
    useCases: [
      'Understanding the workflow data structure (JSON items array)',
      'Learning how to use {{ $json.myField }} expressions',
      'Building your very first scheduled notification pipeline'
    ],
    setupSteps: [
      'Click "Test workflow" to trigger the sample manual execution',
      'Inspect the output tabs between each node to see data flow step-by-step',
      'Optionally connect your Discord, Slack, or Email credentials in the final notification node'
    ],
    requiredCredentials: ['slackApi'],
    documentationMarkdown: `
# Learn Automation Basics in 3 Easy Steps

Welcome to AI-WonderLand! This workflow explains the 3 pillars of automation:
1. **Trigger**: Starts the workflow (Manual, Schedule, Webhook, or App event).
2. **Transform**: Processes, filters, or formats your payload.
3. **Action**: Delivers the result to a destination service.
`,
    workflow: {
      name: "Learn Automation basics in 3 easy steps ✨",
      nodes: [
        {
          id: "note-1",
          name: "Step 1: The Trigger",
          type: "n8n-nodes-base.stickyNote",
          position: [180, 160],
          parameters: {
            content: "### 1. The Trigger\nEvery workflow starts with a trigger. Click **Test workflow** below to send sample user order data through the pipeline.",
            width: 260,
            height: 180
          }
        },
        {
          id: "note-2",
          name: "Step 2: Transform Data",
          type: "n8n-nodes-base.stickyNote",
          position: [480, 160],
          parameters: {
            content: "### 2. Transform Data\nThe Code node calculates discounts, formats currency, and creates clean customer summaries.",
            width: 260,
            height: 180
          }
        },
        {
          id: "note-3",
          name: "Step 3: Take Action",
          type: "n8n-nodes-base.stickyNote",
          position: [780, 160],
          parameters: {
            content: "### 3. Take Action\nSend the computed result to Slack, Discord, or Email with a single click.",
            width: 260,
            height: 180
          }
        },
        {
          id: "trigger-manual-1",
          name: "When clicking ‘Test workflow’",
          type: "n8n-nodes-base.manualTrigger",
          position: [220, 380],
          typeVersion: 1
        },
        {
          id: "code-sample-data-1",
          name: "Sample Customer Order",
          type: "n8n-nodes-base.code",
          position: [520, 380],
          parameters: {
            jsCode: "return [\n  {\n    json: {\n      customer: \"Alice Johnson\",\n      email: \"alice@example.com\",\n      item: \"Enterprise AI Plan\",\n      amount: 299,\n      discountCode: \"WELCOME20\",\n      finalAmount: (299 * 0.8).toFixed(2),\n      timestamp: new Date().toISOString()\n    }\n  }\n];"
          },
          typeVersion: 2
        },
        {
          id: "action-notify-1",
          name: "Send Slack Notification",
          type: "n8n-nodes-base.slack",
          position: [820, 380],
          parameters: {
            channel: "#sales-alerts",
            text: "=🎉 New Customer Order! \n**Customer:** {{ $json.customer }}\n**Plan:** {{ $json.item }}\n**Total:** ${{ $json.finalAmount }}\n**Email:** {{ $json.email }}"
          },
          typeVersion: 2.1
        }
      ],
      connections: {
        "When clicking ‘Test workflow’": {
          main: [[{ node: "Sample Customer Order", type: "main", index: 0 }]]
        },
        "Sample Customer Order": {
          main: [[{ node: "Send Slack Notification", type: "main", index: 0 }]]
        }
      }
    }
  },
  {
    id: 'tpl-starter-3-learn-json-basics',
    name: 'Learn JSON basics with an interactive step-by-step tutorial',
    slug: 'learn-json-basics-interactive-tutorial',
    category: 'Tutorials & Essentials',
    complexity: 'Beginner',
    author: {
      name: 'DevRel Team',
      role: 'Community Education',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
    },
    description: 'Hands-on interactive tutorial explaining keys, values, nested objects, arrays, and JSON path expressions in workflows.',
    longDescription: 'Master working with JSON structures in workflows. This workflow takes raw nested API responses and demonstrates how to extract nested keys (e.g., $json.user.address.city), loop over arrays of items, filter records, and aggregate values.',
    tags: ['JSON Basics', 'Tutorial', 'Data Modeling', 'Expressions', 'JavaScript', 'Beginner'],
    nodeCount: 6,
    stars: 1120,
    downloads: 19500,
    featured: false,
    estimatedSetupMinutes: 8,
    useCases: [
      'Learning how workflows represent datasets as lists of JSON items',
      'Practicing extracting nested objects and array elements',
      'Understanding how to structure payloads before calling external REST APIs'
    ],
    setupSteps: [
      'Execute the workflow using the manual trigger',
      'Step through the 3 demonstration nodes (Nested Objects, Array of Products, and Formatted Output)',
      'Experiment with changing key values in the Code nodes to see dynamic output'
    ],
    requiredCredentials: [],
    documentationMarkdown: `
# Learn JSON Basics

Understand how modern workflows work under the hood with JSON items and data tables.
`,
    workflow: {
      name: "Learn JSON basics with an interactive tutorial",
      nodes: [
        {
          id: "json-trigger-1",
          name: "Start Tutorial Trigger",
          type: "n8n-nodes-base.manualTrigger",
          position: [200, 300],
          typeVersion: 1
        },
        {
          id: "json-nested-1",
          name: "1. Nested JSON Object",
          type: "n8n-nodes-base.code",
          position: [440, 300],
          parameters: {
            jsCode: "return [{\n  json: {\n    id: 1042,\n    profile: {\n      firstName: 'Sophia',\n      lastName: 'Chen',\n      company: {\n        name: 'Nexus Corp',\n        domain: 'nexus.io'\n      }\n    },\n    roles: ['admin', 'billing_manager'],\n    preferences: {\n      theme: 'dark',\n      notificationsEnabled: true\n    }\n  }\n}];"
          },
          typeVersion: 2
        },
        {
          id: "json-array-1",
          name: "2. Extract & Map Fields",
          type: "n8n-nodes-base.set",
          position: [680, 300],
          parameters: {
            assignments: {
              assignments: [
                { id: "f1", name: "fullName", type: "string", value: "={{ $json.profile.firstName }} {{ $json.profile.lastName }}" },
                { id: "f2", name: "company", type: "string", value: "={{ $json.profile.company.name }}" },
                { id: "f3", name: "primaryRole", type: "string", value: "={{ $json.roles[0] }}" }
              ]
            }
          },
          typeVersion: 3.4
        },
        {
          id: "json-summary-1",
          name: "3. Format Clean JSON",
          type: "n8n-nodes-base.code",
          position: [920, 300],
          parameters: {
            jsCode: "const data = $input.first().json;\nreturn [{\n  json: {\n    status: 'success',\n    userBadge: `[${data.primaryRole.toUpperCase()}] ${data.fullName} @ ${data.company}`,\n    readyForExport: true\n  }\n}];"
          },
          typeVersion: 2
        }
      ],
      connections: {
        "Start Tutorial Trigger": { main: [[{ node: "1. Nested JSON Object", type: "main", index: 0 }]] },
        "1. Nested JSON Object": { main: [[{ node: "2. Extract & Map Fields", type: "main", index: 0 }]] },
        "2. Extract & Map Fields": { main: [[{ node: "3. Format Clean JSON", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'tpl-starter-4-learn-code-node',
    name: 'Learn Code Node (JavaScript) with an Interactive Hands-On Playground',
    slug: 'learn-code-node-javascript-interactive-playground',
    category: 'Tutorials & Essentials',
    complexity: 'Beginner',
    author: {
      name: 'Marcus Vance',
      role: 'Full-Stack JavaScript Lead',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    description: 'Master $input.all(), $input.first(), item loops, Date calculations, regex parsing, and array transformations in the JavaScript Code node.',
    longDescription: 'The JavaScript Code node is the most versatile tool in workflow automation. This tutorial playground provides ready-to-run examples of the 5 most common code patterns: Array looping, filtering objects by criteria, parsing regex from strings, calculating date differences, and merging multiple data streams.',
    tags: ['JavaScript', 'Code Node', 'Regex', 'Date Parsing', 'Array Mapping', 'Tutorial'],
    nodeCount: 6,
    stars: 1690,
    downloads: 31000,
    featured: true,
    estimatedSetupMinutes: 10,
    useCases: [
      'Learning the workflow Code node methods ($input.all, $input.item, $json)',
      'Cleaning messy incoming webhooks before database insertion',
      'Performing complex multi-field math and string manipulation'
    ],
    setupSteps: [
      'Click Test Workflow to run through the 4 hands-on code examples',
      'Open each Code node to read the commented JavaScript explanations',
      'Modify the arrays to practice your own custom transformations'
    ],
    requiredCredentials: [],
    documentationMarkdown: `
# Interactive Hands-On JavaScript Code Node Playground

Learn how to write performant JavaScript transformations without external libraries.
`,
    workflow: {
      name: "Learn Code Node (JavaScript) Playground",
      nodes: [
        {
          id: "js-trigger-1",
          name: "Run Code Playground",
          type: "n8n-nodes-base.manualTrigger",
          position: [200, 300],
          typeVersion: 1
        },
        {
          id: "js-seed-1",
          name: "Generate Raw Inventory Data",
          type: "n8n-nodes-base.code",
          position: [440, 300],
          parameters: {
            jsCode: "return [\n  { json: { id: 'SKU-01', name: 'Wireless Headphones', price: 129.99, stock: 42, category: 'Audio' } },\n  { json: { id: 'SKU-02', name: 'USB-C Fast Cable 2m', price: 19.50, stock: 0, category: 'Cables' } },\n  { json: { id: 'SKU-03', name: 'Mechanical Keyboard RGB', price: 89.00, stock: 15, category: 'Peripherals' } },\n  { json: { id: 'SKU-04', name: 'Noise-Cancelling Earbuds', price: 199.00, stock: 4, category: 'Audio' } }\n];"
          },
          typeVersion: 2
        },
        {
          id: "js-filter-1",
          name: "Filter & Calculate Margins",
          type: "n8n-nodes-base.code",
          position: [680, 200],
          parameters: {
            jsCode: "// Loop over all incoming items and filter out out-of-stock items\nconst results = [];\nfor (const item of $input.all()) {\n  if (item.json.stock > 0) {\n    results.push({\n      json: {\n        sku: item.json.id,\n        productName: item.json.name,\n        totalValue: (item.json.price * item.json.stock).toFixed(2),\n        status: item.json.stock < 10 ? 'LOW_STOCK' : 'IN_STOCK'\n      }\n    });\n  }\n}\nreturn results;"
          },
          typeVersion: 2
        },
        {
          id: "js-aggregate-1",
          name: "Aggregate Inventory Stats",
          type: "n8n-nodes-base.code",
          position: [920, 200],
          parameters: {
            jsCode: "const items = $input.all();\nconst totalInventoryValue = items.reduce((sum, item) => sum + parseFloat(item.json.totalValue), 0);\nconst lowStockCount = items.filter(i => i.json.status === 'LOW_STOCK').length;\n\nreturn [{\n  json: {\n    activeSkus: items.length,\n    totalInventoryValuation: `$${totalInventoryValue.toLocaleString()}`,\n    requiresReorder: lowStockCount > 0,\n    lowStockItemsCount: lowStockCount,\n    generatedAt: new Date().toISOString()\n  }\n}];"
          },
          typeVersion: 2
        }
      ],
      connections: {
        "Run Code Playground": { main: [[{ node: "Generate Raw Inventory Data", type: "main", index: 0 }]] },
        "Generate Raw Inventory Data": { main: [[{ node: "Filter & Calculate Margins", type: "main", index: 0 }]] },
        "Filter & Calculate Margins": { main: [[{ node: "Aggregate Inventory Stats", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'tpl-starter-5-webhook-rest-api',
    name: 'Build your first REST Webhook API with validation & custom response',
    slug: 'build-first-rest-webhook-api',
    category: 'Tutorials & Essentials',
    complexity: 'Beginner',
    author: {
      name: 'API Architecture Team',
      role: 'Backend Automation Lead',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    description: 'Learn how to accept HTTP POST requests, validate JSON schema payloads with JavaScript, branch logic, and return custom HTTP 200/400 responses.',
    longDescription: 'Turn your workflow engine into a high-performance REST microservice. This step-by-step tutorial demonstrates how the Webhook node captures query parameters, headers, and body payloads, validates incoming fields with the Code node, branches with the IF node, and issues customized JSON status codes with the Respond to Webhook node.',
    tags: ['Webhook', 'REST API', 'HTTP Response', 'Validation', 'Tutorial', 'Beginner'],
    nodeCount: 6,
    stars: 1780,
    downloads: 31200,
    featured: true,
    estimatedSetupMinutes: 5,
    useCases: [
      'Creating microservice endpoints without maintaining web server infrastructure',
      'Validating form submissions from React, Next.js, or Webflow before downstream processing',
      'Returning instantaneous synchronous responses with transaction IDs'
    ],
    setupSteps: [
      'Click on the Webhook node and copy the Test or Production webhook URL',
      'Send a sample POST request using Postman, cURL, or fetch',
      'Inspect the validation code node and the custom response headers'
    ],
    requiredCredentials: [],
    documentationMarkdown: `
# Build Your First REST Webhook API

Transform workflows into responsive HTTP endpoints with payload validation and custom JSON status codes.

### Architecture:
1. **Webhook Trigger**: Listens for incoming POST requests on \`/webhook/lead-intake\`.
2. **Validate Request Body**: Verifies that required fields (\`email\`, \`name\`) exist and follow proper formats.
3. **If Valid Payload**: Routes valid requests to processing; invalid requests to error responses.
4. **Respond with 200 OK**: Sends a JSON confirmation message with a timestamp and execution ID.
5. **Respond with 400 Bad Request**: Returns specific validation error messages.
`,
    workflow: {
      name: "Build your first REST Webhook API",
      nodes: [
        {
          id: "wh-trigger-1",
          name: "Webhook Lead Intake",
          type: "n8n-nodes-base.webhook",
          position: [180, 300],
          parameters: {
            httpMethod: "POST",
            path: "lead-intake",
            responseMode: "responseNode",
            options: {}
          },
          typeVersion: 2
        },
        {
          id: "wh-code-validate",
          name: "Validate Input Payload",
          type: "n8n-nodes-base.code",
          position: [420, 300],
          parameters: {
            jsCode: "const body = $input.first().json.body || $input.first().json;\n\nconst errors = [];\nif (!body.email || !body.email.includes('@')) {\n  errors.push('Valid email address is required');\n}\nif (!body.name || body.name.trim().length < 2) {\n  errors.push('Name must be at least 2 characters');\n}\n\nreturn [{\n  json: {\n    isValid: errors.length === 0,\n    errors: errors,\n    data: body,\n    receivedAt: new Date().toISOString()\n  }\n}];"
          },
          typeVersion: 2
        },
        {
          id: "wh-if-valid",
          name: "Is Payload Valid?",
          type: "n8n-nodes-base.if",
          position: [660, 300],
          parameters: {
            conditions: {
              boolean: [{ value1: "={{ $json.isValid }}", value2: true }]
            }
          },
          typeVersion: 2
        },
        {
          id: "wh-respond-200",
          name: "Respond 200 Success",
          type: "n8n-nodes-base.respondToWebhook",
          position: [920, 200],
          parameters: {
            respondWith: "json",
            responseBody: "={\n  \"success\": true,\n  \"message\": \"Lead successfully recorded\",\n  \"leadName\": \"{{ $('Validate Input Payload').item.json.data.name }}\",\n  \"timestamp\": \"{{ $now.toISO() }}\"\n}",
            options: { responseCode: 200 }
          },
          typeVersion: 1.1
        },
        {
          id: "wh-respond-400",
          name: "Respond 400 Validation Error",
          type: "n8n-nodes-base.respondToWebhook",
          position: [920, 420],
          parameters: {
            respondWith: "json",
            responseBody: "={\n  \"success\": false,\n  \"error\": \"Validation failed\",\n  \"details\": {{ JSON.stringify($('Validate Input Payload').item.json.errors) }}\n}",
            options: { responseCode: 400 }
          },
          typeVersion: 1.1
        }
      ],
      connections: {
        "Webhook Lead Intake": { main: [[{ node: "Validate Input Payload", type: "main", index: 0 }]] },
        "Validate Input Payload": { main: [[{ node: "Is Payload Valid?", type: "main", index: 0 }]] },
        "Is Payload Valid?": {
          main: [
            [{ node: "Respond 200 Success", type: "main", index: 0 }],
            [{ node: "Respond 400 Validation Error", type: "main", index: 0 }]
          ]
        }
      }
    }
  },
  {
    id: 'tpl-starter-6-error-handling-and-retries',
    name: 'Master Error Handling, Try-Catch & Slack Incident Alerts',
    slug: 'error-handling-try-catch-alerts',
    category: 'Tutorials & Essentials',
    complexity: 'Beginner',
    author: {
      name: 'Reliability Engineering Team',
      role: 'SRE & Systems Automation',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    description: 'Learn production error handling patterns: catch failed HTTP calls, log error stack traces, and trigger automated fallback alerts.',
    longDescription: 'Ensure mission-critical automations never silently fail. This workflow teaches you how to configure node error routing ("Continue On Fail"), construct retry logic, format diagnostic crash reports, and alert your on-call engineering team.',
    tags: ['Error Handling', 'Reliability', 'Alerts', 'Try Catch', 'Incident Response', 'Tutorial'],
    nodeCount: 5,
    stars: 1540,
    downloads: 24600,
    featured: false,
    estimatedSetupMinutes: 6,
    useCases: [
      'Catching third-party API rate limits and connection timeouts gracefully',
      'Formatting actionable diagnostic messages for on-call engineers in Slack',
      'Preventing entire batch pipelines from halting when a single record fails'
    ],
    setupSteps: [
      'Inspect the Continue On Fail configuration inside the Flaky API Call node',
      'Add your Slack or Discord webhook URL to receive incident diagnostics',
      'Trigger the test run to see how errors are cleanly caught and handled'
    ],
    requiredCredentials: ['slackApi'],
    documentationMarkdown: `
# Master Workflow Error Handling & Incident Alerts

Learn the best practices for building resilient, fail-safe automation pipelines.
`,
    workflow: {
      name: "Master Error Handling, Try-Catch & Incident Alerts",
      nodes: [
        {
          id: "err-trigger-1",
          name: "Scheduled Health Check",
          type: "n8n-nodes-base.scheduleTrigger",
          position: [180, 300],
          parameters: { rule: { interval: [{ field: "hours", hoursInterval: 1 }] } },
          typeVersion: 1.2
        },
        {
          id: "err-api-flaky",
          name: "External Service API Call",
          type: "n8n-nodes-base.httpRequest",
          position: [420, 300],
          parameters: {
            url: "https://httpbin.org/status/503",
            options: {
              response: { response: { neverError: true } }
            }
          },
          typeVersion: 4.2
        },
        {
          id: "err-check-status",
          name: "Check HTTP Status Code",
          type: "n8n-nodes-base.if",
          position: [660, 300],
          parameters: {
            conditions: {
              number: [{ value1: "={{ $json.statusCode || 200 }}", operation: "gte", value2: 400 }]
            }
          },
          typeVersion: 2
        },
        {
          id: "err-format-alert",
          name: "Format Diagnostic Incident",
          type: "n8n-nodes-base.code",
          position: [900, 200],
          parameters: {
            jsCode: "const item = $input.first().json;\nreturn [{\n  json: {\n    incidentLevel: 'CRITICAL',\n    service: 'Payment Gateway API',\n    statusCode: item.statusCode || 503,\n    timestamp: new Date().toISOString(),\n    message: `Service responded with error code ${item.statusCode || 503}. Automated retries scheduled.`\n  }\n}];"
          },
          typeVersion: 2
        },
        {
          id: "err-send-slack",
          name: "Send Incident Alert",
          type: "n8n-nodes-base.slack",
          position: [1140, 200],
          parameters: {
            channel: "#alerts-automation",
            text: "🚨 *Automated Incident Alert*\n*Service:* {{ $json.service }}\n*Status:* {{ $json.statusCode }}\n*Details:* {{ $json.message }}"
          },
          typeVersion: 2.2
        }
      ],
      connections: {
        "Scheduled Health Check": { main: [[{ node: "External Service API Call", type: "main", index: 0 }]] },
        "External Service API Call": { main: [[{ node: "Check HTTP Status Code", type: "main", index: 0 }]] },
        "Check HTTP Status Code": {
          main: [
            [{ node: "Format Diagnostic Incident", type: "main", index: 0 }],
            []
          ]
        },
        "Format Diagnostic Incident": { main: [[{ node: "Send Incident Alert", type: "main", index: 0 }]] }
      }
    }
  }
];
