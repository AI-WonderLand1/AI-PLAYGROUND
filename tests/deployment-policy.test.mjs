import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Railway stays primary; UpCloud deployment is manual-only', () => {
  const yaml = readFileSync('.github/workflows/deploy.yml', 'utf8');
  const trigger = yaml.split(/^permissions:/m)[0];
  assert.match(trigger, /^on:\s*\n\s*workflow_dispatch:/m);
  assert.doesNotMatch(trigger, /\bpush:|\bpull_request:|\bworkflow_run:|\bschedule:/);
  assert.match(yaml, /github\.ref == 'refs\/heads\/main'/);
});

test('browser Supabase build prefers modern Railway publishable key', () => {
  const config = readFileSync('vite.config.ts', 'utf8');
  const modern = config.indexOf('env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  const legacy = config.indexOf('env.VITE_SUPABASE_ANON_KEY');
  assert.ok(modern !== -1 && legacy > modern);
  assert.ok(!config.includes('SUPABASE_SERVICE_ROLE_KEY'));
});
