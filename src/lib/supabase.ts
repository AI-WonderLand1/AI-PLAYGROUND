import { createClient } from '@supabase/supabase-js';

function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const envVar = (name: string): string => {
  const viteVal = import.meta.env?.[`VITE_${name}`];
  if (viteVal) return String(viteVal);
  if (typeof process !== 'undefined' && process.env) {
    return String(process.env[name] || process.env[`NEXT_PUBLIC_${name}`] || '');
  }
  return '';
};

const supabaseUrl = envVar('SUPABASE_URL').trim();
const supabaseAnonKey = envVar('SUPABASE_ANON_KEY').trim();

export const supabase = (supabaseUrl && supabaseAnonKey && isHttpUrl(supabaseUrl))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function getSession() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) return { data: { session: null, user: null }, error: { message: 'Supabase is not configured.' } as any };
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  if (!supabase) return { data: { session: null, user: null }, error: { message: 'Supabase is not configured.' } as any };
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  if (!supabase) return;
  return supabase.auth.signOut();
}
