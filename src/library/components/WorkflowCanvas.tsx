import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Play, 
  Download, 
  Copy, 
  Check, 
  Plus, 
  Sparkles, 
  Layers, 
  Settings, 
  HelpCircle,
  FileCode,
  Shield,
  Activity,
  Terminal,
  X,
  Search
} from 'lucide-react';
import { N8nWorkflow, N8nNode, ConnectionType } from '../types';
import { getNodeMeta, NODE_CATALOG } from '../data/n8nNodesCatalog';
import { NodeInspectorModal } from './NodeInspectorModal';

interface WorkflowCanvasProps {
  workflow: N8nWorkflow;
  workflowName?: string;
  onDownloadJSON?: () => void;
  isReadOnly?: boolean;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflow: initialWorkflow,
  workflowName,
  onDownloadJSON,
  isReadOnly = false
}) => {
  const [workflow, setWorkflow] = useState<N8nWorkflow>(initialWorkflow);
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 150, y: 150 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<N8nNode | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simActiveNodes, setSimActiveNodes] = useState<string[]>([]);
  const [simLog, setSimLog] = useState<{ time: string; message: string; type: 'info' | 'success' | 'exec' }[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [nodeSearch, setNodeSearch] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);

  // Sync when prop changes
  useEffect(() => {
    setWorkflow(initialWorkflow);
    // Auto-fit initial view
    fitView(initialWorkflow);
  }, [initialWorkflow]);

  // Fit view calculation
  const fitView = (wf: N8nWorkflow) => {
    if (!wf.nodes || wf.nodes.length === 0) return;
    const xs = wf.nodes.map(n => n.position[0]);
    const ys = wf.nodes.map(n => n.position[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const width = maxX - minX + 500;
    const height = maxY - minY + 400;

    const containerWidth = canvasRef.current ? canvasRef.current.clientWidth : 1000;
    const containerHeight = canvasRef.current ? canvasRef.current.clientHeight : 700;

    const newZoom = Math.min(1.1, Math.max(0.4, Math.min(containerWidth / width, containerHeight / height)));
    setZoom(newZoom);
    setPan({
      x: containerWidth / 2 - ((minX + maxX) / 2) * newZoom,
      y: containerHeight / 2 - ((minY + maxY) / 2) * newZoom
    });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    } else if (draggingNodeId && !isReadOnly) {
      const newX = Math.round((e.clientX - pan.x) / zoom - dragOffset.x);
      const newY = Math.round((e.clientY - pan.y) / zoom - dragOffset.y);

      setWorkflow(prev => ({
        ...prev,
        nodes: prev.nodes.map(node =>
          node.id === draggingNodeId
            ? { ...node, position: [newX, newY] }
            : node
        )
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(2.0, Math.max(0.3, zoom * zoomFactor));

    // Zoom towards cursor
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setPan({
        x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
        y: mouseY - (mouseY - pan.y) * (newZoom / zoom)
      });
    }
    setZoom(newZoom);
  };

  // Node Drag Start
  const handleNodeDragStart = (e: React.MouseEvent, node: N8nNode) => {
    e.stopPropagation();
    if (isReadOnly) return;
    setDraggingNodeId(node.id);
    setDragOffset({
      x: (e.clientX - pan.x) / zoom - node.position[0],
      y: (e.clientY - pan.y) / zoom - node.position[1]
    });
  };

  // Connection path calculation
  const nodeMap = useMemo(() => {
    const map = new Map<string, N8nNode>();
    workflow.nodes.forEach(n => {
      map.set(n.name, n);
      map.set(n.id, n);
    });
    return map;
  }, [workflow.nodes]);

  // Compute all wire connections
  const wires = useMemo(() => {
    const wireList: {
      id: string;
      sourceName: string;
      targetName: string;
      sourceNode: N8nNode;
      targetNode: N8nNode;
      type: string;
      color: string;
      path: string;
      sourcePos: { x: number; y: number };
      targetPos: { x: number; y: number };
    }[] = [];

    const getColorForType = (type: string) => {
      switch (type) {
        case 'ai_languageModel':
          return '#10b981'; // Emerald
        case 'ai_tool':
          return '#a855f7'; // Purple
        case 'ai_memory':
          return '#f59e0b'; // Amber
        case 'ai_vectorStore':
          return '#ec4899'; // Pink
        case 'ai_outputParser':
          return '#06b6d4'; // Cyan
        case 'ai_embedding':
          return '#84cc16'; // Lime
        case 'ai_document':
        case 'ai_textSplitter':
          return '#64748b'; // Slate
        case 'main':
        default:
          return '#f97316'; // n8n Orange
      }
    };

    if (!workflow.connections) return wireList;

    Object.entries(workflow.connections).forEach(([sourceName, outputs]) => {
      const sourceNode = nodeMap.get(sourceName);
      if (!sourceNode) return;

      Object.entries(outputs).forEach(([connType, targets]) => {
        targets.forEach((branch, branchIdx) => {
          branch.forEach((targetItem, targetIdx) => {
            const targetNode = nodeMap.get(targetItem.node);
            if (!targetNode) return;

            // Is source a sticky note?
            if (sourceNode.type === 'n8n-nodes-base.stickyNote' || targetNode.type === 'n8n-nodes-base.stickyNote') {
              return;
            }

            const NODE_WIDTH = 220;
            const NODE_HEIGHT = 70;

            // Source pin (Right center for main, bottom for AI tools)
            const isAiSubnode = connType.startsWith('ai_');
            let sx = sourceNode.position[0] + NODE_WIDTH;
            let sy = sourceNode.position[1] + NODE_HEIGHT / 2;

            // Target pin (Left center for main, bottom/top for AI tools)
            let tx = targetNode.position[0];
            let ty = targetNode.position[1] + NODE_HEIGHT / 2;

            if (isAiSubnode) {
              // Connect from bottom/top of source to bottom handle of target
              sx = sourceNode.position[0] + NODE_WIDTH / 2;
              sy = sourceNode.position[1];
              tx = targetNode.position[0] + 50 + (targetIdx * 30);
              ty = targetNode.position[1] + NODE_HEIGHT;
            }

            // Generate smooth cubic bezier curve
            const dx = Math.abs(tx - sx) * 0.5;
            const dy = Math.abs(ty - sy) * 0.5;
            const path = isAiSubnode
              ? `M ${sx} ${sy} C ${sx} ${sy - 60}, ${tx} ${ty + 60}, ${tx} ${ty}`
              : `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;

            wireList.push({
              id: `${sourceName}-${targetItem.node}-${connType}-${branchIdx}-${targetIdx}`,
              sourceName,
              targetName: targetItem.node,
              sourceNode,
              targetNode,
              type: connType,
              color: getColorForType(connType),
              path,
              sourcePos: { x: sx, y: sy },
              targetPos: { x: tx, y: ty }
            });
          });
        });
      });
    });

    return wireList;
  }, [workflow.connections, nodeMap]);

  // Run Simulation Tracer
  const handleRunSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setShowConsole(true);
    setSimLog([]);

    const addLog = (msg: string, type: 'info' | 'success' | 'exec' = 'info') => {
      const time = new Date().toLocaleTimeString();
      setSimLog(prev => [...prev, { time, message: msg, type }]);
    };

    addLog(`🚀 Initializing workflow test: "${workflow.name}"`, 'info');

    // Find trigger nodes
    const triggerNodes = workflow.nodes.filter(
      n => n.type.toLowerCase().includes('trigger') || n.type.toLowerCase().includes('webhook')
    );

    const nonStickyNodes = workflow.nodes.filter(n => n.type !== 'n8n-nodes-base.stickyNote');

    if (triggerNodes.length > 0) {
      addLog(`⚡ Found Trigger: ${triggerNodes.map(t => t.name).join(', ')}`, 'exec');
    } else {
      addLog(`⚡ Starting Manual Execution trigger`, 'exec');
    }

    // Sequentially activate nodes in order of X position
    const orderedNodes = [...nonStickyNodes].sort((a, b) => a.position[0] - b.position[0]);

    for (let i = 0; i < orderedNodes.length; i++) {
      const node = orderedNodes[i];
      setSimActiveNodes([node.id]);
      const meta = getNodeMeta(node.type);
      addLog(`▶ [${i + 1}/${orderedNodes.length}] Executing "${node.name}" (${meta.displayName})`, 'info');

      // Small delay per node
      await new Promise(r => setTimeout(r, 650));
      addLog(`✓ Output generated from "${node.name}" [1 item returned]`, 'success');
    }

    setSimActiveNodes([]);
    setIsSimulating(false);
    addLog(`🎉 Workflow execution finished successfully with 0 errors!`, 'success');
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(workflow, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (onDownloadJSON) {
      onDownloadJSON();
    } else {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(workflow, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${(workflow.name || 'workflow').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  // Add new node to canvas
  const handleAddNode = (typeKey: string) => {
    const meta = getNodeMeta(typeKey);
    const newNodeId = `node_${Date.now()}`;
    const newNode: N8nNode = {
      id: newNodeId,
      name: `${meta.displayName} ${workflow.nodes.length + 1}`,
      type: typeKey,
      typeVersion: 1,
      position: [Math.round(-pan.x / zoom + 400), Math.round(-pan.y / zoom + 250)],
      parameters: {}
    };

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
    setShowAddNodeModal(false);
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-slate-900 overflow-hidden select-none flex flex-col">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none gap-4">
        {/* Workflow Title & Stats */}
        <div className="pointer-events-auto bg-slate-900/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 px-4 shadow-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 to-rose-600 flex items-center justify-center text-white shadow-sm">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span className="truncate max-w-[280px] sm:max-w-md">{workflow.name || workflowName || 'Untitled Workflow'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {workflow.nodes.filter(n => n.type !== 'n8n-nodes-base.stickyNote').length} nodes
              </span>
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Add Node Button */}
          {!isReadOnly && (
            <button
              onClick={() => setShowAddNodeModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-orange-400" />
              <span className="hidden sm:inline">Add Node</span>
            </button>
          )}

          {/* Run Test Simulation Button */}
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-xl shadow-lg transition-all cursor-pointer ${
              isSimulating
                ? 'bg-amber-600 cursor-not-allowed animate-pulse'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20'
            }`}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating...' : 'Test Run'}</span>
          </button>

          {/* Copy JSON */}
          <button
            onClick={handleCopyJSON}
            title="Copy Workflow JSON"
            className="p-2 text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-xl shadow-lg transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Download JSON */}
          <button
            onClick={handleDownload}
            title="Download Workflow JSON"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 rounded-xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download JSON</span>
          </button>
        </div>
      </div>

      {/* Floating Canvas Navigation Controls (Zoom / Fit) */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-1.5 shadow-xl">
        <button
          onClick={() => setZoom(z => Math.min(2.0, z * 1.2))}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.3, z * 0.8))}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => fitView(workflow)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          title="Fit to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(0.85);
            setPan({ x: 150, y: 150 });
          }}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          title="Reset Canvas"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Connection Type Legend */}
      <div className="absolute bottom-6 left-6 z-20 hidden md:flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl px-3.5 py-2 shadow-xl text-[11px] text-slate-400 font-medium">
        <span className="font-semibold text-slate-300">Pins:</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500" /> Main Data
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Language Model
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-500" /> AI Tool
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> Memory
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-pink-500" /> Vector Store
        </span>
      </div>

      {/* Main Interactive Canvas Surface */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden bg-slate-950 canvas-bg"
        style={{
          backgroundImage: `radial-gradient(#334155 1px, transparent 1px)`,
          backgroundSize: `${32 * zoom}px ${32 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      >
        {/* Transformable Canvas Layer */}
        <div
          className="absolute origin-top-left pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: '10000px',
            height: '10000px'
          }}
        >
          {/* SVG Connection Cables Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <defs>
              <filter id="wire-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {wires.map(wire => (
              <g key={wire.id}>
                {/* Background Shadow Line */}
                <path
                  d={wire.path}
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="6"
                  strokeLinecap="round"
                  opacity="0.6"
                />
                {/* Main Color Line */}
                <path
                  d={wire.path}
                  fill="none"
                  stroke={wire.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={wire.type.startsWith('ai_') ? '6,4' : undefined}
                />
                {/* Animated Data Packet when simulating */}
                {isSimulating && (
                  <circle r="4" fill="#ffffff" filter="url(#wire-glow)">
                    <animateMotion
                      path={wire.path}
                      dur="1.4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            ))}
          </svg>

          {/* Sticky Notes Layer */}
          {workflow.nodes
            .filter(node => node.type === 'n8n-nodes-base.stickyNote')
            .map(note => {
              const width = (note.parameters as any)?.width || 320;
              const height = (note.parameters as any)?.height || 220;
              const content = (note.parameters as any)?.content || note.name || '';
              return (
                <div
                  key={note.id}
                  onMouseDown={e => handleNodeDragStart(e, note)}
                  style={{
                    transform: `translate(${note.position[0]}px, ${note.position[1]}px)`,
                    width: `${width}px`,
                    height: `${height}px`
                  }}
                  className="absolute pointer-events-auto rounded-2xl bg-amber-950/40 border-2 border-amber-500/40 backdrop-blur-sm p-4 overflow-y-auto text-xs text-amber-200/90 shadow-lg"
                >
                  <div className="font-bold text-amber-400 mb-2 flex items-center gap-1.5 uppercase text-[10px] tracking-wider border-b border-amber-500/20 pb-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Workflow Documentation Note</span>
                  </div>
                  <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed opacity-90">
                    {content}
                  </div>
                </div>
              );
            })}

          {/* Standard Functional Nodes Layer */}
          {workflow.nodes
            .filter(node => node.type !== 'n8n-nodes-base.stickyNote')
            .map(node => {
              const meta = getNodeMeta(node.type);
              const isSelected = selectedNode?.id === node.id;
              const isActiveSim = simActiveNodes.includes(node.id);

              return (
                <div
                  key={node.id}
                  onMouseDown={e => handleNodeDragStart(e, node)}
                  onClick={() => setSelectedNode(node)}
                  style={{
                    transform: `translate(${node.position[0]}px, ${node.position[1]}px)`,
                    width: '230px'
                  }}
                  className={`absolute pointer-events-auto rounded-2xl bg-slate-900/95 border-2 shadow-2xl p-3.5 transition-all duration-150 cursor-pointer ${
                    isActiveSim
                      ? 'border-emerald-400 shadow-emerald-500/30 scale-105 ring-4 ring-emerald-500/20'
                      : isSelected
                      ? 'border-orange-500 ring-4 ring-orange-500/20 shadow-orange-500/20'
                      : 'border-slate-800 hover:border-slate-600 hover:shadow-slate-800/60'
                  }`}
                >
                  {/* Left & Right Pin Handles */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-500 flex items-center justify-center shadow-md" />
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-orange-500 border-2 border-slate-900 shadow-md" />

                  {/* Node Header */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-sm shadow-md"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.displayName.charAt(0)}
                    </div>

                    <div className="overflow-hidden flex-1">
                      <h4 className="font-bold text-white text-xs truncate leading-snug">
                        {node.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
                        {meta.displayName}
                      </p>
                    </div>
                  </div>

                  {/* Node Badges & Parameters Preview */}
                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="capitalize px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {meta.category}
                    </span>
                    {node.credentials && Object.keys(node.credentials).length > 0 && (
                      <span className="text-emerald-400 flex items-center gap-1" title="Credentials Configured">
                        <Shield className="w-3 h-3" /> Auth
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Simulation Console Drawer */}
      {showConsole && (
        <div className="absolute bottom-0 left-0 right-0 z-30 max-h-64 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-2xl flex flex-col">
          <div className="p-3 px-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Simulation Execution Console</span>
              {isSimulating && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </div>
            <button
              onClick={() => setShowConsole(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 overflow-y-auto font-mono text-xs space-y-1.5 max-h-48 text-slate-300">
            {simLog.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-slate-500 shrink-0">[{log.time}]</span>
                <span
                  className={
                    log.type === 'success'
                      ? 'text-emerald-400 font-semibold'
                      : log.type === 'exec'
                      ? 'text-amber-400 font-bold'
                      : 'text-slate-300'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Node Modal */}
      {showAddNodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-white text-base">Add Node to Canvas</h3>
              </div>
              <button
                onClick={() => setShowAddNodeModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search 40+ trigger, AI, or integration nodes..."
                  value={nodeSearch}
                  onChange={e => setNodeSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(NODE_CATALOG)
                .filter(([key, meta]) =>
                  meta.displayName.toLowerCase().includes(nodeSearch.toLowerCase()) ||
                  meta.description.toLowerCase().includes(nodeSearch.toLowerCase()) ||
                  key.toLowerCase().includes(nodeSearch.toLowerCase())
                )
                .map(([typeKey, meta]) => (
                  <button
                    key={typeKey}
                    onClick={() => handleAddNode(typeKey)}
                    className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-orange-500/60 text-left transition-all flex items-start gap-3 cursor-pointer group"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-sm"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.displayName.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <h5 className="font-bold text-white text-xs group-hover:text-orange-400 truncate">
                        {meta.displayName}
                      </h5>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                        {meta.description}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Node Inspector Modal */}
      <NodeInspectorModal
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
};
