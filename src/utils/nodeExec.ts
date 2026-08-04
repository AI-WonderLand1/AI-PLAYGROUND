// Real node execution helpers — no stubs, no fake data.
// Deterministic local computations, persistent browser stores, and real public APIs.

const VECTOR_STORE_KEY = 'wonderland_vector_store';
const CHAT_MEMORY_KEY = 'wonderland_chat_memory';

export interface VectorDoc {
  id: string;
  text: string;
  vector: number[];
  meta: Record<string, any>;
  createdAt?: number;
}

export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function embedText(text: string, dims = 256): number[] {
  const vec = new Array<number>(dims).fill(0);
  const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);
  for (const tok of tokens) {
    vec[hashString(tok) % dims] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export function loadVectorDocs(): VectorDoc[] {
  try {
    return JSON.parse(localStorage.getItem(VECTOR_STORE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveVectorDocs(docs: VectorDoc[]): void {
  try {
    localStorage.setItem(VECTOR_STORE_KEY, JSON.stringify(docs));
  } catch {
    /* storage full or unavailable — non-fatal for a node run */
  }
}

export function upsertVectorDoc(doc: VectorDoc): void {
  const docs = loadVectorDocs();
  const idx = docs.findIndex(d => d.id === doc.id);
  if (idx === -1) docs.push(doc);
  else docs[idx] = doc;
  saveVectorDocs(docs);
}

export function queryVectorDocs(query: string, k = 5): VectorDoc[] {
  const qv = embedText(query);
  return loadVectorDocs()
    .map(doc => ({ doc, score: cosineSimilarity(qv, doc.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(r => r.doc);
}

export function clearVectorDocs(): void {
  localStorage.removeItem(VECTOR_STORE_KEY);
}

export function loadChatMemory(): any[] {
  try {
    return JSON.parse(localStorage.getItem(CHAT_MEMORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function appendChatMemory(entry: any): void {
  const memory = loadChatMemory();
  memory.push({ ...entry, timestamp: new Date().toISOString() });
  // Keep only last 200 entries
  if (memory.length > 200) memory.length = 200;
  saveChatMemory(memory);
}

export function clearChatMemory(): void {
  localStorage.removeItem(CHAT_MEMORY_KEY);
}

export function saveChatMemory(memory: any[]): void {
  try {
    localStorage.setItem(CHAT_MEMORY_KEY, JSON.stringify(memory));
  } catch {
    /* storage full or unavailable — non-fatal */
  }
}

export function evalCalculator(expr: string): number {
  const clean = expr.replace(/[^0-9+\-*/().%\s]/g, '');
  if (!clean) throw new Error('Calculator: no valid numeric expression found');
  const result = new Function(`return (${clean})`)();
  if (typeof result !== 'number' || !isFinite(result)) throw new Error('Calculator: expression did not evaluate to a finite number');
  return Math.round(result * 10000) / 10000;
}

export function parseItems(input: string): any[] {
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).items)) return (parsed as any).items;
    return [parsed];
  } catch {
    return input.split('\n').map(s => s.trim()).filter(Boolean);
  }
}

export function aggregateItems(input: string): string {
  const items = parseItems(input);
  const numbers = items
    .map(i => (typeof i === 'number' ? i : parseFloat(typeof i === 'object' ? JSON.stringify(i) : String(i))))
    .filter(n => !isNaN(n));
  return JSON.stringify({
    count: items.length,
    numericCount: numbers.length,
    sum: numbers.reduce((a, b) => a + b, 0),
    avg: numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : null,
    min: numbers.length ? Math.min(...numbers) : null,
    max: numbers.length ? Math.max(...numbers) : null,
  }, null, 2);
}

export function sortItems(input: string, key?: string, order = 'asc'): string {
  const items = parseItems(input);
  const sorted = [...items].sort((a, b) => {
    let av: any = a;
    let bv: any = b;
    if (key && a && typeof a === 'object') { av = (a as any)[key]; bv = (b as any)[key]; }
    const an = parseFloat(String(av));
    const bn = parseFloat(String(bv));
    if (!isNaN(an) && !isNaN(bn)) return order === 'desc' ? bn - an : an - bn;
    return String(av ?? '').localeCompare(String(bv ?? '')) * (order === 'desc' ? -1 : 1);
  });
  return JSON.stringify(sorted, null, 2);
}

export function removeDuplicates(input: string, key?: string): string {
  const items = parseItems(input);
  const seen = new Set<string>();
  const result = items.filter(it => {
    let val: any = it;
    if (key && it && typeof it === 'object') val = (it as any)[key];
    const s = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  });
  return JSON.stringify(result, null, 2);
}

export function editFields(input: string, fields: Record<string, any>): string {
  let obj: any = {};
  try { obj = JSON.parse(input); } catch { obj = { input }; }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) obj = { data: obj };
  return JSON.stringify({ ...obj, ...fields }, null, 2);
}

export function parseStructured(input: string): string {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify({ valid: true, data: parsed }, null, 2);
  } catch (e: any) {
    return JSON.stringify({ valid: false, error: e.message, data: null }, null, 2);
  }
}

export function repairJson(input: string): string {
  const tryParse = (s: string): any => {
    try {
      return JSON.parse(s);
    } catch {
      return undefined;
    }
  };
  const direct = tryParse(input);
  if (direct !== undefined) return JSON.stringify({ repaired: false, data: direct }, null, 2);

  let fixed = input.trim();
  fixed = fixed.replace(/,\s*([}\]])/g, '$1');
  fixed = fixed.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  fixed = fixed.replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3');
  const repaired = tryParse(fixed);
  if (repaired !== undefined) return JSON.stringify({ repaired: true, data: repaired }, null, 2);
  return JSON.stringify({ repaired: false, error: 'Unable to repair JSON' }, null, 2);
}

export function applyUtility(input: string, op: string, arg?: string): string {
  switch (op) {
    case 'uppercase': return input.toUpperCase();
    case 'lowercase': return input.toLowerCase();
    case 'trim': return input.trim();
    case 'length': return String(input.length);
    case 'json_parse': { const p = JSON.parse(input); return JSON.stringify(p, null, 2); }
    case 'json_stringify': return JSON.stringify(input);
    case 'base64_encode': return btoa(unescape(encodeURIComponent(input)));
    case 'base64_decode': return decodeURIComponent(escape(atob(input)));
    case 'url_encode': return encodeURIComponent(input);
    case 'url_decode': return decodeURIComponent(input);
    case 'replace': return input.split(arg || '').join('');
    case 'slice': return input.slice(0, parseInt(arg || '100', 10));
    case 'date_iso': return new Date().toISOString();
    case 'date_formatted': return new Date().toLocaleString();
    default: throw new Error(`Utilities: unknown operation "${op}"`);
  }
}

export function processDocument(input: string, mode: string, arg?: number): string {
  const chunkSize = arg || 500;
  const clean = input.replace(/\r/g, '');
  if (mode === 'chunk') {
    const chunks: string[] = [];
    for (let i = 0; i < clean.length; i += chunkSize) chunks.push(clean.slice(i, i + chunkSize));
    return JSON.stringify({ chunkCount: chunks.length, chunkSize, chunks: chunks.map((c, i) => ({ id: `chunk-${i}`, text: c })) }, null, 2);
  }
  if (mode === 'headings') {
    const headings = clean.split('\n').filter(l => /^#{1,6}\s/.test(l.trim())).map(l => l.trim());
    return JSON.stringify({ headings }, null, 2);
  }
  if (mode === 'stats') {
    return JSON.stringify({ length: clean.length, lines: clean.split('\n').length, words: clean.split(/\s+/).filter(Boolean).length }, null, 2);
  }
  return clean;
}

export async function fetchWikipediaSummary(title: string): Promise<string> {
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
  if (!res.ok) throw new Error(`Wikipedia HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.extract || data?.description || '';
  if (!text) throw new Error('Wikipedia: no summary available for that title');
  return JSON.stringify({ title: data.title, url: data.content_urls?.desktop?.page || '', summary: text }, null, 2);
}

export async function fetchRssItems(url: string, limit = 10): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);
  const xml = await res.text();
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  const extract = (tag: string, block: string): string => {
    const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
    return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
  };
  const items: any[] = [];
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null && items.length < limit) {
    items.push({ title: extract('title', m[1]), link: extract('link', m[1]), description: extract('description', m[1]).slice(0, 300), pubDate: extract('pubDate', m[1]) });
  }
  return JSON.stringify({ feed: extract('title', xml.slice(0, xml.indexOf('<item>'))), items }, null, 2);
}

export async function callPerplexity(query: string, apiKey: string): Promise<string> {
  if (!apiKey) throw new Error('Perplexity: API key required (set it in the node config).');
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: query }] }),
  });
  if (!res.ok) throw new Error(`Perplexity HTTP ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || 'No answer returned.';
}

export async function callPushbullet(message: string, accessToken: string): Promise<string> {
  if (!accessToken) throw new Error('Pushbullet: access token required (set it in the node config).');
  const res = await fetch('https://api.pushbullet.com/v2/pushes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Access-Token': accessToken },
    body: JSON.stringify({ type: 'note', title: 'Workflow', body: message.slice(0, 500) }),
  });
  if (!res.ok) throw new Error(`Pushbullet HTTP ${res.status}`);
  const data = await res.json();
  return JSON.stringify({ id: data.id, active: data.active, created: data.created }, null, 2);
}

export async function callSerpApi(query: string, apiKey: string): Promise<string> {
  if (!apiKey) throw new Error('SerpAPI: API key required (set it in the node config).');
  const res = await fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${encodeURIComponent(apiKey)}`);
  if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}`);
  const data = await res.json();
  const results = (data?.organic_results || []).map((r: any) => ({ title: r.title, link: r.link, snippet: r.snippet })).slice(0, 10);
  return JSON.stringify({ query, results, total: results.length }, null, 2);
}

export async function callWolframAlpha(query: string, appId: string): Promise<string> {
  if (!appId) throw new Error('Wolfram Alpha: App ID required (set it in the node config).');
  const res = await fetch(`https://api.wolframalpha.com/v2/query?appid=${encodeURIComponent(appId)}&input=${encodeURIComponent(query)}&format=plaintext`);
  if (!res.ok) throw new Error(`Wolfram Alpha HTTP ${res.status}`);
  const xml = await res.text();
  const pods = [...xml.matchAll(/<subpod>([\s\S]*?)<\/subpod>/g)]
    .map(m => (m[1].match(/<plaintext>([\s\S]*?)<\/plaintext>/) || [])[1] || '')
    .filter(t => t.trim());
  if (pods.length === 0) throw new Error('Wolfram Alpha: no result returned for that input');
  return JSON.stringify({ query, result: pods[0].trim() }, null, 2);
}

export async function callYouTubeSearch(query: string, apiKey: string): Promise<string> {
  if (!apiKey) throw new Error('YouTube: API key required (set it in the node config).');
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`);
  if (!res.ok) throw new Error(`YouTube HTTP ${res.status}`);
  const data = await res.json();
  const results = (data?.items || []).map((i: any) => ({
    id: i.id?.videoId,
    title: i.snippet?.title,
    channel: i.snippet?.channelTitle,
    url: i.id?.videoId ? `https://www.youtube.com/watch?v=${i.id.videoId}` : '',
  }));
  return JSON.stringify({ query, results, total: results.length }, null, 2);
}

export async function callGithubIssue(repo: string, title: string, body: string, token: string): Promise<string> {
  if (!repo) throw new Error('GitHub: repository required (owner/repo).');
  if (!token) throw new Error('GitHub: personal access token required (set it in the node config).');
  const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    body: JSON.stringify({ title, body: body.slice(0, 5000) }),
  });
  if (!res.ok) throw new Error(`GitHub HTTP ${res.status}`);
  const data = await res.json();
  return JSON.stringify({ number: data.number, url: data.html_url, state: data.state }, null, 2);
}

export async function callWebhookIntegration(nodeType: string, cfg: Record<string, any>, input: string): Promise<string> {
  const url = cfg.webhookUrl || cfg.httpUrl || '';
  if (!url) throw new Error(`${nodeType}: no webhook/API URL configured. Set one in the node config.`);
  const key = cfg.providerApiKey || cfg.apiKey || '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (key) headers['Authorization'] = `Bearer ${key}`;
  const res = await fetch(url, { method: 'POST', headers, body: input });
  const text = await res.text();
  if (!res.ok) throw new Error(`${nodeType} HTTP ${res.status}: ${text.slice(0, 200)}`);
  return text;
}
