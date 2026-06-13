import React, { useState, useEffect } from 'react';

type RecordStatus = 'running' | 'completed' | 'failed';

interface GenerationRecord {
  id: string;
  appName: string;
  appCategory: string;
  status: RecordStatus;
  createdAt: Date;
  durationMs?: number;
  creditsUsed?: number;
  result?: string;
  expiresAt?: Date;
}

const MOCK_RECORDS: GenerationRecord[] = [
  {
    id: 'r001', appName: '智能文章摘要', appCategory: '文本处理', status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 30), durationMs: 3240, creditsUsed: 5,
    result: '这篇文章主要讲述了人工智能在医疗领域的最新进展，包括：1. 影像识别准确率达到98.7%；2. 新药研发周期缩短40%；3. 个性化治疗方案的推广应用。核心观点是AI将在未来10年内彻底改变医疗行业的运作模式。',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 20),
  },
  {
    id: 'r002', appName: 'AI 图像增强', appCategory: '图像处理', status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), durationMs: 8900, creditsUsed: 12,
    result: '图像已成功增强，分辨率从720p提升至4K，噪点降低85%，锐度提升60%。',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 22),
  },
  {
    id: 'r003', appName: '视频字幕生成', appCategory: '视频处理', status: 'failed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), durationMs: 12000, creditsUsed: 0,
    result: '错误：视频格式不支持，请上传 MP4/MOV/AVI 格式文件。',
  },
  {
    id: 'r004', appName: '代码注释生成', appCategory: '文本处理', status: 'running',
    createdAt: new Date(Date.now() - 1000 * 60 * 2),
  },
  {
    id: 'r005', appName: '数据可视化分析', appCategory: '数据分析', status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), durationMs: 5600, creditsUsed: 8,
    result: '分析完成：检测到3个数据异常点，销售趋势呈上升态势（月均增长12.3%），建议重点关注Q3的库存波动问题。',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 19),
  },
  {
    id: 'r006', appName: '语音转文字', appCategory: '语音处理', status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8), durationMs: 4100, creditsUsed: 6,
    result: '转录完成，共识别1,240个词，准确率约97.2%。',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 16),
  },
  {
    id: 'r007', appName: 'AI 图像增强', appCategory: '图像处理', status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25),
    expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 1),
    durationMs: 7200, creditsUsed: 12,
    result: '（结果已过期）',
  },
  {
    id: 'r008', appName: '智能文章摘要', appCategory: '文本处理', status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26),
    expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    durationMs: 2800, creditsUsed: 5,
    result: '（结果已过期）',
  },
];

const PAGE_SIZE = 5;

function formatDate(d: Date) {
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms?: number) {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function isExpired(r: GenerationRecord) {
  return r.status === 'completed' && r.expiresAt && r.expiresAt < new Date();
}

function StatusBadge({ status, expired }: { status: RecordStatus; expired: boolean }) {
  if (expired) return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" /> 已过期
    </span>
  );
  const map = {
    running: { cls: 'bg-blue-50 text-blue-600 border-blue-200', dot: 'bg-blue-500 animate-pulse', label: '生成中' },
    completed: { cls: 'bg-green-50 text-green-600 border-green-200', dot: 'bg-green-500', label: '已完成' },
    failed: { cls: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500', label: '失败' },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${s.dot}`} /> {s.label}
    </span>
  );
}

function ResultPreviewModal({ record, onClose }: { record: GenerationRecord; onClose: () => void }) {
  const expired = isExpired(record);
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-foreground">{record.appName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(record.createdAt)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">✕</button>
        </div>
        {expired ? (
          <div className="bg-gray-50 rounded-xl p-5 text-center text-muted-foreground text-sm">
            <p className="text-2xl mb-2">🔒</p>
            <p>生成结果已超过 24 小时，已自动清除</p>
          </div>
        ) : record.status === 'running' ? (
          <div className="bg-blue-50 rounded-xl p-5 text-center text-blue-600 text-sm">
            <p className="text-2xl mb-2 animate-spin inline-block">⚙️</p>
            <p className="mt-2">正在生成中，请稍后查看…</p>
          </div>
        ) : record.status === 'failed' ? (
          <div className="bg-red-50 rounded-xl p-5 text-sm text-red-700">
            <p className="font-medium mb-1">生成失败</p>
            <p>{record.result}</p>
          </div>
        ) : (
          <div className="bg-muted rounded-xl p-4 text-sm text-foreground leading-relaxed">
            {record.result}
          </div>
        )}
        {record.expiresAt && !expired && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            结果将于 {formatDate(record.expiresAt)} 后过期
          </p>
        )}
      </div>
    </div>
  );
}

export function GenerationRecords() {
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<GenerationRecord | null>(null);
  const [records, setRecords] = useState<GenerationRecord[]>(MOCK_RECORDS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../../api/client').then(({ fetchRecords }) =>
      fetchRecords()
        .then(data => setRecords(data.map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          expiresAt: r.expiresAt ? new Date(r.expiresAt) : undefined,
        }))))
        .catch(e => console.log('Load records error:', e))
        .finally(() => setLoading(false))
    );
  }, []);

  const totalPages = Math.ceil(records.length / PAGE_SIZE);
  const pageRecords = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      <div>
        <p className="text-foreground font-semibold">生成记录</p>
        <p className="text-sm text-muted-foreground mt-0.5">查看所有应用调用记录，生成结果保留 24 小时</p>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {loading && <div className="py-12 text-center text-sm text-muted-foreground">加载中…</div>}
        {!loading && <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3.5 text-xs font-medium text-muted-foreground">应用名称</th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-muted-foreground">状态</th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-muted-foreground">生成时间</th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-muted-foreground">耗时</th>
                <th className="text-left px-4 py-3.5 text-xs font-medium text-muted-foreground">消耗积分</th>
                <th className="text-right px-5 py-3.5 text-xs font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {pageRecords.map((r, i) => {
                const expired = isExpired(r);
                return (
                  <tr key={(r as any).runId ?? r.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'} hover:bg-muted/30 transition-colors`}>
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-foreground font-medium">{r.appName}</p>
                        <p className="text-xs text-muted-foreground">{r.appCategory}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={r.status} expired={expired} />
                    </td>
                    <td className="px-4 py-4 text-muted-foreground tabular-nums">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-4 text-muted-foreground tabular-nums">{formatDuration(r.durationMs)}</td>
                    <td className="px-4 py-4">
                      {r.creditsUsed !== undefined && r.creditsUsed > 0
                        ? <span className="text-amber-600 font-medium">{r.creditsUsed} 积分</span>
                        : r.status === 'failed' ? <span className="text-muted-foreground">-</span>
                        : <span className="text-muted-foreground">-</span>
                      }
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setPreview(r)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
                      >
                        预览结果
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>}

        {/* 分页 */}
        {!loading && <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">共 {records.length} 条记录</p>
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
        </div>}
      </div>

      {preview && <ResultPreviewModal record={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
