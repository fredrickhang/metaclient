// 应用创建器 — 填写配置 → 生成 AppMeta JSON
import React, { useState } from 'react';
import type { AppMeta, ApiConfig, InputFieldMeta, OutputFieldMeta, FieldType, OutputType } from '../../types/appMeta';

const FIELD_TYPE_OPTIONS: { label: string; value: FieldType }[] = [
  { label: '单行文本', value: 'text' }, { label: '多行文本', value: 'textarea' },
  { label: '数字', value: 'number' }, { label: '下拉选择', value: 'select' },
  { label: '多选', value: 'multiselect' }, { label: '开关', value: 'boolean' },
  { label: '滑块', value: 'slider' }, { label: '图片上传', value: 'image' },
  { label: '视频上传', value: 'video' }, { label: '文件上传', value: 'file' },
  { label: '日期', value: 'date' }, { label: 'URL', value: 'url' },
];

const OUTPUT_TYPE_OPTIONS: { label: string; value: OutputType }[] = [
  { label: '文本', value: 'text' }, { label: 'Markdown', value: 'markdown' },
  { label: '图片', value: 'image' }, { label: '视频', value: 'video' },
  { label: '音频', value: 'audio' }, { label: 'JSON', value: 'json' },
  { label: '表格', value: 'table' }, { label: '数字', value: 'number' },
  { label: '标签组', value: 'tag-list' }, { label: '进度条', value: 'progress' },
  { label: '下载链接', value: 'download' },
];

const CATEGORIES = ['视频处理', '图像生成', '图像处理', '文本处理', '语音处理', '数据分析', '其他'];

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      <div>
        <h3 className="text-foreground">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function FormRow({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm text-foreground mb-1.5">
        {label}{required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
const selectCls = "w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer";

// 将 Record<string,string> 转为可编辑数组，保持顺序稳定
function recordToRows(r?: Record<string, string>): { key: string; value: string }[] {
  if (!r) return [];
  return Object.entries(r).map(([key, value]) => ({ key, value }));
}
function rowsToRecord(rows: { key: string; value: string }[]): Record<string, string> {
  const rec: Record<string, string> = {};
  rows.forEach(({ key, value }) => { if (key.trim()) rec[key.trim()] = value; });
  return rec;
}

function InputFieldEditor({ field, idx, onChange, onDelete, provider }: {
  field: InputFieldMeta; idx: number;
  onChange: (f: InputFieldMeta) => void;
  onDelete: () => void;
  provider?: 'runninghub' | 'custom';
}) {
  const [open, setOpen] = useState(idx === 0);
  const [extraRows, setExtraRows] = useState<{ key: string; value: string }[]>(
    () => recordToRows(field.extraParams)
  );

  const update = (patch: Partial<InputFieldMeta>) => onChange({ ...field, ...patch });

  const updateExtra = (rows: { key: string; value: string }[]) => {
    setExtraRows(rows);
    onChange({ ...field, extraParams: rowsToRecord(rows) });
  };

  const addExtraRow = () => updateExtra([...extraRows, { key: '', value: '' }]);

  const removeExtraRow = (i: number) =>
    updateExtra(extraRows.filter((_, j) => j !== i));

  const changeExtraRow = (i: number, patch: Partial<{ key: string; value: string }>) => {
    const next = extraRows.map((r, j) => j === i ? { ...r, ...patch } : r);
    updateExtra(next);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* 折叠头 */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-muted cursor-pointer hover:bg-secondary transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">{idx + 1}</div>
        <div className="flex-1 min-w-0">
          <span className="text-sm text-foreground">{field.label || '（未命名字段）'}</span>
          <span className="ml-2 text-xs text-muted-foreground">{field.name} · {field.type}</span>
          {extraRows.length > 0 && (
            <span className="ml-2 text-xs text-primary/70">+{extraRows.length} 扩展</span>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="text-muted-foreground hover:text-destructive transition-colors px-2"
        >✕</button>
        <span className="text-muted-foreground text-xs">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="p-4 space-y-4">
          {/* ── 基础字段配置 ── */}
          <div className="grid grid-cols-2 gap-4">
            <FormRow label="字段名称（英文）" required>
              <input className={inputCls} value={field.name} onChange={e => update({ name: e.target.value })} placeholder="sourceVideo" />
            </FormRow>
            <FormRow label="显示标签" required>
              <input className={inputCls} value={field.label} onChange={e => update({ label: e.target.value })} placeholder="源视频" />
            </FormRow>
            <FormRow label="字段类型" required>
              <select className={selectCls} value={field.type} onChange={e => update({ type: e.target.value as FieldType })}>
                {FIELD_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormRow>
            {provider === 'runninghub' ? (
              <>
                <FormRow label="节点 ID (nodeId)" required hint="工作流中对应节点的 ID">
                  <input className={inputCls} value={field.nodeId || ''} onChange={e => update({ nodeId: e.target.value })} placeholder="107" />
                </FormRow>
                <FormRow label="字段名 (fieldName)" required hint="节点内的参数名，如 image / value">
                  <input className={inputCls} value={field.fieldName || ''} onChange={e => update({ fieldName: e.target.value })} placeholder="image" />
                </FormRow>
              </>
            ) : (
              <FormRow label="接口参数名" hint="为空时使用字段名称">
                <input className={inputCls} value={field.apiParamName || ''} onChange={e => update({ apiParamName: e.target.value })} placeholder="source_video" />
              </FormRow>
            )}
            <FormRow label="提示文字">
              <input className={inputCls} value={field.placeholder || ''} onChange={e => update({ placeholder: e.target.value })} placeholder="请输入…" />
            </FormRow>
            <FormRow label="说明文字">
              <input className={inputCls} value={field.description || ''} onChange={e => update({ description: e.target.value })} placeholder="字段说明" />
            </FormRow>

            {(field.type === 'select' || field.type === 'multiselect') && (
              <div className="col-span-2">
                <FormRow label="选项列表（每行一个，格式：显示名|值）">
                  <textarea
                    className={inputCls + ' resize-y'}
                    rows={3}
                    value={(field.options || []).map(o => `${o.label}|${o.value}`).join('\n')}
                    onChange={e => {
                      const options = e.target.value.split('\n').filter(Boolean).map(line => {
                        const [label, value] = line.split('|');
                        return { label: label?.trim() || '', value: value?.trim() || label?.trim() || '' };
                      });
                      update({ options });
                    }}
                    placeholder={"选项一|value1\n选项二|value2"}
                  />
                </FormRow>
              </div>
            )}

            {field.type === 'slider' && (
              <>
                <FormRow label="最小值"><input type="number" className={inputCls} value={field.min ?? ''} onChange={e => update({ min: Number(e.target.value) })} /></FormRow>
                <FormRow label="最大值"><input type="number" className={inputCls} value={field.max ?? ''} onChange={e => update({ max: Number(e.target.value) })} /></FormRow>
              </>
            )}

            <div className="col-span-2 flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={!!field.required} onChange={e => update({ required: e.target.checked })} className="accent-primary" />
                必填项
              </label>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <span>宽度：</span>
                {(['full', 'half'] as const).map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => update({ width: w })}
                    className={`px-3 py-1 rounded-md text-xs border transition-colors ${field.width === w ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}
                  >
                    {w === 'full' ? '整行' : '半行'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── 自定义扩展字段 ── */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-foreground">自定义扩展字段</p>
                <p className="text-xs text-muted-foreground mt-0.5">为此字段附加额外的键值参数，随字段值一同传入接口</p>
              </div>
              <button
                type="button"
                onClick={addExtraRow}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                添加字段
              </button>
            </div>

            {extraRows.length === 0 ? (
              <button
                type="button"
                onClick={addExtraRow}
                className="w-full py-3 border border-dashed border-border rounded-xl text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                点击添加自定义扩展字段
              </button>
            ) : (
              <div className="space-y-2">
                {/* 表头 */}
                <div className="grid grid-cols-[1fr_1fr_28px] gap-2 px-1">
                  <span className="text-xs text-muted-foreground">字段名（Key）</span>
                  <span className="text-xs text-muted-foreground">字段值（Value）</span>
                  <span />
                </div>

                {extraRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_28px] gap-2 items-center group">
                    <input
                      className={inputCls + ' text-xs'}
                      value={row.key}
                      onChange={e => changeExtraRow(i, { key: e.target.value })}
                      placeholder="param_key"
                    />
                    <input
                      className={inputCls + ' text-xs'}
                      value={row.value}
                      onChange={e => changeExtraRow(i, { value: e.target.value })}
                      placeholder="param_value"
                    />
                    <button
                      type="button"
                      onClick={() => removeExtraRow(i)}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="删除此字段"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addExtraRow}
                  className="w-full py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors mt-1"
                >
                  + 再添加一行
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OutputFieldEditor({ field, idx, onChange, onDelete }: {
  field: OutputFieldMeta; idx: number;
  onChange: (f: OutputFieldMeta) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(idx === 0);
  const update = (patch: Partial<OutputFieldMeta>) => onChange({ ...field, ...patch });

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-muted cursor-pointer hover:bg-secondary transition-colors" onClick={() => setOpen(v => !v)}>
        <div className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center text-xs font-semibold">{idx + 1}</div>
        <div className="flex-1 min-w-0">
          <span className="text-sm text-foreground">{field.label || '（未命名输出）'}</span>
          <span className="ml-2 text-xs text-muted-foreground">{field.jsonPath} · {field.type}</span>
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="text-muted-foreground hover:text-destructive transition-colors px-2">✕</button>
        <span className="text-muted-foreground text-xs">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="p-4 grid grid-cols-2 gap-4">
          <FormRow label="显示标签" required>
            <input className={inputCls} value={field.label} onChange={e => update({ label: e.target.value })} placeholder="迁移结果" />
          </FormRow>
          <FormRow label="展示类型" required>
            <select className={selectCls} value={field.type} onChange={e => update({ type: e.target.value as OutputType })}>
              {OUTPUT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FormRow>
          <FormRow label="JSON 取值路径" required hint="从接口返回值中提取，如 data.result.url">
            <input className={inputCls} value={field.jsonPath} onChange={e => update({ jsonPath: e.target.value })} placeholder="data.result.video_url" />
          </FormRow>
          <FormRow label="字段标识">
            <input className={inputCls} value={field.name} onChange={e => update({ name: e.target.value })} placeholder="resultVideo" />
          </FormRow>
          <div className="col-span-2 flex items-center gap-2 text-sm text-foreground">
            <span>宽度：</span>
            {(['full', 'half'] as const).map(w => (
              <button key={w} type="button" onClick={() => update({ width: w })}
                className={`px-3 py-1 rounded-md text-xs border transition-colors ${field.width === w ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
                {w === 'full' ? '整行' : '半行'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AppCreatorProps {
  initialApp?: Partial<AppMeta>;
  onSave: (app: AppMeta) => void;
  onCancel: () => void;
}

const newField = (idx: number): InputFieldMeta => ({
  name: `field${idx}`, label: '', type: 'text', width: 'full', apiParamName: '',
});
const newOutput = (idx: number): OutputFieldMeta => ({
  name: `output${idx}`, label: '', type: 'text', jsonPath: '', width: 'full',
});

export function AppCreator({ initialApp, onSave, onCancel }: AppCreatorProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(initialApp?.name || '');
  const [description, setDescription] = useState(initialApp?.description || '');
  const [category, setCategory] = useState(initialApp?.category || '');
  const [tags, setTags] = useState((initialApp?.tags || []).join('，'));
  const [provider, setProvider] = useState<'runninghub' | 'custom'>(initialApp?.api?.provider || 'runninghub');
  const [endpoint, setEndpoint] = useState(initialApp?.api?.endpoint || '');
  const [method, setMethod] = useState(initialApp?.api?.method || 'POST');
  const [contentType, setContentType] = useState(initialApp?.api?.contentType || 'json');
  const [authType, setAuthType] = useState(initialApp?.api?.authType || 'bearer');
  const [authKey, setAuthKey] = useState(initialApp?.api?.authKey || '');
  const [instanceType, setInstanceType] = useState(initialApp?.api?.instanceType || 'default');
  const [usePersonalQueue, setUsePersonalQueue] = useState(initialApp?.api?.usePersonalQueue || 'false');
  const [inputs, setInputs] = useState<InputFieldMeta[]>(initialApp?.inputs || [newField(1)]);
  const [outputs, setOutputs] = useState<OutputFieldMeta[]>(initialApp?.outputs || [newOutput(1)]);
  const [submitLabel, setSubmitLabel] = useState(initialApp?.layout?.submitLabel || '立即运行');
  const [primaryColor, setPrimaryColor] = useState(initialApp?.layout?.primaryColor || '#5b6af7');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [estimatedCredits, setEstimatedCredits] = useState<string>('');

  const buildApp = (): AppMeta => ({
    id: initialApp?.id || `app-${Date.now()}`,
    name, description, category,
    tags: tags.split(/[，,]/).map(t => t.trim()).filter(Boolean),
    author: '我',
    status: 'draft',
    estimatedCredits: estimatedCredits ? Number(estimatedCredits) : undefined,
    createdAt: initialApp?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    api: { provider, endpoint, method: method as ApiConfig['method'], contentType: contentType as ApiConfig['contentType'], authType: authType as ApiConfig['authType'], authKey, timeoutMs: 60000, instanceType, usePersonalQueue },
    inputs,
    outputs,
    layout: { primaryColor, coverImage: coverPreview || undefined, submitLabel, inputLayout: 'two-col', outputLayout: 'single' },
  });

  const handleSave = () => {
    onSave(buildApp());
  };

  const steps = ['基本信息', '接口配置', '字段定义'];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* 步骤条 */}
        <div className="flex items-center gap-0">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <button
                onClick={() => setStep((i + 1) as 1 | 2 | 3)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${step === i + 1 ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                  step > i + 1 ? 'bg-primary border-primary text-white' :
                  step === i + 1 ? 'border-primary text-primary' : 'border-border text-muted-foreground'
                }`}>{step > i + 1 ? '✓' : i + 1}</span>
                {s}
              </button>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-border mx-2" />}
            </React.Fragment>
          ))}
        </div>

        {/* 步骤一：基本信息 */}
        {step === 1 && (
          <SectionCard title="应用基本信息" subtitle="填写应用名称、描述和分类，这些信息会展示在应用广场中">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FormRow label="应用名称" required>
                  <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="例如：视频动作迁移" />
                </FormRow>
              </div>
              <div className="col-span-2">
                <FormRow label="应用描述" required>
                  <textarea className={inputCls + ' resize-none'} rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="简要描述应用的功能和使用场景…" />
                </FormRow>
              </div>
              <FormRow label="分类" required>
                <select className={selectCls} value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">请选择分类</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormRow>
              <FormRow label="标签" hint="多个标签用逗号分隔">
                <input className={inputCls} value={tags} onChange={e => setTags(e.target.value)} placeholder="AI，视频，动作迁移" />
              </FormRow>
              <div className="col-span-2">
                <FormRow label="应用封面" hint="建议尺寸 16:9，支持 JPG/PNG/WebP，最大 5MB">
                  <label className="flex items-center gap-4 cursor-pointer group">
                    <div className={`w-32 h-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${coverPreview ? 'border-primary' : 'border-border group-hover:border-primary'}`}>
                      {coverPreview
                        ? <img src={coverPreview} alt="封面预览" className="w-full h-full object-cover" />
                        : <div className="text-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground mx-auto mb-1"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            <p className="text-xs text-muted-foreground">点击上传</p>
                          </div>
                      }
                    </div>
                    {coverPreview && (
                      <button type="button" onClick={e => { e.preventDefault(); setCoverPreview(null); }}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors">移除封面</button>
                    )}
                    <input type="file" accept="image/*" className="sr-only"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const url = URL.createObjectURL(f);
                          setCoverPreview(url);
                        }
                      }} />
                  </label>
                </FormRow>
              </div>
              <FormRow label="预估消耗积分" hint="用户每次调用此应用预计消耗的积分数">
                <div className="flex items-center gap-2">
                  <input type="number" min="1" max="9999" className={inputCls} value={estimatedCredits}
                    onChange={e => setEstimatedCredits(e.target.value)} placeholder="例如：5" />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">积分 / 次</span>
                </div>
              </FormRow>
              <FormRow label="主题色">
                <div className="flex items-center gap-3">
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                  <input className={inputCls} value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} placeholder="#5b6af7" />
                </div>
              </FormRow>
              <FormRow label="提交按钮文字">
                <input className={inputCls} value={submitLabel} onChange={e => setSubmitLabel(e.target.value)} placeholder="立即运行" />
              </FormRow>
            </div>
          </SectionCard>
        )}

        {/* 步骤二：接口配置 */}
        {step === 2 && (
          <div className="space-y-5">
            {/* 提供商选择 */}
            <SectionCard title="接口提供商">
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'runninghub', label: 'RunningHub', desc: '通过 nodeInfoList 动态调用 AI 工作流', icon: '⚡' },
                  { value: 'custom',     label: '自定义接口', desc: '自由配置任意 HTTP 接口',              icon: '🔧' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setProvider(opt.value)}
                    className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                      provider === opt.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <span className="text-xl mt-0.5">{opt.icon}</span>
                    <div>
                      <p className={`text-sm font-medium ${provider === opt.value ? 'text-primary' : 'text-foreground'}`}>{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </SectionCard>

            {/* RunningHub 专项配置 */}
            {provider === 'runninghub' && (
              <SectionCard title="RunningHub 配置" subtitle="填写 RunningHub 工作流接口地址，API Key 在服务端环境变量中统一配置">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <FormRow label="工作流接口地址" required hint="格式：https://www.runninghub.cn/openapi/v2/run/ai-app/{workflowId}">
                      <input
                        className={inputCls} value={endpoint}
                        onChange={e => setEndpoint(e.target.value)}
                        placeholder="https://www.runninghub.cn/openapi/v2/run/ai-app/2062380461074247681"
                      />
                    </FormRow>
                  </div>
                  <FormRow label="实例类型" hint="default 为标准实例">
                    <select className={selectCls} value={instanceType} onChange={e => setInstanceType(e.target.value)}>
                      <option value="default">default（标准）</option>
                      <option value="fast">fast（极速）</option>
                    </select>
                  </FormRow>
                  <FormRow label="使用个人队列">
                    <select className={selectCls} value={usePersonalQueue} onChange={e => setUsePersonalQueue(e.target.value)}>
                      <option value="false">false（公共队列）</option>
                      <option value="true">true（个人队列）</option>
                    </select>
                  </FormRow>
                  <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
                    <p className="font-medium mb-1">📌 RunningHub 请求格式预览</p>
                    <pre className="overflow-auto max-h-48 mono leading-relaxed">{JSON.stringify({
                      nodeInfoList: [{ nodeId: '107', fieldName: 'image', fieldValue: '<用户输入>', description: '字段说明' }],
                      instanceType,
                      usePersonalQueue,
                    }, null, 2)}</pre>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* 自定义接口配置 */}
            {provider === 'custom' && (
              <SectionCard title="自定义接口配置" subtitle="用户提交表单后系统将调用该接口">
                <div className="grid grid-cols-2 gap-4">
                  <FormRow label="请求方式" required>
                    <select className={selectCls} value={method} onChange={e => setMethod(e.target.value)}>
                      {['GET', 'POST', 'PUT', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </FormRow>
                  <FormRow label="内容类型">
                    <select className={selectCls} value={contentType} onChange={e => setContentType(e.target.value)}>
                      <option value="json">application/json</option>
                      <option value="form-data">multipart/form-data</option>
                      <option value="x-www-form-urlencoded">x-www-form-urlencoded</option>
                    </select>
                  </FormRow>
                  <div className="col-span-2">
                    <FormRow label="接口地址" required>
                      <input className={inputCls} value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="https://api.example.com/your/endpoint" />
                    </FormRow>
                  </div>
                  <FormRow label="认证方式">
                    <select className={selectCls} value={authType} onChange={e => setAuthType(e.target.value)}>
                      <option value="none">无认证</option>
                      <option value="bearer">Bearer Token</option>
                      <option value="apikey">API Key</option>
                      <option value="basic">Basic Auth</option>
                    </select>
                  </FormRow>
                  {authType !== 'none' && (
                    <FormRow label="认证密钥">
                      <input type="password" className={inputCls} value={authKey} onChange={e => setAuthKey(e.target.value)} placeholder="填写 Token 或 API Key" />
                    </FormRow>
                  )}
                  <div className="col-span-2 bg-muted rounded-xl border border-border p-4">
                    <p className="text-xs text-muted-foreground mb-2">📄 接口配置 JSON 预览</p>
                    <pre className="text-xs text-foreground overflow-auto max-h-40 mono">
                      {JSON.stringify({ endpoint, method, contentType, authType, authKey: authKey ? '***' : undefined }, null, 2)}
                    </pre>
                  </div>
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {/* 步骤三：字段定义 */}
        {step === 3 && (
          <div className="space-y-6">
            <SectionCard title="输入字段" subtitle="定义用户填写的表单字段，系统会将这些值作为参数传入接口">
              <div className="space-y-3">
                {inputs.map((field, i) => (
                  <InputFieldEditor
                    key={i} field={field} idx={i} provider={provider}
                    onChange={f => setInputs(prev => prev.map((x, j) => j === i ? f : x))}
                    onDelete={() => setInputs(prev => prev.filter((_, j) => j !== i))}
                  />
                ))}
              </div>
              <button
                onClick={() => setInputs(prev => [...prev, newField(prev.length + 1)])}
                className="w-full py-2.5 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                + 添加输入字段
              </button>
            </SectionCard>

            <SectionCard title="输出展示" subtitle="定义接口返回值的展示方式，系统会从接口响应中自动提取对应字段">
              <div className="space-y-3">
                {outputs.map((field, i) => (
                  <OutputFieldEditor
                    key={i} field={field} idx={i}
                    onChange={f => setOutputs(prev => prev.map((x, j) => j === i ? f : x))}
                    onDelete={() => setOutputs(prev => prev.filter((_, j) => j !== i))}
                  />
                ))}
              </div>
              <button
                onClick={() => setOutputs(prev => [...prev, newOutput(prev.length + 1)])}
                className="w-full py-2.5 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                + 添加输出字段
              </button>
            </SectionCard>

            {/* JSON 完整预览 */}
            <SectionCard title="生成的元数据 JSON" subtitle="以下 JSON 将发送给后端存储，前端渲染引擎根据此 JSON 生成应用页面">
              <div className="bg-muted rounded-xl border border-border p-4 max-h-80 overflow-auto">
                <pre className="text-xs text-foreground mono">{JSON.stringify(buildApp(), null, 2)}</pre>
              </div>
            </SectionCard>
          </div>
        )}

        {/* 底部按钮 */}
        <div className="flex items-center justify-between pt-2">
          <button onClick={onCancel} className="px-5 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
            取消
          </button>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)} className="px-5 py-2.5 border border-border rounded-xl text-sm text-foreground hover:bg-muted transition-colors">
                上一步
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm hover:bg-primary/90 transition-colors"
              >
                下一步
              </button>
            ) : (
              <button onClick={handleSave} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm hover:bg-primary/90 transition-colors">
                {initialApp?.id ? '保存修改' : '创建应用'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
