import React, { useState } from 'react';

const MEMBERSHIP_TIERS = [
  {
    id: 'basic', name: '基础会员', price: 29, monthlyCredits: 200,
    color: '#6b7280', gradient: 'from-gray-400 to-gray-500',
    features: ['每月赠送 200 积分', '最高并发 2 个任务', '标准处理速度', '邮件支持'],
  },
  {
    id: 'pro', name: '专业会员', price: 69, monthlyCredits: 600,
    color: '#5b6af7', gradient: 'from-indigo-400 to-blue-500',
    features: ['每月赠送 600 积分', '最高并发 5 个任务', '优先处理速度', '在线客服支持'],
    popular: true,
  },
  {
    id: 'advanced', name: '高级会员', price: 129, monthlyCredits: 1500,
    color: '#8b5cf6', gradient: 'from-violet-400 to-purple-600',
    features: ['每月赠送 1500 积分', '最高并发 10 个任务', '极速处理通道', '专属客服支持'],
  },
  {
    id: 'enterprise', name: '旗舰会员', price: 299, monthlyCredits: 5000,
    color: '#f59e0b', gradient: 'from-amber-400 to-orange-500',
    features: ['每月赠送 5000 积分', '无限并发任务', '专属 GPU 资源', '7×24 小时支持'],
  },
];

const CREDIT_PACKAGES = [
  { id: 'c100', credits: 100, price: 10, bonus: 0 },
  { id: 'c500', credits: 500, price: 45, bonus: 50 },
  { id: 'c1000', credits: 1000, price: 80, bonus: 150 },
  { id: 'c3000', credits: 3000, price: 200, bonus: 600, popular: true },
  { id: 'c10000', credits: 10000, price: 600, bonus: 2500 },
];

// Mock user state
const MOCK_USER = {
  credits: 348,
  membershipTier: 'pro' as string,
  membershipExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18),
};

function formatDate(d: Date) {
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function Subscription() {
  const [tab, setTab] = useState<'membership' | 'credits'>('membership');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [paying, setPaying] = useState(false);
  const [subInfo, setSubInfo] = useState({ credits: MOCK_USER.credits, membershipTier: MOCK_USER.membershipTier, membershipExpiry: MOCK_USER.membershipExpiry as Date | null });

  React.useEffect(() => {
    import('../../api/client').then(({ fetchSubscription }) =>
      fetchSubscription()
        .then(data => setSubInfo({ credits: data.credits, membershipTier: data.membershipTier ?? '', membershipExpiry: data.membershipExpiry ? new Date(data.membershipExpiry) : null }))
        .catch(e => console.log('Load subscription error:', e))
    );
  }, []);

  const currentTier = MEMBERSHIP_TIERS.find(t => t.id === subInfo.membershipTier);

  const handlePay = async (tierId?: string, pkgId?: string) => {
    const { createPayment, fetchSubscription } = await import('../../api/client');
    setPaying(true);
    try {
      if (tierId) {
        const tier = MEMBERSHIP_TIERS.find(t => t.id === tierId);
        if (tier) await createPayment({ type: 'membership', description: `${tier.name} · 月订阅`, amount: tier.price, tierId: tier.id });
      } else if (pkgId) {
        const pkg = CREDIT_PACKAGES.find(p => p.id === pkgId);
        if (pkg) await createPayment({ type: 'credits', description: `积分充值 · ${pkg.credits + pkg.bonus}积分`, amount: pkg.price, creditsToAdd: pkg.credits + pkg.bonus });
      }
      const updated = await fetchSubscription();
      setSubInfo({ credits: updated.credits, membershipTier: updated.membershipTier ?? '', membershipExpiry: updated.membershipExpiry ? new Date(updated.membershipExpiry) : null });
      setPaid(true);
      setTimeout(() => setPaid(false), 3000);
    } catch (e) {
      console.log('Pay error:', e);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      {/* 当前账户状态 */}
      <div className="bg-white rounded-2xl border border-border p-5 flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl"
            style={{ background: `linear-gradient(135deg, ${currentTier?.color}, ${currentTier?.color}99)` }}>
            ★
          </div>
          <div>
            <p className="text-xs text-muted-foreground">当前会员等级</p>
            <p className="font-semibold text-foreground">{currentTier?.name || '普通用户'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">到期时间：{subInfo.membershipExpiry ? formatDate(subInfo.membershipExpiry) : '—'}</p>
          </div>
        </div>
        <div className="w-px h-10 bg-border hidden sm:block" />
        <div>
          <p className="text-xs text-muted-foreground">积分余额</p>
          <p className="font-semibold text-amber-600 text-xl tabular-nums">{subInfo.credits.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">积分</p>
        </div>
        {paid && (
          <div className="ml-auto text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
            ✓ 支付成功！
          </div>
        )}
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        {[
          { key: 'membership', label: '会员订阅' },
          { key: 'credits', label: '积分充值' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'membership' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {MEMBERSHIP_TIERS.map(tier => {
              const isCurrent = tier.id === subInfo.membershipTier;
              const isSelected = selectedTier === tier.id;
              return (
                <div
                  key={tier.id}
                  onClick={() => !isCurrent && setSelectedTier(isSelected ? null : tier.id)}
                  className={`relative bg-white rounded-2xl border-2 p-5 flex flex-col cursor-pointer transition-all hover:shadow-md ${
                    isCurrent ? 'border-primary/40 bg-primary/3' : isSelected ? 'border-primary shadow-md' : 'border-border hover:-translate-y-0.5'
                  }`}
                  style={isCurrent ? { borderColor: `${currentTier?.color}60` } : {}}
                >
                  {tier.popular && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-3 py-1 rounded-full shadow-sm">推荐</div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs px-3 py-1 rounded-full shadow-sm" style={{ background: tier.color }}>当前套餐</div>
                  )}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center text-white mb-4`}>★</div>
                  <p className="font-semibold text-foreground">{tier.name}</p>
                  <div className="mt-2 mb-4">
                    <span className="text-2xl font-bold text-foreground tabular-nums">¥{tier.price}</span>
                    <span className="text-muted-foreground text-sm"> / 月</span>
                  </div>
                  <ul className="space-y-2 flex-1">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-green-500 mt-0.5">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={e => { e.stopPropagation(); if (!isCurrent) { setSelectedTier(tier.id); handlePay(tier.id, undefined); } }}
                    disabled={isCurrent || paying}
                    className={`mt-5 w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isCurrent
                        ? 'bg-muted text-muted-foreground cursor-default'
                        : 'text-white hover:opacity-90 shadow-sm'
                    }`}
                    style={!isCurrent ? { background: tier.color } : {}}
                  >
                    {isCurrent ? '当前套餐' : '立即订阅'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'credits' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {CREDIT_PACKAGES.map(pkg => {
              const isSelected = selectedPackage === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(isSelected ? null : pkg.id)}
                  className={`relative bg-white rounded-2xl border-2 p-5 flex flex-col cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'border-amber-400 shadow-md' : 'border-border hover:-translate-y-0.5'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs px-3 py-1 rounded-full shadow-sm">最超值</div>
                  )}
                  <div className="text-2xl mb-2">💎</div>
                  <p className="font-semibold text-foreground tabular-nums">{pkg.credits.toLocaleString()} 积分</p>
                  {pkg.bonus > 0 && (
                    <p className="text-xs text-amber-600 mt-0.5">+ 赠送 {pkg.bonus} 积分</p>
                  )}
                  <p className="text-xl font-bold text-foreground mt-3 tabular-nums">¥{pkg.price}</p>
                  <p className="text-xs text-muted-foreground">
                    ≈ ¥{(pkg.price / (pkg.credits + pkg.bonus) * 100).toFixed(2)} / 百积分
                  </p>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedPackage(pkg.id); handlePay(undefined, pkg.id); }}
                    disabled={paying}
                    className={`mt-4 w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isSelected ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-muted text-foreground hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    立即购买
                  </button>
                </div>
              );
            })}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
            <p className="font-medium mb-1">积分使用说明</p>
            <p className="text-xs leading-relaxed">积分购买后永久有效，不受会员到期影响。每次调用应用消耗积分数量因应用类型而异，通常为 1–20 积分/次。会员用户每月自动获赠对应等级积分。</p>
          </div>
        </>
      )}
    </div>
  );
}
