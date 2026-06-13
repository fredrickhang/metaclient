// Metadata Explorer — view and inspect the full metadata registry
import React, { useState } from 'react';
import { NODE_TYPE_REGISTRY, MOCK_WORKFLOWS } from '../../data/mockRegistry';

type ExplorerView = 'workflows' | 'nodes' | 'schema';

export function MetadataExplorer() {
  const [view, setView] = useState<ExplorerView>('workflows');
  const [selected, setSelected] = useState<string | null>(null);

  const workflows = MOCK_WORKFLOWS;
  const nodeTypes = Object.values(NODE_TYPE_REGISTRY);

  const selectedWorkflow = selected ? workflows.find(w => w.id === selected) : null;
  const selectedNode = selected ? NODE_TYPE_REGISTRY[selected] : null;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Tree */}
      <div className="w-64 border-r border-border bg-[#0d1117] flex flex-col">
        <div className="px-3 py-3 border-b border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Metadata Registry</p>
        </div>
        <div className="flex border-b border-border">
          {(['workflows', 'nodes', 'schema'] as const).map(v => (
            <button
              key={v}
              onClick={() => { setView(v); setSelected(null); }}
              className={`flex-1 py-2 text-xs transition-colors ${view === v ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-1">
          {view === 'workflows' && workflows.map(w => (
            <button
              key={w.id}
              onClick={() => setSelected(w.id)}
              className={`w-full text-left px-3 py-2 rounded text-xs transition-colors flex items-center gap-2 ${selected === w.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${w.status === 'published' ? 'bg-green-400' : 'bg-yellow-400'}`} />
              <span className="truncate">{w.name}</span>
            </button>
          ))}
          {view === 'nodes' && nodeTypes.map(n => (
            <button
              key={n.id}
              onClick={() => setSelected(n.id)}
              className={`w-full text-left px-3 py-2 rounded text-xs transition-colors flex items-center gap-2 ${selected === n.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-primary/50" />
              <span className="truncate">{n.name}</span>
            </button>
          ))}
          {view === 'schema' && (
            <div className="px-3 py-2 space-y-1">
              {['WorkflowMeta', 'NodeMeta', 'FormMeta', 'FieldMeta', 'PageMeta', 'ExecutionMeta', 'WorkflowEdge', 'PortMeta'].map(s => (
                <button
                  key={s}
                  onClick={() => setSelected(s)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${selected === s ? 'text-primary bg-primary/15' : 'text-muted-foreground hover:text-foreground'}`}
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Detail */}
      <div className="flex-1 overflow-y-auto p-6">
        {view === 'workflows' && selectedWorkflow && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-foreground">{selectedWorkflow.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{selectedWorkflow.status}</span>
              </div>
              <p className="text-sm text-muted-foreground">{selectedWorkflow.description}</p>
            </div>
            <div className="bg-[#0a0d14] rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>workflow_meta.json</p>
              <pre className="text-xs text-green-400 overflow-auto max-h-80" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {JSON.stringify({
                  id: selectedWorkflow.id,
                  name: selectedWorkflow.name,
                  version: selectedWorkflow.version,
                  processKey: selectedWorkflow.processKey,
                  exchange: selectedWorkflow.exchange,
                  nodes: selectedWorkflow.nodes.map(n => ({ id: n.id, type: n.nodeType, label: n.label })),
                  edges: selectedWorkflow.edges.map(e => ({ id: e.id, source: e.source, target: e.target, condition: e.condition })),
                  inputForm: { id: selectedWorkflow.inputForm.id, fields: selectedWorkflow.inputForm.fields.map(f => f.name) },
                }, null, 2)}
              </pre>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Input Form Schema</p>
                {selectedWorkflow.inputForm.fields.map(f => (
                  <div key={f.name} className="py-2 border-b border-border/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-foreground">{f.name}</span>
                      {f.required && <span className="text-destructive ml-1">*</span>}
                    </div>
                    <span className="text-muted-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{f.type}</span>
                  </div>
                ))}
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Output Schema</p>
                {selectedWorkflow.outputSchema.map(f => (
                  <div key={f.name} className="py-2 border-b border-border/50 flex items-center justify-between text-xs">
                    <span className="text-foreground">{f.name}</span>
                    <span className="text-muted-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{f.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'nodes' && selectedNode && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-foreground mb-1">{selectedNode.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedNode.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Node Metadata</p>
                {[
                  ['Type', selectedNode.type],
                  ['Category', selectedNode.category],
                  ['Handler Bean', selectedNode.handlerBean || '—'],
                  ['Async (RabbitMQ)', selectedNode.async ? 'Yes' : 'No'],
                  ['Inputs', String(selectedNode.inputs.length)],
                  ['Outputs', String(selectedNode.outputs.length)],
                ].map(([k, v]) => (
                  <div key={k} className="py-1.5 border-b border-border/50 flex justify-between text-xs">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="text-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Config Form Fields</p>
                {(selectedNode.configForm?.fields || []).map(f => (
                  <div key={f.name} className="py-1.5 border-b border-border/50 flex items-center justify-between text-xs">
                    <span className="text-foreground">{f.name}</span>
                    <span className="text-muted-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{f.type}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#0a0d14] rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>node_type_meta.json</p>
              <pre className="text-xs text-green-400 overflow-auto max-h-60" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {JSON.stringify(selectedNode, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {view === 'schema' && selected && (
          <div className="max-w-3xl">
            <h2 className="text-foreground mb-4">{selected}</h2>
            <div className="bg-[#0a0d14] rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground mb-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>TypeScript Interface</p>
              <pre className="text-xs text-cyan-400 overflow-auto" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {getSchemaDoc(selected)}
              </pre>
            </div>
          </div>
        )}

        {!selected && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <p className="text-foreground">Select an item to inspect</p>
            <p className="text-sm text-muted-foreground mt-1">Browse the metadata registry</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getSchemaDoc(type: string): string {
  const schemas: Record<string, string> = {
    WorkflowMeta: `interface WorkflowMeta {
  id: string
  name: string
  description: string
  version: string
  status: 'draft' | 'published' | 'deprecated' | 'archived'
  category: string
  tags: string[]
  author: string
  createdAt: string
  updatedAt: string
  thumbnail?: string
  inputForm: FormMeta          // Formily-compatible form schema
  outputSchema: FieldMeta[]   // Output field definitions
  nodes: WorkflowNodeInstance[]
  edges: WorkflowEdge[]
  processKey?: string          // Camunda BPMN process key
  exchange?: string            // RabbitMQ exchange for async
  ruleContext?: Record<string, unknown>  // Aviator variable context
  pageId?: string              // Auto-generated PageMeta ID
  stats?: { runs: number; avgDuration: number; successRate: number }
}`,
    NodeMeta: `interface NodeMeta {
  id: string
  type: string
  name: string
  description?: string
  category: NodeCategory      // input | output | transform | ai | logic | http | database | utility
  icon?: string
  color?: string
  inputs: PortMeta[]
  outputs: PortMeta[]
  configForm?: FormMeta       // Dynamic configuration form
  validationRule?: string     // Aviator expression for validation
  handlerBean?: string        // Spring bean name for execution
  async?: boolean             // True = routes through RabbitMQ
  serviceTask?: string        // Camunda service task type
}`,
    FormMeta: `interface FormMeta {
  id: string
  title?: string
  description?: string
  fields: FieldMeta[]
  layout?: 'vertical' | 'horizontal' | 'grid'
  submitWhen?: string         // Aviator condition for submit
  submitLabel?: string
}`,
    FieldMeta: `interface FieldMeta {
  name: string
  label: string
  type: FieldType             // string | number | boolean | select | ...
  description?: string
  placeholder?: string
  defaultValue?: unknown
  required?: boolean
  hidden?: boolean
  visibleWhen?: string        // Aviator expression
  disabledWhen?: string       // Aviator expression
  validators?: FieldValidator[]
  options?: FieldOption[]
  min?: number; max?: number; step?: number
  ui?: {
    width?: 'full' | 'half' | 'third' | 'quarter'
    prefix?: string; suffix?: string
    tooltip?: string; group?: string
  }
}`,
    PageMeta: `interface PageMeta {
  id: string
  workflowId: string
  title: string
  description?: string
  sections: PageSectionMeta[]
  theme?: { primaryColor?: string; background?: string }
}

interface PageSectionMeta {
  id: string; title?: string
  layout: 'single' | 'two-col' | 'three-col' | 'grid'
  widgets: WidgetMeta[]
}`,
    ExecutionMeta: `interface ExecutionMeta {
  id: string
  workflowId: string
  workflowName: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
  inputs: Record<string, unknown>
  outputs?: Record<string, unknown>
  startedAt: string; finishedAt?: string; durationMs?: number
  steps: ExecutionStepLog[]
  processInstanceId?: string  // Camunda process instance
  correlationId?: string      // RabbitMQ correlation ID
  error?: string
}`,
    WorkflowEdge: `interface WorkflowEdge {
  id: string
  source: string
  sourcePort: string
  target: string
  targetPort: string
  condition?: string          // Aviator expression — activates when true
}`,
    PortMeta: `interface PortMeta {
  id: string
  name: string
  type: string
  description?: string
  required?: boolean
  multiple?: boolean
}`,
  };
  return schemas[type] || `// Schema definition for ${type} not found`;
}
