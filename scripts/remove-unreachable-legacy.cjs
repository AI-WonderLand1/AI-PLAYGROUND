const fs = require('node:fs');
const path = 'src/components/AIWonderCanvas.tsx';
let code = fs.readFileSync(path, 'utf8');
const cases = [
  ["            } else if (node.type === 'serpapi') {", "            } else if (node.type === 'wikipedia') {", "            } else if (node.type === 'serpapi') {\n              throw new Error('SerpAPI requires a secure server-side executor.');\n"],
  ["            } else if (node.type === 'wolfram_alpha') {", "            } else if (node.type === 'item_list_parser') {", "            } else if (node.type === 'wolfram_alpha') {\n              throw new Error('Wolfram Alpha requires a secure server-side executor.');\n"],
  ["            } else if (node.type === 'embeddings_openai' || node.type === 'embeddings_gemini') {", "            } else if (node.type === 'postgres_chat_memory' || node.type === 'redis_chat_memory') {", "            } else if (node.type === 'embeddings_openai' || node.type === 'embeddings_gemini') {\n              throw new Error('Provider embeddings require a real provider endpoint. Local feature hashing is not OpenAI or Gemini embeddings.');\n"],
  ["            } else if (node.type === 'postgres_chat_memory' || node.type === 'redis_chat_memory') {", "            } else if (node.type === 'in_memory_vector' || node.type === 'pinecone_vector' || node.type === 'pgvector_store') {", "            } else if (node.type === 'postgres_chat_memory' || node.type === 'redis_chat_memory') {\n              throw new Error('Postgres and Redis memory require an authenticated backend, not browser storage.');\n"],
];
for (const [start, end, replacement] of cases) {
  const i = code.indexOf(start);
  const j = code.indexOf(end, i + start.length);
  if (i < 0 || j < 0 || code.indexOf(start, i + start.length) >= 0) throw Error('Unexpected node branch: ' + start);
  code = code.slice(0, i) + replacement + code.slice(j);
}
fs.writeFileSync(path, code);
console.log('Removed four dead legacy execution branches.');
