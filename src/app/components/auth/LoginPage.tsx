import React, { useState } from 'react';
import { login, register } from '../../api/client';

type UserRole = 'user' | 'admin';

interface LoginResult {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

interface LoginPageProps {
  onLogin: (result: LoginResult) => void;
}

type Mode = 'login' | 'register';

// 图标复用
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const IconTag = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
      {show ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

function InputRow({
  icon, type, value, onChange, placeholder, autoComplete, showToggle, showPwd, onToggle,
}: {
  icon: React.ReactNode; type: string; value: string; onChange: (v: string) => void;
  placeholder: string; autoComplete?: string; showToggle?: boolean; showPwd?: boolean; onToggle?: () => void;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
      <input
        type={showToggle ? (showPwd ? 'text' : 'password') : type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/15 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400/50 transition-all"
      />
      {showToggle && onToggle && <EyeToggle show={!!showPwd} onToggle={onToggle} />}
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-red-500/15 border border-red-400/30 rounded-xl text-sm text-red-300">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {msg}
    </div>
  );
}

function SubmitButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 rounded-xl text-white font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] mt-2"
      style={{ background: 'linear-gradient(135deg, #5b6af7, #7c3aed)' }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {loadingLabel}
        </span>
      ) : label}
    </button>
  );
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>('login');

  // Login state
  const [lUsername, setLUsername] = useState('');
  const [lPassword, setLPassword] = useState('');
  const [lShowPwd, setLShowPwd] = useState(false);
  const [lError, setLError] = useState('');
  const [lLoading, setLLoading] = useState(false);

  // Register state
  const [rUsername, setRUsername] = useState('');
  const [rPassword, setRPassword] = useState('');
  const [rConfirm, setRConfirm] = useState('');
  const [rDisplayName, setRDisplayName] = useState('');
  const [rEmail, setREmail] = useState('');
  const [rPhone, setRPhone] = useState('');
  const [rShowPwd, setRShowPwd] = useState(false);
  const [rShowConfirm, setRShowConfirm] = useState(false);
  const [rError, setRError] = useState('');
  const [rLoading, setRLoading] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m);
    setLError('');
    setRError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLError('');
    if (!lUsername.trim() || !lPassword) { setLError('请填写用户名和密码'); return; }
    setLLoading(true);
    try {
      const { user } = await login(lUsername.trim(), lPassword);
      onLogin({ id: user.id, username: user.username, displayName: user.displayName, role: user.role as UserRole });
    } catch (e: any) {
      setLError(e.message ?? '登录失败，请重试');
    } finally {
      setLLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRError('');
    if (!rUsername.trim()) { setRError('请填写用户名'); return; }
    if (rUsername.trim().length < 3) { setRError('用户名至少 3 个字符'); return; }
    if (!rPassword) { setRError('请填写密码'); return; }
    if (rPassword.length < 6) { setRError('密码至少 6 个字符'); return; }
    if (rPassword !== rConfirm) { setRError('两次密码输入不一致'); return; }
    if (rEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rEmail)) { setRError('邮箱格式不正确'); return; }
    if (rPhone && !/^1[3-9]\d{9}$/.test(rPhone)) { setRError('手机号格式不正确'); return; }

    setRLoading(true);
    try {
      const { user } = await register({
        username: rUsername.trim(),
        password: rPassword,
        displayName: rDisplayName.trim() || undefined,
        email: rEmail.trim() || undefined,
        phone: rPhone.trim() || undefined,
      });
      onLogin({ id: user.id, username: user.username, displayName: user.displayName, role: user.role as UserRole });
    } catch (e: any) {
      setRError(e.message ?? '注册失败，请重试');
    } finally {
      setRLoading(false);
    }
  };

  const QUICK: Record<string, string> = { admin: 'admin123', user: 'user123' };
  const quickLogin = (u: string) => { setLUsername(u); setLPassword(QUICK[u] ?? ''); setLError(''); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #5b6af7, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #5b6af7, transparent)' }} />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4 shadow-2xl" style={{ background: 'linear-gradient(135deg, #5b6af7, #7c3aed)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="2" fill="white" opacity="0.95" />
              <rect x="13" y="3" width="8" height="8" rx="2" fill="white" opacity="0.65" />
              <rect x="3" y="13" width="8" height="8" rx="2" fill="white" opacity="0.65" />
              <rect x="13" y="13" width="8" height="8" rx="2" fill="white" opacity="0.35" />
            </svg>
          </div>
          <h1 className="text-white text-2xl font-bold">AppMeta</h1>
          <p className="text-slate-400 text-sm mt-1">应用发布平台</p>
        </div>

        {/* 卡片 */}
        <div className="bg-white/8 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* 切换 Tab */}
          <div className="flex bg-white/8 rounded-xl p-1 mb-6">
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-white/15 text-white shadow'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {m === 'login' ? '登 录' : '注 册'}
              </button>
            ))}
          </div>

          {/* ── 登录表单 ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300">用户名</label>
                <InputRow icon={<IconUser />} type="text" value={lUsername}
                  onChange={v => { setLUsername(v); setLError(''); }}
                  placeholder="请输入用户名" autoComplete="username" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-slate-300">密码</label>
                <InputRow icon={<IconLock />} type="password" value={lPassword}
                  onChange={v => { setLPassword(v); setLError(''); }}
                  placeholder="请输入密码" autoComplete="current-password"
                  showToggle showPwd={lShowPwd} onToggle={() => setLShowPwd(v => !v)} />
              </div>

              {lError && <ErrorBanner msg={lError} />}

              <SubmitButton loading={lLoading} label="登 录" loadingLabel="登录中…" />
            </form>
          )}

          {/* ── 注册表单 ── */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* 用户名（必填） */}
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300">用户名 <span className="text-indigo-400">*</span></label>
                <InputRow icon={<IconUser />} type="text" value={rUsername}
                  onChange={v => { setRUsername(v); setRError(''); }}
                  placeholder="3~32 个字符，登录时使用" autoComplete="username" />
              </div>

              {/* 昵称（可选） */}
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300">
                  昵称 <span className="text-slate-500 text-xs">（选填，默认同用户名）</span>
                </label>
                <InputRow icon={<IconTag />} type="text" value={rDisplayName}
                  onChange={v => { setRDisplayName(v); setRError(''); }}
                  placeholder="展示给其他用户的名称" autoComplete="nickname" />
              </div>

              {/* 密码（必填） */}
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300">密码 <span className="text-indigo-400">*</span></label>
                <InputRow icon={<IconLock />} type="password" value={rPassword}
                  onChange={v => { setRPassword(v); setRError(''); }}
                  placeholder="至少 6 个字符" autoComplete="new-password"
                  showToggle showPwd={rShowPwd} onToggle={() => setRShowPwd(v => !v)} />
              </div>

              {/* 确认密码（必填） */}
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300">确认密码 <span className="text-indigo-400">*</span></label>
                <InputRow icon={<IconLock />} type="password" value={rConfirm}
                  onChange={v => { setRConfirm(v); setRError(''); }}
                  placeholder="再次输入密码" autoComplete="new-password"
                  showToggle showPwd={rShowConfirm} onToggle={() => setRShowConfirm(v => !v)} />
              </div>

              {/* 邮箱（可选） */}
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300">
                  邮箱 <span className="text-slate-500 text-xs">（选填）</span>
                </label>
                <InputRow icon={<IconMail />} type="email" value={rEmail}
                  onChange={v => { setREmail(v); setRError(''); }}
                  placeholder="example@domain.com" autoComplete="email" />
              </div>

              {/* 手机号（可选） */}
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300">
                  手机号 <span className="text-slate-500 text-xs">（选填）</span>
                </label>
                <InputRow icon={<IconPhone />} type="tel" value={rPhone}
                  onChange={v => { setRPhone(v); setRError(''); }}
                  placeholder="1xx xxxx xxxx" autoComplete="tel" />
              </div>

              {rError && <ErrorBanner msg={rError} />}

              <SubmitButton loading={rLoading} label="立即注册" loadingLabel="注册中…" />

              <p className="text-xs text-slate-500 text-center pt-1">
                注册即代表同意平台使用条款
              </p>
            </form>
          )}

          {/* 演示账号（仅登录模式显示） */}
          {mode === 'login' && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-slate-500 mb-3 text-center">演示账号快速登录</p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => quickLogin('admin')}
                  className="flex flex-col items-center gap-1 px-4 py-3 bg-white/6 hover:bg-white/12 border border-white/10 hover:border-indigo-400/40 rounded-xl transition-all"
                >
                  <span className="text-lg">👑</span>
                  <span className="text-xs font-medium text-white">管理员</span>
                  <span className="text-xs text-slate-500">admin / admin123</span>
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('user')}
                  className="flex flex-col items-center gap-1 px-4 py-3 bg-white/6 hover:bg-white/12 border border-white/10 hover:border-indigo-400/40 rounded-xl transition-all"
                >
                  <span className="text-lg">👤</span>
                  <span className="text-xs font-medium text-white">普通用户</span>
                  <span className="text-xs text-slate-500">user / user123</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          AppMeta · 应用发布平台 · 版本 1.0
        </p>
      </div>
    </div>
  );
}
