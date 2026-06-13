import type { MetadataRegistry, NodeMeta, WorkflowMeta, ExecutionMeta } from '../types/metadata';

// ============================================================
// NODE TYPE REGISTRY — all node types are metadata
// ============================================================
export const NODE_TYPE_REGISTRY: Record<string, NodeMeta> = {
  'http-request': {
    id: 'http-request', type: 'http-request', name: 'HTTP Request', category: 'http',
    icon: 'Globe', color: '#22d3ee',
    description: 'Send HTTP requests to external APIs',
    inputs: [{ id: 'url', name: 'URL', type: 'string', required: true }, { id: 'body', name: 'Body', type: 'json' }],
    outputs: [{ id: 'response', name: 'Response', type: 'json' }, { id: 'status', name: 'Status Code', type: 'number' }],
    handlerBean: 'httpRequestNodeHandler',
    async: true,
    configForm: {
      id: 'http-request-config', layout: 'vertical',
      fields: [
        { name: 'method', label: 'Method', type: 'select', required: true, defaultValue: 'GET',
          options: [{ label: 'GET', value: 'GET' }, { label: 'POST', value: 'POST' }, { label: 'PUT', value: 'PUT' }, { label: 'DELETE', value: 'DELETE' }] },
        { name: 'url', label: 'URL', type: 'string', required: true, placeholder: 'https://api.example.com/endpoint' },
        { name: 'headers', label: 'Headers (JSON)', type: 'json', rows: 3 },
        { name: 'timeout', label: 'Timeout (ms)', type: 'number', defaultValue: 5000 },
      ]
    }
  },
  'llm-chat': {
    id: 'llm-chat', type: 'llm-chat', name: 'LLM Chat', category: 'ai',
    icon: 'BrainCircuit', color: '#a78bfa',
    description: 'Call a large language model with a prompt',
    inputs: [{ id: 'prompt', name: 'Prompt', type: 'string', required: true }, { id: 'context', name: 'Context', type: 'string' }],
    outputs: [{ id: 'response', name: 'Response', type: 'string' }, { id: 'tokens', name: 'Tokens Used', type: 'number' }],
    handlerBean: 'llmChatNodeHandler',
    async: true,
    configForm: {
      id: 'llm-chat-config', layout: 'vertical',
      fields: [
        { name: 'model', label: 'Model', type: 'select', required: true, defaultValue: 'gpt-4o',
          options: [{ label: 'GPT-4o', value: 'gpt-4o' }, { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' }, { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet' }, { label: 'Llama 3', value: 'llama-3' }] },
        { name: 'systemPrompt', label: 'System Prompt', type: 'textarea', rows: 4 },
        { name: 'temperature', label: 'Temperature', type: 'slider', min: 0, max: 2, step: 0.1, defaultValue: 0.7 },
        { name: 'maxTokens', label: 'Max Tokens', type: 'number', defaultValue: 2048 },
      ]
    }
  },
  'text-transform': {
    id: 'text-transform', type: 'text-transform', name: 'Text Transform', category: 'transform',
    icon: 'Wand2', color: '#34d399',
    description: 'Apply Aviator expression to transform text data',
    inputs: [{ id: 'input', name: 'Input', type: 'string', required: true }],
    outputs: [{ id: 'output', name: 'Output', type: 'string' }],
    handlerBean: 'textTransformNodeHandler',
    configForm: {
      id: 'text-transform-config', layout: 'vertical',
      fields: [
        { name: 'expression', label: 'Aviator Expression', type: 'code', required: true, placeholder: 'str.toUpperCase(input)' },
        { name: 'trimWhitespace', label: 'Trim Whitespace', type: 'boolean', defaultValue: true },
      ]
    }
  },
  'condition': {
    id: 'condition', type: 'condition', name: 'Condition', category: 'logic',
    icon: 'GitBranch', color: '#f59e0b',
    description: 'Route flow based on Aviator rule expression',
    inputs: [{ id: 'value', name: 'Value', type: 'any', required: true }],
    outputs: [{ id: 'true', name: 'True Branch', type: 'any' }, { id: 'false', name: 'False Branch', type: 'any' }],
    handlerBean: 'conditionNodeHandler',
    configForm: {
      id: 'condition-config', layout: 'vertical',
      fields: [
        { name: 'expression', label: 'Condition (Aviator)', type: 'code', required: true, placeholder: 'value > 100 && value != null' },
      ]
    }
  },
  'db-query': {
    id: 'db-query', type: 'db-query', name: 'Database Query', category: 'database',
    icon: 'Database', color: '#38bdf8',
    description: 'Execute SQL query against configured datasource',
    inputs: [{ id: 'params', name: 'Parameters', type: 'json' }],
    outputs: [{ id: 'rows', name: 'Rows', type: 'array' }, { id: 'count', name: 'Row Count', type: 'number' }],
    handlerBean: 'dbQueryNodeHandler',
    async: true,
    configForm: {
      id: 'db-query-config', layout: 'vertical',
      fields: [
        { name: 'datasource', label: 'Datasource', type: 'select', required: true,
          options: [{ label: 'Primary MySQL', value: 'primary' }, { label: 'Analytics DB', value: 'analytics' }, { label: 'Read Replica', value: 'replica' }] },
        { name: 'sql', label: 'SQL Query', type: 'code', required: true, rows: 6, placeholder: 'SELECT * FROM users WHERE id = #{params.userId}' },
      ]
    }
  },
  'user-input': {
    id: 'user-input', type: 'user-input', name: 'User Input', category: 'input',
    icon: 'FormInput', color: '#6366f1',
    description: 'Accepts structured input from the workflow runner form',
    inputs: [],
    outputs: [{ id: 'data', name: 'Input Data', type: 'json' }],
    handlerBean: 'userInputNodeHandler',
    configForm: {
      id: 'user-input-config', layout: 'vertical',
      fields: [{ name: 'schema', label: 'Output Schema (JSON)', type: 'json', rows: 8 }]
    }
  },
  'result-output': {
    id: 'result-output', type: 'result-output', name: 'Result Output', category: 'output',
    icon: 'LayoutTemplate', color: '#fb923c',
    description: 'Formats and presents final workflow results to user',
    inputs: [{ id: 'data', name: 'Result Data', type: 'any', required: true }],
    outputs: [],
    handlerBean: 'resultOutputNodeHandler',
    configForm: {
      id: 'result-output-config', layout: 'vertical',
      fields: [
        { name: 'format', label: 'Output Format', type: 'select', defaultValue: 'json',
          options: [{ label: 'JSON', value: 'json' }, { label: 'Markdown', value: 'markdown' }, { label: 'Table', value: 'table' }, { label: 'Plain Text', value: 'text' }] },
        { name: 'template', label: 'Display Template', type: 'textarea', rows: 4, placeholder: 'Result: {{data.summary}}' },
      ]
    }
  },
};

// ============================================================
// MOCK WORKFLOW REGISTRY
// ============================================================
export const MOCK_WORKFLOWS: WorkflowMeta[] = [
  {
    id: 'wf-001',
    name: 'AI Content Generator',
    description: 'Generate SEO-optimized blog posts and marketing copy using GPT-4o. Input a topic and tone, get a full article with metadata.',
    version: '2.3.1',
    status: 'published',
    category: 'AI Writing',
    tags: ['AI', 'Content', 'SEO', 'GPT-4'],
    author: 'Alice Chen',
    createdAt: '2026-04-12T08:00:00Z',
    updatedAt: '2026-06-01T14:23:00Z',
    thumbnail: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&h=340&fit=crop&auto=format',
    stats: { runs: 12847, avgDuration: 8200, successRate: 97.3 },
    inputForm: {
      id: 'wf-001-input',
      title: 'Content Generation Parameters',
      layout: 'vertical',
      submitLabel: 'Generate Content',
      fields: [
        { name: 'topic', label: 'Topic', type: 'string', required: true, placeholder: 'e.g. The future of quantum computing', ui: { width: 'full', tooltip: 'The main subject of your article' } },
        { name: 'tone', label: 'Tone', type: 'select', required: true, defaultValue: 'professional',
          options: [{ label: 'Professional', value: 'professional' }, { label: 'Casual', value: 'casual' }, { label: 'Technical', value: 'technical' }, { label: 'Creative', value: 'creative' }],
          ui: { width: 'half' } },
        { name: 'wordCount', label: 'Word Count', type: 'slider', min: 300, max: 3000, step: 100, defaultValue: 800, ui: { width: 'half' } },
        { name: 'keywords', label: 'SEO Keywords', type: 'string', placeholder: 'quantum, computing, qubits (comma separated)', ui: { width: 'full' } },
        { name: 'includeOutline', label: 'Include Outline', type: 'boolean', defaultValue: true },
        { name: 'language', label: 'Output Language', type: 'select', defaultValue: 'en',
          options: [{ label: 'English', value: 'en' }, { label: 'Chinese', value: 'zh' }, { label: 'Spanish', value: 'es' }, { label: 'French', value: 'fr' }, { label: 'Japanese', value: 'ja' }],
          ui: { width: 'half' } },
      ]
    },
    outputSchema: [
      { name: 'title', label: 'Article Title', type: 'string' },
      { name: 'content', label: 'Content', type: 'textarea' },
      { name: 'outline', label: 'Outline', type: 'json' },
      { name: 'metaDescription', label: 'Meta Description', type: 'string' },
      { name: 'tokensUsed', label: 'Tokens Used', type: 'number' },
    ],
    nodes: [
      { id: 'n1', nodeType: 'user-input', label: 'User Input', position: { x: 80, y: 200 }, config: {} },
      { id: 'n2', nodeType: 'text-transform', label: 'Prompt Builder', position: { x: 280, y: 200 }, config: { expression: 'buildPrompt(topic, tone, keywords)' } },
      { id: 'n3', nodeType: 'llm-chat', label: 'GPT-4o', position: { x: 480, y: 200 }, config: { model: 'gpt-4o', temperature: 0.7 } },
      { id: 'n4', nodeType: 'result-output', label: 'Output', position: { x: 680, y: 200 }, config: { format: 'markdown' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', sourcePort: 'data', target: 'n2', targetPort: 'input' },
      { id: 'e2', source: 'n2', sourcePort: 'output', target: 'n3', targetPort: 'prompt' },
      { id: 'e3', source: 'n3', sourcePort: 'response', target: 'n4', targetPort: 'data' },
    ],
    pageId: 'pg-001',
    processKey: 'ai-content-generator-v2',
    exchange: 'workflow.ai.content',
  },
  {
    id: 'wf-002',
    name: 'Data Pipeline ETL',
    description: 'Extract, transform and load data from REST APIs into MySQL with schema validation, deduplication, and rule-based filtering via Aviator.',
    version: '1.8.0',
    status: 'published',
    category: 'Data Engineering',
    tags: ['ETL', 'MySQL', 'API', 'Data'],
    author: 'Bob Wang',
    createdAt: '2026-03-05T10:00:00Z',
    updatedAt: '2026-05-28T09:00:00Z',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=340&fit=crop&auto=format',
    stats: { runs: 5423, avgDuration: 45000, successRate: 94.1 },
    inputForm: {
      id: 'wf-002-input',
      title: 'ETL Pipeline Configuration',
      layout: 'vertical',
      submitLabel: 'Run Pipeline',
      fields: [
        { name: 'sourceUrl', label: 'Source API URL', type: 'string', required: true, placeholder: 'https://api.data-source.com/v1/records' },
        { name: 'apiKey', label: 'API Key', type: 'string', required: true, placeholder: 'sk-...' },
        { name: 'filterExpression', label: 'Filter Rule (Aviator)', type: 'code', placeholder: 'record.status == "active" && record.value > 0', ui: { tooltip: 'Aviator expression to filter records' } },
        { name: 'batchSize', label: 'Batch Size', type: 'number', defaultValue: 100, min: 10, max: 1000 },
        { name: 'targetTable', label: 'Target Table', type: 'select', required: true,
          options: [{ label: 'users', value: 'users' }, { label: 'transactions', value: 'transactions' }, { label: 'events', value: 'events' }] },
        { name: 'deduplicateBy', label: 'Deduplicate Field', type: 'string', placeholder: 'id' },
        { name: 'dryRun', label: 'Dry Run (no writes)', type: 'boolean', defaultValue: false },
      ]
    },
    outputSchema: [
      { name: 'extracted', label: 'Records Extracted', type: 'number' },
      { name: 'transformed', label: 'Records Transformed', type: 'number' },
      { name: 'loaded', label: 'Records Loaded', type: 'number' },
      { name: 'errors', label: 'Errors', type: 'json' },
      { name: 'duration', label: 'Duration (ms)', type: 'number' },
    ],
    nodes: [
      { id: 'n1', nodeType: 'user-input', label: 'Config', position: { x: 60, y: 200 }, config: {} },
      { id: 'n2', nodeType: 'http-request', label: 'Fetch Data', position: { x: 240, y: 200 }, config: { method: 'GET' } },
      { id: 'n3', nodeType: 'condition', label: 'Filter Records', position: { x: 420, y: 200 }, config: { expression: 'filterExpression' } },
      { id: 'n4', nodeType: 'text-transform', label: 'Transform', position: { x: 580, y: 120 }, config: {} },
      { id: 'n5', nodeType: 'db-query', label: 'Load to DB', position: { x: 740, y: 120 }, config: { datasource: 'primary' } },
      { id: 'n6', nodeType: 'result-output', label: 'Report', position: { x: 900, y: 200 }, config: { format: 'table' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', sourcePort: 'data', target: 'n2', targetPort: 'url' },
      { id: 'e2', source: 'n2', sourcePort: 'response', target: 'n3', targetPort: 'value' },
      { id: 'e3', source: 'n3', sourcePort: 'true', target: 'n4', targetPort: 'input' },
      { id: 'e4', source: 'n4', sourcePort: 'output', target: 'n5', targetPort: 'params' },
      { id: 'e5', source: 'n5', sourcePort: 'rows', target: 'n6', targetPort: 'data' },
    ],
    pageId: 'pg-002',
    processKey: 'data-pipeline-etl-v1',
    exchange: 'workflow.data.etl',
  },
  {
    id: 'wf-003',
    name: 'Image Analysis & Tagging',
    description: 'Upload images for automatic AI tagging, object detection, and metadata extraction. Results stored in database with search indexing.',
    version: '3.0.0',
    status: 'published',
    category: 'Computer Vision',
    tags: ['Vision', 'AI', 'Tagging', 'Image'],
    author: 'Carol Liu',
    createdAt: '2026-02-18T08:00:00Z',
    updatedAt: '2026-06-08T11:30:00Z',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&h=340&fit=crop&auto=format',
    stats: { runs: 28930, avgDuration: 3200, successRate: 98.7 },
    inputForm: {
      id: 'wf-003-input',
      title: 'Image Analysis',
      layout: 'vertical',
      submitLabel: 'Analyze Image',
      fields: [
        { name: 'image', label: 'Upload Image', type: 'file', required: true, accept: 'image/*', ui: { width: 'full' } },
        { name: 'analysisType', label: 'Analysis Type', type: 'multiselect', required: true,
          options: [{ label: 'Object Detection', value: 'objects' }, { label: 'Scene Classification', value: 'scene' }, { label: 'Text Extraction (OCR)', value: 'ocr' }, { label: 'Face Detection', value: 'faces' }, { label: 'Color Palette', value: 'colors' }],
          defaultValue: ['objects', 'scene'] },
        { name: 'confidence', label: 'Min Confidence (%)', type: 'slider', min: 0, max: 100, step: 5, defaultValue: 75 },
        { name: 'saveToDb', label: 'Save results to database', type: 'boolean', defaultValue: true },
        { name: 'generateCaption', label: 'Generate AI Caption', type: 'boolean', defaultValue: true },
      ]
    },
    outputSchema: [
      { name: 'tags', label: 'Detected Tags', type: 'json' },
      { name: 'caption', label: 'AI Caption', type: 'string' },
      { name: 'confidence', label: 'Confidence Scores', type: 'json' },
      { name: 'colors', label: 'Color Palette', type: 'json' },
    ],
    nodes: [
      { id: 'n1', nodeType: 'user-input', label: 'Image Upload', position: { x: 80, y: 200 }, config: {} },
      { id: 'n2', nodeType: 'http-request', label: 'Vision API', position: { x: 280, y: 200 }, config: { method: 'POST', url: 'https://vision.api/analyze' } },
      { id: 'n3', nodeType: 'text-transform', label: 'Extract Tags', position: { x: 480, y: 200 }, config: {} },
      { id: 'n4', nodeType: 'db-query', label: 'Save Results', position: { x: 640, y: 120 }, config: { datasource: 'primary' } },
      { id: 'n5', nodeType: 'result-output', label: 'Display', position: { x: 800, y: 200 }, config: { format: 'json' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', sourcePort: 'data', target: 'n2', targetPort: 'body' },
      { id: 'e2', source: 'n2', sourcePort: 'response', target: 'n3', targetPort: 'input' },
      { id: 'e3', source: 'n3', sourcePort: 'output', target: 'n4', targetPort: 'params' },
      { id: 'e4', source: 'n3', sourcePort: 'output', target: 'n5', targetPort: 'data' },
    ],
    pageId: 'pg-003',
    processKey: 'image-analysis-v3',
    exchange: 'workflow.vision.analyze',
  },
  {
    id: 'wf-004',
    name: 'Customer Sentiment Analyzer',
    description: 'Batch analyze customer reviews and feedback with NLP. Outputs sentiment scores, topics, and actionable insights.',
    version: '1.2.0',
    status: 'published',
    category: 'NLP',
    tags: ['NLP', 'Sentiment', 'Analytics', 'Customer'],
    author: 'David Park',
    createdAt: '2026-05-01T08:00:00Z',
    updatedAt: '2026-06-10T16:00:00Z',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=340&fit=crop&auto=format',
    stats: { runs: 3201, avgDuration: 12400, successRate: 96.2 },
    inputForm: {
      id: 'wf-004-input',
      title: 'Sentiment Analysis',
      layout: 'vertical',
      submitLabel: 'Analyze Sentiment',
      fields: [
        { name: 'text', label: 'Review Text', type: 'textarea', required: true, rows: 6, placeholder: 'Paste customer reviews here, one per line...', ui: { width: 'full' } },
        { name: 'language', label: 'Language', type: 'select', defaultValue: 'auto',
          options: [{ label: 'Auto Detect', value: 'auto' }, { label: 'English', value: 'en' }, { label: 'Chinese', value: 'zh' }] },
        { name: 'extractTopics', label: 'Extract Topics', type: 'boolean', defaultValue: true },
        { name: 'generateSummary', label: 'Generate Summary', type: 'boolean', defaultValue: true },
      ]
    },
    outputSchema: [
      { name: 'sentiment', label: 'Overall Sentiment', type: 'string' },
      { name: 'score', label: 'Sentiment Score', type: 'number' },
      { name: 'topics', label: 'Key Topics', type: 'json' },
      { name: 'summary', label: 'AI Summary', type: 'string' },
    ],
    nodes: [
      { id: 'n1', nodeType: 'user-input', label: 'Input', position: { x: 80, y: 200 }, config: {} },
      { id: 'n2', nodeType: 'llm-chat', label: 'Sentiment LLM', position: { x: 280, y: 200 }, config: { model: 'gpt-4o', temperature: 0.2 } },
      { id: 'n3', nodeType: 'text-transform', label: 'Parse Result', position: { x: 480, y: 200 }, config: {} },
      { id: 'n4', nodeType: 'result-output', label: 'Output', position: { x: 640, y: 200 }, config: { format: 'json' } },
    ],
    edges: [
      { id: 'e1', source: 'n1', sourcePort: 'data', target: 'n2', targetPort: 'prompt' },
      { id: 'e2', source: 'n2', sourcePort: 'response', target: 'n3', targetPort: 'input' },
      { id: 'e3', source: 'n3', sourcePort: 'output', target: 'n4', targetPort: 'data' },
    ],
    pageId: 'pg-004',
    processKey: 'sentiment-analyzer-v1',
    exchange: 'workflow.nlp.sentiment',
  },
];

// ============================================================
// MOCK EXECUTIONS
// ============================================================
export const MOCK_EXECUTIONS: ExecutionMeta[] = [
  {
    id: 'exec-001', workflowId: 'wf-001', workflowName: 'AI Content Generator',
    status: 'success', startedAt: '2026-06-11T10:23:00Z', finishedAt: '2026-06-11T10:23:08Z',
    durationMs: 8200,
    inputs: { topic: 'Machine Learning in Healthcare', tone: 'professional', wordCount: 1200 },
    outputs: { title: 'How ML is Transforming Modern Healthcare', tokensUsed: 2847 },
    processInstanceId: 'pi-a3f891b2',
    correlationId: 'corr-x7k2m9',
    steps: [
      { nodeId: 'n1', nodeName: 'User Input', status: 'success', startedAt: '2026-06-11T10:23:00Z', finishedAt: '2026-06-11T10:23:00Z', durationMs: 12 },
      { nodeId: 'n2', nodeName: 'Prompt Builder', status: 'success', startedAt: '2026-06-11T10:23:00Z', finishedAt: '2026-06-11T10:23:00Z', durationMs: 45 },
      { nodeId: 'n3', nodeName: 'GPT-4o', status: 'success', startedAt: '2026-06-11T10:23:00Z', finishedAt: '2026-06-11T10:23:08Z', durationMs: 7900 },
      { nodeId: 'n4', nodeName: 'Output', status: 'success', startedAt: '2026-06-11T10:23:08Z', finishedAt: '2026-06-11T10:23:08Z', durationMs: 23 },
    ]
  },
  {
    id: 'exec-002', workflowId: 'wf-002', workflowName: 'Data Pipeline ETL',
    status: 'running', startedAt: '2026-06-11T10:20:00Z',
    durationMs: 0,
    inputs: { sourceUrl: 'https://api.crm.io/v1/contacts', batchSize: 500, targetTable: 'users' },
    processInstanceId: 'pi-b9c123d4',
    correlationId: 'corr-y8l3n1',
    steps: [
      { nodeId: 'n1', nodeName: 'Config', status: 'success', startedAt: '2026-06-11T10:20:00Z', finishedAt: '2026-06-11T10:20:00Z', durationMs: 8 },
      { nodeId: 'n2', nodeName: 'Fetch Data', status: 'success', startedAt: '2026-06-11T10:20:00Z', finishedAt: '2026-06-11T10:20:02Z', durationMs: 2100 },
      { nodeId: 'n3', nodeName: 'Filter Records', status: 'running', startedAt: '2026-06-11T10:20:02Z', durationMs: 0 },
      { nodeId: 'n4', nodeName: 'Transform', status: 'idle', startedAt: '2026-06-11T10:20:02Z', durationMs: 0 },
      { nodeId: 'n5', nodeName: 'Load to DB', status: 'idle', startedAt: '2026-06-11T10:20:02Z', durationMs: 0 },
    ]
  },
  {
    id: 'exec-003', workflowId: 'wf-003', workflowName: 'Image Analysis & Tagging',
    status: 'failed', startedAt: '2026-06-11T09:45:00Z', finishedAt: '2026-06-11T09:45:03Z',
    durationMs: 3100,
    inputs: { analysisType: ['objects', 'scene'], confidence: 80 },
    error: 'Vision API rate limit exceeded (429). Retry after 60s.',
    processInstanceId: 'pi-c1d456e7',
    correlationId: 'corr-z9m4o2',
    steps: [
      { nodeId: 'n1', nodeName: 'Image Upload', status: 'success', startedAt: '2026-06-11T09:45:00Z', finishedAt: '2026-06-11T09:45:00Z', durationMs: 120 },
      { nodeId: 'n2', nodeName: 'Vision API', status: 'error', startedAt: '2026-06-11T09:45:00Z', finishedAt: '2026-06-11T09:45:03Z', durationMs: 3000, error: 'Rate limit exceeded' },
    ]
  },
];

export const MOCK_REGISTRY: MetadataRegistry = {
  nodeTypes: NODE_TYPE_REGISTRY,
  workflows: Object.fromEntries(MOCK_WORKFLOWS.map(w => [w.id, w])),
  pages: {},
  executions: MOCK_EXECUTIONS,
};
