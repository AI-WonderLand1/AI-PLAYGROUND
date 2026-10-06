import type { Request } from 'express';
import type { ChatConfig, ChatMessage } from './providers/types';

export type AiCostClass = 'standard' | 'enhanced' | 'premium' | 'frontier';

export class CentralBillingError extends Error {
  constructor(message: string, public readonly status = 503) {
    super(message);
    this.name = 'CentralBillingError';
  }
}

function billingEndpoint(): URL {
  const raw = process.env.DREAMMAKERHUB_BILLING_URL?.trim() || '';
  if (!raw) throw new CentralBillingError('Central AI WONDERLAND billing is not configured.');

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new CentralBillingError('Central AI WONDERLAND billing URL is invalid.');
  }

  const production = process.env.NODE_ENV === 'production';
  if ((production && url.protocol !== 'https:') || (!production && !['http:', 'https:'].includes(url.protocol))) {
    throw new CentralBillingError('Central AI WONDERLAND billing URL uses an unsupported protocol.');
  }
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/api/internal/billing/reserve') {
    throw new CentralBillingError('Central AI WONDERLAND billing URL must point directly to /api/internal/billing/reserve.');
  }
  return url;
}

function internalBillingKey(): string {
  const key = process.env.DREAMMAKERHUB_INTERNAL_BILLING_KEY?.trim() || '';
  if (key.length < 32) throw new CentralBillingError('Central AI WONDERLAND billing key is not configured.');
  return key;
}

export function bearerToken(req: Request): string | null {
  return /^Bearer\s+(\S+)$/i.exec(req.get('authorization') || '')?.[1] || null;
}

export function classifyAiCost(modelId: string): AiCostClass {
  const model = modelId.toLowerCase();

  if (/(sora|runway|kling|midjourney|ultra|deepseek-r1|\bo1\b|\bo3\b|fable-5)/.test(model)) {
    return 'frontier';
  }
  if (/(sonnet|gpt-4o(?!-mini)|gemini-.*pro|grok-3|mistral-large|nova-pro|reka-core|palmyra)/.test(model)) {
    return 'premium';
  }
  if (/(flash|haiku|mini|small|llama|deepseek-v3|qwen|glm|jamba|nemotron)/.test(model)) {
    return 'enhanced';
  }
  return 'standard';
}

export function estimateRawAiUnits(messages: ChatMessage[], config: ChatConfig = {}): number {
  const inputCharacters = messages.reduce((sum, message) => sum + message.content.length, 0)
    + (config.systemInstruction?.length || 0);
  const inputTokens = Math.ceil(inputCharacters / 4);
  const outputTokens = Number.isSafeInteger(config.maxTokens) ? Number(config.maxTokens) : 4096;
  return Math.max(1, inputTokens + outputTokens);
}

export async function reservePlatformAiCredits(
  req: Request,
  modelId: string,
  messages: ChatMessage[],
  config: ChatConfig = {},
) {
  const token = bearerToken(req);
  if (!token) {
    throw new CentralBillingError(
      'Platform-funded AI requires a signed-in AI WONDERLAND account. Legacy Wonderland keys cannot spend platform AI credits.',
      402,
    );
  }

  const costClass = classifyAiCost(modelId);
  const units = estimateRawAiUnits(messages, config);

  let response: Response;
  try {
    response = await fetch(billingEndpoint(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-dmh-billing-key': internalBillingKey(),
      },
      body: JSON.stringify({
        source: 'ai-playground',
        feature: 'ai_tokens',
        units,
        costClass,
      }),
      redirect: 'error',
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new CentralBillingError('Central AI WONDERLAND usage verification is unavailable.');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok !== true) {
    const status = [400, 401, 402, 403, 429, 503].includes(response.status) ? response.status : 503;
    throw new CentralBillingError(payload?.error || 'AI usage reservation was rejected.', status);
  }

  return {
    costClass,
    rawUnits: units,
    billedUnits: Number(payload.billedUnits || units),
    plan: typeof payload.plan === 'string' ? payload.plan : null,
  };
}
