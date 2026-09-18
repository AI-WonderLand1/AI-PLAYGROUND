const fs = require('node:fs');
const path = 'src/components/AIWonderCanvas.tsx';
let source = fs.readFileSync(path, 'utf8');
const oldText = '    setDraftNode(newNode);\n    setDraftStep(2);';
if (source.split(oldText).length !== 2) throw new Error('Expected a single draft staging site');
source = source.replace(oldText, `    // Normalize legacy defaults before configuration so harmless HTTP nodes are addable.
    // Any inherited API key or header is stripped before a draft reaches the wizard.
    setDraftNode(sanitizeWorkflowNodes([newNode])[0]);
    setDraftStep(2);`);
fs.writeFileSync(path, source);
console.log('Staged nodes now start without unsafe credential fields or legacy HTTP headers.');
