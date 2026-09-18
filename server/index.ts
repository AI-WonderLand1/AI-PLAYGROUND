import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { validateWonderlandKey } from './wonderland-keys';
import { callModel, callModelStreaming } from './providers/registry';
import { addConversationMemory, injectMemoryContext, isMem0Configured, searchMemories } from './mem0';
import { getSupabaseUserId, resolveMemoryUserId } from './memory-identity';
import templateRouter from './template-library';
import agentVaultRouter from './agent-vault';

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
  allowedHeaders: ['Content-Type', 'Authorization', 'x-wonderland-key'],
}));

const distPath = path.resolve(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Stripe webhook — only mount if Stripe key is configured
if (process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY) {
  const { default: stripeWebhook } = await import('./stripe-webhook');
  app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
}

app.use(express.json({ limit: '1mb' }));

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
  if (messages.length > 100) {
    return { ok: false, error: 'Too many messages.' };
  }
  for (const msg of messages) {
    if (
      !msg || typeof msg !== 'object' ||
      typeof msg.content !== 'string' ||
      msg.content.length > 50000 ||
      (msg.role !== 'user' && msg.role !== 'assistant' && msg.role !== 'system')
    ) {
      return { ok: false, error: 'Each message must be { role: "user"|"assistant"|"system", content: string } with content under 50,000 characters' };
    }
  }
  return { ok: true };
}

async function authenticateChatRequest(
  req: express.Request,
  wonderlandKey: unknown,
): Promise<{ ok: true; memoryUserId: string } | { ok: false; status: number; error: string }> {
  const supabaseUserId = await getSupabaseUserId(req);
  if (supabaseUserId) {
    return { ok: true, memoryUserId: supabaseUserId };
  }

  if (typeof wonderlandKey !== 'string' || !wonderlandKey) {
    return { ok: false, status: 401, error: 'Authenticate with a Supabase bearer token or Wonderland key.' };
  }

  if (!validateWonderlandKey(wonderlandKey)) {
    return { ok: false, status: 403, error: 'Invalid Wonderland key.' };
  }

  const memoryUserId = await resolveMemoryUserId(req, wonderlandKey);
  if (!memoryUserId) {
    return { ok: false, status: 401, error: 'Unable to resolve authenticated identity.' };
  }

  return { ok: true, memoryUserId };
}

async function prepareMemoryContext(memoryUserId: string, messages: any[]) {
  const lastUserMessage = [...messages].reverse().find(message => message.role === 'user');

  if (!lastUserMessage || !isMem0Configured()) {
    return { lastUserMessage, modelMessages: messages };
  }

  const memories = await searchMemories(memoryUserId, lastUserMessage.content);
  return {
    lastUserMessage,
    modelMessages: injectMemoryContext(messages, memories),
  };
}

app.post('/api/chat', chatLimiter, async (req, res) => {
  const { model, messages, config, wonderlandKey } = req.body;

  const validation = validateChatBody(req.body);
  if (!validation.ok) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const auth = await authenticateChatRequest(req, wonderlandKey);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  try {
    const { lastUserMessage, modelMessages } = await prepareMemoryContext(auth.memoryUserId, messages);
    const result = await callModel(model, modelMessages, config || {});

    if (lastUserMessage && typeof result.content === 'string' && result.content.trim()) {
      void addConversationMemory(auth.memoryUserId, [
        { role: 'user', content: lastUserMessage.content },
        { role: 'assistant', content: result.content },
      ]);
    }

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

  const auth = await authenticateChatRequest(req, wonderlandKey);
  if (!auth.ok) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  try {
    const { lastUserMessage, modelMessages } = await prepareMemoryContext(auth.memoryUserId, messages);
    const providerResponse = await callModelStreaming(model, modelMessages, config || {});

    // Streaming provider formats differ, so store the user turn immediately and
    // let Mem0 extract durable facts from it without buffering or exposing the stream.
    if (lastUserMessage) {
      void addConversationMemory(auth.memoryUserId, [
        { role: 'user', content: lastUserMessage.content },
      ]);
    }

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
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    memory: { mem0Configured: isMem0Configured() },
  });
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
