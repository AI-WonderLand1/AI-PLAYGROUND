import express from 'express';
import cors from 'cors';
import { validateWonderlandKey } from './wonderland-keys';
import { callModel } from './providers/registry';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { model, messages, config, wonderlandKey } = req.body;

  if (!model || !messages) {
    res.status(400).json({ error: 'Missing required fields: model, messages' });
    return;
  }

  if (!wonderlandKey) {
    res.status(401).json({ error: 'Missing Wonderland key. Provide wonderlandKey in request body.' });
    return;
  }

  if (!validateWonderlandKey(wonderlandKey)) {
    res.status(403).json({ error: 'Invalid Wonderland key.' });
    return;
  }

  try {
    const result = await callModel(model, messages, config || {});
    res.json(result);
  } catch (err: any) {
    console.error(`/api/chat error for model ${model}:`, err.message);
    res.status(502).json({ error: err.message || 'Upstream provider error.' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`Wonderland proxy server running on port ${PORT}`);
});
