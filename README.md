# AI-PLAYGROUND

AI-PLAYGROUND is the AI Wonderland workflow and multi-model experimentation application. It is intentionally separate from DreamMakerHub's website/world-building surfaces and from NPC-AI-SIM's NPC cognition editor.

## Repository role

AI-PLAYGROUND owns:

- multi-model AI chat and comparison
- visual AI/workflow orchestration
- reusable workflow templates
- provider routing through the Express backend
- usage and project-oriented AI experimentation surfaces

It does not own NPC brain authoring or the main DreamMakerHub website/3D builder.

## Current architecture

```text
Browser / React + Vite
        ↓
Express API
        ↓
Wonderland key validation
        ↓
Provider registry
        ↓
AI providers
```

The main backend chat routes are:

| Route | Purpose |
|---|---|
| `POST /api/chat` | non-streaming provider call |
| `POST /api/chat/stream` | streaming provider call |
| `GET /api/health` | service health check |
| `/api/templates/*` | workflow/template API |

The chat routes validate a Wonderland key and are rate-limited before provider calls are made.

## Tech stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Express 5
- Supabase
- Three.js / React Three Fiber
- Stripe

## Local development

### Recommended runtime

The production workflow currently verifies builds with Node.js 22.

### Install

```bash
git clone https://github.com/AI-WonderLand1/AI-PLAYGROUND.git
cd AI-PLAYGROUND
npm install
cp .env.example .env
```

Configure the services you intend to use.

### Start the frontend

```bash
npm run dev
```

The Vite development server runs on port 3000.

### Start the backend

In a second terminal:

```bash
npm run server
```

The Express API runs on port 3001 by default.

### Verify a change

```bash
npm run lint
npm run build
```

`npm run lint` currently performs a TypeScript no-emit check. A full automated unit/integration test suite is not yet defined in `package.json`.

## Environment configuration

See [`.env.example`](.env.example) for the current configuration inventory.

The preferred production path is to keep provider credentials on the server and route model requests through the Express provider registry.

Some older/provider-specific client utilities still exist in the codebase. Do not place long-lived production credentials in browser code or browser-readable configuration.

## Production deployment

The current production deployment is handled by GitHub Actions and UpCloud:

```text
main
  ↓
verify build
  ↓
SSH to UpCloud
  ↓
sync repository
  ↓
install + build
  ↓
systemd service on port 3001
  ↓
nginx
  ↓
playground.dreammakerhub.website
```

See [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) for the active deployment workflow.

The workflow performs both internal service checks and an nginx/front-end verification before reporting success.

## Security model

The Express server currently provides:

- Wonderland-key validation for the main chat routes
- request-body validation
- rate limiting for chat, streaming chat, and templates
- configurable CORS origins
- server-side provider routing

Security work is still ongoing. Client-side provider integrations should be migrated behind authenticated server routes before they are treated as production-safe.

See [`SECURITY.md`](SECURITY.md) for vulnerability reporting.

## Repository organization

Runtime code remains at the top-level application structure. Planning/review documents belong under `docs/`, and reusable/example workflow JSON belongs under `workflows/` rather than being scattered through the runtime root.

## Related repositories

- `dreammakerhub.website` — umbrella platform, projects, WonderBuild, IDE integration, and main world/3D tooling
- `NPC-AI-SIM` — NPC cognition authoring, memory, perception, personality, actions, and runtime contracts

## License

Prosperity Public License 3.0.0. See [`LICENSE`](LICENSE) for the full terms.

## SUPPORT 
support@dreammakerhub.website

## [![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Y8Y61YK1ZX)
