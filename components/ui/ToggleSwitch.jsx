'use client';

import { cn } from '@/lib/utils';

/** Accessible switch row used for habitat power systems. */
export default function ToggleSwitch({ sys, on, onToggle, className }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border border-white/10 bg-[rgba(10,16,34,0.55)] px-3 py-2.5 text-left transition-all',
        'hover:border-neon/40 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon',
        on ? 'border-mint/40 bg-mint/5' : 'opacity-75',
        sys.critical && 'border-l-[3px] border-l-coral/70',
        className
      )}
    >
      <span aria-hidden className="text-xl">{sys.icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-slate-100">{sys.name}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
          {sys.critical ? (
            <b className="rounded border border-coral/50 bg-coral/15 px-1.5 py-px font-mono text-[9px] tracking-wider text-coral">
              CRITICAL
            </b>
          ) : (
            <b className="rounded border border-white/15 bg-white/5 px-1.5 py-px font-mono text-[9px] tracking-wider text-slate-400">
              NON-CRITICAL
            </b>
          )}
          load {sys.load}
        </span>
      </span>
      <span
        aria-hidden
        className={cn(
          'relative h-[26px] w-[46px] shrink-0 rounded-full border border-white/15 transition-colors duration-200',
          on ? 'bg-gradient-to-r from-emerald-500 to-mint' : 'bg-[#1b2b52]'
        )}
      >
        <i
          className={cn(
            'absolute top-[2px] size-5 rounded-full transition-all duration-200',
            on ? 'left-[22px] bg-[#04281c]' : 'left-[2px] bg-slate-400'
          )}
        />
      </span>
    </button>
  );
}
