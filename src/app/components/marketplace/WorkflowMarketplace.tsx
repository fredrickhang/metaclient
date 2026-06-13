// Workflow Marketplace — browse and launch published workflows
import React, { useState, useMemo } from 'react';
import type { WorkflowMeta } from '../../types/metadata';

const CATEGORIES = ['All', 'AI Writing', 'Data Engineering', 'Computer Vision', 'NLP'];

function WorkflowCard({ workflow, onRun, onBuild }: { workflow: WorkflowMeta; onRun: () => void; onBuild: () => void }) {
  const successColor = workflow.stats && workflow.stats.successRate >= 97 ? 'text-green-400'
    : workflow.stats && workflow.stats.successRate >= 94 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all group flex flex-col">
      {workflow.thumbnail && (
        <div className="h-40 overflow-hidden bg-secondary relative">
          <img src={workflow.thumbnail} alt={workflow.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
          <div className="absolute bottom-2 left-3 flex gap-1">
            {workflow.tags.slice(0, 2).map(t => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-black/60 text-white/80 backdrop-blur-sm">{t}</span>
            ))}
          </div>
          <div className="absolute top-2 right-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium backdrop-blur-sm ${
              workflow.status === 'published' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              workflow.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'
            }`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>{workflow.status}</span>
          </div>
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-foreground leading-snug">{workflow.name}</h3>
            <span className="text-xs text-muted-foreground flex-shrink-0" style={{ fontFamily: 'JetBrains Mono, monospace' }}>v{workflow.version}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{workflow.description}</p>
        </div>

        {workflow.stats && (
          <div className="flex items-center gap-4 my-3 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            <span className="text-muted-foreground">{workflow.stats.runs.toLocaleString()} runs</span>
            <span className={successColor}>{workflow.stats.successRate}%</span>
            <span className="text-muted-foreground">~{(workflow.stats.avgDuration / 1000).toFixed(1)}s</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <button
            onClick={onRun}
            className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
          >
            Run Workflow
          </button>
          <button
            onClick={onBuild}
            className="px-3 py-2 border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-primary/40 text-sm transition-colors"
          >
            Edit
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">by {workflow.author}</p>
      </div>
    </div>
  );
}

interface WorkflowMarketplaceProps {
  workflows: WorkflowMeta[];
  onRunWorkflow: (id: string) => void;
  onEditWorkflow: (id: string) => void;
  onNewWorkflow: () => void;
}

export function WorkflowMarketplace({ workflows, onRunWorkflow, onEditWorkflow, onNewWorkflow }: WorkflowMarketplaceProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => workflows.filter(w => {
    const matchCat = category === 'All' || w.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q || w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q) || w.tags.some(t => t.toLowerCase().includes(q));
    return matchCat && matchSearch;
  }), [workflows, category, search]);

  const totalRuns = workflows.reduce((sum, w) => sum + (w.stats?.runs || 0), 0);

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Published Workflows', value: String(workflows.filter(w => w.status === 'published').length) },
          { label: 'Total Executions', value: totalRuns.toLocaleString() },
          { label: 'Node Types', value: '7' },
          { label: 'Active Engines', value: '3' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-foreground mt-1" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.5rem', fontWeight: 600 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search workflows, tags, authors…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>
        <div className="flex gap-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                category === cat ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          onClick={onNewWorkflow}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 flex-shrink-0"
        >
          <span>+</span> New Workflow
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(w => (
          <WorkflowCard
            key={w.id}
            workflow={w}
            onRun={() => onRunWorkflow(w.id)}
            onBuild={() => onEditWorkflow(w.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 py-20 text-center text-muted-foreground">
            <p>No workflows match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
