import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { AppPlaza } from './components/plaza/AppPlaza';
import { AppRenderer } from './components/renderer/AppRenderer';
import { GenerationRecords } from './components/records/GenerationRecords';
import { Subscription } from './components/subscription/Subscription';
import { PaymentRecords } from './components/payment/PaymentRecords';
import { AccountManagement } from './components/account/AccountManagement';
import { AdminPanel } from './components/admin/AdminPanel';
import { fetchApps, fetchUserMeta, logout as apiLogout, getSavedUser } from './api/client';
import type { AppMeta } from './types/appMeta';

type UserRole = 'user' | 'admin';

interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

type View =
  | { type: 'plaza' }
  | { type: 'run'; appId: string }
  | { type: 'records' }
  | { type: 'subscription' }
  | { type: 'payments' }
  | { type: 'account' }
  | { type: 'admin' };

const MAIN_NAV = [
  {
    id: 'plaza', label: '应用广场', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'records', label: '生成记录', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    id: 'subscription', label: '充值订阅', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    id: 'payments', label: '支付记录', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    id: 'account', label: '账户管理', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const ADMIN_NAV = {
  id: 'admin', label: '应用管理', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
  ),
};

const PAGE_TITLES: Record<string, string> = {
  plaza: '应用广场', records: '生成记录',
  subscription: '充值订阅', payments: '支付记录', account: '账户管理',
  admin: '应用管理',
};

export default function App() {
  const [auth, setAuth] = useState<AuthUser | null>(() => {
    const saved = getSavedUser();
    return saved ? { id: saved.id, username: saved.username, displayName: saved.displayName, role: saved.role as UserRole } : null;
  });
  const [view, setView] = useState<View>({ type: 'plaza' });
  const [apps, setApps] = useState<AppMeta[]>([]);
  const [credits, setCredits] = useState<number>(0);
  const [appsLoading, setAppsLoading] = useState(false);

  useEffect(() => {
    const load = (showLoading = false) => {
      if (showLoading) setAppsLoading(true);
      fetchApps()
        .then(data => setApps(data as AppMeta[]))
        .catch(e => console.log('Load apps error:', e))
        .finally(() => setAppsLoading(false));
    };
    load(true);
    // 每 30 秒静默刷新，确保管理端发布的应用及时出现
    const timer = setInterval(() => load(false), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!auth) return;
    fetchUserMeta()
      .then(meta => setCredits(meta.credits))
      .catch(e => console.log('Load meta error:', e));
  }, [auth]);

  if (!auth) {
    return <LoginPage onLogin={user => setAuth(user as AuthUser)} />;
  }

  const handleLogout = async () => {
    await apiLogout();
    setAuth(null);
    setView({ type: 'plaza' });
  };

  const currentApp = view.type === 'run' ? apps.find(a => a.id === view.appId) : undefined;
  const activeNav = view.type === 'run' ? 'plaza' : view.type;
  const headerTitle = view.type === 'run' && currentApp ? '' : PAGE_TITLES[view.type] || '';

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* 侧边栏 */}
      <aside className="w-16 md:w-56 border-r border-border bg-white flex flex-col flex-shrink-0">
        <div className="px-3 md:px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="2" fill="white" opacity="0.9" />
              <rect x="13" y="3" width="8" height="8" rx="2" fill="white" opacity="0.6" />
              <rect x="3" y="13" width="8" height="8" rx="2" fill="white" opacity="0.6" />
              <rect x="13" y="13" width="8" height="8" rx="2" fill="white" opacity="0.3" />
            </svg>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-foreground">AppMeta</p>
            <p className="text-xs text-muted-foreground">应用发布平台</p>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {[...MAIN_NAV, ...(auth.role === 'admin' ? [ADMIN_NAV] : [])].map(item => {
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView({ type: item.id as any })}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-sm ${
                  active ? 'text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                style={active ? { background: 'rgba(91,106,247,0.08)' } : {}}
              >
                <span className="flex-shrink-0 w-6 flex items-center justify-center">{item.icon}</span>
                <span className="hidden md:block">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden md:block px-3 py-3 border-t border-border">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-3">
            <p className="text-xs text-amber-700 font-medium">积分余额</p>
            <p className="text-lg font-bold text-amber-600 tabular-nums mt-0.5">{credits}</p>
            <button
              onClick={() => setView({ type: 'subscription' })}
              className="mt-1.5 text-xs text-amber-600 hover:text-amber-700 hover:underline transition-colors"
            >
              充值 →
            </button>
          </div>
        </div>

        <div className="px-3 py-3 border-t border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {auth.displayName.slice(0, 1)}
          </div>
          <div className="hidden md:flex flex-col flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{auth.displayName}</p>
            <p className="text-xs text-muted-foreground">普通用户</p>
          </div>
          <button
            onClick={handleLogout}
            title="退出登录"
            className="hidden md:flex w-7 h-7 rounded-lg items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-border flex items-center px-6 gap-4 flex-shrink-0" style={{ height: '52px' }}>
          <div className="flex-1">
            {view.type === 'run' && currentApp ? (
              <div className="flex items-center gap-2 text-sm">
                <button onClick={() => setView({ type: 'plaza' })} className="text-muted-foreground hover:text-foreground transition-colors">应用广场</button>
                <span className="text-border">/</span>
                <span className="text-foreground font-medium">{currentApp.name}</span>
              </div>
            ) : (
              <p className="text-sm font-medium text-foreground">{headerTitle}</p>
            )}
          </div>
          <button
            onClick={() => setView({ type: 'account' })}
            className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold flex-shrink-0 hover:bg-primary/90 transition-colors"
          >
            {auth.displayName.slice(0, 1)}
          </button>
        </header>

        <div className="flex-1 overflow-hidden">
          {view.type === 'plaza' && (
            <AppPlaza
              apps={apps}
              onRunApp={id => setView({ type: 'run', appId: id })}
              onEditApp={() => {}}
              onCreateApp={() => {}}
            />
          )}

          {view.type === 'run' && currentApp && (
            <div className="h-full overflow-y-auto">
              <AppRenderer app={currentApp} onBack={() => setView({ type: 'plaza' })} />
            </div>
          )}

          {view.type === 'records' && <div className="h-full overflow-y-auto"><GenerationRecords /></div>}
          {view.type === 'subscription' && <div className="h-full overflow-y-auto"><Subscription /></div>}
          {view.type === 'payments' && <div className="h-full overflow-y-auto"><PaymentRecords /></div>}
          {view.type === 'account' && <div className="h-full overflow-y-auto"><AccountManagement /></div>}
          {view.type === 'admin' && <div className="h-full overflow-hidden"><AdminPanel /></div>}
        </div>
      </main>
    </div>
  );
}
