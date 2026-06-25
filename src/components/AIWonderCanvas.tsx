import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Save, Share2, MoreHorizontal, Clock, Plus, Search, 
  Trash2, X, ToggleLeft, ToggleRight, Database, ShieldAlert, 
  Zap, Cpu, Code, HelpCircle, Sparkles, Info, AlertTriangle, 
  Terminal, Layers, FileText, Check, Settings, Globe, Mail, 
  GitBranch, Filter, Split, MessageSquare, BookOpen, Download, 
  RefreshCw, ChevronDown, ChevronUp, Link, HelpCircle as HelpIcon,
  Copy, ExternalLink, Activity, ArrowRight, BarChart2, Briefcase, 
  Key, Sliders
} from 'lucide-react';
import { MemoryNode, NexusEvent, ModelName } from '../types';
import { cn, getOpenRouterModel } from '../utils';
import { CATALOG_MODELS } from './ModelsCatalog';
import { GoogleGenAI } from '@google/genai';
import { WORKFLOW_TEMPLATES, WorkflowTemplate } from '../data/workflowTemplates';
import { resolveExpressions, resolveConfig, ExpressionContext } from '../utils/expressionParser';

// Types for workflow node graph
export interface WorkflowNode {
  id: string;
  type: string;
  category: 'trigger' | 'app' | 'core' | 'ai' | 'dream_maker';
  label: string;
  x: number;
  y: number;
  config: {
    title?: string;
    description?: string;
    // Core parameters
    code?: string;
    webhookUrl?: string;
    scheduleInterval?: string;
    scheduleEnabled?: boolean;
    cronExpression?: string;
    model?: ModelName;
    systemPrompt?: string;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    promptTemplate?: string;
    httpMethod?: string;
    httpUrl?: string;
    httpHeaders?: string;
    httpBody?: string;
    conditionOperator?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'regex';
    conditionLeft?: string;
    conditionRight?: string;
    retryCount?: number;
    retryDelay?: number;
    continueOnError?: boolean;
    mockInputs?: Record<string, string>;
    mockOutputs?: Record<string, any>;
    useInTrainingSet?: boolean;
  };
  memoryId?: string; // Links to global memories
  useInTrainingSet?: boolean;
}

export interface WorkflowConnection {
  id: string;
  fromId: string;
  toId: string;
  isTrainingEdge?: boolean;
  fromPort?: 'true' | 'false';
}

interface AIWonderCanvasProps {
  memories: MemoryNode[];
  events: NexusEvent[];
  onAddMemory: (node: Omit<MemoryNode, 'id' | 'ts'> & { id?: string }) => void;
  onDeleteMemory: (id: string) => void;
  onClearEvents: () => void;
  onDismissEvent: (id: string) => void;
  currentTab?: 'aiwonder' | 'training' | 'creation';
  onTabChange?: (tab: 'models' | 'playground' | 'memory' | 'nexus' | 'docs' | 'aiwonder' | 'training' | 'creation') => void;
}

// Helper: convert schedule interval string to milliseconds
const scheduleIntervalToMs = (interval: string): number => {
  const map: Record<string, number> = {
    'every_1_min': 60 * 1000,
    'every_5_min': 5 * 60 * 1000,
    'every_15_min': 15 * 60 * 1000,
    'every_30_min': 30 * 60 * 1000,
    'every_1_hour': 60 * 60 * 1000,
    'every_2_hour': 2 * 60 * 60 * 1000,
    'every_6_hour': 6 * 60 * 60 * 1000,
    'every_12_hour': 12 * 60 * 60 * 1000,
    'every_day': 24 * 60 * 60 * 1000,
  };
  return map[interval] || 15 * 60 * 1000;
};

// Default initial nodes
const INITIAL_NODES: WorkflowNode[] = [
  {
    id: 'trigger-1',
    type: 'webhook',
    category: 'trigger',
    label: 'Webhook Trigger',
    x: 80,
    y: 220,
    config: {
      title: 'Webhook Listener',
      description: 'Accepts inbound telemetry payloads and triggers workflow sequence',
      webhookUrl: 'https://api.wonderland.ai/v1/webhooks/active-ingress',
      mockInputs: { payload: '{"event": "page_view", "url": "/checkout", "status": 200}' }
    }
  },
  {
    id: 'ai-agent-1',
    type: 'agent',
    category: 'ai',
    label: 'Nexus AI Agent',
    x: 360,
    y: 120,
    config: {
      title: 'Nexus Agent',
      description: 'Processes incoming errors and determines if they represent structural regressions',
      model: 'gemini-3-flash-preview',
      systemPrompt: 'You are an elite automated telemetry triage agent. Analyze errors and generate detailed Decision/Bug nodes.',
      temperature: 0.4,
      topP: 0.9,
      maxTokens: 1024,
      mockInputs: { error: 'TypeError: Cannot read properties of undefined (reading "map")' },
      mockOutputs: {
        status: 'success',
        analysis: 'Critical mapping bug identified in checkout component.',
        suggestedNode: 'bug',
        severity: 'high'
      }
    }
  },
  {
    id: 'rag-1',
    type: 'rag',
    category: 'ai',
    label: 'Vector Search DB',
    x: 360,
    y: 320,
    config: {
      title: 'RAG Knowledge Finder',
      description: 'Queries similar past bugs from the vector cluster index',
      promptTemplate: 'Find previous instances matching: {{error_message}}',
      mockInputs: { error_message: 'TypeError: Cannot read properties of undefined' },
      mockOutputs: {
        matches: [
          { score: 0.94, id: 'mem-92a', text: 'Checkout map fix deployed last Tuesday' }
        ]
      }
    }
  },
  {
    id: 'memory-decision-1',
    type: 'decision',
    category: 'dream_maker',
    label: 'Decision: Hotfix Trigger',
    x: 680,
    y: 100,
    config: {
      title: 'Auto-Trigger Hotfix Patch',
      description: 'Determines whether an automated rollback or cloud patch is needed'
    },
    memoryId: 'mem-dec-initial'
  },
  {
    id: 'memory-bug-1',
    type: 'bug',
    category: 'dream_maker',
    label: 'Bug: Null Mapping Error',
    x: 680,
    y: 280,
    config: {
      title: 'TypeError in AppContainer',
      description: 'Caused by asynchronous state loading delay'
    },
    memoryId: 'mem-bug-initial'
  }
];

const INITIAL_CONNECTIONS: WorkflowConnection[] = [
  { id: 'conn-1', fromId: 'trigger-1', toId: 'ai-agent-1' },
  { id: 'conn-2', fromId: 'trigger-1', toId: 'rag-1' },
  { id: 'conn-3', fromId: 'ai-agent-1', toId: 'memory-decision-1' },
  { id: 'conn-4', fromId: 'ai-agent-1', toId: 'memory-bug-1' }
];

export function AIWonderCanvas({
  memories,
  events,
  onAddMemory,
  onDeleteMemory,
  onClearEvents,
  onDismissEvent,
  currentTab = 'aiwonder',
  onTabChange
}: AIWonderCanvasProps) {
  // Navigation sidebar state (dashboard level)
  const [activeSidebarTab, setActiveSidebarTab] = useState<'workflows' | 'templates' | 'credentials' | 'executions' | 'variables' | 'insights'>('workflows');
  
  // Workflow core states
  const [nodes, setNodes] = useState<WorkflowNode[]>(INITIAL_NODES);
  const [connections, setConnections] = useState<WorkflowConnection[]>(INITIAL_CONNECTIONS);
  const [workflowTitle, setWorkflowTitle] = useState('Wonderland Telemetry Orchestrator');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Canvas Viewport transform states
  const [panX, setPanX] = useState(40);
  const [panY, setPanY] = useState(40);
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Node Dragging states
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartNodePos, setDragStartNodePos] = useState({ x: 0, y: 0 });

  // Adding nodes panel
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [addPanelSearch, setAddPanelSearch] = useState('');
  const [spawnCoords, setSpawnCoords] = useState<{ x: number; y: number } | null>(null);

  // Agent Creation Form States
  const [creationAgentName, setCreationAgentName] = useState('Wonder Reasoner v1');
  const [creationBaseModel, setCreationBaseModel] = useState<ModelName>('fugu-ultra');
  const [creationSystemPrompt, setCreationSystemPrompt] = useState('You are an expert multi-agent router optimized for AI-Wonder workflows.');
  const [creationToolWebSearch, setCreationToolWebSearch] = useState(true);
  const [creationToolCodeExecution, setCreationToolCodeExecution] = useState(false);
  const [creationToolVision, setCreationToolVision] = useState(false);
  const [creationToolMemory, setCreationToolMemory] = useState(true);

  // Connection drawing state
  const [connectingPin, setConnectingPin] = useState<{ nodeId: string; type: 'output' } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Node Detail View (NDV)
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [ndvActiveTab, setNdvActiveTab] = useState<'config' | 'test'>('config');

  // Memory Editor inside overlay
  const [activeMemoryNode, setActiveMemoryNode] = useState<MemoryNode | null>(null);
  const [memoryFormTitle, setMemoryFormTitle] = useState('');
  const [memoryFormType, setMemoryFormType] = useState<MemoryNode['type']>('decision');
  const [memoryFormContent, setMemoryFormContent] = useState('');

  // Bottom drawer states
  const [isBottomDrawerOpen, setIsBottomDrawerOpen] = useState(true);
  const [bottomDrawerTab, setBottomDrawerTab] = useState<'telemetry' | 'step_results' | 'execution_trace'>('telemetry');
  const [executionLog, setExecutionLog] = useState<string[]>(['[System] Orchestration Engine initialized.', '[Trigger] Webhook listener connected.']);
  const [selectedLogNodeId, setSelectedLogNodeId] = useState<string>('ai-agent-1');
  const [activeTelemetryChip, setActiveTelemetryChip] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [telemetrySearch, setTelemetrySearch] = useState('');

  // Gemini Diagnostic Fix in Bottom Drawer
  const [aiExplanations, setAiExplanations] = useState<Record<string, { explanation: string; fix: string; loading: boolean }>>({});

  // Execution outputs per node
  const [nodeOutputs, setNodeOutputs] = useState<Record<string, {
    status: 'idle' | 'running' | 'success' | 'error';
    output: string;
    timestamp: number;
    duration?: number;
    tokens?: number;
    error?: string;
  }>>({});
  const [executingNodeIds, setExecutingNodeIds] = useState<Set<string>>(new Set());

  // Notifications
  const [notification, setNotification] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  // Trigger quick notifications
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Sync initial Memory Core nodes with the app's memories if they don't exist
  useEffect(() => {
    const defaultMemories = [
      { id: 'mem-dec-initial', title: 'Auto-Trigger Hotfix Patch', type: 'decision' as const, content: 'Ruleset for evaluating automated Rollbacks. If severity is high and diagnostic confidence exceeds 85%, generate critical decision tree node and notify slack channel.' },
      { id: 'mem-bug-initial', title: 'TypeError in AppContainer', type: 'bug' as const, content: 'Asynchronous state loading delay on map() array render. Checked checkout container and added local boundary guards to prevent crash.' }
    ];
    defaultMemories.forEach(m => {
      if (!memories.some(exist => exist.id === m.id)) {
        onAddMemory(m);
      }
    });
  }, []);

  // Sync memory details when double clicked
  useEffect(() => {
    if (activeMemoryNode) {
      setMemoryFormTitle(activeMemoryNode.title);
      setMemoryFormType(activeMemoryNode.type);
      setMemoryFormContent(activeMemoryNode.content);
    }
  }, [activeMemoryNode]);

  // Handle zooming via wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.08;
    const rect = canvasWrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Mouse coordinates relative to canvas wrapper
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom Math to keep point under cursor
    const zoomFactor = e.deltaY < 0 ? (1 + zoomIntensity) : (1 - zoomIntensity);
    const newScale = Math.max(0.4, Math.min(1.8, scale * zoomFactor));

    const dx = mouseX - panX;
    const dy = mouseY - panY;

    setPanX(mouseX - dx * (newScale / scale));
    setPanY(mouseY - dy * (newScale / scale));
    setScale(newScale);
  };

  // Canvas Drag/Pan Event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    // If clicking on node or interface button, don't start panning
    const target = e.target as HTMLElement;
    if (target.closest('.node-box') || target.closest('button') || target.closest('input')) return;

    setIsPanning(true);
    setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasWrapperRef.current?.getBoundingClientRect();
    if (rect) {
      // Calculate cursor position inside canvas coords for line rendering
      const currentMouseX = (e.clientX - rect.left - panX) / scale;
      const currentMouseY = (e.clientY - rect.top - panY) / scale;
      setMousePos({ x: currentMouseX, y: currentMouseY });
    }

    if (isPanning) {
      setPanX(e.clientX - panStart.x);
      setPanY(e.clientY - panStart.y);
    } else if (draggedNodeId) {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;
      setNodes(prev => prev.map(n => n.id === draggedNodeId ? {
        ...n,
        x: Math.round(dragStartNodePos.x + dx),
        y: Math.round(dragStartNodePos.y + dy)
      } : n));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  // Double click canvas to summon Node Add Panel at specific grid coordinate
  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (currentTab !== 'aiwonder') return;
    const target = e.target as HTMLElement;
    if (target.closest('.node-box') || target.closest('button') || target.closest('input')) return;

    const rect = canvasWrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = (e.clientX - rect.left - panX) / scale;
    const clickY = (e.clientY - rect.top - panY) / scale;

    setSpawnCoords({ x: clickX, y: clickY });
    setIsAddPanelOpen(true);
  };

  // Start connecting pins
  const handleStartConnection = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentTab === 'training') return;
    setConnectingPin({ nodeId, type: 'output' });
  };

  // Complete connection on input pin click
  const handleConnectTo = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectingPin && connectingPin.nodeId !== nodeId) {
      // Avoid duplicate connections
      const exists = connections.some(c => c.fromId === connectingPin.nodeId && c.toId === nodeId);
      if (!exists) {
        const fromNode = nodes.find(n => n.id === connectingPin.nodeId);
        const existingFromConns = connections.filter(c => c.fromId === connectingPin.nodeId);
        const fromPort = fromNode?.type === 'if'
          ? (existingFromConns.length === 0 ? 'true' as const : 'false' as const)
          : undefined;
        const newConn: WorkflowConnection = {
          id: `conn-${Math.random().toString(36).substr(2, 9)}`,
          fromId: connectingPin.nodeId,
          toId: nodeId,
          fromPort,
        };
        setConnections(prev => [...prev, newConn]);
        setExecutionLog(prev => [...prev, `[System] Connection established: ${connectingPin.nodeId} → ${nodeId}`]);
        showNotification('Connection created');
      }
    }
    setConnectingPin(null);
  };

  // Drag handles for node
  const handleNodeDragStart = (node: WorkflowNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentTab === 'training') return;
    if (e.button !== 0) return;
    setDraggedNodeId(node.id);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragStartNodePos({ x: node.x, y: node.y });
  };

  // Handle double clicking any node to show the full screen/overlay NDV
  const handleNodeDoubleClick = (node: WorkflowNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.category === 'dream_maker') {
      // Find matching global memory node
      const matchingMem = memories.find(m => m.id === node.memoryId);
      if (matchingMem) {
        setActiveMemoryNode(matchingMem);
      } else {
        // Create matching memory
        const newMem: MemoryNode = {
          id: node.memoryId || `mem-${Math.random().toString(36).substr(2, 9)}`,
          title: node.config.title || node.label,
          type: node.type as any,
          content: node.config.description || '',
          ts: Date.now()
        };
        onAddMemory(newMem);
        setActiveMemoryNode(newMem);
      }
    } else {
      setSelectedNode(node);
      setNdvActiveTab('config');
    }
  };

  // Delete a node and its connections
  const handleDeleteNode = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.fromId !== nodeId && c.toId !== nodeId));
    showNotification('Node deleted');
    if (selectedNode?.id === nodeId) setSelectedNode(null);
  };

  // Add a new node of a specific type
  const handleAddNodeType = (type: string, category: WorkflowNode['category'], label: string) => {
    const spawnX = spawnCoords ? spawnCoords.x : Math.round(150 - panX / scale);
    const spawnY = spawnCoords ? spawnCoords.y : Math.round(200 - panY / scale);

    const nodeId = `${type}-${Math.random().toString(36).substr(2, 9)}`;
    const newMemoryId = category === 'dream_maker' ? `mem-${Math.random().toString(36).substr(2, 9)}` : undefined;

    // Create a linked global memory node if memory core type
    if (category === 'dream_maker') {
      onAddMemory({
        id: newMemoryId,
        title: label,
        type: type as any,
        content: `Diagnostic context log for ${label}. Complete system details and stack metrics go here.`,
      });
    }

    const newNode: WorkflowNode = {
      id: nodeId,
      type,
      category,
      label,
      x: spawnX,
      y: spawnY,
      config: {
        title: label,
        description: `Sleek fully decoupled workflow automation block for ${label}`,
        ...(type === 'agent' ? {
          model: 'gemini-3-flash-preview',
          systemPrompt: 'You are an AI-Wonder automated node agent...',
          temperature: 0.7,
          topP: 0.95
        } : {}),
        ...(type === 'http' ? {
          httpMethod: 'GET',
          httpUrl: 'https://api.example.com/data',
          httpHeaders: '{"Content-Type": "application/json"}',
          httpBody: '',
        } : {}),
        ...(type === 'if' ? {
          conditionOperator: 'equals',
          conditionLeft: '$input',
          conditionRight: 'true',
        } : {}),
        mockInputs: { payload: '{}' },
        mockOutputs: { status: 'success' }
      },
      memoryId: newMemoryId
    };

    setNodes(prev => [...prev, newNode]);
    // Auto-connect from previous trigger node if exists and only trigger
    if (nodes.length === 1 && nodes[0].category === 'trigger') {
      setConnections(prev => [...prev, {
        id: `conn-${Math.random().toString(36).substr(2, 9)}`,
        fromId: nodes[0].id,
        toId: nodeId
      }]);
    }

    setExecutionLog(prev => [...prev, `[System] Instantiated Node: ${label} (${type})`]);
    setIsAddPanelOpen(false);
    setSpawnCoords(null);
    showNotification(`${label} added to grid`);
  };

  // Import a template workflow
  const handleImportTemplate = (template: WorkflowTemplate) => {
    const offsetX = Math.round(100 - panX / scale);
    const offsetY = Math.round(100 - panY / scale);
    const newNodes = template.nodes.map(n => ({
      id: `${n.id}-${Math.random().toString(36).substr(2, 6)}`,
      type: n.type,
      category: n.category as WorkflowNode['category'],
      label: n.label,
      x: n.x + offsetX,
      y: n.y + offsetY,
      config: {
        title: n.label,
        description: `Imported from template: ${template.name}`,
        ...n.config
      }
    }));
    const idMap = new Map(template.nodes.map((n, i) => [n.id, newNodes[i].id]));
    const newConns = template.connections.map(c => ({
      id: `conn-${Math.random().toString(36).substr(2, 9)}`,
      fromId: idMap.get(c.fromId)!,
      toId: idMap.get(c.toId)!,
      fromPort: c.fromPort as 'true' | 'false' | undefined
    }));
    setNodes(prev => [...prev, ...newNodes]);
    setConnections(prev => [...prev, ...newConns]);
    setActiveSidebarTab('workflows');
    showNotification(`Imported template: ${template.name}`);
  };

  // Handle spawning a compiled agent from the Creation Form
  const handleSpawnCompiledAgent = () => {
    if (!creationAgentName.trim()) {
      showNotification('Agent Name is required.');
      return;
    }

    const spawnX = Math.round(550 - panX / scale);
    const spawnY = Math.round(200 - panY / scale);
    const agentNodeId = `ai-agent-${Math.random().toString(36).substr(2, 9)}`;

    const selectedSources = nodes.filter(n => n.category === 'dream_maker' && n.config.useInTrainingSet);

    const newAgentNode: WorkflowNode = {
      id: agentNodeId,
      type: 'agent',
      category: 'ai',
      label: creationAgentName,
      x: spawnX,
      y: spawnY,
      config: {
        title: creationAgentName,
        description: `Compiled AI agent powered by ${creationBaseModel}. Web Search: ${creationToolWebSearch ? 'ENABLED' : 'DISABLED'}.`,
        model: creationBaseModel,
        systemPrompt: creationSystemPrompt,
        temperature: 0.7,
        maxTokens: 2048,
        mockInputs: { query: 'Ingest training resources' },
        mockOutputs: { response: 'Ingested context successfully!' }
      }
    };

    setNodes(prev => [...prev, newAgentNode]);

    const newEdges: WorkflowConnection[] = selectedSources.map(source => ({
      id: `conn-training-${Math.random().toString(36).substr(2, 9)}`,
      fromId: source.id,
      toId: agentNodeId,
      isTrainingEdge: true
    }));

    if (newEdges.length > 0) {
      setConnections(prev => [...prev, ...newEdges]);
    }

    setExecutionLog(prev => [
      ...prev,
      `[System] Compiled & instantiated agent "${creationAgentName}" using base model ${creationBaseModel}`,
      ...selectedSources.map(s => `[System] Active ingestion connection established from Knowledge Base: "${s.config.title || s.label}"`)
    ]);

    showNotification(`Agent "${creationAgentName}" compiled & spawned!`);

    if (onTabChange) {
      setTimeout(() => {
        onTabChange('aiwonder');
      }, 1200);
    }
  };

  // Handle exporting the training set to a downloaded JSONL file
  const handleExportTrainingSet = () => {
    const selectedNodes = nodes.filter(n => n.category === 'dream_maker' && n.config.useInTrainingSet);
    if (selectedNodes.length === 0) {
      showNotification('No nodes selected for training set.');
      return;
    }

    const lines = selectedNodes.map(node => {
      const matchingMem = memories.find(m => m.id === node.memoryId);
      return JSON.stringify({
        id: node.id,
        type: node.type,
        title: node.config.title || node.label,
        content: matchingMem ? matchingMem.content : (node.config.description || '')
      });
    });

    const jsonlContent = lines.join('\n');
    const blob = new Blob([jsonlContent], { type: 'application/x-jsonlines' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_training_set_${Date.now()}.jsonl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Training set exported! File downloaded.');
  };

  // Save the custom linked memory inside overlay
  const handleSaveMemoryForm = () => {
    if (!activeMemoryNode) return;
    onAddMemory({
      id: activeMemoryNode.id,
      title: memoryFormTitle,
      type: memoryFormType,
      content: memoryFormContent
    });

    // Also update the matching node's label and type on the canvas
    setNodes(prev => prev.map(n => n.memoryId === activeMemoryNode.id ? {
      ...n,
      label: `${memoryFormType.toUpperCase()}: ${memoryFormTitle}`,
      type: memoryFormType,
      config: {
        ...n.config,
        title: memoryFormTitle,
        description: memoryFormContent
      }
    } : n));

    setActiveMemoryNode(null);
    showNotification('Memory Node synchronized');
  };

  // Save general parameters from standard NDV overlay
  const handleSaveNdvConfig = (updatedNode: WorkflowNode) => {
    setNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n));
    setSelectedNode(null);
    showNotification(`${updatedNode.config.title || updatedNode.label} config saved`);
  };

  // Execute a single AI node via OpenRouter
  const executeAINode = async (node: WorkflowNode, inputText: string): Promise<{ output: string; tokens?: number }> => {
    const openrouterKey = localStorage.getItem('mc_key_openrouter');
    const openrouterModel = getOpenRouterModel(node.config.model || '');

    if (!openrouterKey || !openrouterModel) {
      throw new Error(`No OpenRouter route for model ${node.config.model}`);
    }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
      },
      body: JSON.stringify({
        model: openrouterModel,
        messages: [
          ...(node.config.systemPrompt ? [{ role: 'system', content: node.config.systemPrompt }] : []),
          { role: 'user', content: inputText }
        ],
        temperature: node.config.temperature ?? 0.7,
        top_p: node.config.topP ?? 0.9,
        max_tokens: node.config.maxTokens ?? 2048,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || `OpenRouter HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      output: data.choices?.[0]?.message?.content || 'Empty response received.',
      tokens: data.usage?.total_tokens,
    };
  };

  // Get upstream input for a node based on connections
  const getNodeInput = (nodeId: string): string => {
    const upstreamConns = connections.filter(c => c.toId === nodeId);
    const upstreamOutputs = upstreamConns
      .map(c => nodeOutputs[c.fromId])
      .filter(Boolean);
    if (upstreamOutputs.length > 0) {
      return upstreamOutputs.map(o => o.output).join('\n\n');
    }
    // Fall back to mockInputs
    const node = nodes.find(n => n.id === nodeId);
    if (node?.config.mockInputs) {
      return Object.entries(node.config.mockInputs)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
    }
    return 'Execute workflow node.';
  };

  // Run the whole workflow
  const handleExecuteWorkflow = async () => {
    const startTime = Date.now();
    setExecutionLog(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] 🚀 Workflow execution started...`
    ]);

    // Get execution order: follow connections from triggers outward
    const executed = new Set<string>();
    const toExecute = nodes.filter(n => n.category === 'trigger').map(n => n.id);

    // Add any unconnected nodes too
    nodes.forEach(n => {
      if (!toExecute.includes(n.id)) toExecute.push(n.id);
    });

    setNodeOutputs({});

    try {
      for (const nodeId of toExecute) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node || executed.has(nodeId)) continue;
        executed.add(nodeId);

      setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ▶ Executing: ${node.label}...`]);
      setExecutingNodeIds(prev => new Set(prev).add(nodeId));

      const input = getNodeInput(nodeId);
      const maxRetries = node.config.retryCount ?? 0;
      const retryDelay = node.config.retryDelay ?? 1000;
      let lastError: any = null;
      let nodeSuccess = false;

      // Resolve expressions in config
      const exprCtx: ExpressionContext = {
        $node: Object.fromEntries(
          nodes.map(n => [n.label, { data: nodeOutputs[n.id]?.output, output: nodeOutputs[n.id]?.output || '' }])
        ),
        $json: (() => { try { return JSON.parse(input); } catch { return input; } })(),
        $items: [],
        $index: 0,
        $now: new Date().toISOString(),
        $today: new Date().toLocaleDateString(),
      };
      const cfg = resolveConfig(node.config, exprCtx);

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const nodeStart = Date.now();
        if (attempt > 0) {
          setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ♻️ Retry ${attempt}/${maxRetries} for ${node.label}...`]);
          await new Promise(r => setTimeout(r, retryDelay));
        }
        try {
          if (node.category === 'ai' && node.type === 'agent') {
            const result = await executeAINode({ ...node, config: cfg }, input);
            setNodeOutputs(prev => ({
              ...prev,
              [nodeId]: { status: 'success', output: result.output, timestamp: Date.now(), duration: Date.now() - nodeStart, tokens: result.tokens }
            }));
            setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ ${node.label} — ${result.tokens ? result.tokens + ' tokens' : 'success'} (${Date.now() - nodeStart}ms)`]);
          } else if (node.type === 'if') {
            const op = cfg.conditionOperator || 'equals';
            const left = cfg.conditionLeft || '$input';
            const right = cfg.conditionRight || 'true';
            const leftVal = left === '$input' ? input : left;
            let result = false;
            try {
              switch (op) {
                case 'equals': result = leftVal === right; break;
                case 'not_equals': result = leftVal !== right; break;
                case 'greater_than': result = parseFloat(leftVal) > parseFloat(right); break;
                case 'less_than': result = parseFloat(leftVal) < parseFloat(right); break;
                case 'contains': result = leftVal.includes(right); break;
                case 'starts_with': result = leftVal.startsWith(right); break;
                case 'regex': result = new RegExp(right).test(leftVal); break;
              }
            } catch { result = false; }
            const branch = result ? 'true' : 'false';
            setNodeOutputs(prev => ({
              ...prev,
              [nodeId]: { status: 'success', output: JSON.stringify({ branch, condition: `${leftVal} ${op} ${right} = ${result}` }), timestamp: Date.now(), duration: Date.now() - nodeStart }
            }));
            setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔀 ${node.label} → ${branch === 'true' ? 'True' : 'False'} (${Date.now() - nodeStart}ms)`]);
          } else if (node.type === 'code') {
            const code = cfg.code;
            if (!code) throw new Error('Code node has no JavaScript to execute');
            setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 💻 Executing code for ${node.label}...`]);
            const fn = new Function('$input', '$output', '$console', code);
            const mockConsole = { log: (...args: any[]) => console.log('[CodeNode]', ...args) };
            const result = fn(input, {}, mockConsole);
            const outputStr = result === undefined ? 'undefined' : (typeof result === 'string' ? result : JSON.stringify(result, null, 2));
            setNodeOutputs(prev => ({
              ...prev,
              [nodeId]: { status: 'success', output: outputStr, timestamp: Date.now(), duration: Date.now() - nodeStart }
            }));
            setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ ${node.label} — executed (${Date.now() - nodeStart}ms)`]);
          } else if (node.type === 'http') {
            const url = cfg.httpUrl;
            if (!url) throw new Error('HTTP URL is required');
            const method = cfg.httpMethod || 'GET';
            let headers: Record<string, string> = {};
            try { headers = JSON.parse(cfg.httpHeaders || '{}'); } catch {}
            const body = ['POST', 'PUT', 'PATCH'].includes(method) ? cfg.httpBody : undefined;

            setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🌐 ${method} ${url}`]);
            const res = await fetch(url, { method, headers, body });
            const responseText = await res.text();
            const output = JSON.stringify({
              status: res.status,
              statusText: res.statusText,
              headers: Object.fromEntries(res.headers.entries()),
              body: responseText,
            }, null, 2);

            setNodeOutputs(prev => ({
              ...prev,
              [nodeId]: { status: res.ok ? 'success' : 'error', output, timestamp: Date.now(), duration: Date.now() - nodeStart }
            }));
            setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ ${node.label} — HTTP ${res.status} (${Date.now() - nodeStart}ms)`]);
          } else if (node.type === 'loop_for') {
            const raw = cfg.loopItems || '[1, 2, 3]';
            let items: any[];
            try { items = JSON.parse(raw); }
            catch { items = raw.split(',').map(s => s.trim()); }
            if (!Array.isArray(items)) items = [items];
            setNodeOutputs(prev => ({
              ...prev,
              [nodeId]: { status: 'success', output: JSON.stringify(items, null, 2), timestamp: Date.now(), duration: Date.now() - nodeStart }
            }));
            setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔁 ${node.label} — ${items.length} items (${Date.now() - nodeStart}ms)`]);
          } else if (node.type === 'loop_while') {
            const conditionExpr = cfg.whileCondition || '$input < 5';
            const maxIter = cfg.whileMaxIterations ?? 100;
            const outputs: any[] = [];
            let iterations = 0;
            while (iterations < maxIter) {
              try {
                const fn = new Function('$input', `return Boolean(${conditionExpr})`);
                if (!fn(input)) break;
              } catch { break; }
              outputs.push(`iteration-${iterations + 1}`);
              iterations++;
            }
            setNodeOutputs(prev => ({
              ...prev,
              [nodeId]: { status: 'success', output: JSON.stringify({ iterations, outputs }, null, 2), timestamp: Date.now(), duration: Date.now() - nodeStart }
            }));
            setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔁 ${node.label} — ${iterations} iterations (${Date.now() - nodeStart}ms)`]);
          } else if (node.type === 'merge') {
            const mode = cfg.mergeMode || 'array';
            const upstreamConns = connections.filter(c => c.toId === nodeId);
            const upstreamOutputs = upstreamConns
              .map(c => nodeOutputs[c.fromId]?.output)
              .filter(Boolean);
            let merged = input;
            if (mode === 'array') {
              const arrays = upstreamOutputs.map(o => { try { return JSON.parse(o); } catch { return [o]; } }).flat();
              merged = JSON.stringify(arrays, null, 2);
            } else if (mode === 'object') {
              const objs = upstreamOutputs.map(o => { try { return JSON.parse(o); } catch { return {}; } });
              merged = JSON.stringify(Object.assign({}, ...objs), null, 2);
            }
            setNodeOutputs(prev => ({
              ...prev,
              [nodeId]: { status: 'success', output: merged, timestamp: Date.now(), duration: Date.now() - nodeStart }
            }));
            setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🔗 ${node.label} — merged ${upstreamOutputs.length} inputs (${Date.now() - nodeStart}ms)`]);
          } else if (node.type === 'split') {
            const mode = cfg.splitMode || 'first';
            let items: any[] = [];
            try { items = JSON.parse(input); } catch { items = [input]; }
            if (!Array.isArray(items)) items = [items];
            const output = mode === 'first' ? JSON.stringify(items[0], null, 2) : JSON.stringify(items, null, 2);
            setNodeOutputs(prev => ({
              ...prev,
              [nodeId]: { status: 'success', output, timestamp: Date.now(), duration: Date.now() - nodeStart }
            }));
            setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✂️ ${node.label} — ${items.length} items, mode: ${mode} (${Date.now() - nodeStart}ms)`]);
          } else {
            // Non-AI/HTTP/code nodes: pass input through as output
            setNodeOutputs(prev => ({
              ...prev,
              [nodeId]: { status: 'success', output: input, timestamp: Date.now(), duration: Date.now() - nodeStart }
            }));
            setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ ${node.label} — completed (${Date.now() - nodeStart}ms)`]);
          }
          nodeSuccess = true;
        } catch (err: any) {
          lastError = err;
          setNodeOutputs(prev => ({
            ...prev,
            [nodeId]: { status: 'error', output: '', timestamp: Date.now(), duration: Date.now() - nodeStart, error: err.message }
          }));
          setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ❌ ${node.label} — ${err.message} (${Date.now() - nodeStart}ms)`]);
        } finally {
          setExecutingNodeIds(prev => {
            const next = new Set(prev);
            next.delete(nodeId);
            return next;
          });
        }

        if (nodeSuccess) break; // exit retry loop on success

        // All retries exhausted — decide whether to continue or abort
        if (cfg.continueOnError) {
          setNodeOutputs(prev => ({
            ...prev,
            [nodeId]: { ...prev[nodeId], status: 'warning' }
          }));
          setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⚠️ ${node.label} — continuing despite error (${lastError?.message})`]);
          break;
        }
      } // end retry loop

      // If error was NOT handled by continueOnError, stop the workflow
      if (!nodeSuccess && !cfg.continueOnError) {
        throw lastError || new Error(`Node "${node.label}" failed`);
      }

      // Propagate output to downstream nodes (respect port routing for IF nodes)
      const downstream = connections.filter(c => c.fromId === nodeId);
      for (const conn of downstream) {
        // For IF nodes, only follow connections matching the branch
        if (node.type === 'if' && conn.fromPort) {
          const branchOutput = nodeOutputs[nodeId]?.output;
          let branchMatch = false;
          if (branchOutput) {
            try {
              const parsed = JSON.parse(branchOutput);
              branchMatch = parsed.branch === conn.fromPort;
            } catch {}
          }
          if (!branchMatch) {
            setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⏭ Skipping ${nodes.find(n => n.id === conn.toId)?.label || conn.toId} (port: ${conn.fromPort} doesn't match)`]);
            continue;
          }
        }
        if (!toExecute.includes(conn.toId)) toExecute.push(conn.toId);
      }
    } // end for

    const elapsed = Date.now() - startTime;
    setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🎯 Workflow complete (${elapsed}ms)`]);
    showNotification(`Workflow executed in ${elapsed}ms`);
  } catch (err: any) {
    setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🛑 Workflow aborted — ${err.message}`]);
    showNotification(`Workflow failed: ${err.message}`, 'error');
  } finally {
    setExecutingNodeIds(new Set());
  }
  };

  // Ref + effect for schedule/cron triggers
  const scheduleTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const executeWorkflowRef = useRef(handleExecuteWorkflow);
  executeWorkflowRef.current = handleExecuteWorkflow;
  const prevScheduleKeyRef = useRef('');

  useEffect(() => {
    const relevant = nodes.filter(n => n.type === 'schedule' || n.type === 'cron');
    const scheduleKey = relevant.map(n =>
      `${n.id}:${n.config.scheduleInterval}:${String(n.config.scheduleEnabled !== false)}`
    ).join('|');
    if (scheduleKey === prevScheduleKeyRef.current) return;
    prevScheduleKeyRef.current = scheduleKey;

    for (const timer of scheduleTimersRef.current.values()) clearInterval(timer);
    scheduleTimersRef.current.clear();
    for (const node of relevant) {
      if (node.config.scheduleEnabled === false) continue;
      const interval = node.type === 'schedule'
        ? scheduleIntervalToMs(node.config.scheduleInterval || 'every_15_min')
        : 15 * 60 * 1000;
      const timer = setInterval(() => {
        setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⏰ Schedule triggered: ${node.label}`]);
        executeWorkflowRef.current();
      }, interval);
      scheduleTimersRef.current.set(node.id, timer);
      setExecutionLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⏰ Schedule active: ${node.label} (every ${Math.round(interval/1000/60)}min)`]);
    }
    return () => {
      for (const timer of scheduleTimersRef.current.values()) clearInterval(timer);
      scheduleTimersRef.current.clear();
    };
  });

  // Gemini AI Analysis for bot telemetry errors
  const handleFetchAIAnalysis = async (ev: NexusEvent) => {
    if (aiExplanations[ev.id]) return;

    setAiExplanations(prev => ({
      ...prev,
      [ev.id]: { explanation: '', fix: '', loading: true }
    }));

    const callLLM = async (prompt: string) => {
      const openrouterKey = localStorage.getItem('mc_key_openrouter');
      if (openrouterKey) {
        const model = getOpenRouterModel('gemini-3-flash-preview') || 'google/gemini-2.0-flash-001';
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openrouterKey}` },
          body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.3 }),
        });
        if (res.ok) {
          const data = await res.json();
          return data.choices?.[0]?.message?.content || '';
        }
      }
      // Fallback to Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      return response.text || '';
    };

    try {
      const prompt = `You are an elite Site Reliability Engineer. 
Analyze the following runtime client-side event/error log:
- Message: ${ev.message}
- Severity: ${ev.severity}
- Type: ${ev.type}
- Source: ${ev.source || 'Unknown'}
- Line: ${ev.line || 'Unknown'}
- Stack: ${ev.stack || 'None'}

Limit response to 2 short sentences. Offer a precise diagnostic fix code snippet.
Respond ONLY in JSON matching this format:
{"explanation": "Brief cause and impact", "fix": "Code block or CLI fix"}`;

      const textResponse = await callLLM(prompt);
      const cleaned = textResponse.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      setAiExplanations(prev => ({
        ...prev,
        [ev.id]: {
          explanation: parsed.explanation || 'Analyzed telemetry anomaly.',
          fix: parsed.fix || 'Check system runtime context.',
          loading: false,
        }
      }));
    } catch (err) {
      setAiExplanations(prev => ({
        ...prev,
        [ev.id]: {
          explanation: 'Could not access AI diagnostics.',
          fix: 'Code: ' + (err instanceof Error ? err.message : 'Unknown error'),
          loading: false,
        }
      }));
    }
  };

  // Telemetry items filtered
  const filteredEvents = events.filter(e => {
    const matchesChip = activeTelemetryChip === 'all' || e.severity === activeTelemetryChip;
    const matchesSearch = e.message.toLowerCase().includes(telemetrySearch.toLowerCase()) ||
                          (e.source || '').toLowerCase().includes(telemetrySearch.toLowerCase());
    return matchesChip && matchesSearch;
  });

  return (
    <div className="flex-1 flex h-full bg-[#07080d] text-[#e8eaf6] select-none font-sans overflow-hidden relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-[#b8ff57] text-[#0a0a0a] text-xs font-mono px-4 py-2 rounded-md shadow-2xl z-50 flex items-center gap-2 border border-black/10">
          <Sparkles className="w-4 h-4 animate-bounce" />
          <span>{notification}</span>
        </div>
      )}

      {/* DASHBOARD-LEVEL LEFT SIDEBAR */}
      <aside className="w-56 border-r border-[#1f2235]/40 bg-[#0a0c14]/90 flex flex-col shrink-0 z-10 font-mono">
        {/* Workspace branding */}
        <div className="p-4 border-b border-[#1f2235]/30 bg-[#0d0e17]/80 flex items-center gap-2.5">
          <Activity className="w-4.5 h-4.5 text-[#b8ff57] animate-pulse" />
          <div>
            <div className="text-[10px] font-black text-[#e8eaf6] tracking-widest">AI-WONDER</div>
            <div className="text-[7.5px] text-[#5b5eff] uppercase tracking-tighter">Workflow Orchestration</div>
          </div>
        </div>

        {/* Dashboard Nav Sections */}
        <nav className="flex-1 p-3 space-y-1">
          {[
            { id: 'workflows', label: 'Workflows', icon: Layers },
            { id: 'templates', label: 'Templates', icon: Download },
            { id: 'credentials', label: 'Credentials', icon: Key },
            { id: 'executions', label: 'Executions', icon: Clock },
            { id: 'variables', label: 'Variables', icon: Sliders },
            { id: 'insights', label: 'Insights', icon: BarChart2 }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSidebarTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSidebarTab(tab.id as any);
                  showNotification(`Viewing ${tab.label}`);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-[11px] transition-all flex items-center justify-between rounded-sm",
                  isActive 
                    ? "bg-[#1f2235]/60 text-[#b8ff57] font-extrabold border-l-2 border-[#b8ff57] pl-2" 
                    : "text-[#5e6686] hover:text-[#e8eaf6] hover:bg-[#151828]/30"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </div>
                {tab.id === 'workflows' && (
                  <span className="text-[8px] bg-[#1f2235] text-[#b8ff57] px-1.5 py-0.2 rounded font-bold border border-[#b8ff57]/20">1</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Mini stats card in Sidebar */}
        <div className="p-4 border-t border-[#1f2235]/20 bg-[#08090f] text-[9px] text-[#4c5475] space-y-1.5">
          <div className="flex justify-between">
            <span>Grid Nodes:</span>
            <span className="text-white font-bold">{nodes.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Edges Linked:</span>
            <span className="text-[#b8ff57] font-bold">{connections.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Swarms Engaged:</span>
            <span className="text-emerald-500 font-bold">ACTIVE</span>
          </div>
        </div>
      </aside>

      {/* SIDEBAR PANEL (Templates, Credentials, etc.) */}
      {activeSidebarTab !== 'workflows' && (
        <div className="w-72 border-r border-[#1f2235]/40 bg-[#0c0e17] flex flex-col overflow-hidden shrink-0">
          {/* Templates panel */}
          {activeSidebarTab === 'templates' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <h3 className="text-[10px] text-[#b8ff57] uppercase tracking-widest font-bold">Workflow Templates</h3>
              <p className="text-[8px] text-[#4a5068]">Import a pre-built workflow to get started quickly.</p>
              {WORKFLOW_TEMPLATES.map(tpl => (
                <div
                  key={tpl.id}
                  className="bg-[#141624]/60 border border-[#1f2235]/40 rounded p-3 space-y-2 hover:border-[#b8ff57]/30 transition-all cursor-pointer group"
                  onClick={() => handleImportTemplate(tpl)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-[#e8eaf6] group-hover:text-[#b8ff57]">{tpl.name}</h4>
                    <Download className="w-3 h-3 text-[#4a5068] group-hover:text-[#b8ff57]" />
                  </div>
                  <p className="text-[8px] text-[#4a5068]">{tpl.description}</p>
                  <div className="text-[7px] text-[#5e6686]">{tpl.nodeCount} nodes</div>
                </div>
              ))}
            </div>
          )}
          {/* Credentials panel */}
          {activeSidebarTab === 'credentials' && (
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-[10px] text-[#b8ff57] uppercase tracking-widest font-bold">Credentials</h3>
              <p className="text-[7px] text-[#4a5068] mt-1">No credentials saved yet. Credential storage will be added in a future update.</p>
            </div>
          )}
          {/* Executions panel */}
          {activeSidebarTab === 'executions' && (
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-[10px] text-[#b8ff57] uppercase tracking-widest font-bold">Execution History</h3>
              <div className="mt-2 space-y-1">
                {executionLog.length === 0 && <p className="text-[7px] text-[#4a5068]">No executions yet. Run a workflow to see history.</p>}
                {executionLog.map((log, i) => (
                  <div key={i} className="text-[8px] text-[#808eb5] font-mono truncate border-b border-[#1f2235]/10 py-1">{log}</div>
                ))}
              </div>
            </div>
          )}
          {/* Variables panel */}
          {activeSidebarTab === 'variables' && (
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-[10px] text-[#b8ff57] uppercase tracking-widest font-bold">Variables</h3>
              <p className="text-[7px] text-[#4a5068] mt-1">Workflow variables will be available in a future update.</p>
            </div>
          )}
          {/* Insights panel */}
          {activeSidebarTab === 'insights' && (
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-[10px] text-[#b8ff57] uppercase tracking-widest font-bold">Insights</h3>
              <p className="text-[7px] text-[#4a5068] mt-1">{nodes.length} nodes, {connections.length} connections in current workflow.</p>
            </div>
          )}
        </div>
      )}

      {/* CORE WORKSPACE PANEL */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* TOP WORKFLOW WORKSPACE HEADER (All control buttons right aligned) */}
        <div className="h-14 border-b border-[#1f2235]/40 bg-[#0d0e17] px-6 flex items-center justify-between shrink-0 z-10 font-mono">
          {/* Left info */}
          <div className="flex items-center gap-3">
            <div className="bg-[#5b5eff]/10 p-1.5 border border-[#5b5eff]/20 rounded-sm">
              {currentTab === 'training' ? (
                <Terminal className="w-4 h-4 text-[#b8ff57]" />
              ) : currentTab === 'creation' ? (
                <Sparkles className="w-4 h-4 text-[#b04cff]" />
              ) : (
                <Layers className="w-4 h-4 text-[#5b5eff]" />
              )}
            </div>
            <div>
              {currentTab === 'training' ? (
                <>
                  <h2 className="text-xs font-bold tracking-wider uppercase text-[#b8ff57]">
                    Knowledge Training Sets
                  </h2>
                  <div className="text-[8px] text-[#4a5068] tracking-widest leading-none mt-1">
                    Select nodes on the canvas below to include in your training set
                  </div>
                </>
              ) : currentTab === 'creation' ? (
                <>
                  <h2 className="text-xs font-bold tracking-wider uppercase text-[#b04cff]">
                    Nexus Agent Spark Genesis
                  </h2>
                  <div className="text-[8px] text-[#4a5068] tracking-widest leading-none mt-1">
                    Configure parameters to compile and deploy a new live agent
                  </div>
                </>
              ) : isEditingTitle ? (
                <input
                  type="text"
                  value={workflowTitle}
                  onChange={(e) => setWorkflowTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  className="bg-[#141624] border border-[#5b5eff] px-2 py-0.5 text-xs text-[#e8eaf6] rounded focus:outline-none max-w-sm"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h2 
                    onClick={() => setIsEditingTitle(true)}
                    className="text-xs font-bold tracking-wider uppercase text-[#e8eaf6] cursor-pointer hover:text-[#b8ff57] transition-all"
                  >
                    {workflowTitle}
                  </h2>
                  <span className="text-[8px] bg-slate-900 px-1 py-0.5 text-[#5e6686] uppercase border border-[#1f2235] rounded-sm select-none">Double-click to edit</span>
                </div>
              )}
              {currentTab === 'aiwonder' && (
                <div className="text-[8px] text-[#4a5068] tracking-widest leading-none mt-1">
                  Node Graph Orchestrator // Last modified: Just now
                </div>
              )}
            </div>
          </div>

          {/* Right aligned actions bar */}
          <div className="flex items-center gap-3">
            {currentTab === 'aiwonder' ? (
              <>
                {/* Run button */}
                <button
                  onClick={handleExecuteWorkflow}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1.5 rounded-sm text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                >
                  <Play className="w-3 h-3 fill-black" />
                  <span>RUN</span>
                </button>

                {/* Save Button */}
                <button
                  onClick={() => showNotification('Workflow saved locally!')}
                  className="bg-[#141624] hover:bg-[#1c1f32] border border-[#1f2235] text-[#e8eaf6] px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3 h-3" />
                  <span>SAVE</span>
                </button>

                {/* Active/Inactive Toggle switch */}
                <div className="flex items-center gap-2 bg-[#141624]/60 px-3 py-1 rounded-sm border border-[#1f2235] select-none">
                  <span className="text-[8px] tracking-widest text-[#4a5068] uppercase font-bold">Active</span>
                  <button 
                    onClick={() => {
                      setIsActive(!isActive);
                      showNotification(isActive ? 'Workflow deactivated' : 'Workflow activated');
                    }}
                    className="text-[#b8ff57] transition-colors"
                  >
                    {isActive ? (
                      <ToggleRight className="w-5.5 h-5.5 text-[#b8ff57]" />
                    ) : (
                      <ToggleLeft className="w-5.5 h-5.5 text-gray-600" />
                    )}
                  </button>
                </div>

                {/* Share button */}
                <button
                  onClick={() => showNotification('Share link copied to clipboard!')}
                  className="bg-[#141624] hover:bg-[#1c1f32] border border-[#1f2235] text-[#5e6686] hover:text-[#e8eaf6] p-1.5 rounded-sm transition-all"
                  title="Share Workflow"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>

                {/* Execution History clock toggle */}
                <button
                  onClick={() => setIsBottomDrawerOpen(!isBottomDrawerOpen)}
                  className={cn(
                    "border p-1.5 rounded-sm transition-all relative",
                    isBottomDrawerOpen 
                      ? "bg-[#b8ff57]/10 border-[#b8ff57] text-[#b8ff57]" 
                      : "bg-[#141624] border-[#1f2235] text-[#5e6686] hover:text-[#e8eaf6]"
                  )}
                  title="Toggle Bottom Execution Log Drawer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {isBottomDrawerOpen && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  )}
                </button>

                {/* Three dot menu */}
                <button
                  onClick={() => showNotification('Exported settings to console')}
                  className="bg-[#141624] hover:bg-[#1c1f32] border border-[#1f2235] text-[#5e6686] hover:text-[#e8eaf6] p-1.5 rounded-sm transition-all"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </>
            ) : currentTab === 'training' ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#808eb5]">
                  Selected: <strong className="text-[#b8ff57]">{nodes.filter(n => n.category === 'dream_maker' && n.config.useInTrainingSet).length} nodes</strong>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#b04cff] font-bold">Genesis Ready</span>
              </div>
            )}
          </div>
        </div>

        {/* WORKSPACE MIDDLE AREA: CANVAS WORKFLOW */}
        <div className="flex-1 flex min-h-0 relative overflow-hidden bg-[#05060a]">
          
          {/* Canvas Column */}
          <div className="flex-1 relative overflow-hidden">
            {/* Canvas Wrapper */}
            <div
              ref={canvasWrapperRef}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onDoubleClick={handleCanvasDoubleClick}
              className="absolute inset-0 cursor-grab active:cursor-grabbing overflow-hidden"
            >
              {/* Grid background and SVG Connections container */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
                  transformOrigin: '0 0',
                }}
              >
                {/* Point grid background pattern */}
                <div 
                  className="absolute inset-0 w-[5000px] h-[5000px] -translate-x-[2500px] -translate-y-[2500px]"
                  style={{
                    backgroundImage: 'radial-gradient(#1f2235 1.5px, transparent 1.5px)',
                    backgroundSize: '24px 24px',
                    opacity: 0.65
                  }}
                />

                {/* Connections SVG curves overlay */}
                <svg className="absolute overflow-visible pointer-events-none" style={{ width: '1px', height: '1px' }}>
                  {connections.map(conn => {
                    const fromNode = nodes.find(n => n.id === conn.fromId);
                    const toNode = nodes.find(n => n.id === conn.toId);
                    if (!fromNode || !toNode) return null;

                    // Pins coordinates relative to node position
                    const x1 = fromNode.x + 200;
                    const y1 = fromNode.y + 36;
                    const x2 = toNode.x;
                    const y2 = toNode.y + 36;

                    // Curved horizontal horizontal path Bezier logic
                    const dx = Math.abs(x2 - x1) * 0.5;
                    const pathString = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                    return (
                      <g key={conn.id}>
                        {/* Connection Shadow Glow */}
                        <path
                          d={pathString}
                          fill="none"
                          stroke={conn.isTrainingEdge ? '#10b981' : '#5b5eff'}
                          strokeWidth={conn.isTrainingEdge ? "6" : "5"}
                          className="opacity-20"
                        />
                        {/* Interactive Connection Core Line */}
                        <path
                          d={pathString}
                          fill="none"
                          stroke={conn.isTrainingEdge ? '#10b981' : (fromNode.category === 'dream_maker' ? '#b8ff57' : '#5b5eff')}
                          strokeWidth={conn.isTrainingEdge ? "3" : "2"}
                          strokeDasharray={conn.isTrainingEdge ? "5 5" : (connectingPin ? "4 2" : "none")}
                          className="transition-all hover:stroke-red-500 hover:stroke-[3px] pointer-events-auto cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConnections(prev => prev.filter(c => c.id !== conn.id));
                            showNotification('Connection severed');
                          }}
                        />
                        {/* Flow direction dot */}
                        <circle
                          cx={(x1 + x2) / 2}
                          cy={(y1 + y2) / 2}
                          r="3.5"
                          fill={fromNode.category === 'dream_maker' ? '#0a0a0a' : '#b8ff57'}
                          stroke={fromNode.category === 'dream_maker' ? '#b8ff57' : '#5b5eff'}
                          strokeWidth="1.5"
                          className="animate-pulse"
                        />
                        {/* Port label for IF/Switch nodes */}
                        {conn.fromPort && (
                          <text
                            x={(x1 + x2) / 2 - 6}
                            y={(y1 + y2) / 2 - 8}
                            fill={conn.fromPort === 'true' ? '#00e5a0' : '#ff6b6b'}
                            fontSize="9"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {conn.fromPort === 'true' ? 'T✔' : 'F✘'}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Live temporary connection string line */}
                  {connectingPin && (() => {
                    const srcNode = nodes.find(n => n.id === connectingPin.nodeId);
                    if (!srcNode) return null;
                    const x1 = srcNode.x + 200;
                    const y1 = srcNode.y + 36;
                    const dx = Math.abs(mousePos.x - x1) * 0.4;
                    const pathString = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${mousePos.x - dx} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`;
                    return (
                      <path
                        d={pathString}
                        fill="none"
                        stroke="#b8ff57"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                      />
                    );
                  })()}
                </svg>
              </div>

              {/* Draggable workflow Nodes in Inner Coordinate Container */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
                  transformOrigin: '0 0',
                }}
              >
                {nodes.map(node => {
                  const isSelected = selectedNode?.id === node.id || selectedLogNodeId === node.id;
                  
                  // Styling colors per category
                  const CATEGORY_STYLES = {
                    trigger: 'border-l-4 border-l-[#5b5eff] border-[#1e2235]/60 hover:border-[#5b5eff]/70 bg-[#0c0d16]',
                    app: 'border-l-4 border-l-[#ffad33] border-[#1e2235]/60 hover:border-[#ffad33]/70 bg-[#0e0d14]',
                    core: 'border-l-4 border-l-[#00e5a0] border-[#1e2235]/60 hover:border-[#00e5a0]/70 bg-[#090f12]',
                    ai: 'border-l-4 border-l-[#b04cff] border-[#1e2235]/60 hover:border-[#b04cff]/70 bg-[#0d0c15]',
                    dream_maker: 'border-l-4 border-l-[#b8ff57] border-[#1e2235]/60 hover:border-[#b8ff57]/70 bg-[#0a0f0d]'
                  };

                  const CATEGORY_DOTS = {
                    trigger: 'bg-[#5b5eff]',
                    app: 'bg-[#ffad33]',
                    core: 'bg-[#00e5a0]',
                    ai: 'bg-[#b04cff]',
                    dream_maker: 'bg-[#b8ff57]'
                  };

                  return (
                    <div
                      key={node.id}
                      onMouseDown={(e) => handleNodeDragStart(node, e)}
                      onDoubleClick={(e) => handleNodeDoubleClick(node, e)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLogNodeId(node.id);
                      }}
                      style={{
                        left: node.x,
                        top: node.y,
                        width: '200px',
                      }}
                      className={cn(
                        "node-box absolute select-none pointer-events-auto rounded-md shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-shadow border text-left p-3 flex flex-col gap-1 cursor-grab active:cursor-grabbing",
                        CATEGORY_STYLES[node.category],
                        isSelected ? "ring-2 ring-[#b8ff57] border-transparent shadow-[0_0_15px_rgba(184,255,87,0.15)]" : ""
                      )}
                    >
                      {/* Input Pin */}
                      {node.category !== 'trigger' && currentTab !== 'training' && (
                        <div
                          onClick={(e) => handleConnectTo(node.id, e)}
                          className="absolute left-[-6px] top-[32px] w-3 h-3 rounded-full border border-[#1f2235] bg-[#07080d] hover:bg-[#b8ff57] transition-all flex items-center justify-center cursor-pointer group"
                          title="Connect output line here"
                        >
                          <div className="w-1 h-1 rounded-full bg-slate-500 group-hover:bg-[#07080d]" />
                        </div>
                      )}

                      {/* Node Info Content */}
                      <div className="flex items-start justify-between min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn("w-2 h-2 rounded-full", CATEGORY_DOTS[node.category])} />
                          <span className="text-[10px] font-mono tracking-widest text-[#5e6686] uppercase font-bold">
                            {node.category === 'dream_maker' ? 'MEMORY' : node.category.toUpperCase()}
                          </span>
                        </div>

                        {/* Delete node option */}
                        {currentTab !== 'training' && (
                          <button
                            onClick={(e) => handleDeleteNode(node.id, e)}
                            className="p-1 hover:bg-red-500/10 text-[#4c5475] hover:text-red-500 rounded transition-colors"
                            title="Delete node"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <h4 className="text-[11px] font-mono text-[#e8eaf6] font-extrabold truncate">
                        {node.config.title || node.label}
                      </h4>

                      <p className="text-[9px] text-[#4c5475] font-mono leading-relaxed truncate">
                        {node.config.description || 'No description config'}
                      </p>

                      {/* Training Set Checkbox/Toggle */}
                      {node.category === 'dream_maker' && (
                        <div 
                          onMouseDown={(e) => e.stopPropagation()} 
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 border-t border-[#1f2235]/40 pt-1.5 flex items-center gap-1.5 pointer-events-auto"
                        >
                          <input
                            type="checkbox"
                            id={`chk-${node.id}`}
                            checked={!!node.config.useInTrainingSet}
                            onChange={(e) => {
                              const val = e.target.checked;
                              setNodes(prev => prev.map(n => n.id === node.id ? {
                                ...n,
                                useInTrainingSet: val,
                                config: { ...n.config, useInTrainingSet: val }
                              } : n));
                              showNotification(val ? 'Added to training set' : 'Removed from training set');
                            }}
                            className="rounded border-[#1f2235] bg-[#0c0e17] text-[#b8ff57] focus:ring-0 w-3 h-3 cursor-pointer"
                          />
                          <label 
                            htmlFor={`chk-${node.id}`}
                            className="text-[8px] text-[#808eb5] font-mono select-none cursor-pointer hover:text-[#b8ff57]"
                          >
                            Use in training set
                          </label>
                        </div>
                      )}

                      {/* Output Pin */}
                      {currentTab !== 'training' && (
                        <div
                          onMouseDown={(e) => handleStartConnection(node.id, e)}
                          className="absolute right-[-6px] top-[32px] w-3 h-3 rounded-full border border-[#1f2235] bg-[#07080d] hover:bg-[#b8ff57] transition-all flex items-center justify-center cursor-pointer group"
                          title="Drag connection from here"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-[#5b5eff] group-hover:bg-[#07080d]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Floating Instructions & Zoom controls inside Canvas */}
            <div className="absolute left-6 bottom-6 flex items-center gap-2 pointer-events-auto bg-[#0a0c14]/90 border border-[#1f2235]/40 p-2 rounded shadow-2xl z-20 font-mono text-[9px] text-[#5e6686]">
              <button onClick={() => setScale(prev => Math.max(0.4, prev - 0.1))} className="px-2 py-1 bg-[#141624] hover:text-white rounded border border-[#1f2235]">-</button>
              <span>{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(prev => Math.min(1.8, prev + 0.1))} className="px-2 py-1 bg-[#141624] hover:text-white rounded border border-[#1f2235]">+</button>
              <button onClick={() => { setPanX(40); setPanY(40); setScale(1); }} className="px-2 py-1 bg-[#141624] hover:text-[#b8ff57] rounded border border-[#1f2235]">Reset View</button>
              <div className="border-l border-[#1f2235]/40 h-4 mx-1" />
              <span className="text-[#4c5475]">Double-click empty canvas to add nodes // Double-click nodes to edit</span>
            </div>

            {/* Summon "+" FAB Button on canvas */}
            {currentTab === 'aiwonder' && (
              <button
                onClick={() => {
                  setSpawnCoords(null);
                  setIsAddPanelOpen(true);
                }}
                className="absolute right-6 bottom-6 w-10 h-10 rounded-full bg-[#5b5eff] hover:bg-[#4b4edd] text-white flex items-center justify-center shadow-[0_0_15px_rgba(91,94,255,0.4)] hover:scale-105 transition-all z-20"
                title="Summon Node Tray"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Training Set Side Panel */}
          {currentTab === 'training' && (
            <div className="w-[360px] border-l border-[#1f2235]/60 bg-[#0a0c14]/95 flex flex-col font-mono z-20 shrink-0 h-full overflow-hidden">
              <div className="p-4 border-b border-[#1f2235]/40 bg-[#0d0f19] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#b8ff57]" />
                  <span className="text-xs font-bold tracking-wider text-[#e8eaf6] uppercase">Training Set Compiler</span>
                </div>
                <span className="text-[10px] bg-[#b8ff57]/15 text-[#b8ff57] px-2 py-0.5 rounded-full font-bold border border-[#b8ff57]/20">
                  {nodes.filter(n => n.category === 'dream_maker' && n.config.useInTrainingSet).length} Active
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                <div className="text-[10px] text-[#5e6686] uppercase tracking-wider mb-2 leading-relaxed">
                  // Select memory nodes on the left canvas to package them into an offline-first cognitive dataset.
                </div>

                {/* Selected Items List */}
                <div className="space-y-2">
                  {nodes.filter(n => n.category === 'dream_maker' && n.config.useInTrainingSet).length === 0 ? (
                    <div className="border border-[#1f2235]/30 bg-[#0d0e17]/50 rounded p-6 text-center text-[#4c5475] space-y-2">
                      <Activity className="w-6 h-6 mx-auto opacity-30 text-[#808eb5]" />
                      <div className="text-[10px] uppercase tracking-widest font-bold">No sources selected</div>
                      <p className="text-[9px] leading-relaxed text-[#4c5475]">
                        Use the "Use in training set" checkbox on any Memory node (Decision, Bug, Pattern, Context, etc.) on the canvas to include it here.
                      </p>
                    </div>
                  ) : (
                    nodes.filter(n => n.category === 'dream_maker' && n.config.useInTrainingSet).map(node => {
                      const matchingMem = memories.find(m => m.id === node.memoryId);
                      return (
                        <div 
                          key={node.id} 
                          className="border border-[#1f2235]/50 bg-[#0d0e17] rounded p-2.5 flex items-start justify-between gap-3 group hover:border-[#b8ff57]/40 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] bg-[#1a1c2e] border border-[#1f2235] text-[#b8ff57] px-1 py-0.2 rounded font-mono uppercase tracking-widest leading-none">
                                {node.type.toUpperCase()}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold truncate block leading-none">
                                {node.config.title || node.label}
                              </span>
                            </div>
                            <p className="text-[9px] text-[#4c5475] font-mono leading-relaxed mt-1 line-clamp-2">
                              {matchingMem ? matchingMem.content : (node.config.description || 'No content parsed')}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setNodes(prev => prev.map(n => n.id === node.id ? {
                                ...n,
                                useInTrainingSet: false,
                                config: { ...n.config, useInTrainingSet: false }
                              } : n));
                              showNotification('Removed from training set');
                            }}
                            className="p-1 hover:bg-red-500/10 text-[#4c5475] hover:text-red-500 rounded transition-colors shrink-0"
                            title="Exclude from training set"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Actions Panel */}
              <div className="p-4 border-t border-[#1f2235]/40 bg-[#0d0f19] shrink-0 space-y-2">
                <button
                  onClick={handleExportTrainingSet}
                  disabled={nodes.filter(n => n.category === 'dream_maker' && n.config.useInTrainingSet).length === 0}
                  className="w-full bg-[#b8ff57] hover:bg-[#a5e64e] disabled:bg-[#141624] disabled:text-[#4c5475] disabled:border-[#1f2235] border border-black/10 text-black py-2 rounded font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSONL Dataset</span>
                </button>
                <div className="text-[8px] text-center text-[#4c5475] tracking-widest leading-none mt-1 uppercase">
                  Generated as application/x-jsonlines
                </div>
              </div>
            </div>
          )}

          {/* Agent Spark Compiler / Creation Side Panel */}
          {currentTab === 'creation' && (
            <div className="w-[360px] border-l border-[#1f2235]/60 bg-[#0a0c14]/95 flex flex-col font-mono z-20 shrink-0 h-full overflow-hidden">
              <div className="p-4 border-b border-[#1f2235]/40 bg-[#0d0f19] flex items-center gap-2 shrink-0">
                <Sparkles className="w-4 h-4 text-[#b04cff]" />
                <span className="text-xs font-bold tracking-wider text-[#e8eaf6] uppercase">Agent Compiler</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                <div className="text-[10px] text-[#5e6686] uppercase tracking-wider mb-2 leading-relaxed">
                  // Compile and instantiate a new autonomous routing agent node directly onto the active workspace.
                </div>

                {/* Form Input fields */}
                <div className="space-y-3.5">
                  {/* Agent Name */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-[#808eb5] block font-bold">Agent Identifier Name</label>
                    <input
                      type="text"
                      value={creationAgentName}
                      onChange={(e) => setCreationAgentName(e.target.value)}
                      className="w-full bg-[#0c0e17] border border-[#1f2235] rounded px-3 py-1.5 text-xs text-[#e8eaf6] focus:outline-none focus:border-[#b04cff] transition-colors"
                      placeholder="e.g., Fugu Reasoner Node"
                    />
                  </div>

                  {/* Base Model Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-[#808eb5] block font-bold">Base Model Engine</label>
                    <select
                      value={creationBaseModel}
                      onChange={(e) => setCreationBaseModel(e.target.value as ModelName)}
                      className="w-full bg-[#0c0e17] border border-[#1f2235] rounded px-2.5 py-1.5 text-xs text-[#e8eaf6] focus:outline-none focus:border-[#b04cff] transition-colors cursor-pointer"
                    >
                      {CATALOG_MODELS.filter(m => m.modality === 'Text').map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.contextSize})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* System Prompt */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-[#808eb5] block font-bold">Base System Instructions</label>
                    <textarea
                      value={creationSystemPrompt}
                      onChange={(e) => setCreationSystemPrompt(e.target.value)}
                      rows={4}
                      className="w-full bg-[#0c0e17] border border-[#1f2235] rounded p-2.5 text-xs text-[#e8eaf6] focus:outline-none focus:border-[#b04cff] transition-colors resize-none scrollbar-thin leading-normal"
                      placeholder="Provide clear system constraints and agentic instructions..."
                    />
                  </div>

                  {/* Tool Access */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-[#808eb5] block font-bold">System Tool Integrations</label>
                    <div className="border border-[#1f2235]/40 bg-[#0d0e17]/50 rounded p-2.5 space-y-2">
                      {[
                        { label: 'Web Search Grounding', checked: creationToolWebSearch, setter: setCreationToolWebSearch },
                        { label: 'Code Sandbox Execution', checked: creationToolCodeExecution, setter: setCreationToolCodeExecution },
                        { label: 'Vision Pipeline', checked: creationToolVision, setter: setCreationToolVision },
                        { label: 'Episodic Memory Recall', checked: creationToolMemory, setter: setCreationToolMemory },
                      ].map((tool, idx) => (
                        <label key={idx} className="flex items-center gap-2 cursor-pointer group select-none">
                          <input
                            type="checkbox"
                            checked={tool.checked}
                            onChange={(e) => tool.setter(e.target.checked)}
                            className="rounded border-[#1f2235] bg-[#0c0e17] text-[#b04cff] focus:ring-0 w-3 h-3 cursor-pointer"
                          />
                          <span className="text-[9px] text-[#808eb5] group-hover:text-[#b04cff] transition-colors">
                            {tool.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Training Sources count view */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-[#808eb5] block font-bold">Active Training Sources</label>
                    <div className="border border-[#1f2235]/40 bg-[#0d0e17]/50 rounded p-2.5 text-[9px] text-[#4c5475] space-y-1.5 font-mono">
                      {nodes.filter(n => n.category === 'dream_maker' && n.config.useInTrainingSet).length === 0 ? (
                        <div className="text-[#4c5475] italic">// No active training sources selected in Training set. It will compile without custom cognitive overrides.</div>
                      ) : (
                        <>
                          <div className="text-[#b8ff57] font-bold uppercase tracking-widest">
                            Ingesting {nodes.filter(n => n.category === 'dream_maker' && n.config.useInTrainingSet).length} Knowledge Sources:
                          </div>
                          <ul className="list-disc list-inside space-y-1 pl-1">
                            {nodes.filter(n => n.category === 'dream_maker' && n.config.useInTrainingSet).map(n => (
                              <li key={n.id} className="truncate text-slate-300">
                                {n.config.title || n.label}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Compile trigger */}
              <div className="p-4 border-t border-[#1f2235]/40 bg-[#0d0f19] shrink-0">
                <button
                  onClick={handleSpawnCompiledAgent}
                  className="w-full bg-[#b04cff] hover:bg-[#a133ff] text-white py-2 rounded font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(176,76,255,0.25)] hover:scale-[1.01]"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Compile & Spawn Agent</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM EXECUTION LOG DRAWER (SEAMLESS TELEMETRY + ACTION RUN HISTORY) */}
        {currentTab === 'aiwonder' && isBottomDrawerOpen && (
          <div className="h-64 border-t border-[#1f2235]/40 bg-[#07080d] flex flex-col shrink-0 z-10 overflow-hidden relative">
            
            {/* Drawer Tab Header */}
            <div className="h-10 border-b border-[#1f2235]/20 bg-[#0c0d15] px-6 flex items-center justify-between font-mono shrink-0 select-none">
              <div className="flex gap-4">
                <button
                  onClick={() => setBottomDrawerTab('telemetry')}
                  className={cn(
                    "text-[10px] tracking-wider uppercase font-bold transition-all",
                    bottomDrawerTab === 'telemetry' ? "text-[#b8ff57] border-b-2 border-[#b8ff57] pb-1" : "text-[#5e6686] hover:text-[#e8eaf6]"
                  )}
                >
                  📡 Nexus Telemetry stream ({filteredEvents.length})
                </button>
                <button
                  onClick={() => setBottomDrawerTab('step_results')}
                  className={cn(
                    "text-[10px] tracking-wider uppercase font-bold transition-all",
                    bottomDrawerTab === 'step_results' ? "text-[#b8ff57] border-b-2 border-[#b8ff57] pb-1" : "text-[#5e6686] hover:text-[#e8eaf6]"
                  )}
                >
                  📋 Node Output JSON
                </button>
                <button
                  onClick={() => setBottomDrawerTab('execution_trace')}
                  className={cn(
                    "text-[10px] tracking-wider uppercase font-bold transition-all",
                    bottomDrawerTab === 'execution_trace' ? "text-[#b8ff57] border-b-2 border-[#b8ff57] pb-1" : "text-[#5e6686] hover:text-[#e8eaf6]"
                  )}
                >
                  ⏱️ Exec trace history
                </button>
              </div>

              {/* Close drawer icon */}
              <button 
                onClick={() => setIsBottomDrawerOpen(false)}
                className="text-[#5e6686] hover:text-white transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Tab Content */}
            <div className="flex-1 overflow-y-auto bg-[#040509]/95 text-xs font-mono p-4">
              
              {/* Telemetry tab */}
              {bottomDrawerTab === 'telemetry' && (
                <div className="h-full flex flex-col min-h-0">
                  {/* Telemetry Toolbar */}
                  <div className="pb-3 border-b border-[#1f2235]/20 mb-3 flex items-center gap-3 shrink-0">
                    <input
                      type="text"
                      placeholder="Filter telemetry logs..."
                      value={telemetrySearch}
                      onChange={(e) => setTelemetrySearch(e.target.value)}
                      className="bg-[#141624] border border-[#1f2235] rounded text-[10px] px-3 py-1 text-[#e8eaf6] focus:outline-none focus:border-[#5b5eff] max-w-xs"
                    />
                    <div className="flex gap-1">
                      {(['all', 'error', 'warning', 'info'] as const).map(chip => (
                        <button
                          key={chip}
                          onClick={() => setActiveTelemetryChip(chip)}
                          className={cn(
                            "px-2 py-0.5 rounded text-[8px] uppercase tracking-wider border",
                            activeTelemetryChip === chip
                              ? "bg-[#5b5eff] text-white border-[#5b5eff]"
                              : "bg-transparent border-[#1f2235] text-[#4c5475] hover:text-white"
                          )}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={onClearEvents}
                      className="ml-auto text-[8px] text-red-500 hover:underline hover:text-red-400"
                    >
                      Clear Log Feed
                    </button>
                  </div>

                  {/* Telemetry scrolling logs */}
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {filteredEvents.map(ev => {
                      const aiData = aiExplanations[ev.id];
                      return (
                        <div key={ev.id} className="bg-[#0b0c14] border border-[#1f2235]/30 p-2.5 rounded flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[8px] px-1 py-0.1 rounded font-bold uppercase",
                              ev.severity === 'error' ? "bg-red-500/20 text-red-500 border border-red-500/30" :
                              ev.severity === 'warning' ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30" :
                              "bg-[#5b5eff]/20 text-[#5b5eff] border border-[#5b5eff]/30"
                            )}>
                              {ev.severity}
                            </span>
                            <span className="text-[9px] text-[#4c5475]">{ev.type}</span>
                            <span className="text-[9px] text-[#4c5475]">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                            <span className="text-[9px] text-slate-400 truncate max-w-md ml-2">{ev.message}</span>
                            
                            {(ev.severity === 'error' || ev.severity === 'warning') && (
                              <button
                                onClick={() => handleFetchAIAnalysis(ev)}
                                className="ml-auto text-[8.5px] text-[#b8ff57] hover:underline flex items-center gap-1 shrink-0"
                              >
                                <Cpu className="w-3 h-3 text-[#b8ff57]" />
                                <span>AI Diagnosis</span>
                              </button>
                            )}
                          </div>

                          {/* Ai Explanation area */}
                          {aiData && (
                            <div className="mt-1.5 p-2 bg-[#5b5eff]/5 border border-[#5b5eff]/20 rounded-sm text-[9.5px]">
                              {aiData.loading ? (
                                <span className="text-[#5e6686] animate-pulse">Running Gemini cognitive diagnostics...</span>
                              ) : (
                                <div className="space-y-1">
                                  <div className="text-slate-300 leading-relaxed"><strong className="text-[#b8ff57]">Diagnosis:</strong> {aiData.explanation}</div>
                                  {aiData.fix && (
                                    <pre className="bg-[#020306] p-1.5 rounded text-[9px] text-emerald-400 overflow-x-auto font-mono">{aiData.fix}</pre>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {filteredEvents.length === 0 && (
                      <div className="text-center py-6 text-[#4a5068]">No telemetry stream logs logged for this segment.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Step Output JSON tab */}
              {bottomDrawerTab === 'step_results' && (
                <div className="space-y-2">
                  <div className="text-[10px] text-[#4c5475] uppercase tracking-wider mb-1">// Currently Inspecting Output Payload</div>
                  <div className="flex gap-2 mb-2">
                    {nodes.map(n => (
                      <button
                        key={n.id}
                        onClick={() => setSelectedLogNodeId(n.id)}
                        className={cn(
                          "px-2 py-1 rounded text-[8px] border",
                          selectedLogNodeId === n.id 
                            ? "bg-[#b8ff57]/10 border-[#b8ff57] text-[#b8ff57] font-bold" 
                            : "bg-[#141624]/40 border-[#1f2235]/40 text-[#4c5475]"
                        )}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                  
                  {(() => {
                    const matched = nodes.find(n => n.id === selectedLogNodeId);
                    if (!matched) return <div className="text-[#4a5068]">Select a node from above to examine output state logs.</div>;
                    const output = nodeOutputs[selectedLogNodeId];
                    const displayData = output
                      ? output.status === 'error'
                        ? { status: 'error', error: output.error, duration: output.duration ? `${output.duration}ms` : undefined }
                        : { status: output.status, output: output.output, tokens: output.tokens, duration: output.duration ? `${output.duration}ms` : undefined, timestamp: new Date(output.timestamp).toLocaleTimeString() }
                      : { status: 'idle', message: 'Execute the workflow to see output.' };
                    return (
                      <pre className="bg-[#020306] p-4 rounded text-xs text-emerald-400 border border-emerald-500/10 overflow-x-auto max-h-36">
                        {JSON.stringify(displayData, null, 2)}
                      </pre>
                    );
                  })()}
                </div>
              )}

              {/* Execution Trace history tab */}
              {bottomDrawerTab === 'execution_trace' && (
                <div className="space-y-2">
                  <div className="text-[10px] text-[#4c5475] uppercase tracking-wider mb-2">// Flow Trace Log Session</div>
                  <div className="space-y-1 bg-[#020306] p-3 rounded border border-[#1f2235]/20 max-h-40 overflow-y-auto text-[10px] text-[#808eb5]">
                    {executionLog.map((log, index) => (
                      <div key={index} className="flex gap-2 leading-relaxed">
                        <span className="text-[#4c5475] select-none">[{index + 1}]</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* RIGHT SIDEBAR ADD-NODE SLIDE-IN CATALOGUE ("SUMMONED PANEL") */}
      {isAddPanelOpen && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#0d0e16] border-l border-[#1f2235] shadow-[-10px_0_30px_rgba(0,0,0,0.6)] z-40 flex flex-col font-mono">
          
          <div className="p-4 border-b border-[#1f2235]/40 bg-[#0a0b12] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#b8ff57]" />
              <span className="text-xs font-bold tracking-wider text-[#e8eaf6] uppercase">Summon Workflow Node</span>
            </div>
            <button
              onClick={() => setIsAddPanelOpen(false)}
              className="p-1 hover:bg-[#1a1c2e] text-[#5e6686] hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search nodes catalog */}
          <div className="p-3 border-b border-[#1f2235]/20">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#5e6686]" />
              <input
                type="text"
                placeholder="Search node categories..."
                value={addPanelSearch}
                onChange={(e) => setAddPanelSearch(e.target.value)}
                className="w-full bg-[#141624] border border-[#1f2235] rounded text-[10px] px-8 py-2 text-white focus:outline-none focus:border-[#5b5eff]"
                autoFocus
              />
            </div>
          </div>

          {/* Nodes list categorized */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* 1. Triggers */}
            <div className="space-y-1.5">
              <h5 className="text-[9px] text-[#5b5eff] uppercase tracking-widest font-bold">// Trigger Nodes</h5>
              {[
                { type: 'webhook', label: 'Webhook Trigger', desc: 'Accept incoming webhook payload events' },
                { type: 'schedule', label: 'Schedule Trigger', desc: 'Run on interval: every N minutes/hours/days' },
                { type: 'cron', label: 'Cron Scheduler', desc: 'Trigger sequences on absolute cron patterns' },
                { type: 'chat_listener', label: 'Chat Event Listener', desc: 'Runs workflow upon channel prompt triggers' }
              ].filter(n => n.label.toLowerCase().includes(addPanelSearch.toLowerCase()))
              .map(node => (
                <button
                  key={node.type}
                  onClick={() => handleAddNodeType(node.type, 'trigger', node.label)}
                  className="w-full text-left p-2.5 bg-[#141624]/40 hover:bg-[#1f2235]/40 border border-[#1f2235]/30 rounded transition-all text-[11px] group"
                >
                  <div className="font-extrabold text-[#e8eaf6] group-hover:text-[#b8ff57] flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#5b5eff]" />
                    <span>{node.label}</span>
                  </div>
                  <div className="text-[8px] text-[#4a5068] mt-1 leading-relaxed">{node.desc}</div>
                </button>
              ))}
            </div>

            {/* 2. Apps */}
            <div className="space-y-1.5">
              <h5 className="text-[9px] text-[#ffad33] uppercase tracking-widest font-bold">// Integration Apps</h5>
              {[
                { type: 'http', label: 'HTTP Request', desc: 'Send HTTP requests to external APIs and services' },
                { type: 'slack', label: 'Slack Sender', desc: 'Post payloads or errors directly to workspace' },
                { type: 'gmail', label: 'Gmail Dispatcher', desc: 'Auto-send summary alerts or notifications' },
                { type: 'github', label: 'GitHub Sync', desc: 'Sync bug issues from repository events' }
              ].filter(n => n.label.toLowerCase().includes(addPanelSearch.toLowerCase()))
              .map(node => (
                <button
                  key={node.type}
                  onClick={() => handleAddNodeType(node.type, 'app', node.label)}
                  className="w-full text-left p-2.5 bg-[#141624]/40 hover:bg-[#1f2235]/40 border border-[#1f2235]/30 rounded transition-all text-[11px] group"
                >
                  <div className="font-extrabold text-[#e8eaf6] group-hover:text-[#b8ff57] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#ffad33]" />
                    <span>{node.label}</span>
                  </div>
                  <div className="text-[8px] text-[#4a5068] mt-1 leading-relaxed">{node.desc}</div>
                </button>
              ))}
            </div>

            {/* 3. Core Logic */}
            <div className="space-y-1.5">
              <h5 className="text-[9px] text-[#00e5a0] uppercase tracking-widest font-bold">// Core logic</h5>
              {[
                { type: 'code', label: 'JS Code Engine', desc: 'Sandbox runtime to manipulate JSON logs' },
                { type: 'if', label: 'IF Condition', desc: 'Branch workflow: True/False based on condition' },
                { type: 'switch', label: 'Switch', desc: 'Multi-way branching with multiple case values' },
                { type: 'loop_for', label: 'Loop (For)', desc: 'Iterate over an array of items, executing downstream per item' },
                { type: 'loop_while', label: 'Loop (While)', desc: 'Repeat downstream execution while condition is true' },
                { type: 'filter', label: 'Data Filter', desc: 'Branch execution path based on JSON schema variables' },
                { type: 'merge', label: 'Merge', desc: 'Combine multiple upstream inputs into one (array/object/text)' },
                { type: 'split', label: 'Split', desc: 'Split array data into individual items for downstream' },
                { type: 'router', label: 'Variable Router', desc: 'Directs outputs depending on server status triggers' }
              ].filter(n => n.label.toLowerCase().includes(addPanelSearch.toLowerCase()))
              .map(node => (
                <button
                  key={node.type}
                  onClick={() => handleAddNodeType(node.type, 'core', node.label)}
                  className="w-full text-left p-2.5 bg-[#141624]/40 hover:bg-[#1f2235]/40 border border-[#1f2235]/30 rounded transition-all text-[11px] group"
                >
                  <div className="font-extrabold text-[#e8eaf6] group-hover:text-[#b8ff57] flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-[#00e5a0]" />
                    <span>{node.label}</span>
                  </div>
                  <div className="text-[8px] text-[#4a5068] mt-1 leading-relaxed">{node.desc}</div>
                </button>
              ))}
            </div>

            {/* 4. AI Engine */}
            <div className="space-y-1.5">
              <h5 className="text-[9px] text-[#b04cff] uppercase tracking-widest font-bold">// AI Engine (NEXUS)</h5>
              {[
                { type: 'agent', label: 'Nexus AI Agent', desc: 'Launches custom system prompt and telemetry rules via Gemini model' },
                { type: 'prompt', label: 'Prompt Template', desc: 'Injects context logs dynamically into styled prompts' },
                { type: 'rag', label: 'Vector Search DB', desc: 'Queries vector index clusters for previous similar bugs' }
              ].filter(n => n.label.toLowerCase().includes(addPanelSearch.toLowerCase()))
              .map(node => (
                <button
                  key={node.type}
                  onClick={() => handleAddNodeType(node.type, 'ai', node.label)}
                  className="w-full text-left p-2.5 bg-[#141624]/40 hover:bg-[#1f2235]/40 border border-[#1f2235]/30 rounded transition-all text-[11px] group"
                >
                  <div className="font-extrabold text-[#e8eaf6] group-hover:text-[#b8ff57] flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[#b04cff]" />
                    <span>{node.label}</span>
                  </div>
                  <div className="text-[8px] text-[#4a5068] mt-1 leading-relaxed">{node.desc}</div>
                </button>
              ))}
            </div>

            {/* 5. DreamMakerHub (Memory Core Nodes) */}
            <div className="space-y-1.5">
              <h5 className="text-[9px] text-[#b8ff57] uppercase tracking-widest font-bold">// DreamMakerHub</h5>
              {[
                { type: 'decision', label: 'Decision Node', desc: 'Durable architectural decision context memory' },
                { type: 'bug', label: 'Bug Node', desc: 'Identified telemetry exceptions with root cause analysis' },
                { type: 'pattern', label: 'Pattern Node', desc: 'Design systems or recurrent architectural blocks' },
                { type: 'context', label: 'Context Node', desc: 'Environment variables or diagnostic metadata' },
                { type: 'file', label: 'File Node', desc: 'Reference text or config schema details' },
                { type: 'note', label: 'Note Node', desc: 'General engineering annotation and memory capture' }
              ].filter(n => n.label.toLowerCase().includes(addPanelSearch.toLowerCase()))
              .map(node => (
                <button
                  key={node.type}
                  onClick={() => handleAddNodeType(node.type, 'dream_maker', node.label)}
                  className="w-full text-left p-2.5 bg-[#141624]/40 hover:bg-[#1f2235]/40 border border-[#1f2235]/30 rounded transition-all text-[11px] group"
                >
                  <div className="font-extrabold text-[#e8eaf6] group-hover:text-[#b8ff57] flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-[#b8ff57]" />
                    <span>{node.label}</span>
                  </div>
                  <div className="text-[8px] text-[#4a5068] mt-1 leading-relaxed">{node.desc}</div>
                </button>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* NODE DETAIL VIEW (NDV) - 3-COLUMN FULL-SCREEN OVERLAY FOR STANDARD NODES */}
      {selectedNode && (
        <div className="fixed inset-0 bg-[#05060b]/95 backdrop-blur-md z-50 flex flex-col font-mono">
          {/* Header */}
          <div className="h-14 border-b border-[#1f2235]/40 px-8 flex items-center justify-between bg-[#0a0b12] shrink-0 select-none">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-[#b8ff57] animate-spin" />
              <div>
                <h3 className="text-xs font-black uppercase text-[#e8eaf6]">Node Detail Configuration View (NDV)</h3>
                <span className="text-[8.5px] text-[#5e6686] uppercase tracking-wider">{selectedNode.label} // ID: {selectedNode.id}</span>
              </div>
            </div>
            
            <button
              onClick={() => setSelectedNode(null)}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold uppercase transition-all"
            >
              Close Overlay
            </button>
          </div>

          {/* 3-Column layout */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* Column 1: Input Data (Left) */}
            <div className="w-1/3 border-r border-[#1f2235]/20 flex flex-col min-w-0 bg-[#07080d]/80 p-6 overflow-y-auto">
              <h4 className="text-[10px] text-[#5b5eff] uppercase tracking-widest font-black mb-3 flex items-center gap-1.5 shrink-0">
                <ArrowRight className="w-4 h-4" />
                <span>Input Payload / Incoming variables</span>
              </h4>
              <p className="text-[9px] text-[#5e6686] leading-relaxed mb-4">
                Mock payload representing variables available from precursor upstream nodes linked in the active graph.
              </p>

              <div className="flex-1 space-y-4">
                {Object.entries(selectedNode.config.mockInputs || { payload: '{}' }).map(([key, value]) => (
                  <div key={key} className="space-y-1.5">
                    <span className="text-[9px] text-[#b8ff57] font-bold uppercase">{key}</span>
                    <textarea
                      value={value}
                      onChange={(e) => {
                        const newInputs = { ...selectedNode.config.mockInputs, [key]: e.target.value };
                        setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, mockInputs: newInputs }
                        });
                      }}
                      className="w-full h-40 bg-[#020306] border border-[#1f2235] rounded p-3 text-xs text-[#808eb5] focus:outline-none focus:border-[#5b5eff] font-mono whitespace-pre-wrap"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Parameters/Config (Center) */}
            <div className="w-1/3 border-r border-[#1f2235]/20 flex flex-col min-w-0 bg-[#08090f] p-6 overflow-y-auto space-y-4">
              <h4 className="text-[10px] text-[#b8ff57] uppercase tracking-widest font-black mb-1 flex items-center gap-1.5 shrink-0">
                <Sliders className="w-4 h-4" />
                <span>Parameter Options</span>
              </h4>
              <p className="text-[9px] text-[#5e6686] leading-relaxed mb-3">
                Edit core system properties and prompt guidelines for this node execution environment.
              </p>

              {/* General Fields */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Node Title</label>
                  <input
                    type="text"
                    value={selectedNode.config.title || ''}
                    onChange={(e) => setSelectedNode({
                      ...selectedNode,
                      config: { ...selectedNode.config, title: e.target.value }
                    })}
                    className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white focus:outline-none focus:border-[#b8ff57]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 uppercase font-bold">Description / Purpose</label>
                  <input
                    type="text"
                    value={selectedNode.config.description || ''}
                    onChange={(e) => setSelectedNode({
                      ...selectedNode,
                      config: { ...selectedNode.config, description: e.target.value }
                    })}
                    className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white focus:outline-none focus:border-[#b8ff57]"
                  />
                </div>

                {/* Error handling & retry — common to all nodes */}
                <div className="pt-3 border-t border-[#1f2235]/20 space-y-2">
                  <h6 className="text-[8px] text-[#ff6b6b] uppercase tracking-widest font-bold">Error Handling</h6>
                  <div className="flex items-center gap-3">
                    <label className="text-[9px] text-slate-400 uppercase font-bold">Max Retries</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={selectedNode.config.retryCount ?? 0}
                      onChange={(e) => setSelectedNode({
                        ...selectedNode,
                        config: { ...selectedNode.config, retryCount: parseInt(e.target.value) || 0 }
                      })}
                      className="w-16 bg-[#141624] border border-[#1f2235] rounded text-xs px-2 py-1 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-[9px] text-slate-400 uppercase font-bold">Retry Delay (ms)</label>
                    <input
                      type="number"
                      min="100"
                      max="10000"
                      step="100"
                      value={selectedNode.config.retryDelay ?? 1000}
                      onChange={(e) => setSelectedNode({
                        ...selectedNode,
                        config: { ...selectedNode.config, retryDelay: parseInt(e.target.value) || 1000 }
                      })}
                      className="w-20 bg-[#141624] border border-[#1f2235] rounded text-xs px-2 py-1 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="continue-on-error"
                      checked={!!selectedNode.config.continueOnError}
                      onChange={(e) => setSelectedNode({
                        ...selectedNode,
                        config: { ...selectedNode.config, continueOnError: e.target.checked }
                      })}
                      className="rounded border-[#1f2235] bg-[#0c0e17] text-[#ff6b6b] focus:ring-0 w-3 h-3 cursor-pointer"
                    />
                    <label htmlFor="continue-on-error" className="text-[9px] text-slate-400 uppercase cursor-pointer">Continue on error</label>
                  </div>
                </div>

                {/* AI Node parameters */}
                {selectedNode.type === 'agent' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#b04cff] uppercase font-bold">Model Engine</label>
                      <select
                        value={selectedNode.config.model || 'gemini-3-flash-preview'}
                        onChange={(e) => setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, model: e.target.value as any }
                        })}
                        className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white focus:outline-none focus:border-[#b8ff57]"
                      >
                        <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                        <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Heavy reasoning)</option>
                        <option value="gpt-4o">GPT-4o (Frontier)</option>
                        <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-[#b04cff] uppercase font-bold">System Instruction</label>
                      <textarea
                        value={selectedNode.config.systemPrompt || ''}
                        onChange={(e) => setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, systemPrompt: e.target.value }
                        })}
                        className="w-full h-32 bg-[#141624] border border-[#1f2235] rounded p-3 text-xs text-white focus:outline-none focus:border-[#b8ff57] font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[8px] text-slate-400 uppercase font-bold">Temperature</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={selectedNode.config.temperature || 0.7}
                          onChange={(e) => setSelectedNode({
                            ...selectedNode,
                            config: { ...selectedNode.config, temperature: parseFloat(e.target.value) }
                          })}
                          className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-1.5 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] text-slate-400 uppercase font-bold">Top P</label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          max="1"
                          value={selectedNode.config.topP || 0.95}
                          onChange={(e) => setSelectedNode({
                            ...selectedNode,
                            config: { ...selectedNode.config, topP: parseFloat(e.target.value) }
                          })}
                          className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-1.5 text-white"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Prompt Template variables */}
                {selectedNode.type === 'rag' && (
                  <div className="space-y-1">
                    <label className="text-[9px] text-[#b8ff57] uppercase font-bold">Search query format</label>
                    <textarea
                      value={selectedNode.config.promptTemplate || ''}
                      onChange={(e) => setSelectedNode({
                        ...selectedNode,
                        config: { ...selectedNode.config, promptTemplate: e.target.value }
                      })}
                      className="w-full h-24 bg-[#141624] border border-[#1f2235] rounded p-3 text-xs text-white focus:outline-none"
                    />
                  </div>
                )}

                {/* Webhook parameter details */}
                {selectedNode.type === 'webhook' && (
                  <div className="space-y-1">
                    <label className="text-[9px] text-[#5b5eff] uppercase font-bold">Webhook endpoint URL</label>
                    <input
                      type="text"
                      value={selectedNode.config.webhookUrl || ''}
                      onChange={(e) => setSelectedNode({
                        ...selectedNode,
                        config: { ...selectedNode.config, webhookUrl: e.target.value }
                      })}
                      className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white"
                    />
                  </div>
                )}

                {/* Code node sandbox */}
                {selectedNode.type === 'code' && (
                  <div className="space-y-1">
                    <label className="text-[9px] text-[#00e5a0] uppercase font-bold">JavaScript Code</label>
                    <p className="text-[8px] text-[#5e6686] mb-1">Define <span className="text-[#b8ff57]">$input</span> and return a value. Built-in: <span className="text-[#b8ff57]">JSON</span>, <span className="text-[#b8ff57]">Math</span>, <span className="text-[#b8ff57]">Date</span>, <span className="text-[#b8ff57]">console</span>.</p>
                    <textarea
                      value={selectedNode.config.code || '// Transform input\nconst data = JSON.parse($input);\nreturn JSON.stringify({ result: data }, null, 2);'}
                      onChange={(e) => setSelectedNode({
                        ...selectedNode,
                        config: { ...selectedNode.config, code: e.target.value }
                      })}
                      className="w-full h-48 bg-[#0d0e1b] border border-[#1f2235] rounded p-3 text-xs text-[#00f5d4] focus:outline-none focus:border-[#b8ff57] font-mono"
                      spellCheck={false}
                    />
                  </div>
                )}

                {/* IF Condition config */}
                {selectedNode.type === 'if' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#00e5a0] uppercase font-bold">Left Value (path or static)</label>
                      <input
                        type="text"
                        value={selectedNode.config.conditionLeft || '$input'}
                        onChange={(e) => setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, conditionLeft: e.target.value }
                        })}
                        className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#00e5a0] uppercase font-bold">Operator</label>
                      <select
                        value={selectedNode.config.conditionOperator || 'equals'}
                        onChange={(e) => setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, conditionOperator: e.target.value as any }
                        })}
                        className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white"
                      >
                        <option value="equals">Equals (===)</option>
                        <option value="not_equals">Not Equals (!==)</option>
                        <option value="greater_than">Greater Than (&gt;)</option>
                        <option value="less_than">Less Than (&lt;)</option>
                        <option value="contains">Contains</option>
                        <option value="starts_with">Starts With</option>
                        <option value="regex">Regex Match</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#00e5a0] uppercase font-bold">Right Value (comparison)</label>
                      <input
                        type="text"
                        value={selectedNode.config.conditionRight || 'true'}
                        onChange={(e) => setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, conditionRight: e.target.value }
                        })}
                        className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div className="pt-2 border-t border-[#1f2235]/20">
                      <label className="text-[9px] text-[#5e6686] uppercase font-bold mb-2 block">Outgoing Connections</label>
                      {connections.filter(c => c.fromId === selectedNode.id).map(conn => {
                        const target = nodes.find(n => n.id === conn.toId);
                        return (
                          <div key={conn.id} className="flex items-center gap-2 mb-1 text-[10px]">
                            <span className="text-[#808eb5]">→ {target?.label || conn.toId}</span>
                            <select
                              value={conn.fromPort || 'true'}
                              onChange={(e) => setConnections(prev => prev.map(c => c.id === conn.id ? { ...c, fromPort: e.target.value as 'true' | 'false' } : c))}
                              className="bg-[#141624] border border-[#1f2235] rounded text-[9px] px-1 py-0.5 text-white"
                            >
                              <option value="true">True</option>
                              <option value="false">False</option>
                            </select>
                          </div>
                        );
                      })}
                      {connections.filter(c => c.fromId === selectedNode.id).length === 0 && (
                        <p className="text-[9px] text-[#4a5068]">Connect this node to others, then assign True/False ports here.</p>
                      )}
                    </div>
                  </>
                )}

                {/* Loop (For) parameters */}
                {selectedNode.type === 'loop_for' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#00e5a0] uppercase font-bold">Items Array (JSON or comma-separated)</label>
                      <input
                        type="text"
                        value={selectedNode.config.loopItems || '[1, 2, 3]'}
                        onChange={(e) => setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, loopItems: e.target.value }
                        })}
                        className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white font-mono"
                        placeholder='[1, 2, 3] or "a, b, c"'
                      />
                      <p className="text-[8px] text-[#4a5068]">Each item is passed as input to downstream nodes.</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#00e5a0] uppercase font-bold">Variable Name</label>
                      <input
                        type="text"
                        value={selectedNode.config.loopVarName || 'item'}
                        onChange={(e) => setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, loopVarName: e.target.value }
                        })}
                        className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white font-mono"
                        placeholder="item"
                      />
                    </div>
                  </>
                )}

                {/* Loop (While) parameters */}
                {selectedNode.type === 'loop_while' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#00e5a0] uppercase font-bold">Condition (JS expression using $input)</label>
                      <input
                        type="text"
                        value={selectedNode.config.whileCondition || '$input < 5'}
                        onChange={(e) => setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, whileCondition: e.target.value }
                        })}
                        className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white font-mono"
                        placeholder="$input < 5"
                      />
                      <p className="text-[8px] text-[#4a5068]">The loop body executes while this evaluates to true.</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#00e5a0] uppercase font-bold">Max Iterations (safety limit)</label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={selectedNode.config.whileMaxIterations ?? 100}
                        onChange={(e) => setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, whileMaxIterations: parseInt(e.target.value) || 100 }
                        })}
                        className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Merge parameters */}
                {selectedNode.type === 'merge' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#00e5a0] uppercase font-bold">Merge Mode</label>
                      <select
                        value={selectedNode.config.mergeMode || 'array'}
                        onChange={(e) => setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, mergeMode: e.target.value }
                        })}
                        className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white"
                      >
                        <option value="array">Array (concatenate arrays)</option>
                        <option value="object">Object (merge properties)</option>
                        <option value="text">Text (join with newlines)</option>
                      </select>
                      <p className="text-[8px] text-[#4a5068]">Combines all upstream connection outputs.</p>
                    </div>
                  </>
                )}

                {/* Split parameters */}
                {selectedNode.type === 'split' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#00e5a0] uppercase font-bold">Split Mode</label>
                      <select
                        value={selectedNode.config.splitMode || 'first'}
                        onChange={(e) => setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, splitMode: e.target.value }
                        })}
                        className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white"
                      >
                        <option value="first">Output first item (passthrough)</option>
                        <option value="all">Output all items (JSON array)</option>
                      </select>
                      <p className="text-[8px] text-[#4a5068]">Splits array data from upstream.</p>
                    </div>
                  </>
                )}

                {/* Schedule Trigger parameters */}
                {selectedNode.type === 'schedule' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#5b5eff] uppercase font-bold">Interval</label>
                      <select
                        value={selectedNode.config.scheduleInterval || 'every_15_min'}
                        onChange={(e) => setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, scheduleInterval: e.target.value }
                        })}
                        className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white"
                      >
                        <option value="every_1_min">Every 1 minute</option>
                        <option value="every_5_min">Every 5 minutes</option>
                        <option value="every_15_min">Every 15 minutes</option>
                        <option value="every_30_min">Every 30 minutes</option>
                        <option value="every_1_hour">Every hour</option>
                        <option value="every_2_hour">Every 2 hours</option>
                        <option value="every_6_hour">Every 6 hours</option>
                        <option value="every_12_hour">Every 12 hours</option>
                        <option value="every_day">Every day</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#5b5eff] uppercase font-bold">Status</label>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`w-2 h-2 rounded-full ${selectedNode.config.scheduleEnabled !== false ? 'bg-emerald-500' : 'bg-[#4a5068]'}`} />
                        <span className="text-[#808eb5]">{selectedNode.config.scheduleEnabled !== false ? 'Active' : 'Paused'}</span>
                        <button
                          onClick={() => setSelectedNode({
                            ...selectedNode,
                            config: { ...selectedNode.config, scheduleEnabled: selectedNode.config.scheduleEnabled === false ? true : false }
                          })}
                          className="ml-auto text-[9px] text-[#5b5eff] hover:text-[#b8ff57]"
                        >
                          Toggle
                        </button>
                      </div>
                    </div>
                    {/* Show next execution times */}
                    <div className="space-y-1 pt-2 border-t border-[#1f2235]/20">
                      <label className="text-[9px] text-[#5e6686] uppercase font-bold">Next Executions</label>
                      {(() => {
                        const ms = scheduleIntervalToMs(selectedNode.config.scheduleInterval || 'every_15_min');
                        const times = [Date.now() + ms, Date.now() + ms * 2, Date.now() + ms * 3, Date.now() + ms * 4, Date.now() + ms * 5];
                        return times.map((t, i) => (
                          <div key={i} className="text-[8px] text-[#4a5068] font-mono">{new Date(t).toLocaleString()}</div>
                        ));
                      })()}
                    </div>
                  </>
                )}

                {/* Cron Trigger parameters */}
                {selectedNode.type === 'cron' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#5b5eff] uppercase font-bold">Cron Expression</label>
                      <input
                        type="text"
                        value={selectedNode.config.cronExpression || '*/15 * * * *'}
                        onChange={(e) => setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, cronExpression: e.target.value }
                        })}
                        className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white font-mono"
                        placeholder="*/15 * * * *"
                      />
                      <p className="text-[8px] text-[#4a5068]">Standard cron format: minute hour day month weekday</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${selectedNode.config.scheduleEnabled !== false ? 'bg-emerald-500' : 'bg-[#4a5068]'}`} />
                      <span className="text-[9px] text-[#808eb5]">{selectedNode.config.scheduleEnabled !== false ? 'Active' : 'Paused'}</span>
                      <button
                        onClick={() => setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, scheduleEnabled: selectedNode.config.scheduleEnabled === false ? true : false }
                        })}
                        className="ml-auto text-[9px] text-[#5b5eff] hover:text-[#b8ff57]"
                      >
                        Toggle
                      </button>
                    </div>
                  </>
                )}

                {/* HTTP Request parameters */}
                {selectedNode.type === 'http' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#ffad33] uppercase font-bold">Method</label>
                      <select
                        value={selectedNode.config.httpMethod || 'GET'}
                        onChange={(e) => setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, httpMethod: e.target.value }
                        })}
                        className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#ffad33] uppercase font-bold">URL</label>
                      <input
                        type="text"
                        value={selectedNode.config.httpUrl || ''}
                        onChange={(e) => setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, httpUrl: e.target.value }
                        })}
                        className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#ffad33] uppercase font-bold">Headers (JSON)</label>
                      <textarea
                        value={selectedNode.config.httpHeaders || '{}'}
                        onChange={(e) => setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, httpHeaders: e.target.value }
                        })}
                        className="w-full h-20 bg-[#141624] border border-[#1f2235] rounded p-2 text-xs text-white focus:outline-none focus:border-[#b8ff57] font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-[#ffad33] uppercase font-bold">Request Body</label>
                      <textarea
                        value={selectedNode.config.httpBody || ''}
                        onChange={(e) => setSelectedNode({
                          ...selectedNode,
                          config: { ...selectedNode.config, httpBody: e.target.value }
                        })}
                        className="w-full h-24 bg-[#141624] border border-[#1f2235] rounded p-2 text-xs text-white focus:outline-none focus:border-[#b8ff57] font-mono"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Expression Preview */}
              {(() => {
                const exprFields = Object.entries(selectedNode.config).filter(([_, v]) => typeof v === 'string' && v.includes('{{'));
                if (exprFields.length === 0) return null;
                const previewCtx: ExpressionContext = {
                  $node: Object.fromEntries(nodes.map(n => [n.label, { data: nodeOutputs[n.id]?.output, output: nodeOutputs[n.id]?.output || '' }])),
                  $json: '{"example": "value"}',
                  $items: [],
                  $index: 0,
                  $now: new Date().toISOString(),
                  $today: new Date().toLocaleDateString(),
                };
                return (
                  <div className="pt-4 border-t border-[#1f2235]/20 space-y-2">
                    <h6 className="text-[8px] text-[#b8ff57] uppercase tracking-widest font-bold">Expression Preview</h6>
                    {exprFields.map(([key, val]) => (
                      <div key={key} className="text-[8px]">
                        <span className="text-[#5e6686]">{key}: </span>
                        <span className="text-emerald-400">{resolveExpressions(val as string, previewCtx)}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="pt-6 flex gap-3 select-none">
                <button
                  onClick={() => handleSaveNdvConfig(selectedNode)}
                  className="flex-1 bg-[#b8ff57] hover:bg-[#a6e64d] text-black font-extrabold text-xs py-2.5 rounded text-center transition-all"
                >
                  SAVE & CLOSE CONFIG
                </button>
              </div>
            </div>

            {/* Column 3: Output Data Preview (Right) */}
            <div className="w-1/3 bg-[#07080d]/90 flex flex-col min-w-0 p-6 overflow-y-auto">
              <h4 className="text-[10px] text-emerald-400 uppercase tracking-widest font-black mb-3 flex items-center gap-1.5 shrink-0">
                <Check className="w-4 h-4 animate-pulse" />
                <span>Output Response Payload</span>
              </h4>
              <p className="text-[9px] text-[#5e6686] leading-relaxed mb-4">
                {nodeOutputs[selectedNode.id]?.status === 'running' ? 'Executing...' : 'Output from the latest test run of this node.'}
              </p>

              <div className="flex-1 flex flex-col gap-3">
                <pre className="flex-1 bg-[#020306] border border-[#1f2235]/40 rounded p-4 text-xs text-[#00f5d4] font-mono overflow-y-auto whitespace-pre-wrap">
                  {(() => {
                    const o = nodeOutputs[selectedNode.id];
                    if (!o) return JSON.stringify({ status: 'idle', message: 'Click "Execute Single Node Test" to run.' }, null, 2);
                    if (o.status === 'running') return JSON.stringify({ status: 'running' }, null, 2);
                    if (o.status === 'error') return JSON.stringify({ status: 'error', error: o.error }, null, 2);
                    return JSON.stringify({
                      status: 'success',
                      output: o.output,
                      tokens: o.tokens,
                      duration: o.duration ? `${o.duration}ms` : undefined,
                      timestamp: new Date(o.timestamp).toLocaleTimeString(),
                    }, null, 2);
                  })()}
                </pre>

                <button
                  onClick={async () => {
                    if (selectedNode.category !== 'ai') {
                      showNotification('Only AI nodes can be tested individually');
                      return;
                    }
                    const input = Object.entries(selectedNode.config.mockInputs || { payload: '{}' })
                      .map(([k, v]) => `${k}: ${v}`)
                      .join('\n');
                    setNodeOutputs(prev => ({ ...prev, [selectedNode.id]: { status: 'running', output: '', timestamp: Date.now() } }));
                    try {
                      const result = await executeAINode(selectedNode, input);
                      setNodeOutputs(prev => ({ ...prev, [selectedNode.id]: { status: 'success', output: result.output, timestamp: Date.now(), tokens: result.tokens } }));
                      showNotification('Test run completed!');
                    } catch (err: any) {
                      setNodeOutputs(prev => ({ ...prev, [selectedNode.id]: { status: 'error', output: '', timestamp: Date.now(), error: err.message } }));
                      showNotification('Test run failed');
                    }
                  }}
                  className="w-full py-2 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-400 font-mono text-xs uppercase tracking-wider rounded transition-colors"
                >
                  {nodeOutputs[selectedNode.id]?.status === 'running' ? '⏳ Running...' : '⚡ Execute Single Node Test'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SPECIAL DREAMMAKERHUB MEMORY CORE FORM OVERLAY */}
      {activeMemoryNode && (
        <div className="fixed inset-0 bg-[#05060b]/98 backdrop-blur-lg z-50 flex items-center justify-center font-mono p-4 select-none">
          <div className="max-w-2xl w-full bg-[#0a0c16] border border-[#1f2235] rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="p-4 bg-[#0d0e1b] border-b border-[#1f2235]/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#b8ff57]" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Memory Core Node Synchronization</span>
              </div>
              <button 
                onClick={() => setActiveMemoryNode(null)}
                className="text-[#5e6686] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <p className="text-[10px] text-[#5e6686] leading-relaxed">
                You are editing a <strong>DreamMakerHub</strong> Memory node. Saving this form will write context logs directly into the global app index, syncing them to model system instructions.
              </p>

              <div className="space-y-1.5">
                <label className="text-[9px] text-[#b8ff57] font-bold uppercase">Memory Title</label>
                <input
                  type="text"
                  value={memoryFormTitle}
                  onChange={(e) => setMemoryFormTitle(e.target.value)}
                  className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white focus:outline-none focus:border-[#b8ff57]"
                  placeholder="e.g. TypeError in Checkout container"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-[#b8ff57] font-bold uppercase">Memory Type</label>
                  <select
                    value={memoryFormType}
                    onChange={(e) => setMemoryFormType(e.target.value as any)}
                    className="w-full bg-[#141624] border border-[#1f2235] rounded text-xs px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="decision">Decision Node</option>
                    <option value="bug">Bug Anomaly</option>
                    <option value="pattern">Design Pattern</option>
                    <option value="context">System Context</option>
                    <option value="file">File Registry</option>
                    <option value="note">Annotation Note</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-[#5b5eff] font-bold uppercase">Global Sync State</label>
                  <div className="bg-[#141624]/60 px-3 py-2 rounded border border-[#1f2235] text-[10px] text-emerald-400 font-extrabold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>SYNCHRONIZED</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-[#b8ff57] font-bold uppercase">Context Details / Evaluation</label>
                <textarea
                  value={memoryFormContent}
                  onChange={(e) => setMemoryFormContent(e.target.value)}
                  className="w-full h-44 bg-[#020306] border border-[#1f2235] rounded p-3 text-xs text-white focus:outline-none focus:border-[#b8ff57] font-mono leading-relaxed"
                  placeholder="Paste details, logs, stack traces, or instructions here..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#0d0e1b] border-t border-[#1f2235]/40 flex justify-end gap-3 select-none">
              <button
                onClick={() => setActiveMemoryNode(null)}
                className="px-4 py-2 border border-[#1f2235] text-[10px] uppercase text-[#5e6686] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMemoryForm}
                className="px-4 py-2 bg-[#b8ff57] text-black font-extrabold text-[10px] uppercase hover:bg-[#a6e64d]"
              >
                SYNC MEMORY CORE
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
