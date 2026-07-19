<div align="center">
  <br/>
  <img src="https://img.shields.io/badge/status-active-success.svg" alt="Status">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <br/><br/>
</div>

# AI-WONDERLAND — Multi-Agent Playground Hub

A professional-grade, multi-agent AI playground for testing, comparing, and orchestrating large language models side-by-side in real time. Built with React 19, Vite, TypeScript, and Express.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Run Locally](#run-locally)
- [Project Structure](#project-structure)
- [Usage](#usage)
  - [Multi-Agent Chat](#multi-agent-chat)
  - [Models Catalog](#models-catalog)
  - [AI-WONDER Canvas](#ai-wonder-canvas)
  - [Project Memory Core](#project-memory-core)
  - [Analytics & Usage Tracking](#analytics--usage-tracking)
  - [API Keys & Provider Management](#api-keys--provider-management)
- [Backend API](#backend-api)
- [Supabase Schema](#supabase-schema)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

AI-WONDERLAND is a unified interface for interacting with dozens of AI models from multiple providers — including Google Gemini, OpenAI, Anthropic Claude, Meta Llama, Mistral, DeepSeek, Grok, and many more. It features a **multi-agent chat panel** where up to 8 agents can be run side by side, each with independent model selection, system instructions, and generation parameters.

The platform also includes:
- An **AI-WONDER Canvas** for orchestrating workflows and visualizing the agent ecosystem.
- A **Project Memory Core** that persists architectural decisions, bug reports, and design patterns.
- Real-time **analytics and usage tracking** integrated with Supabase.
- A **models catalog** with directory and infrastructure views.
- **Stripe subscription** integration for billing.

---

## Features

| Capability | Description |
|---|---|
| **Multi-Agent Chat** | Run up to 8 AI agents simultaneously side-by-side with decoupled prompt states. |
| **Model Diversity** | 50+ models across Gemini, GPT, Claude, Llama, Mistral, DeepSeek, Grok, image gen, audio, video, and embedding providers. |
| **Customizable Agents** | Configure system instructions, temperature, top-p, top-k, and max output tokens per agent. |
| **Real-time Streaming** | Server-sent events (SSE) for streaming model responses. |
| **Project Memory** | Persistent memory nodes (decisions, bugs, patterns, context, files, notes) that sync into agent system prompts automatically. |
| **Nexus Telemetry** | Live event feed showing JS errors, network failures, missing assets, and other diagnostics. |
| **AI-WONDER Canvas** | Visual orchestration layer combining memory management, telemetry, and agent oversight. |
| **Supabase Sync** | Agents, profiles, usage logs, and subscriptions persisted and synced in real time via Supabase. |
| **Analytics Dashboard** | Track token usage, costs, request counts, and model performance over time. |
| **Secure Backend Proxy** | Express server with Wonderland key authentication routes all provider API calls. |
| **Stripe Billing** | Subscription management through Stripe webhooks. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS 4, Motion |
| **3D / Canvas** | React Three Fiber, Drei, Three.js |
| **Backend** | Express 5, TypeScript (tsx) |
| **Database** | Supabase (PostgreSQL + Auth + Realtime) |
| **Payment** | Stripe |
| **AI Providers** | Google Gemini API, OpenAI, Anthropic, and many more via a unified registry |
| **Deployment** | Vite build, Node.js server (PM2 ecosystem.config.cjs) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- A [Supabase](https://supabase.com/) project (for auth, agent sync, and usage tracking)
- A [Gemini API key](https://aistudio.google.com/apikey) (or other provider keys)
- A **[Wonderland Key](#environment-variables)** for backend API access
- (Optional) A [Stripe](https://stripe.com/) account for subscription billing

### Installation

```bash
git clone <repo-url>
cd AI-PLAYGROUND
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Required: Gemini API key for Google AI provider
GEMINI_API_KEY=your_gemini_api_key

# Required: Wonderland master key for backend API authentication
WONDERLAND_MASTER_KEY=your_master_key

# Required: Supabase credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Additional provider keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
# ... add any other provider keys your agents need

# Optional: Stripe keys (for subscription billing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

> **Note:** The `.env.example` file in the root provides a template.

### Run Locally

```bash
# Start the frontend dev server (port 3000)
npm run dev

# In a separate terminal, start the backend proxy server (port 3001)
npm run server
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
AI-PLAYGROUND/
├── src/                        # Frontend source
│   ├── App.tsx                 # Main application with routing & state
│   ├── main.tsx                # Entry point
│   ├── types.ts                # TypeScript type definitions
│   ├── utils.ts                # Utility functions
│   ├── index.css               # Global styles (Tailwind)
│   ├── components/             # React components
│   │   ├── Playground.tsx      # Multi-agent chat interface
│   │   ├── Sidebar.tsx         # Agent module sidebar
│   │   ├── ModelsCatalog.tsx   # Model directory & infrastructure views
│   │   ├── AIWonderCanvas.tsx  # Orchestration canvas
│   │   ├── ApiKeysModal.tsx    # API key configuration modal
│   │   ├── SettingsView.tsx    # Global settings panel
│   │   ├── AnalyticsView.tsx   # Usage analytics dashboard
│   │   ├── ActivityView.tsx    # Recent activity feed
│   │   ├── ApiKeysView.tsx     # API key management view
│   │   ├── PresetsView.tsx     # Agent presets management
│   │   ├── ProvidersView.tsx   # Provider infrastructure view
│   │   ├── RobotScene.tsx      # 3D robot visualization (Three.js)
│   │   ├── AgentCompiler.tsx   # Agent compiler workflow
│   │   ├── TrainingSetCompiler.tsx # Training data compiler
│   │   └── ResponseView.tsx    # Model response renderer
│   ├── hooks/
│   │   ├── useRealtimeSync.ts  # Supabase real-time sync hook
│   │   └── useRealtimeUsage.ts # Real-time usage tracking hook
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client & auth helpers
│   │   ├── usageTracker.ts     # Token usage tracking
│   │   └── providers/          # Frontend provider integrations
│   ├── data/                   # Static data files
│   └── utils/                  # Additional utilities
├── server/                     # Backend proxy server
│   ├── index.ts                # Express server entry (routes: /api/chat, /api/chat/stream, /api/health)
│   ├── providers/
│   │   ├── registry.ts         # Unified model provider registry
│   │   └── types.ts            # Provider type definitions
│   ├── wonderland-keys.ts      # Wonderland key validation
│   ├── supabase-admin.ts       # Supabase admin client
│   └── stripe-webhook.ts       # Stripe webhook handler
├── supabase-schema.sql         # Full Supabase database schema
├── ecosystem.config.cjs        # PM2 process management config
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
└── package.json
```

---

## Usage

### Multi-Agent Chat

The core feature is the **Fusion/Chat** tab. You are presented with 8 default agents, each named and configured with a distinct model and system instruction:

| Agent | Default Model | Role |
|---|---|---|
| **Alice** | Gemini 3 Flash Preview | Precise, direct assistant |
| **Simple Rick** | Gemini 3.1 Pro Preview | Code generation specialist |
| **Neo** | GPT-4o | Creative strategist |
| **Atlas** | Claude 3.5 Sonnet | Code reviewer & architect |
| **Sage** | DeepSeek V3 | Technical documentation |
| **Echo** | Llama 4 Scout | Data analyst |
| **Nova** | Mistral Large 3 | Product manager |
| **Cipher** | Grok 3 | Security & DevOps |

- Click an agent in the sidebar to select it.
- Use the agent config panel to change model, system instruction, temperature, top-p, top-k, and max tokens.
- Add new agents with the **+** button; remove with the **×** button.
- Each agent maintains its own independent conversation history.

### Models Catalog

The **Home/Models** tab provides two views:
- **Directory** — Browse and search the full catalog of 50+ models across text, image, audio, video, and embedding categories.
- **Infrastructure** — View the underlying provider infrastructure and routing.

Click any model to assign it to the currently active agent and switch to the playground.

### AI-WONDER Canvas

The **AI-WONDER** tab is an orchestration and visualization layer that combines:
- **Project Memory** — View, add, edit, import, and delete memory nodes (decisions, bugs, patterns, etc.).
- **Nexus Telemetry** — Live event feed of errors, warnings, and informational messages.
- **Agent Grid** — Visual overview of all active agents.
- **3D Robot Visualization** — Interactive Three.js robot scene rendered via React Three Fiber.

### Project Memory Core

Memory nodes are automatically injected into each agent's system instruction to maintain context awareness across sessions. Memory types:
- **decision** — Architectural decisions
- **bug** — Bug reports and fixes
- **pattern** — Design patterns and best practices
- **context** — General context notes
- **file** — File references
- **note** — General notes

Memories are persisted to `localStorage` (capped at 500) and can be synced to Supabase.

### Analytics & Usage Tracking

The **Analytics** tab provides:
- Total token usage (prompt + completion)
- Cost tracking across models
- Request counts over time (1h, 24h, 7d, 30d)
- Model-specific breakdowns

Data is collected via `useRealtimeUsage` and stored in the `usage_logs` Supabase table.

### API Keys & Provider Management

- **API Keys** tab — Manage your provider API keys (Gemini, OpenAI, Anthropic, etc.).
- **Presets** tab — Save and load agent configuration presets.
- **Providers** tab — View the provider infrastructure routing table.

---

## Backend API

The Express server (`server/index.ts`) acts as a unified proxy for all model providers.

### Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/chat` | Non-streaming chat completion |
| `POST` | `/api/chat/stream` | Streaming chat completion (SSE) |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/stripe/webhook` | Stripe webhook handler |

### Request Format

```json
{
  "model": "gemini-3-flash-preview",
  "messages": [{ "role": "user", "content": "Hello" }],
  "config": {
    "temperature": 0.7,
    "topP": 0.9,
    "topK": 40,
    "maxOutputTokens": 8192
  },
  "wonderlandKey": "your-wonderland-key"
}
```

### Authentication

All `/api/chat` and `/api/chat/stream` requests require a valid `wonderlandKey` in the request body. This is validated against the `WONDERLAND_MASTER_KEY` environment variable on the server.

---

## Supabase Schema

Run the full migration in `supabase-schema.sql` against your Supabase project to create:

- `public.profiles` — User profile data, linked to `auth.users`
- `public.agents` — Agent configurations per user
- `public.usage_logs` — Token usage and cost tracking
- `public.subscriptions` — Stripe subscription records

All tables use **Row Level Security (RLS)** to ensure users can only access their own data.

---

## Deployment

### Build for Production

```bash
npm run build     # Builds frontend to dist/
```

### Run with PM2

The project includes an `ecosystem.config.cjs` for PM2 process management:

```bash
pm2 start ecosystem.config.cjs
```

This will run both the Vite dev server and the Express backend.

### Environment Variables for Production

Ensure all environment variables are set on your hosting platform (Vercel, Railway, Fly.io, etc.). The backend requires `WONDERLAND_MASTER_KEY` and `GEMINI_API_KEY` at minimum.

---

## License

This project is licensed under the MIT License.
