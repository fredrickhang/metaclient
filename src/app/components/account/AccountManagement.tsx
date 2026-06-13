import React, { useState, useEffect } from 'react';
import { fetchAccount, updateAccount, changePassword } from '../../api/client';

function InputField({
  label, type = 'text', value, onChange, placeholder, hint, error,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
          error ? 'border-red-400' : 'border-border'
        }`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
      <p className="font-semibold text-foreground border-b border-border pb-4">{title}</p>
      {children}
    </div>
  );
}

export function AccountManagement() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [createdAt, setCreatedAt] = useState<Date | null>(null);
  const [savedBasic, setSavedBasic] = useState(false);
  const [basicErrors, setBasicErrors] = useState<Record<string, string>>({});
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdErrors, setPwdErrors] = useState<Record<string, string>>({});
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    fetchAccount()
      .then(acc => {
        setDisplayName(acc.displayName ?? '');
        setEmail(acc.email ?? '');
        setPhone(acc.phone ?? '');
        setCreatedAt(acc.createdAt ? new Date(acc.createdAt) : null);
      })
      .catch(e => console.log('Load account error:', e));
  }, []);

  const handleSaveBasic = async () => {
    const errs: Record<string, string> = {};
    if (displayName.trim().length < 2) errs.username = '昵称至少 2 个字符';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = '请输入有效的邮箱地址';
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) errs.phone = '请输入有效的手机号';
    setBasicErrors(errs);
    if (Object.keys(errs).length === 0) {
      try {
        await updateAccount({ displayName, email, phone });
        setSavedBasic(true);
        setTimeout(() => setSavedBasic(false), 2500);
      } catch (e: any) {
        setApiError(e.message);
      }
    }
  };

  const handleChangePwd = async () => {
    const errs: Record<string, string> = {};
    if (!currentPwd) errs.current = '请输入当前密码';
    if (!newPwd || newPwd.length < 8) errs.new = '新密码至少 8 位';
    if (newPwd !== confirmPwd) errs.confirm = '两次输入的密码不一致';
    setPwdErrors(errs);
    if (Object.keys(errs).length === 0) {
      try {
        await changePassword(currentPwd, newPwd);
        setPwdSuccess(true);
        setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
        setTimeout(() => setPwdSuccess(false), 3000);
      } catch (e: any) {
        setPwdErrors({ current: e.message });
      }
    }
  };

  return (
    <div className="p-6 space-y-5 overflow-y-auto max-w-2xl">
      <div>
        <p className="text-foreground font-semibold">账户管理</p>
        <p className="text-sm text-muted-foreground mt-0.5">管理您的个人信息和安全设置</p>
      </div>

      {/* 账户概览 */}
      <div className="bg-white rounded-2xl border border-border p-5 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-sm">
          {displayName.slice(0, 1) || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">{displayName || '—'}</p>
          <p className="text-sm text-muted-foreground">{email || '—'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            注册时间：{createdAt ? createdAt.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
          </p>
        </div>
      </div>

      {/* 基础信息 */}
      <Section title="基本信息">
        <InputField
          label="昵称"
          value={displayName}
          onChange={setDisplayName}
          placeholder="请输入昵称"
          hint="昵称长度 2–20 个字符"
          error={basicErrors.username}
        />
        <InputField
          label="登录邮箱"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="请输入邮箱地址"
          error={basicErrors.email}
        />
        <InputField
          label="手机号码"
          type="tel"
          value={phone}
          onChange={setPhone}
          placeholder="请输入手机号码（选填）"
          hint="手机号仅用于账户安全验证"
          error={basicErrors.phone}
        />
        <div className="flex items-center justify-between pt-2">
          {savedBasic && <p className="text-sm text-green-600">✓ 信息已保存</p>}
          {!savedBasic && <span />}
          <button
            onClick={handleSaveBasic}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            保存修改
          </button>
        </div>
      </Section>

      {/* 修改密码 */}
      <Section title="修改密码">
        <InputField
          label="当前密码"
          type="password"
          value={currentPwd}
          onChange={setCurrentPwd}
          placeholder="请输入当前密码"
          error={pwdErrors.current}
        />
        <InputField
          label="新密码"
          type="password"
          value={newPwd}
          onChange={setNewPwd}
          placeholder="至少 8 位，包含字母和数字"
          hint="密码长度至少 8 位"
          error={pwdErrors.new}
        />
        <InputField
          label="确认新密码"
          type="password"
          value={confirmPwd}
          onChange={setConfirmPwd}
          placeholder="再次输入新密码"
          error={pwdErrors.confirm}
        />

        {/* 密码强度 */}
        {newPwd && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">密码强度</p>
            <div className="flex gap-1.5">
              {[
                newPwd.length >= 8,
                /[A-Z]/.test(newPwd),
                /[0-9]/.test(newPwd),
                /[^A-Za-z0-9]/.test(newPwd),
              ].map((met, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${met ? 'bg-green-400' : 'bg-muted'}`} />
              ))}
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className={newPwd.length >= 8 ? 'text-green-500' : ''}>8位以上</span>
              <span className={/[A-Z]/.test(newPwd) ? 'text-green-500' : ''}>大写字母</span>
              <span className={/[0-9]/.test(newPwd) ? 'text-green-500' : ''}>数字</span>
              <span className={/[^A-Za-z0-9]/.test(newPwd) ? 'text-green-500' : ''}>特殊字符</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          {pwdSuccess && <p className="text-sm text-green-600">✓ 密码修改成功</p>}
          {!pwdSuccess && <span />}
          <button
            onClick={handleChangePwd}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            确认修改
          </button>
        </div>
      </Section>

    </div>
  );
}
