import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { validateWonderlandKey } from './wonderland-keys';
import { callModel, callModelStreaming } from './providers/registry';
import templateRouter from './template-library';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    const isSameOrigin = !origin;
    const isAllowed = allowedOrigins.length === 0
      ? isSameOrigin
      : isSameOrigin || allowedOrigins.includes(origin);
    cb(null, isAllowed);
  },
  allowedHeaders: ['Content-Type', 'x-wonderland-key'],
}));

const distPath = path.resolve(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Stripe webhook — only mount if Stripe key is configured
if (process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY) {
  const { default: stripeWebhook } = await import('./stripe-webhook');
  app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
}

app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

// Register the limiter BEFORE the router so it actually runs for matched routes.
app.use('/api/templates', apiLimiter);
app.use('/api/templates', templateRouter);

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

const streamLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

function validateChatBody(body: any): { ok: boolean; error?: string } {
  const { model, messages } = body || {};
  if (typeof model !== 'string' || !model.trim()) {
    return { ok: false, error: 'Missing required field: model' };
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: 'Missing required field: messages (non-empty array)' };
  }
  for (const msg of messages) {
    if (
      !msg || typeof msg !== 'object' ||
      typeof msg.content !== 'string' ||
      (msg.role !== 'user' && msg.role !== 'assistant' && msg.role !== 'system')
    ) {
      return { ok: false, error: 'Each message must be { role: "user"|"assistant"|"system", content: string }' };
    }
  }
  return { ok: true };
}

app.post('/api/chat', chatLimiter, async (req, res) => {
  const { model, messages, config, wonderlandKey } = req.body;

  const validation = validateChatBody(req.body);
  if (!validation.ok) {
    res.status(400).json({ error: validation.error });
    return;
  }

  if (!wonderlandKey) {
    res.status(401).json({ error: 'Missing Wonderland key. Provide wonderlandKey in request body.' });
    return;
  }

  if (!validateWonderlandKey(wonderlandKey)) {
    res.status(403).json({ error: 'Invalid Wonderland key.' });
    return;
  }

  try {
    const result = await callModel(model, messages, config || {});
    res.json(result);
  } catch (err: any) {
    console.error(`/api/chat error for model ${model}:`, err.message);
    res.status(502).json({ error: err.message || 'Upstream provider error.' });
  }
});

app.post('/api/chat/stream', streamLimiter, async (req, res) => {
  const { model, messages, config, wonderlandKey } = req.body;

  const validation = validateChatBody(req.body);
  if (!validation.ok) {
    res.status(400).json({ error: validation.error });
    return;
  }

  if (!wonderlandKey) {
    res.status(401).json({ error: 'Missing Wonderland key.' });
    return;
  }

  if (!validateWonderlandKey(wonderlandKey)) {
    res.status(403).json({ error: 'Invalid Wonderland key.' });
    return;
  }

  try {
    const providerResponse = await callModelStreaming(model, messages, config || {});

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const reader = providerResponse.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value));
    }
    res.end();
  } catch (err: any) {
    console.error(`/api/chat/stream error for model ${model}:`, err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: err.message || 'Upstream provider error.' });
    } else {
      res.end();
    }
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Unknown API paths get a JSON 404 (the SPA fallback below is for client routes only).
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.get('/*splat', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  // An unhandled rejection leaves the process in an unknown state — fail fast in production.
  if (process.env.NODE_ENV === 'production') process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Wonderland proxy server running on port ${PORT}`);
});
