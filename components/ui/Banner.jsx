'use client';

import { cn } from '@/lib/utils';

const TONES = {
  info: 'border-azur/40 bg-azur/10 text-slate-100',
  good: 'border-mint/40 bg-mint/10 text-slate-100',
  warn: 'border-ambr/50 bg-ambr/10 text-slate-100',
  bad: 'border-coral/50 bg-coral/10 text-slate-100',
};

/** Status banner. */
export default function Banner({ tone = 'info', icon, title, children, className }) {
  return (
    <div
      role="status"
      className={cn('flex items-start gap-3 rounded-xl border px-4 py-3', TONES[tone] ?? TONES.info, className)}
    >
      {icon && <span aria-hidden className="text-lg leading-none">{icon}</span>}
      <div className="min-w-0">
        {title && <strong className="block text-sm font-bold tracking-wide">{title}</strong>}
        {children && <p className="text-[13px] leading-relaxed text-slate-200/90">{children}</p>}
      </div>
    </div>
  );
}
