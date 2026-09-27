'use client';

import { cn, clamp } from '@/lib/utils';

const TONES = {
  cyan: { bar: 'from-azur to-neon', text: 'text-neon' },
  green: { bar: 'from-emerald-400 to-mint', text: 'text-mint' },
  amber: { bar: 'from-amber-400 to-ambr', text: 'text-ambr' },
  red: { bar: 'from-rose-500 to-coral', text: 'text-coral' },
};

/** Animated resource meter. */
export default function Meter({ label, value, max = 100, unit = '%', tone = 'cyan', sub }) {
  const pct = clamp((value / max) * 100, 0, 100);
  const t = TONES[tone] ?? TONES.cyan;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">{label}</span>
        <span className={cn('font-mono text-sm font-bold', t.text)}>
          {Math.round(value)}
          {unit}
        </span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
        aria-label={label}
      >
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-[width] duration-300', t.bar, pct < 25 && 'animate-pulse')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}
