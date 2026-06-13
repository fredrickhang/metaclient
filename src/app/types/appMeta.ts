// ============================================================
// 应用元数据类型定义 — 一切皆元数据
// 创建者填写配置 → 生成 AppMeta JSON → 引擎渲染应用页面
// ============================================================

export type FieldType =
  | 'text' | 'textarea' | 'number' | 'select' | 'multiselect'
  | 'file' | 'image' | 'video' | 'boolean' | 'slider' | 'color' | 'date' | 'url' | 'password';

export type OutputType =
  | 'text' | 'markdown' | 'image' | 'video' | 'audio' | 'json' | 'table'
  | 'number' | 'tag-list' | 'progress' | 'download' | 'html';

export interface SelectOption {
  label: string;
  value: string | number;
}

/** 输入字段元数据 */
export interface InputFieldMeta {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  description?: string;
  options?: SelectOption[];        // select / multiselect 的选项
  min?: number; max?: number; step?: number;
  accept?: string;                  // file/image/video 的 MIME 限制
  rows?: number;
  width?: 'full' | 'half';
  /** 映射到接口参数名（自定义接口时使用，为空则用 name） */
  apiParamName?: string;
  /** RunningHub 工作流节点 ID，如 "107" */
  nodeId?: string;
  /** RunningHub 节点字段名，如 "image" / "value" */
  fieldName?: string;
  /** 自定义扩展字段，随字段值一同传入接口 */
  extraParams?: Record<string, string>;
}

/** 输出展示元数据 */
export interface OutputFieldMeta {
  name: string;
  label: string;
  type: OutputType;
  /** 从接口返回 JSON 中提取的路径，如 data.result.url */
  jsonPath: string;
  description?: string;
  /** 下载时的文件名 */
  downloadName?: string;
  width?: 'full' | 'half';
}

/** 接口配置 */
export interface ApiConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** 接口提供商：runninghub | custom */
  provider?: 'runninghub' | 'custom';
  /** 固定请求头 */
  headers?: Record<string, string>;
  /** 固定请求体参数（不暴露给用户） */
  fixedParams?: Record<string, unknown>;
  /** 认证方式 */
  authType?: 'none' | 'bearer' | 'apikey' | 'basic';
  authKey?: string;
  /** 超时毫秒 */
  timeoutMs?: number;
  /** 内容类型 */
  contentType?: 'json' | 'form-data' | 'x-www-form-urlencoded';
  /** RunningHub: 实例类型，如 "default" */
  instanceType?: string;
  /** RunningHub: 是否使用个人队列 */
  usePersonalQueue?: string;
  /** 轮询结果（异步接口） */
  polling?: {
    enabled: boolean;
    intervalMs: number;
    statusPath: string;
    doneValue: string;
    resultPath: string;
  };
}

/** 页面展示配置 */
export interface PageLayout {
  /** 页面主色（覆盖默认主题色） */
  primaryColor?: string;
  /** 封面图 URL */
  coverImage?: string;
  /** 输入输出布局 */
  inputLayout?: 'single' | 'two-col';
  outputLayout?: 'single' | 'two-col';
  /** 提交按钮文字 */
  submitLabel?: string;
  /** 提交中按钮文字 */
  loadingLabel?: string;
}

/** 应用元数据 — 核心 JSON 结构 */
export interface AppMeta {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  avatar?: string;
  status: 'draft' | 'published';
  /** 预估每次调用消耗积分 */
  estimatedCredits?: number;
  createdAt: string;
  updatedAt: string;
  /** 接口配置 */
  api: ApiConfig;
  /** 用户输入字段列表 */
  inputs: InputFieldMeta[];
  /** 结果展示字段列表 */
  outputs: OutputFieldMeta[];
  /** 页面展示配置 */
  layout: PageLayout;
  /** 使用统计 */
  stats?: {
    runs: number;
    likes: number;
    views: number;
  };
}

/** 运行时执行记录 */
export interface RunRecord {
  id: string;
  appId: string;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  status: 'running' | 'success' | 'failed';
  startedAt: string;
  durationMs?: number;
  error?: string;
}
