// ============================================================
// CORE METADATA TYPES — everything in the platform is metadata
// ============================================================

// --- Field / Form Schema (Formily-compatible) ---
export type FieldType =
  | 'string' | 'number' | 'boolean' | 'select' | 'multiselect'
  | 'textarea' | 'file' | 'image' | 'json' | 'code' | 'slider' | 'color' | 'date';

export interface FieldValidator {
  type: 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: string | number;
  message: string;
  /** Aviator rule expression for custom validation */
  expression?: string;
}

export interface FieldOption {
  label: string;
  value: string | number;
  description?: string;
}

export interface FieldMeta {
  name: string;
  label: string;
  type: FieldType;
  description?: string;
  placeholder?: string;
  defaultValue?: unknown;
  required?: boolean;
  hidden?: boolean;
  /** Aviator expression to control visibility */
  visibleWhen?: string;
  /** Aviator expression to control disabled state */
  disabledWhen?: string;
  validators?: FieldValidator[];
  options?: FieldOption[];
  min?: number;
  max?: number;
  step?: number;
  accept?: string;
  rows?: number;
  /** Component-level display props */
  ui?: {
    width?: 'full' | 'half' | 'third' | 'quarter';
    prefix?: string;
    suffix?: string;
    tooltip?: string;
    group?: string;
  };
}

export interface FormMeta {
  id: string;
  title?: string;
  description?: string;
  fields: FieldMeta[];
  layout?: 'vertical' | 'horizontal' | 'grid';
  /** Aviator submit condition expression */
  submitWhen?: string;
  submitLabel?: string;
}

// --- Node / Graph Metadata ---
export type NodeCategory = 'input' | 'output' | 'transform' | 'ai' | 'logic' | 'http' | 'database' | 'utility';

export interface PortMeta {
  id: string;
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  multiple?: boolean;
}

export interface NodeMeta {
  id: string;
  type: string;
  name: string;
  description?: string;
  category: NodeCategory;
  icon?: string;
  color?: string;
  inputs: PortMeta[];
  outputs: PortMeta[];
  /** Configuration form for this node type */
  configForm?: FormMeta;
  /** Aviator expression to validate node config */
  validationRule?: string;
  /** Backend handler class (Spring bean name) */
  handlerBean?: string;
  /** Whether node runs async via RabbitMQ */
  async?: boolean;
  /** Camunda-compatible service task type */
  serviceTask?: string;
}

export interface WorkflowNodeInstance {
  id: string;
  nodeType: string;
  label?: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  /** Runtime state */
  status?: 'idle' | 'running' | 'success' | 'error' | 'skipped';
  error?: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
  /** Aviator condition expression — edge only activates when true */
  condition?: string;
}

// --- Workflow Metadata ---
export type WorkflowStatus = 'draft' | 'published' | 'deprecated' | 'archived';

export interface WorkflowMeta {
  id: string;
  name: string;
  description: string;
  version: string;
  status: WorkflowStatus;
  category: string;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  /** Input form presented to end-users who run this workflow */
  inputForm: FormMeta;
  /** Output schema definition */
  outputSchema: FieldMeta[];
  /** Graph definition */
  nodes: WorkflowNodeInstance[];
  edges: WorkflowEdge[];
  /** Camunda BPMN process key */
  processKey?: string;
  /** RabbitMQ exchange for async execution */
  exchange?: string;
  /** Global Aviator rule context variables */
  ruleContext?: Record<string, unknown>;
  /** Auto-generated page metadata (see PageMeta) */
  pageId?: string;
  /** Execution metrics */
  stats?: {
    runs: number;
    avgDuration: number;
    successRate: number;
  };
}

// --- Page / Layout Metadata ---
export type WidgetType =
  | 'hero' | 'form' | 'result-display' | 'markdown' | 'code-block'
  | 'image' | 'stats' | 'table' | 'chart' | 'timeline' | 'badge-list';

export interface WidgetMeta {
  id: string;
  type: WidgetType;
  title?: string;
  /** Binds to workflow field or execution result */
  bindField?: string;
  /** Static props per widget type */
  props?: Record<string, unknown>;
  /** Grid column span (1–12) */
  colSpan?: number;
  order: number;
}

export interface PageSectionMeta {
  id: string;
  title?: string;
  layout: 'single' | 'two-col' | 'three-col' | 'grid';
  widgets: WidgetMeta[];
}

export interface PageMeta {
  id: string;
  workflowId: string;
  title: string;
  description?: string;
  sections: PageSectionMeta[];
  /** Theme overrides scoped to this page */
  theme?: {
    primaryColor?: string;
    background?: string;
  };
}

// --- Execution Metadata ---
export type ExecutionStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';

export interface ExecutionStepLog {
  nodeId: string;
  nodeName: string;
  status: ExecutionStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  output?: unknown;
  error?: string;
  logs?: string[];
}

export interface ExecutionMeta {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  steps: ExecutionStepLog[];
  /** Camunda process instance ID */
  processInstanceId?: string;
  /** RabbitMQ correlation ID */
  correlationId?: string;
  error?: string;
}

// --- Metadata Registry ---
export interface MetadataRegistry {
  nodeTypes: Record<string, NodeMeta>;
  workflows: Record<string, WorkflowMeta>;
  pages: Record<string, PageMeta>;
  executions: ExecutionMeta[];
}
