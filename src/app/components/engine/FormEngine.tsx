// Dynamic Form Engine — renders forms from FormMeta (Formily-compatible schema)
// Evaluates Aviator-style expressions for visibility/disabled rules client-side
import React, { useState, useCallback } from 'react';
import type { FormMeta, FieldMeta } from '../../types/metadata';

// Lightweight Aviator expression evaluator (client-side stub)
function evalExpression(expr: string, ctx: Record<string, unknown>): boolean {
  try {
    const fn = new Function(...Object.keys(ctx), `return !!(${expr})`);
    return fn(...Object.values(ctx));
  } catch {
    return true;
  }
}

interface FormEngineProps {
  schema: FormMeta;
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void;
  loading?: boolean;
}

function FieldLabel({ field }: { field: FieldMeta }) {
  return (
    <label className="block text-xs text-muted-foreground mb-1.5 tracking-wide uppercase" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      {field.label}
      {field.required && <span className="text-destructive ml-1">*</span>}
      {field.ui?.tooltip && (
        <span className="ml-2 text-muted-foreground/60 normal-case" title={field.ui.tooltip}>(?)</span>
      )}
    </label>
  );
}

function StringField({ field, value, onChange }: { field: FieldMeta; value: string; onChange: (v: unknown) => void }) {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder}
      className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
    />
  );
}

function TextareaField({ field, value, onChange }: { field: FieldMeta; value: string; onChange: (v: unknown) => void }) {
  return (
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder}
      rows={field.rows || 4}
      className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-y font-mono text-sm"
    />
  );
}

function CodeField({ field, value, onChange }: { field: FieldMeta; value: string; onChange: (v: unknown) => void }) {
  return (
    <div className="relative">
      <div className="absolute top-2 right-3 text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        aviator
      </div>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={field.rows || 3}
        className="w-full px-3 py-2 bg-[#0a0d14] border border-border rounded-md text-green-400 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-y text-sm pr-20"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      />
    </div>
  );
}

function NumberField({ field, value, onChange }: { field: FieldMeta; value: number; onChange: (v: unknown) => void }) {
  return (
    <input
      type="number"
      value={value ?? field.defaultValue ?? ''}
      onChange={e => onChange(Number(e.target.value))}
      min={field.min}
      max={field.max}
      step={field.step}
      className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
    />
  );
}

function SliderField({ field, value, onChange }: { field: FieldMeta; value: number; onChange: (v: unknown) => void }) {
  const val = value ?? field.defaultValue ?? field.min ?? 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={field.min ?? 0}
          max={field.max ?? 100}
          step={field.step ?? 1}
          value={val}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 accent-primary"
        />
        <span className="text-sm text-primary w-16 text-right" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {val}{field.ui?.suffix || ''}
        </span>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{field.min ?? 0}</span>
        <span>{field.max ?? 100}</span>
      </div>
    </div>
  );
}

function SelectField({ field, value, onChange }: { field: FieldMeta; value: string; onChange: (v: unknown) => void }) {
  return (
    <select
      value={value || (field.defaultValue as string) || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors appearance-none cursor-pointer"
    >
      {field.options?.map(opt => (
        <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
      ))}
    </select>
  );
}

function MultiSelectField({ field, value, onChange }: { field: FieldMeta; value: string[]; onChange: (v: unknown) => void }) {
  const selected = (value as string[]) || (field.defaultValue as string[]) || [];
  const toggle = (v: string) => {
    const next = selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v];
    onChange(next);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {field.options?.map(opt => {
        const active = selected.includes(String(opt.value));
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => toggle(String(opt.value))}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
              active
                ? 'bg-primary border-primary text-white'
                : 'bg-secondary border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function BooleanField({ value, onChange }: { field: FieldMeta; value: boolean; onChange: (v: unknown) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-primary' : 'bg-secondary border border-border'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function FileField({ field, onChange }: { field: FieldMeta; onChange: (v: unknown) => void }) {
  const [fileName, setFileName] = useState<string>('');
  return (
    <label className="flex items-center gap-3 px-4 py-3 bg-secondary border border-border border-dashed rounded-md cursor-pointer hover:border-primary/50 transition-colors">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <span className="text-sm text-muted-foreground">{fileName || `Choose ${field.accept || 'file'}…`}</span>
      <input
        type="file"
        accept={field.accept}
        className="sr-only"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) { setFileName(f.name); onChange(f); }
        }}
      />
    </label>
  );
}

function JsonField({ field, value, onChange }: { field: FieldMeta; value: string; onChange: (v: unknown) => void }) {
  return (
    <textarea
      value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder || '{}'}
      rows={field.rows || 4}
      className="w-full px-3 py-2 bg-[#0a0d14] border border-border rounded-md text-cyan-400 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-y text-sm"
      style={{ fontFamily: 'JetBrains Mono, monospace' }}
    />
  );
}

function RenderField({ field, value, onChange }: { field: FieldMeta; value: unknown; onChange: (v: unknown) => void }) {
  const props = { field, value: value as never, onChange };
  switch (field.type) {
    case 'string': return <StringField {...props} />;
    case 'textarea': return <TextareaField {...props} />;
    case 'code': return <CodeField {...props} />;
    case 'number': return <NumberField {...props} />;
    case 'slider': return <SliderField {...props} />;
    case 'select': return <SelectField {...props} />;
    case 'multiselect': return <MultiSelectField {...props} />;
    case 'boolean': return (
      <div className="flex items-center gap-3">
        <BooleanField {...props} />
        <span className="text-sm text-muted-foreground">{value ? 'Yes' : 'No'}</span>
      </div>
    );
    case 'file': case 'image': return <FileField {...props} />;
    case 'json': return <JsonField {...props} />;
    default: return <StringField {...props} />;
  }
}

function getWidthClass(width?: string) {
  switch (width) {
    case 'half': return 'md:col-span-1';
    case 'third': return 'md:col-span-1';
    case 'quarter': return 'md:col-span-1';
    default: return 'md:col-span-2';
  }
}

export function FormEngine({ schema, initialValues = {}, onSubmit, loading }: FormEngineProps) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = { ...initialValues };
    for (const f of schema.fields) {
      if (!(f.name in init) && f.defaultValue !== undefined) {
        init[f.name] = f.defaultValue;
      }
    }
    return init;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = useCallback((name: string, val: unknown) => {
    setValues(prev => ({ ...prev, [name]: val }));
    setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    for (const f of schema.fields) {
      if (f.required && (values[f.name] === undefined || values[f.name] === '' || values[f.name] === null)) {
        errs[f.name] = `${f.label} is required`;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(values);
  };

  // Group fields by ui.group
  const visibleFields = schema.fields.filter(f => {
    if (f.hidden) return false;
    if (f.visibleWhen) return evalExpression(f.visibleWhen, values);
    return true;
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {schema.title && (
        <div className="mb-4">
          <h3 className="text-foreground">{schema.title}</h3>
          {schema.description && <p className="text-sm text-muted-foreground mt-1">{schema.description}</p>}
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {visibleFields.map(field => {
          const disabled = field.disabledWhen ? evalExpression(field.disabledWhen, values) : false;
          return (
            <div
              key={field.name}
              className={`${getWidthClass(field.ui?.width)} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <FieldLabel field={field} />
              <RenderField
                field={field}
                value={values[field.name]}
                onChange={v => handleChange(field.name, v)}
              />
              {errors[field.name] && (
                <p className="mt-1 text-xs text-destructive">{errors[field.name]}</p>
              )}
              {field.description && !errors[field.name] && (
                <p className="mt-1 text-xs text-muted-foreground">{field.description}</p>
              )}
            </div>
          );
        })}
      </div>
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {loading && (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {loading ? 'Running…' : (schema.submitLabel || 'Submit')}
        </button>
      </div>
    </form>
  );
}
