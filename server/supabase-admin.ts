import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { serverSupabaseConfig } from './supabase-config';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  const { url: supabaseUrl, key: serviceKey } = serverSupabaseConfig(process.env);
  if (!_client && supabaseUrl && serviceKey) {
    _client = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  if (!_client) {
    throw new Error('Supabase not configured — set SUPABASE_URL and SUPABASE_SECRET_KEY');
  }
  return _client;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const value = (getClient() as any)[prop];
    return typeof value === 'function' ? value.bind(getClient()) : value;
  },
});

export async function getUserById(userId: string) {
  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
  return user;
}

export async function getOrCreateProfile(userId: string, email?: string) {
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (existing) return existing;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: userId,
      username: email?.split('@')[0] || `user_${userId.slice(0, 8)}`,
      display_name: email?.split('@')[0] || 'User',
    })
    .select()
    .single();

  return profile;
}
