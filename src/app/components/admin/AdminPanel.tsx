import React, { useState, useEffect, useCallback } from 'react';
import { AppCreator } from '../creator/AppCreator';
import { fetchAllApps, createApp, updateApp, publishApp, unpublishApp, deleteApp } from '../../api/client';
import type { AppMeta } from '../../types/appMeta';

type SubView =
  | { mode: 'list' }
  | { mode: 'create' }
  | { mode: 'edit'; app: AppMeta };

type ActionState = { id: string; action: 'publish' | 'unpublish' | 'delete' } | null;

function StatusBadge({ status }: { status: string }) {
  if (status === 'published') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> 已发布
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> 草稿
    </span>
  );
}

function ConfirmDialog({
  action, appName, onConfirm, onCancel, loading,
}: {
  action: 'publish' | 'unpublish' | 'delete';
  appName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const cfg = {
    publish:   { title: '发布应用',   body: `确认将「${appName}」发布到应用广场？`, btn: '确认发布',   btnCls: 'bg-green-600 hover:bg-green-700 text-white' },
    unpublish: { title: '下架应用',   body: `确认将「${appName}」从应用广场下架？下架后用户将无法访问。`, btn: '确认下架', btnCls: 'bg-amber-500 hover:bg-amber-600 text-white' },
    delete:    { title: '删除应用',   body: `确认删除「${appName}」？此操作不可撤销。`, btn: '确认删除', btnCls: 'bg-destructive hover:bg-destructive/90 text-white' },
  }[action];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-card rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-border" onClick={e => e.stopPropagation()}>
        <p className="font-semibold text-foreground">{cfg.title}</p>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{cfg.body}</p>
        <div className="flex gap-3 mt-5 justify-end">
          <button onClick={onCancel} disabled={loading}
            className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50">
            取消
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50 ${cfg.btnCls}`}>
            {loading ? '处理中…' : cfg.btn}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${ok ? 'bg-success text-white' : 'bg-destructive text-white'}`}>
      {ok ? '✓ ' : '✕ '}{msg}
    </div>
  );
}

function AppListView({
  apps, loading, onRefresh, onCreateApp, onEditApp, onAction,
}: {
  apps: AppMeta[];
  loading: boolean;
  onRefresh: () => void;
  onCreateApp: () => void;
  onEditApp: (app: AppMeta) => void;
  onAction: (id: string, action: 'publish' | 'unpublish' | 'delete') => void;
}) {
  const published = apps.filter(a => a.status === 'published').length;
  const draft = apps.filter(a => a.status === 'draft').length;

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      {/* 标题行 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-foreground font-semibold">应用管理</p>
          <p className="text-sm text-muted-foreground mt-0.5">管理所有应用的发布状态，仅管理员可见</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onRefresh} className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            刷新
          </button>
          <button
            onClick={onCreateApp}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm hover:bg-primary/90 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            添加应用
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '全部应用', value: apps.length, color: 'text-foreground' },
          { label: '已发布', value: published, color: 'text-success' },
          { label: '草稿', value: draft, color: 'text-warning' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* 表格 */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">加载中…</div>
        ) : apps.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-4">📦</p>
            <p className="text-sm text-muted-foreground mb-4">暂无应用，点击「添加应用」开始创建</p>
            <button
              onClick={onCreateApp}
              className="px-5 py-2 rounded-xl bg-primary text-white text-sm hover:bg-primary/90 transition-colors"
            >
              添加应用
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground">应用名称</th>
                  <th className="text-left px-4 py-3.5 text-xs font-medium text-muted-foreground">分类</th>
                  <th className="text-left px-4 py-3.5 text-xs font-medium text-muted-foreground">状态</th>
                  <th className="text-left px-4 py-3.5 text-xs font-medium text-muted-foreground">接口提供商</th>
                  <th className="text-left px-4 py-3.5 text-xs font-medium text-muted-foreground">运行次数</th>
                  <th className="text-right px-5 py-3.5 text-xs font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app, i) => (
                  <tr key={app.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'} hover:bg-muted/30 transition-colors`}>
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-foreground font-medium">{app.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-xs">{app.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{app.category || '—'}</td>
                    <td className="px-4 py-4"><StatusBadge status={app.status} /></td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${
                        app.api?.provider === 'runninghub'
                          ? 'bg-purple-50 text-purple-600 border-purple-200'
                          : 'bg-blue-50 text-blue-600 border-blue-200'
                      }`}>
                        {app.api?.provider === 'runninghub' ? 'RunningHub' : '自定义'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground tabular-nums">{app.stats?.runs ?? 0}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => onEditApp(app)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
                        >
                          编辑
                        </button>
                        {app.status === 'draft' ? (
                          <button
                            onClick={() => onAction(app.id, 'publish')}
                            className="text-xs px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 transition-colors"
                          >
                            发布
                          </button>
                        ) : (
                          <button
                            onClick={() => onAction(app.id, 'unpublish')}
                            className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition-colors"
                          >
                            下架
                          </button>
                        )}
                        <button
                          onClick={() => onAction(app.id, 'delete')}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminPanel() {
  const [subView, setSubView] = useState<SubView>({ mode: 'list' });
  const [apps, setApps] = useState<AppMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<ActionState>(null);
  const [acting, setActing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(() => {
    setLoading(true);
    fetchAllApps()
      .then(data => setApps(data as AppMeta[]))
      .catch(() => showToast('加载失败', false))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async () => {
    if (!confirm) return;
    setActing(true);
    try {
      if (confirm.action === 'publish') {
        const updated = await publishApp(confirm.id);
        setApps(prev => prev.map(a => a.id === confirm.id ? { ...a, ...updated } : a));
        showToast('已发布');
      } else if (confirm.action === 'unpublish') {
        const updated = await unpublishApp(confirm.id);
        setApps(prev => prev.map(a => a.id === confirm.id ? { ...a, ...updated } : a));
        showToast('已下架');
      } else if (confirm.action === 'delete') {
        await deleteApp(confirm.id);
        setApps(prev => prev.filter(a => a.id !== confirm.id));
        showToast('已删除');
      }
    } catch (e: any) {
      showToast(e.message || '操作失败', false);
    } finally {
      setActing(false);
      setConfirm(null);
    }
  };

  const handleSave = async (app: AppMeta) => {
    setSaving(true);
    try {
      const isEdit = subView.mode === 'edit';
      if (isEdit) {
        const updated = await updateApp(app.id, app);
        setApps(prev => prev.map(a => a.id === app.id ? { ...a, ...updated } : a));
        showToast('应用已保存');
      } else {
        const created = await createApp(app);
        setApps(prev => [created as AppMeta, ...prev]);
        showToast('应用已创建');
      }
      setSubView({ mode: 'list' });
    } catch (e: any) {
      showToast(e.message || '保存失败', false);
    } finally {
      setSaving(false);
    }
  };

  const confirmApp = confirm ? apps.find(a => a.id === confirm.id) : null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* 面包屑导航（仅创建/编辑时显示） */}
      {subView.mode !== 'list' && (
        <div className="flex-shrink-0 bg-card border-b border-border px-6 py-3 flex items-center gap-2 text-sm">
          <button
            onClick={() => setSubView({ mode: 'list' })}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            应用管理
          </button>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-border flex-shrink-0">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="text-foreground font-medium">
            {subView.mode === 'create' ? '添加应用' : `编辑 · ${subView.app.name}`}
          </span>
          {saving && (
            <span className="ml-auto text-xs text-muted-foreground">保存中…</span>
          )}
        </div>
      )}

      {/* 子视图内容 */}
      <div className="flex-1 overflow-hidden">
        {subView.mode === 'list' && (
          <AppListView
            apps={apps}
            loading={loading}
            onRefresh={load}
            onCreateApp={() => setSubView({ mode: 'create' })}
            onEditApp={app => setSubView({ mode: 'edit', app })}
            onAction={(id, action) => setConfirm({ id, action })}
          />
        )}

        {subView.mode === 'create' && (
          <AppCreator
            onSave={handleSave}
            onCancel={() => setSubView({ mode: 'list' })}
          />
        )}

        {subView.mode === 'edit' && (
          <AppCreator
            key={subView.app.id}
            initialApp={subView.app}
            onSave={handleSave}
            onCancel={() => setSubView({ mode: 'list' })}
          />
        )}
      </div>

      {confirm && confirmApp && (
        <ConfirmDialog
          action={confirm.action}
          appName={confirmApp.name}
          onConfirm={handleAction}
          onCancel={() => setConfirm(null)}
          loading={acting}
        />
      )}
    </div>
  );
}
