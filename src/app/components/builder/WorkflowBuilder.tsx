// Visual Workflow Builder — metadata-driven node graph editor
import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { WorkflowMeta, WorkflowNodeInstance, WorkflowEdge, NodeMeta } from '../../types/metadata';
import { NODE_TYPE_REGISTRY } from '../../data/mockRegistry';

const CATEGORY_COLORS: Record<string, string> = {
  input: '#6366f1', output: '#fb923c', transform: '#34d399',
  ai: '#a78bfa', logic: '#f59e0b', http: '#22d3ee',
  database: '#38bdf8', utility: '#94a3b8',
};

const NODE_ICONS: Record<string, React.ReactNode> = {
  Globe: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />,
  BrainCircuit: <><circle cx="12" cy="12" r="3" strokeWidth={1.5} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v4M12 18v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M2 12h4M18 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></>,
  Wand2: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 4V2m0 14v-2M8 9H2m14 0h-2m-4.94-4.06L7.5 3.38M18.62 18.62l-1.56-1.56M8 15l-1.56 1.56M18.62 5.38l-1.56 1.56M14 9l-4 4" />,
  GitBranch: <><line x1="6" y1="3" x2="6" y2="15" strokeWidth={1.5} /><path d="M18 3v4c0 2-2 4-4 4H6" strokeWidth={1.5} strokeLinecap="round" /><circle cx="18" cy="3" r="2" strokeWidth={1.5} /><circle cx="6" cy="21" r="2" strokeWidth={1.5} /></>,
  Database: <><ellipse cx="12" cy="5" rx="9" ry="3" strokeWidth={1.5} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></>,
  FormInput: <><rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={1.5} /><path strokeLinecap="round" strokeWidth={1.5} d="M6 12h4" /></>,
  LayoutTemplate: <><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.5} /><path strokeLinecap="round" strokeWidth={1.5} d="M3 9h18M9 21V9" /></>,
};

function NodeIcon({ iconName, color }: { iconName: string; color: string }) {
  const paths = NODE_ICONS[iconName] || <circle cx="12" cy="12" r="6" strokeWidth={1.5} />;
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} className="flex-shrink-0">
      {paths}
    </svg>
  );
}

function NodeCard({
  node, nodeMeta, selected, onSelect, onDrag,
}: {
  node: WorkflowNodeInstance; nodeMeta: NodeMeta | undefined;
  selected: boolean; onSelect: () => void;
  onDrag: (id: string, dx: number, dy: number) => void;
}) {
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const color = nodeMeta ? (CATEGORY_COLORS[nodeMeta.category] || '#6366f1') : '#6366f1';
  const statusColors = { idle: '', running: 'animate-pulse', success: '', error: '', skipped: 'opacity-50' };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    dragStart.current = { x: e.clientX, y: e.clientY };
    onSelect();
    const move = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      onDrag(node.id, ev.clientX - dragStart.current.x, ev.clientY - dragStart.current.y);
      dragStart.current = { x: ev.clientX, y: ev.clientY };
    };
    const up = () => {
      dragStart.current = null;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <div
      style={{ left: node.position.x, top: node.position.y, position: 'absolute', borderColor: selected ? color : 'rgba(99,102,241,0.2)' }}
      className={`w-44 rounded-lg border bg-[#131c2e] cursor-grab active:cursor-grabbing select-none transition-shadow ${statusColors[node.status || 'idle']} ${selected ? 'shadow-[0_0_0_2px_rgba(99,102,241,0.4)] z-10' : 'hover:border-primary/40'}`}
      onMouseDown={handleMouseDown}
    >
      <div className="px-3 py-2 rounded-t-lg flex items-center gap-2" style={{ background: `${color}18`, borderBottom: `1px solid ${color}30` }}>
        <NodeIcon iconName={nodeMeta?.icon || 'circle'} color={color} />
        <span className="text-xs truncate" style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>
          {nodeMeta?.category || 'node'}
        </span>
        {node.status === 'running' && <div className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        {node.status === 'success' && <div className="ml-auto w-2 h-2 rounded-full bg-green-400" />}
        {node.status === 'error' && <div className="ml-auto w-2 h-2 rounded-full bg-red-400" />}
      </div>
      <div className="px-3 py-2">
        <p className="text-sm text-foreground truncate">{node.label || nodeMeta?.name}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{nodeMeta?.name}</p>
      </div>
      {/* Input ports */}
      <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 space-y-1">
        {nodeMeta?.inputs.map(port => (
          <div key={port.id} className="w-3 h-3 rounded-full border-2 bg-[#131c2e]" style={{ borderColor: color }} title={port.name} />
        ))}
      </div>
      {/* Output ports */}
      <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 space-y-1">
        {nodeMeta?.outputs.map(port => (
          <div key={port.id} className="w-3 h-3 rounded-full border-2 bg-[#131c2e]" style={{ borderColor: color }} title={port.name} />
        ))}
      </div>
    </div>
  );
}

function EdgeLine({ edge, nodes }: { edge: WorkflowEdge; nodes: WorkflowNodeInstance[] }) {
  const src = nodes.find(n => n.id === edge.source);
  const tgt = nodes.find(n => n.id === edge.target);
  if (!src || !tgt) return null;
  const x1 = src.position.x + 176; const y1 = src.position.y + 45;
  const x2 = tgt.position.x; const y2 = tgt.position.y + 45;
  const cx1 = x1 + (x2 - x1) * 0.5; const cx2 = x2 - (x2 - x1) * 0.5;
  return (
    <path
      d={`M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`}
      fill="none" stroke="rgba(99,102,241,0.5)" strokeWidth={1.5}
      strokeDasharray={edge.condition ? '6,3' : undefined}
      markerEnd="url(#arrowhead)"
    />
  );
}

interface WorkflowBuilderProps {
  workflow: WorkflowMeta;
  onUpdate?: (workflow: WorkflowMeta) => void;
}

export function WorkflowBuilder({ workflow, onUpdate }: WorkflowBuilderProps) {
  const [nodes, setNodes] = useState<WorkflowNodeInstance[]>(workflow.nodes);
  const [edges] = useState<WorkflowEdge[]>(workflow.edges);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showNodePanel, setShowNodePanel] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  const handleDrag = useCallback((id: string, dx: number, dy: number) => {
    setNodes(prev => prev.map(n => n.id === id
      ? { ...n, position: { x: n.position.x + dx / zoom, y: n.position.y + dy / zoom } }
      : n
    ));
  }, [zoom]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedNode(null);
      isPanning.current = true;
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (isPanning.current) setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
    };
    const up = () => { isPanning.current = false; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);

  const addNode = (nodeType: string) => {
    const meta = NODE_TYPE_REGISTRY[nodeType];
    if (!meta) return;
    const newNode: WorkflowNodeInstance = {
      id: `n${Date.now()}`, nodeType,
      label: meta.name,
      position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
      config: {},
    };
    setNodes(prev => [...prev, newNode]);
  };

  const selectedMeta = selectedNode ? nodes.find(n => n.id === selectedNode) : null;
  const selectedNodeMeta = selectedMeta ? NODE_TYPE_REGISTRY[selectedMeta.nodeType] : null;

  return (
    <div className="flex h-full bg-[#080b12] overflow-hidden">
      {/* Left: Node Palette */}
      {showNodePanel && (
        <div className="w-56 border-r border-border bg-[#0d1117] flex flex-col flex-shrink-0">
          <div className="px-3 py-3 border-b border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Node Types</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {Object.values(NODE_TYPE_REGISTRY).map(meta => {
              const color = CATEGORY_COLORS[meta.category] || '#6366f1';
              return (
                <button
                  key={meta.id}
                  onClick={() => addNode(meta.type)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-secondary text-left transition-colors group"
                >
                  <NodeIcon iconName={meta.icon || 'circle'} color={color} />
                  <div className="min-w-0">
                    <p className="text-xs text-foreground truncate">{meta.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{meta.category}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Center: Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {/* Toolbar */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNodePanel(p => !p)}
              className="px-3 py-1.5 bg-secondary border border-border rounded text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showNodePanel ? '◀ Hide' : '▶ Nodes'}
            </button>
            <span className="text-xs text-muted-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {nodes.length} nodes · {edges.length} edges
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} className="w-7 h-7 bg-secondary border border-border rounded text-muted-foreground hover:text-foreground text-sm">−</button>
            <span className="text-xs text-muted-foreground w-12 text-center" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-7 h-7 bg-secondary border border-border rounded text-muted-foreground hover:text-foreground text-sm">+</button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="px-3 py-1.5 bg-secondary border border-border rounded text-xs text-muted-foreground hover:text-foreground">Fit</button>
          </div>
        </div>

        {/* Graph canvas */}
        <div
          ref={canvasRef}
          className="w-full h-full cursor-default"
          style={{ backgroundImage: `radial-gradient(circle, rgba(99,102,241,0.12) 1px, transparent 1px)`, backgroundSize: `${24 * zoom}px ${24 * zoom}px`, backgroundPosition: `${pan.x}px ${pan.y}px` }}
          onMouseDown={handleCanvasMouseDown}
        >
          <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', position: 'absolute', width: '100%', height: '100%' }}>
            {/* SVG edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="rgba(99,102,241,0.6)" />
                </marker>
              </defs>
              {edges.map(edge => <EdgeLine key={edge.id} edge={edge} nodes={nodes} />)}
            </svg>
            {/* Nodes */}
            {nodes.map(node => (
              <NodeCard
                key={node.id}
                node={node}
                nodeMeta={NODE_TYPE_REGISTRY[node.nodeType]}
                selected={selectedNode === node.id}
                onSelect={() => setSelectedNode(node.id)}
                onDrag={handleDrag}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right: Node Config Panel */}
      {selectedMeta && selectedNodeMeta && (
        <div className="w-72 border-l border-border bg-[#0d1117] flex flex-col flex-shrink-0 overflow-y-auto">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">{selectedNodeMeta.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedNodeMeta.description}</p>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <div className="p-4 space-y-4">
            {/* Ports */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Ports</p>
              {selectedNodeMeta.inputs.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-primary">Inputs</p>
                  {selectedNodeMeta.inputs.map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-primary/60 flex-shrink-0" />
                      <span>{p.name}</span>
                      <span className="ml-auto text-muted-foreground/50" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{p.type}</span>
                    </div>
                  ))}
                </div>
              )}
              {selectedNodeMeta.outputs.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-accent-foreground" style={{ color: CATEGORY_COLORS[selectedNodeMeta.category] }}>Outputs</p>
                  {selectedNodeMeta.outputs.map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[selectedNodeMeta.category] + '80' }} />
                      <span>{p.name}</span>
                      <span className="ml-auto text-muted-foreground/50" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{p.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Metadata info */}
            <div className="pt-2 border-t border-border space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Metadata</p>
              {[
                ['Handler Bean', selectedNodeMeta.handlerBean],
                ['Async', selectedNodeMeta.async ? 'Yes (RabbitMQ)' : 'No'],
                ['Service Task', selectedNodeMeta.serviceTask || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Config Fields</p>
              {selectedNodeMeta.configForm?.fields.map(f => (
                <div key={f.name} className="py-1.5 border-b border-border/50 flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-foreground">{f.label}</p>
                    <p className="text-xs text-muted-foreground/60">{f.type}</p>
                  </div>
                  {f.required && <span className="text-xs text-destructive">req</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
