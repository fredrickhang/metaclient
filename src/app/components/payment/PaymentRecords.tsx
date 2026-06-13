import React, { useState } from 'react';

type PaymentType = 'membership' | 'credits';
type PaymentStatus = 'paid' | 'pending' | 'refunded';

interface PaymentRecord {
  id: string;
  orderId: string;
  type: PaymentType;
  description: string;
  amount: number;
  status: PaymentStatus;
  createdAt: Date;
}

const MOCK_PAYMENTS: PaymentRecord[] = [
  { id: 'p001', orderId: 'ORD20260611001', type: 'membership', description: '专业会员 · 月订阅', amount: 69, status: 'paid', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) },
  { id: 'p002', orderId: 'ORD20260601002', type: 'credits', description: '积分充值 · 3000积分套餐', amount: 200, status: 'paid', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) },
  { id: 'p003', orderId: 'ORD20260511003', type: 'membership', description: '专业会员 · 月订阅', amount: 69, status: 'paid', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 31) },
  { id: 'p004', orderId: 'ORD20260508004', type: 'credits', description: '积分充值 · 1000积分套餐', amount: 80, status: 'refunded', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 34) },
  { id: 'p005', orderId: 'ORD20260411005', type: 'membership', description: '基础会员 · 月订阅', amount: 29, status: 'paid', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 61) },
  { id: 'p006', orderId: 'ORD20260405006', type: 'credits', description: '积分充值 · 500积分套餐', amount: 45, status: 'paid', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 67) },
  { id: 'p007', orderId: 'ORD20260311007', type: 'membership', description: '基础会员 · 月订阅', amount: 29, status: 'paid', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 92) },
  { id: 'p008', orderId: 'ORD20260220008', type: 'credits', description: '积分充值 · 100积分套餐', amount: 10, status: 'paid', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 111) },
  { id: 'p009', orderId: 'ORD20260211009', type: 'membership', description: '基础会员 · 月订阅', amount: 29, status: 'paid', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120) },
  { id: 'p010', orderId: 'ORD20260115010', type: 'credits', description: '积分充值 · 3000积分套餐', amount: 200, status: 'paid', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 147) },
  { id: 'p011', orderId: 'ORD20260111011', type: 'membership', description: '高级会员 · 月订阅', amount: 129, status: 'pending', createdAt: new Date(Date.now() - 1000 * 60 * 30) },
];

const PAGE_SIZE = 6;

function formatDate(d: Date) {
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function TypeBadge({ type }: { type: PaymentType }) {
  return type === 'membership'
    ? <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">★ 会员订阅</span>
    : <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">💎 积分充值</span>;
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const map = {
    paid: 'bg-green-50 text-green-600 border-green-200 已支付',
    pending: 'bg-yellow-50 text-yellow-600 border-yellow-200 待支付',
    refunded: 'bg-gray-50 text-gray-500 border-gray-200 已退款',
  };
  const [cls, label] = map[status].split(' ').reduce<[string, string]>(
    (acc, cur, i) => i === 0 ? [cur, acc[1]] : i < 3 ? [`${acc[0]} ${cur}`, acc[1]] : [acc[0], cur],
    ['', '']
  );
  const parts = map[status].split(' ');
  const text = parts[parts.length - 1];
  const clsParts = parts.slice(0, parts.length - 1).join(' ');
  return <span className={`text-xs px-2.5 py-1 rounded-full border ${clsParts}`}>{text}</span>;
}

export function PaymentRecords() {
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<'all' | PaymentType>('all');
  const [payments, setPayments] = useState<PaymentRecord[]>(MOCK_PAYMENTS);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    import('../../api/client').then(({ fetchPayments }) =>
      fetchPayments()
        .then(data => setPayments(data.map((p: any) => ({ ...p, createdAt: new Date(p.createdAt) }))))
        .catch(e => console.log('Load payments error:', e))
        .finally(() => setLoading(false))
    );
  }, []);

  const filtered = payments.filter(p => filterType === 'all' || p.type === filterType);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRecords = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-foreground font-semibold">支付记录</p>
          <p className="text-sm text-muted-foreground mt-0.5">查看所有会员订阅和积分充值的订单</p>
        </div>
        <div className="bg-white rounded-xl border border-border px-4 py-3 text-sm">
          <span className="text-muted-foreground">累计消费 </span>
          <span className="font-semibold text-foreground tabular-nums">¥{totalPaid.toLocaleString()}</span>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: '全部' },
          { key: 'membership', label: '会员订阅' },
          { key: 'credits', label: '积分充值' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => { setFilterType(f.key as any); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm transition-colors ${
              filterType === f.key ? 'bg-primary text-white shadow-sm' : 'bg-white border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground">订单号</th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-muted-foreground">类型</th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-muted-foreground">说明</th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-muted-foreground">金额</th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-muted-foreground">状态</th>
                <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {pageRecords.map((r, i) => (
                <tr key={r.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'} hover:bg-muted/30 transition-colors`}>
                  <td className="px-5 py-4">
                    <code className="text-xs text-muted-foreground font-mono">{r.orderId}</code>
                  </td>
                  <td className="px-4 py-4"><TypeBadge type={r.type} /></td>
                  <td className="px-4 py-4 text-foreground">{r.description}</td>
                  <td className="px-4 py-4">
                    <span className={`font-semibold tabular-nums ${r.status === 'refunded' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      ¥{r.amount}
                    </span>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-4 text-muted-foreground tabular-nums text-xs">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
              {pageRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-muted-foreground text-sm">暂无支付记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">共 {filtered.length} 条记录</p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground disabled:opacity-40 hover:bg-white transition-colors text-xs"
            >‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs border transition-colors ${
                  p === page ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:bg-white'
                }`}
              >{p}</button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground disabled:opacity-40 hover:bg-white transition-colors text-xs"
            >›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
