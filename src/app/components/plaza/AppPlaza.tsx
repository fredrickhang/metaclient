import React, { useState, useMemo, useRef } from 'react';
import type { AppMeta } from '../../types/appMeta';
import { CATEGORY_LIST, SCENE_CHANNELS } from '../../data/mockApps';

const CATEGORY_ICONS: Record<string, string> = {
  '视频处理': '🎬', '图像生成': '🎨', '图像处理': '🖼️',
  '文本处理': '📝', '语音处理': '🎙️', '数据分析': '📊', '其他': '⚡',
};

function AppCard({ app, onRun }: { app: AppMeta; onRun: () => void }) {
  const primary = app.layout.primaryColor || '#5b6af7';
  const cover = app.layout.coverImage;

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5 transition-all duration-200 flex flex-col group cursor-pointer border border-border"
      onClick={onRun}
    >
      {/* 封面 — 占卡片主体，约75%高度 */}
      <div className="relative overflow-hidden flex-shrink-0" style={{ paddingBottom: '80%' }}>
        <div className="absolute inset-0">
          {cover ? (
            <img
              src={cover}
              alt={app.name}
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${primary}15, ${primary}30)` }}
            >
              <span className="text-6xl opacity-80">{CATEGORY_ICONS[app.category] || '⚡'}</span>
            </div>
          )}
        </div>
      </div>

      {/* 底部信息条 — 极简 */}
      <div className="px-3 py-3 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{app.name}</p>
          {app.estimatedCredits && (
            <p className="text-xs text-amber-500 mt-0.5">💎 预估 {app.estimatedCredits} 积分/次</p>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onRun(); }}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90 transition-opacity"
          style={{ background: primary }}
        >
          使用
        </button>
      </div>
    </div>
  );
}

interface AppPlazaProps {
  apps: AppMeta[];
  onRunApp: (id: string) => void;
  onEditApp: (id: string) => void;
  onCreateApp: () => void;
}

// 场景频道列表（加上全部）
const ALL_CHANNELS = [
  { id: 'all', label: '全部应用', icon: '🌐' },
  ...SCENE_CHANNELS,
];

export function AppPlaza({ apps, onRunApp }: AppPlazaProps) {
  const [activeChannel, setActiveChannel] = useState('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');

  // 按场景频道过滤
  const channelFiltered = useMemo(() => {
    if (activeChannel === 'all') return apps;
    const ch = SCENE_CHANNELS.find(c => c.id === activeChannel);
    if (!ch) return apps;
    return ch.appIds.map(id => apps.find(a => a.id === id)).filter(Boolean) as AppMeta[];
  }, [apps, activeChannel]);

  // 再按搜索和分类过滤
  const filtered = useMemo(() => channelFiltered.filter(app => {
    const matchCat = category === '全部' || app.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q || app.name.includes(q) || app.description.includes(q) || app.tags.some(t => t.includes(q));
    return matchCat && matchSearch;
  }), [channelFiltered, category, search]);

  const navRef = useRef<HTMLDivElement>(null);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 顶部频道导航栏 */}
      <div className="bg-white border-b border-border flex-shrink-0">
        {/* 频道按钮行 */}
        <div ref={navRef} className="flex items-center gap-1 px-4 pt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {ALL_CHANNELS.map(ch => {
            const active = activeChannel === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => { setActiveChannel(ch.id); setCategory('全部'); setSearch(''); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                  active
                    ? 'text-primary border-primary bg-primary/5'
                    : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted'
                }`}
              >
                <span>{ch.icon}</span>
                <span>{ch.label}</span>
              </button>
            );
          })}
        </div>

        {/* 搜索 + 分类过滤行 */}
        <div className="flex items-center gap-3 px-6 py-3 flex-wrap">
          <div className="relative min-w-48 flex-1 max-w-xs">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="搜索应用…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORY_LIST.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  category === cat
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-muted border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
                }`}
              >
                {cat !== '全部' && CATEGORY_ICONS[cat] ? `${CATEGORY_ICONS[cat]} ` : ''}{cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 应用网格 */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(app => (
              <AppCard key={app.id} app={app} onRun={() => onRunApp(app.id)} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-muted-foreground">未找到匹配的应用</p>
          </div>
        )}
      </div>
    </div>
  );
}
