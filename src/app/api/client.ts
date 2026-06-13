const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080/api';

// ── token 存取 ────────────────────────────────────────────

function getToken(): string {
  return localStorage.getItem('auth_token') ?? '';
}

// ── HTTP 核心 ─────────────────────────────────────────────

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getToken();
  if (token) headers['X-User-Token'] = token;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json: any;
  try { json = await res.json(); } catch { throw new Error(`HTTP ${res.status}`); }

  if (!res.ok) throw new Error(json?.message ?? json?.error ?? `HTTP ${res.status}`);
  return json as T;
}

const get  = <T>(path: string) => request<T>('GET',    path);
const post = <T>(path: string, body: unknown) => request<T>('POST',   path, body);
const put  = <T>(path: string, body: unknown) => request<T>('PUT',    path, body);
const del  = <T>(path: string) => request<T>('DELETE', path);

// ── Auth ──────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: 'user' | 'admin';
}

export async function login(username: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const data = await post<{ token: string; user: AuthUser }>('/auth/login', { username, password });
  localStorage.setItem('auth_token', data.token);
  localStorage.setItem('auth_user', JSON.stringify(data.user));
  return data;
}

export async function register(params: {
  username: string; password: string;
  displayName?: string; email?: string; phone?: string;
}): Promise<{ token: string; user: AuthUser }> {
  const data = await post<{ token: string; user: AuthUser }>('/auth/register', params);
  localStorage.setItem('auth_token', data.token);
  localStorage.setItem('auth_user', JSON.stringify(data.user));
  return data;
}

export async function logout(): Promise<void> {
  try { await post('/auth/logout', {}); } catch { /* ignore */ }
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

export function getSavedUser(): AuthUser | null {
  try { return JSON.parse(localStorage.getItem('auth_user') ?? 'null'); } catch { return null; }
}

// ── App 字段映射（后端列名 → 前端字段名）────────────────────

function fromBackendApp(b: any): any {
  return {
    id: b.id, name: b.name, description: b.description,
    category: b.category, tags: b.tags ?? [], author: b.author,
    status: b.status, createdAt: b.createdAt, updatedAt: b.updatedAt,
    api:    b.apiConfig    ?? b.api    ?? {},
    inputs: b.inputs       ?? [],
    outputs: b.outputs     ?? [],
    layout: b.layoutConfig ?? b.layout ?? {},
    stats: {
      runs:  b.runCount  ?? b.stats?.runs  ?? 0,
      likes: b.likeCount ?? b.stats?.likes ?? 0,
      views: b.viewCount ?? b.stats?.views ?? 0,
    },
  };
}

function toBackendApp(app: any): any {
  return {
    name: app.name, description: app.description,
    category: app.category, tags: app.tags ?? [], author: app.author,
    apiConfig:    app.api     ?? app.apiConfig    ?? {},
    inputs:       app.inputs  ?? [],
    outputs:      app.outputs ?? [],
    layoutConfig: app.layout  ?? app.layoutConfig ?? {},
  };
}

// ── Apps ──────────────────────────────────────────────────

export async function fetchApps(): Promise<any[]> {
  const res = await get<any>('/apps?status=published');
  const list = Array.isArray(res) ? res : (res?.data ?? []);
  return list.map(fromBackendApp);
}

function unwrap(res: any) {
  return fromBackendApp(res?.data ?? res);
}

export async function createApp(app: any): Promise<any> {
  return unwrap(await post<any>('/apps', toBackendApp(app)));
}

export async function updateApp(id: string, app: any): Promise<any> {
  return unwrap(await put<any>(`/apps/${id}`, toBackendApp(app)));
}

export async function deleteApp(id: string): Promise<void> {
  await del(`/apps/${id}`);
}

export async function publishApp(id: string): Promise<any> {
  return unwrap(await post<any>(`/apps/${id}/publish`, {}));
}

export async function unpublishApp(id: string): Promise<any> {
  return unwrap(await post<any>(`/apps/${id}/unpublish`, {}));
}

export async function fetchAllApps(): Promise<any[]> {
  const data = await get<any[]>('/apps');
  return (Array.isArray(data) ? data : []).map(fromBackendApp);
}

// ── User meta ─────────────────────────────────────────────

export interface UserMeta {
  credits: number;
  membershipTier: string | null;
  membershipExpiry: string | null;
}

export async function fetchUserMeta(): Promise<UserMeta> {
  return get<UserMeta>('/user/meta');
}

// ── Records ───────────────────────────────────────────────

function normalizeRecord(r: any): any {
  return {
    ...r,
    id: r.runId ?? r.id,
    status: r.status === 'success' ? 'completed' : (r.status ?? 'running'),
    result: r.result ?? r.resultText ?? '',
  };
}

export async function fetchRecords(): Promise<any[]> {
  const data = await get<any[]>('/records');
  return (Array.isArray(data) ? data : []).map(normalizeRecord);
}

export async function createRecord(body: { appId: string; appName: string; appCategory: string }): Promise<any> {
  return normalizeRecord(await post<any>('/records', body));
}

export async function updateRecord(id: string, updates: Partial<{
  status: string; durationMs: number; creditsUsed: number; result: string; expiresAt: string;
}>): Promise<any> {
  const body: any = { ...updates };
  if (updates.result !== undefined) { body.resultText = updates.result; delete body.result; }
  return normalizeRecord(await put<any>(`/records/${id}`, body));
}

// ── Payments ──────────────────────────────────────────────

export async function fetchPayments(): Promise<any[]> {
  const data = await get<any[]>('/payments');
  return Array.isArray(data) ? data : [];
}

export async function createPayment(body: {
  type: string; description: string; amount: number; creditsToAdd?: number; tierId?: string;
}): Promise<any> {
  return post<any>('/payments', body);
}

// ── Account ───────────────────────────────────────────────

export async function fetchAccount(): Promise<any> { return get<any>('/user/account'); }

export async function updateAccount(body: { displayName?: string; email?: string; phone?: string }): Promise<any> {
  return put<any>('/user/account', body);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await put('/user/password', { currentPassword, newPassword });
}

// ── Runner ────────────────────────────────────────────────

export interface RunResult {
  runId: string; appId: string; status: string;
  outputs: Record<string, any>; errorMsg?: string;
  durationMs: number; startedAt: string; finishedAt?: string;
}

export async function runApp(appId: string, inputs: Record<string, unknown>): Promise<RunResult> {
  return post<RunResult>('/runner/run', { appId, inputs });
}

export async function getRunResult(runId: string): Promise<RunResult> {
  return get<RunResult>(`/runner/runs/${runId}`);
}

// ── Subscription ──────────────────────────────────────────

export async function fetchSubscription(): Promise<{ credits: number; membershipTier: string | null; membershipExpiry: string | null }> {
  return get('/subscription');
}
