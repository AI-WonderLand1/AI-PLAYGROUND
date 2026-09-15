import { createHash } from 'crypto';
import type { Request } from 'express';
import { supabaseAdmin } from './supabase-admin';

function hashWonderlandKey(key: string): string {
  const digest = createHash('sha256').update(key).digest('hex');
  return `wonderland:${digest.slice(0, 40)}`;
}

async function getSupabaseUserId(req: Request): Promise<string | null> {
  const authorization = req.get('authorization') || '';
  if (!authorization.toLowerCase().startsWith('bearer ')) return null;

  const token = authorization.slice(7).trim();
  if (!token) return null;

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

/**
 * Resolve a stable Mem0 user scope without ever sending raw credentials to Mem0.
 * Authenticated Supabase users keep the same ID used by the main DreamMakerHub app.
 * API-only clients fall back to a one-way hash of their already-validated Wonderland key.
 */
export async function resolveMemoryUserId(req: Request, wonderlandKey: string): Promise<string> {
  const supabaseUserId = await getSupabaseUserId(req);
  if (supabaseUserId) return supabaseUserId;
  return hashWonderlandKey(wonderlandKey);
}
