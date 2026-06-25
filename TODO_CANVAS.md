# AI-Wonder Canvas — n8n Feature Gap Plan

> Goal: Turn the mock workflow editor into a real automation platform with actual
> execution, real HTTP calls, code nodes, conditional logic, and AI agent support.

---

## Phase 1: Real Execution (Foundation)

### [ ] Real HTTP Request node
- **Files:** `AIWonderCanvas.tsx`, `NodeDetailView.tsx`
- Add "HTTP Request" node type to the add-panel
- Config fields: URL, method (GET/POST/PUT/DELETE/PATCH), headers (key/value pairs),
  body (JSON/text), authentication (none/basic/bearer)
- On workflow execution, actually perform `fetch()` with the configured parameters
- Show response status, headers, and body in the node output inspector
- Handle errors: timeout, network failure, non-2xx status
- **Effort:** Large (~3hr)

### [ ] Real AI execution (wire to OpenRouter/LLM)
- **Files:** `AIWonderCanvas.tsx`, `Playground.tsx` (shared types)
- Replace mock AI agent node with real LLM call via OpenRouter
- Config fields: model selector, system prompt, temperature, max tokens
- On execution, call OpenRouter API and display real response
- Add streaming support for AI agent node output
- Show token usage and cost per AI node execution
- **Effort:** Large (~3hr)

### [ ] Code node (JS sandbox)
- **Files:** `AIWonderCanvas.tsx`
- Add "Code" node type to the add-panel
- Config: JavaScript editor (monaco or CodeMirror) with syntax highlighting
- Pre-defined input/output variables: `$input`, `$output`
- Execute code in a safe sandbox (iframe + postMessage or `new Function()`)
- Support basic Node.js-like helpers: `JSON.parse/stringify`, `Math`, `Date`
- Show console output, errors, and return value in inspector
- **Effort:** Large (~4hr)

### [ ] Node input/output inspector
- **Files:** `AIWonderCanvas.tsx`, `NodeDetailView.tsx`
- Click any node to see the actual data that entered and exited it
- Three panes: Input JSON, Output JSON, Execution log
- JSON viewer with collapsible tree (syntax highlighting)
- Show timestamps, duration, and status for each execution
- Allow re-running a single node without running the full workflow
- **Effort:** Medium (~2hr)

---

## Phase 2: Flow Control

### [ ] Conditional branching (IF/Switch)
- **Files:** `AIWonderCanvas.tsx`
- Add "IF" node type with condition builder
- Support comparisons: equals, not equals, greater than, less than, contains,
  starts with, regex match
- Compare against: static value, another node's output, expression
- Two output branches: "True" and "False"
- Add "Switch" node for multi-way branching (multiple cases + default)
- Render multiple outputs on the canvas as separate pin connections
- **Effort:** Large (~3hr)

### [ ] Error handling + retry logic
- **Files:** `AIWonderCanvas.tsx`
- Add error state to node execution: success / warning / error
- Per-node retry config: max retries (0-5), delay between retries (ms)
- "Continue on error" toggle — workflow proceeds even if node fails
- Error trigger node: executes a separate error-handling sub-path
- Show error messages and stack traces in the output inspector
- **Effort:** Medium (~2hr)

### [ ] Loops (for/while)
- **Files:** `AIWonderCanvas.tsx`
- Add "Loop" node type
- Config: iterate over list (from input), or while condition is true
- Expose `$index`, `$value`, `$items` inside loop body
- Limit: max iterations (safety cap at 1000)
- Render loop body nodes as a contained area on the canvas
- **Effort:** Large (~3hr)

### [ ] Merge / split data nodes
- **Files:** `AIWonderCanvas.tsx`
- Add "Merge" node: combine multiple input streams into one
  - Modes: combine (append arrays), intersect (common items), zip (pair items)
- Add "Split" node: divide a list into individual items (one output per item)
- Add "Aggregate" node: combine items back into a list
- Useful for fan-out/fan-in patterns
- **Effort:** Medium (~2hr)

---

## Phase 3: Integrations & Triggers

### [ ] Real webhook trigger
- **Files:** `AIWonderCanvas.tsx`, `App.tsx`
- Generate a real unique URL per workflow: `POST /api/webhooks/{workflowId}`
- Use a simple Express/Node endpoint or serverless function to receive requests
- Parse request body, headers, query params and pass as node input
- Show webhook URL in the trigger node config with copy button
- Test with curl/Postman directly from the UI
- **Effort:** Large (~4hr, depends on backend)

### [ ] Scheduled / cron triggers
- **Files:** `AIWonderCanvas.tsx`
- Add "Schedule" trigger node type
- Config: interval (every X minutes/hours/days) or cron expression
- Use `setInterval` or `cron-parser` in browser (or lightweight backend)
- Show next 5 execution times in the config panel
- Enable/disable schedule toggle
- **Effort:** Medium (~2hr)

### [ ] Credentials vault
- **Files:** `new src/components/CredentialsVault.tsx`, `AIWonderCanvas.tsx`
- Tab in the left sidebar for managing credentials
- Credential types: API Key (bearer), Basic Auth (username/password),
  OAuth2 (client ID + secret)
- Store encrypted in localStorage (at minimum base64 encoded)
- Reference credentials in nodes via `$credentials.my_key`
- Never expose credential values in the output inspector
- **Effort:** Medium (~2hr)

### [ ] Workflow templates (5–10 starter templates)
- **Files:** `new src/data/workflowTemplates.ts`, `AIWonderCanvas.tsx`
- Create pre-built workflow templates:
  1. Webhook → Log to console (hello world)
  2. Schedule → HTTP GET → Email summary
  3. Webhook → AI analyze → Conditional route
  4. Webhook → Code transform → HTTP POST response
  5. Schedule → AI summarize → Post to webhook
- Add "Import Template" button in the workflows sidebar
- Show template gallery with name, description, node count
- **Effort:** Small (~1hr)

---

## Phase 4: Advanced AI & Production

### [ ] Multi-agent orchestration
- **Files:** `AIWonderCanvas.tsx`, `types.ts`
- Multiple AI agent nodes can communicate via connections
- Add "Agent Handoff" node: passes conversation context to another agent
- Add "Tool" node types that AI agents can invoke:
  - HTTP Request tool, Code tool, Knowledge Search tool
- AI agent config: list of available tools, max iterations, memory type
- Show agent reasoning trace in the output inspector (thought/action/observation)
- **Effort:** Very Large (~6hr)

### [ ] Human-in-the-loop approvals
- **Files:** `AIWonderCanvas.tsx`
- Add "Approval" node type
- Pauses execution and sends notification (in-app toast/notification)
- Config: approval prompt, timeout duration, auto-reject after timeout
- Two output branches: "Approved" and "Rejected"
- Show pending approvals count in the sidebar
- **Effort:** Medium (~2hr)

### [ ] Expressions / templating engine
- **Files:** `AIWonderCanvas.tsx`, `expressionParser.ts`
- Support expressions in any node config field: `{{ $node["HTTP"].data }}`
- Expression functions: `$json`, `$items`, `$index`, `$now`, `$today`, `$jmespath`
- Auto-suggest / autocomplete expression editor
- Parse expressions at runtime and substitute actual values
- Show expression evaluation result in the config UI (preview)
- **Effort:** Large (~4hr)

### [ ] Sub-workflows
- **Files:** `AIWonderCanvas.tsx`, `App.tsx`
- Allow a node to reference and call another saved workflow
- Pass input data and receive output data from the sub-workflow
- Show sub-workflow as a nested container or referenced node
- Track nested execution in the log trace
- **Effort:** Large (~4hr)

### [ ] Workflow versioning
- **Files:** `AIWonderCanvas.tsx`
- Save workflow snapshots on each "Save"
- Show version history panel with timestamps
- Allow diff between versions (nodes added/removed, config changes)
- Restore to a previous version
- Auto-save draft every 30 seconds
- **Effort:** Medium (~2hr)

### [ ] AI-powered workflow generation
- **Files:** `new src/components/WorkflowGenerator.tsx`
- Text input: "Describe the workflow you want to build"
- Send description to Gemini/OpenRouter with a system prompt that generates
  a JSON workflow definition
- Parse the response and render nodes on the canvas
- User can then tweak, rearrange, and refine
- Start with simple patterns: webhook → AI → response
- **Effort:** Large (~4hr)
