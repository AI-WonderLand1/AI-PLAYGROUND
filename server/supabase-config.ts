type Environment = Record<string, string | undefined>;

/** Public build values only; never fall back to a server credential. */
export function publicSupabaseConfig(env: Environment) {
  return {
    url: env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || '',
    key: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
      env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
      env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '',
  };
}

export function serverSupabaseConfig(env: Environment) {
  return {
    url: env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '',
    key: env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || '',
  };
}
