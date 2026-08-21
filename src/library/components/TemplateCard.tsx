import React from 'react';
import { 
  Download, 
  Eye, 
  Play, 
  Star, 
  Layers, 
  Cpu, 
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { WorkflowTemplate } from '../types';
import { getNodeMeta } from '../data/n8nNodesCatalog';

interface TemplateCardProps {
  template: WorkflowTemplate;
  onSelect: (template: WorkflowTemplate) => void;
  onDownload: (template: WorkflowTemplate, e: React.MouseEvent) => void;
  onImportToCanvas: (template: WorkflowTemplate, e: React.MouseEvent) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  onDownload,
  onImportToCanvas
}) => {
  // Extract distinct node types
  const uniqueNodeTypes = Array.from(
    new Set<string>(template.workflow.nodes.filter(n => n.type !== 'n8n-nodes-base.stickyNote').map(n => n.type))
  ).slice(0, 4);

  const getComplexityBadge = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Intermediate':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Advanced':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'AI Agents & LLMs':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Social Media & Video':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300 border-pink-200 dark:border-pink-800';
      case 'Customer Support & Sales':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'DevOps & APIs':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'RAG & Knowledge Base':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    }
  };

  return (
    <div
      onClick={() => onSelect(template)}
      className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-orange-500/50 dark:hover:border-orange-500/50 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      {/* Top Banner with Badges */}
      <div className="p-5 pb-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryBadge(template.category)}`}>
              {template.category}
            </span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getComplexityBadge(template.complexity)}`}>
              {template.complexity}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Layers className="w-3.5 h-3.5 text-orange-500" />
              {template.workflow.nodes.length} nodes
            </span>
          </div>
        </div>

        {/* Template Title */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug">
          {template.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
          {template.description}
        </p>

        {/* Node Pipeline Preview */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-slate-400" />
            <span>Key Services & Nodes</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {uniqueNodeTypes.map((type, idx) => {
              const meta = getNodeMeta(type);
              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  {meta.displayName}
                </span>
              );
            })}
            {template.workflow.nodes.length > 4 && (
              <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded text-slate-400 font-mono">
                +{template.workflow.nodes.length - uniqueNodeTypes.length} more
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 pt-1">
          {template.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer & Action Buttons */}
      <div className="p-4 bg-slate-50/80 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {template.author.avatar ? (
            <img
              src={template.author.avatar}
              alt={template.author.name}
              referrerPolicy="no-referrer"
              className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-[10px] flex items-center justify-center">
              {template.author.name.charAt(0)}
            </div>
          )}
          <div className="text-[11px]">
            <span className="font-medium text-slate-700 dark:text-slate-300 block truncate max-w-[100px]">
              {template.author.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Download JSON Button */}
          <button
            onClick={(e) => onDownload(template, e)}
            title="Download Workflow JSON"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Import to Canvas Button */}
          <button
            onClick={(e) => onImportToCanvas(template, e)}
            title="Import directly into Interactive Canvas"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Canvas</span>
          </button>

          {/* View Details */}
          <button
            onClick={() => onSelect(template)}
            title="View Details & Documentation"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 border border-transparent transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
