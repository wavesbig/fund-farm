'use client';

import { useEffect, useState, useRef } from 'react';
import { isArray, isObject } from 'lodash';
import { ChevronRight, Settings2 } from 'lucide-react';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { fetchMarketIndices } from '@/app/api/fund';
import { cn } from '@/lib/utils';
import MarketSettingModal from './MarketSettingModal';
import { storageStore } from '../stores';

export interface MarketIndexItem {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MiniTrendLineProps {
  changePercent: number;
  code?: string;
  className?: string;
}

/** 迷你走势：只展示当日分时数据，不支持时不展示 */
function MiniTrendLine({ changePercent, code, className }: MiniTrendLineProps) {
  const width = 80;
  const height = 28;
  const pad = 3;
  const innerH = height - 2 * pad;
  const innerW = width - 2 * pad;
  const isDown = changePercent <= 0;

  // 当日分时真实走势 path
  const [realPath, setRealPath] = useState<string | null>(null);

  useEffect(() => {
    if (!code || typeof window === 'undefined' || typeof document === 'undefined') {
      setRealPath(null);
      return;
    }

    let cancelled = false;
    const varName = `min_data_${code}`;
    const url = `https://web.ifzq.gtimg.cn/appstock/app/minute/query?_var=${varName}&code=${code}&_=${Date.now()}`;

    const script = document.createElement('script');
    script.src = url;
    script.async = true;

    let done = false;
    let timer: NodeJS.Timeout | null = null;
    const cleanup = () => {
      done = true;
      if (timer) clearTimeout(timer);
      if (document.body && document.body.contains(script)) {
        document.body.removeChild(script);
      }
      try {
        if ((window as any)[varName]) {
          delete (window as any)[varName];
        }
      } catch {
        // ignore
      }
    };

    timer = setTimeout(() => {
      if (done) return;
      cleanup();
      if (!cancelled) {
        setRealPath(null);
      }
    }, 10000);

    script.onload = () => {
      if (cancelled || done) {
        cleanup();
        return;
      }
      try {
        const raw = (window as any)[varName];
        const series =
          raw && raw.data && raw.data[code] && raw.data[code].data && isArray(raw.data[code].data.data)
            ? raw.data[code].data.data
            : null;
        if (!series || !series.length) {
          setRealPath(null);
          return;
        }

        // 解析 "HHMM price volume amount" 行，只关心 price
        const points = series
          .map((row: any) => {
            const parts = String(row).split(' ');
            const price = parseFloat(parts[1]);
            if (!Number.isFinite(price)) return null;
            return { price };
          })
          .filter(Boolean) as { price: number }[];

        if (!points.length) {
          setRealPath(null);
          return;
        }

        const minP = points.reduce((m, p) => (p.price < m ? p.price : m), points[0].price);
        const maxP = points.reduce((m, p) => (p.price > m ? p.price : m), points[0].price);
        const span = maxP - minP || 1;

        const n = points.length;
        const pathPoints = points.map((p, idx) => {
          const t = n > 1 ? idx / (n - 1) : 0;
          const x = pad + t * innerW;
          const norm = (p.price - minP) / span;
          const y = pad + (1 - norm) * innerH;
          return [x, Math.max(pad, Math.min(height - pad, y))];
        });

        const d = pathPoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
        setRealPath(d);
      } finally {
        cleanup();
      }
    };

    script.onerror = () => {
      if (!cancelled) {
        setRealPath(null);
      }
      cleanup();
    };

    document.body.appendChild(script);

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [code, height, innerH, innerW, pad]);

  if (!realPath) {
    return <svg width={width} height={height} className={cn('overflow-visible', className)} aria-hidden />;
  }
  return (
    <svg width={width} height={height} className={cn('overflow-visible', className)} aria-hidden>
      <path
        d={realPath}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isDown ? 'text-[var(--success)]' : 'text-[var(--danger)]'}
      />
    </svg>
  );
}

function IndexCard({ item }: { item: MarketIndexItem }) {
  const isUp = item.change >= 0;
  const colorClass = isUp ? 'text-[var(--danger)]' : 'text-[var(--success)]';
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 flex flex-col gap-0.5 w-full">
      <div className="text-[15px] font-medium text-[var(--foreground)] truncate">{item.name}</div>
      <div className={cn('text-lg font-bold tabular-nums', colorClass)}>{item.price.toFixed(2)}</div>
      <div className={cn('text-[13px] font-semibold tabular-nums', colorClass)}>
        {(item.change >= 0 ? '+' : '') + item.change.toFixed(2)}{' '}
        {(item.changePercent >= 0 ? '+' : '') + item.changePercent.toFixed(2)}%
      </div>
      <div className="mt-0.5 flex items-center justify-center opacity-80">
        <MiniTrendLine changePercent={item.changePercent} code={item.code} />
      </div>
    </div>
  );
}

// 默认展示：上证指数、深证成指、创业板指
const DEFAULT_SELECTED_CODES = ['sh000001', 'sz399001', 'sz399006'];

export interface MarketIndexAccordionProps {
  navbarHeight?: number;
  onCustomSettingsChange?: () => void;
  refreshing?: boolean;
}

export default function MarketIndexAccordion({
  navbarHeight = 0,
  onCustomSettingsChange,
  refreshing = false
}: MarketIndexAccordionProps) {
  const isMobile = useIsMobile();
  const [indices, setIndices] = useState<MarketIndexItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openValue, setOpenValue] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [settingOpen, setSettingOpen] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const hasInitializedSelectedCodes = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const updateCssVar = (val: number) => {
      document.documentElement.style.setProperty('--market-index-height', `${val}px`);
    };

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        updateCssVar(entry.contentRect.height);
      }
    });

    ro.observe(el);
    updateCssVar(el.getBoundingClientRect().height);

    return () => {
      ro.disconnect();
      document.documentElement.style.setProperty('--market-index-height', '0px');
    };
  }, [loading, indices.length]);

  const loadIndices = () => {
    let cancelled = false;
    setLoading(true);
    fetchMarketIndices()
      .then((data: any) => {
        if (!cancelled) setIndices(isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setIndices([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    const cleanup = loadIndices();
    return cleanup;
  }, []);

  useEffect(() => {
    if (!refreshing) return;
    const cleanup = loadIndices();
    return cleanup;
  }, [refreshing]);

  // 初始化选中指数（本地偏好 > 默认集合）
  useEffect(() => {
    if (!indices.length || typeof window === 'undefined') return;
    if (hasInitializedSelectedCodes.current) return;
    try {
      const parsed = storageStore.getItem('marketIndexSelected');
      const availableCodes = new Set(indices.map((it) => it.code));
      if (parsed) {
        if (isArray(parsed)) {
          const filtered = parsed.filter((c: string) => availableCodes.has(c));
          if (filtered.length) {
            setSelectedCodes(filtered);
            hasInitializedSelectedCodes.current = true;
            return;
          }
        }
      }
      const defaults = DEFAULT_SELECTED_CODES.filter((c) => availableCodes.has(c));
      setSelectedCodes(defaults.length ? defaults : indices.map((it) => it.code).slice(0, 3));
    } catch {
      setSelectedCodes(indices.map((it) => it.code).slice(0, 3));
    }
  }, [indices]);

  // 持久化用户选择
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!selectedCodes.length) return;
    try {
      storageStore.setItem('marketIndexSelected', JSON.stringify(selectedCodes));

      const parsed = storageStore.getItem('customSettings') || {};
      if (JSON.stringify(parsed.marketIndexSelected) === JSON.stringify(selectedCodes)) {
        return;
      }

      const next =
        parsed && isObject(parsed)
          ? { ...parsed, marketIndexSelected: selectedCodes }
          : { marketIndexSelected: selectedCodes };
      storageStore.setItem('customSettings', JSON.stringify(next));
      onCustomSettingsChange?.();
    } catch {
      // ignore
    }
  }, [selectedCodes, onCustomSettingsChange]);

  const visibleIndices = selectedCodes.length
    ? (selectedCodes.map((code) => indices.find((it) => it.code === code)).filter(Boolean) as MarketIndexItem[])
    : indices;

  useEffect(() => {
    if (tickerIndex >= visibleIndices.length) {
      setTickerIndex(0);
    }
  }, [visibleIndices.length, tickerIndex]);

  useEffect(() => {
    if (!visibleIndices.length) return;
    if (openValue === 'indices') return;
    if (visibleIndices.length <= 1) return;
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % visibleIndices.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [visibleIndices.length, openValue]);

  const current = visibleIndices.length === 0 ? null : visibleIndices[openValue === 'indices' ? 0 : tickerIndex];

  const isUp = current ? current.change >= 0 : false;
  const colorClass = isUp ? 'text-[var(--danger)]' : 'text-[var(--success)]';

  const topMargin = Number(navbarHeight) || 0;
  const containerStyle = {
    marginTop: topMargin,
    position: 'relative' as const,
    zIndex: 10,
    width: isMobile ? 'calc(100% + 24px)' : '100%',
    marginLeft: isMobile ? -12 : 0
  };

  if (loading && indices.length === 0) {
    return (
      <div
        ref={rootRef}
        className="market-index-accordion-root mt-2 mb-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 flex items-center justify-between shadow-sm"
        style={containerStyle}
      >
        <span className="text-sm text-[var(--muted-foreground)]">加载大盘指数…</span>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="market-index-accordion-root mt-2 mb-2 rounded-xl border border-[var(--border)] bg-[var(--card)] market-index-accordion shadow-sm"
      style={containerStyle}
    >
      <style jsx>{`
        .market-index-ticker {
          overflow: hidden;
        }
        .market-index-ticker-item {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          animation: market-index-ticker-slide 0.35s ease-out;
        }
        @keyframes market-index-ticker-slide {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      <Accordion type="single" collapsible value={openValue} onValueChange={setOpenValue}>
        <AccordionItem value="indices" className="border-b-0">
          <div className="flex items-center justify-between py-2 px-4 hover:bg-white/[0.03] transition-colors rounded-xl">
            <AccordionTrigger
              hideChevron
              className="py-0 px-0 hover:no-underline flex-1 min-w-0"
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <div className="flex flex-1 items-center gap-3 min-w-0">
                {current ? (
                  <div className="market-index-ticker">
                    <div key={current.code || current.name} className="market-index-ticker-item">
                      <span className="text-[15px] font-medium text-[var(--foreground)] shrink-0">{current.name}</span>
                      <span className={cn('tabular-nums text-[15px] font-semibold', colorClass)}>
                        {current.price.toFixed(2)}
                      </span>
                      <span className={cn('tabular-nums text-[15px]', colorClass)}>
                        {(current.change >= 0 ? '+' : '') + current.change.toFixed(2)}
                      </span>
                      <span className={cn('tabular-nums text-[15px]', colorClass)}>
                        {(current.changePercent >= 0 ? '+' : '') + current.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-[var(--muted-foreground)]">暂无指数数据</span>
                )}
              </div>
            </AccordionTrigger>
            <div className="flex items-center gap-1.5 shrink-0 pl-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                tabIndex={openValue === 'indices' ? 0 : -1}
                className={cn(
                  'h-7 w-7 text-[var(--muted)] hover:text-[var(--text)] transition-opacity duration-200',
                  openValue === 'indices' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                )}
                onClick={() => setSettingOpen(true)}
                aria-label="指数个性化设置"
              >
                <Settings2 className="size-4" strokeWidth={1.8} />
              </Button>
              <button
                type="button"
                className="h-7 w-7 inline-flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--text)] hover:bg-white/[0.06] [data-theme=light]:hover:bg-black/[0.04] active:scale-95 cursor-pointer rounded-md transition-all"
                onClick={() => setOpenValue((v) => (v === 'indices' ? '' : 'indices'))}
                aria-label={openValue === 'indices' ? '收起指数列表' : '展开指数列表'}
              >
                <ChevronRight
                  className={cn('size-4 transition-transform duration-200', openValue === 'indices' ? 'rotate-90' : '')}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
          <AccordionContent className="px-3 pb-4 pt-0">
            <div className="flex flex-wrap w-full min-w-0" style={{ gap: 12 }}>
              {visibleIndices.map((item, i) => (
                <div
                  key={item.code || i}
                  style={{
                    flex: isMobile ? '0 0 calc((100% - 24px) / 3)' : '0 0 calc((100% - 48px) / 5)'
                  }}
                >
                  <IndexCard item={item} />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <MarketSettingModal
        open={settingOpen}
        onClose={() => setSettingOpen(false)}
        indices={indices}
        selectedCodes={selectedCodes}
        onChangeSelected={setSelectedCodes}
        onResetDefault={() => {
          const availableCodes = new Set(indices.map((it) => it.code));
          const defaults = DEFAULT_SELECTED_CODES.filter((c) => availableCodes.has(c));
          setSelectedCodes(defaults.length ? defaults : indices.map((it) => it.code).slice(0, 3));
        }}
      />
    </div>
  );
}
