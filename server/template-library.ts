import { Router, NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { validateWonderlandKey } from './wonderland-keys';

const router = Router();
const DIR = path.resolve(process.cwd(), 'src', 'data', 'n8n-templates');
const META = path.join(DIR, '.metadata.json');

function ensure() { fs.mkdirSync(DIR, { recursive: true }); }
function loadM() { ensure(); return fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf-8')) : {}; }
function saveM(m: Record<string, any>) { ensure(); fs.writeFileSync(META, JSON.stringify(m, null, 2)); }

function safeFileName(name: string): string | null {
  const base = path.basename(String(name || '').trim());
  return base.endsWith('.json') ? base : null;
}

function isAuthorized(req: Request): boolean {
  const header = req.headers['x-wonderland-key'];
  const body = (req.body as any)?.wonderlandKey;
  const key = typeof header === 'string' ? header : body;
  return typeof key === 'string' && validateWonderlandKey(key);
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!isAuthorized(req)) {
    res.status(401).json({ error: 'Unauthorized. Provide a valid x-wonderland-key header.' });
    return;
  }
  next();
}

// Sanitize every :file path param so it cannot escape the templates directory.
router.use('/:file', (req, res, next) => {
  const raw = typeof req.params.file === 'string' ? req.params.file : '';
  const safe = safeFileName(raw);
  if (!safe) {
    res.status(400).json({ error: 'invalid file name' });
    return;
  }
  req.params.file = safe;
  next();
});

function fileParam(req: Request): string {
  const v = fileParam(req);
  return typeof v === 'string' ? v : '';
}

router.get('/', (_, res) => {
  try {
    ensure();
    const meta = loadM();
    const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json') && f !== '.metadata.json').sort();
    const result = files.map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf-8'));
      const info = meta[f] || {};
      const stat = fs.statSync(path.join(DIR, f));
      return { file: f, name: data.name || f, slug: f.replace('.json', ''), visibility: info.visibility || 'private', description: info.description || '', tags: info.tags || [], todo: info.todo || [], size: stat.size, modified: stat.mtimeMs };
    });
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/:file', (req, res) => {
  try {
    const fp = path.join(DIR, fileParam(req));
    if (!fs.existsSync(fp)) { res.status(404).json({ error: 'not found' }); return; }
    res.json(JSON.parse(fs.readFileSync(fp, 'utf-8')));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/', requireAuth, (req, res) => {
  try {
    const safe = safeFileName(req.body?.file);
    if (!safe) { res.status(400).json({ error: 'invalid file name' }); return; }
    ensure();
    fs.writeFileSync(path.join(DIR, safe), JSON.stringify(req.body.content, null, 2));
    res.json({ ok: true, file: safe });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/:file', requireAuth, (req, res) => {
  try {
    const fp = path.join(DIR, fileParam(req));
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    const meta = loadM();
    delete meta[fileParam(req)];
    saveM(meta);
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/:file/meta', requireAuth, (req, res) => {
  try {
    const meta = loadM();
    if (!meta[fileParam(req)]) meta[fileParam(req)] = {};
    Object.assign(meta[fileParam(req)], req.body);
    saveM(meta);
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/:file/todo', requireAuth, (req, res) => {
  try {
    const meta = loadM();
    if (!meta[fileParam(req)]) meta[fileParam(req)] = {};
    if (!meta[fileParam(req)].todo) meta[fileParam(req)].todo = [];
    meta[fileParam(req)].todo.push({ text: req.body.text, done: false });
    saveM(meta);
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/:file/todo/:idx', requireAuth, (req, res) => {
  try {
    const meta = loadM();
    const todos = meta[fileParam(req)]?.todo || [];
    const idx = parseInt(typeof req.params.idx === 'string' ? req.params.idx : '');
    if (idx >= 0 && idx < todos.length) todos[idx].done = !todos[idx].done;
    saveM(meta);
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;