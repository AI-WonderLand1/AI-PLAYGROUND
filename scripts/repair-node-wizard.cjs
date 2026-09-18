const fs = require('node:fs');
const path = 'scripts/patch-node-wizard.cjs';
let source = fs.readFileSync(path, 'utf8');
const begin = source.indexOf("    if (nodes.length === 1 && nodes[0].category === 'trigger') {", source.indexOf('const replacement = `'));
const end = source.indexOf('\ncanvas = canvas.slice(0, addNodesStart)', begin);
if (begin < 0 || end < begin) throw new Error('Expected exact original replacement tail was not found');
const tail = [
  "    if (nodes.length === 1 && nodes[0].category === 'trigger') {",
  '      setConnections(previous => [...previous, {',
  "        id: 'conn-' + Math.random().toString(36).slice(2, 11),",
  '        fromId: nodes[0].id,',
  '        toId: newNode.id,',
  '      }]);',
  '    }',
  "    setExecutionLog(previous => [...previous, '[System] Added node ' + title + ' (' + newNode.type + ') to the canvas. Not executed.']);",
  '    setDraftNode(null);',
  "    showNotification(title + ' added to canvas. Run it to verify execution.');",
  '  }`;',
].join('\n');
source = source.slice(0, begin) + tail + source.slice(end);
fs.writeFileSync(path, source);
console.log('Normalized migration script and preserved exact-match safety assertions.');
