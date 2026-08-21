const validKeys: Set<string> = new Set(
  (process.env.WONDERLAND_KEYS || '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)
);

if (validKeys.size === 0) {
  console.warn(
    '[wonderland-keys] WONDERLAND_KEYS is not set. The proxy will REJECT all /api/chat requests. ' +
    'Set WONDERLAND_KEYS to a comma-separated list of valid keys before deploying.'
  );
}

export function validateWonderlandKey(key: string): boolean {
  return validKeys.has(key);
}
