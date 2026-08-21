import React, { useMemo, useState } from 'react';
import { TemplateCard } from './components/TemplateCard';
import { TemplateDetail } from './components/TemplateDetail';
import { FilterSidebar } from './components/FilterSidebar';
import { TypesDocumentation } from './components/TypesDocumentation';
import { WORKFLOW_TEMPLATES } from './data/templates';
import {
  WorkflowTemplate,
  TemplateCategory,
  TemplateComplexity,
  N8nWorkflow,
} from './types';
import {
  Sparkles,
  Play,
  Search,
  Plus,
  Code2,
  ArrowLeft,
} from 'lucide-react';

interface LibraryViewProps {
  onLoadToCanvas: (template: WorkflowTemplate) => void;
}

function buildBlankTemplate(): WorkflowTemplate {
  const blankWorkflow: N8nWorkflow = {
    name: 'My Custom n8n Workflow',
    nodes: [
      {
        id: 'manual-trigger-1',
        name: 'When clicking Test workflow',
        type: 'n8n-nodes-base.manualTrigger',
        position: [240, 300],
        typeVersion: 1,
      },
      {
        id: 'code-transform-1',
        name: 'Transform Items',
        type: 'n8n-nodes-base.code',
        position: [500, 300],
        parameters: {
          jsCode:
            '// Loop over input items\nfor (const item of $input.all()) {\n  item.json.timestamp = new Date().toISOString();\n}\nreturn $input.all();',
        },
        typeVersion: 2,
      },
    ],
    connections: {
      'When clicking Test workflow': {
        main: [[{ node: 'Transform Items', type: 'main', index: 0 }]],
      },
    },
  };

  return {
    id: 'blank-custom-workflow',
    name: 'New Custom Workflow',
    slug: 'new-custom-workflow',
    category: 'DevOps & APIs',
    complexity: 'Beginner',
    description: 'A blank canvas with a manual trigger and a code node to start from.',
    author: { name: 'AI Wonderland' },
    tags: ['blank', 'starter'],
    nodeCount: 2,
    stars: 0,
    downloads: 0,
    useCases: ['Custom automations'],
    setupSteps: ['Import to canvas'],
    requiredCredentials: [],
    workflow: blankWorkflow,
    documentationMarkdown: '# New Custom Workflow\n\nEdit the nodes on the AI-Wonder canvas.',
    estimatedSetupMinutes: 1,
  };
}

export function LibraryView({ onLoadToCanvas }: LibraryViewProps) {
  const [currentView, setCurrentView] = useState<'library' | 'detail' | 'types_docs'>('library');
  const [activeTemplate, setActiveTemplate] = useState<WorkflowTemplate | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('All');
  const [selectedComplexity, setSelectedComplexity] = useState<TemplateComplexity | 'All'>('All');
  const [selectedNodeFilter, setSelectedNodeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'popular' | 'nodes' | 'name' | 'fastest'>('popular');

  // Filtered Templates Logic
  const filteredTemplates = useMemo(() => {
    return WORKFLOW_TEMPLATES.filter(tpl => {
      if (selectedCategory !== 'All' && tpl.category !== selectedCategory) {
        return false;
      }

      if (selectedComplexity !== 'All' && tpl.complexity !== selectedComplexity) {
        return false;
      }

      if (selectedNodeFilter !== 'all') {
        const nodeTypesStr = tpl.workflow.nodes.map(n => n.type).join(' ').toLowerCase();
        if (selectedNodeFilter === 'langchain' && !nodeTypesStr.includes('langchain')) return false;
        if (selectedNodeFilter === 'webhook' && !nodeTypesStr.includes('webhook')) return false;
        if (selectedNodeFilter === 'vector' && !nodeTypesStr.includes('vector') && !nodeTypesStr.includes('qdrant') && !nodeTypesStr.includes('supabase')) return false;
        if (selectedNodeFilter === 'database' && !nodeTypesStr.includes('postgres') && !nodeTypesStr.includes('database')) return false;
        if (selectedNodeFilter === 'media' && !nodeTypesStr.includes('veo') && !nodeTypesStr.includes('tiktok') && !nodeTypesStr.includes('blotato') && !nodeTypesStr.includes('youtube')) return false;
        if (selectedNodeFilter === 'office' && !nodeTypesStr.includes('sheets') && !nodeTypesStr.includes('notion') && !nodeTypesStr.includes('gmail') && !nodeTypesStr.includes('outlook')) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = tpl.name.toLowerCase().includes(q);
        const matchDesc = tpl.description.toLowerCase().includes(q);
        const matchTags = tpl.tags.some(t => t.toLowerCase().includes(q));
        const matchNodes = tpl.workflow.nodes.some(n => n.name.toLowerCase().includes(q) || n.type.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchTags && !matchNodes) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'popular') return b.stars - a.stars;
      if (sortBy === 'nodes') return b.workflow.nodes.length - a.workflow.nodes.length;
      if (sortBy === 'fastest') return a.estimatedSetupMinutes - b.estimatedSetupMinutes;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [searchQuery, selectedCategory, selectedComplexity, selectedNodeFilter, sortBy]);

  // Handlers
  const handleSelectTemplate = (template: WorkflowTemplate) => {
    setActiveTemplate(template);
    setCurrentView('detail');
  };

  const handleDownloadJSON = (template: WorkflowTemplate, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(template.workflow, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${template.slug}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleOpenInCanvas = (template: WorkflowTemplate, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveTemplate(template);
    onLoadToCanvas(template);
  };

  const handleCreateBlankWorkflow = () => {
    handleOpenInCanvas(buildBlankTemplate());
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedComplexity('All');
    setSelectedNodeFilter('all');
    setSortBy('popular');
  };

  return (
    <div className="dark flex-1 overflow-y-auto bg-slate-900 text-slate-100 font-sans selection:bg-orange-500 selection:text-white scrollbar-thin">
      {/* Sub-header */}
      <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {currentView !== 'library' ? (
            <button
              onClick={() => setCurrentView('library')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Library
            </button>
          ) : (
            <div className="w-max px-2 py-0.5 rounded bg-[#b8ff57]/10 text-[#b8ff57] text-[10px] font-mono uppercase tracking-widest">
              TEMPLATE LIBRARY
            </div>
          )}
          <span className="text-[10px] font-mono text-slate-500 truncate hidden sm:block">
            {WORKFLOW_TEMPLATES.length} production automation &amp; AI agent templates
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setCurrentView('types_docs')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-orange-400" />
            Schema Docs
          </button>
          <button
            onClick={handleCreateBlankWorkflow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Blank Workflow
          </button>
        </div>
      </div>

      <main>
        {/* VIEW 1: TEMPLATE LIBRARY BROWSER */}
        {currentView === 'library' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Hero Header */}
            <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-semibold border border-orange-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{WORKFLOW_TEMPLATES.length}+ Production Automation &amp; AI Agent Templates</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Discover, Preview &amp; Import High-Grade n8n Workflows
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Browse real-world AI agents, LangChain loops, social video pipelines, and DevOps integrations. Click any template to inspect its visual node graph, download raw JSON, or launch directly into the AI-Wonder canvas.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => WORKFLOW_TEMPLATES[0] && handleOpenInCanvas(WORKFLOW_TEMPLATES[0])}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 hover:from-orange-600 hover:to-rose-600 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Launch Interactive Canvas</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('types_docs')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
                  >
                    <Code2 className="w-4 h-4 text-orange-400" />
                    <span>View TypeScript Schema</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar Section */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm">
              <FilterSidebar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedComplexity={selectedComplexity}
                setSelectedComplexity={setSelectedComplexity}
                selectedNodeFilter={selectedNodeFilter}
                setSelectedNodeFilter={setSelectedNodeFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                totalFilteredCount={filteredTemplates.length}
                totalAllCount={WORKFLOW_TEMPLATES.length}
                onResetFilters={handleResetFilters}
              />
            </div>

            {/* Templates Grid */}
            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={handleSelectTemplate}
                    onDownload={handleDownloadJSON}
                    onImportToCanvas={handleOpenInCanvas}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-slate-900 rounded-3xl border border-slate-800 space-y-3">
                <Search className="w-10 h-10 mx-auto text-slate-400" />
                <h3 className="text-base font-bold text-white">
                  No templates match your filters
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try adjusting your search query or reset category and node capability filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: TEMPLATE DETAIL SUBPAGE */}
        {currentView === 'detail' && activeTemplate && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <TemplateDetail
              template={activeTemplate}
              onBack={() => setCurrentView('library')}
              onImportToCanvas={handleOpenInCanvas}
            />
          </div>
        )}

        {/* VIEW 3: TYPESCRIPT & SCHEMA DOCS */}
        {currentView === 'types_docs' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <TypesDocumentation />
          </div>
        )}
      </main>
    </div>
  );
}
