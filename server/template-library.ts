import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const DIR = path.resolve(process.cwd(), 'src', 'data', 'n8n-templates');
const META = path.join(DIR, '.metadata.json');

function ensure() { fs.mkdirSync(DIR, { recursive: true }); }
function loadM() { ensure(); return fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf-8')) : {}; }
function saveM(m: Record<string, any>) { ensure(); fs.writeFileSync(META, JSON.stringify(m, null, 2)); }

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
  } catch (err: any) { res.status(500).json({ error: e.message }); }
});

router.get('/:file', (req, res) => {
  try {
    const fp = path.join(DIR, req.params.file);
    if (!fs.existsSync(fp)) { res.status(404).json({ error: 'not found' }); return; }
    res.json(JSON.parse(fs.readFileSync(fp, 'utf-8')));
  } catch (err: any) { res.status(500).json({ error: e.message }); }
});

router.post('/', (req, res) => {
  try {
    ensure();
    const fn = req.body.file.endsWith('.json') ? req.body.file : req.body.file + '.json';
    fs.writeFileSync(path.join(DIR, fn), JSON.stringify(req.body.content, null, 2));
    res.json({ ok: true, file: fn });
  } catch (err: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/:file', (req, res) => {
  try {
    const fp = path.join(DIR, req.params.file);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    const meta = loadM();
    delete meta[req.params.file];
    saveM(meta);
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: e.message }); }
});

router.patch('/:file/meta', (req, res) => {
  try {
    const meta = loadM();
    if (!meta[req.params.file]) meta[req.params.file] = {};
    Object.assign(meta[req.params.file], req.body);
    saveM(meta);
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: e.message }); }
});

router.post('/:file/todo', (req, res) => {
  try {
    const meta = loadM();
    if (!meta[req.params.file]) meta[req.params.file] = {};
    if (!meta[req.params.file].todo) meta[req.params.file].todo = [];
    meta[req.params.file].todo.push({ text: req.body.text, done: false });
    saveM(meta);
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: e.message }); }
});

router.patch('/:file/todo/:idx', (req, res) => {
  try {
    const meta = loadM();
    const todos = meta[req.params.file]?.todo || [];
    const idx = parseInt(req.params.idx);
    if (idx >= 0 && idx < todos.length) todos[idx].done = !todos[idx].done;
    saveM(meta);
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: e.message }); }
});

export default router;