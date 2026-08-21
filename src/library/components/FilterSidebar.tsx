import React from 'react';
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal, 
  Check, 
  Cpu, 
  Sparkles, 
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { TemplateCategory, TemplateComplexity } from '../types';
import { CATEGORIES } from '../data/templates';

interface FilterSidebarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: TemplateCategory;
  setSelectedCategory: (cat: TemplateCategory) => void;
  selectedComplexity: TemplateComplexity | 'All';
  setSelectedComplexity: (comp: TemplateComplexity | 'All') => void;
  selectedNodeFilter: string;
  setSelectedNodeFilter: (filter: string) => void;
  sortBy: 'popular' | 'nodes' | 'name' | 'fastest';
  setSortBy: (sort: 'popular' | 'nodes' | 'name' | 'fastest') => void;
  totalFilteredCount: number;
  totalAllCount: number;
  onResetFilters: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedComplexity,
  setSelectedComplexity,
  selectedNodeFilter,
  setSelectedNodeFilter,
  sortBy,
  setSortBy,
  totalFilteredCount,
  totalAllCount,
  onResetFilters
}) => {
  const NODE_CAPABILITIES = [
    { label: 'All Capabilities', value: 'all' },
    { label: 'LangChain & AI Agents', value: 'langchain' },
    { label: 'Webhooks & APIs', value: 'webhook' },
    { label: 'Vector Stores & RAG', value: 'vector' },
    { label: 'Databases (SQL/NoSQL)', value: 'database' },
    { label: 'Social & Media Video', value: 'media' },
    { label: 'Office & Productivity', value: 'office' }
  ];

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategory !== 'All' ||
    selectedComplexity !== 'All' ||
    selectedNodeFilter !== 'all' ||
    sortBy !== 'popular';

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search 26+ templates by name, node type, keyword..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Pills Slider / Bar */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-orange-500" />
            <span>Categories</span>
          </label>
          <span className="text-xs text-slate-400 font-mono">
            {totalFilteredCount} of {totalAllCount} templates
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat as TemplateCategory)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-sm shadow-orange-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
        {/* Complexity Filter */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
            <span>Complexity</span>
          </label>
          <select
            value={selectedComplexity}
            onChange={e => setSelectedComplexity(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="All">All Complexities</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        {/* Node Capability Filter */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-500" />
            <span>Node Capability</span>
          </label>
          <select
            value={selectedNodeFilter}
            onChange={e => setSelectedNodeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            {NODE_CAPABILITIES.map(cap => (
              <option key={cap.value} value={cap.value}>
                {cap.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-purple-500" />
            <span>Sort By</span>
          </label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="popular">Most Popular & Stars</option>
            <option value="nodes">Most Nodes (Largest)</option>
            <option value="fastest">Fastest Setup (~10m)</option>
            <option value="name">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Active Filter Clear Bar */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Filters active &bull; Showing {totalFilteredCount} results
          </span>
          <button
            onClick={onResetFilters}
            className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}
    </div>
  );
};
