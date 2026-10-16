# AI-PLAYGROUND User Guide

AI-PLAYGROUND is the AI WONDERLAND multi-model, agent, and workflow application. This guide explains the visible navigation, the main buttons, outside services, and what this repository can and cannot do.

## Sign in

The app uses the AI WONDERLAND/Supabase account session. Enter your email and password on the Wonderland Access screen, then choose Initialize Session.

## Main navigation

| Item | What it does |
| --- | --- |
| Home | Opens the main AI WONDERLAND homepage. |
| Dashboard | Opens the main AI WONDERLAND dashboard. |
| Models | Opens the model directory/catalog. |
| Fusion | Opens the Playground chat surface in the Fusion entry state. |
| Chat | Opens the active multi-agent/model chat. |
| AI-Wonder | Opens the visual AI workflow canvas. |
| Docs | Opens Playground documentation/help content. |
| Activity | Opens recent Playground activity. |
| Analytics | Opens usage/analytics views available in the app. |
| API Keys | Opens provider/key-related controls. Prefer the encrypted server vault for long-lived credentials. |
| Presets | Opens reusable presets. |
| Templates | Opens workflow/template choices. |
| Workflows | Opens saved or imported workflow work. |
| Providers | Opens provider/model infrastructure information and account provider settings. |
| Settings | Opens Playground settings. |

Use the top search box or Ctrl/Cmd + K for quick navigation. Search suggestions can jump directly to the model catalog or chat.

## Models

The Models view is the model directory. Use it to inspect available model metadata and select a model for the active Playground module. Selecting a model can move you into Chat with that model assigned to the active agent/module.

Model availability is not the same as provider availability. A model still needs a configured provider route or credential.

## Chat / Playground

Chat uses the active module/agent configuration. The normal flow is:

1. Pick or create an agent/module.
2. Choose a model.
3. Make sure the required provider access is configured.
4. Enter a prompt.
5. Send the message and review the provider response.

The main backend exposes non-streaming and streaming chat routes. Requests are validated and rate-limited before provider calls.

## AI-Wonder visual canvas

AI-Wonder is the visual workflow/orchestration surface. Its sidebar can expose:

| Area | Purpose |
| --- | --- |
| Workflows | Build and manage node-based AI workflows. |
| Memory Core | Inspect/use workflow memory features. |
| Credentials | Select credential records without exposing raw values in workflow output. |
| Executions | Review workflow execution information when available. |
| Variables | Manage workflow variables. |
| Insights | Inspect workflow/runtime information. |
| Versions | Work with workflow versions when available. |

Workflow templates can be loaded into the canvas. Imported/exported workflow data should not contain raw credentials.

## Agent Library / node builder

The Agent Library uses a three-step flow:

1. Choose node or preset.
2. Configure the agent.
3. Test and save.

Important buttons:

| Button | What it does |
| --- | --- |
| Configure | Opens the selected agent template for editing. |
| Add key | Opens the encrypted credential form. |
| Store encrypted key | Sends the provider key to the server vault. The raw value is not returned after storage. |
| Delete key | Removes the selected stored credential after confirmation. |
| Continue | Moves from configuration to the real provider test. |
| Run real test | Calls the selected provider/model with the saved credential. |
| Publish to Playground | Saves a tested agent configuration to the signed-in account. It does not deploy an unattended worker. |
| Open Playground | Returns to the main Playground after saving. |

Supported credential types in the current agent vault are OpenRouter, OpenAI, Anthropic, and Wonderland access keys.

## Templates and n8n compatibility

The repository contains reusable AI/workflow templates, including n8n-oriented examples and converters. Template metadata can describe integrations such as Google Drive, Google Sheets, Gmail, Outlook, vector databases, webhooks, and other APIs.

A template mentioning a service does not mean that service is automatically connected. Credentials and OAuth connections still need to be configured in the environment or downstream workflow system.

## Outside services

| Service | What it is used for |
| --- | --- |
| Supabase | Sign-in, saved agents/workflows, realtime-backed data. |
| dreammakerhub.website | Central account/provider catalog and AI usage/billing authority. |
| OpenRouter | Major multi-model routing option and supported vault provider. |
| OpenAI | Optional model provider and supported vault provider. |
| Anthropic | Optional model provider and supported vault provider. |
| Gemini / Google AI | Built-in provider route when configured. |
| Groq | Optional server-side model provider. |
| Mistral | Optional server-side model provider. |
| Cohere | Optional server-side model provider. |
| Together | Optional server-side model provider. |
| Fireworks | Optional server-side model provider. |
| DeepSeek | Optional server-side model provider. |
| Perplexity | Optional server-side model provider. |
| xAI | Optional server-side model provider. |
| Replicate | Optional server-side model provider. |
| Hugging Face | Optional server-side model provider. |
| Mem0 | Optional server-side persistent AI memory. |
| n8n | Workflow/template compatibility and automation handoff when configured. |
| Stripe | Legacy local webhook support is disabled by default; customer subscriptions belong to the main AI WONDERLAND site. |

## Billing and usage

AI-PLAYGROUND does not own a separate customer subscription. Provider-backed AI usage is reserved against the signed-in AI WONDERLAND account through the central billing contract.

## What this repository can do

- browse/select AI models
- run model-backed chat
- create and save agents
- store supported provider keys in a server-side encrypted vault
- test an agent against a real provider before saving it
- build visual AI workflows
- use/import workflow templates
- keep saved agents/workflows in Supabase-backed account data
- route supported model calls through the Express provider registry

## What this repository does not own

- WonderBuild website editing
- WonderSpace/Coder workspace provisioning
- the main WonderPlay 3D studio
- NPC cognition authoring
- AI WONDERLAND memberships or separate token billing

Those capabilities belong to the other AI WONDERLAND repositories and are connected through the shared account, provider, and billing contracts.

## Safety for API keys

Keep long-lived provider credentials server-side. Use the encrypted credential vault for supported agent keys. Do not paste secrets into workflow JSON, prompts, browser localStorage, or public repository files.