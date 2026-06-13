// 应用渲染引擎 — 根据 AppMeta JSON 动态渲染完整应用页面
import React, { useState, useCallback } from 'react';
import type { AppMeta, InputFieldMeta, OutputFieldMeta } from '../../types/appMeta';
import { runApp } from '../../api/client';

// ── 输入字段组件 ──────────────────────────────────────────────

function FieldLabel({ field }: { field: InputFieldMeta }) {
  return (
    <label className="block text-sm font-medium text-foreground mb-1.5">
      {field.label}
      {field.required && <span className="text-destructive ml-1">*</span>}
    </label>
  );
}

const baseInput = "w-full px-3.5 py-2.5 bg-white border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all";

function TextInput({ field, value, onChange, primaryColor }: { field: InputFieldMeta; value: string; onChange: (v: unknown) => void; primaryColor: string }) {
  return (
    <input
      type="text" value={value || ''} placeholder={field.placeholder}
      onChange={e => onChange(e.target.value)}
      className={baseInput}
      style={{ '--tw-ring-color': `${primaryColor}40` } as React.CSSProperties}
      onFocus={e => e.target.style.borderColor = primaryColor}
      onBlur={e => e.target.style.borderColor = ''}
    />
  );
}

function TextareaInput({ field, value, onChange }: { field: InputFieldMeta; value: string; onChange: (v: unknown) => void }) {
  return (
    <textarea
      value={value || ''} placeholder={field.placeholder} rows={field.rows || 4}
      onChange={e => onChange(e.target.value)}
      className={baseInput + ' resize-none'}
    />
  );
}

function SelectInput({ field, value, onChange }: { field: InputFieldMeta; value: string; onChange: (v: unknown) => void }) {
  return (
    <div className="relative">
      <select
        value={value || String(field.defaultValue || '')}
        onChange={e => onChange(e.target.value)}
        className={baseInput + ' appearance-none pr-10 cursor-pointer'}
      >
        {field.options?.map(opt => (
          <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
        ))}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}

function MultiSelectInput({ field, value, onChange }: { field: InputFieldMeta; value: string[]; onChange: (v: unknown) => void }) {
  const selected = value || (field.defaultValue as string[]) || [];
  const toggle = (v: string) => {
    const next = selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v];
    onChange(next);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {field.options?.map(opt => {
        const active = selected.includes(String(opt.value));
        return (
          <button key={String(opt.value)} type="button" onClick={() => toggle(String(opt.value))}
            className={`px-3.5 py-1.5 rounded-full text-sm border-2 transition-all ${active ? 'text-white' : 'border-border text-muted-foreground bg-white hover:border-current'}`}
            style={active ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SliderInput({ field, value, onChange }: { field: InputFieldMeta; value: number; onChange: (v: unknown) => void }) {
  const val = value ?? field.defaultValue ?? field.min ?? 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <input type="range" min={field.min ?? 0} max={field.max ?? 100} step={field.step ?? 1}
          value={val} onChange={e => onChange(Number(e.target.value))} className="flex-1 accent-primary h-1.5" />
        <span className="text-sm font-medium text-primary w-10 text-right tabular-nums">{val}</span>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{field.min ?? 0}</span><span>{field.max ?? 100}</span>
      </div>
    </div>
  );
}

function BooleanInput({ field, value, onChange }: { field: InputFieldMeta; value: boolean; onChange: (v: unknown) => void }) {
  const checked = value ?? field.defaultValue ?? false;
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 rounded-full transition-colors duration-200"
        style={{ background: checked ? 'var(--primary)' : '#e2e8f0' }}>
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-0.5 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
      <span className="text-sm text-foreground">{checked ? '已开启' : '已关闭'}</span>
    </div>
  );
}

function FileInput({ field, onChange }: { field: InputFieldMeta; onChange: (v: unknown) => void }) {
  const [fileName, setFileName] = useState('');
  const isMedia = field.type === 'image' || field.type === 'video';
  return (
    <label className="flex flex-col items-center justify-center gap-3 py-8 bg-white border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-accent/30 transition-all">
      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
        {field.type === 'image' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>}
        {field.type === 'video' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>}
        {field.type === 'file' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
      </div>
      <div className="text-center">
        <p className="text-sm text-foreground">{fileName || `点击上传${field.label}`}</p>
        <p className="text-xs text-muted-foreground mt-1">{field.accept || (isMedia ? '支持常见格式' : '支持所有格式')}</p>
      </div>
      <input type="file" accept={field.accept} className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) { setFileName(f.name); onChange(f); } }} />
    </label>
  );
}

function RenderInput({ field, value, onChange, primaryColor }: { field: InputFieldMeta; value: unknown; onChange: (v: unknown) => void; primaryColor: string }) {
  const p = { field, value: value as never, onChange, primaryColor };
  switch (field.type) {
    case 'text': case 'url': case 'password': return <TextInput {...p} />;
    case 'textarea': return <TextareaInput {...p} />;
    case 'number': return <input type="number" value={String(value ?? '')} onChange={e => onChange(Number(e.target.value))} placeholder={field.placeholder} min={field.min} max={field.max} step={field.step} className={baseInput} />;
    case 'select': return <SelectInput {...p} />;
    case 'multiselect': return <MultiSelectInput {...p} />;
    case 'slider': return <SliderInput {...p} />;
    case 'boolean': return <BooleanInput {...p} />;
    case 'image': case 'video': case 'file': return <FileInput {...p} />;
    case 'date': return <input type="date" value={String(value ?? '')} onChange={e => onChange(e.target.value)} className={baseInput} />;
    default: return <TextInput {...p} />;
  }
}

// ── 输出展示组件 ──────────────────────────────────────────────

function extractByPath(obj: unknown, path: string): unknown {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function OutputItem({ field, data }: { field: OutputFieldMeta; data: unknown }) {
  const value = extractByPath(data, field.jsonPath);

  const inner = () => {
    if (value === undefined || value === null) {
      return <div className="text-muted-foreground text-sm py-4 text-center">暂无数据</div>;
    }
    switch (field.type) {
      case 'text': case 'number':
        return <p className="text-foreground text-base">{String(value)}</p>;
      case 'markdown':
        return <div className="prose prose-sm max-w-none text-foreground text-sm leading-relaxed whitespace-pre-wrap">{String(value)}</div>;
      case 'image':
        return (
          <img src={String(value)} alt={field.label} className="w-full rounded-xl object-cover max-h-80"
            onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop&auto=format'; }} />
        );
      case 'video':
        return <video src={String(value)} controls className="w-full rounded-xl" />;
      case 'audio':
        return <audio src={String(value)} controls className="w-full" />;
      case 'json':
        return <pre className="text-xs text-foreground bg-muted rounded-xl p-4 overflow-auto max-h-60 mono">{JSON.stringify(value, null, 2)}</pre>;
      case 'tag-list': {
        const tags = Array.isArray(value) ? value : String(value).split(',');
        return (
          <div className="flex flex-wrap gap-2">
            {tags.map((t, i) => <span key={i} className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm">{String(t).trim()}</span>)}
          </div>
        );
      }
      case 'progress': {
        const pct = Math.min(100, Math.max(0, Number(value) * (Number(value) <= 1 ? 100 : 1)));
        return (
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{field.label}</span>
              <span className="font-semibold text-foreground">{pct.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      }
      case 'download':
        return <a href={String(value)} download={field.downloadName || field.label} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary/90 transition-colors">⬇ 下载 {field.label}</a>;
      default:
        return <p className="text-foreground text-sm">{String(value)}</p>;
    }
  };

  if (field.type === 'progress') return <div className={field.width === 'half' ? '' : 'col-span-2'}>{inner()}</div>;

  return (
    <div className={field.width === 'half' ? '' : 'col-span-2'}>
      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">{field.label}</p>
      <div>{inner()}</div>
    </div>
  );
}

// ── 生成历史侧栏 ──────────────────────────────────────────────

type HistoryStatus = 'completed' | 'failed' | 'running';

interface HistoryRecord {
  id: string;
  appName: string;
  status: HistoryStatus;
  createdAt: Date;
  durationMs: number;
  creditsUsed: number;
  resultType: 'text' | 'image' | 'video' | 'markdown';
  resultPreview: string;
}

// 全局历史（所有应用，按时间倒序）
const GLOBAL_HISTORY: HistoryRecord[] = [
  { id: 'g01', appName: '视频动作迁移', status: 'completed', createdAt: new Date(Date.now() - 60000 * 8), durationMs: 4200, creditsUsed: 8, resultType: 'video', resultPreview: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' },
  { id: 'g02', appName: 'AI 图片生成', status: 'completed', createdAt: new Date(Date.now() - 60000 * 25), durationMs: 6300, creditsUsed: 12, resultType: 'image', resultPreview: 'https://images.unsplash.com/photo-1684891200793-7a2e8b167c4c?w=400&h=400&fit=crop&auto=format' },
  { id: 'g03', appName: '智能文本摘要', status: 'completed', createdAt: new Date(Date.now() - 60000 * 55), durationMs: 3100, creditsUsed: 3, resultType: 'text', resultPreview: '这篇文章深入探讨了人工智能在现代社会的广泛应用，从医疗诊断到自动驾驶…' },
  { id: 'g04', appName: '漫画风格转换', status: 'failed', createdAt: new Date(Date.now() - 60000 * 80), durationMs: 900, creditsUsed: 0, resultType: 'text', resultPreview: '错误：图片分辨率过低，请上传至少 512×512 的图片' },
  { id: 'g05', appName: '商品主图优化', status: 'completed', createdAt: new Date(Date.now() - 60000 * 120), durationMs: 2800, creditsUsed: 4, resultType: 'image', resultPreview: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&auto=format' },
  { id: 'g06', appName: '短视频脚本生成', status: 'completed', createdAt: new Date(Date.now() - 60000 * 180), durationMs: 1800, creditsUsed: 5, resultType: 'text', resultPreview: '【开场钩子】你知道吗？90% 的人都不知道这个减肥技巧…\n【正文】…' },
  { id: 'g07', appName: 'AI 图片生成', status: 'completed', createdAt: new Date(Date.now() - 60000 * 240), durationMs: 7100, creditsUsed: 12, resultType: 'image', resultPreview: 'https://images.unsplash.com/photo-1543872084-c7bd3822856f?w=400&h=400&fit=crop&auto=format' },
  { id: 'g08', appName: '视频动作迁移', status: 'completed', createdAt: new Date(Date.now() - 60000 * 300), durationMs: 5800, creditsUsed: 8, resultType: 'video', resultPreview: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' },
  { id: 'g09', appName: '语音转文字', status: 'completed', createdAt: new Date(Date.now() - 60000 * 400), durationMs: 4100, creditsUsed: 5, resultType: 'text', resultPreview: '转录内容：大家好，今天我们来聊一聊人工智能的最新进展…' },
  { id: 'g10', appName: '创意海报生成', status: 'failed', createdAt: new Date(Date.now() - 60000 * 500), durationMs: 600, creditsUsed: 0, resultType: 'text', resultPreview: '服务暂时不可用，请稍后重试' },
  { id: 'g11', appName: 'Logo 设计生成', status: 'completed', createdAt: new Date(Date.now() - 60000 * 600), durationMs: 5200, creditsUsed: 10, resultType: 'image', resultPreview: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=400&fit=crop&auto=format' },
  { id: 'g12', appName: '智能文本摘要', status: 'completed', createdAt: new Date(Date.now() - 60000 * 700), durationMs: 2600, creditsUsed: 3, resultType: 'text', resultPreview: '核心观点：AI 将在未来十年内彻底改变各行各业的运作模式…' },
];

const HISTORY_PAGE_SIZE = 4;

function timeAgo(d: Date) {
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  return `${Math.floor(hrs / 24)} 天前`;
}

function PreviewModal({ record, onClose }: { record: HistoryRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-foreground">{record.appName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(record.createdAt)} · {(record.durationMs / 1000).toFixed(1)}s · {record.creditsUsed} 积分</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">✕</button>
        </div>
        {record.resultType === 'video' ? (
          <video src={record.resultPreview} controls autoPlay className="w-full rounded-xl" />
        ) : record.resultType === 'image' ? (
          <img src={record.resultPreview} alt="结果" className="w-full rounded-xl object-cover max-h-80" />
        ) : (
          <div className="bg-muted rounded-xl p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {record.resultPreview}
          </div>
        )}
      </div>
    </div>
  );
}

function HistorySidebar() {
  const [preview, setPreview] = useState<HistoryRecord | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(GLOBAL_HISTORY.length / HISTORY_PAGE_SIZE);
  const pageRecords = GLOBAL_HISTORY.slice((page - 1) * HISTORY_PAGE_SIZE, page * HISTORY_PAGE_SIZE);

  return (
    <>
      <div className="w-64 flex-shrink-0 border-l border-border bg-white flex flex-col">
        <div className="px-4 py-3.5 border-b border-border flex-shrink-0">
          <p className="text-sm font-semibold text-foreground">生成历史</p>
          <p className="text-xs text-muted-foreground mt-0.5">我的所有调用记录</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {pageRecords.map(r => (
            <div key={r.id} className="border border-border rounded-xl p-3 hover:border-foreground/20 transition-colors">
              {/* 应用名 + 状态 */}
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-foreground truncate flex-1 mr-2">{r.appName}</p>
                <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full border ${
                  r.status === 'completed' ? 'bg-green-50 text-green-600 border-green-200'
                  : r.status === 'failed' ? 'bg-red-50 text-red-500 border-red-200'
                  : 'bg-blue-50 text-blue-600 border-blue-200'
                }`}>
                  {r.status === 'completed' ? '完成' : r.status === 'failed' ? '失败' : '进行中'}
                </span>
              </div>

              {/* 结果预览 */}
              {r.status === 'completed' && (
                <div className="mb-2 cursor-pointer" onClick={() => setPreview(r)}>
                  {r.resultType === 'video' ? (
                    <div className="relative rounded-lg overflow-hidden bg-slate-900 h-16 flex items-center justify-center group">
                      <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center group-hover:bg-white transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-slate-800 ml-0.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                      </div>
                      <span className="absolute bottom-1 right-2 text-white/60 text-xs">视频</span>
                    </div>
                  ) : r.resultType === 'image' ? (
                    <img src={r.resultPreview} alt="" className="w-full h-16 rounded-lg object-cover hover:opacity-90 transition-opacity" />
                  ) : (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{r.resultPreview}</p>
                  )}
                </div>
              )}
              {r.status === 'failed' && (
                <p className="text-xs text-red-400 line-clamp-1 mb-1.5">{r.resultPreview}</p>
              )}

              {/* 元信息 + 预览按钮 */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{timeAgo(r.createdAt)}</span>
                <div className="flex items-center gap-2">
                  {r.creditsUsed > 0 && <span className="text-amber-500">{r.creditsUsed}积分</span>}
                  {r.status === 'completed' && (
                    <button onClick={() => setPreview(r)} className="text-primary hover:underline">预览</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 分页 */}
        <div className="flex items-center justify-between px-3 py-3 border-t border-border flex-shrink-0">
          <span className="text-xs text-muted-foreground">{GLOBAL_HISTORY.length} 条记录</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground disabled:opacity-30 hover:bg-muted transition-colors text-xs"
            >‹</button>
            <span className="text-xs text-muted-foreground tabular-nums px-1">{page}/{totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground disabled:opacity-30 hover:bg-muted transition-colors text-xs"
            >›</button>
          </div>
        </div>
      </div>
      {preview && <PreviewModal record={preview} onClose={() => setPreview(null)} />}
    </>
  );
}

// ── 主渲染引擎 ────────────────────────────────────────────────

interface AppRendererProps {
  app: AppMeta;
  onBack: () => void;
}

async function mockApiCall(app: AppMeta, inputs: Record<string, unknown>): Promise<Record<string, unknown>> {
  await new Promise(r => setTimeout(r, 2500 + Math.random() * 2000));

  if (app.id === 'app-001') {
    return {
      data: {
        status: 'completed',
        result: {
          video_url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
          similarity: 0.87,
          processing_time: '4.2s',
        }
      }
    };
  }
  if (app.id === 'app-002') {
    return { data: { images: 'https://images.unsplash.com/photo-1684891200793-7a2e8b167c4c?w=800&h=800&fit=crop&auto=format' } };
  }
  if (app.id === 'app-003') {
    return {
      data: {
        summary: '**核心要点**\n\n这篇文章深入探讨了人工智能在现代社会的广泛应用，从医疗诊断到自动驾驶，再到自然语言处理。研究表明，AI 技术正在以前所未有的速度改变各行各业的运作方式，预计到 2030 年将为全球经济贡献约 15.7 万亿美元的价值。',
        keywords: ['人工智能', 'AI应用', '机器学习', '深度学习', '自动化'],
        word_count: '3,842',
        read_time: '约 8 分钟',
      }
    };
  }
  const result: Record<string, unknown> = { data: {} };
  for (const output of app.outputs) {
    const parts = output.jsonPath.split('.');
    let cur: Record<string, unknown> = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]] as Record<string, unknown>;
    }
    const last = parts[parts.length - 1];
    if (output.type === 'text' || output.type === 'markdown') cur[last] = '示例输出内容 — 接口调用成功';
    else if (output.type === 'number') cur[last] = Math.random().toFixed(2);
    else if (output.type === 'progress') cur[last] = Math.random() * 0.5 + 0.5;
    else if (output.type === 'tag-list') cur[last] = ['标签一', '标签二', '标签三'];
    else cur[last] = '示例数据';
  }
  return result;
}

export function AppRenderer({ app, onBack }: AppRendererProps) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const f of app.inputs) {
      if (f.defaultValue !== undefined) init[f.name] = f.defaultValue;
    }
    return init;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<'form' | 'running' | 'result'>('form');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [progress, setProgress] = useState(0);
  const [runDuration, setRunDuration] = useState(0);
  const [creditsUsed] = useState(() => Math.floor(Math.random() * 10) + 3);

  const primaryColor = app.layout.primaryColor || '#5b6af7';

  const validate = () => {
    const errs: Record<string, string> = {};
    for (const f of app.inputs) {
      if (f.required && (values[f.name] === undefined || values[f.name] === '' || values[f.name] === null)) {
        errs[f.name] = `请填写${f.label}`;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setPhase('running');
    setProgress(0);
    const startTime = Date.now();

    const tick = setInterval(() => setProgress(p => Math.min(p + Math.random() * 12, 90)), 400);
    try {
      const res = await runApp(app.id, values);
      clearInterval(tick);
      setProgress(100);
      setRunDuration(res.durationMs || Date.now() - startTime);
      // 将 runner 的 outputs 包装成引擎期待的 { data: outputs } 格式
      setResult({ data: res.outputs ?? {} });
      setTimeout(() => setPhase('result'), 400);
    } catch (err) {
      clearInterval(tick);
      console.log('Run app error:', err);
      setPhase('form');
    }
  }, [values, app]);

  const renderInputFields = () => {
    const rows: InputFieldMeta[][] = [];
    let i = 0;
    while (i < app.inputs.length) {
      const f = app.inputs[i];
      if (f.width === 'half' && i + 1 < app.inputs.length && app.inputs[i + 1].width === 'half') {
        rows.push([f, app.inputs[i + 1]]);
        i += 2;
      } else {
        rows.push([f]);
        i++;
      }
    }
    return rows.map((row, ri) => (
      <div key={ri} className={`grid gap-4 ${row.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {row.map(field => (
          <div key={field.name}>
            <FieldLabel field={field} />
            <RenderInput field={field} value={values[field.name]} onChange={v => setValues(p => ({ ...p, [field.name]: v }))} primaryColor={primaryColor} />
            {errors[field.name] && <p className="text-xs text-destructive mt-1">{errors[field.name]}</p>}
            {field.description && !errors[field.name] && <p className="text-xs text-muted-foreground mt-1">{field.description}</p>}
          </div>
        ))}
      </div>
    ));
  };

  const CATEGORY_ICONS: Record<string, string> = {
    '视频处理': '🎬', '图像生成': '🎨', '图像处理': '🖼️',
    '文本处理': '📝', '语音处理': '🎙️', '数据分析': '📊', '其他': '⚡',
  };

  return (
    <div className="h-full flex flex-col">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-border px-6 py-3 flex items-center gap-4 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          返回广场
        </button>
        <span className="text-border">·</span>
        <span className="text-sm font-medium text-foreground">{app.name}</span>
        <div className="ml-auto" />
      </div>

      {/* 主体：左侧内容 + 右侧历史 */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
            {/* 应用头部 */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${primaryColor}15` }}>
                  {CATEGORY_ICONS[app.category] || '⚡'}
                </div>
                <div className="flex-1">
                  <h1 className="text-foreground">{app.name}</h1>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{app.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {app.tags.map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 表单区 */}
            {phase === 'form' && (
              <div className="bg-white rounded-2xl border border-border p-5 space-y-5">
                <p className="font-medium text-foreground">填写参数</p>
                {renderInputFields()}
                <div className="pt-1">
                  <button
                    onClick={handleSubmit}
                    className="px-8 py-3 rounded-xl text-white font-medium text-sm hover:opacity-90 transition-opacity"
                    style={{ background: primaryColor }}
                  >
                    {app.layout.submitLabel || '立即运行'}
                  </button>
                </div>
              </div>
            )}

            {/* 运行中 */}
            {phase === 'running' && (
              <div className="bg-white rounded-2xl border border-border p-8 flex flex-col items-center gap-6">
                <div className="w-16 h-16 rounded-full border-4 border-border border-t-primary animate-spin" style={{ borderTopColor: primaryColor }} />
                <div className="text-center">
                  <p className="text-foreground font-medium">{app.layout.loadingLabel || '处理中，请稍候…'}</p>
                  <p className="text-sm text-muted-foreground mt-1">正在调用接口，结果将自动展示</p>
                </div>
                <div className="w-full max-w-sm">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>进度</span><span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: primaryColor }} />
                  </div>
                </div>
              </div>
            )}

            {/* 结果展示 */}
            {phase === 'result' && result && (
              <div className="bg-white rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-5">
                  <p className="font-medium text-foreground">运行结果</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">运行成功</span>
                    <span className="text-xs text-muted-foreground">耗时 {(runDuration / 1000).toFixed(1)}s</span>
                    <span className="text-xs text-amber-600 font-medium">消耗 {creditsUsed} 积分</span>
                    <button onClick={() => setPhase('form')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">重新运行</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  {app.outputs.filter(f => f.type !== 'progress').map(field => (
                    <OutputItem key={field.name} field={field} data={result} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧历史侧栏 */}
        <HistorySidebar />
      </div>
    </div>
  );
}
