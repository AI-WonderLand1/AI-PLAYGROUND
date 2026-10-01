import type { Request } from "express";

type Feature = "ai_tokens" | "ai_requests" | "render_credits";

export class DreamMakerHubBillingError extends Error {
  constructor(message: string, public readonly status = 503) {
    super(message);
    this.name = "DreamMakerHubBillingError";
  }
}

function billingBaseUrl() {
  const raw = (process.env.DREAMMAKERHUB_BILLING_URL || "https://dreammakerhub.website").trim();
  const url = new URL(raw);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.hostname === "localhost")) {
    throw new DreamMakerHubBillingError("AI WONDERLAND billing URL must use HTTPS.");
  }
  return url;
}

function serviceKey() {
  const key = process.env.DREAMMAKERHUB_INTERNAL_BILLING_KEY?.trim() || "";
  if (key.length < 32) {
    throw new DreamMakerHubBillingError("Central billing is not configured.");
  }
  return key;
}

function userAuthorization(req: Request) {
  const authorization = req.header("authorization")?.trim() || "";
  if (!/^Bearer\s+\S+/i.test(authorization)) {
    throw new DreamMakerHubBillingError("Sign in to AI WONDERLAND to use platform-funded AI.", 401);
  }
  return authorization;
}

export function estimateAiTokens(messages: Array<{ content?: unknown }>, maxOutputTokens: unknown) {
  const inputCharacters = messages.reduce((total, message) => {
    return total + (typeof message?.content === "string" ? message.content.length : 0);
  }, 0);
  const output = typeof maxOutputTokens === "number" && Number.isFinite(maxOutputTokens)
    ? Math.max(1, Math.min(Math.floor(maxOutputTokens), 4096))
    : 4096;
  return Math.max(1, Math.ceil(inputCharacters / 2) + output);
}

export async function reserveDreamMakerHubUsage(
  req: Request,
  feature: Feature,
  units: number,
) {
  if (!Number.isSafeInteger(units) || units < 1 || units > 1_000_000) {
    throw new DreamMakerHubBillingError("Invalid usage reservation.", 400);
  }

  const endpoint = new URL("/api/internal/billing/reserve", billingBaseUrl());
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: userAuthorization(req),
      "x-dmh-billing-key": serviceKey(),
    },
    body: JSON.stringify({
      source: "ai-playground",
      feature,
      units,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new DreamMakerHubBillingError(
      typeof payload?.error === "string" ? payload.error : "Central usage verification failed.",
      response.status,
    );
  }
  return payload;
}

export async function reserveDreamMakerHubAiRequest(
  req: Request,
  messages: Array<{ content?: unknown }>,
  maxOutputTokens: unknown,
) {
  const tokens = estimateAiTokens(messages, maxOutputTokens);
  // Request count and tokens share the same authoritative AI WONDERLAND account.
  await reserveDreamMakerHubUsage(req, "ai_requests", 1);
  await reserveDreamMakerHubUsage(req, "ai_tokens", tokens);
  return { tokens };
}
