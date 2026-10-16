import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const forwarded = [];
const central = createServer(async (req, res) => {
  let body=''; for await (const chunk of req) body+=chunk;
  forwarded.push({ path:req.url, auth:req.headers.authorization, body:body ? JSON.parse(body):null });
  res.setHeader('content-type','application/json');
  res.end(JSON.stringify(req.url === '/api/usage' ? { ok:true,usage:{ tokens_used:17,recent_activity:[] } } : { ok:true,content:'verified mock response',provider:'openrouter',model:'saved-model' }));
});
await new Promise(resolve => central.listen(0,'127.0.0.1',resolve));
const placeholder = createServer(); await new Promise(resolve => placeholder.listen(0,'127.0.0.1',resolve));
const port=placeholder.address().port; await new Promise(resolve=>placeholder.close(resolve));
const child=spawn(process.execPath,['--import','tsx/esm','server/index.ts'],{ env:{...process.env,NODE_ENV:'production',PORT:String(port),DREAMMAKERHUB_PROVIDER_CATALOG_URL:`http://127.0.0.1:${central.address().port}/api/ai-providers/catalog`},stdio:['ignore','pipe','pipe'] });
let log='';child.stdout.on('data',d=>log+=d); child.stderr.on('data',d=>log+=d);
try {
  let ready=false; for(let i=0;i<60;i++){ try{ ready=(await fetch(`http://127.0.0.1:${port}/api/health`)).ok; }catch{} if(ready)break; await new Promise(resolve=>setTimeout(resolve,100)); }
  assert.ok(ready,log);
  const endpoint=`http://127.0.0.1:${port}`;
  assert.equal((await fetch(endpoint+'/api/account/usage')).status,401);
  assert.equal(forwarded.length,0);
  const auth={ Authorization:'Bearer mock-user-token' };
  const usage=await fetch(endpoint+'/api/account/usage',{headers:auth});assert.equal(usage.status,200);assert.equal((await usage.json()).usage.tokens_used,17);
  const chat=await fetch(endpoint+'/api/account/chat',{method:'POST',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:'Hello'}],system:'Test',maxTokens:512})});assert.equal(chat.status,200);assert.equal((await chat.json()).content,'verified mock response');
  assert.equal(forwarded.at(-1).body.source,'ai-playground');assert.equal(forwarded.at(-1).auth,'Bearer mock-user-token');
  console.log('Account proxy integration checks passed (mock central service; no live provider calls).');
} finally { child.kill(); await new Promise(resolve=>central.close(resolve)); }
