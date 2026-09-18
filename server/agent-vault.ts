import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Router, type Request, type Response, type NextFunction } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { MODEL_ROUTES, callModel } from './providers/registry';
import { validateWonderlandKey } from './wonderland-keys';

type Provider = 'openrouter' | 'openai' | 'anthropic' | 'wonderland';
type AuthorizedRequest = Request & { vaultUserId?: string };
const providers = new Set<Provider>(['openrouter', 'openai', 'anthropic', 'wonderland']);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const router = Router();

function vaultConfig(): { db: SupabaseClient; key: Buffer } {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const rawKey = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!url || !serviceRole || !rawKey) throw new Error('Credential vault is not configured');
  const key = /^[0-9a-f]{64}$/i.test(rawKey) ? Buffer.from(rawKey, 'hex') : Buffer.from(rawKey, 'base64');
  if (key.length !== 32) throw new Error('CREDENTIALS_ENCRYPTION_KEY must be 32 random bytes');
  return { db: createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } }), key };
}

function encrypt(value: string, key: Buffer, ownerId: string, provider: Provider) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(`${ownerId}:${provider}`, 'utf8'));
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return { ciphertext: ciphertext.toString('base64'), iv: iv.toString('base64'), auth_tag: cipher.getAuthTag().toString('base64') };
}

function decrypt(row: any, key: Buffer, ownerId: string): string {
  if (row.user_id !== ownerId || !providers.has(row.provider)) throw new Error('Credential unavailable');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(row.iv, 'base64'));
  decipher.setAAD(Buffer.from(`${ownerId}:${row.provider}`, 'utf8'));
  decipher.setAuthTag(Buffer.from(row.auth_tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(row.ciphertext, 'base64')), decipher.final()]).toString('utf8');
}

async function authorize(req: AuthorizedRequest, res: Response, next: NextFunction) {
  const token = /^Bearer (\S+)$/i.exec(req.headers.authorization || '')?.[1];
  if (!token) { res.status(401).json({ error: 'Sign in to manage credentials' }); return; }
  try {
    const { db } = vaultConfig();
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user) { res.status(401).json({ error: 'Invalid session' }); return; }
    req.vaultUserId = data.user.id;
    next();
  } catch {
    res.status(503).json({ error: 'Credential vault unavailable' });
  }
}

router.use(authorize);

router.get('/credentials', async (req: AuthorizedRequest, res: Response) => {
  try {
    const { db } = vaultConfig();
    const { data, error } = await db.from('agent_credentials')
      .select('id,provider,label,created_at').eq('user_id', req.vaultUserId!).order('created_at', { ascending: false });
    if (error) throw error;
    res.setHeader('Cache-Control', 'no-store');
    res.json({ credentials: data });
  } catch { res.status(503).json({ error: 'Unable to list credentials; check the vault migration' }); }
});

router.post('/credentials', async (req: AuthorizedRequest, res: Response) => {
  const { provider, label, key: apiKey } = req.body || {};
  if (!providers.has(provider) || typeof label !== 'string' || !label.trim() || label.length > 80 ||
      typeof apiKey !== 'string' || apiKey.length < 8 || apiKey.length > 8192) {
    res.status(400).json({ error: 'Provide a provider, label, and valid API key' }); return;
  }
  try {
    const { db, key } = vaultConfig();
    const { data, error } = await db.from('agent_credentials').insert({
      user_id: req.vaultUserId, provider, label: label.trim(), ...encrypt(apiKey, key, req.vaultUserId!, provider),
    }).select('id,provider,label,created_at').single();
    if (error) throw error;
    res.setHeader('Cache-Control', 'no-store');
    res.status(201).json({ credential: data });
  } catch { res.status(503).json({ error: 'Credential could not be stored' }); }
});

router.delete('/credentials/:id', async (req: AuthorizedRequest, res: Response) => {
  const id = String(req.params.id);
  if (!uuidPattern.test(id)) { res.status(400).json({ error: 'Invalid credential ID' }); return; }
  try {
    const { db } = vaultConfig();
    const { data, error } = await db.from('agent_credentials').delete().eq('id', id)
      .eq('user_id', req.vaultUserId!).select('id').maybeSingle();
    if (error) throw error;
    if (!data) { res.status(404).json({ error: 'Credential not found' }); return; }
    res.status(204).end();
  } catch { res.status(503).json({ error: 'Unable to remove credential' }); }
});

async function getOwnedCredential(id: string, ownerId: string) {
  if (!uuidPattern.test(id)) throw new Error('Invalid credential ID');
  const { db, key } = vaultConfig();
  const { data, error } = await db.from('agent_credentials').select('*').eq('id', id)
    .eq('user_id', ownerId).maybeSingle();
  if (error || !data) throw new Error('Credential not found');
  return { provider: data.provider as Provider, value: decrypt(data, key, ownerId) };
}

// This is a non-destructive pre-publish test, not a general-purpose arbitrary URL proxy.
router.post('/test', async (req: AuthorizedRequest, res: Response) => {
  const { credentialId, model, systemInstruction, prompt } = req.body || {};
  if (typeof credentialId !== 'string' || typeof model !== 'string' || model.length > 120 ||
      typeof prompt !== 'string' || !prompt.trim() || prompt.length > 4000 ||
      typeof systemInstruction !== 'string' || systemInstruction.length > 8000) {
    res.status(400).json({ error: 'Select a credential and provide a model, instructions, and test prompt' }); return;
  }
  try {
    const credential = await getOwnedCredential(credentialId, req.vaultUserId!);
    let output: string;
    if (credential.provider === 'wonderland') {
      if (!validateWonderlandKey(credential.value)) { res.status(403).json({ error: 'Wonderland key is invalid' }); return; }
      const result = await callModel(model, [{ role: 'user', content: prompt }], { systemInstruction });
      output = typeof result.content === 'string' ? result.content : '';
    } else {
      const path = credential.provider === 'openrouter' ? MODEL_ROUTES[model] || model : model;
      if (!/^[a-z\d][\w./:-]{0,119}$/i.test(path)) { res.status(400).json({ error: 'Unsupported model identifier' }); return; }
      const endpoints: Record<Exclude<Provider, 'wonderland'>, string> = {
        openrouter: 'https://openrouter.ai/api/v1/chat/completions',
        openai: 'https://api.openai.com/v1/chat/completions',
        anthropic: 'https://api.anthropic.com/v1/messages',
      };
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      let body: object;
      if (credential.provider === 'anthropic') {
        headers['x-api-key'] = credential.value;
        headers['anthropic-version'] = '2023-06-01';
        body = { model: path, max_tokens: 512, system: systemInstruction, messages: [{ role: 'user', content: prompt }] };
      } else {
        headers.Authorization = `Bearer ${credential.value}`;
        body = { model: path, max_tokens: 512, messages: [{ role: 'system', content: systemInstruction }, { role: 'user', content: prompt }] };
      }
      const upstream = await fetch(endpoints[credential.provider], {
        method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(30_000),
      });
      if (!upstream.ok) { res.status(502).json({ error: `Provider request failed (HTTP ${upstream.status})` }); return; }
      const result: any = await upstream.json();
      output = credential.provider === 'anthropic'
        ? (result.content?.[0]?.text ?? '') : (result.choices?.[0]?.message?.content ?? '');
    }
    res.setHeader('Cache-Control', 'no-store');
    res.json({ status: 'success', output });
  } catch {
    res.status(502).json({ error: 'Test could not complete. Check the credential, provider, and model.' });
  }
});

export default router;
