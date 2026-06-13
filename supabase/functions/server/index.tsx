import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();
const P = "/make-server-44a60f96";

app.use("*", logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization", "X-User-Token"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// ─── Supabase client (service role — server only) ──────────

function db() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// ─── helpers ───────────────────────────────────────────────

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(): string {
  const b = new Uint8Array(24);
  crypto.getRandomValues(b);
  return Array.from(b).map(x => x.toString(16).padStart(2, "0")).join("");
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function ok(c: any, data: any, status = 200) {
  return c.json(data, status);
}

function fail(c: any, msg: string, status = 400) {
  return c.json({ error: msg, message: msg }, status);
}

// Read user token from X-User-Token header (session token stored in auth_tokens table)
async function authUser(c: any): Promise<{ id: string; role: string } | null> {
  const token = c.req.header("X-User-Token") ?? "";
  if (!token) return null;

  const { data, error } = await db()
    .from("auth_tokens")
    .select("user_id, role, expires_at")
    .eq("token", token)
    .single();

  if (error || !data) return null;
  if (new Date(data.expires_at) < new Date()) {
    await db().from("auth_tokens").delete().eq("token", token);
    return null;
  }
  return { id: data.user_id, role: data.role };
}

// ─── Auth ──────────────────────────────────────────────────

app.post(`${P}/auth/login`, async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) return fail(c, "用户名和密码不能为空");

  const hash = await sha256hex(password);
  const { data: user, error } = await db()
    .from("users")
    .select("id, username, display_name, role, email, phone, avatar, created_at")
    .eq("username", username)
    .eq("password_hash", hash)
    .single();

  if (error || !user) return fail(c, "用户名或密码错误", 401);

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await db().from("auth_tokens").insert({ token, user_id: user.id, role: user.role, expires_at: expiresAt });

  return ok(c, {
    token,
    user: { id: user.id, username: user.username, displayName: user.display_name, role: user.role, email: user.email },
  });
});

app.post(`${P}/auth/register`, async (c) => {
  const { username, password, displayName, email, phone } = await c.req.json();
  if (!username || username.length < 3) return fail(c, "用户名至少 3 个字符");
  if (!password || password.length < 6) return fail(c, "密码至少 6 个字符");

  const { data: existing } = await db().from("users").select("id").eq("username", username).single();
  if (existing) return fail(c, "用户名已被占用，请换一个", 409);

  const id = `u-${uid()}`;
  const hash = await sha256hex(password);
  const { error } = await db().from("users").insert({
    id, username,
    display_name: displayName || username,
    password_hash: hash,
    email: email || "",
    phone: phone || "",
    role: "user",
  });
  if (error) return fail(c, `注册失败: ${error.message}`, 500);

  // Give new users some starter credits
  await db().from("user_credits").insert({ user_id: id, credits: 50, membership_tier: "" });

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await db().from("auth_tokens").insert({ token, user_id: id, role: "user", expires_at: expiresAt });

  return ok(c, {
    token,
    user: { id, username, displayName: displayName || username, role: "user", email: email || "" },
  }, 201);
});

app.post(`${P}/auth/logout`, async (c) => {
  const token = c.req.header("X-User-Token") ?? "";
  if (token) await db().from("auth_tokens").delete().eq("token", token);
  return ok(c, null);
});

// ─── Apps ──────────────────────────────────────────────────

app.get(`${P}/apps`, async (c) => {
  const status = c.req.query("status") || "";
  const category = c.req.query("category") || "";
  const keyword = c.req.query("keyword") || "";

  let q = db().from("app_meta").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  if (category) q = q.eq("category", category);
  if (keyword) q = q.or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`);

  const { data, error } = await q;
  if (error) return fail(c, error.message, 500);
  return ok(c, (data || []).map(toAppResponse));
});

app.get(`${P}/apps/:id`, async (c) => {
  const id = c.req.param("id");
  const { data, error } = await db().from("app_meta").select("*").eq("id", id).single();
  if (error || !data) return fail(c, "应用不存在", 404);
  // Increment view count async
  db().from("app_meta").update({ view_count: (data.view_count || 0) + 1 }).eq("id", id);
  return ok(c, toAppResponse(data));
});

app.post(`${P}/apps`, async (c) => {
  const user = await authUser(c);
  if (!user || user.role !== "admin") return fail(c, "无权限", 403);

  const body = await c.req.json();
  const id = `app-${uid()}`;
  const now = new Date().toISOString();
  const { data, error } = await db().from("app_meta").insert({
    id,
    name: body.name || "",
    description: body.description || "",
    category: body.category || "",
    tags: body.tags || [],
    author: body.author || user.id,
    status: "draft",
    api_config: body.apiConfig || {},
    inputs: body.inputs || [],
    outputs: body.outputs || [],
    layout_config: body.layoutConfig || {},
    estimated_credits: body.estimatedCredits || 0,
    created_at: now,
    updated_at: now,
  }).select().single();
  if (error) return fail(c, error.message, 500);
  return ok(c, toAppResponse(data), 201);
});

app.put(`${P}/apps/:id`, async (c) => {
  const user = await authUser(c);
  if (!user || user.role !== "admin") return fail(c, "无权限", 403);

  const id = c.req.param("id");
  const body = await c.req.json();
  const patch: any = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) patch.name = body.name;
  if (body.description !== undefined) patch.description = body.description;
  if (body.category !== undefined) patch.category = body.category;
  if (body.tags !== undefined) patch.tags = body.tags;
  if (body.author !== undefined) patch.author = body.author;
  if (body.status !== undefined) patch.status = body.status;
  if (body.apiConfig !== undefined) patch.api_config = body.apiConfig;
  if (body.inputs !== undefined) patch.inputs = body.inputs;
  if (body.outputs !== undefined) patch.outputs = body.outputs;
  if (body.layoutConfig !== undefined) patch.layout_config = body.layoutConfig;
  if (body.estimatedCredits !== undefined) patch.estimated_credits = body.estimatedCredits;

  const { data, error } = await db().from("app_meta").update(patch).eq("id", id).select().single();
  if (error || !data) return fail(c, error?.message || "应用不存在", error ? 500 : 404);
  return ok(c, toAppResponse(data));
});

app.delete(`${P}/apps/:id`, async (c) => {
  const user = await authUser(c);
  if (!user || user.role !== "admin") return fail(c, "无权限", 403);

  const id = c.req.param("id");
  const { error } = await db().from("app_meta").delete().eq("id", id);
  if (error) return fail(c, error.message, 500);
  return ok(c, null);
});

app.post(`${P}/apps/:id/publish`, async (c) => {
  const user = await authUser(c);
  if (!user || user.role !== "admin") return fail(c, "无权限", 403);

  const id = c.req.param("id");
  const { data, error } = await db()
    .from("app_meta")
    .update({ status: "published", updated_at: new Date().toISOString() })
    .eq("id", id).select().single();
  if (error || !data) return fail(c, "应用不存在", 404);
  return ok(c, toAppResponse(data));
});

app.post(`${P}/apps/:id/unpublish`, async (c) => {
  const user = await authUser(c);
  if (!user || user.role !== "admin") return fail(c, "无权限", 403);

  const id = c.req.param("id");
  const { data, error } = await db()
    .from("app_meta")
    .update({ status: "draft", updated_at: new Date().toISOString() })
    .eq("id", id).select().single();
  if (error || !data) return fail(c, "应用不存在", 404);
  return ok(c, toAppResponse(data));
});

function toAppResponse(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    tags: row.tags || [],
    author: row.author,
    status: row.status,
    apiConfig: row.api_config || {},
    inputs: row.inputs || [],
    outputs: row.outputs || [],
    layoutConfig: row.layout_config || {},
    estimatedCredits: row.estimated_credits || 0,
    runCount: row.run_count || 0,
    likeCount: row.like_count || 0,
    viewCount: row.view_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Runner ────────────────────────────────────────────────

app.post(`${P}/runner/run`, async (c) => {
  const user = await authUser(c);
  if (!user) return fail(c, "未登录", 401);

  const { appId, inputs } = await c.req.json();
  if (!appId) return fail(c, "appId 不能为空");

  const { data: app, error: appErr } = await db().from("app_meta").select("*").eq("id", appId).single();
  if (appErr || !app) return fail(c, "应用不存在", 404);

  const apiConfig = app.api_config || {};
  const inputFields = app.inputs || [];

  const runId = `run-${uid()}`;
  const startedAt = new Date().toISOString();
  await db().from("run_record").insert({
    id: runId, user_id: user.id, app_id: appId,
    app_name: app.name, app_category: app.category,
    status: "running", inputs_json: inputs || {}, started_at: startedAt,
  });

  let outputs: any = {};
  let status = "success";
  let errorMsg = "";

  try {
    if ((apiConfig.provider || "").toLowerCase() === "runninghub") {
      outputs = await callRunningHub(apiConfig, inputFields, inputs || {});
    } else {
      outputs = await callCustomApi(apiConfig, inputs || {});
    }
  } catch (e: any) {
    status = "failed";
    errorMsg = e.message || "调用失败";
  }

  const finishedAt = new Date().toISOString();
  const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  await db().from("run_record").update({
    status, outputs_json: outputs, error_msg: errorMsg,
    finished_at: finishedAt, duration_ms: durationMs,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }).eq("id", runId);

  // Increment run count
  await db().from("app_meta").update({ run_count: (app.run_count || 0) + 1 }).eq("id", appId);

  return ok(c, { runId, appId, status, outputs, errorMsg, durationMs, startedAt, finishedAt });
});

app.get(`${P}/runner/runs/:runId`, async (c) => {
  const user = await authUser(c);
  if (!user) return fail(c, "未登录", 401);

  const runId = c.req.param("runId");
  const { data, error } = await db().from("run_record").select("*").eq("id", runId).single();
  if (error || !data) return fail(c, "记录不存在", 404);
  return ok(c, toRunResponse(data));
});

app.get(`${P}/runner/apps/:appId/runs`, async (c) => {
  const user = await authUser(c);
  if (!user) return fail(c, "未登录", 401);

  const appId = c.req.param("appId");
  const { data, error } = await db().from("run_record").select("*")
    .eq("app_id", appId).order("started_at", { ascending: false });
  if (error) return fail(c, error.message, 500);
  return ok(c, (data || []).map(toRunResponse));
});

async function callRunningHub(apiConfig: any, inputFields: any[], userInputs: Record<string, any>) {
  const nodeInfoList = inputFields
    .filter((f: any) => f.nodeId)
    .map((f: any) => ({
      nodeId: f.nodeId,
      fieldName: f.fieldName || "value",
      fieldValue: userInputs[f.name] ?? f.defaultValue ?? "",
      description: f.description || f.label || "",
    }));

  const body = {
    nodeInfoList,
    instanceType: apiConfig.instanceType || "default",
    usePersonalQueue: apiConfig.usePersonalQueue || "false",
  };

  const apiKey = apiConfig.authKey || Deno.env.get("RUNNINGHUB_API_KEY") || "";
  const resp = await fetch(apiConfig.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "Authorization": `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const text = await resp.text();
  if (!resp.ok) throw new Error(`RunningHub error ${resp.status}: ${text}`);

  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function callCustomApi(apiConfig: any, params: Record<string, any>) {
  const method = (apiConfig.method || "POST").toUpperCase();
  const timeout = apiConfig.timeoutMs || 30000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    let url = apiConfig.endpoint;
    let bodyStr: string | undefined;
    const headers: Record<string, string> = { ...(apiConfig.headers || {}) };

    if (apiConfig.authType === "bearer" && apiConfig.authKey) {
      headers["Authorization"] = `Bearer ${apiConfig.authKey}`;
    } else if (apiConfig.authType === "apikey" && apiConfig.authKey) {
      headers["X-Api-Key"] = apiConfig.authKey;
    }

    if (method === "GET" || method === "DELETE") {
      const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
      url = `${url}?${qs}`;
    } else {
      headers["Content-Type"] = "application/json";
      bodyStr = JSON.stringify({ ...apiConfig.fixedParams, ...params });
    }

    const resp = await fetch(url, { method, headers, body: bodyStr, signal: controller.signal });
    const text = await resp.text();
    if (!resp.ok) throw new Error(`Upstream error ${resp.status}: ${text}`);
    try { return JSON.parse(text); } catch { return { raw: text }; }
  } finally {
    clearTimeout(timer);
  }
}

function toRunResponse(row: any) {
  return {
    runId: row.id,
    appId: row.app_id,
    appName: row.app_name,
    status: row.status === "success" ? "completed" : row.status,
    outputs: row.outputs_json || {},
    result: row.result_text || "",
    errorMsg: row.error_msg || "",
    creditsUsed: row.credits_used || 0,
    durationMs: row.duration_ms || 0,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    expiresAt: row.expires_at,
  };
}

// ─── User account & meta ───────────────────────────────────

app.get(`${P}/user/meta`, async (c) => {
  const user = await authUser(c);
  if (!user) return fail(c, "未登录", 401);

  const { data } = await db().from("user_credits").select("*").eq("user_id", user.id).single();
  return ok(c, {
    credits: data?.credits || 0,
    membershipTier: data?.membership_tier || null,
    membershipExpiry: data?.membership_expiry || null,
  });
});

app.get(`${P}/user/account`, async (c) => {
  const user = await authUser(c);
  if (!user) return fail(c, "未登录", 401);

  const { data, error } = await db().from("users").select("id, username, display_name, email, phone, role, avatar, created_at").eq("id", user.id).single();
  if (error || !data) return fail(c, "用户不存在", 404);
  return ok(c, {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    avatar: data.avatar,
    createdAt: data.created_at,
  });
});

app.put(`${P}/user/account`, async (c) => {
  const user = await authUser(c);
  if (!user) return fail(c, "未登录", 401);

  const { displayName, email, phone } = await c.req.json();
  const patch: any = { updated_at: new Date().toISOString() };
  if (displayName !== undefined) patch.display_name = displayName;
  if (email !== undefined) patch.email = email;
  if (phone !== undefined) patch.phone = phone;

  const { data, error } = await db().from("users").update(patch).eq("id", user.id).select().single();
  if (error) return fail(c, error.message, 500);
  return ok(c, {
    id: data.id, username: data.username, displayName: data.display_name,
    email: data.email, phone: data.phone, role: data.role,
  });
});

app.put(`${P}/user/password`, async (c) => {
  const user = await authUser(c);
  if (!user) return fail(c, "未登录", 401);

  const { currentPassword, newPassword } = await c.req.json();
  if (!newPassword || newPassword.length < 6) return fail(c, "新密码至少 6 个字符");

  const currentHash = await sha256hex(currentPassword);
  const { data: u } = await db().from("users").select("password_hash").eq("id", user.id).single();
  if (!u || u.password_hash !== currentHash) return fail(c, "当前密码错误", 400);

  const newHash = await sha256hex(newPassword);
  await db().from("users").update({ password_hash: newHash, updated_at: new Date().toISOString() }).eq("id", user.id);
  return ok(c, null);
});

// ─── Run records ───────────────────────────────────────────

app.get(`${P}/records`, async (c) => {
  const user = await authUser(c);
  if (!user) return fail(c, "未登录", 401);

  const { data, error } = await db().from("run_record").select("*")
    .eq("user_id", user.id).order("started_at", { ascending: false });
  if (error) return fail(c, error.message, 500);
  return ok(c, (data || []).map(toRunResponse));
});

app.post(`${P}/records`, async (c) => {
  const user = await authUser(c);
  if (!user) return fail(c, "未登录", 401);

  const { appId, appName, appCategory } = await c.req.json();
  if (!appId) return fail(c, "appId 不能为空");

  const id = `run-${uid()}`;
  const { data, error } = await db().from("run_record").insert({
    id, user_id: user.id, app_id: appId,
    app_name: appName || "", app_category: appCategory || "",
    status: "running", inputs_json: {}, outputs_json: {},
  }).select().single();
  if (error) return fail(c, error.message, 500);
  return ok(c, toRunResponse(data), 201);
});

app.put(`${P}/records/:id`, async (c) => {
  const user = await authUser(c);
  if (!user) return fail(c, "未登录", 401);

  const id = c.req.param("id");
  const { status, resultText, errorMsg, creditsUsed, durationMs, expiresAt } = await c.req.json();
  const patch: any = {};
  if (status !== undefined) patch.status = status;
  if (resultText !== undefined) patch.result_text = resultText;
  if (errorMsg !== undefined) patch.error_msg = errorMsg;
  if (creditsUsed !== undefined) patch.credits_used = creditsUsed;
  if (durationMs !== undefined) patch.duration_ms = durationMs;
  if (expiresAt !== undefined) patch.expires_at = expiresAt;

  const { data, error } = await db().from("run_record").update(patch).eq("id", id).eq("user_id", user.id).select().single();
  if (error || !data) return fail(c, "记录不存在", 404);
  return ok(c, toRunResponse(data));
});

// ─── Payments & subscription ───────────────────────────────

app.get(`${P}/payments`, async (c) => {
  const user = await authUser(c);
  if (!user) return fail(c, "未登录", 401);

  const { data, error } = await db().from("payment_records").select("*")
    .eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) return fail(c, error.message, 500);
  return ok(c, (data || []).map(toPaymentResponse));
});

app.post(`${P}/payments`, async (c) => {
  const user = await authUser(c);
  if (!user) return fail(c, "未登录", 401);

  const { type, description, amount, creditsToAdd, tierId } = await c.req.json();
  if (!type || !["membership", "credits"].includes(type)) return fail(c, "type 必须为 membership 或 credits");
  if (!amount || amount <= 0) return fail(c, "金额必须大于 0");

  const id = `pay-${uid()}`;
  const orderId = `ORD-${Date.now()}`;
  const { data, error } = await db().from("payment_records").insert({
    id, user_id: user.id, order_id: orderId,
    type, description: description || "", amount,
    status: "paid",
    credits_added: creditsToAdd || 0,
    tier_id: tierId || "",
  }).select().single();
  if (error) return fail(c, error.message, 500);

  // Update credits or membership
  const { data: credit } = await db().from("user_credits").select("*").eq("user_id", user.id).single();
  if (type === "credits" && creditsToAdd > 0) {
    const cur = credit?.credits || 0;
    await db().from("user_credits").upsert({ user_id: user.id, credits: cur + creditsToAdd, membership_tier: credit?.membership_tier || "", updated_at: new Date().toISOString() });
  } else if (type === "membership" && tierId) {
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await db().from("user_credits").upsert({ user_id: user.id, credits: credit?.credits || 0, membership_tier: tierId, membership_expiry: expiry, updated_at: new Date().toISOString() });
  }

  return ok(c, toPaymentResponse(data), 201);
});

app.get(`${P}/subscription`, async (c) => {
  const user = await authUser(c);
  if (!user) return fail(c, "未登录", 401);

  const { data } = await db().from("user_credits").select("*").eq("user_id", user.id).single();
  return ok(c, {
    credits: data?.credits || 0,
    membershipTier: data?.membership_tier || null,
    membershipExpiry: data?.membership_expiry || null,
  });
});

function toPaymentResponse(row: any) {
  return {
    id: row.id,
    orderId: row.order_id,
    type: row.type,
    description: row.description,
    amount: row.amount,
    status: row.status,
    creditsAdded: row.credits_added,
    createdAt: row.created_at,
  };
}

// ─── Health check ──────────────────────────────────────────

app.get(`${P}/health`, (c) => ok(c, { status: "ok", db: "supabase" }));

Deno.serve(app.fetch);
