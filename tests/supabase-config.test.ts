import test from 'node:test';
import assert from 'node:assert/strict';
import {publicSupabaseConfig, serverSupabaseConfig} from '../server/supabase-config';

test('modern publishable keys override disabled legacy public keys', () => {
  const config=publicSupabaseConfig({NEXT_PUBLIC_SUPABASE_URL:'https://test.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'modern-public',VITE_SUPABASE_ANON_KEY:'disabled-legacy'});
  assert.deepEqual(config,{url:'https://test.supabase.co',key:'modern-public'});
});
test('supports the default publishable key name used by Supabase deployments',()=>{
  assert.equal(publicSupabaseConfig({NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:'modern-default',VITE_SUPABASE_ANON_KEY:'legacy'}).key,'modern-default');
});
test('browser configuration never falls back to a service credential',()=>{
  assert.equal(publicSupabaseConfig({SUPABASE_SECRET_KEY:'server-secret',SUPABASE_SERVICE_ROLE_KEY:'legacy-secret'}).key,'');
});
test('server configuration prefers the modern secret while preserving legacy compatibility',()=>{
  assert.equal(serverSupabaseConfig({SUPABASE_SECRET_KEY:'modern-secret',SUPABASE_SERVICE_ROLE_KEY:'disabled-legacy'}).key,'modern-secret');
  assert.equal(serverSupabaseConfig({SUPABASE_SERVICE_ROLE_KEY:'legacy-only'}).key,'legacy-only');
});
