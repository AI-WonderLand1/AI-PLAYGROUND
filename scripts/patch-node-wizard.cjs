const fs = require('node:fs');
function read(path) { return fs.readFileSync(path, 'utf8'); }
function write(path, content) { fs.writeFileSync(path, content); console.log('Updated ' + path); }
function once(source, oldText, newText, label) {
  const count = source.split(oldText).length - 1;
  if (count !== 1) throw new Error(label + ': expected 1 occurrence, found ' + count);
  return source.replace(oldText, newText);
}
let app = read('src/App.tsx');
app = once(app,
  ">('models');",
  ">(() => new URLSearchParams(window.location.search).has('nodeBuilder') ? 'aiwonder' : 'models');",
  'open builder canvas from library');
write('src/App.tsx', app);

let canvas = read('src/components/AIWonderCanvas.tsx');
canvas = once(canvas,
  "import { CredentialPanel } from './canvas/CredentialPanel';",
  "import { CredentialPanel } from './canvas/CredentialPanel';\nimport { NodeBuilderWizard } from './canvas/NodeBuilderWizard';",
  'node wizard import');
canvas = once(canvas,
  "  const [addPanelSearch, setAddPanelSearch] = useState('');",
  "  const [addPanelSearch, setAddPanelSearch] = useState('');\n  const [draftNode, setDraftNode] = useState<WorkflowNode | null>(null);\n  const [draftStep, setDraftStep] = useState<2 | 3>(2);",
  'draft state');
canvas = once(canvas,
  "  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);",
  "  const [isAddPanelOpen, setIsAddPanelOpen] = useState(() => new URLSearchParams(window.location.search).has('nodeBuilder'));",
  'open palette on navigation');
const addStart = canvas.indexOf('  // Add a new node of a specific type');
if (addStart < 0) throw new Error('missing add node handler');
const memoryStart = canvas.indexOf('    // Create a linked global memory node if memory core type', addStart);
const newNodeStart = canvas.indexOf('    const newNode: WorkflowNode = {', addStart);
if (memoryStart < 0 || newNodeStart < memoryStart) throw new Error('cannot safely relocate memory side effect');
canvas = canvas.slice(0, memoryStart) + canvas.slice(newNodeStart);
const addNodesStart = canvas.indexOf('    setNodes(prev => [...prev, newNode]);', addStart);
const handlerEnd = canvas.indexOf('\n  };\n\n// Import a template workflow', addNodesStart);
if (addNodesStart < 0 || handlerEnd < addNodesStart) throw new Error('cannot safely locate original immediate node add');
const replacement = `    // Step 1 selects a type; do not mutate the canvas before review.
    setDraftNode(newNode);
    setDraftStep(2);
    setIsAddPanelOpen(false);
    setSpawnCoords(null);
  };

  const commitDraftNode = () => {
    if (!draftNode) return;
    const title = (draftNode.config.title || draftNode.label).trim();
    if (!title || hasUnsafeCredentials(draftNode.config as Record<string, unknown>)) {
      showNotification('Remove unsafe credential fields and enter a node name before adding.');
      return;
    }
    const newNode = sanitizeWorkflowNodes([{ ...draftNode, label: title }])[0];
    pushHistory();
    if (newNode.category === 'dream_maker') {
      onAddMemory({
        id: newNode.memoryId,
        title,
        type: newNode.type as MemoryNode['type'],
        content: '',
      });
    }
    setNodes(previous => [...previous, newNode]);
    if (nodes.length === 1 && nodes[0].category === 'trigger') {
      setConnections(previous => [...previous, {
        id: \\`conn-\\${Math.random().toString(36).slice(2, 11)}\\`,
        fromId: nodes[0].id,
        toId: newNode.id,
      }]);
    }
    setExecutionLog(previous => [...previous, \\`[System] Added node \\${title} (\\${newNode.type}) to the canvas. Not executed.\\`]);
    setDraftNode(null);
    showNotification(\\`\\${title} added to canvas. Run it to verify execution.\\`);
  }`.replace(/\\`/g, '`').replace(/\\\$/g, '$');
canvas = canvas.slice(0, addNodesStart) + replacement + canvas.slice(handlerEnd + '\n  }'.length);
const sidebarAnchor = '      {/* RIGHT SIDEBAR ADD-NODE SLIDE-IN CATALOGUE ("SUMMONED PANEL") */}';
canvas = once(canvas, sidebarAnchor,
  `      {draftNode && <NodeBuilderWizard
        draft={draftNode}
        step={draftStep}
        onChange={setDraftNode}
        onBack={() => { if (draftStep === 3) setDraftStep(2); else { setDraftNode(null); setIsAddPanelOpen(true); } }}
        onNext={() => setDraftStep(3)}
        onAdd={commitDraftNode}
        onCancel={() => setDraftNode(null)}
      />}
` + sidebarAnchor,
  'render 3-step builder');
canvas = once(canvas, 'Summon Workflow Node</span>', 'Node builder · Step 1 of 3</span>', 'node picker step label');
write('src/components/AIWonderCanvas.tsx', canvas);

let builder = read('src/agents/AgentLibrary.tsx');
builder = once(builder, "import { useEffect, useState } from 'react';", "import { useEffect, useRef, useState } from 'react';", 'builder editing import');
builder = once(builder, '  const [step, setStep] = useState<1 | 2 | 3>(1);', '  const [step, setStep] = useState<1 | 2 | 3>(1);\n  const initialEditHandled = useRef(false);', 'one-time deep-linked edit');
builder = once(builder, '  useEffect(() => { void refresh(); }, []);', `  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    if (loading || initialEditHandled.current || !userId) return;
    initialEditHandled.current = true;
    const id = new URLSearchParams(window.location.search).get('agent');
    const existing = saved.find(agent => agent.id === id);
    if (existing) selectSaved(existing);
  }, [loading, userId, saved]);`, 'edit existing agent in node builder');
builder = once(builder, 'Back to Playground</a>', 'Back to Agent Library</a>', 'back label');
builder = once(builder, 'href="/" className="mb-8', 'href="/agents" className="mb-8', 'back destination');
builder = once(builder, '<h1 className="mt-2 text-3xl font-bold">Agent library</h1>', '<h1 className="mt-2 text-3xl font-bold">Agent node builder</h1>', 'builder title');
builder = once(builder, 'Choose an agent, configure its capabilities, and test it before saving.', 'Choose an agent node, configure it, then test and save it to your library.', 'builder subtitle');
builder = once(builder, "['1. Choose agent', '2. Configure', '3. Test & publish']", "['1. Choose node', '2. Configure node', '3. Test & save']", 'builder step labels');
write('src/agents/AgentLibrary.tsx', builder);
