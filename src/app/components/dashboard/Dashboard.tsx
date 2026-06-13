// Execution Dashboard — real-time execution history, metrics, system status
import React, { useState } from 'react';
import type { ExecutionMeta } from '../../types/metadata';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const CHART_DATA = [
  { time: '00:00', runs: 12, success: 11 }, { time: '02:00', runs: 8, success: 8 },
  { time: '04:00', runs: 5, success: 5 }, { time: '06:00', runs: 18, success: 17 },
  { time: '08:00', runs: 45, success: 43 }, { time: '10:00', runs: 67, success: 64 },
  { time: '12:00', runs: 89, success: 85 }, { time: '14:00', runs: 72, success: 70 },
  { time: '16:00', runs: 94, success: 91 }, { time: '18:00', runs: 61, success: 59 },
  { time: '20:00', runs: 38, success: 37 }, { time: '22:00', runs: 24, success: 23 },
];

const QUEUE_DATA = [
  { name: 'ai.content', pending: 3, processing: 1 },
  { name: 'data.etl', pending: 8, processing: 2 },
  { name: 'vision.analyze', pending: 0, processing: 1 },
  { name: 'nlp.sentiment', pending: 2, processing: 0 },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: 'bg-green-500/15 text-green-400 border border-green-500/25',
    running: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
    failed: 'bg-red-500/15 text-red-400 border border-red-500/25',
    pending: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
    cancelled: 'bg-gray-500/15 text-gray-400 border border-gray-500/25',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${map[status] || map.pending}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      {status}
    </span>
  );
}

function SystemServiceCard({ name, status, latency, uptime }: { name: string; status: 'up' | 'down' | 'degraded'; latency: string; uptime: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${status === 'up' ? 'bg-green-400' : status === 'degraded' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'}`} />
        <div>
          <p className="text-sm text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{latency} · {uptime}</p>
        </div>
      </div>
      <span className={`text-xs ${status === 'up' ? 'text-green-400' : status === 'degraded' ? 'text-yellow-400' : 'text-red-400'}`}>
        {status === 'up' ? 'Healthy' : status === 'degraded' ? 'Degraded' : 'Down'}
      </span>
    </div>
  );
}

interface DashboardProps {
  executions: ExecutionMeta[];
  onViewExecution?: (id: string) => void;
}

export function Dashboard({ executions, onViewExecution }: DashboardProps) {
  const [tab, setTab] = useState<'executions' | 'queues' | 'system'>('executions');

  const successCount = executions.filter(e => e.status === 'success').length;
  const failedCount = executions.filter(e => e.status === 'failed').length;
  const runningCount = executions.filter(e => e.status === 'running').length;
  const avgDuration = executions.filter(e => e.durationMs).reduce((s, e) => s + (e.durationMs || 0), 0) / (executions.filter(e => e.durationMs).length || 1);

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Executions', value: String(executions.length), sub: 'all time', color: 'text-foreground' },
          { label: 'Success', value: String(successCount), sub: `${Math.round(successCount / executions.length * 100)}% rate`, color: 'text-green-400' },
          { label: 'Failed', value: String(failedCount), sub: 'require attention', color: 'text-red-400' },
          { label: 'Running Now', value: String(runningCount), sub: 'active processes', color: 'text-blue-400' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className={`mt-1 ${kpi.color}`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '2rem', fontWeight: 600, lineHeight: 1.2 }}>{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-foreground">Execution Volume (24h)</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Total</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Success</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={CHART_DATA}>
              <defs>
                <linearGradient id="runsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }} />
              <Area type="monotone" dataKey="runs" stroke="#6366f1" fill="url(#runsGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="success" stroke="#22c55e" fill="url(#successGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-foreground mb-4">RabbitMQ Queues</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={QUEUE_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', fontSize: 12 }} />
              <Bar dataKey="pending" fill="rgba(251,146,60,0.6)" radius={2} />
              <Bar dataKey="processing" fill="rgba(99,102,241,0.6)" radius={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="border-b border-border px-4">
          <div className="flex gap-0">
            {(['executions', 'queues', 'system'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm border-b-2 transition-colors capitalize ${
                  tab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'executions' ? 'Execution History' : t === 'queues' ? 'Message Queues' : 'System Status'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'executions' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Execution ID', 'Workflow', 'Status', 'Duration', 'Process Instance', 'Started'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {executions.map(exec => (
                  <tr key={exec.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => onViewExecution?.(exec.id)}>
                    <td className="px-4 py-3 text-xs text-primary" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{exec.id}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{exec.workflowName}</td>
                    <td className="px-4 py-3"><StatusBadge status={exec.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {exec.durationMs ? `${exec.durationMs}ms` : exec.status === 'running' ? '…' : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{exec.processInstanceId || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(exec.startedAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'queues' && (
          <div className="p-4 grid grid-cols-2 gap-4">
            {QUEUE_DATA.map(q => (
              <div key={q.name} className="bg-secondary rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-foreground" style={{ fontFamily: 'JetBrains Mono, monospace' }}>workflow.{q.name}</p>
                  <span className={`text-xs ${q.processing > 0 ? 'text-blue-400' : 'text-muted-foreground'}`}>
                    {q.processing > 0 ? `${q.processing} active` : 'idle'}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <p className="text-muted-foreground">Pending</p>
                    <p className="text-orange-400 mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.25rem', fontWeight: 600 }}>{q.pending}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Processing</p>
                    <p className="text-primary mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.25rem', fontWeight: 600 }}>{q.processing}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'system' && (
          <div className="p-4 space-y-3">
            <SystemServiceCard name="Spring Boot App" status="up" latency="12ms" uptime="99.98%" />
            <SystemServiceCard name="MySQL (Primary)" status="up" latency="3ms" uptime="100%" />
            <SystemServiceCard name="Redis Cache" status="up" latency="0.8ms" uptime="100%" />
            <SystemServiceCard name="RabbitMQ Broker" status="up" latency="2ms" uptime="99.95%" />
            <SystemServiceCard name="Camunda Engine" status="up" latency="18ms" uptime="99.9%" />
            <SystemServiceCard name="Aviator Rule Engine" status="up" latency="1ms" uptime="100%" />
            <SystemServiceCard name="Vision API" status="degraded" latency="420ms" uptime="97.2%" />
          </div>
        )}
      </div>
    </div>
  );
}
