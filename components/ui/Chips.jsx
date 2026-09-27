'use client';

import { cn } from '@/lib/utils';

/** Small status chip. */
export function Pill({ tone = 'cyan', children, className }) {
  const tones = {
    cyan: 'border-neon/40 bg-neon/10 text-neon',
    green: 'border-mint/40 bg-mint/10 text-mint',
    amber: 'border-ambr/40 bg-ambr/10 text-ambr',
    red: 'border-coral/40 bg-coral/10 text-coral',
    gray: 'border-white/15 bg-white/5 text-slate-300',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide',
        tones[tone] ?? tones.cyan,
        className
      )}
    >
      {children}
    </span>
  );
}

/** Capability chip — shows whether a system was carried from Earth. */
export function CapChip({ label, carried, block = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold',
        carried ? 'border-mint/40 bg-mint/10 text-mint' : 'border-coral/40 bg-coral/10 text-coral',
        block && 'w-full justify-start rounded-xl px-3 py-2'
      )}
    >
      {carried ? '✓' : '✕'} {label}: <b>{carried ? 'Carried' : 'Not carried'}</b>
    </span>
  );
}

/** Generic content chip. */
export function Chip({ children, empty = false, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium',
        empty ? 'border-white/15 bg-white/5 text-slate-400' : 'border-neon/25 bg-neon/10 text-slate-100',
        className
      )}
    >
      {children}
    </span>
  );
}
