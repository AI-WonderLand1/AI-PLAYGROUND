<div align="center">

# AI-WONDERLAND

**[https://dreammakerhub.website](https://dreammakerhub.website)**

A multi-agent AI playground: run up to 8 models side-by-side, orchestrate workflows on a visual canvas, and track everything in one hub.

</div>

---

## Features

- **Multi-Agent Chat** — compare Gemini, GPT, Claude, Llama, DeepSeek, Grok and more, side-by-side
- **AI-WONDER Canvas** — visual workflow builder with triggers, code, HTTP, and AI agent nodes
- **Template Library** — import production-ready n8n workflow templates straight onto the canvas
- **Project Memory Core** — persistent memory nodes injected into agent system prompts
- **Analytics** — token usage, cost tracking, and request counts in real time
- **Secure Proxy Backend** — provider keys stay server-side; requests authenticated via Wonderland keys

## Tech Stack

React 19 · TypeScript · Vite · Tailwind CSS · Three.js · Express · Supabase · Stripe

## Getting Started

```bash
git clone <repo-url>
cd AI-PLAYGROUND
npm install
```

Create a `.env.local` (see `.env.example` for all options):

```env
GEMINI_API_KEY=your_key
WONDERLAND_KEYS=your_master_key      # required, backend auth
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

Run it:

```bash
npm run dev        # frontend → http://localhost:3000
npm run server     # backend proxy → port 3001
```

## Production

```bash
npm run build      # builds frontend to dist/
```

Deploy anywhere Node runs — `railway.json` is included for one-click Railway deploys, or use `pm2 start ecosystem.config.cjs`. Run `supabase-schema.sql` against your Supabase project first.

## Security

See [SECURITY.md](SECURITY.md) to report a vulnerability privately.


## License

Prosperity Public License 3.0.0. See [`LICENSE`](LICENSE) for the full terms.
