'use client';

import { chartColors } from '@/lib/theme';

export interface ChartItem {
  label: string;
  value: number;
  color?: string;
}

const defaultBarColor = chartColors.primary;

export function BarChart({
  title,
  data,
  emptyMessage = 'No data yet',
}: {
  title: string;
  data: ChartItem[];
  emptyMessage?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div>
        <h3 className="mb-4 text-sm font-semibold text-ink-soft">{title}</h3>
        <p className="py-8 text-center text-sm text-faint">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-ink-soft">{title}</h3>
      <div className="flex h-48 items-end justify-around gap-2 border-b border-border pb-2">
        {data.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-sm font-bold text-ink">{item.value}</span>
            <div
              className="w-full max-w-[48px] rounded-t-lg transition-all"
              style={{
                height: `${Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0)}%`,
                backgroundColor: item.color || defaultBarColor,
                minHeight: item.value > 0 ? '8px' : '0',
              }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="text-center text-xs text-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HorizontalBarChart({
  title,
  data,
  emptyMessage = 'No data yet',
}: {
  title: string;
  data: ChartItem[];
  emptyMessage?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div>
        <h3 className="mb-4 text-sm font-semibold text-ink-soft">{title}</h3>
        <p className="py-8 text-center text-sm text-faint">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-ink-soft">{title}</h3>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium text-ink-soft">{item.label}</span>
              <span className="font-bold text-ink">{item.value}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: item.color || defaultBarColor,
                  minWidth: item.value > 0 ? '4px' : '0',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({
  title,
  data,
  centerLabel,
  emptyMessage = 'No data yet',
}: {
  title: string;
  data: ChartItem[];
  centerLabel?: string;
  emptyMessage?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div>
        <h3 className="mb-4 text-sm font-semibold text-ink-soft">{title}</h3>
        <p className="py-8 text-center text-sm text-faint">{emptyMessage}</p>
      </div>
    );
  }

  let cumulative = 0;
  const segments = data.map((item) => {
    const start = (cumulative / total) * 100;
    cumulative += item.value;
    const end = (cumulative / total) * 100;
    return { ...item, start, end };
  });

  const gradient = segments
    .map((s) => `${s.color || defaultBarColor} ${s.start}% ${s.end}%`)
    .join(', ');

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-ink-soft">{title}</h3>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-around">
        <div
          className="relative h-36 w-36 shrink-0 rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        >
          <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-surface-elevated">
            <span className="text-2xl font-bold text-ink">{total}</span>
            {centerLabel && <span className="text-xs text-muted">{centerLabel}</span>}
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {data.map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: item.color || defaultBarColor }}
              />
              <span className="text-ink-soft">{item.label}</span>
              <span className="font-bold text-ink">{item.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
