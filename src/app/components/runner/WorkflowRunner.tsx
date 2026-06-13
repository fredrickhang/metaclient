// Workflow Runner — dynamically generated page from WorkflowMeta + FormEngine
import React, { useState } from 'react';
import type { WorkflowMeta, ExecutionMeta } from '../../types/metadata';
import { FormEngine } from '../engine/FormEngine';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Pending', cls: 'bg-yellow-500/20 text-yellow-400' },
    running: { label: 'Running', cls: 'bg-blue-500/20 text-blue-400' },
    success: { label: 'Success', cls: 'bg-green-500/20 text-green-400' },
    failed: { label: 'Failed', cls: 'bg-red-500/20 text-red-400' },
    idle: { label: 'Idle', cls: 'bg-gray-500/20 text-gray-400' },
    skipped: { label: 'Skipped', cls: 'bg-gray-500/20 text-gray-400' },
    error: { label: 'Error', cls: 'bg-red-500/20 text-red-400' },
    cancelled: { label: 'Cancelled', cls: 'bg-gray-500/20 text-gray-400' },
  };
  const s = map[status] || map.idle;
  return <span className={`text-xs px-2 py-0.5 rounded-full ${s.cls}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>{s.label}</span>;
}

function ExecutionTimeline({ execution }: { execution: ExecutionMeta }) {
  return (
    <div className="space-y-0">
      {execution.steps.map((step, i) => (
        <div key={step.nodeId} className="flex gap-3 relative">
          {i < execution.steps.length - 1 && (
            <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
          )}
          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs z-10 ${
            step.status === 'success' ? 'bg-green-500/20 border border-green-500/40' :
            step.status === 'error' ? 'bg-red-500/20 border border-red-500/40' :
            step.status === 'running' ? 'bg-blue-500/20 border border-blue-500/40 animate-pulse' :
            'bg-secondary border border-border'
          }`}>
            {step.status === 'success' ? '✓' : step.status === 'error' ? '✕' : step.status === 'running' ? '●' : String(i + 1)}
          </div>
          <div className="pb-4 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground">{step.nodeName}</p>
              <StatusBadge status={step.status} />
            </div>
            {step.durationMs !== undefined && step.durationMs > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {step.durationMs}ms
              </p>
            )}
            {step.error && <p className="text-xs text-destructive mt-1">{step.error}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function MockResultDisplay({ workflow, inputs }: { workflow: WorkflowMeta; inputs: Record<string, unknown> }) {
  if (workflow.id === 'wf-001') {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-secondary rounded-lg border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Generated Article</p>
          <h3 className="text-foreground mb-2">
            The Future of {String(inputs.topic || 'AI')}: A Deep Dive
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            In recent years, the landscape of {String(inputs.topic || 'technology')} has undergone remarkable transformation.
            This article explores the cutting-edge developments, emerging trends, and practical implications for businesses
            and individuals alike. With a {String(inputs.tone || 'professional')} approach, we examine the key factors
            shaping the future direction of this rapidly evolving field...
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[['Tokens Used', '2,847'], ['Word Count', String(inputs.wordCount || '800')], ['Language', String(inputs.language || 'en').toUpperCase()]].map(([k, v]) => (
            <div key={k} className="p-3 bg-secondary rounded border border-border text-center">
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="text-foreground mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{v}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="p-4 bg-[#0a0d14] rounded border border-border">
      <p className="text-xs text-muted-foreground mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>execution.output</p>
      <pre className="text-xs text-green-400 whitespace-pre-wrap overflow-auto max-h-60" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        {JSON.stringify({ status: 'success', workflowId: workflow.id, inputs, timestamp: new Date().toISOString() }, null, 2)}
      </pre>
    </div>
  );
}

interface WorkflowRunnerProps {
  workflow: WorkflowMeta;
  onBack: () => void;
}

export function WorkflowRunner({ workflow, onBack }: WorkflowRunnerProps) {
  const [phase, setPhase] = useState<'form' | 'running' | 'result'>('form');
  const [inputs, setInputs] = useState<Record<string, unknown>>({});
  const [execution, setExecution] = useState<ExecutionMeta | null>(null);
  const [progress, setProgress] = useState(0);

  const handleSubmit = (values: Record<string, unknown>) => {
    setInputs(values);
    setPhase('running');

    // Simulate Camunda process execution with RabbitMQ async steps
    const mockExecution: ExecutionMeta = {
      id: `exec-${Date.now()}`, workflowId: workflow.id, workflowName: workflow.name,
      status: 'running', startedAt: new Date().toISOString(), inputs: values,
      processInstanceId: `pi-${Math.random().toString(36).slice(2, 10)}`,
      correlationId: `corr-${Math.random().toString(36).slice(2, 10)}`,
      steps: workflow.nodes.map(n => ({
        nodeId: n.id, nodeName: n.label || n.nodeType,
        status: 'pending' as const, startedAt: new Date().toISOString(), durationMs: 0,
      })),
    };
    setExecution(mockExecution);

    // Simulate step-by-step execution
    let stepIdx = 0;
    const totalSteps = workflow.nodes.length;
    const interval = setInterval(() => {
      if (stepIdx >= totalSteps) {
        clearInterval(interval);
        setExecution(prev => prev ? { ...prev, status: 'success', finishedAt: new Date().toISOString(), durationMs: totalSteps * 600 } : prev);
        setPhase('result');
        setProgress(100);
        return;
      }
      const nodeId = workflow.nodes[stepIdx].id;
      setExecution(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          steps: prev.steps.map((s, i) =>
            i < stepIdx ? { ...s, status: 'success', durationMs: 400 + Math.random() * 400 }
            : i === stepIdx ? { ...s, status: 'running' }
            : s
          ),
        };
      });
      setProgress(Math.round(((stepIdx + 1) / totalSteps) * 95));
      stepIdx++;
    }, 700);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page header — auto-generated from workflow metadata */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
            <button onClick={onBack} className="hover:text-foreground transition-colors">← Marketplace</button>
            <span>/</span>
            <span className="text-foreground">{workflow.name}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-foreground">{workflow.name}</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">{workflow.description}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right text-xs text-muted-foreground">
                <p>v{workflow.version}</p>
                <p className="mt-0.5">by {workflow.author}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {workflow.tags.slice(0, 3).map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">{t}</span>
                ))}
              </div>
            </div>
          </div>
          {/* Metadata strip */}
          <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {workflow.stats && (
              <>
                <span>{workflow.stats.runs.toLocaleString()} runs</span>
                <span>{workflow.stats.successRate}% success</span>
                <span>~{(workflow.stats.avgDuration / 1000).toFixed(1)}s avg</span>
              </>
            )}
            <span>processKey: {workflow.processKey}</span>
            <span>exchange: {workflow.exchange}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-3 gap-6">
        {/* Main column */}
        <div className="col-span-2 space-y-6">
          {phase === 'form' && (
            <div className="bg-card rounded-xl border border-border p-6">
              <FormEngine schema={workflow.inputForm} onSubmit={handleSubmit} />
            </div>
          )}

          {phase === 'running' && execution && (
            <div className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-foreground">Executing Workflow</h3>
                  <StatusBadge status="running" />
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Progress</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  <p>process_instance: {execution.processInstanceId}</p>
                  <p>correlation_id: {execution.correlationId}</p>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-6">
                <h4 className="text-foreground mb-4">Step Execution</h4>
                <ExecutionTimeline execution={execution} />
              </div>
            </div>
          )}

          {phase === 'result' && execution && (
            <div className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-foreground">Result</h3>
                  <div className="flex items-center gap-2">
                    <StatusBadge status="success" />
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {execution.steps.reduce((a, s) => a + (s.durationMs || 0), 0)}ms
                    </span>
                  </div>
                </div>
                <MockResultDisplay workflow={workflow} inputs={inputs} />
              </div>
              <div className="bg-card rounded-xl border border-border p-6">
                <h4 className="text-foreground mb-4">Execution Timeline</h4>
                <ExecutionTimeline execution={{ ...execution, status: 'success' }} />
              </div>
              <button
                onClick={() => setPhase('form')}
                className="w-full py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors text-sm"
              >
                Run Again
              </button>
            </div>
          )}
        </div>

        {/* Sidebar: metadata panel */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Workflow Metadata</p>
            <div className="space-y-2 text-xs">
              {[
                ['ID', workflow.id],
                ['Version', workflow.version],
                ['Status', workflow.status],
                ['Category', workflow.category],
                ['Nodes', String(workflow.nodes.length)],
                ['Edges', String(workflow.edges.length)],
                ['Process Key', workflow.processKey || '—'],
                ['MQ Exchange', workflow.exchange || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-muted-foreground flex-shrink-0">{k}</span>
                  <span className="text-foreground truncate" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Input Schema</p>
            <div className="space-y-1.5">
              {workflow.inputForm.fields.map(f => (
                <div key={f.name} className="flex items-center gap-2 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.required ? 'bg-destructive' : 'bg-muted-foreground'}`} />
                  <span className="text-foreground">{f.name}</span>
                  <span className="ml-auto text-muted-foreground/60" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{f.type}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Output Schema</p>
            <div className="space-y-1.5">
              {workflow.outputSchema.map(f => (
                <div key={f.name} className="flex items-center gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                  <span className="text-foreground">{f.name}</span>
                  <span className="ml-auto text-muted-foreground/60" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{f.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
